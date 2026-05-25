import type { ExchangePort } from '../ports'

export class MockExchangeAdapter implements ExchangePort {
  private conversions = new Map<
    string,
    { status: 'pending' | 'completed' | 'failed' }
  >()

  // Deterministic mock rates
  private rates: Record<string, number> = {
    'EUR-USDC': 1.08,
    'USDC-EUR': 0.926,
    'USD-USDC': 1.0,
    'USDC-USD': 1.0,
    'GBP-USDC': 1.27,
    'USDC-GBP': 0.787,
  }

  async getQuote(params: {
    fromCurrency: string
    toCurrency: string
    amount: number
  }): Promise<{ rate: number; expiresAt: string }> {
    console.log(`[MockExchangeAdapter] getQuote`, params)
    const key = `${params.fromCurrency}-${params.toCurrency}`
    const rate = this.rates[key] ?? 1.0
    const expiresAt = new Date(Date.now() + 30_000).toISOString()
    return { rate, expiresAt }
  }

  async convertFiatToStable(params: {
    amount: number
    fiatCurrency: string
    stablecoin: string
  }): Promise<{ conversionId: string; amountReceived: number }> {
    console.log(`[MockExchangeAdapter] convertFiatToStable`, params)
    const conversionId = `mock-exchange-conversion-${Date.now()}`
    const key = `${params.fiatCurrency}-${params.stablecoin}`
    const rate = this.rates[key] ?? 1.0
    const amountReceived = parseFloat((params.amount * rate).toFixed(2))

    this.conversions.set(conversionId, { status: 'pending' })

    setTimeout(() => {
      this.conversions.set(conversionId, { status: 'completed' })
    }, 500)

    return { conversionId, amountReceived }
  }

  async convertStableToFiat(params: {
    amount: number
    stablecoin: string
    fiatCurrency: string
  }): Promise<{ conversionId: string; amountReceived: number }> {
    console.log(`[MockExchangeAdapter] convertStableToFiat`, params)
    const conversionId = `mock-exchange-conversion-${Date.now()}`
    const key = `${params.stablecoin}-${params.fiatCurrency}`
    const rate = this.rates[key] ?? 1.0
    const amountReceived = parseFloat((params.amount * rate).toFixed(2))

    this.conversions.set(conversionId, { status: 'pending' })

    setTimeout(() => {
      this.conversions.set(conversionId, { status: 'completed' })
    }, 500)

    return { conversionId, amountReceived }
  }

  async getConversionStatus(conversionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
  }> {
    console.log(`[MockExchangeAdapter] getConversionStatus`, { conversionId })
    const entry = this.conversions.get(conversionId)
    if (!entry) {
      return { status: 'failed' }
    }
    return { ...entry }
  }
}
