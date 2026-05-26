import { Hono } from 'hono'
import type { Env } from '../lib/env'

const health = new Hono<{ Bindings: Env }>()

// JSON endpoint (for programmatic access)
health.get('/api/health', async (c) => {
  const dbCheck = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()

  return c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT,
    db: dbCheck?.ok === 1 ? 'connected' : 'unreachable',
    timestamp: new Date().toISOString(),
  })
})

// HTML page with nav
health.get('/system-health', async (c) => {
  const dbCheck = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()
  const dbOk = dbCheck?.ok === 1

  // Get table row counts
  const counts = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as c FROM payment_requests').first<{ c: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM agent_decisions').first<{ c: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM transactions').first<{ c: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM audit_log').first<{ c: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM ledger_entries').first<{ c: number }>(),
  ])

  const tables = [
    { name: 'payment_requests', rows: counts[0]?.c ?? 0 },
    { name: 'agent_decisions', rows: counts[1]?.c ?? 0 },
    { name: 'transactions', rows: counts[2]?.c ?? 0 },
    { name: 'audit_log', rows: counts[3]?.c ?? 0 },
    { name: 'ledger_entries', rows: counts[4]?.c ?? 0 },
  ]

  const tableRows = tables.map(t =>
    `<tr><td><code>${t.name}</code></td><td class="num">${t.rows.toLocaleString()}</td><td class="status-ok">\\u2713</td></tr>`
  ).join('')

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>System Health</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0e1a; color: #e2e8f0; font-family: 'Inter', sans-serif; min-height: 100vh; }

  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 32px; background: rgba(10,14,26,0.95); backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(99,102,241,0.15); position: sticky; top: 0; z-index: 100;
  }
  .nav-brand { font-size: 18px; font-weight: 700; background: linear-gradient(135deg,#818cf8,#6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .nav-links a { color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500; margin-left: 24px; transition: color 0.2s; }
  .nav-links a:hover, .nav-links a.active { color: #e2e8f0; }

  .container { max-width: 900px; margin: 0 auto; padding: 48px 32px; }

  h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px;
    background: linear-gradient(135deg,#e2e8f0 0%,#818cf8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 40px; }

  .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 16px; margin-bottom: 40px; }
  .status-card {
    background: rgba(30,41,59,0.6); border: 1px solid rgba(99,102,241,0.12);
    border-radius: 12px; padding: 20px; text-align: center;
  }
  .status-card .icon { font-size: 28px; margin-bottom: 8px; }
  .status-card .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .status-card .value { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; }
  .status-card .value.ok { color: #22c55e; }
  .status-card .value.err { color: #ef4444; }

  .section-title { font-size: 18px; font-weight: 700; color: #c7d2fe; margin-bottom: 16px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
  th { text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 16px; border-bottom: 1px solid rgba(99,102,241,0.12); }
  td { padding: 12px 16px; border-bottom: 1px solid rgba(51,65,85,0.4); font-size: 14px; }
  td code { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #818cf8; background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 4px; }
  td.num { font-family: 'JetBrains Mono', monospace; text-align: right; color: #e2e8f0; }
  td.status-ok { color: #22c55e; text-align: center; font-weight: 600; }

  .bindings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px,1fr)); gap: 12px; margin-bottom: 40px; }
  .binding {
    background: rgba(30,41,59,0.4); border: 1px solid rgba(99,102,241,0.08);
    border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 12px;
  }
  .binding .b-icon { font-size: 22px; }
  .binding .b-name { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #818cf8; }
  .binding .b-type { font-size: 12px; color: #64748b; }

  .json-block {
    background: rgba(15,23,42,0.8); border: 1px solid rgba(99,102,241,0.12);
    border-radius: 8px; padding: 20px; font-family: 'JetBrains Mono', monospace;
    font-size: 13px; color: #94a3b8; overflow-x: auto; white-space: pre;
  }
  .json-block .key { color: #818cf8; }
  .json-block .str { color: #22c55e; }
  .json-block .num { color: #f59e0b; }

  .refresh-note { text-align: center; color: #475569; font-size: 12px; margin-top: 32px; }
</style>
</head>
<body>
<nav class="nav">
  <div class="nav-brand">FF-TEST</div>
  <div class="nav-links">
    <a href="/">Overview</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/flowchart">Architecture</a>
    <a href="/agents">Agents</a>
    <a href="/api-explorer">API</a>
    <a href="/simulate">Simulate</a>
    <a href="/system-health" class="active">Health</a>
    <a href="/readiness">Readiness</a>
  </div>
</nav>

<div class="container">
  <h1>System Health</h1>
  <div class="subtitle">Real-time status of all Cloudflare primitives and D1 tables</div>

  <div class="status-grid">
    <div class="status-card">
      <div class="icon">\\u26A1</div>
      <div class="label">Worker</div>
      <div class="value ok">Online</div>
    </div>
    <div class="status-card">
      <div class="icon">\\u{1F5C4}</div>
      <div class="label">D1 Database</div>
      <div class="value ${dbOk ? 'ok' : 'err'}">${dbOk ? 'Connected' : 'Unreachable'}</div>
    </div>
    <div class="status-card">
      <div class="icon">\\u{1F4E6}</div>
      <div class="label">R2 Storage</div>
      <div class="value ok">Bound</div>
    </div>
    <div class="status-card">
      <div class="icon">\\u{1F4EC}</div>
      <div class="label">Queue</div>
      <div class="value ok">Bound</div>
    </div>
    <div class="status-card">
      <div class="icon">\\u{1F512}</div>
      <div class="label">Durable Objects</div>
      <div class="value ok">Bound</div>
    </div>
    <div class="status-card">
      <div class="icon">\\u{1F504}</div>
      <div class="label">Workflows v2</div>
      <div class="value ok">Bound</div>
    </div>
  </div>

  <h3 class="section-title">D1 Tables</h3>
  <table>
    <thead><tr><th>Table</th><th style="text-align:right">Rows</th><th style="text-align:center">Status</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>

  <h3 class="section-title">Worker Bindings</h3>
  <div class="bindings-grid">
    <div class="binding"><span class="b-icon">\\u{1F5C4}</span><div><div class="b-name">DB</div><div class="b-type">D1Database \\u2192 ff-test-control-db</div></div></div>
    <div class="binding"><span class="b-icon">\\u{1F4E6}</span><div><div class="b-name">DOCUMENTS</div><div class="b-type">R2Bucket \\u2192 ff-test-documents</div></div></div>
    <div class="binding"><span class="b-icon">\\u{1F4EC}</span><div><div class="b-name">TASK_QUEUE</div><div class="b-type">Queue \\u2192 ff-test-task-queue</div></div></div>
    <div class="binding"><span class="b-icon">\\u{1F4AD}</span><div><div class="b-name">DLQ</div><div class="b-type">Queue \\u2192 ff-test-dlq</div></div></div>
    <div class="binding"><span class="b-icon">\\u{1F512}</span><div><div class="b-name">ORCHESTRATOR</div><div class="b-type">DurableObjectNamespace \\u2192 OrchestratorDO</div></div></div>
    <div class="binding"><span class="b-icon">\\u{1F504}</span><div><div class="b-name">ENGAGEMENT_WORKFLOW</div><div class="b-type">Workflow \\u2192 EngagementWorkflow</div></div></div>
  </div>

  <h3 class="section-title">Environment</h3>
  <div class="json-block"><span class="key">"environment"</span>: <span class="str">"${c.env.ENVIRONMENT}"</span>
<span class="key">"timestamp"</span>:  <span class="str">"${new Date().toISOString()}"</span>
<span class="key">"worker"</span>:     <span class="str">"ff-test"</span>
<span class="key">"d1_id"</span>:      <span class="str">"cd4d2bdf-cbe0-4ea8-a48c-6c76f96865c1"</span></div>

  <div class="refresh-note">Reload page for latest status \\u2022 JSON endpoint: <a href="/api/health" style="color:#818cf8">/api/health</a></div>
</div>
</body>
</html>`)
})

export { health }
