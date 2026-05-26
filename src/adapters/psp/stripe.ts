/**
 * Stripe PSP adapter — Phase 1 payment processing via Payment Intents and Payouts.
 * Removed in Phase 2 when MSB license is issued (Architecture Rule #4).
 */

import type { PSPPort } from '../ports'
import type { StripeClient } from '../stripe-client'
import { StripeError } from '../stripe-client'

type StripeStatus = string

function mapStatus(stripeStatus: StripeStatus): 'pending' | 'completed' | 'failed' {
  switch (stripeStatus) {
    case 'succeeded':
    case 'paid':
      return 'completed'
    case 'canceled':
    case 'failed':
      return 'failed'
    case 'requires_action':
    default:
      return 'pending'
  }
}

export class StripePSPAdapter implements PSPPort {
  constructor(private client: StripeClient) {}

  async submitPayment(params: {
    amount: number
    currency: string
    source: string
    destination: string
    reference: string
    idempotencyKey: string
    direction?: 'collect' | 'disburse'
  }): Promise<{ paymentId: string; status: string }> {
    try {
      if (params.direction === 'disburse') {
        const response = await this.client.post<{ id: string; status: string }>(
          '/v1/payouts',
          {
            amount: params.amount,
            currency: params.currency.toLowerCase(),
            destination: params.destination,
            metadata: { xnumia_reference: params.reference },
          },
          params.idempotencyKey,
        )
        return { paymentId: response.id, status: mapStatus(response.status) }
      }

      // collect (default)
      const response = await this.client.post<{ id: string; status: string }>(
        '/v1/payment_intents',
        {
          amount: params.amount,
          currency: params.currency.toLowerCase(),
          payment_method: params.source,
          confirm: true,
          metadata: { xnumia_reference: params.reference },
        },
        params.idempotencyKey,
      )
      return { paymentId: response.id, status: mapStatus(response.status) }
    } catch (err) {
      if (err instanceof StripeError) {
        console.error(`[StripePSP] submitPayment failed: ${err.message} (${err.statusCode})`)
        return { paymentId: '', status: 'failed' }
      }
      throw err
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
    failureReason?: string
  }> {
    try {
      // Payouts have ids starting with po_, everything else is a payment intent
      const isPayout = paymentId.startsWith('po_')
      const path = isPayout
        ? `/v1/payouts/${paymentId}`
        : `/v1/payment_intents/${paymentId}`

      const response = await this.client.get<{
        status: string
        last_payment_error?: { message?: string }
        failure_message?: string
      }>(path)

      const status = mapStatus(response.status)
      const failureReason = isPayout
        ? response.failure_message
        : response.last_payment_error?.message

      return failureReason ? { status, failureReason } : { status }
    } catch (err) {
      if (err instanceof StripeError) {
        console.error(`[StripePSP] getPaymentStatus failed: ${err.message} (${err.statusCode})`)
        return { status: 'failed', failureReason: err.message }
      }
      throw err
    }
  }
}
