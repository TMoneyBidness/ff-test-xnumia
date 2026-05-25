import { Hono } from 'hono'
import type { Env } from '../lib/env'
import { ValidationError } from '../lib/errors'

const transactions = new Hono<{ Bindings: Env }>()

transactions.post('/transactions', async (c) => {
  const body = await c.req.json<{
    clientId: string
    type: 'AR' | 'AP' | 'conversion' | 'settlement'
    amountCents: number
    currencyFrom: string
    currencyTo: string
  }>()

  if (!body.clientId || !body.type || !body.amountCents) {
    throw new ValidationError('Missing required fields: clientId, type, amountCents')
  }

  const txId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Insert into D1
  await c.env.DB.prepare(
    `INSERT INTO transactions (id, client_id, type, amount_cents, currency_from, currency_to, status, environment, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'INITIATED', ?, ?, ?)`
  )
    .bind(txId, body.clientId, body.type, body.amountCents, body.currencyFrom, body.currencyTo, c.env.ENVIRONMENT, now, now)
    .run()

  // Forward to OrchestratorDO
  const doId = c.env.ORCHESTRATOR.idFromName(txId)
  const stub = c.env.ORCHESTRATOR.get(doId)
  const doResponse = await stub.fetch(new Request('http://do/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txId,
      clientId: body.clientId,
      type: body.type,
      amountCents: body.amountCents,
      currencyFrom: body.currencyFrom,
      currencyTo: body.currencyTo,
    }),
  }))

  const doResult = await doResponse.json()

  return c.json({ txId, status: 'INITIATED', orchestrator: doResult }, 201)
})

transactions.get('/transactions/:id', async (c) => {
  const txId = c.req.param('id')

  const row = await c.env.DB.prepare(
    'SELECT * FROM transactions WHERE id = ?'
  ).bind(txId).first()

  if (!row) {
    return c.json({ error: 'Transaction not found' }, 404)
  }

  return c.json(row)
})

export { transactions }
