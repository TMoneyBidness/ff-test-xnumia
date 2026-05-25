import type { BankPort } from '../ports'

export class MockBankAdapter implements BankPort {
  private balances = new Map<string, { balance: number; currency: string }>()
  private transfers = new Map<
    string,
    { status: 'pending' | 'completed' | 'failed'; settledAt?: string }
  >()

  constructor() {
    // Seed a few default accounts
    this.balances.set('acct-001', { balance: 50_000, currency: 'EUR' })
    this.balances.set('acct-002', { balance: 120_000, currency: 'USD' })
  }

  async getBalance(accountId: string): Promise<{ balance: number; currency: string }> {
    console.log(`[MockBankAdapter] getBalance`, { accountId })
    const entry = this.balances.get(accountId)
    if (!entry) {
      return { balance: 0, currency: 'EUR' }
    }
    return { ...entry }
  }

  async initiateTransfer(params: {
    from: string
    to: string
    amount: number
    currency: string
    reference: string
  }): Promise<{ transferId: string; status: string }> {
    console.log(`[MockBankAdapter] initiateTransfer`, params)
    const transferId = `mock-bank-transfer-${Date.now()}`
    this.transfers.set(transferId, { status: 'pending' })

    // Deduct from source if it exists
    const source = this.balances.get(params.from)
    if (source) {
      source.balance -= params.amount
    }

    // Credit destination if it exists
    const dest = this.balances.get(params.to)
    if (dest) {
      dest.balance += params.amount
    }

    // Simulate settlement after creation
    setTimeout(() => {
      this.transfers.set(transferId, {
        status: 'completed',
        settledAt: new Date().toISOString(),
      })
    }, 500)

    return { transferId, status: 'pending' }
  }

  async getTransferStatus(transferId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
    settledAt?: string
  }> {
    console.log(`[MockBankAdapter] getTransferStatus`, { transferId })
    const entry = this.transfers.get(transferId)
    if (!entry) {
      return { status: 'failed' }
    }
    return { ...entry }
  }
}
