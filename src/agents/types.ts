/** Shared types for the payment pipeline agents */

export type Verdict = 'green' | 'amber' | 'red'

export type AgentType = 'validate' | 'quote' | 'screen' | 'execute' | 'reconcile'

export interface PaymentRequest {
  id: string
  clientId: string
  clientName: string
  amountCents: number
  currencyFrom: string
  currencyTo: string
  description?: string
}

export interface AgentResult {
  agentType: AgentType
  verdict: Verdict
  action: string
  reasoning: string
  detail: Record<string, unknown>
  durationMs: number
}

export interface PipelineResult {
  requestId: string
  status: 'APPROVED' | 'ESCALATED' | 'REJECTED'
  agentResults: AgentResult[]
  escalationReason?: string
  resolvedBy: 'auto' | string
  totalDurationMs: number
}

/** Base interface all pipeline agents implement */
export interface PipelineAgent {
  readonly type: AgentType
  readonly name: string
  evaluate(request: PaymentRequest): Promise<AgentResult>
}
