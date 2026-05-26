import type { PipelineAgent, PaymentRequest, AgentResult } from './types'

const RATES: Record<string, number> = {
  'CAD-USDC': 0.73,
  'USD-USDC': 1.00,
  'EUR-USDC': 1.08,
  'GBP-USDC': 1.27,
  'USDC-CAD': 1.37,
  'USDC-USD': 1.00,
  'USDC-EUR': 0.93,
  'USDC-GBP': 0.79,
}

export class QuoteAgent implements PipelineAgent {
  readonly type = 'quote' as const
  readonly name = 'QuoteAgent'

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()
    const pair = `${request.currencyFrom}-${request.currencyTo}`
    const rate = RATES[pair]

    if (rate === undefined) {
      return {
        agentType: this.type,
        verdict: 'red',
        action: 'REJECT',
        reasoning: `Currency pair '${pair}' is not supported`,
        detail: { pair, supportedPairs: Object.keys(RATES) },
        durationMs: Date.now() - start,
      }
    }

    const outputAmountCents = Math.round(request.amountCents * rate)
    const spread = request.amountCents > 50_000_00 ? 0.001 : 0.005 // 0.1% vs 0.5%

    return {
      agentType: this.type,
      verdict: 'green',
      action: 'QUOTE',
      reasoning: `Quoted ${pair} at rate ${rate} with ${(spread * 100).toFixed(1)}% spread`,
      detail: {
        rate,
        pair,
        inputAmountCents: request.amountCents,
        outputAmountCents,
        spread,
        expiresIn: '30s',
      },
      durationMs: Date.now() - start,
    }
  }
}
