import type { Env } from '../lib/env'
import type { OpsRunResult } from './ops-types'
import { createAdapters } from '../adapters/factory'
import { SettlementAgent } from './settlement'
import { ReconciliationAgent } from './reconciliation'
import { FraudDetectionAgent } from './fraud'
import { AMLComplianceAgent } from './aml'
import { PaymentsOpsAgent } from './ops'

/**
 * Operations Agent Runner — entry point for all back-office agents.
 *
 * Called by a cron trigger or manually via an API endpoint.
 * Runs agents in sequence (not parallel) because they may affect each other's
 * state — e.g. SettlementAgent may settle a transaction that PaymentsOpsAgent
 * would otherwise retry.
 */

// ── Individual runners ─────────────────────────────────────────

export async function runSettlement(env: Env): Promise<OpsRunResult> {
  const adapters = createAdapters(env)
  const agent = new SettlementAgent(env, adapters.bank, adapters.exchange, adapters.psp)
  return agent.run()
}

export async function runReconciliation(env: Env): Promise<OpsRunResult> {
  const adapters = createAdapters(env)
  const agent = new ReconciliationAgent(env, adapters.bank, adapters.accounting)
  return agent.run()
}

export async function runFraud(env: Env): Promise<OpsRunResult> {
  const agent = new FraudDetectionAgent(env)
  return agent.run()
}

export async function runAML(env: Env): Promise<OpsRunResult> {
  const adapters = createAdapters(env)
  const agent = new AMLComplianceAgent(env, adapters.compliance)
  return agent.run()
}

export async function runPaymentsOps(env: Env): Promise<OpsRunResult> {
  const adapters = createAdapters(env)
  const agent = new PaymentsOpsAgent(env, adapters.bank, adapters.exchange, adapters.psp)
  return agent.run()
}

// ── Full orchestrated run ──────────────────────────────────────

/**
 * Run all 5 operations agents in sequence.
 * Order matters: settlement first (may resolve transactions), then recon,
 * then fraud/AML (may flag things), then payments ops (handles leftovers).
 */
export async function runOpsAgents(env: Env): Promise<OpsRunResult[]> {
  const start = Date.now()
  const results: OpsRunResult[] = []

  results.push(await runSettlement(env))
  results.push(await runReconciliation(env))
  results.push(await runFraud(env))
  results.push(await runAML(env))
  results.push(await runPaymentsOps(env))

  // Write orchestrator summary decision
  const totalProcessed = results.reduce((sum, r) => sum + r.itemsProcessed, 0)
  const totalActions = results.reduce((sum, r) => sum + r.actionsPerformed.length, 0)
  const totalEscalations = results.reduce((sum, r) => sum + r.escalations.length, 0)
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
  const durationMs = Date.now() - start

  const overallVerdict = totalErrors > 0
    ? 'red'
    : totalEscalations > 0
      ? 'amber'
      : 'green'

  try {
    await env.DB.prepare(
      `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
       VALUES (?, ?, 'orchestrator', ?, ?, ?, ?, ?, ?)`,
    ).bind(
      `ops-run-${Date.now()}`,
      'ops-cycle',
      overallVerdict,
      'OPS_CYCLE_COMPLETE',
      `Ops cycle: ${totalProcessed} processed, ${totalActions} actions, ${totalEscalations} escalations, ${totalErrors} errors`,
      JSON.stringify({
        agents: results.map(r => ({
          agent: r.agentType,
          verdict: r.verdict,
          processed: r.itemsProcessed,
          actions: r.actionsPerformed.length,
          escalations: r.escalations.length,
          errors: r.errors.length,
        })),
        totalDurationMs: durationMs,
      }),
      durationMs,
      new Date().toISOString(),
    ).run()
  } catch (err) {
    console.error(`[OpsRunner] Failed to write summary:`, err instanceof Error ? err.message : String(err))
  }

  return results
}
