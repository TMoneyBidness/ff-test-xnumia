import type { AccountingPort } from '../ports'

export class MockAccountingAdapter implements AccountingPort {
  private invoices = new Map<string, { clientId: string; amount: number; currency: string; description: string }>()
  private reconciledEntries = new Map<string, boolean>()
  private unreconciledEntries: Array<{ id: string; amount: number; currency: string; date: string }> = []

  constructor() {
    // Seed some unreconciled entries
    this.unreconciledEntries = [
      { id: 'entry-001', amount: 2500, currency: 'EUR', date: '2026-05-20T10:00:00Z' },
      { id: 'entry-002', amount: 8100, currency: 'USD', date: '2026-05-21T14:30:00Z' },
      { id: 'entry-003', amount: 430, currency: 'GBP', date: '2026-05-22T09:15:00Z' },
    ]
  }

  async createInvoice(params: {
    clientId: string
    amount: number
    currency: string
    description: string
  }): Promise<{ invoiceId: string }> {
    console.log(`[MockAccountingAdapter] createInvoice`, params)
    const invoiceId = `mock-invoice-${Date.now()}`
    this.invoices.set(invoiceId, { ...params })
    return { invoiceId }
  }

  async reconcileEntry(params: {
    transactionId: string
    ledgerEntryId: string
    amount: number
    currency: string
  }): Promise<{ reconciled: boolean }> {
    console.log(`[MockAccountingAdapter] reconcileEntry`, params)
    this.reconciledEntries.set(params.ledgerEntryId, true)

    // Remove from unreconciled list
    this.unreconciledEntries = this.unreconciledEntries.filter(
      (e) => e.id !== params.ledgerEntryId
    )

    return { reconciled: true }
  }

  async getUnreconciledEntries(
    since: string
  ): Promise<Array<{ id: string; amount: number; currency: string; date: string }>> {
    console.log(`[MockAccountingAdapter] getUnreconciledEntries`, { since })
    const sinceDate = new Date(since)
    return this.unreconciledEntries.filter(
      (e) => new Date(e.date) >= sinceDate
    )
  }
}
