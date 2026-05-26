/**
 * Stripe partial bank adapter — balance and transaction reads only.
 * Fiat transfers are routed through PSPPort in Phase 1 (Architecture Rule #4).
 */

import type { BankPort } from '../ports'
import type { StripeClient } from '../stripe-client'
import { StripeError } from '../stripe-client'

export class StripeBankAdapter implements BankPort {
  constructor(private client: StripeClient) {}

  async getBalance(_accountId: string): Promise<{ balance: number; currency: string }> {
    try {
      const response = await this.client.get<{
        available: Array<{ amount: number; currency: string }>
        pending: Array<{ amount: number; currency: string }>
      }>('/v1/balance')

      if (!response.available || response.available.length === 0) {
        return { balance: 0, currency: 'USD' }
      }

      return {
        balance: response.available[0].amount / 100,
        currency: response.available[0].currency.toUpperCase(),
      }
    } catch (err) {
      if (err instanceof StripeError) {
        console.error(`[StripeBank] getBalance failed: ${err.message} (${err.statusCode})`)
      }
      throw err
    }
  }

  async initiateTransfer(_params: {
    from: string
    to: string
    amount: number
    currency: string
    reference: string
    idempotencyKey: string
  }): Promise<{ transferId: string; status: string }> {
    throw new Error('Fiat transfers use PSP in Phase 1. Use PSPPort.submitPayment instead.')
  }

  async getTransferStatus(_transferId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'returned'
    settledAt?: string
    failureReason?: string
  }> {
    throw new Error('Fiat transfers use PSP in Phase 1. Use PSPPort.submitPayment instead.')
  }

  async listTransactions(params: {
    since?: string
    limit?: number
  }): Promise<Array<{
    id: string
    amount: number
    currency: string
    created: string
    description: string
    type: string
  }>> {
    try {
      const queryParams: Record<string, string | number | undefined> = {
        limit: params.limit || 100,
      }

      if (params.since) {
        queryParams['created[gte]'] = Math.floor(new Date(params.since).getTime() / 1000)
      }

      const response = await this.client.get<{
        data: Array<{
          id: string
          amount: number
          currency: string
          created: number
          description: string | null
          type: string
        }>
      }>('/v1/balance_transactions', queryParams)

      return response.data.map(t => ({
        id: t.id,
        amount: t.amount / 100,
        currency: t.currency.toUpperCase(),
        created: new Date(t.created * 1000).toISOString(),
        description: t.description || '',
        type: t.type,
      }))
    } catch (err) {
      if (err instanceof StripeError) {
        console.error(`[StripeBank] listTransactions failed: ${err.message} (${err.statusCode})`)
      }
      throw err
    }
  }
}
