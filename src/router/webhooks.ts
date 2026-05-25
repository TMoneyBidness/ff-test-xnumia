import { Hono } from 'hono'
import type { Env } from '../lib/env'

const webhooks = new Hono<{ Bindings: Env }>()

webhooks.post('/webhooks/:provider', async (c) => {
  const provider = c.req.param('provider')
  const payload = await c.req.json()
  const now = new Date().toISOString()

  console.log(`[Webhook] Received from ${provider}:`, JSON.stringify(payload))

  // Log to D1 audit trail
  await c.env.DB.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, actor, detail, created_at)
     VALUES (?, 'webhook', ?, 'received', ?, ?, ?)`
  )
    .bind(crypto.randomUUID(), provider, provider, JSON.stringify(payload), now)
    .run()

  return c.json({ received: true, provider, timestamp: now })
})

export { webhooks }
