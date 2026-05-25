// BankPort — fiat custody and rails
export interface BankPort {
  getBalance(accountId: string): Promise<{ balance: number; currency: string }>
  initiateTransfer(params: {
    from: string
    to: string
    amount: number
    currency: string
    reference: string
  }): Promise<{ transferId: string; status: string }>
  getTransferStatus(transferId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
    settledAt?: string
  }>
}

// PSPPort — regulatory bridge (Phase 1 only, removed in Phase 2)
export interface PSPPort {
  submitPayment(params: {
    amount: number
    currency: string
    source: string
    destination: string
    reference: string
  }): Promise<{ paymentId: string; status: string }>
  getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
  }>
}

// ExchangePort — stablecoin custody and on/off-ramp
export interface ExchangePort {
  getQuote(params: {
    fromCurrency: string
    toCurrency: string
    amount: number
  }): Promise<{ rate: number; expiresAt: string }>
  convertFiatToStable(params: {
    amount: number
    fiatCurrency: string
    stablecoin: string
  }): Promise<{ conversionId: string; amountReceived: number }>
  convertStableToFiat(params: {
    amount: number
    stablecoin: string
    fiatCurrency: string
  }): Promise<{ conversionId: string; amountReceived: number }>
  getConversionStatus(conversionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
  }>
}

// AccountingPort — reconciliation surface (Xero, QuickBooks, etc.)
export interface AccountingPort {
  createInvoice(params: {
    clientId: string
    amount: number
    currency: string
    description: string
  }): Promise<{ invoiceId: string }>
  reconcileEntry(params: {
    transactionId: string
    ledgerEntryId: string
    amount: number
    currency: string
  }): Promise<{ reconciled: boolean }>
  getUnreconciledEntries(since: string): Promise<
    Array<{ id: string; amount: number; currency: string; date: string }>
  >
}
