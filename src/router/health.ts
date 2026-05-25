import { Hono } from 'hono'
import type { Env } from '../lib/env'

const health = new Hono<{ Bindings: Env }>()

health.get('/health', async (c) => {
  const dbCheck = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()

  return c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT,
    db: dbCheck?.ok === 1 ? 'connected' : 'unreachable',
    timestamp: new Date().toISOString(),
  })
})

export { health }
