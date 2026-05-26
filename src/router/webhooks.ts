import { Hono } from 'hono'
import type { Env } from '../lib/env'

const webhooks = new Hono<{ Bindings: Env }>()

// ── Stripe signature verification ──────────────────────────────────────────
async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  // Parse Stripe-Signature header: t=timestamp,v1=signature[,v1=signature...]
  const parts = signatureHeader.split(',')
  const pairs: Record<string, string[]> = {}
  for (const part of parts) {
    const [key, value] = part.split('=', 2)
    if (!key || !value) continue
    if (!pairs[key]) pairs[key] = []
    pairs[key].push(value)
  }

  const timestamp = pairs['t']?.[0]
  const signatures = pairs['v1']
  if (!timestamp || !signatures?.length) {
    return { valid: false, error: 'Missing timestamp or v1 signature in Stripe-Signature header' }
  }

  // Replay protection: reject if timestamp is older than 5 minutes
  const ts = parseInt(timestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > 300) {
    return { valid: false, error: `Webhook timestamp too old: ${Math.abs(now - ts)}s drift` }
  }

  // Compute expected signature: HMAC-SHA256(timestamp + '.' + rawBody, secret)
  const signedPayload = `${timestamp}.${rawBody}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedPayload)
  )
  const expected = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time-ish comparison (check all provided v1 signatures)
  const match = signatures.some((sig) => sig === expected)
  if (!match) {
    return { valid: false, error: 'Signature mismatch' }
  }

  return { valid: true }
}

// ── Normalize webhook payload to internal envelope ─────────────────────────
function normalizeEvent(
  provider: string,
  payload: Record<string, unknown>
): { eventType: string; entityId: string | null; providerEventId: string } {
  if (provider === 'stripe') {
    return {
      eventType: (payload.type as string) || 'unknown',
      entityId: ((payload.data as Record<string, unknown>)?.object as Record<string, unknown>)?.id as string || null,
      providerEventId: (payload.id as string) || crypto.randomUUID(),
    }
  }

  if (provider === 'bridge') {
    return {
      eventType: (payload.event_type as string) || (payload.type as string) || 'unknown',
      entityId: (payload.entity_id as string) || null,
      providerEventId: (payload.id as string) || (payload.event_id as string) || crypto.randomUUID(),
    }
  }

  // Generic fallback for unknown providers
  return {
    eventType: (payload.type as string) || (payload.event_type as string) || 'unknown',
    entityId: (payload.entity_id as string) || (payload.id as string) || null,
    providerEventId: (payload.event_id as string) || (payload.id as string) || crypto.randomUUID(),
  }
}

// ── Main webhook handler ───────────────────────────────────────────────────
webhooks.post('/webhooks/:provider', async (c) => {
  const provider = c.req.param('provider')
  const rawBody = await c.req.text()
  const now = new Date().toISOString()
  const dateKey = now.slice(0, 10) // YYYY-MM-DD

  // 1. Verify provider signature
  if (provider === 'stripe') {
    const sigHeader = c.req.header('Stripe-Signature')
    const secret = c.env.STRIPE_WEBHOOK_SECRET
    if (!secret) {
      console.warn(`[Webhook] STRIPE_WEBHOOK_SECRET not configured — rejecting Stripe webhook`)
      return c.json({ error: 'Webhook secret not configured' }, 500)
    }
    if (!sigHeader) {
      return c.json({ error: 'Missing Stripe-Signature header' }, 401)
    }
    const result = await verifyStripeSignature(rawBody, sigHeader, secret)
    if (!result.valid) {
      console.warn(`[Webhook] Stripe verification failed: ${result.error}`)
      return c.json({ error: 'Signature verification failed' }, 401)
    }
  } else {
    // Placeholder for other providers — log warning and proceed
    console.warn(`[Webhook] No signature verification implemented for provider "${provider}" — proceeding unverified`)
  }

  // Parse payload after verification (verification uses raw body)
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  // Normalize to internal envelope
  const { eventType, entityId, providerEventId } = normalizeEvent(provider, payload)

  // 2. Deduplicate — check if this event was already received
  const existing = await c.env.DB.prepare(
    `SELECT id FROM webhook_events WHERE provider = ? AND provider_event_id = ?`
  )
    .bind(provider, providerEventId)
    .first()

  if (existing) {
    console.log(`[Webhook] Duplicate event ${provider}/${providerEventId} — skipping`)
    return c.json({ received: true, duplicate: true })
  }

  // 3. Store raw payload in R2
  const r2Key = `webhooks/${provider}/${dateKey}/${providerEventId}.json`
  await c.env.DOCUMENTS.put(r2Key, rawBody, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { provider, eventType, receivedAt: now },
  })

  // 4 & 5. Insert into webhook_events with status 'received'
  const webhookEventId = crypto.randomUUID()
  await c.env.DB.prepare(
    `INSERT INTO webhook_events (id, provider, event_type, provider_event_id, entity_id, status, raw_r2_key, created_at)
     VALUES (?, ?, ?, ?, ?, 'received', ?, ?)`
  )
    .bind(webhookEventId, provider, eventType, providerEventId, entityId, r2Key, now)
    .run()

  // Log to audit trail
  await c.env.DB.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, actor, detail, created_at)
     VALUES (?, 'webhook', ?, 'received', ?, ?, ?)`
  )
    .bind(crypto.randomUUID(), webhookEventId, `webhook:${provider}`, JSON.stringify({ eventType, providerEventId, entityId }), now)
    .run()

  // 6. Dispatch to TASK_QUEUE for async processing
  await c.env.TASK_QUEUE.send({
    type: 'webhook-event',
    payload: { webhookEventId, provider, eventType },
  })

  // 7. Return 200 immediately
  return c.json({ received: true, provider, webhookEventId })
})

export { webhooks }
