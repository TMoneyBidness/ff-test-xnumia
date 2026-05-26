import { Hono } from 'hono'
import type { Env } from '../lib/env'

const bridgeSimulator = new Hono<{ Bindings: Env }>()

// ── Auth middleware — accept any non-empty Api-Key ──────────────

bridgeSimulator.use('/bridge-sim/*', async (c, next) => {
  const apiKey = c.req.header('Api-Key')
  if (!apiKey) {
    return c.json({ error: { message: 'Missing Api-Key header', type: 'authentication_error' } }, 401)
  }
  await next()
})

// ── POST /bridge-sim/v0/transfers ──────────────────────────────

bridgeSimulator.post('/bridge-sim/v0/transfers', async (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key') ?? null

  // Idempotency check — return cached response if key already used
  if (idempotencyKey) {
    const existing = await c.env.DB.prepare(
      'SELECT * FROM bridge_sim_transfers WHERE idempotency_key = ?'
    ).bind(idempotencyKey).first()

    if (existing) {
      return c.json(formatTransferResponse(existing))
    }
  }

  const body = await c.req.json<{
    amount: string
    on_behalf_of?: string
    source: { currency: string; payment_rail: string }
    destination: { currency: string; payment_rail: string; to_address?: string }
    client_reference_id?: string
  }>()

  const id = `bridge-txfr-${crypto.randomUUID()}`
  const now = new Date().toISOString()
  const amount = body.amount
  const initialAmount = parseFloat(amount)
  const exchangeFee = 0.50
  const subtotalAmount = initialAmount - exchangeFee
  const gasFee = 0.00
  const finalAmount = subtotalAmount - gasFee

  const receipt = JSON.stringify({
    initial_amount: amount,
    exchange_fee: exchangeFee.toFixed(2),
    subtotal_amount: subtotalAmount.toFixed(2),
    gas_fee: gasFee.toFixed(2),
    final_amount: finalAmount.toFixed(2),
  })

  // Create with state awaiting_funds, then immediately advance to payment_submitted
  const state = 'payment_submitted'

  await c.env.DB.prepare(`
    INSERT INTO bridge_sim_transfers
      (id, amount, currency, on_behalf_of, source_currency, source_payment_rail,
       destination_currency, destination_payment_rail, destination_address,
       state, client_reference_id, idempotency_key, receipt, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, amount, body.source.currency, body.on_behalf_of ?? null,
    body.source.currency, body.source.payment_rail,
    body.destination.currency, body.destination.payment_rail,
    body.destination.to_address ?? null,
    state, body.client_reference_id ?? null, idempotencyKey,
    receipt, now, now
  ).run()

  const transfer = await c.env.DB.prepare(
    'SELECT * FROM bridge_sim_transfers WHERE id = ?'
  ).bind(id).first()

  return c.json(formatTransferResponse(transfer!), 201)
})

// ── GET /bridge-sim/v0/transfers/:id ───────────────────────────

bridgeSimulator.get('/bridge-sim/v0/transfers/:id', async (c) => {
  const id = c.req.param('id')
  const transfer = await c.env.DB.prepare(
    'SELECT * FROM bridge_sim_transfers WHERE id = ?'
  ).bind(id).first()

  if (!transfer) {
    return c.json({ error: { message: 'Transfer not found', type: 'not_found' } }, 404)
  }

  // Auto-advance: if created > 5 seconds ago and still in-flight, settle it
  const createdAt = new Date(transfer.created_at as string).getTime()
  const age = Date.now() - createdAt
  if (age > 5000 && transfer.state === 'payment_submitted') {
    await c.env.DB.prepare(
      'UPDATE bridge_sim_transfers SET state = ?, updated_at = ? WHERE id = ?'
    ).bind('payment_processed', new Date().toISOString(), id).run()
    transfer.state = 'payment_processed'
    transfer.updated_at = new Date().toISOString()
  }

  return c.json(formatTransferResponse(transfer))
})

// ── GET /bridge-sim/v0/transfers ───────────────────────────────

bridgeSimulator.get('/bridge-sim/v0/transfers', async (c) => {
  const onBehalfOf = c.req.query('on_behalf_of')

  let results
  if (onBehalfOf) {
    results = await c.env.DB.prepare(
      'SELECT * FROM bridge_sim_transfers WHERE on_behalf_of = ? ORDER BY created_at DESC'
    ).bind(onBehalfOf).all()
  } else {
    results = await c.env.DB.prepare(
      'SELECT * FROM bridge_sim_transfers ORDER BY created_at DESC'
    ).all()
  }

  return c.json({
    data: (results.results ?? []).map(formatTransferResponse),
    has_more: false,
  })
})

// ── POST /bridge-sim/v0/customers ──────────────────────────────

bridgeSimulator.post('/bridge-sim/v0/customers', async (c) => {
  const body = await c.req.json<{
    email?: string
    name?: string
  }>()

  const id = `bridge-cust-${crypto.randomUUID()}`
  const now = new Date().toISOString()
  // Simulator shortcut: auto-approve KYC
  const kycStatus = 'approved'

  await c.env.DB.prepare(`
    INSERT INTO bridge_sim_customers (id, email, name, kyc_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, body.email ?? null, body.name ?? null, kycStatus, now, now).run()

  return c.json({
    id,
    email: body.email ?? null,
    name: body.name ?? null,
    kyc_status: kycStatus,
    created_at: now,
    updated_at: now,
  }, 201)
})

// ── GET /bridge-sim/v0/customers/:id ───────────────────────────

bridgeSimulator.get('/bridge-sim/v0/customers/:id', async (c) => {
  const id = c.req.param('id')
  const customer = await c.env.DB.prepare(
    'SELECT * FROM bridge_sim_customers WHERE id = ?'
  ).bind(id).first()

  if (!customer) {
    return c.json({ error: { message: 'Customer not found', type: 'not_found' } }, 404)
  }

  return c.json({
    id: customer.id,
    email: customer.email,
    name: customer.name,
    kyc_status: customer.kyc_status,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
  })
})

// ── Response formatter ─────────────────────────────────────────

function formatTransferResponse(row: Record<string, unknown>) {
  return {
    id: row.id,
    state: row.state,
    amount: row.amount,
    currency: row.currency,
    on_behalf_of: row.on_behalf_of,
    source: {
      currency: row.source_currency,
      payment_rail: row.source_payment_rail,
    },
    destination: {
      currency: row.destination_currency,
      payment_rail: row.destination_payment_rail,
      to_address: row.destination_address,
    },
    receipt: row.receipt ? JSON.parse(row.receipt as string) : null,
    client_reference_id: row.client_reference_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export { bridgeSimulator }
