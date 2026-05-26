import type { ExchangePort } from '../ports'

/**
 * BridgeSimExchangeAdapter — implements ExchangePort by querying D1 directly.
 * No HTTP calls, no external dependencies. Mirrors Bridge XYZ's transfer model
 * so the full stablecoin flow can be demoed without a Bridge account.
 */
export class BridgeSimExchangeAdapter implements ExchangePort {
  private db: D1Database

  // Same rate table as MockExchangeAdapter + CAD
  private rates: Record<string, number> = {
    'EUR-USDC': 1.08,
    'USDC-EUR': 0.926,
    'USD-USDC': 1.0,
    'USDC-USD': 1.0,
    'GBP-USDC': 1.27,
    'USDC-GBP': 0.787,
    'CAD-USDC': 0.73,
    'USDC-CAD': 1.37,
  }

  constructor(db: D1Database) {
    this.db = db
  }

  async getQuote(params: {
    fromCurrency: string
    toCurrency: string
    amount: number
  }): Promise<{ rate: number; expiresAt: string; quoteId: string }> {
    console.log(`[BridgeSimExchangeAdapter] getQuote`, params)
    const key = `${params.fromCurrency}-${params.toCurrency}`
    const rate = this.rates[key] ?? 1.0
    const expiresAt = new Date(Date.now() + 30_000).toISOString()
    const quoteId = `bridge-quote-${Date.now()}`
    return { rate, expiresAt, quoteId }
  }

  async convertFiatToStable(params: {
    amount: number
    fiatCurrency: string
    stablecoin: string
    idempotencyKey?: string
  }): Promise<{ conversionId: string; amountReceived: number }> {
    console.log(`[BridgeSimExchangeAdapter] convertFiatToStable`, params)

    const key = `${params.fiatCurrency}-${params.stablecoin}`
    const rate = this.rates[key] ?? 1.0
    const amountReceived = parseFloat((params.amount * rate).toFixed(2))

    // Check idempotency
    if (params.idempotencyKey) {
      const existing = await this.db.prepare(
        'SELECT id, amount FROM bridge_sim_transfers WHERE idempotency_key = ?'
      ).bind(params.idempotencyKey).first()
      if (existing) {
        return {
          conversionId: existing.id as string,
          amountReceived,
        }
      }
    }

    const id = `bridge-txfr-${crypto.randomUUID()}`
    const now = new Date().toISOString()
    const exchangeFee = 0.50
    const finalAmount = amountReceived - exchangeFee

    const receipt = JSON.stringify({
      initial_amount: params.amount.toFixed(2),
      exchange_fee: exchangeFee.toFixed(2),
      subtotal_amount: amountReceived.toFixed(2),
      gas_fee: '0.00',
      final_amount: finalAmount.toFixed(2),
    })

    await this.db.prepare(`
      INSERT INTO bridge_sim_transfers
        (id, amount, currency, on_behalf_of, source_currency, source_payment_rail,
         destination_currency, destination_payment_rail, destination_address,
         state, client_reference_id, idempotency_key, receipt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, params.amount.toFixed(2), params.fiatCurrency, null,
      params.fiatCurrency, 'ach',
      params.stablecoin, 'solana', null,
      'payment_submitted', null, params.idempotencyKey ?? null,
      receipt, now, now
    ).run()

    return { conversionId: id, amountReceived }
  }

  async convertStableToFiat(params: {
    amount: number
    stablecoin: string
    fiatCurrency: string
    idempotencyKey?: string
  }): Promise<{ conversionId: string; amountReceived: number }> {
    console.log(`[BridgeSimExchangeAdapter] convertStableToFiat`, params)

    const key = `${params.stablecoin}-${params.fiatCurrency}`
    const rate = this.rates[key] ?? 1.0
    const amountReceived = parseFloat((params.amount * rate).toFixed(2))

    // Check idempotency
    if (params.idempotencyKey) {
      const existing = await this.db.prepare(
        'SELECT id, amount FROM bridge_sim_transfers WHERE idempotency_key = ?'
      ).bind(params.idempotencyKey).first()
      if (existing) {
        return {
          conversionId: existing.id as string,
          amountReceived,
        }
      }
    }

    const id = `bridge-txfr-${crypto.randomUUID()}`
    const now = new Date().toISOString()
    const exchangeFee = 0.50
    const finalAmount = amountReceived - exchangeFee

    const receipt = JSON.stringify({
      initial_amount: params.amount.toFixed(2),
      exchange_fee: exchangeFee.toFixed(2),
      subtotal_amount: amountReceived.toFixed(2),
      gas_fee: '0.00',
      final_amount: finalAmount.toFixed(2),
    })

    await this.db.prepare(`
      INSERT INTO bridge_sim_transfers
        (id, amount, currency, on_behalf_of, source_currency, source_payment_rail,
         destination_currency, destination_payment_rail, destination_address,
         state, client_reference_id, idempotency_key, receipt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, params.amount.toFixed(2), params.stablecoin, null,
      params.stablecoin, 'solana',
      params.fiatCurrency, 'ach', null,
      'payment_submitted', null, params.idempotencyKey ?? null,
      receipt, now, now
    ).run()

    return { conversionId: id, amountReceived }
  }

  async getConversionStatus(conversionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
    settledAt?: string
    failureReason?: string
  }> {
    console.log(`[BridgeSimExchangeAdapter] getConversionStatus`, { conversionId })

    const transfer = await this.db.prepare(
      'SELECT * FROM bridge_sim_transfers WHERE id = ?'
    ).bind(conversionId).first()

    if (!transfer) {
      return { status: 'failed', failureReason: 'Transfer not found' }
    }

    // Auto-advance: if created > 5 seconds ago and still in-flight, settle it
    const createdAt = new Date(transfer.created_at as string).getTime()
    const age = Date.now() - createdAt
    let state = transfer.state as string

    if (age > 5000 && state === 'payment_submitted') {
      state = 'payment_processed'
      await this.db.prepare(
        'UPDATE bridge_sim_transfers SET state = ?, updated_at = ? WHERE id = ?'
      ).bind('payment_processed', new Date().toISOString(), conversionId).run()
    }

    // Map Bridge states to ExchangePort states
    return {
      status: mapBridgeState(state),
      settledAt: state === 'payment_processed' ? (transfer.updated_at as string) : undefined,
    }
  }
}

/** Maps Bridge transfer states to the ExchangePort status enum */
function mapBridgeState(bridgeState: string): 'pending' | 'completed' | 'failed' {
  switch (bridgeState) {
    case 'payment_processed':
      return 'completed'
    case 'awaiting_funds':
    case 'in_review':
    case 'funds_received':
    case 'payment_submitted':
      return 'pending'
    case 'canceled':
    case 'undeliverable':
    case 'returned':
    case 'refund_in_flight':
    case 'refund_failed':
    case 'refunded':
      return 'failed'
    default:
      return 'pending'
  }
}
