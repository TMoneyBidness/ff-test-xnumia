import type { PipelineAgent, AgentResult, PaymentRequest, Verdict } from './types'

const FIAT_CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP']
const STABLECOIN_CURRENCIES = ['USDC', 'USDT']
const ALL_CURRENCIES = [...FIAT_CURRENCIES, ...STABLECOIN_CURRENCIES]

export class IntakeAgent implements PipelineAgent {
  readonly type = 'intake' as const
  readonly name = 'Intake Validator'

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()
    const errors: string[] = []
    const warnings: string[] = []

    // Required field checks
    if (!request.clientId || request.clientId.trim() === '') {
      errors.push('clientId is missing or empty')
    }
    if (!request.clientName || request.clientName.trim() === '') {
      errors.push('clientName is missing or empty')
    }
    if (request.amountCents <= 0) {
      errors.push(`amountCents must be positive, got ${request.amountCents}`)
    }

    // Currency validation
    if (!ALL_CURRENCIES.includes(request.currencyFrom)) {
      errors.push(`invalid currencyFrom: "${request.currencyFrom}" (allowed: ${ALL_CURRENCIES.join(', ')})`)
    }
    if (!ALL_CURRENCIES.includes(request.currencyTo)) {
      errors.push(`invalid currencyTo: "${request.currencyTo}" (allowed: ${ALL_CURRENCIES.join(', ')})`)
    }
    if (request.currencyFrom === request.currencyTo) {
      errors.push(`currencyFrom and currencyTo cannot be the same ("${request.currencyFrom}")`)
    }

    // Optional field warnings
    if (!request.description || request.description.trim() === '') {
      warnings.push('description is missing — recommended for audit trail')
    }

    let verdict: Verdict
    let reasoning: string

    if (errors.length > 0) {
      verdict = 'red'
      reasoning = `Payment request failed validation: ${errors.join('; ')}`
    } else if (warnings.length > 0) {
      verdict = 'amber'
      reasoning = `Payment request is valid but has warnings: ${warnings.join('; ')}`
    } else {
      verdict = 'green'
      reasoning = `Payment request passed all validation checks. ${request.currencyFrom} ${(request.amountCents / 100).toFixed(2)} to ${request.currencyTo} for client ${request.clientName}.`
    }

    return {
      agentType: this.type,
      verdict,
      action: verdict === 'red' ? 'REJECT' : 'CONTINUE',
      reasoning,
      detail: {
        errors,
        warnings,
        normalizedRequest: {
          clientId: request.clientId?.trim(),
          clientName: request.clientName?.trim(),
          amountCents: request.amountCents,
          currencyFrom: request.currencyFrom,
          currencyTo: request.currencyTo,
          description: request.description?.trim() || null,
        },
      },
      durationMs: Date.now() - start,
    }
  }
}
