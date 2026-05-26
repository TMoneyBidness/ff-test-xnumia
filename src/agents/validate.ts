import type { PipelineAgent, PaymentRequest, AgentResult, Verdict } from './types'

const VALID_CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'USDC', 'USDT']
const EXPIRED_KYC_CLIENTS = ['EXPIRED_KYC_CLIENT']

export class ValidateAgent implements PipelineAgent {
  readonly type = 'validate' as const
  readonly name = 'ValidateAgent'

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()
    const errors: string[] = []
    const warnings: string[] = []

    // --- Field validation ---
    if (!request.clientId) errors.push('clientId is missing')
    if (!request.clientName) errors.push('clientName is missing')
    if (!request.amountCents || request.amountCents <= 0) errors.push('amountCents must be > 0')
    if (!VALID_CURRENCIES.includes(request.currencyFrom)) errors.push(`currencyFrom '${request.currencyFrom}' is not supported`)
    if (!VALID_CURRENCIES.includes(request.currencyTo)) errors.push(`currencyTo '${request.currencyTo}' is not supported`)
    if (request.currencyFrom === request.currencyTo) errors.push('currencyFrom must differ from currencyTo')

    // --- KYC checks ---
    if (EXPIRED_KYC_CLIENTS.includes(request.clientId)) {
      errors.push('KYC expired for this client')
    } else if (request.clientId.startsWith('EXPIRING_')) {
      warnings.push('KYC expiring soon — renewal recommended')
    }

    // --- Optional field warnings ---
    if (!request.description) {
      warnings.push('Missing description — recommended for audit trail')
    }

    // --- Verdict ---
    let verdict: Verdict = 'green'
    if (errors.length > 0) verdict = 'red'
    else if (warnings.length > 0) verdict = 'amber'

    return {
      agentType: this.type,
      verdict,
      action: verdict === 'red' ? 'REJECT' : verdict === 'amber' ? 'FLAG' : 'PASS',
      reasoning: errors.length > 0
        ? `Validation failed: ${errors.join('; ')}`
        : warnings.length > 0
          ? `Validation passed with warnings: ${warnings.join('; ')}`
          : 'All fields valid, client eligible',
      detail: { errors, warnings },
      durationMs: Date.now() - start,
    }
  }
}
