import { Hono } from 'hono'
import type { Env } from '../lib/env'

const readiness = new Hono<{ Bindings: Env }>()

// ── Readiness data (hardcoded config — changes with code deploys) ──────────

interface ReadinessItem {
  name: string
  status: 'live' | 'mock' | 'stub' | 'not_started'
  detail: string
  blocker?: string
}

interface ReadinessCategory {
  score: number
  items: ReadinessItem[]
}

interface ReadinessReport {
  overall: number
  infrastructure: ReadinessCategory
  integrations: ReadinessCategory
  operations: ReadinessCategory
  compliance: ReadinessCategory
}

function getReadinessReport(): ReadinessReport {
  return {
    overall: 25,
    infrastructure: {
      score: 85,
      items: [
        { name: 'Worker runtime', status: 'live', detail: 'Hono on Cloudflare Workers, deployed and serving traffic' },
        { name: 'D1 database', status: 'live', detail: 'Connected, 17 tables across 2 migrations' },
        { name: 'R2 storage', status: 'live', detail: 'DOCUMENTS bucket bound for compliance artifacts' },
        { name: 'Queue', status: 'live', detail: 'TASK_QUEUE bound with DLQ for poison messages' },
        { name: 'Durable Objects', status: 'live', detail: 'ORCHESTRATOR namespace bound for transaction state machines' },
        { name: 'Workflows v2', status: 'live', detail: 'ENGAGEMENT_WORKFLOW bound for durable multi-step flows' },
      ],
    },
    integrations: {
      score: 20,
      items: [
        { name: 'Stripe (PSP)', status: 'mock', detail: 'Port interface defined, mock adapter returns synthetic responses', blocker: 'Stripe Connect onboarding (Phase 1 PSP)' },
        { name: 'Bridge (stablecoin)', status: 'mock', detail: 'Port interface defined, mock adapter for USDC mint/burn', blocker: 'Bridge API access approval' },
        { name: 'Zero Hash (exchange)', status: 'not_started', detail: 'Deferred to Phase 2 — alternative exchange partner', blocker: 'MSB license required' },
        { name: 'Accounting software', status: 'mock', detail: 'Mock adapter writes synthetic journal entries', blocker: 'QuickBooks/Xero API integration' },
        { name: 'Sanctions screening', status: 'stub', detail: 'Stub checks 3 hardcoded names, no real list provider', blocker: 'OFAC/sanctions list API subscription' },
        { name: 'KYC verification', status: 'stub', detail: 'Stub returns synthetic verification results', blocker: 'KYC provider selection and integration' },
        { name: 'Bank aggregator', status: 'not_started', detail: 'No adapter built — needed for direct bank connections in Phase 2', blocker: 'MSB license + aggregator partnership' },
      ],
    },
    operations: {
      score: 10,
      items: [
        { name: 'Transaction pipeline', status: 'mock', detail: 'Full validate-quote-screen-execute-reconcile flow working with mock adapters' },
        { name: 'Settlement agent', status: 'not_started', detail: 'Not built — manages fiat-to-stablecoin settlement lifecycle', blocker: 'Live PSP and exchange integrations' },
        { name: 'Reconciliation agent', status: 'not_started', detail: 'Not built — three-way recon across bank/exchange/accounting', blocker: 'Live integrations + reconciliation_exceptions table' },
        { name: 'Fraud detection agent', status: 'not_started', detail: 'Not built — velocity checks, pattern detection, dispute handling', blocker: 'Transaction volume for model training' },
        { name: 'AML monitoring agent', status: 'not_started', detail: 'Not built — ongoing transaction monitoring for suspicious activity', blocker: 'Sanctions API + regulatory framework' },
        { name: 'Payments ops agent', status: 'not_started', detail: 'Not built — exception handling, retry orchestration, escalation', blocker: 'Live payment flow for exception generation' },
      ],
    },
    compliance: {
      score: 5,
      items: [
        { name: 'Audit trail', status: 'live', detail: 'All agent decisions logged to agent_decisions table, audit_log for system events' },
        { name: 'Human escalation', status: 'live', detail: 'Workflow step pauses and creates escalation record for manual review' },
        { name: 'Dual settlement', status: 'not_started', detail: 'Not built — fiat and stablecoin legs settled independently with proof', blocker: 'Live PSP + exchange integrations' },
        { name: 'Three-way reconciliation', status: 'not_started', detail: 'Not built — bank statement vs exchange ledger vs accounting', blocker: 'Live integrations across all three systems' },
        { name: 'Sanctions screening', status: 'stub', detail: '3 hardcoded names checked, no real OFAC/UN list', blocker: 'Sanctions list API subscription' },
        { name: 'KYC verification', status: 'stub', detail: 'Stub returns synthetic pass/fail, no real document verification', blocker: 'KYC provider integration' },
        { name: 'FINTRAC reporting', status: 'not_started', detail: 'Not built — LCTR, EFTR, STR, TPR report generation and submission', blocker: 'MSB license + FINTRAC API access' },
        { name: 'R2 evidence storage', status: 'not_started', detail: 'Not built — structured compliance artifact retention with 7-year policy', blocker: 'Evidence schema + retention automation' },
      ],
    },
  }
}

// ── JSON API ───────────────────────────────────────────────────────────────

readiness.get('/api/readiness', (c) => {
  return c.json(getReadinessReport())
})

// ── HTML Page ──────────────────────────────────────────────────────────────

readiness.get('/readiness', (c) => {
  const data = getReadinessReport()
  return c.html(buildReadinessHTML(data))
})

function buildReadinessHTML(data: ReadinessReport): string {
  const statusColor = (s: string) => {
    switch (s) {
      case 'live': return '#22c55e'
      case 'mock': return '#f59e0b'
      case 'stub': return '#3b82f6'
      case 'not_started': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case 'live': return 'Live'
      case 'mock': return 'Mock'
      case 'stub': return 'Stub'
      case 'not_started': return 'Not Started'
      default: return s
    }
  }

  function renderItems(items: ReadinessItem[]): string {
    return items
      .map(
        (item) => `
      <div class="item-row">
        <div class="item-dot" style="background: ${statusColor(item.status)}; box-shadow: 0 0 8px ${statusColor(item.status)}55;"></div>
        <div class="item-info">
          <div class="item-name">${esc(item.name)}</div>
          <div class="item-detail">${esc(item.detail)}</div>
          ${item.blocker ? `<div class="item-blocker">Blocker: ${esc(item.blocker)}</div>` : ''}
        </div>
        <div class="item-badge" style="background: ${statusColor(item.status)}20; color: ${statusColor(item.status)}; border: 1px solid ${statusColor(item.status)}33;">${statusLabel(item.status)}</div>
      </div>`
      )
      .join('')
  }

  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function renderCategory(title: string, cat: ReadinessCategory): string {
    return `
    <div class="category-card">
      <div class="category-header">
        <div class="category-title">${esc(title)}</div>
        <div class="category-score">
          <svg class="ring" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="${cat.score >= 70 ? '#22c55e' : cat.score >= 30 ? '#f59e0b' : '#ef4444'}" stroke-width="3"
              stroke-dasharray="${cat.score} ${100 - cat.score}" stroke-dashoffset="25" stroke-linecap="round"/>
          </svg>
          <span class="ring-label">${cat.score}%</span>
        </div>
      </div>
      <div class="items-list">
        ${renderItems(cat.items)}
      </div>
    </div>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Xnumia — Platform Readiness</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #020617;
    --card: #0f172a;
    --card-border: rgba(99, 102, 241, 0.12);
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --text-dim: #64748b;
    --green: #22c55e;
    --amber: #f59e0b;
    --red: #ef4444;
    --blue: #3b82f6;
    --indigo: #6366f1;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.5;
  }

  /* ── Nav ──────────────────────────────────── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px;
    background: rgba(2, 6, 23, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
  }
  .nav-brand {
    font-size: 18px; font-weight: 700;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .nav-links a {
    color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500;
    margin-left: 24px; transition: color 0.2s;
  }
  .nav-links a:hover, .nav-links a.active { color: #f8fafc; }

  /* ── Hero ─────────────────────────────────── */
  .hero {
    padding: 120px 32px 60px;
    text-align: center;
  }
  .hero h1 {
    font-size: 42px; font-weight: 800;
    background: linear-gradient(135deg, #e2e8f0 0%, #818cf8 50%, #6366f1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 16px;
  }
  .hero-subtitle {
    font-size: 16px; color: var(--text-muted); margin-bottom: 40px;
  }

  /* ── Overall progress ring ───────────────── */
  .overall-ring {
    position: relative;
    width: 180px; height: 180px;
    margin: 0 auto 16px;
  }
  .overall-ring svg {
    width: 180px; height: 180px;
    transform: rotate(-90deg);
  }
  .overall-ring .track {
    fill: none; stroke: rgba(255,255,255,0.04); stroke-width: 8;
  }
  .overall-ring .progress {
    fill: none; stroke: url(#overallGrad); stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: ${data.overall * 3.14159 * 70 / 100} ${3.14159 * 70};
    transition: stroke-dasharray 1s ease;
  }
  .overall-label {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    text-align: center;
  }
  .overall-pct {
    font-size: 48px; font-weight: 800;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .overall-text {
    font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em;
  }

  /* ── Container ───────────────────────────── */
  .container { max-width: 1100px; margin: 0 auto; padding: 0 32px 80px; }

  /* ── Legend ───────────────────────────────── */
  .legend {
    display: flex; justify-content: center; gap: 28px;
    margin-bottom: 48px; flex-wrap: wrap;
  }
  .legend-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: var(--text-muted);
  }
  .legend-dot {
    width: 10px; height: 10px; border-radius: 50%;
  }

  /* ── Category cards ──────────────────────── */
  .categories {
    display: grid; grid-template-columns: 1fr; gap: 24px;
  }
  .category-card {
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    overflow: hidden;
  }
  .category-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px 28px;
    border-bottom: 1px solid var(--card-border);
  }
  .category-title {
    font-size: 20px; font-weight: 700; color: var(--text);
  }
  .category-score {
    position: relative; width: 48px; height: 48px;
  }
  .ring {
    width: 48px; height: 48px; transform: rotate(-90deg);
  }
  .ring-label {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    font-size: 12px; font-weight: 700; color: var(--text);
  }

  /* ── Item rows ───────────────────────────── */
  .items-list {
    padding: 8px 0;
  }
  .item-row {
    display: flex; align-items: flex-start; gap: 16px;
    padding: 14px 28px;
    transition: background 0.15s;
  }
  .item-row:hover {
    background: rgba(99, 102, 241, 0.04);
  }
  .item-dot {
    width: 10px; height: 10px; border-radius: 50%;
    margin-top: 6px; flex-shrink: 0;
  }
  .item-info {
    flex: 1; min-width: 0;
  }
  .item-name {
    font-size: 14px; font-weight: 600; color: var(--text);
    margin-bottom: 2px;
  }
  .item-detail {
    font-size: 13px; color: var(--text-muted); line-height: 1.5;
  }
  .item-blocker {
    font-size: 12px; color: var(--red); margin-top: 4px;
    font-style: italic;
  }
  .item-badge {
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    padding: 3px 10px; border-radius: 6px;
    white-space: nowrap; flex-shrink: 0; margin-top: 2px;
  }

  /* ── Responsive ──────────────────────────── */
  @media (max-width: 640px) {
    .hero h1 { font-size: 28px; }
    .category-header { padding: 16px 20px; }
    .item-row { padding: 12px 20px; flex-wrap: wrap; }
    .item-badge { margin-left: 26px; }
    .legend { gap: 16px; }
  }
</style>
</head>
<body>
<nav class="nav">
  <div class="nav-brand">XNUMIA</div>
  <div class="nav-links">
    <a href="/">Overview</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/flowchart">Architecture</a>
    <a href="/agents">Agents</a>
    <a href="/api-explorer">API</a>
    <a href="/simulate">Simulate</a>
    <a href="/readiness" class="active">Readiness</a>
  </div>
</nav>

<div class="hero">
  <h1>Platform Readiness</h1>
  <p class="hero-subtitle">System, integration, and compliance readiness for production launch</p>

  <div class="overall-ring">
    <svg viewBox="0 0 180 180">
      <defs>
        <linearGradient id="overallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#818cf8"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
      </defs>
      <circle class="track" cx="90" cy="90" r="70"/>
      <circle class="progress" cx="90" cy="90" r="70"/>
    </svg>
    <div class="overall-label">
      <div class="overall-pct">${data.overall}%</div>
      <div class="overall-text">Overall</div>
    </div>
  </div>
</div>

<div class="container">
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background: var(--green);"></div> Live</div>
    <div class="legend-item"><div class="legend-dot" style="background: var(--amber);"></div> Mock</div>
    <div class="legend-item"><div class="legend-dot" style="background: var(--blue);"></div> Stub</div>
    <div class="legend-item"><div class="legend-dot" style="background: var(--red);"></div> Not Started</div>
  </div>

  <div class="categories">
    ${renderCategory('Infrastructure', data.infrastructure)}
    ${renderCategory('Integrations', data.integrations)}
    ${renderCategory('Operations', data.operations)}
    ${renderCategory('Compliance', data.compliance)}
  </div>
</div>

</body>
</html>`
}

export { readiness }
