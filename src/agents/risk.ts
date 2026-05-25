import type { PipelineAgent, AgentResult, PaymentRequest, Verdict } from './types'

export class RiskAgent implements PipelineAgent {
  readonly type = 'risk' as const
  readonly name = 'Risk Scorer'

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()
    const factors: string[] = []
    let score = 20

    factors.push('Base risk score: 20')

    if (request.amountCents > 5_000_000) {
      score += 25
      factors.push(`+25: High-value transaction (over $50,000 — amount: $${(request.amountCents / 100).toFixed(2)})`)
    } else if (request.amountCents > 1_000_000) {
      score += 15
      factors.push(`+15: Elevated transaction value (over $10,000 — amount: $${(request.amountCents / 100).toFixed(2)})`)
    }

    if (request.clientName.includes('NEW_')) {
      score += 20
      factors.push('+20: First-time counterparty (clientName contains "NEW_")')
    }

    if (request.currencyTo === 'USDT') {
      score += 10
      factors.push('+10: Higher risk stablecoin destination (USDT)')
    }

    if (!request.description || request.description.trim() === '') {
      score += 15
      factors.push('+15: Missing or empty transaction description')
    }

    let verdict: Verdict
    let reasoning: string

    if (score > 75) {
      verdict = 'red'
      reasoning = `High risk score of ${score}/100 — transaction requires manual review before processing. Key factors: ${factors.filter((f) => !f.startsWith('Base')).join('; ')}.`
    } else if (score >= 50) {
      verdict = 'amber'
      reasoning = `Moderate risk score of ${score}/100 — transaction may proceed with enhanced monitoring. Contributing factors: ${factors.filter((f) => !f.startsWith('Base')).join('; ')}.`
    } else {
      verdict = 'green'
      reasoning = `Low risk score of ${score}/100 — transaction within normal risk parameters for client "${request.clientName}".`
    }

    return {
      agentType: this.type,
      verdict,
      action: verdict === 'red' ? 'ESCALATE' : 'CONTINUE',
      reasoning,
      detail: {
        score,
        factors,
      },
      durationMs: Date.now() - start,
    }
  }
}
