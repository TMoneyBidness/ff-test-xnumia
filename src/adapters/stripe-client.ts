/**
 * Low-level Stripe HTTP client for Cloudflare Workers.
 * No npm dependencies — raw fetch with form-encoded params.
 * Handles auth, idempotency, retry, and R2 evidence storage.
 */

const STRIPE_BASE = 'https://api.stripe.com'
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // exponential backoff

export class StripeClient {
  constructor(
    private apiKey: string,
    private documents: R2Bucket,
  ) {}

  /** POST with form-encoded body + idempotency key */
  async post<T = Record<string, unknown>>(
    path: string,
    params: Record<string, unknown>,
    idempotencyKey: string,
  ): Promise<T> {
    const body = formEncode(params)
    const response = await this.executeWithRetry(
      () => fetch(`${STRIPE_BASE}${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': idempotencyKey,
        },
        body,
      })
    )

    const data = await response.json() as T
    await this.storeEvidence(path, data)

    if (!response.ok) {
      const err = data as { error?: { message?: string; type?: string } }
      throw new StripeError(
        err.error?.message ?? `Stripe API error ${response.status}`,
        response.status,
        err.error?.type,
      )
    }

    return data
  }

  /** GET with optional query params */
  async get<T = Record<string, unknown>>(
    path: string,
    queryParams?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(`${STRIPE_BASE}${path}`)
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }

    const response = await this.executeWithRetry(
      () => fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })
    )

    const data = await response.json() as T
    await this.storeEvidence(path, data)

    if (!response.ok) {
      const err = data as { error?: { message?: string; type?: string } }
      throw new StripeError(
        err.error?.message ?? `Stripe API error ${response.status}`,
        response.status,
        err.error?.type,
      )
    }

    return data
  }

  /** Retry with exponential backoff for 429/5xx, fail fast on 4xx */
  private async executeWithRetry(
    request: () => Promise<Response>,
    attempt = 0,
  ): Promise<Response> {
    const response = await request()

    if (response.ok) return response

    // 4xx (except 429) — terminal, do not retry
    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
      return response
    }

    // Max retries exceeded
    if (attempt >= MAX_RETRIES) return response

    // 429 — respect Retry-After header
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAYS[attempt]
      await sleep(delay)
      return this.executeWithRetry(request, attempt + 1)
    }

    // 5xx — exponential backoff
    if (response.status >= 500) {
      await sleep(RETRY_DELAYS[attempt])
      return this.executeWithRetry(request, attempt + 1)
    }

    return response
  }

  /** Store raw API response in R2 for compliance evidence */
  private async storeEvidence(path: string, data: unknown): Promise<void> {
    try {
      const date = new Date().toISOString().slice(0, 10)
      const entityId = (data as Record<string, unknown>)?.id ?? crypto.randomUUID()
      const r2Key = `compliance/stripe/${date}/${entityId}.json`
      await this.documents.put(r2Key, JSON.stringify(data, null, 2), {
        httpMetadata: { contentType: 'application/json' },
        customMetadata: { source: 'stripe', path, storedAt: new Date().toISOString() },
      })
    } catch (err) {
      // Evidence storage failure should not block the payment
      console.error('[StripeClient] Failed to store evidence in R2:', err)
    }
  }
}

/** Stripe-compatible form encoding (handles nested objects like metadata[key]) */
function formEncode(params: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(params)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key

    if (value === null || value === undefined) continue

    if (typeof value === 'object' && !Array.isArray(value)) {
      parts.push(formEncode(value as Record<string, unknown>, fullKey))
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'object') {
          parts.push(formEncode(item as Record<string, unknown>, `${fullKey}[${i}]`))
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(String(item))}`)
        }
      })
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`)
    }
  }

  return parts.filter(Boolean).join('&')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class StripeError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly stripeType?: string,
  ) {
    super(message)
    this.name = 'StripeError'
  }

  get retryable(): boolean {
    return this.statusCode === 429 || this.statusCode >= 500
  }
}
