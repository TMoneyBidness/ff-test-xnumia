import type { Env } from '../lib/env'
import type { PaymentRequest, PipelineResult, PipelineAgent, AgentResult } from './types'
import { IntakeAgent } from './intake'
import { ComplianceAgent } from './compliance'
import { FxAgent } from './fx'
import { RiskAgent } from './risk'
import { ReconAgent } from './recon'

/**
 * Runs a payment request through all 5 pipeline agents in sequence,
 * collects verdicts, writes decisions to D1, and returns the final result.
 */
export async function runPipeline(
  request: PaymentRequest,
  env: Env,
): Promise<PipelineResult> {
  const pipelineStart = Date.now()

  // Instantiate agents in pipeline order
  const agents: PipelineAgent[] = [
    new IntakeAgent(),
    new ComplianceAgent(),
    new FxAgent(),
    new RiskAgent(),
    new ReconAgent(env),
  ]

  const agentResults: AgentResult[] = []
  let hasRed = false
  let hasAmber = false
  let escalationReasons: string[] = []

  // Update payment request status to PROCESSING
  await env.DB.prepare(
    `UPDATE payment_requests SET status = 'PROCESSING', updated_at = ? WHERE id = ?`
  ).bind(new Date().toISOString(), request.id).run()

  // Run each agent in sequence
  for (const agent of agents) {
    const result = await agent.evaluate(request)
    agentResults.push(result)

    // Write decision to D1
    await env.DB.prepare(
      `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      request.id,
      result.agentType,
      result.verdict,
      result.action,
      result.reasoning,
      JSON.stringify(result.detail),
      result.durationMs,
      new Date().toISOString(),
    ).run()

    if (result.verdict === 'red') {
      hasRed = true
      escalationReasons.push(`${agent.name}: ${result.reasoning}`)
    }
    if (result.verdict === 'amber') {
      hasAmber = true
      escalationReasons.push(`${agent.name}: ${result.reasoning}`)
    }

    // Short-circuit on red — no point running remaining agents
    if (hasRed) break
  }

  // Determine final status
  let status: PipelineResult['status']
  if (hasRed) {
    status = 'REJECTED'
  } else if (hasAmber) {
    status = 'ESCALATED'
  } else {
    status = 'APPROVED'
  }

  const totalDurationMs = Date.now() - pipelineStart

  const pipelineResult: PipelineResult = {
    requestId: request.id,
    status,
    agentResults,
    escalationReason: escalationReasons.length > 0 ? escalationReasons.join('; ') : undefined,
    resolvedBy: status === 'APPROVED' ? 'auto' : 'auto',
    totalDurationMs,
  }

  // Update payment request with final result
  const now = new Date().toISOString()
  await env.DB.prepare(
    `UPDATE payment_requests
     SET status = ?, pipeline_result = ?, escalation_reason = ?,
         resolved_by = ?, resolved_at = ?, updated_at = ?
     WHERE id = ?`
  ).bind(
    status,
    JSON.stringify(pipelineResult),
    pipelineResult.escalationReason ?? null,
    status === 'APPROVED' ? 'auto' : null,
    status === 'APPROVED' ? now : null,
    now,
    request.id,
  ).run()

  return pipelineResult
}
