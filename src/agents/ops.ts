import type { Env } from '../lib/env'
import type { OpsAgent, OpsRunResult } from './ops-types'
import type { BankPort, ExchangePort, PSPPort } from '../adapters/ports'

/**
 * PaymentsOpsAgent — handles exceptions, retries stuck transactions,
 * processes DLQ messages, and creates ops tickets.
 *
 * Three sub-tasks run in sequence:
 *   1. Stuck transaction detection
 *   2. Auto-retry logic for open ops_cases
 *   3. Stale case cleanup (auto-close after 7 days)
 */
export class PaymentsOpsAgent implements OpsAgent {
  readonly type = 'ops' as const
  readonly name = 'PaymentsOpsAgent'

  constructor(
    private env: Env,
    private bank: BankPort,
    private exchange: ExchangePort,
    private psp: PSPPort,
  ) {}

  async run(): Promise<OpsRunResult> {
    const start = Date.now()
    const actions: string[] = []
    const escalations: string[] = []
    const errors: string[] = []
    let processed = 0

    // ── Task 1: Stuck transaction detection ────────────────────
    try {
      const stuckResult = await this.detectStuckTransactions()
      processed += stuckResult.found
      actions.push(...stuckResult.actions)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`stuck-detection: ${msg}`)
      console.error(`[PaymentsOpsAgent] Stuck detection failed:`, msg)
    }

    // ── Task 2: Auto-retry logic ───────────────────────────────
    try {
      const retryResult = await this.autoRetryOpenCases()
      processed += retryResult.attempted
      actions.push(...retryResult.actions)
      escalations.push(...retryResult.escalations)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`auto-retry: ${msg}`)
      console.error(`[PaymentsOpsAgent] Auto-retry failed:`, msg)
    }

    // ── Task 3: Stale case cleanup ─────────────────────────────
    try {
      const cleanupResult = await this.cleanupStaleCases()
      processed += cleanupResult.closed
      actions.push(...cleanupResult.actions)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`stale-cleanup: ${msg}`)
      console.error(`[PaymentsOpsAgent] Stale cleanup failed:`, msg)
    }

    // ── Build result ───────────────────────────────────────────
    const verdict = errors.length > 0
      ? 'error'
      : escalations.length > 0
        ? 'escalated'
        : actions.length > 0
          ? 'action_taken'
          : 'ok'

    return {
      agentType: this.type,
      verdict,
      summary: `Processed ${processed} item(s): ${actions.length} action(s), ${escalations.length} escalation(s), ${errors.length} error(s)`,
      itemsProcessed: processed,
      actionsPerformed: actions,
      escalations,
      errors,
      durationMs: Date.now() - start,
    }
  }

  // ── Task 1: Stuck transaction detection ────────────────────────

  private async detectStuckTransactions(): Promise<{ found: number; actions: string[] }> {
    const actions: string[] = []

    // Three stuck-state queries with different thresholds
    const stuckQueries = [
      {
        status: 'INITIATED',
        threshold: '-10 minutes',
        exceptionType: 'STUCK_INITIATED',
      },
      {
        status: 'PENDING_PSP',
        threshold: '-1 hour',
        exceptionType: 'STUCK_PENDING_PSP',
      },
      {
        status: 'PENDING_SETTLEMENT',
        threshold: '-2 hours',
        exceptionType: 'STUCK_PENDING_SETTLEMENT',
      },
    ] as const

    let found = 0

    for (const query of stuckQueries) {
      const stuck = await this.env.DB.prepare(
        `SELECT id FROM transactions
         WHERE status = ? AND updated_at < datetime('now', ?)`,
      ).bind(query.status, query.threshold).all<{ id: string }>()

      const rows = stuck.results ?? []

      for (const tx of rows) {
        found++

        // Check if an ops_cases row already exists for this transaction
        const existing = await this.env.DB.prepare(
          `SELECT id FROM ops_cases
           WHERE transaction_id = ? AND exception_type = ? AND status IN ('open', 'retrying')`,
        ).bind(tx.id, query.exceptionType).first<{ id: string }>()

        if (existing) {
          continue // already tracked
        }

        // Create ops_cases row
        const caseId = `ops-${tx.id}-${Date.now()}`
        const now = new Date().toISOString()

        await this.env.DB.prepare(
          `INSERT INTO ops_cases (id, transaction_id, exception_type, retry_count, max_retries, status, created_at)
           VALUES (?, ?, ?, 0, 3, 'open', ?)`,
        ).bind(caseId, tx.id, query.exceptionType, now).run()

        // Write agent_decisions with amber verdict
        await this.writeDecision(
          tx.id,
          'amber',
          'STUCK_DETECTED',
          `Transaction stuck in ${query.status} beyond threshold (${query.threshold})`,
          { exceptionType: query.exceptionType, caseId },
        )

        actions.push(`${tx.id}: created ops case ${query.exceptionType}`)
      }
    }

    console.log(`[PaymentsOpsAgent] Stuck detection: found ${found}, created ${actions.length} new case(s)`)
    return { found, actions }
  }

  // ── Task 2: Auto-retry open cases ─────────────────────────────

  private async autoRetryOpenCases(): Promise<{
    attempted: number
    actions: string[]
    escalations: string[]
  }> {
    const actions: string[] = []
    const escalations: string[] = []

    const openCases = await this.env.DB.prepare(
      `SELECT id, transaction_id, exception_type, retry_count, max_retries
       FROM ops_cases
       WHERE status IN ('open', 'retrying') AND retry_count < max_retries`,
    ).all<{
      id: string
      transaction_id: string
      exception_type: string
      retry_count: number
      max_retries: number
    }>()

    const rows = openCases.results ?? []
    let attempted = 0

    for (const opsCase of rows) {
      attempted++
      const now = new Date().toISOString()

      try {
        let resolved = false
        let failed = false
        let failureDetail = ''

        switch (opsCase.exception_type) {
          case 'STUCK_PENDING_PSP': {
            // Check if PSP payment has now completed
            const execDetail = await this.getExecDetail(opsCase.transaction_id)
            if (!execDetail?.pspPaymentId) {
              console.warn(`[PaymentsOpsAgent] No pspPaymentId for ${opsCase.transaction_id}`)
              break
            }

            const pspStatus = await this.psp.getPaymentStatus(execDetail.pspPaymentId)

            if (pspStatus.status === 'completed') {
              // Advance DO and close case
              await this.advanceDO(opsCase.transaction_id, 'PENDING_SETTLEMENT')
              await this.env.DB.prepare(
                `UPDATE transactions SET status = 'PENDING_SETTLEMENT', updated_at = ? WHERE id = ?`,
              ).bind(now, opsCase.transaction_id).run()
              resolved = true
            } else if (pspStatus.status === 'failed') {
              failed = true
              failureDetail = pspStatus.failureReason ?? 'PSP payment failed'
            }
            // Still pending — fall through to increment retry_count
            break
          }

          case 'STUCK_PENDING_SETTLEMENT': {
            const execDetail = await this.getExecDetail(opsCase.transaction_id)
            if (!execDetail?.transferId || !execDetail?.conversionId) {
              console.warn(`[PaymentsOpsAgent] Missing transferId/conversionId for ${opsCase.transaction_id}`)
              break
            }

            const bankStatus = await this.bank.getTransferStatus(execDetail.transferId)
            const exchangeStatus = await this.exchange.getConversionStatus(execDetail.conversionId)

            if (bankStatus.status === 'completed' && exchangeStatus.status === 'completed') {
              // Both settled — advance to SETTLED
              await this.advanceDO(opsCase.transaction_id, 'SETTLED')
              await this.env.DB.prepare(
                `UPDATE transactions SET status = 'SETTLED', updated_at = ? WHERE id = ?`,
              ).bind(now, opsCase.transaction_id).run()
              resolved = true
            } else if (bankStatus.status === 'failed' || exchangeStatus.status === 'failed') {
              // One side failed — advance to FAILED
              await this.advanceDO(opsCase.transaction_id, 'FAILED')
              await this.env.DB.prepare(
                `UPDATE transactions SET status = 'FAILED', updated_at = ? WHERE id = ?`,
              ).bind(now, opsCase.transaction_id).run()
              failed = true
              const reasons: string[] = []
              if (bankStatus.status === 'failed') reasons.push(`bank: ${bankStatus.failureReason ?? 'unknown'}`)
              if (exchangeStatus.status === 'failed') reasons.push(`exchange: ${exchangeStatus.failureReason ?? 'unknown'}`)
              failureDetail = reasons.join('; ')
            }
            // Partial — fall through to increment retry_count
            break
          }

          case 'STUCK_INITIATED': {
            // Retry the transition by poking the DO
            await this.advanceDO(opsCase.transaction_id, undefined)
            // We don't know if it succeeded until the next run checks the status
            break
          }
        }

        if (resolved) {
          await this.env.DB.prepare(
            `UPDATE ops_cases SET status = 'resolved', resolution = 'auto-resolved by retry', resolved_at = ? WHERE id = ?`,
          ).bind(now, opsCase.id).run()

          await this.writeDecision(
            opsCase.transaction_id,
            'green',
            'CASE_RESOLVED',
            `Ops case ${opsCase.exception_type} resolved after ${opsCase.retry_count + 1} attempt(s)`,
            { caseId: opsCase.id, exceptionType: opsCase.exception_type },
          )

          actions.push(`${opsCase.transaction_id}: case resolved (${opsCase.exception_type})`)
          continue
        }

        if (failed) {
          await this.env.DB.prepare(
            `UPDATE ops_cases SET status = 'escalated', resolution = ? WHERE id = ?`,
          ).bind(`terminal failure: ${failureDetail}`, opsCase.id).run()

          await this.writeDecision(
            opsCase.transaction_id,
            'red',
            'CASE_ESCALATED',
            `Ops case ${opsCase.exception_type} escalated — terminal failure: ${failureDetail}`,
            { caseId: opsCase.id, exceptionType: opsCase.exception_type, failureDetail },
          )

          escalations.push(`${opsCase.transaction_id}: escalated (${opsCase.exception_type} — ${failureDetail})`)
          continue
        }

        // Neither resolved nor failed — increment retry_count
        const newRetryCount = opsCase.retry_count + 1

        if (newRetryCount >= opsCase.max_retries) {
          // Max retries reached — escalate
          await this.env.DB.prepare(
            `UPDATE ops_cases SET status = 'escalated', retry_count = ?, resolution = 'max retries exhausted' WHERE id = ?`,
          ).bind(newRetryCount, opsCase.id).run()

          await this.writeDecision(
            opsCase.transaction_id,
            'red',
            'CASE_ESCALATED',
            `Ops case ${opsCase.exception_type} escalated after ${newRetryCount} retries — max retries exhausted`,
            { caseId: opsCase.id, exceptionType: opsCase.exception_type, retryCount: newRetryCount },
          )

          escalations.push(`${opsCase.transaction_id}: escalated after ${newRetryCount} retries (${opsCase.exception_type})`)
        } else {
          // Increment and keep open
          await this.env.DB.prepare(
            `UPDATE ops_cases SET status = 'retrying', retry_count = ? WHERE id = ?`,
          ).bind(newRetryCount, opsCase.id).run()

          actions.push(`${opsCase.transaction_id}: retry ${newRetryCount}/${opsCase.max_retries} (${opsCase.exception_type})`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[PaymentsOpsAgent] Retry failed for case ${opsCase.id}:`, msg)
        // Increment retry count even on error so we don't loop forever
        await this.env.DB.prepare(
          `UPDATE ops_cases SET retry_count = retry_count + 1 WHERE id = ?`,
        ).bind(opsCase.id).run().catch(() => {/* best effort */})
        actions.push(`${opsCase.transaction_id}: retry error (${msg})`)
      }
    }

    console.log(`[PaymentsOpsAgent] Auto-retry: attempted ${attempted}, resolved ${actions.filter(a => a.includes('resolved')).length}, escalated ${escalations.length}`)
    return { attempted, actions, escalations }
  }

  // ── Task 3: Stale case cleanup ────────────────────────────────

  private async cleanupStaleCases(): Promise<{ closed: number; actions: string[] }> {
    const actions: string[] = []
    const now = new Date().toISOString()

    const staleCases = await this.env.DB.prepare(
      `SELECT id, transaction_id, exception_type
       FROM ops_cases
       WHERE status = 'open' AND created_at < datetime('now', '-7 days')`,
    ).all<{ id: string; transaction_id: string; exception_type: string }>()

    const rows = staleCases.results ?? []

    for (const staleCase of rows) {
      await this.env.DB.prepare(
        `UPDATE ops_cases SET status = 'closed', resolution = 'auto-closed after 7 days', resolved_at = ? WHERE id = ?`,
      ).bind(now, staleCase.id).run()

      await this.writeDecision(
        staleCase.transaction_id,
        'amber',
        'CASE_AUTO_CLOSED',
        `Ops case ${staleCase.exception_type} auto-closed after 7 days without resolution`,
        { caseId: staleCase.id, exceptionType: staleCase.exception_type },
      )

      actions.push(`${staleCase.transaction_id}: auto-closed stale case (${staleCase.exception_type})`)
    }

    console.log(`[PaymentsOpsAgent] Stale cleanup: closed ${rows.length} case(s)`)
    return { closed: rows.length, actions }
  }

  // ── Helpers ───────────────────────────────────────────────────

  /** Retrieve the execute agent_decisions detail to get external IDs */
  private async getExecDetail(txId: string): Promise<{
    transferId?: string
    conversionId?: string
    pspPaymentId?: string
  } | null> {
    const row = await this.env.DB.prepare(
      `SELECT detail FROM agent_decisions
       WHERE request_id = ? AND agent_type = 'execute'
       ORDER BY created_at DESC LIMIT 1`,
    ).bind(txId).first<{ detail: string }>()

    if (!row?.detail) return null

    try {
      return JSON.parse(row.detail)
    } catch {
      return null
    }
  }

  private async advanceDO(txId: string, targetState: string | undefined): Promise<void> {
    try {
      const doId = this.env.ORCHESTRATOR.idFromName(txId)
      const stub = this.env.ORCHESTRATOR.get(doId)
      await stub.fetch(new Request('http://do/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState, reason: 'PaymentsOpsAgent retry' }),
      }))
    } catch (err) {
      console.error(`[PaymentsOpsAgent] Failed to advance DO for ${txId}:`, err instanceof Error ? err.message : String(err))
    }
  }

  private async writeDecision(
    requestId: string,
    verdict: 'green' | 'amber' | 'red',
    action: string,
    reasoning: string,
    detail: Record<string, unknown>,
  ): Promise<void> {
    const id = `ops-${requestId}-${Date.now()}`
    try {
      await this.env.DB.prepare(
        `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
         VALUES (?, ?, 'ops', ?, ?, ?, ?, 0, ?)`,
      )
        .bind(id, requestId, verdict, action, reasoning, JSON.stringify(detail), new Date().toISOString())
        .run()
    } catch (err) {
      console.error(`[PaymentsOpsAgent] Failed to write decision for ${requestId}:`, err instanceof Error ? err.message : String(err))
    }
  }
}
