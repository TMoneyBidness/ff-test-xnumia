import { Hono } from 'hono'
import type { Env } from '../lib/env'
import type { PaymentRequest, PipelineResult, AgentType } from '../agents/types'
import { runPipeline } from '../agents/pipeline'

const mcp = new Hono<{ Bindings: Env }>()

// ── POST /mcp/submit-payment ──────────────────────────────────────
// Creates a payment request and runs it through the full agent pipeline.
mcp.post('/mcp/submit-payment', async (c) => {
  const body = await c.req.json<{
    clientId: string
    clientName: string
    amountCents: number
    currencyFrom: string
    currencyTo: string
    description?: string
  }>()

  const { clientId, clientName, amountCents, currencyFrom, currencyTo, description } = body

  if (!clientId || !clientName || !amountCents || !currencyFrom || !currencyTo) {
    return c.json({ error: 'Missing required fields: clientId, clientName, amountCents, currencyFrom, currencyTo' }, 400)
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  // Insert payment request as PENDING
  await c.env.DB.prepare(
    `INSERT INTO payment_requests (id, client_id, client_name, amount_cents, currency_from, currency_to, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`
  ).bind(id, clientId, clientName, amountCents, currencyFrom, currencyTo, description ?? null, now, now).run()

  const request: PaymentRequest = {
    id,
    clientId,
    clientName,
    amountCents,
    currencyFrom,
    currencyTo,
    description,
  }

  // Run through all pipeline agents
  const result: PipelineResult = await runPipeline(request, c.env)

  return c.json(result)
})

// ── GET /mcp/pipeline-status/:requestId ───────────────────────────
// Returns the current status of a payment request with all agent decisions.
mcp.get('/mcp/pipeline-status/:requestId', async (c) => {
  const requestId = c.req.param('requestId')

  const request = await c.env.DB.prepare(
    `SELECT * FROM payment_requests WHERE id = ?`
  ).bind(requestId).first()

  if (!request) {
    return c.json({ error: 'Payment request not found' }, 404)
  }

  const { results: decisions } = await c.env.DB.prepare(
    `SELECT * FROM agent_decisions WHERE request_id = ? ORDER BY created_at ASC`
  ).bind(requestId).all()

  // Parse detail JSON for each decision
  const parsedDecisions = decisions.map((d: Record<string, unknown>) => ({
    ...d,
    detail: d.detail ? JSON.parse(d.detail as string) : null,
  }))

  return c.json({ request, decisions: parsedDecisions })
})

// ── GET /mcp/escalated ────────────────────────────────────────────
// Lists all payment requests with status ESCALATED, including agent decisions.
mcp.get('/mcp/escalated', async (c) => {
  const { results: requests } = await c.env.DB.prepare(
    `SELECT * FROM payment_requests WHERE status = 'ESCALATED' ORDER BY created_at DESC`
  ).all()

  const escalated = await Promise.all(
    requests.map(async (req: Record<string, unknown>) => {
      const { results: decisions } = await c.env.DB.prepare(
        `SELECT * FROM agent_decisions WHERE request_id = ? ORDER BY created_at ASC`
      ).bind(req.id).all()

      const parsedDecisions = decisions.map((d: Record<string, unknown>) => ({
        ...d,
        detail: d.detail ? JSON.parse(d.detail as string) : null,
      }))

      return { request: req, decisions: parsedDecisions }
    })
  )

  return c.json(escalated)
})

// ── POST /mcp/approve/:requestId ──────────────────────────────────
// Approves an escalated payment request.
mcp.post('/mcp/approve/:requestId', async (c) => {
  const requestId = c.req.param('requestId')
  const body = await c.req.json<{ approvedBy: string; reason?: string }>()

  if (!body.approvedBy) {
    return c.json({ error: 'Missing required field: approvedBy' }, 400)
  }

  const existing = await c.env.DB.prepare(
    `SELECT * FROM payment_requests WHERE id = ?`
  ).bind(requestId).first()

  if (!existing) {
    return c.json({ error: 'Payment request not found' }, 404)
  }

  if (existing.status !== 'ESCALATED') {
    return c.json({ error: `Cannot approve a request with status '${existing.status}'. Only ESCALATED requests can be approved.` }, 409)
  }

  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `UPDATE payment_requests SET status = 'APPROVED', resolved_by = ?, resolved_at = ?, updated_at = ? WHERE id = ?`
  ).bind(body.approvedBy, now, now, requestId).run()

  // Write audit log entry
  await c.env.DB.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, actor, detail, created_at)
     VALUES (?, 'payment_request', ?, 'APPROVED', ?, ?, ?)`
  ).bind(crypto.randomUUID(), requestId, body.approvedBy, JSON.stringify({ reason: body.reason ?? null }), now).run()

  const updated = await c.env.DB.prepare(
    `SELECT * FROM payment_requests WHERE id = ?`
  ).bind(requestId).first()

  return c.json(updated)
})

// ── POST /mcp/reject/:requestId ───────────────────────────────────
// Rejects an escalated payment request.
mcp.post('/mcp/reject/:requestId', async (c) => {
  const requestId = c.req.param('requestId')
  const body = await c.req.json<{ rejectedBy: string; reason: string }>()

  if (!body.rejectedBy || !body.reason) {
    return c.json({ error: 'Missing required fields: rejectedBy, reason' }, 400)
  }

  const existing = await c.env.DB.prepare(
    `SELECT * FROM payment_requests WHERE id = ?`
  ).bind(requestId).first()

  if (!existing) {
    return c.json({ error: 'Payment request not found' }, 404)
  }

  if (existing.status !== 'ESCALATED') {
    return c.json({ error: `Cannot reject a request with status '${existing.status}'. Only ESCALATED requests can be rejected.` }, 409)
  }

  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `UPDATE payment_requests SET status = 'REJECTED', resolved_by = ?, resolved_at = ?, updated_at = ? WHERE id = ?`
  ).bind(body.rejectedBy, now, now, requestId).run()

  // Write audit log entry
  await c.env.DB.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, actor, detail, created_at)
     VALUES (?, 'payment_request', ?, 'REJECTED', ?, ?, ?)`
  ).bind(crypto.randomUUID(), requestId, body.rejectedBy, JSON.stringify({ reason: body.reason }), now).run()

  const updated = await c.env.DB.prepare(
    `SELECT * FROM payment_requests WHERE id = ?`
  ).bind(requestId).first()

  return c.json(updated)
})

// ── GET /mcp/ask-why/:requestId/:agentType ────────────────────────
// Returns the detailed reasoning for a specific agent's decision.
mcp.get('/mcp/ask-why/:requestId/:agentType', async (c) => {
  const requestId = c.req.param('requestId')
  const agentType = c.req.param('agentType') as AgentType

  const validTypes: AgentType[] = ['validate', 'quote', 'screen', 'execute', 'reconcile']
  if (!validTypes.includes(agentType)) {
    return c.json({ error: `Invalid agent type '${agentType}'. Must be one of: ${validTypes.join(', ')}` }, 400)
  }

  const decision = await c.env.DB.prepare(
    `SELECT * FROM agent_decisions WHERE request_id = ? AND agent_type = ?`
  ).bind(requestId, agentType).first()

  if (!decision) {
    return c.json({ error: `No decision found for agent '${agentType}' on request '${requestId}'` }, 404)
  }

  return c.json({
    ...decision,
    detail: decision.detail ? JSON.parse(decision.detail as string) : null,
  })
})

// ── GET /mcp/activity ─────────────────────────────────────────────
// Returns the most recent agent decisions across all requests.
mcp.get('/mcp/activity', async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '20', 10)
  const clampedLimit = Math.min(Math.max(limit, 1), 100)

  const { results } = await c.env.DB.prepare(
    `SELECT ad.*, pr.client_name, pr.amount_cents, pr.currency_from, pr.currency_to, pr.status AS request_status
     FROM agent_decisions ad
     JOIN payment_requests pr ON pr.id = ad.request_id
     ORDER BY ad.created_at DESC
     LIMIT ?`
  ).bind(clampedLimit).all()

  const parsed = results.map((r: Record<string, unknown>) => ({
    ...r,
    detail: r.detail ? JSON.parse(r.detail as string) : null,
  }))

  return c.json(parsed)
})

export { mcp }
