import type { PipelineAgent, AgentResult, PaymentRequest, Verdict } from './types'

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

export class FxAgent implements PipelineAgent {
  readonly type = 'fx' as const
  readonly name = 'FX Rate Engine'

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()

    const pair = `${request.currencyFrom}-${request.currencyTo}`
    const rate = RATES[pair]

    if (rate === undefined) {
      return {
        agentType: this.type,
        verdict: 'red',
        action: 'REJECT',
        reasoning: `No exchange rate available for pair ${pair}. This currency conversion is not supported.`,
        detail: {
          pair,
          rate: null,
          inputAmount: request.amountCents,
          outputAmount: null,
          spread: null,
          supportedPairs: Object.keys(RATES),
        },
        durationMs: Date.now() - start,
      }
    }

    const outputAmountCents = Math.round(request.amountCents * rate)

    // Spread: 0.1% for large transactions (> $50k), 0.5% for smaller ones
    const spread = request.amountCents > 5_000_000 ? 0.001 : 0.005

    let verdict: Verdict
    let reasoning: string

    if (spread > 0.003) {
      verdict = 'amber'
      reasoning = `FX conversion calculated for ${pair} at rate ${rate}. Spread is ${(spread * 100).toFixed(1)}% (standard for transactions under $50,000). Input: ${(request.amountCents / 100).toFixed(2)} ${request.currencyFrom}, Output: ${(outputAmountCents / 100).toFixed(2)} ${request.currencyTo}.`
    } else {
      verdict = 'green'
      reasoning = `FX conversion calculated for ${pair} at rate ${rate}. Preferred spread of ${(spread * 100).toFixed(1)}% applied (transaction over $50,000). Input: ${(request.amountCents / 100).toFixed(2)} ${request.currencyFrom}, Output: ${(outputAmountCents / 100).toFixed(2)} ${request.currencyTo}.`
    }

    return {
      agentType: this.type,
      verdict,
      action: 'CONTINUE',
      reasoning,
      detail: {
        rate,
        inputAmount: request.amountCents,
        outputAmount: outputAmountCents,
        spread,
        pair,
      },
      durationMs: Date.now() - start,
    }
  }
}
