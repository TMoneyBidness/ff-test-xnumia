import type { Env } from '../lib/env'
import type { CompliancePort } from '../adapters/ports'
import type { OpsAgent, OpsRunResult } from './ops-types'

/**
 * AMLComplianceAgent — sanctions screening, transaction monitoring, and regulatory report generation.
 * Runs on a schedule. Three sequential sub-tasks:
 *   1. Sanctions re-screening of stale counterparties
 *   2. FINTRAC threshold monitoring (LCTR / EFTR)
 *   3. Suspicious activity detection (STR drafts from fraud signals)
 */
export class AMLComplianceAgent implements OpsAgent {
  readonly type = 'aml' as const
  readonly name = 'AMLComplianceAgent'

  constructor(
    private env: Env,
    private compliance: CompliancePort
  ) {}

  async run(): Promise<OpsRunResult> {
    const start = Date.now()
    const actions: string[] = []
    const escalations: string[] = []
    const errors: string[] = []
    let processed = 0

    // ── Task 1: Sanctions re-screening ─────────────────────────────

    try {
      const stale = await this.env.DB.prepare(
        `SELECT id, client_id, name, type FROM counterparties
         WHERE last_screened_at IS NULL
            OR last_screened_at < datetime('now', '-24 hours')`
      )
        .all<{ id: string; client_id: string; name: string; type: string }>()

      const entities = stale.results ?? []

      for (const entity of entities) {
        try {
          const screening = await this.compliance.screenEntity({
            name: entity.name,
            entityType: 'counterparty',
            entityId: entity.id,
          })

          const now = new Date().toISOString()
          const screeningId = crypto.randomUUID()

          // Record screening result
          await this.env.DB.prepare(
            `INSERT INTO sanctions_screenings (id, entity_name, entity_type, entity_id, list_checked, result, match_score, match_details, created_at)
             VALUES (?, ?, 'counterparty', ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              screeningId,
              entity.name,
              entity.id,
              JSON.stringify(screening.listsChecked),
              screening.result,
              screening.matchScore ?? null,
              screening.matchDetails ?? null,
              now
            )
            .run()

          if (screening.result === 'match') {
            // Update counterparty status
            await this.env.DB.prepare(
              `UPDATE counterparties SET sanctions_status = 'match', updated_at = ? WHERE id = ?`
            )
              .bind(now, entity.id)
              .run()

            // Hold all active transactions for this counterparty's client
            const activeTxns = await this.env.DB.prepare(
              `SELECT id FROM transactions
               WHERE client_id = ? AND status NOT IN ('SETTLED', 'FAILED', 'HELD')`
            )
              .bind(entity.client_id)
              .all<{ id: string }>()

            for (const tx of activeTxns.results ?? []) {
              await this.holdTransaction(tx.id, `Sanctions match on counterparty ${entity.id}: ${entity.name}`)
              actions.push(`tx:${tx.id} HELD — sanctions match on counterparty:${entity.id}`)
            }

            escalations.push(`SANCTIONS MATCH: counterparty:${entity.id} (${entity.name})`)
            actions.push(`counterparty:${entity.id} sanctions_status=match`)
          } else if (screening.result === 'partial_match') {
            await this.env.DB.prepare(
              `UPDATE counterparties SET sanctions_status = 'pending_review', updated_at = ? WHERE id = ?`
            )
              .bind(now, entity.id)
              .run()

            // Write amber agent_decisions for review
            await this.env.DB.prepare(
              `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
               VALUES (?, ?, 'aml', 'amber', 'REVIEW', ?, ?, ?, ?)`
            )
              .bind(
                crypto.randomUUID(),
                entity.id,
                `Partial sanctions match for ${entity.name}. Score: ${screening.matchScore}. ${screening.matchDetails ?? ''}`,
                JSON.stringify({ screening, entityId: entity.id }),
                Date.now() - start,
                now
              )
              .run()

            actions.push(`counterparty:${entity.id} sanctions_status=pending_review (score:${screening.matchScore})`)
          } else if (screening.result === 'clear') {
            await this.env.DB.prepare(
              `UPDATE counterparties SET sanctions_status = 'clear', last_screened_at = ?, updated_at = ? WHERE id = ?`
            )
              .bind(now, now, entity.id)
              .run()

            actions.push(`counterparty:${entity.id} screened=clear`)
          }

          processed++
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`CRITICAL sanctions screening failed for counterparty:${entity.id}: ${msg}`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`CRITICAL sanctions batch query failed: ${msg}`)
    }

    // ── Task 2: FINTRAC threshold monitoring ───────────────────────

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      // Recent transactions without a regulatory report
      const unreported = await this.env.DB.prepare(
        `SELECT t.id, t.amount_cents, t.currency_from, t.currency_to, t.type, t.client_id
         FROM transactions t
         LEFT JOIN regulatory_reports rr
           ON rr.transaction_ids LIKE '%' || t.id || '%'
         WHERE t.created_at > ? AND rr.id IS NULL`
      )
        .bind(twentyFourHoursAgo)
        .all<{
          id: string
          amount_cents: number
          currency_from: string
          currency_to: string
          type: string
          client_id: string
        }>()

      const txns = unreported.results ?? []
      const now = new Date().toISOString()

      for (const tx of txns) {
        try {
          // LCTR: >= $10,000 CAD (1_000_000 cents)
          if (tx.amount_cents >= 1_000_000) {
            const reportId = crypto.randomUUID()
            await this.env.DB.prepare(
              `INSERT INTO regulatory_reports (id, report_type, transaction_ids, status, created_at)
               VALUES (?, 'LCTR', ?, 'draft', ?)`
            )
              .bind(reportId, JSON.stringify([tx.id]), now)
              .run()

            actions.push(`report:${reportId} LCTR draft for tx:${tx.id} ($${(tx.amount_cents / 100).toFixed(2)})`)
            processed++
          }

          // EFTR: cross-currency >= $1,000 CAD (100_000 cents)
          if (tx.currency_from !== tx.currency_to && tx.amount_cents >= 100_000) {
            const reportId = crypto.randomUUID()
            await this.env.DB.prepare(
              `INSERT INTO regulatory_reports (id, report_type, transaction_ids, status, created_at)
               VALUES (?, 'EFTR', ?, 'draft', ?)`
            )
              .bind(reportId, JSON.stringify([tx.id]), now)
              .run()

            actions.push(`report:${reportId} EFTR draft for tx:${tx.id} (${tx.currency_from}→${tx.currency_to})`)
            processed++
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`FINTRAC report creation failed for tx:${tx.id}: ${msg}`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`FINTRAC batch query failed: ${msg}`)
    }

    // ── Task 3: Suspicious activity detection (STR) ────────────────

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      // Fraud-flagged decisions in last 24h
      const flagged = await this.env.DB.prepare(
        `SELECT ad.request_id, ad.verdict, ad.reasoning, ad.detail
         FROM agent_decisions ad
         WHERE ad.agent_type = 'fraud'
           AND ad.verdict IN ('amber', 'red')
           AND ad.created_at > ?`
      )
        .bind(twentyFourHoursAgo)
        .all<{ request_id: string; verdict: string; reasoning: string; detail: string | null }>()

      const flaggedDecisions = flagged.results ?? []
      const now = new Date().toISOString()

      for (const decision of flaggedDecisions) {
        try {
          // Check if STR already exists for this transaction
          const existing = await this.env.DB.prepare(
            `SELECT id FROM regulatory_reports
             WHERE report_type = 'STR' AND transaction_ids LIKE '%' || ? || '%'`
          )
            .bind(decision.request_id)
            .first<{ id: string }>()

          if (!existing) {
            const reportId = crypto.randomUUID()
            await this.env.DB.prepare(
              `INSERT INTO regulatory_reports (id, report_type, transaction_ids, status, created_at)
               VALUES (?, 'STR', ?, 'draft', ?)`
            )
              .bind(reportId, JSON.stringify([decision.request_id]), now)
              .run()

            actions.push(`report:${reportId} STR draft for tx:${decision.request_id} (fraud verdict: ${decision.verdict})`)
            processed++
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`STR creation failed for tx:${decision.request_id}: ${msg}`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`STR batch query failed: ${msg}`)
    }

    // ── Write summary agent_decisions ──────────────────────────────

    const screeningsCount = actions.filter((a) => a.includes('screened=') || a.includes('sanctions_status=')).length
    const reportsCount = actions.filter((a) => a.includes('report:')).length
    const now = new Date().toISOString()

    try {
      await this.env.DB.prepare(
        `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
         VALUES (?, ?, 'aml', ?, 'RUN_COMPLETE', ?, ?, ?, ?)`
      )
        .bind(
          crypto.randomUUID(),
          `aml_run_${now}`,
          escalations.length > 0 ? 'red' : errors.length > 0 ? 'amber' : 'green',
          `AML run: ${screeningsCount} screenings, ${reportsCount} reports generated, ${escalations.length} escalations, ${errors.length} errors`,
          JSON.stringify({ actions, escalations, errors }),
          Date.now() - start,
          now
        )
        .run()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Failed to write summary decision: ${msg}`)
    }

    return {
      agentType: 'aml',
      verdict: escalations.length > 0 ? 'escalated' : errors.length > 0 ? 'error' : processed > 0 ? 'action_taken' : 'ok',
      summary: `${screeningsCount} sanctions screenings, ${reportsCount} regulatory reports drafted. ${escalations.length} escalations. ${errors.length} errors.`,
      itemsProcessed: processed,
      actionsPerformed: actions,
      escalations,
      errors,
      durationMs: Date.now() - start,
    }
  }

  /** Send a hold request to the transaction's Durable Object */
  private async holdTransaction(txId: string, reason: string): Promise<void> {
    const doId = this.env.ORCHESTRATOR.idFromName(txId)
    const stub = this.env.ORCHESTRATOR.get(doId)
    await stub.fetch(new Request('https://do/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, agent: 'aml' }),
    }))
  }
}
