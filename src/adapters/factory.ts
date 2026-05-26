import type { Env } from '../lib/env'
import type { BankPort, ExchangePort, PSPPort, AccountingPort, CompliancePort, VerificationPort } from './ports'
import { MockBankAdapter } from './bank/mock'
import { MockExchangeAdapter } from './exchange/mock'
import { MockPSPAdapter } from './psp/mock'
import { MockAccountingAdapter } from './accounting/mock'
import { StripeClient } from './stripe-client'
import { StripePSPAdapter } from './psp/stripe'
import { StripeBankAdapter } from './bank/stripe-partial'

/**
 * Adapter factory — the single place where adapter selection happens.
 * Returns mock adapters in sandbox, real adapters in production.
 * This is how the PSP removal in Phase 2 becomes a config change.
 */
export interface AdapterSet {
  bank: BankPort
  exchange: ExchangePort
  psp: PSPPort
  accounting: AccountingPort
  compliance: CompliancePort
  verification: VerificationPort
}

// ── Inline mock stubs for new ports ──────────────────────────────

const mockCompliance: CompliancePort = {
  async screenEntity(params) {
    console.log(`[MockComplianceAdapter] screenEntity`, params)
    return {
      result: 'clear',
      listsChecked: ['OFAC', 'EU-Sanctions', 'UN-Sanctions'],
      screeningId: `mock-screening-${Date.now()}`,
    }
  },
  async getListUpdates(since) {
    console.log(`[MockComplianceAdapter] getListUpdates`, { since })
    return { updatedAt: new Date().toISOString(), changeCount: 0 }
  },
}

const mockVerification: VerificationPort = {
  async initiateVerification(params) {
    console.log(`[MockVerificationAdapter] initiateVerification`, params)
    const sessionId = `mock-verification-${Date.now()}`
    return {
      sessionId,
      verificationUrl: `https://mock-verify.example.com/session/${sessionId}`,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    }
  },
  async getVerificationStatus(sessionId) {
    console.log(`[MockVerificationAdapter] getVerificationStatus`, { sessionId })
    return { status: 'verified', completedAt: new Date().toISOString() }
  },
}

export function createAdapters(env: Env): AdapterSet {
  if (env.ENVIRONMENT === 'production') {
    if (env.STRIPE_SECRET_KEY) {
      const stripeClient = new StripeClient(env.STRIPE_SECRET_KEY, env.DOCUMENTS)
      return {
        bank: new StripeBankAdapter(stripeClient),
        exchange: new MockExchangeAdapter(), // Exchange adapter remains mock until Bridge integration
        psp: new StripePSPAdapter(stripeClient),
        accounting: new MockAccountingAdapter(),
        compliance: mockCompliance,
        verification: mockVerification,
      }
    }

    // No Stripe key configured — fall back to mocks with a warning
    console.warn('[AdapterFactory] STRIPE_SECRET_KEY not set in production — falling back to mock adapters')
    return {
      bank: new MockBankAdapter(),
      exchange: new MockExchangeAdapter(),
      psp: new MockPSPAdapter(),
      accounting: new MockAccountingAdapter(),
      compliance: mockCompliance,
      verification: mockVerification,
    }
  }

  // Sandbox: always use mocks
  return {
    bank: new MockBankAdapter(),
    exchange: new MockExchangeAdapter(),
    psp: new MockPSPAdapter(),
    accounting: new MockAccountingAdapter(),
    compliance: mockCompliance,
    verification: mockVerification,
  }
}
