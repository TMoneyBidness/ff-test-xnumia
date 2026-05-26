import type { Env } from '../lib/env'
import type { OpsAgent, OpsRunResult } from './ops-types'

/**
 * FraudDetectionAgent — async batch analysis of recent transactions for anomalous patterns.
 * Runs on a schedule, not inline in the payment pipeline.
 * Creates fraud cases and holds when risk thresholds are exceeded.
 */
export class FraudDetectionAgent implements OpsAgent {
  readonly type = 'fraud' as const
  readonly name = 'FraudDetectionAgent'

  constructor(private env: Env) {}

  async run(): Promise<OpsRunResult> {
    const start = Date.now()
    const actions: string[] = []
    const escalations: string[] = []
    const errors: string[] = []
    let processed = 0

    try {
      // 1. Get transactions from last hour that have NOT been fraud-checked
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const unchecked = await this.env.DB.prepare(
        `SELECT t.id, t.client_id, t.type, t.amount_cents, t.currency_from, t.currency_to, t.created_at
         FROM transactions t
         LEFT JOIN agent_decisions ad
           ON ad.request_id = t.id AND ad.agent_type = 'fraud'
         WHERE t.created_at > ? AND ad.id IS NULL`
      )
        .bind(oneHourAgo)
        .all<{
          id: string
          client_id: string
          type: string
          amount_cents: number
          currency_from: string
          currency_to: string
          created_at: string
        }>()

      const txns = unchecked.results ?? []

      for (const tx of txns) {
        try {
          const signals: string[] = []
          let score = 0

          // 2a. Velocity — transactions from same client in last 1 hour and 24 hours
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

          const [hourlyResult, dailyResult] = await Promise.all([
            this.env.DB.prepare(
              `SELECT COUNT(*) as cnt FROM transactions WHERE client_id = ? AND created_at > ?`
            )
              .bind(tx.client_id, oneHourAgo)
              .first<{ cnt: number }>(),
            this.env.DB.prepare(
              `SELECT COUNT(*) as cnt FROM transactions WHERE client_id = ? AND created_at > ?`
            )
              .bind(tx.client_id, twentyFourHoursAgo)
              .first<{ cnt: number }>(),
          ])

          const hourlyVelocity = hourlyResult?.cnt ?? 0
          const dailyVelocity = dailyResult?.cnt ?? 0

          if (hourlyVelocity > 5) {
            score += 25
            signals.push(`high_hourly_velocity:${hourlyVelocity}`)
          }
          if (dailyVelocity > 20) {
            score += 15
            signals.push(`high_daily_velocity:${dailyVelocity}`)
          }

          // 2b. Amount anomaly — current tx vs average for this client
          const avgResult = await this.env.DB.prepare(
            `SELECT AVG(amount_cents) as avg_amount FROM transactions WHERE client_id = ?`
          )
            .bind(tx.client_id)
            .first<{ avg_amount: number | null }>()

          const avgAmount = avgResult?.avg_amount ?? 0
          if (avgAmount > 0 && tx.amount_cents > avgAmount * 3) {
            score += 20
            signals.push(`amount_anomaly:${tx.amount_cents}_vs_avg_${Math.round(avgAmount)}`)
          }

          // 2c. Structuring detection — transactions between $90-$100 in last 24h
          const structuringResult = await this.env.DB.prepare(
            `SELECT COUNT(*) as cnt FROM transactions
             WHERE client_id = ? AND created_at > ?
             AND amount_cents >= 9000 AND amount_cents <= 10000`
          )
            .bind(tx.client_id, twentyFourHoursAgo)
            .first<{ cnt: number }>()

          if ((structuringResult?.cnt ?? 0) >= 2) {
            score += 30
            signals.push(`structuring:${structuringResult!.cnt}_txns_near_threshold`)
          }

          // 2d. Rapid movement — both AR and AP within 1 hour (pass-through pattern)
          const rapidResult = await this.env.DB.prepare(
            `SELECT COUNT(DISTINCT type) as type_count FROM transactions
             WHERE client_id = ? AND created_at > ? AND type IN ('AR', 'AP')`
          )
            .bind(tx.client_id, oneHourAgo)
            .first<{ type_count: number }>()

          if ((rapidResult?.type_count ?? 0) >= 2) {
            score += 20
            signals.push('rapid_movement:ar_and_ap_within_1h')
          }

          // Cap score at 100
          score = Math.min(score, 100)

          // 3. Actions based on score
          const now = new Date().toISOString()
          const decisionId = crypto.randomUUID()

          if (score <= 30) {
            // Pass — green
            await this.env.DB.prepare(
              `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
               VALUES (?, ?, 'fraud', 'green', 'PASS', ?, ?, ?, ?)`
            )
              .bind(
                decisionId,
                tx.id,
                signals.length ? `Score ${score}: ${signals.join(', ')}` : `Score ${score}: no risk signals`,
                JSON.stringify({ score, signals }),
                Date.now() - start,
                now
              )
              .run()

            actions.push(`tx:${tx.id} score=${score} verdict=green`)
          } else if (score <= 60) {
            // Enhanced monitoring — amber
            await this.env.DB.prepare(
              `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
               VALUES (?, ?, 'fraud', 'amber', 'MONITOR', ?, ?, ?, ?)`
            )
              .bind(
                decisionId,
                tx.id,
                `Score ${score}: enhanced monitoring. ${signals.join(', ')}`,
                JSON.stringify({ score, signals }),
                Date.now() - start,
                now
              )
              .run()

            actions.push(`tx:${tx.id} score=${score} verdict=amber/monitor`)
          } else if (score <= 80) {
            // HOLD transaction + open fraud case
            await this.holdTransaction(tx.id, `Fraud score ${score}: ${signals.join(', ')}`)

            await this.env.DB.prepare(
              `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
               VALUES (?, ?, 'fraud', 'amber', 'HOLD', ?, ?, ?, ?)`
            )
              .bind(
                decisionId,
                tx.id,
                `Score ${score}: transaction held. ${signals.join(', ')}`,
                JSON.stringify({ score, signals }),
                Date.now() - start,
                now
              )
              .run()

            const caseId = crypto.randomUUID()
            await this.env.DB.prepare(
              `INSERT INTO fraud_cases (id, transaction_ids, risk_score, signals, status, created_at)
               VALUES (?, ?, ?, ?, 'open', ?)`
            )
              .bind(caseId, JSON.stringify([tx.id]), score, JSON.stringify(signals), now)
              .run()

            actions.push(`tx:${tx.id} score=${score} HELD, case:${caseId} opened`)
            escalations.push(`fraud_case:${caseId} tx:${tx.id} score=${score}`)
          } else {
            // Critical — HOLD + investigating
            await this.holdTransaction(tx.id, `Critical fraud score ${score}: ${signals.join(', ')}`)

            await this.env.DB.prepare(
              `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
               VALUES (?, ?, 'fraud', 'red', 'HOLD', ?, ?, ?, ?)`
            )
              .bind(
                decisionId,
                tx.id,
                `Score ${score}: critical, transaction held, investigation started. ${signals.join(', ')}`,
                JSON.stringify({ score, signals }),
                Date.now() - start,
                now
              )
              .run()

            const caseId = crypto.randomUUID()
            await this.env.DB.prepare(
              `INSERT INTO fraud_cases (id, transaction_ids, risk_score, signals, status, created_at)
               VALUES (?, ?, ?, ?, 'investigating', ?)`
            )
              .bind(caseId, JSON.stringify([tx.id]), score, JSON.stringify(signals), now)
              .run()

            actions.push(`tx:${tx.id} score=${score} HELD, case:${caseId} investigating`)
            escalations.push(`CRITICAL fraud_case:${caseId} tx:${tx.id} score=${score}`)
          }

          processed++
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`tx:${tx.id} error: ${msg}`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`batch query failed: ${msg}`)
    }

    const holdsCreated = actions.filter((a) => a.includes('HELD')).length
    const casesOpened = actions.filter((a) => a.includes('case:')).length

    return {
      agentType: 'fraud',
      verdict: escalations.length > 0 ? 'escalated' : errors.length > 0 ? 'error' : processed > 0 ? 'action_taken' : 'ok',
      summary: `Processed ${processed} transactions. ${holdsCreated} held, ${casesOpened} cases opened. ${errors.length} errors.`,
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
      body: JSON.stringify({ reason, agent: 'fraud' }),
    }))
  }
}
