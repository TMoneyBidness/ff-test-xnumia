/**
 * Types for back-office operations agents.
 * These agents run on schedules/triggers, not inline in the request pipeline.
 * They operate across multiple transactions, not a single payment request.
 */

export type OpsAgentType = 'settlement' | 'reconciliation' | 'fraud' | 'aml' | 'ops'

export type OpsVerdict = 'ok' | 'action_taken' | 'escalated' | 'error'

export interface OpsRunResult {
  agentType: OpsAgentType
  verdict: OpsVerdict
  summary: string
  itemsProcessed: number
  actionsPerformed: string[]
  escalations: string[]
  errors: string[]
  durationMs: number
}

/** Base interface all operations agents implement */
export interface OpsAgent {
  readonly type: OpsAgentType
  readonly name: string
  run(): Promise<OpsRunResult>
}
