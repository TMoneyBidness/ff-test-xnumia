import type { Env } from '../lib/env'
import type { BankPort, ExchangePort, PSPPort, AccountingPort } from './ports'
import { MockBankAdapter } from './bank/mock'
import { MockExchangeAdapter } from './exchange/mock'
import { MockPSPAdapter } from './psp/mock'
import { MockAccountingAdapter } from './accounting/mock'

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
}

export function createAdapters(env: Env): AdapterSet {
  if (env.ENVIRONMENT === 'production') {
    // Phase 1: real adapters would be instantiated here
    // Phase 2: PSP adapter removed, bank/exchange go direct
    // For now, even production uses mocks until real adapters are built
    return {
      bank: new MockBankAdapter(),
      exchange: new MockExchangeAdapter(),
      psp: new MockPSPAdapter(),
      accounting: new MockAccountingAdapter(),
    }
  }

  // Sandbox: always use mocks
  return {
    bank: new MockBankAdapter(),
    exchange: new MockExchangeAdapter(),
    psp: new MockPSPAdapter(),
    accounting: new MockAccountingAdapter(),
  }
}
