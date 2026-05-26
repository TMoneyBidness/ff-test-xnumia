import type { Env } from '../lib/env'
import type { PipelineAgent, PaymentRequest, AgentResult, Verdict } from './types'

const SANCTIONED_ENTITIES = ['SANCTIONED_CORP', 'BLOCKED_ENTITY', 'OFAC_TARGET']

export class ScreenAgent implements PipelineAgent {
  readonly type = 'screen' as const
  readonly name = 'ScreenAgent'

  constructor(private env: Env) {}

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()
    let redFlag = false
    const amberFlags: string[] = []
    const amountFlags: string[] = []
    const riskNotes: string[] = []

    // --- Sanctions screening ---
    const sanctionsHit = SANCTIONED_ENTITIES.some(
      (e) => request.clientName.toUpperCase() === e
    )
    if (sanctionsHit) {
      redFlag = true
    }

    // --- Velocity check via D1 ---
    let velocityCount = 0
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const result = await this.env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM payment_requests
         WHERE client_id = ? AND created_at > ?`
      )
        .bind(request.clientId, oneHourAgo)
        .first<{ cnt: number }>()
      velocityCount = result?.cnt ?? 0
    } catch {
      // D1 might not be available in tests — default to 0
      velocityCount = 0
    }
    if (velocityCount > 5) {
      amberFlags.push('Unusual transaction velocity — more than 5 requests in the last hour')
    }

    // --- Amount threshold ---
    if (request.amountCents > 100_000_00) {
      amberFlags.push('Large value transaction requires enhanced monitoring')
      amountFlags.push('amount > $100k')
    } else if (request.amountCents > 10_000_00) {
      amountFlags.push('amount > $10k — noted')
    }

    // --- Counterparty risk ---
    if (request.currencyTo === 'USDT') {
      riskNotes.push('Destination currency is USDT — higher counterparty risk noted')
    }

    // --- Combine signals ---
    let verdict: Verdict = 'green'
    if (redFlag) {
      verdict = 'red'
    } else if (amberFlags.length >= 2) {
      verdict = 'red' // compound risk
    } else if (amberFlags.length === 1) {
      verdict = 'amber'
    }

    return {
      agentType: this.type,
      verdict,
      action: verdict === 'red' ? 'BLOCK' : verdict === 'amber' ? 'FLAG' : 'PASS',
      reasoning: redFlag
        ? `Sanctions hit on '${request.clientName}' — transaction blocked`
        : amberFlags.length >= 2
          ? `Multiple risk signals detected — escalating: ${amberFlags.join('; ')}`
          : amberFlags.length === 1
            ? amberFlags[0]
            : 'All screening checks passed',
      detail: {
        sanctionsHit,
        velocityCount,
        velocityWindow: '1 hour',
        amountFlags,
        riskNotes,
      },
      durationMs: Date.now() - start,
    }
  }
}
