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
    padding: 130px 32px 40px;
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
    margin-bottom: 12px;
    font-family: 'JetBrains Mono', monospace;
  }
  .hero .one-liner {
    font-size: 16px; color: #94a3b8; max-width: 600px; margin: 0 auto;
    line-height: 1.7;
  }

  /* ── Bento Grid ──────────────────────────── */
  .bento-section {
    padding: 40px 0 80px;
  }
  .bento-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    grid-template-rows: auto auto auto;
    grid-template-areas:
      "pipeline d1      queue"
      "pipeline durable r2"
      "agents   integrations integrations";
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
  }
  .bento-tile {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 12px;
    padding: 24px;
    transition: all 0.2s;
    cursor: pointer;
  }
  .bento-tile:hover {
    border-color: rgba(99, 102, 241, 0.35);
  }
  .bento-tile-title {
    font-size: 13px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 1px; color: #475569; margin-bottom: 16px;
  }

  /* Tile 1: Pipeline (hero tile) */
  .tile-pipeline {
    grid-area: pipeline;
  }
  .tile-pipeline .bento-tile-title { color: #6366f1; }
  .pipeline-form { margin-bottom: 20px; }
  .pipeline-form label {
    display: block; font-size: 12px; color: #475569;
    margin-bottom: 4px; margin-top: 12px;
    font-family: 'JetBrains Mono', monospace;
  }
  .pipeline-form label:first-child { margin-top: 0; }
  .pipeline-form input {
    width: 100%; padding: 10px 12px; border-radius: 8px;
    background: #020617; border: 1px solid rgba(99, 102, 241, 0.2);
    color: #f8fafc; font-family: 'JetBrains Mono', monospace;
    font-size: 14px; outline: none; transition: border-color 0.2s;
  }
  .pipeline-form input:focus {
    border-color: #6366f1;
  }
  .pipeline-form .form-row {
    display: flex; gap: 12px;
  }
  .pipeline-form .form-row > div { flex: 1; }
  .scenario-buttons {
    display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;
  }
  .scenario-btn {
    flex: 1; min-width: 120px;
    padding: 10px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    cursor: pointer; border: 1px solid; transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .scenario-btn.clean {
    background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }
  .scenario-btn.clean:hover { background: rgba(34, 197, 94, 0.2); }
  .scenario-btn.risky {
    background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3);
    color: #f59e0b;
  }
  .scenario-btn.risky:hover { background: rgba(245, 158, 11, 0.2); }
  .scenario-btn.sanctioned {
    background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
  .scenario-btn.sanctioned:hover { background: rgba(239, 68, 68, 0.2); }

  .pipeline-result {
    margin-top: 16px; padding: 16px; border-radius: 8px;
    background: #020617; border: 1px solid rgba(99, 102, 241, 0.1);
    display: none;
  }
  .pipeline-result.visible { display: block; }
  .pipeline-result .result-verdict {
    font-size: 18px; font-weight: 700; margin-bottom: 8px;
  }
  .pipeline-result .result-verdict.approved { color: #22c55e; }
  .pipeline-result .result-verdict.escalated { color: #f59e0b; }
  .pipeline-result .result-verdict.rejected { color: #ef4444; }
  .pipeline-result .agent-dots {
    display: flex; gap: 12px; align-items: center; margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .agent-dot-group {
    display: flex; align-items: center; gap: 6px;
  }
  .agent-dot-group .dot {
    width: 8px; height: 8px; border-radius: 50%;
    display: inline-block;
  }
  .agent-dot-group .dot.green {
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  }
  .agent-dot-group .dot.amber {
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
  }
  .agent-dot-group .dot.red {
    background: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
  }
  .agent-dot-group span {
    font-size: 11px; color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
  }
  .result-link {
    font-size: 13px; color: #6366f1; text-decoration: none;
    font-weight: 600; transition: color 0.2s;
  }
  .result-link:hover { color: #818cf8; }
  .pipeline-loading {
    display: none; align-items: center; gap: 8px;
    margin-top: 16px; color: #94a3b8; font-size: 13px;
  }
  .pipeline-loading.visible { display: flex; }
  .spinner {
    width: 16px; height: 16px; border: 2px solid rgba(99, 102, 241, 0.2);
    border-top-color: #6366f1; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Tile 2: D1 */
  .tile-d1 { grid-area: d1; }
  .d1-tables {
    display: flex; flex-direction: column; gap: 6px;
  }
  .d1-row {
    display: flex; justify-content: space-between; align-items: center;
    font-family: 'JetBrains Mono', monospace; font-size: 12px;
  }
  .d1-row .table-name { color: #f8fafc; }
  .d1-row .row-count { color: #475569; }
  .d1-status {
    display: flex; align-items: center; gap: 6px;
    margin-top: 12px; font-size: 12px; color: #22c55e;
  }
  .d1-status .status-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  }
  .d1-id {
    margin-top: 8px; font-size: 11px; color: #475569;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Tile 3: Queue */
  .tile-queue { grid-area: queue; }
  .queue-binding {
    font-family: 'JetBrains Mono', monospace; font-size: 12px;
    margin-bottom: 8px; line-height: 1.8;
  }
  .queue-binding .binding-name { color: #f8fafc; }
  .queue-binding .binding-arrow { color: #475569; }
  .queue-binding .binding-value { color: #94a3b8; }
  .queue-binding .dlq { color: #ef4444; }
  .queue-config {
    font-size: 11px; color: #475569; margin-top: 12px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Tile 4: Durable Object */
  .tile-durable { grid-area: durable; }
  .state-progression {
    display: flex; align-items: center; flex-wrap: wrap;
    gap: 4px; margin-top: 4px;
  }
  .state-node {
    display: flex; align-items: center; gap: 4px;
  }
  .state-circle {
    width: 10px; height: 10px; border-radius: 50%;
    border: 2px solid #6366f1; background: transparent;
    flex-shrink: 0;
  }
  .state-circle.active {
    background: #6366f1;
    box-shadow: 0 0 6px rgba(99, 102, 241, 0.5);
  }
  .state-label {
    font-size: 9px; font-family: 'JetBrains Mono', monospace;
    color: #94a3b8; white-space: nowrap;
  }
  .state-connector {
    width: 12px; height: 2px; background: rgba(99, 102, 241, 0.3);
    flex-shrink: 0;
  }
  .do-label {
    font-size: 11px; color: #475569; margin-top: 12px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Tile 5: R2 */
  .tile-r2 { grid-area: r2; }
  .r2-binding {
    font-family: 'JetBrains Mono', monospace; font-size: 12px;
    color: #f8fafc; margin-bottom: 8px;
  }
  .r2-binding .binding-value { color: #94a3b8; }
  .r2-desc {
    font-size: 12px; color: #94a3b8; line-height: 1.6;
  }
  .r2-phase {
    font-size: 11px; color: #475569; margin-top: 8px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Tile 6: Agent Fleet */
  .tile-agents { grid-area: agents; }
  .agent-bar {
    display: flex; gap: 2px; width: 100%;
  }
  .agent-bar-item {
    flex: 1; text-align: center; padding: 14px 8px;
    background: #020617; border-radius: 8px;
    border: 1px solid rgba(99, 102, 241, 0.1);
    text-decoration: none; transition: all 0.2s;
    cursor: pointer; color: inherit;
  }
  .agent-bar-item:hover {
    border-color: rgba(99, 102, 241, 0.3);
    background: rgba(15, 23, 42, 0.8);
  }
  .agent-bar-item .agent-icon {
    font-size: 14px; color: #6366f1; margin-bottom: 6px;
    font-weight: 700;
  }
  .agent-bar-item .agent-name {
    font-size: 11px; font-weight: 600; color: #f8fafc;
    margin-bottom: 8px;
  }
  .agent-bar-item .verdict-counts {
    display: flex; justify-content: center; gap: 6px;
  }
  .verdict-pip {
    display: flex; align-items: center; gap: 3px;
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
  }
  .verdict-pip .pip {
    width: 6px; height: 6px; border-radius: 50%;
    display: inline-block;
  }
  .verdict-pip .pip.g { background: #22c55e; }
  .verdict-pip .pip.a { background: #f59e0b; }
  .verdict-pip .pip.r { background: #ef4444; }
  .verdict-pip .count { color: #475569; }

  /* Tile 7: Integrations */
  .tile-integrations { grid-area: integrations; }
  .integration-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .integration-item {
    padding: 14px; border-radius: 8px;
    background: #020617; border: 1px solid rgba(99, 102, 241, 0.1);
    transition: all 0.2s;
  }
  .integration-item:hover {
    border-color: rgba(99, 102, 241, 0.25);
  }
  .integration-item.phase1-only {
    border-style: dashed;
    border-color: rgba(245, 158, 11, 0.3);
  }
  .integration-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
  }
  .integration-name {
    font-size: 13px; font-weight: 600; color: #f8fafc;
  }
  .integration-port {
    font-size: 10px; color: #6366f1;
    font-family: 'JetBrains Mono', monospace;
  }
  .integration-swap {
    font-size: 11px; color: #94a3b8; margin-top: 4px;
  }
  .integration-swap .mock { color: #475569; }
  .integration-swap .arrow { color: #475569; margin: 0 4px; }
  .integration-swap .production { color: #94a3b8; }
  .integration-badge {
    display: inline-block; font-size: 9px; font-weight: 600;
    padding: 2px 6px; border-radius: 4px;
    background: rgba(245, 158, 11, 0.15); color: #f59e0b;
    text-transform: uppercase; letter-spacing: 0.5px;
    margin-left: 6px;
  }
  .integration-current {
    font-size: 10px; color: #475569; margin-top: 4px;
    font-family: 'JetBrains Mono', monospace;
  }

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
    .bento-grid {
      grid-template-columns: 1fr;
      grid-template-areas:
        "pipeline"
        "d1"
        "queue"
        "durable"
        "r2"
        "agents"
        "integrations";
    }
    .agent-bar { flex-wrap: wrap; }
    .agent-bar-item { min-width: calc(50% - 4px); }
    .spokes { grid-template-columns: 1fr; }
    .api-grid { grid-template-columns: 1fr; }
    .principles-grid { grid-template-columns: 1fr; }
    .integration-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .hero h1 { font-size: 36px; letter-spacing: -1px; }
    .nav { padding: 12px 16px; }
    .nav-links a { margin-left: 12px; font-size: 12px; }
    .container { padding: 0 16px; }
    .bento-grid { padding: 0 16px; }
    .section { padding: 48px 0; }
    .scenario-buttons { flex-direction: column; }
    .scenario-btn { min-width: 100%; }
    .form-row { flex-direction: column !important; }
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
    <a href="/system-health">Health</a>
  </div>
</nav>

<!-- ── Hero ─────────────────────────────────────────────────────────────── -->
<section class="hero">
  <h1>Xnumia</h1>
  <div class="tagline">Agent-run stablecoin orchestration</div>
  <p class="one-liner">Five autonomous agents process every payment request. No human touches a clean transaction.</p>
</section>

<!-- ── Bento Grid ──────────────────────────────────────────────────────── -->
<section class="bento-section">
  <div class="bento-grid">

    <!-- Tile 1: Live Pipeline (hero tile) -->
    <div class="bento-tile tile-pipeline">
      <div class="bento-tile-title">Try It Live</div>
      <form class="pipeline-form" id="pipeline-form" onsubmit="return false;">
        <label>clientName</label>
        <input type="text" id="field-client" value="Acme Corp" />
        <div class="form-row">
          <div>
            <label>amount</label>
            <input type="text" id="field-amount" value="5000" />
          </div>
          <div>
            <label>sourceCurrency</label>
            <input type="text" id="field-source" value="CAD" />
          </div>
          <div>
            <label>targetCurrency</label>
            <input type="text" id="field-target" value="USDC" />
          </div>
        </div>
        <label>description</label>
        <input type="text" id="field-desc" value="Quarterly supplier payment" />
      </form>
      <div class="scenario-buttons">
        <button class="scenario-btn clean" onclick="submitScenario('clean')">Clean Payment</button>
        <button class="scenario-btn risky" onclick="submitScenario('risky')">Risky Payment</button>
        <button class="scenario-btn sanctioned" onclick="submitScenario('sanctioned')">Sanctioned Entity</button>
      </div>
      <div class="pipeline-loading" id="pipeline-loading">
        <div class="spinner"></div>
        <span>Processing through agent pipeline...</span>
      </div>
      <div class="pipeline-result" id="pipeline-result">
        <div class="result-verdict" id="result-verdict"></div>
        <div class="agent-dots" id="agent-dots"></div>
        <a class="result-link" id="result-link" href="#">View in Dashboard &#9656;</a>
      </div>
    </div>

    <!-- Tile 2: D1 Database -->
    <div class="bento-tile tile-d1">
      <div class="bento-tile-title">D1 Database</div>
      <div class="d1-tables" id="d1-tables">
        <div class="d1-row"><span class="table-name">payment_requests</span><span class="row-count" id="d1-payments">--</span></div>
        <div class="d1-row"><span class="table-name">agent_decisions</span><span class="row-count" id="d1-decisions">--</span></div>
        <div class="d1-row"><span class="table-name">ledger_entries</span><span class="row-count" id="d1-ledger">--</span></div>
        <div class="d1-row"><span class="table-name">audit_log</span><span class="row-count" id="d1-audit">--</span></div>
        <div class="d1-row"><span class="table-name">transactions</span><span class="row-count" id="d1-transactions">--</span></div>
      </div>
      <div class="d1-status" id="d1-status">
        <span class="status-dot"></span>
        <span>Connected</span>
      </div>
      <div class="d1-id">cd4d2bdf...</div>
    </div>

    <!-- Tile 3: Queues -->
    <div class="bento-tile tile-queue">
      <div class="bento-tile-title">Queues</div>
      <div class="queue-binding">
        <span class="binding-name">TASK_QUEUE</span>
        <span class="binding-arrow"> &#9656; </span>
        <span class="binding-value">ff-test-task-queue</span>
      </div>
      <div class="queue-binding">
        <span class="binding-name dlq">DLQ</span>
        <span class="binding-arrow"> &#9656; </span>
        <span class="binding-value dlq">ff-test-dlq</span>
      </div>
      <div class="queue-config">10 batch / 3 retries / 30s timeout</div>
    </div>

    <!-- Tile 4: Durable Object -->
    <div class="bento-tile tile-durable">
      <div class="bento-tile-title">Transaction State Machine</div>
      <div class="state-progression">
        <div class="state-node">
          <span class="state-circle active"></span>
          <span class="state-label">INITIATED</span>
        </div>
        <div class="state-connector"></div>
        <div class="state-node">
          <span class="state-circle"></span>
          <span class="state-label">PENDING_PSP</span>
        </div>
        <div class="state-connector"></div>
        <div class="state-node">
          <span class="state-circle"></span>
          <span class="state-label">PENDING_SETTLEMENT</span>
        </div>
        <div class="state-connector"></div>
        <div class="state-node">
          <span class="state-circle"></span>
          <span class="state-label">SETTLED</span>
        </div>
        <div class="state-connector"></div>
        <div class="state-node">
          <span class="state-circle"></span>
          <span class="state-label">RECONCILED</span>
        </div>
      </div>
      <div class="do-label">OrchestratorDO &mdash; per-transaction isolation</div>
    </div>

    <!-- Tile 5: R2 Storage -->
    <div class="bento-tile tile-r2">
      <div class="bento-tile-title">R2 Storage</div>
      <div class="r2-binding">
        DOCUMENTS <span class="binding-value">&#9656; ff-test-documents</span>
      </div>
      <div class="r2-desc">Compliance artifacts, reconciliation reports, regulatory filings</div>
      <div class="r2-phase">Phase 1+</div>
    </div>

    <!-- Tile 6: Agent Fleet -->
    <div class="bento-tile tile-agents">
      <div class="bento-tile-title">Agent Fleet</div>
      <div class="agent-bar">
        <a href="/agents" class="agent-bar-item">
          <div class="agent-icon">&#9654;</div>
          <div class="agent-name">Validate</div>
          <div class="verdict-counts" id="vc-validate">
            <span class="verdict-pip"><span class="pip g"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip a"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip r"></span><span class="count">--</span></span>
          </div>
        </a>
        <a href="/agents" class="agent-bar-item">
          <div class="agent-icon">&#9670;</div>
          <div class="agent-name">Quote</div>
          <div class="verdict-counts" id="vc-quote">
            <span class="verdict-pip"><span class="pip g"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip a"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip r"></span><span class="count">--</span></span>
          </div>
        </a>
        <a href="/agents" class="agent-bar-item">
          <div class="agent-icon">&#9679;</div>
          <div class="agent-name">Screen</div>
          <div class="verdict-counts" id="vc-screen">
            <span class="verdict-pip"><span class="pip g"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip a"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip r"></span><span class="count">--</span></span>
          </div>
        </a>
        <a href="/agents" class="agent-bar-item">
          <div class="agent-icon">&#9650;</div>
          <div class="agent-name">Execute</div>
          <div class="verdict-counts" id="vc-execute">
            <span class="verdict-pip"><span class="pip g"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip a"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip r"></span><span class="count">--</span></span>
          </div>
        </a>
        <a href="/agents" class="agent-bar-item">
          <div class="agent-icon">&#9632;</div>
          <div class="agent-name">Reconcile</div>
          <div class="verdict-counts" id="vc-reconcile">
            <span class="verdict-pip"><span class="pip g"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip a"></span><span class="count">--</span></span>
            <span class="verdict-pip"><span class="pip r"></span><span class="count">--</span></span>
          </div>
        </a>
      </div>
    </div>

    <!-- Tile 7: External Integrations -->
    <div class="bento-tile tile-integrations">
      <div class="bento-tile-title">Port/Adapter Layer</div>
      <div class="integration-grid">
        <div class="integration-item">
          <div class="integration-header">
            <span class="integration-name">Bank</span>
            <span class="integration-port">BankPort</span>
          </div>
          <div class="integration-swap">
            <span class="mock">MockAdapter</span><span class="arrow">&#9656;</span><span class="production">Plaid / Direct</span>
          </div>
          <div class="integration-current">MockBankAdapter</div>
        </div>
        <div class="integration-item phase1-only">
          <div class="integration-header">
            <span class="integration-name">PSP</span>
            <span class="integration-port">PSPPort</span>
            <span class="integration-badge">Phase 1 only</span>
          </div>
          <div class="integration-swap">
            <span class="mock">MockAdapter</span><span class="arrow">&#9656;</span><span class="production">Licensed PSP</span>
          </div>
          <div class="integration-current">MockPSPAdapter</div>
        </div>
        <div class="integration-item">
          <div class="integration-header">
            <span class="integration-name">Exchange</span>
            <span class="integration-port">ExchangePort</span>
          </div>
          <div class="integration-swap">
            <span class="mock">MockAdapter</span><span class="arrow">&#9656;</span><span class="production">Live rates</span>
          </div>
          <div class="integration-current">MockExchangeAdapter</div>
        </div>
        <div class="integration-item">
          <div class="integration-header">
            <span class="integration-name">Accounting</span>
            <span class="integration-port">AccountingPort</span>
          </div>
          <div class="integration-swap">
            <span class="mock">MockAdapter</span><span class="arrow">&#9656;</span><span class="production">Xero / QB</span>
          </div>
          <div class="integration-current">MockAccountingAdapter</div>
        </div>
      </div>
    </div>

  </div>
</section>

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
// ── Helper: update table counts from stats data ───────────────────────
function updateTableCounts(tables) {
  var map = {
    payment_requests: 'd1-payments',
    agent_decisions: 'd1-decisions',
    ledger_entries: 'd1-ledger',
    audit_log: 'd1-audit',
    transactions: 'd1-transactions'
  };
  var keys = Object.keys(map);
  for (var i = 0; i < keys.length; i++) {
    var table = keys[i];
    var elId = map[table];
    var el = document.getElementById(elId);
    if (el && tables[table] !== undefined) {
      el.textContent = tables[table] + ' rows';
    }
  }
}

// ── Fetch live stats on page load ─────────────────────────────────────
(function loadStats() {
  fetch('/api/stats').then(function(res) {
    if (!res.ok) return;
    return res.json();
  }).then(function(data) {
    if (!data) return;

    // D1 table counts
    if (data.tables) {
      updateTableCounts(data.tables);
    }

    // Agent verdict counts
    if (data.agentVerdicts) {
      var agents = ['validate', 'quote', 'screen', 'execute', 'reconcile'];
      for (var i = 0; i < agents.length; i++) {
        var agent = agents[i];
        var el = document.getElementById('vc-' + agent);
        if (el && data.agentVerdicts[agent]) {
          var v = data.agentVerdicts[agent];
          var pips = el.querySelectorAll('.verdict-pip .count');
          if (pips[0]) pips[0].textContent = v.green || 0;
          if (pips[1]) pips[1].textContent = v.amber || 0;
          if (pips[2]) pips[2].textContent = v.red || 0;
        }
      }
    }
  }).catch(function() {
    // Stats are non-critical
  });
})();

// ── Payment submission ────────────────────────────────────────────────
function submitScenario(type) {
  var clientField = document.getElementById('field-client');
  var amountField = document.getElementById('field-amount');
  var descField = document.getElementById('field-desc');

  if (type === 'clean') {
    clientField.value = 'Acme Corp';
    amountField.value = '5000';
    descField.value = 'Quarterly supplier payment';
  } else if (type === 'risky') {
    clientField.value = 'Acme Corp';
    amountField.value = '75000';
    descField.value = 'Large urgent transfer - high value';
  } else if (type === 'sanctioned') {
    clientField.value = 'Sanctioned Entity LLC';
    amountField.value = '10000';
    descField.value = 'Payment to restricted party';
  }

  submitPayment();
}

function submitPayment() {
  var loading = document.getElementById('pipeline-loading');
  var result = document.getElementById('pipeline-result');

  loading.classList.add('visible');
  result.classList.remove('visible');

  var payload = {
    clientName: document.getElementById('field-client').value,
    amount: parseFloat(document.getElementById('field-amount').value) || 5000,
    sourceCurrency: document.getElementById('field-source').value || 'CAD',
    targetCurrency: document.getElementById('field-target').value || 'USDC',
    description: document.getElementById('field-desc').value || ''
  };

  fetch('/mcp/submit-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function(res) {
    return res.json();
  }).then(function(data) {
    loading.classList.remove('visible');

    var verdictEl = document.getElementById('result-verdict');
    var dotsEl = document.getElementById('agent-dots');
    var linkEl = document.getElementById('result-link');

    var verdict = (data.finalVerdict || data.verdict || 'UNKNOWN').toUpperCase();
    verdictEl.textContent = verdict;
    verdictEl.className = 'result-verdict';
    if (verdict === 'APPROVED' || verdict === 'AUTO_APPROVED') {
      verdictEl.classList.add('approved');
    } else if (verdict === 'ESCALATED') {
      verdictEl.classList.add('escalated');
    } else {
      verdictEl.classList.add('rejected');
    }

    // Build agent dots safely with DOM methods
    while (dotsEl.firstChild) { dotsEl.removeChild(dotsEl.firstChild); }
    var agentNames = ['Validate', 'Quote', 'Screen', 'Execute', 'Reconcile'];
    var decisions = data.agentDecisions || data.decisions || [];
    for (var i = 0; i < agentNames.length; i++) {
      var d = decisions[i];
      var colorClass = 'green';
      if (d) {
        var v = (d.verdict || d.color || '').toLowerCase();
        if (v === 'red' || v === 'rejected') colorClass = 'red';
        else if (v === 'amber' || v === 'escalated') colorClass = 'amber';
      }
      var group = document.createElement('div');
      group.className = 'agent-dot-group';
      var dot = document.createElement('span');
      dot.className = 'dot ' + colorClass;
      var label = document.createElement('span');
      label.textContent = agentNames[i];
      group.appendChild(dot);
      group.appendChild(label);
      dotsEl.appendChild(group);
    }

    // Link
    var id = data.paymentId || data.id || '';
    if (id) {
      linkEl.href = '/dashboard?highlight=' + encodeURIComponent(id);
      linkEl.style.display = 'inline';
    } else {
      linkEl.style.display = 'none';
    }

    result.classList.add('visible');

    // Refresh stats after submission
    fetch('/api/stats').then(function(res) {
      if (!res.ok) return;
      return res.json();
    }).then(function(statsData) {
      if (statsData && statsData.tables) {
        updateTableCounts(statsData.tables);
      }
    }).catch(function() {});

  }).catch(function(err) {
    loading.classList.remove('visible');
    var verdictEl = document.getElementById('result-verdict');
    verdictEl.textContent = 'ERROR: ' + (err.message || 'Request failed');
    verdictEl.className = 'result-verdict rejected';
    var dotsEl = document.getElementById('agent-dots');
    while (dotsEl.firstChild) { dotsEl.removeChild(dotsEl.firstChild); }
    document.getElementById('result-link').style.display = 'none';
    result.classList.add('visible');
  });
}
</script>

</body>
</html>`
