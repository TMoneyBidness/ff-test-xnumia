import type { PSPPort } from '../ports'

export class MockPSPAdapter implements PSPPort {
  private payments = new Map<string, { status: 'pending' | 'completed' | 'failed' }>()

  async submitPayment(params: {
    amount: number
    currency: string
    source: string
    destination: string
    reference: string
    idempotencyKey: string
  }): Promise<{ paymentId: string; status: string }> {
    console.log(`[MockPSPAdapter] submitPayment`, params)
    const paymentId = `mock-psp-payment-${Date.now()}`
    this.payments.set(paymentId, { status: 'pending' })

    // Simulate async completion
    setTimeout(() => {
      this.payments.set(paymentId, { status: 'completed' })
    }, 500)

    return { paymentId, status: 'pending' }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed'
    failureReason?: string
  }> {
    console.log(`[MockPSPAdapter] getPaymentStatus`, { paymentId })
    const entry = this.payments.get(paymentId)
    if (!entry) {
      return { status: 'failed' }
    }
    return { ...entry }
  }
}
