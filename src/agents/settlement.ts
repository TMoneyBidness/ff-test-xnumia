import type { Env } from '../lib/env'
import type { OpsAgent, OpsRunResult } from './ops-types'
import type { BankPort, ExchangePort, PSPPort } from '../adapters/ports'

/**
 * SettlementAgent — polls for pending settlements, confirms finality on both
 * rails (fiat + stablecoin), and advances the Durable Object state machine.
 *
 * Runs on a schedule (e.g. every 5 minutes). Processes all transactions in
 * PENDING_SETTLEMENT status. Both bank AND exchange must confirm completion
 * before a transaction is marked SETTLED (dual-confirmation rule).
 */
export class SettlementAgent implements OpsAgent {
  readonly type = 'settlement' as const
  readonly name = 'SettlementAgent'

  /** Stale threshold — 2 hours in milliseconds */
  private static readonly STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000

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

    // ── 1. Fetch all pending settlements ────────────────────────
    const pending = await this.env.DB.prepare(
      `SELECT id, client_id, amount_cents, currency_from, currency_to, created_at, updated_at
       FROM transactions
       WHERE status = 'PENDING_SETTLEMENT'`
    ).all<{
      id: string
      client_id: string
      amount_cents: number
      currency_from: string
      currency_to: string
      created_at: string
      updated_at: string
    }>()

    const rows = pending.results ?? []
    console.log(`[SettlementAgent] Found ${rows.length} pending settlement(s)`)

    // ── 2. Process each transaction ─────────────────────────────
    for (const tx of rows) {
      try {
        processed++

        // 2a. Fetch associated ledger entries
        const ledgerRows = await this.env.DB.prepare(
          `SELECT id, rail, direction, amount_cents, currency
           FROM ledger_entries
           WHERE transaction_id = ?`
        ).bind(tx.id).all()

        // 2b. Retrieve the execute agent_decisions to get transferId and conversionId
        const execDecision = await this.env.DB.prepare(
          `SELECT detail FROM agent_decisions
           WHERE request_id = ? AND agent_type = 'execute'
           ORDER BY created_at DESC LIMIT 1`
        ).bind(tx.id).first<{ detail: string }>()

        if (!execDecision?.detail) {
          errors.push(`${tx.id}: no execute decision found — cannot check finality`)
          continue
        }

        let detail: { transferId?: string; conversionId?: string; pspPaymentId?: string }
        try {
          detail = JSON.parse(execDecision.detail)
        } catch {
          errors.push(`${tx.id}: could not parse execute decision detail`)
          continue
        }

        if (!detail.transferId || !detail.conversionId) {
          errors.push(`${tx.id}: execute decision missing transferId or conversionId`)
          continue
        }

        // 2c. Check bank-side finality
        const bankStatus = await this.bank.getTransferStatus(detail.transferId)
        const bankDone = bankStatus.status === 'completed'
        const bankFailed = bankStatus.status === 'failed'

        // 2d. Check exchange-side finality
        const exchangeStatus = await this.exchange.getConversionStatus(detail.conversionId)
        const exchangeDone = exchangeStatus.status === 'completed'
        const exchangeFailed = exchangeStatus.status === 'failed'

        const now = new Date().toISOString()

        // 2g. Check for failure on either side
        if (bankFailed || exchangeFailed) {
          const failureReasons: string[] = []
          if (bankFailed) failureReasons.push(`bank: ${bankStatus.failureReason ?? 'unknown'}`)
          if (exchangeFailed) failureReasons.push(`exchange: ${exchangeStatus.failureReason ?? 'unknown'}`)

          await this.env.DB.prepare(
            `UPDATE transactions SET status = 'FAILED', updated_at = ? WHERE id = ?`
          ).bind(now, tx.id).run()

          // Advance DO to FAILED
          await this.advanceDO(tx.id, 'FAILED')

          // Write red agent_decisions
          await this.writeDecision(tx.id, 'red', 'FAIL', `Settlement failed: ${failureReasons.join('; ')}`, {
            bankStatus: bankStatus.status,
            exchangeStatus: exchangeStatus.status,
            failureReasons,
          })

          actions.push(`${tx.id}: marked FAILED (${failureReasons.join('; ')})`)
          continue
        }

        // 2e. Dual confirmation — both must be completed
        if (bankDone && exchangeDone) {
          // Update transaction to SETTLED
          await this.env.DB.prepare(
            `UPDATE transactions SET status = 'SETTLED', updated_at = ? WHERE id = ?`
          ).bind(now, tx.id).run()

          // Mark all associated ledger entries as reconciled
          await this.env.DB.prepare(
            `UPDATE ledger_entries SET reconciled = 1 WHERE transaction_id = ?`
          ).bind(tx.id).run()

          // Advance DO state machine
          await this.advanceDO(tx.id, 'SETTLED')

          // Write green agent_decisions
          await this.writeDecision(tx.id, 'green', 'SETTLED', 'Dual confirmation received — both bank and exchange settled', {
            bankStatus: bankStatus.status,
            bankSettledAt: bankStatus.settledAt,
            exchangeStatus: exchangeStatus.status,
            exchangeSettledAt: exchangeStatus.settledAt,
            ledgerEntriesReconciled: (ledgerRows.results ?? []).length,
          })

          actions.push(`${tx.id}: settled (bank + exchange confirmed)`)
          continue
        }

        // 2f. Partial settlement — only one side confirmed, skip for now
        console.log(
          `[SettlementAgent] ${tx.id}: partial settlement — bank=${bankStatus.status}, exchange=${exchangeStatus.status}. Will re-check next run.`
        )

        // ── 3. Check for stale settlements ──────────────────────
        const createdAt = new Date(tx.created_at).getTime()
        const ageMs = Date.now() - createdAt
        if (ageMs > SettlementAgent.STALE_THRESHOLD_MS) {
          await this.writeDecision(tx.id, 'amber', 'STALE_SETTLEMENT', `Transaction pending settlement for ${Math.round(ageMs / 60_000)} minutes — exceeds 2-hour threshold`, {
            bankStatus: bankStatus.status,
            exchangeStatus: exchangeStatus.status,
            ageMinutes: Math.round(ageMs / 60_000),
          })

          escalations.push(`${tx.id}: stale settlement (${Math.round(ageMs / 60_000)}min)`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${tx.id}: ${msg}`)
        console.error(`[SettlementAgent] Error processing ${tx.id}:`, msg)
      }
    }

    // ── 4. Build result ─────────────────────────────────────────
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
      summary: `Processed ${processed} pending settlement(s): ${actions.length} settled/failed, ${escalations.length} stale, ${errors.length} error(s)`,
      itemsProcessed: processed,
      actionsPerformed: actions,
      escalations,
      errors,
      durationMs: Date.now() - start,
    }
  }

  // ── Helpers ───────────────────────────────────────────────────

  private async advanceDO(txId: string, targetState: string): Promise<void> {
    try {
      const doId = this.env.ORCHESTRATOR.idFromName(txId)
      const stub = this.env.ORCHESTRATOR.get(doId)
      await stub.fetch(new Request('http://do/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState }),
      }))
    } catch (err) {
      console.error(`[SettlementAgent] Failed to advance DO for ${txId}:`, err instanceof Error ? err.message : String(err))
    }
  }

  private async writeDecision(
    requestId: string,
    verdict: 'green' | 'amber' | 'red',
    action: string,
    reasoning: string,
    detail: Record<string, unknown>,
  ): Promise<void> {
    const id = `settlement-${requestId}-${Date.now()}`
    try {
      await this.env.DB.prepare(
        `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
         VALUES (?, ?, 'settlement', ?, ?, ?, ?, 0, ?)`
      )
        .bind(id, requestId, verdict, action, reasoning, JSON.stringify(detail), new Date().toISOString())
        .run()
    } catch (err) {
      console.error(`[SettlementAgent] Failed to write decision for ${requestId}:`, err instanceof Error ? err.message : String(err))
    }
  }
}
