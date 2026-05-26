/**
 * Port interfaces for all external systems.
 * Every external call goes through a port — implementations are swapped per environment.
 * Each mutating method accepts an idempotencyKey to prevent duplicate operations.
 */

// ── Shared Types ────────────────────────────────────────────────

/** All adapter methods return this wrapper so callers can distinguish retryable from terminal errors */
export type AdapterResult<T> =
  | { ok: true; data: T }
  | { ok: false; retryable: boolean; error: string }

// ── BankPort — fiat custody and rails ───────────────────────────

export interface BankPort {
  getBalance(accountId: string): Promise<{ balance: number; currency: string }>

  initiateTransfer(params: {
    from: string
    to: string
    amount: number
    currency: string
    reference: string
    idempotencyKey: string
  }): Promise<{ transferId: string; status: string }>

  getTransferStatus(transferId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'returned'
    settledAt?: string
    failureReason?: string
  }>
}

// ── PSPPort — regulatory bridge (Phase 1 only, removed in Phase 2) ──

export interface PSPPort {
  submitPayment(params: {
    amount: number
    currency: string
    source: string
    destination: string
    reference: string
    idempotencyKey: string
  }): Promise<{ paymentId: string; status: string }>

  getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
    failureReason?: string
  }>
}

// ── ExchangePort — stablecoin on/off-ramp (Bridge in Phase 1) ──

export interface ExchangePort {
  getQuote(params: {
    fromCurrency: string
    toCurrency: string
    amount: number
  }): Promise<{ rate: number; expiresAt: string; quoteId: string }>

  convertFiatToStable(params: {
    amount: number
    fiatCurrency: string
    stablecoin: string
    idempotencyKey?: string
  }): Promise<{ conversionId: string; amountReceived: number }>

  convertStableToFiat(params: {
    amount: number
    stablecoin: string
    fiatCurrency: string
    idempotencyKey?: string
  }): Promise<{ conversionId: string; amountReceived: number }>

  getConversionStatus(conversionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
    settledAt?: string
    failureReason?: string
  }>
}

// ── AccountingPort — reconciliation surface (Xero, QuickBooks) ──

export interface AccountingPort {
  createInvoice(params: {
    clientId: string
    amount: number
    currency: string
    description: string
    idempotencyKey?: string
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

// ── CompliancePort — sanctions/PEP screening ────────────────────

export interface CompliancePort {
  screenEntity(params: {
    name: string
    entityType: 'client' | 'counterparty' | 'beneficiary' | 'beneficial_owner'
    entityId: string
    jurisdiction?: string
  }): Promise<{
    result: 'clear' | 'match' | 'partial_match' | 'error'
    matchScore?: number
    matchDetails?: string
    listsChecked: string[]
    screeningId: string
  }>

  getListUpdates(since: string): Promise<{
    updatedAt: string
    changeCount: number
  }>
}

// ── VerificationPort — KYC/KYB identity verification ────────────

export interface VerificationPort {
  initiateVerification(params: {
    entityType: 'client' | 'counterparty' | 'beneficial_owner'
    entityId: string
    verificationType: 'kyc' | 'kyb'
    redirectUrl?: string
  }): Promise<{
    sessionId: string
    verificationUrl: string
    expiresAt: string
  }>

  getVerificationStatus(sessionId: string): Promise<{
    status: 'initiated' | 'pending' | 'verified' | 'failed' | 'expired'
    completedAt?: string
    failureReason?: string
  }>
}
