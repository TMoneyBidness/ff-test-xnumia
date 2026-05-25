import type { PipelineAgent, AgentResult, PaymentRequest, Verdict } from './types'

const SANCTIONS_LIST = ['SANCTIONED_CORP', 'BLOCKED_ENTITY', 'OFAC_TARGET']
const KYC_EXPIRED_LIST = ['EXPIRED_KYC_CLIENT']

export class ComplianceAgent implements PipelineAgent {
  readonly type = 'compliance' as const
  readonly name = 'Compliance Screener'

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()
    const flags: string[] = []

    const nameUpper = request.clientName.toUpperCase()
    const sanctionsHit = SANCTIONS_LIST.some(
      (s) => nameUpper === s || nameUpper.includes(s),
    )

    const kycExpired = KYC_EXPIRED_LIST.includes(request.clientId)
    const kycExpiringSoon = request.clientId.startsWith('EXPIRING_')

    if (sanctionsHit) {
      flags.push(`Sanctions match: "${request.clientName}" appears on the sanctions list`)
    }
    if (kycExpired) {
      flags.push(`KYC expired for clientId "${request.clientId}"`)
    }
    if (kycExpiringSoon) {
      flags.push(`KYC expiring soon for clientId "${request.clientId}" — renewal recommended`)
    }

    let verdict: Verdict
    let reasoning: string

    if (sanctionsHit || kycExpired) {
      verdict = 'red'
      reasoning = `Compliance block: ${flags.join('; ')}. Transaction cannot proceed.`
    } else if (kycExpiringSoon) {
      verdict = 'amber'
      reasoning = `Compliance passed with advisory: ${flags.join('; ')}. Transaction may proceed but KYC renewal should be scheduled.`
    } else {
      verdict = 'green'
      reasoning = `Client "${request.clientName}" (${request.clientId}) cleared sanctions screening and KYC verification.`
    }

    return {
      agentType: this.type,
      verdict,
      action: verdict === 'red' ? 'REJECT' : 'CONTINUE',
      reasoning,
      detail: {
        sanctionsHit,
        kycExpired,
        kycExpiringSoon,
        flags,
        screenedAgainst: {
          sanctionsList: SANCTIONS_LIST,
          kycExpiredList: KYC_EXPIRED_LIST,
        },
      },
      durationMs: Date.now() - start,
    }
  }
}
