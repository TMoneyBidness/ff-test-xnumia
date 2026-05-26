import { Hono } from 'hono'
import type { Env } from '../lib/env'

const landing = new Hono<{ Bindings: Env }>()

landing.get('/', (c) => {
  return c.html(LANDING_HTML)
})

export { landing }

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Xnumia — Agent-run Stablecoin Orchestration</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    background: #020617;
    color: #f8fafc;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
    line-height: 1.6;
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

  /* ── Shared ──────────────────────────────── */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
  .section { padding: 80px 0; }
  .section-title {
    font-size: 28px; font-weight: 700; margin-bottom: 12px;
    color: #f8fafc;
  }
  .section-subtitle {
    font-size: 15px; color: #94a3b8; margin-bottom: 48px;
    max-width: 600px;
  }
  .card {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 12px;
    padding: 28px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .card:hover {
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }
  .mono {
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Hero ─────────────────────────────────── */
  .hero {
    padding: 120px 32px 32px;
    text-align: center;
  }
  .hero h1 {
    font-size: 64px; font-weight: 800;
    background: linear-gradient(135deg, #f8fafc 0%, #818cf8 50%, #6366f1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 12px;
    letter-spacing: -2px;
  }
  .hero .tagline {
    font-size: 18px; color: #818cf8; font-weight: 500;
    margin-bottom: 16px;
    font-family: 'JetBrains Mono', monospace;
  }
  .hero .one-liner {
    font-size: 15px; color: #94a3b8; max-width: 640px; margin: 0 auto;
    line-height: 1.7;
  }

  /* ── System Diagram ──────────────────────── */
  .diagram {
    max-width: 1200px; margin: 0 auto;
    padding: 32px 32px 64px;
    display: flex; flex-direction: column; align-items: center; gap: 0;
  }

  /* Connector lines between rows */
  .connector-v {
    width: 2px; height: 32px;
    background: #6366f1;
    flex-shrink: 0;
  }
  .connector-v.dim {
    background: #334155;
  }
  .connector-v.dotted {
    background: none;
    border-left: 2px dotted #334155;
    width: 0;
  }
  .connector-label {
    font-size: 11px; color: #475569;
    font-family: 'JetBrains Mono', monospace;
    text-align: center; padding: 6px 0;
  }

  /* Row 1: Entry Points */
  .entry-row {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 16px; width: 100%;
  }
  .entry-card {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 12px; padding: 20px; text-align: center;
    position: relative;
    transition: border-color 0.2s;
  }
  .entry-card:hover { border-color: rgba(99, 102, 241, 0.3); }
  .entry-card .entry-title {
    font-size: 14px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;
  }
  .entry-card .entry-route {
    font-size: 11px; font-family: 'JetBrains Mono', monospace;
    color: #6366f1; margin-bottom: 6px;
  }
  .entry-card .entry-label {
    font-size: 11px; color: #475569; font-weight: 500;
  }
  .entry-card.webhook .entry-route { color: #f59e0b; }

  /* Entry arrows */
  .entry-arrows {
    display: grid; grid-template-columns: 1fr 1fr 1fr; width: 100%;
  }
  .entry-arrow-cell {
    display: flex; justify-content: center;
  }
  .entry-arrow-cell .connector-v { height: 24px; }
  .entry-arrow-cell.dotted .connector-v {
    background: none; border-left: 2px dotted #334155; width: 0;
  }

  /* Row 2: Worker */
  .worker-card {
    background: #0f172a;
    border: 2px solid rgba(99, 102, 241, 0.25);
    border-radius: 12px; padding: 20px 28px;
    text-align: center; width: 100%;
    transition: border-color 0.2s;
  }
  .worker-card:hover { border-color: rgba(99, 102, 241, 0.45); }
  .worker-card .worker-title {
    font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;
  }
  .worker-card .worker-meta {
    font-size: 11px; color: #475569;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Row 3: Pipeline */
  .pipeline-section { width: 100%; }
  .pipeline-flow {
    display: flex; align-items: center; justify-content: center;
    gap: 0; width: 100%;
  }
  .pipeline-card {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 12px; padding: 16px 14px;
    text-align: center; flex: 1;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    position: relative;
    text-decoration: none; color: inherit;
    display: block;
  }
  .pipeline-card:hover {
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.15);
  }
  .pipeline-card .p-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
    display: inline-block; margin-bottom: 6px;
  }
  .pipeline-card .p-name {
    font-size: 13px; font-weight: 700; color: #f8fafc; margin-bottom: 2px;
  }
  .pipeline-card .p-desc {
    font-size: 10px; color: #475569; line-height: 1.4;
  }
  .pipeline-arrow {
    width: 28px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    color: #6366f1; font-size: 14px; font-weight: 700;
  }
  .pipeline-meta {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 10px; padding: 0 4px;
  }
  .pipeline-meta .meta-label {
    font-size: 11px; color: #475569;
    font-family: 'JetBrains Mono', monospace;
  }
  .pipeline-meta a {
    font-size: 12px; color: #6366f1; text-decoration: none; font-weight: 600;
    transition: color 0.2s;
  }
  .pipeline-meta a:hover { color: #818cf8; }

  /* Row 4: Connector with label */
  .connector-row {
    display: flex; flex-direction: column; align-items: center;
  }

  /* Row 5: Ops Agents */
  .ops-section { width: 100%; }
  .ops-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; width: 100%;
  }
  .ops-card {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 12px; padding: 16px;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ops-card:hover {
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.12);
  }
  .ops-card .ops-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
  }
  .ops-card .ops-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
    flex-shrink: 0;
  }
  .ops-card .ops-name {
    font-size: 13px; font-weight: 700; color: #f8fafc;
  }
  .ops-card .ops-desc {
    font-size: 11px; color: #475569; line-height: 1.5;
  }
  .ops-meta {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 12px; padding: 0 4px;
  }
  .ops-meta .meta-label {
    font-size: 11px; color: #475569;
    font-family: 'JetBrains Mono', monospace;
  }
  .ops-trigger-btn {
    font-size: 12px; font-weight: 600;
    color: #6366f1; background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 8px; padding: 6px 14px;
    cursor: pointer; transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .ops-trigger-btn:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
  }
  .ops-trigger-btn:disabled {
    opacity: 0.5; cursor: not-allowed;
  }
  .ops-result {
    display: none; margin-top: 8px; padding: 10px 14px;
    background: #020617; border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: 8px; font-size: 12px; color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
  }
  .ops-result.visible { display: block; }

  /* Row 6: Infrastructure Bar */
  .infra-bar {
    display: flex; gap: 8px; width: 100%;
    flex-wrap: wrap; justify-content: center;
  }
  .infra-pill {
    display: flex; align-items: center; gap: 6px;
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 20px; padding: 8px 16px;
    font-size: 12px; font-weight: 500; color: #94a3b8;
    cursor: pointer; transition: border-color 0.2s;
    text-decoration: none;
  }
  .infra-pill:hover { border-color: rgba(99, 102, 241, 0.35); }
  .infra-pill .infra-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #6366f1;
    box-shadow: 0 0 6px rgba(99, 102, 241, 0.4);
    flex-shrink: 0;
  }

  /* Row 7: External Integrations (diagram row) */
  .ext-row {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 12px; width: 100%;
  }
  .ext-card {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 12px; padding: 14px;
    transition: border-color 0.2s;
  }
  .ext-card:hover { border-color: rgba(99, 102, 241, 0.3); }
  .ext-card .ext-header {
    display: flex; align-items: center; gap: 6px; margin-bottom: 4px;
  }
  .ext-card .ext-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
    flex-shrink: 0;
  }
  .ext-card .ext-name {
    font-size: 13px; font-weight: 700; color: #f8fafc;
  }
  .ext-card .ext-port {
    font-size: 10px; color: #6366f1;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 2px;
  }
  .ext-card .ext-status {
    font-size: 10px; color: #475569;
  }

  /* ── Stats Bar ───────────────────────────── */
  .stats-bar {
    display: flex; justify-content: center; gap: 40px;
    padding: 24px 32px;
    border-top: 1px solid rgba(99, 102, 241, 0.08);
    border-bottom: 1px solid rgba(99, 102, 241, 0.08);
    background: rgba(15, 23, 42, 0.4);
    flex-wrap: wrap;
  }
  .stat-item {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
  }
  .stat-value {
    font-size: 22px; font-weight: 700; color: #f8fafc;
    font-family: 'JetBrains Mono', monospace;
    transition: opacity 0.3s;
  }
  .stat-value.loading { opacity: 0.3; }
  .stat-label {
    font-size: 11px; color: #475569; font-weight: 500;
  }
  .stat-label a {
    color: #6366f1; text-decoration: none;
    transition: color 0.2s;
  }
  .stat-label a:hover { color: #818cf8; }

  /* ── External Integrations (existing) ────── */
  .integrations-layout {
    display: flex; flex-direction: column; align-items: center; gap: 40px;
  }
  .hub {
    display: flex; align-items: center; justify-content: center;
    width: 140px; height: 140px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.1));
    border: 2px solid rgba(99, 102, 241, 0.4);
    font-weight: 700; font-size: 15px; text-align: center;
    color: #818cf8; line-height: 1.4;
    flex-shrink: 0;
  }
  .spokes {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; width: 100%;
  }
  .spoke-card {
    position: relative;
  }
  .spoke-card.phase1-only {
    border-style: dashed;
    border-color: rgba(245, 158, 11, 0.4);
  }
  .spoke-card .spoke-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  }
  .spoke-card h3 {
    font-size: 15px; font-weight: 700; color: #f8fafc;
  }
  .spoke-port {
    font-size: 12px; color: #818cf8;
    font-family: 'JetBrains Mono', monospace;
  }
  .spoke-desc {
    font-size: 13px; color: #94a3b8; margin-bottom: 12px; line-height: 1.6;
  }
  .spoke-methods {
    font-size: 12px; color: #6366f1;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 8px; line-height: 1.8;
  }
  .spoke-status {
    font-size: 12px; color: #64748b; font-style: italic;
  }
  .phase1-badge {
    display: inline-block;
    font-size: 10px; font-weight: 600;
    padding: 2px 8px; border-radius: 4px;
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .spoke-connector {
    width: 2px; height: 32px;
    background: linear-gradient(to bottom, rgba(99, 102, 241, 0.4), rgba(99, 102, 241, 0.1));
    margin: 0 auto;
  }

  /* ── API Surface ─────────────────────────── */
  .api-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .api-card {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 20px;
  }
  .method-badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 4px 10px; border-radius: 6px;
    font-size: 11px; font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.5px;
    flex-shrink: 0; min-width: 52px;
    text-align: center;
  }
  .method-badge.post { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  .method-badge.get { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
  .api-info { flex: 1; }
  .api-endpoint {
    font-size: 13px; font-weight: 600; color: #f8fafc;
    font-family: 'JetBrains Mono', monospace;
  }
  .api-desc {
    font-size: 12px; color: #94a3b8; margin-top: 2px;
  }

  /* ── Principles ──────────────────────────── */
  .principles-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  .principle-card {
    border-left: 3px solid #6366f1;
    padding-left: 24px;
  }
  .principle-card h3 {
    font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 8px;
  }
  .principle-card p {
    font-size: 14px; color: #94a3b8; line-height: 1.7;
  }

  /* ── Footer ──────────────────────────────── */
  .footer {
    text-align: center; padding: 48px 32px;
    border-top: 1px solid rgba(99, 102, 241, 0.1);
    color: #64748b; font-size: 13px;
  }

  /* ── Responsive ──────────────────────────── */
  @media (max-width: 900px) {
    .hero h1 { font-size: 48px; }
    .entry-row { grid-template-columns: 1fr; }
    .entry-arrows { display: none; }
    .pipeline-flow { flex-direction: column; gap: 8px; }
    .pipeline-arrow { transform: rotate(90deg); width: auto; height: 20px; }
    .ops-grid { grid-template-columns: 1fr; }
    .ext-row { grid-template-columns: 1fr 1fr; }
    .infra-bar { gap: 6px; }
    .connector-v { display: none; }
    .connector-label { display: none; }
    .connector-row { display: none; }
    .spokes { grid-template-columns: 1fr; }
    .api-grid { grid-template-columns: 1fr; }
    .principles-grid { grid-template-columns: 1fr; }
    .stats-bar { gap: 20px; }
  }
  @media (max-width: 600px) {
    .hero h1 { font-size: 36px; letter-spacing: -1px; }
    .nav { padding: 12px 16px; }
    .nav-links a { margin-left: 12px; font-size: 12px; }
    .container { padding: 0 16px; }
    .diagram { padding: 16px 16px 48px; }
    .section { padding: 48px 0; }
    .ext-row { grid-template-columns: 1fr; }
    .stats-bar { gap: 16px; flex-direction: column; align-items: center; }
  }
</style>
</head>
<body>

<!-- ── Nav ──────────────────────────────────────────────────────────────── -->
<nav class="nav">
  <div class="nav-brand">XNUMIA</div>
  <div class="nav-links">
    <a href="/" class="active">Overview</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/flowchart">Architecture</a>
    <a href="/agents">Agents</a>
    <a href="/api-explorer">API</a>
    <a href="/simulate">Simulate</a>
    <a href="/readiness">Readiness</a>
  </div>
</nav>

<!-- ── Hero ─────────────────────────────────────────────────────────────── -->
<section class="hero">
  <h1>Xnumia</h1>
  <div class="tagline">Agent-run stablecoin orchestration</div>
  <p class="one-liner">10 autonomous agents run the entire payment operations stack. 5 process every transaction inline. 5 run the back office continuously. No human touches a clean payment.</p>
</section>

<!-- ── System Diagram ──────────────────────────────────────────────────── -->
<section class="diagram">

  <!-- Row 1: Entry Points -->
  <div class="entry-row">
    <div class="entry-card">
      <div class="entry-title">HTTPS API</div>
      <div class="entry-route">POST /mcp/submit-payment</div>
      <div class="entry-label">Payment Request</div>
    </div>
    <div class="entry-card webhook">
      <div class="entry-title">Webhooks</div>
      <div class="entry-route">Stripe, Bridge</div>
      <div class="entry-label">Provider Events</div>
    </div>
    <div class="entry-card">
      <div class="entry-title">Ops Trigger</div>
      <div class="entry-route">POST /ops/run or Cron</div>
      <div class="entry-label">Scheduled Cycle</div>
    </div>
  </div>

  <!-- Arrows from entry to worker -->
  <div class="entry-arrows">
    <div class="entry-arrow-cell"><div class="connector-v"></div></div>
    <div class="entry-arrow-cell dotted"><div class="connector-v"></div></div>
    <div class="entry-arrow-cell"><div class="connector-v"></div></div>
  </div>

  <!-- Row 2: Cloudflare Worker -->
  <div class="worker-card">
    <div class="worker-title">Cloudflare Worker &mdash; Hono Router</div>
    <div class="worker-meta">12+ routes &middot; D1, R2, Queue, DLQ, Durable Objects, Workflows v2</div>
  </div>

  <!-- Connector -->
  <div class="connector-v"></div>

  <!-- Row 3: Transaction Pipeline -->
  <div class="pipeline-section">
    <div class="pipeline-flow">
      <a href="/agents" class="pipeline-card">
        <div class="p-dot"></div>
        <div class="p-name">Validate</div>
        <div class="p-desc">Fields + KYC</div>
      </a>
      <div class="pipeline-arrow">&#9654;</div>
      <a href="/agents" class="pipeline-card">
        <div class="p-dot"></div>
        <div class="p-name">Quote</div>
        <div class="p-desc">FX rate</div>
      </a>
      <div class="pipeline-arrow">&#9654;</div>
      <a href="/agents" class="pipeline-card">
        <div class="p-dot"></div>
        <div class="p-name">Screen</div>
        <div class="p-desc">Sanctions + velocity</div>
      </a>
      <div class="pipeline-arrow">&#9654;</div>
      <a href="/agents" class="pipeline-card">
        <div class="p-dot"></div>
        <div class="p-name">Execute</div>
        <div class="p-desc">Move funds</div>
      </a>
      <div class="pipeline-arrow">&#9654;</div>
      <a href="/agents" class="pipeline-card">
        <div class="p-dot"></div>
        <div class="p-name">Reconcile</div>
        <div class="p-desc">Match ledger</div>
      </a>
    </div>
    <div class="pipeline-meta">
      <span class="meta-label">Per-request &middot; Inline &middot; &lt;500ms</span>
      <a href="/agents">See agent details &#9656;</a>
    </div>
  </div>

  <!-- Row 4: Connector with label -->
  <div class="connector-row">
    <div class="connector-v dim"></div>
    <div class="connector-label">Pipeline writes to D1, triggers DO state machine</div>
    <div class="connector-v dim"></div>
  </div>

  <!-- Row 5: Operations Agents -->
  <div class="ops-section">
    <div class="ops-grid">
      <div class="ops-card" onclick="window.location.href='/agents'">
        <div class="ops-header">
          <div class="ops-dot"></div>
          <div class="ops-name">Settlement</div>
        </div>
        <div class="ops-desc">Dual confirmation, advances DO to SETTLED</div>
      </div>
      <div class="ops-card" onclick="window.location.href='/agents'">
        <div class="ops-header">
          <div class="ops-dot"></div>
          <div class="ops-name">Reconciliation</div>
        </div>
        <div class="ops-desc">Three-way match, exception flagging</div>
      </div>
      <div class="ops-card" onclick="window.location.href='/agents'">
        <div class="ops-header">
          <div class="ops-dot"></div>
          <div class="ops-name">Fraud</div>
        </div>
        <div class="ops-desc">Velocity, structuring, amount anomaly detection</div>
      </div>
      <div class="ops-card" onclick="window.location.href='/agents'">
        <div class="ops-header">
          <div class="ops-dot"></div>
          <div class="ops-name">AML</div>
        </div>
        <div class="ops-desc">Sanctions screening, FINTRAC reporting</div>
      </div>
      <div class="ops-card" onclick="window.location.href='/agents'">
        <div class="ops-header">
          <div class="ops-dot"></div>
          <div class="ops-name">Payments Ops</div>
        </div>
        <div class="ops-desc">Stuck detection, retry, DLQ processing</div>
      </div>
    </div>
    <div class="ops-meta">
      <span class="meta-label">Back-office &middot; Scheduled &middot; Autonomous</span>
      <button class="ops-trigger-btn" id="ops-trigger-btn">Trigger ops cycle &#9656;</button>
    </div>
    <div class="ops-result" id="ops-result"></div>
  </div>

  <!-- Connector -->
  <div class="connector-v dim" style="margin-top: 12px;"></div>

  <!-- Row 6: Infrastructure Bar -->
  <div class="infra-bar">
    <a href="/system-health" class="infra-pill">
      <span class="infra-dot"></span> D1 (17 tables)
    </a>
    <a href="/system-health" class="infra-pill">
      <span class="infra-dot"></span> R2 (compliance evidence)
    </a>
    <a href="/system-health" class="infra-pill">
      <span class="infra-dot"></span> Queue + DLQ
    </a>
    <a href="/system-health" class="infra-pill">
      <span class="infra-dot"></span> Durable Objects
    </a>
    <a href="/system-health" class="infra-pill">
      <span class="infra-dot"></span> Workflows v2
    </a>
    <a href="/system-health" class="infra-pill">
      <span class="infra-dot"></span> Webhook Intake
    </a>
  </div>

  <!-- Connector -->
  <div class="connector-v dotted" style="margin-top: 12px;"></div>

  <!-- Row 7: External Integrations (compact) -->
  <div class="ext-row">
    <div class="ext-card">
      <div class="ext-header">
        <div class="ext-dot"></div>
        <div class="ext-name">Stripe</div>
      </div>
      <div class="ext-port">PSPPort</div>
      <div class="ext-status">Mock / Ready for sk_test_</div>
    </div>
    <div class="ext-card">
      <div class="ext-header">
        <div class="ext-dot"></div>
        <div class="ext-name">Bridge</div>
      </div>
      <div class="ext-port">ExchangePort</div>
      <div class="ext-status">Mock adapter</div>
    </div>
    <div class="ext-card">
      <div class="ext-header">
        <div class="ext-dot"></div>
        <div class="ext-name">Accounting</div>
      </div>
      <div class="ext-port">AccountingPort</div>
      <div class="ext-status">Mock adapter</div>
    </div>
    <div class="ext-card">
      <div class="ext-header">
        <div class="ext-dot"></div>
        <div class="ext-name">Sanctions</div>
      </div>
      <div class="ext-port">SanctionsCheck</div>
      <div class="ext-status">Mock / OFAC stub</div>
    </div>
  </div>

</section>

<!-- ── Live Stats Bar ──────────────────────────────────────────────────── -->
<div class="stats-bar">
  <div class="stat-item">
    <span class="stat-value loading" id="stat-payments">--</span>
    <span class="stat-label">Payments processed</span>
  </div>
  <div class="stat-item">
    <span class="stat-value loading" id="stat-decisions">--</span>
    <span class="stat-label">Agent decisions</span>
  </div>
  <div class="stat-item">
    <span class="stat-value" id="stat-tables">17</span>
    <span class="stat-label">D1 tables</span>
  </div>
  <div class="stat-item">
    <span class="stat-value loading" id="stat-readiness">--%</span>
    <span class="stat-label"><a href="/readiness">Readiness</a></span>
  </div>
</div>

<!-- ── External Integrations ───────────────────────────────────────────── -->
<section class="section">
  <div class="container">
    <h2 class="section-title">External Integrations</h2>
    <p class="section-subtitle">Port/Adapter pattern &mdash; every external system is behind a TypeScript interface.</p>
    <div class="integrations-layout">
      <div class="hub">Cloudflare<br>Worker</div>
      <div class="spoke-connector"></div>
      <div class="spokes">

        <div class="card spoke-card">
          <div class="spoke-header">
            <h3>Bank API</h3>
          </div>
          <div class="spoke-port">BankPort</div>
          <p class="spoke-desc">Fiat custody, ACH/EFT/wire transfers. Phase 1: via PSP bridge. Phase 2: direct connection.</p>
          <div class="spoke-methods">getBalance()<br>initiateTransfer()<br>getTransferStatus()</div>
          <p class="spoke-status">Currently: MockBankAdapter with simulated balances and settlement delays</p>
        </div>

        <div class="card spoke-card">
          <div class="spoke-header">
            <h3>Crypto Exchange</h3>
          </div>
          <div class="spoke-port">ExchangePort</div>
          <p class="spoke-desc">Stablecoin custody, fiat&harr;stablecoin conversion, rate quotes.</p>
          <div class="spoke-methods">getQuote()<br>convertFiatToStable()<br>convertStableToFiat()</div>
          <p class="spoke-status">Currently: MockExchangeAdapter with hardcoded rates (CAD-USDC: 0.73, etc.)</p>
        </div>

        <div class="card spoke-card phase1-only">
          <div class="spoke-header">
            <h3>PSP Bridge</h3>
            <span class="phase1-badge">Phase 1 Only</span>
          </div>
          <div class="spoke-port">PSPPort</div>
          <p class="spoke-desc">Regulatory bridge for Phase 1 (pre-MSB license). Routes payments through licensed provider.</p>
          <div class="spoke-methods">submitPayment()<br>getPaymentStatus()</div>
          <p class="spoke-status">Currently: MockPSPAdapter. Removed in Phase 2 when MSB license is issued.</p>
        </div>

        <div class="card spoke-card">
          <div class="spoke-header">
            <h3>Accounting Software</h3>
          </div>
          <div class="spoke-port">AccountingPort</div>
          <p class="spoke-desc">Reconciliation surface. Keeps client books in sync.</p>
          <div class="spoke-methods">createInvoice()<br>reconcileEntry()<br>getUnreconciledEntries()</div>
          <p class="spoke-status">Currently: MockAccountingAdapter. Production: Xero or QuickBooks API.</p>
        </div>

        <div class="card spoke-card">
          <div class="spoke-header">
            <h3>Sanctions Lists</h3>
          </div>
          <p class="spoke-desc">OFAC SDN, FINTRAC. Currently hardcoded mock. Production: live API feeds.</p>
        </div>

        <div class="card spoke-card">
          <div class="spoke-header">
            <h3>KYC Provider</h3>
          </div>
          <p class="spoke-desc">Identity verification. Currently mock. Production: Jumio, Onfido, or similar.</p>
        </div>

      </div>
    </div>
  </div>
</section>

<!-- ── API Surface ─────────────────────────────────────────────────────── -->
<section class="section" style="background: rgba(15, 23, 42, 0.5);">
  <div class="container">
    <h2 class="section-title">API Surface</h2>
    <p class="section-subtitle">Every endpoint available on the Worker.</p>
    <div class="api-grid">

      <div class="card api-card">
        <span class="method-badge post">POST</span>
        <div class="api-info">
          <div class="api-endpoint">/mcp/submit-payment</div>
          <div class="api-desc">Submit a payment request through the pipeline</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge get">GET</span>
        <div class="api-info">
          <div class="api-endpoint">/mcp/pipeline-status/:id</div>
          <div class="api-desc">Full status with all agent decisions</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge get">GET</span>
        <div class="api-info">
          <div class="api-endpoint">/mcp/escalated</div>
          <div class="api-desc">All payments awaiting human review</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge post">POST</span>
        <div class="api-info">
          <div class="api-endpoint">/mcp/approve/:id</div>
          <div class="api-desc">Approve an escalated payment</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge post">POST</span>
        <div class="api-info">
          <div class="api-endpoint">/mcp/reject/:id</div>
          <div class="api-desc">Reject with reason</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge get">GET</span>
        <div class="api-info">
          <div class="api-endpoint">/mcp/ask-why/:id/:agent</div>
          <div class="api-desc">Detailed reasoning from a specific agent</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge get">GET</span>
        <div class="api-info">
          <div class="api-endpoint">/mcp/activity</div>
          <div class="api-desc">Recent agent activity feed</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge post">POST</span>
        <div class="api-info">
          <div class="api-endpoint">/transactions</div>
          <div class="api-desc">Create a raw transaction (lower-level)</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge get">GET</span>
        <div class="api-info">
          <div class="api-endpoint">/transactions/:id</div>
          <div class="api-desc">Get transaction by ID</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge get">GET</span>
        <div class="api-info">
          <div class="api-endpoint">/api/health</div>
          <div class="api-desc">JSON health check</div>
        </div>
      </div>

      <div class="card api-card">
        <span class="method-badge get">GET</span>
        <div class="api-info">
          <div class="api-endpoint">/api/mcp/manifest</div>
          <div class="api-desc">MCP tool manifest (JSON)</div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- ── Architecture Principles ─────────────────────────────────────────── -->
<section class="section">
  <div class="container">
    <h2 class="section-title">Architecture Principles</h2>
    <p class="section-subtitle">The design decisions that make this work.</p>
    <div class="principles-grid">

      <div class="card principle-card">
        <h3>Port/Adapter Pattern</h3>
        <p>Every external system is behind a TypeScript interface. Swap implementations without touching business logic. This is how PSP removal in Phase 2 becomes a config change, not a rewrite.</p>
      </div>

      <div class="card principle-card">
        <h3>Agent Audit Trail</h3>
        <p>Every autonomous decision writes to <code class="mono" style="color:#818cf8;">agent_decisions</code> in D1. Agent type, verdict, reasoning, and detailed data. This isn&rsquo;t logging &mdash; it&rsquo;s a compliance requirement for FINTRAC/FinCEN.</p>
      </div>

      <div class="card principle-card">
        <h3>Single Codebase, Env-Switched</h3>
        <p>One Worker serves both production and sandbox. The <code class="mono" style="color:#818cf8;">ENVIRONMENT</code> var controls behavior. No separate deploys, no code drift.</p>
      </div>

      <div class="card principle-card">
        <h3>Short-Circuit on Red</h3>
        <p>When any agent returns RED, the pipeline stops immediately. No wasted compute on a dead transaction. Screen catches a sanctioned entity? Done. No Execute, no Reconcile.</p>
      </div>

    </div>
  </div>
</section>

<!-- ── Footer ──────────────────────────────────────────────────────────── -->
<footer class="footer">
  Xnumia &mdash; Agent-run stablecoin orchestration &bull; Built on Cloudflare Workers &bull; Phase 0 Foundation
</footer>

<script>
// ── Fetch live stats on page load ─────────────────────────────────────
(function loadStats() {
  fetch('/api/stats').then(function(res) {
    if (!res.ok) return;
    return res.json();
  }).then(function(data) {
    if (!data) return;
    var paymentsEl = document.getElementById('stat-payments');
    var decisionsEl = document.getElementById('stat-decisions');
    if (paymentsEl && data.tables && data.tables.payment_requests !== undefined) {
      paymentsEl.textContent = data.tables.payment_requests;
      paymentsEl.classList.remove('loading');
    }
    if (decisionsEl && data.tables && data.tables.agent_decisions !== undefined) {
      decisionsEl.textContent = data.tables.agent_decisions;
      decisionsEl.classList.remove('loading');
    }
  }).catch(function() {});

  fetch('/api/readiness').then(function(res) {
    if (!res.ok) return;
    return res.json();
  }).then(function(data) {
    if (!data) return;
    var readinessEl = document.getElementById('stat-readiness');
    if (readinessEl) {
      var pct = data.readinessPercent || data.percent || 25;
      readinessEl.textContent = pct + '%';
      readinessEl.classList.remove('loading');
    }
  }).catch(function() {});
})();

// ── Ops trigger button ────────────────────────────────────────────────
(function setupOpsTrigger() {
  var btn = document.getElementById('ops-trigger-btn');
  var resultEl = document.getElementById('ops-result');
  if (!btn || !resultEl) return;

  btn.addEventListener('click', function() {
    btn.disabled = true;
    btn.textContent = 'Running...';
    resultEl.classList.remove('visible');

    fetch('/ops/run', { method: 'POST' }).then(function(res) {
      return res.json();
    }).then(function(data) {
      btn.disabled = false;
      btn.textContent = 'Trigger ops cycle \\u25B6';

      var summary = '';
      if (data.results) {
        var items = 0;
        var actions = 0;
        var keys = Object.keys(data.results);
        for (var i = 0; i < keys.length; i++) {
          var r = data.results[keys[i]];
          if (r && r.itemsProcessed !== undefined) items += r.itemsProcessed;
          if (r && r.actionsTaken !== undefined) actions += r.actionsTaken;
        }
        summary = keys.length + ' agents ran | ' + items + ' items processed | ' + actions + ' actions taken';
      } else if (data.message) {
        summary = data.message;
      } else {
        summary = 'Ops cycle completed';
      }

      resultEl.textContent = summary;
      resultEl.classList.add('visible');

      setTimeout(function() {
        resultEl.classList.remove('visible');
      }, 6000);
    }).catch(function(err) {
      btn.disabled = false;
      btn.textContent = 'Trigger ops cycle \\u25B6';
      resultEl.textContent = 'Error: ' + (err.message || 'Request failed');
      resultEl.classList.add('visible');
    });
  });
})();
</script>

</body>
</html>`
