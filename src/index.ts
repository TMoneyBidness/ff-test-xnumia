import { Hono } from 'hono'
import type { Env } from './lib/env'
import { health } from './router/health'
import { transactions } from './router/transactions'
import { webhooks } from './router/webhooks'
import { dashboard } from './router/dashboard'
import { mcp } from './router/mcp'
import { mcpManifest } from './router/mcp-manifest'
import { flowchart } from './router/flowchart'
import { agentsDetail } from './router/agents-detail'
import { apiExplorer } from './router/api-explorer'
import { landing } from './router/landing'
import { readiness } from './router/readiness'
import { simulate } from './router/simulate'
import { bridgeSimulator } from './router/bridge-simulator'
import { handleQueue } from './queue/consumer'
import { runOpsAgents } from './agents/ops-runner'

// Re-export Durable Object and Workflow classes for Cloudflare runtime
export { OrchestratorDO } from './durable-objects/orchestrator'
export { EngagementWorkflow } from './workflows/engagement'

const app = new Hono<{ Bindings: Env }>()

// Mount route groups
app.route('/', landing)
app.route('/', health)
app.route('/', transactions)
app.route('/', webhooks)
app.route('/', dashboard)
app.route('/', mcp)
app.route('/', mcpManifest)
app.route('/', flowchart)
app.route('/', agentsDetail)
app.route('/', apiExplorer)
app.route('/', readiness)
app.route('/', simulate)
app.route('/', bridgeSimulator)

// Trigger all 5 operations agents manually
app.post('/ops/run', async (c) => {
  const results = await runOpsAgents(c.env)
  return c.json({ results, ranAt: new Date().toISOString() })
})

// Worker export — fetch handler + queue consumer
export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<{ type: string; payload: Record<string, unknown> }>, env: Env): Promise<void> {
    await handleQueue(batch, env)
  },
}
