import type { PipelineAgent, AgentResult, PaymentRequest, Verdict } from './types'
import type { Env } from '../lib/env'

export class ReconAgent implements PipelineAgent {
  readonly type = 'recon' as const
  readonly name = 'Reconciliation Checker'

  constructor(private readonly env: Env) {}

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { results } = await this.env.DB.prepare(
      `SELECT id FROM payment_requests
       WHERE client_id = ?
         AND amount_cents = ?
         AND created_at > ?
         AND status != 'REJECTED'
         AND id != ?
       ORDER BY created_at DESC`,
    )
      .bind(request.clientId, request.amountCents, twentyFourHoursAgo, request.id)
      .all<{ id: string }>()

    const duplicateCount = results.length
    const matchingIds = results.map((r) => r.id)

    let verdict: Verdict
    let reasoning: string

    if (duplicateCount >= 2) {
      verdict = 'red'
      reasoning = `Likely duplicate detected: found ${duplicateCount} matching payment requests from the same client (${request.clientId}) for the same amount ($${(request.amountCents / 100).toFixed(2)}) in the last 24 hours. Matching IDs: ${matchingIds.join(', ')}.`
    } else if (duplicateCount === 1) {
      verdict = 'amber'
      reasoning = `Possible duplicate: found 1 similar payment request from client ${request.clientId} for $${(request.amountCents / 100).toFixed(2)} in the last 24 hours (ID: ${matchingIds[0]}). May be intentional — flagging for review.`
    } else {
      verdict = 'green'
      reasoning = `No duplicate payment requests found for client ${request.clientId} with amount $${(request.amountCents / 100).toFixed(2)} in the last 24 hours.`
    }

    return {
      agentType: this.type,
      verdict,
      action: verdict === 'red' ? 'ESCALATE' : 'CONTINUE',
      reasoning,
      detail: {
        duplicateCount,
        matchingIds,
      },
      durationMs: Date.now() - start,
    }
  }
}
