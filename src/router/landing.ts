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
    background: #0a0e1a;
    color: #e2e8f0;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
    line-height: 1.6;
  }

  /* ── Nav ──────────────────────────────────── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px;
    background: rgba(10, 14, 26, 0.85);
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
  .nav-links a:hover, .nav-links a.active { color: #e2e8f0; }

  /* ── Shared ──────────────────────────────── */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
  .section { padding: 80px 0; }
  .section-title {
    font-size: 28px; font-weight: 700; margin-bottom: 12px;
    color: #e2e8f0;
  }
  .section-subtitle {
    font-size: 15px; color: #94a3b8; margin-bottom: 48px;
    max-width: 600px;
  }
  .card {
    background: rgba(30, 41, 59, 0.6);
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
    padding: 160px 32px 80px;
    text-align: center;
  }
  .hero h1 {
    font-size: 72px; font-weight: 800;
    background: linear-gradient(135deg, #e2e8f0 0%, #818cf8 50%, #6366f1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 16px;
    letter-spacing: -2px;
  }
  .hero .tagline {
    font-size: 20px; color: #818cf8; font-weight: 500;
    margin-bottom: 16px;
    font-family: 'JetBrains Mono', monospace;
  }
  .hero .one-liner {
    font-size: 17px; color: #94a3b8; max-width: 640px; margin: 0 auto 40px;
    line-height: 1.7;
  }
  .hero-ctas {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  }
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 10px;
    font-size: 15px; font-weight: 600;
    text-decoration: none; transition: all 0.2s;
    cursor: pointer; border: none;
  }
  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: #fff;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3); }
  .btn-secondary {
    background: rgba(99, 102, 241, 0.1);
    color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);
  }
  .btn-secondary:hover { background: rgba(99, 102, 241, 0.2); transform: translateY(-2px); }

  /* ── How It Works ────────────────────────── */
  .steps {
    display: grid; grid-template-columns: 1fr auto 1fr auto 1fr;
    gap: 0; align-items: center;
  }
  .step-card {
    text-align: center;
  }
  .step-card .step-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: #fff; font-weight: 700; font-size: 16px;
    margin-bottom: 16px;
  }
  .step-card h3 {
    font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #e2e8f0;
  }
  .step-card p {
    font-size: 14px; color: #94a3b8; line-height: 1.7;
  }
  .step-arrow {
    display: flex; align-items: center; justify-content: center;
    color: #6366f1; font-size: 28px; padding: 0 8px;
  }

  /* ── Building Blocks ─────────────────────── */
  .blocks-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .block-card {
    position: relative;
    padding-left: 36px;
  }
  .block-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 4px; border-radius: 4px;
  }
  .block-card.workers::before { background: #f59e0b; }
  .block-card.d1::before { background: #6366f1; }
  .block-card.do::before { background: #22c55e; }
  .block-card.r2::before { background: #3b82f6; }
  .block-card.queues::before { background: #f97316; }
  .block-card.workflows::before { background: #a78bfa; }
  .block-icon {
    font-size: 24px; margin-bottom: 8px;
  }
  .block-card h3 {
    font-size: 16px; font-weight: 700; margin-bottom: 6px; color: #e2e8f0;
  }
  .block-role {
    font-size: 13px; color: #94a3b8; margin-bottom: 10px; line-height: 1.6;
  }
  .block-data {
    font-size: 12px; color: #6366f1;
    font-family: 'JetBrains Mono', monospace;
    background: rgba(99, 102, 241, 0.08);
    padding: 8px 12px; border-radius: 6px;
    line-height: 1.7;
  }

  /* ── External Integrations ───────────────── */
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
    font-size: 15px; font-weight: 700; color: #e2e8f0;
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
    font-size: 13px; font-weight: 600; color: #e2e8f0;
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
    font-size: 16px; font-weight: 700; color: #e2e8f0; margin-bottom: 8px;
  }
  .principle-card p {
    font-size: 14px; color: #94a3b8; line-height: 1.7;
  }

  /* ── System Diagram ─────────────────────── */
  .diagram-wrap {
    position: relative; width: 100%; max-width: 1100px;
    margin: 0 auto;
  }
  .diagram-wrap canvas {
    width: 100%; border-radius: 12px;
    background: radial-gradient(ellipse at center, #111827 0%, #0a0e1a 70%);
    border: 1px solid rgba(99,102,241,0.1);
  }
  .diagram-tabs {
    display: flex; justify-content: center; gap: 8px; margin-bottom: 20px;
  }
  .diagram-tab {
    padding: 8px 20px; border-radius: 6px; font-size: 13px; font-weight: 600;
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);
    color: #94a3b8; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
  }
  .diagram-tab:hover { background: rgba(99,102,241,0.15); color: #e2e8f0; }
  .diagram-tab.active { background: #6366f1; border-color: #6366f1; color: #fff; }
  .diagram-caption {
    text-align: center; font-size: 13px; color: #64748b; margin-top: 12px;
    font-family: 'JetBrains Mono', monospace;
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
    .steps { grid-template-columns: 1fr; gap: 16px; }
    .step-arrow { transform: rotate(90deg); padding: 8px 0; }
    .blocks-grid { grid-template-columns: 1fr; }
    .spokes { grid-template-columns: 1fr; }
    .api-grid { grid-template-columns: 1fr; }
    .principles-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .hero h1 { font-size: 36px; letter-spacing: -1px; }
    .nav { padding: 12px 16px; }
    .nav-links a { margin-left: 12px; font-size: 12px; }
    .container { padding: 0 16px; }
    .section { padding: 48px 0; }
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
  <div class="hero-ctas">
    <a href="/dashboard" class="btn btn-primary">View Live Dashboard &rarr;</a>
    <a href="/flowchart" class="btn btn-secondary">See Architecture &rarr;</a>
  </div>
</section>

<!-- ── How It Works ────────────────────────────────────────────────────── -->
<section class="section">
  <div class="container">
    <h2 class="section-title">How It Works</h2>
    <p class="section-subtitle">Three steps, five agents, zero manual intervention on clean transactions.</p>
    <div class="steps">
      <div class="card step-card">
        <div class="step-num">1</div>
        <h3>Submit</h3>
        <p>A payment request arrives via HTTPS POST to the Worker. Client ID, amount, currencies, and description are captured.</p>
      </div>
      <div class="step-arrow">&rarr;</div>
      <div class="card step-card">
        <div class="step-num">2</div>
        <h3>Evaluate</h3>
        <p>Five specialist agents run in sequence: Intake validates, Compliance screens, FX converts, Risk scores, Recon deduplicates. Each writes its verdict to D1.</p>
      </div>
      <div class="step-arrow">&rarr;</div>
      <div class="card step-card">
        <div class="step-num">3</div>
        <h3>Decide</h3>
        <p>The Orchestrator collects all verdicts. All green &mdash; auto-approve. Any amber &mdash; escalate to human. Any red &mdash; auto-reject. Every decision is logged.</p>
      </div>
    </div>
  </div>
</section>

<!-- ── System Diagram ─────────────────────────────────────────────────── -->
<section class="section" style="background: rgba(15, 23, 42, 0.3);">
  <div class="container">
    <h2 class="section-title">System Diagram</h2>
    <p class="section-subtitle">Two flows, one infrastructure. Click to see how each path works.</p>
    <div class="diagram-tabs">
      <button class="diagram-tab active" onclick="switchDiagram('pipeline')">Payment Pipeline</button>
      <button class="diagram-tab" onclick="switchDiagram('transaction')">Transaction Orchestrator</button>
    </div>
    <div class="diagram-wrap">
      <canvas id="sysdiagram"></canvas>
    </div>
    <div class="diagram-caption" id="diagram-caption">A payment request enters the Worker, gets stored in D1, flows through 5 agents, and reaches a verdict.</div>
  </div>
</section>

<!-- ── Building Blocks ─────────────────────────────────────────────────── -->
<section class="section" style="background: rgba(15, 23, 42, 0.5);">
  <div class="container">
    <h2 class="section-title">Building Blocks</h2>
    <p class="section-subtitle">Cloudflare primitives powering the platform.</p>
    <div class="blocks-grid">

      <div class="card block-card workers">
        <div class="block-icon">&#9889;</div>
        <h3>Cloudflare Workers</h3>
        <p class="block-role">HTTP routing, business logic, serves all pages</p>
        <div class="block-data">Hono router, agent pipeline code</div>
      </div>

      <div class="card block-card d1">
        <div class="block-icon">&#128452;&#65039;</div>
        <h3>D1 Database</h3>
        <p class="block-role">Structured data &mdash; transactions, decisions, audit trail</p>
        <div class="block-data">payment_requests, agent_decisions, ledger_entries, audit_log, transactions</div>
      </div>

      <div class="card block-card do">
        <div class="block-icon">&#128274;</div>
        <h3>Durable Objects</h3>
        <p class="block-role">Per-transaction state machines with embedded SQLite</p>
        <div class="block-data">INITIATED &rarr; PENDING_PSP &rarr; SETTLED &rarr; RECONCILED</div>
      </div>

      <div class="card block-card r2">
        <div class="block-icon">&#128230;</div>
        <h3>R2 Storage</h3>
        <p class="block-role">Document storage &mdash; compliance artifacts, reports</p>
        <div class="block-data">KYC documents, reconciliation reports, regulatory filings (Phase 1+)</div>
      </div>

      <div class="card block-card queues">
        <div class="block-icon">&#128236;</div>
        <h3>Queues + DLQ</h3>
        <p class="block-role">Async task processing with automatic retry</p>
        <div class="block-data">Agent task fan-out, settlement confirmations. Poison messages &rarr; dead letter queue</div>
      </div>

      <div class="card block-card workflows">
        <div class="block-icon">&#128260;</div>
        <h3>Workflows v2</h3>
        <p class="block-role">Durable multi-step flows that survive restarts</p>
        <div class="block-data">Human-approval gates (waitForEvent), engagement workflows with 7-day timeouts</div>
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
        <p>When any agent returns RED, the pipeline stops immediately. No wasted compute on a dead transaction. Compliance catches a sanctioned entity? Done. No FX, no Risk, no Recon.</p>
      </div>

    </div>
  </div>
</section>

<!-- ── Footer ──────────────────────────────────────────────────────────── -->
<footer class="footer">
  Xnumia &mdash; Agent-run stablecoin orchestration &bull; Built on Cloudflare Workers &bull; Phase 0 Foundation
</footer>

<script>
// ── System Diagram Canvas ──────────────────────────────────────────────
const cv = document.getElementById('sysdiagram');
const cx = cv.getContext('2d');
const DPR = window.devicePixelRatio || 1;
let cW, cH, mode = 'pipeline';

function resizeCanvas() {
  const r = cv.parentElement.getBoundingClientRect();
  cW = r.width; cH = 480;
  cv.width = cW * DPR; cv.height = cH * DPR;
  cv.style.height = cH + 'px';
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const COL = {
  indigo: '#6366f1', indigoGlow: 'rgba(99,102,241,0.25)',
  green: '#22c55e', greenGlow: 'rgba(34,197,94,0.25)',
  amber: '#f59e0b', amberGlow: 'rgba(245,158,11,0.25)',
  red: '#ef4444', cyan: '#06b6d4', cyanGlow: 'rgba(6,182,212,0.25)',
  card: '#1e293b', text: '#e2e8f0', dim: '#64748b', bg: '#111827',
};

let particles = [];
let animT = 0;

function box(x, y, w, h, label, sub, color, icon) {
  // Glow
  cx.shadowColor = color || COL.indigo;
  cx.shadowBlur = 16;
  cx.fillStyle = COL.card;
  cx.beginPath();
  cx.roundRect(x - w/2, y - h/2, w, h, 8);
  cx.fill();
  cx.shadowBlur = 0;
  // Border
  cx.strokeStyle = color || COL.indigo;
  cx.lineWidth = 1.5;
  cx.stroke();
  // Icon
  if (icon) {
    cx.font = '18px sans-serif';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText(icon, x, y - (sub ? 8 : 0));
  }
  // Label
  cx.font = '600 11px Inter, sans-serif';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillStyle = COL.text;
  if (icon) {
    cx.fillText(label, x, y + (sub ? 8 : 14));
  } else {
    cx.fillText(label, x, y - 4);
  }
  // Sub
  if (sub) {
    cx.font = '10px JetBrains Mono, monospace';
    cx.fillStyle = COL.dim;
    cx.fillText(sub, x, y + 22);
  }
}

function arrow(x1, y1, x2, y2, color, dashed) {
  cx.beginPath();
  cx.moveTo(x1, y1); cx.lineTo(x2, y2);
  cx.strokeStyle = color || 'rgba(99,102,241,0.3)';
  cx.lineWidth = 1.5;
  if (dashed) cx.setLineDash([4, 4]);
  cx.stroke();
  cx.setLineDash([]);
  // Arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hl = 8;
  cx.beginPath();
  cx.moveTo(x2, y2);
  cx.lineTo(x2 - hl * Math.cos(angle - 0.4), y2 - hl * Math.sin(angle - 0.4));
  cx.lineTo(x2 - hl * Math.cos(angle + 0.4), y2 - hl * Math.sin(angle + 0.4));
  cx.closePath();
  cx.fillStyle = color || 'rgba(99,102,241,0.5)';
  cx.fill();
}

function dot(x, y, size, color) {
  cx.beginPath();
  cx.arc(x, y, size, 0, Math.PI * 2);
  cx.fillStyle = color;
  cx.fill();
  cx.beginPath();
  cx.arc(x, y, size + 3, 0, Math.PI * 2);
  cx.fillStyle = color.replace(')', ',0.2)').replace('rgb', 'rgba');
  cx.fill();
}

function spawnFlow(path, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      path, color, progress: -i * 0.08,
      speed: 0.004 + Math.random() * 0.003,
      size: 2 + Math.random() * 1.5,
    });
  }
}

function drawPipeline() {
  const midX = cW / 2;
  const agentNames = ['Intake', 'Compliance', 'FX', 'Risk', 'Recon'];
  const agentIcons = ['\\u{1F4CB}', '\\u{1F6E1}', '\\u{1F4B1}', '\\u26A0', '\\u{1F4CA}'];
  const agentW = Math.min(100, (cW - 100) / 5 - 10);
  const agentSpacing = Math.min(120, (cW - 80) / 5);
  const agentsStartX = midX - (agentSpacing * 2);

  // Positions
  const userY = 40, workerY = 100, d1Y = 170, agentY = 260, orchY = 340, outcomeY = 420;

  // User
  box(midX, userY, 140, 36, 'API Client / User', null, COL.cyan, '\\u{1F464}');

  // Worker
  box(midX, workerY, 180, 40, 'Cloudflare Worker', 'Hono Router', COL.indigo, '\\u26A1');

  // D1
  box(midX - 180, d1Y, 140, 36, 'D1 Database', 'payment_requests', COL.green, '\\u{1F5C4}');

  // Agents
  for (let i = 0; i < 5; i++) {
    const ax = agentsStartX + i * agentSpacing;
    box(ax, agentY, agentW, 44, agentNames[i], null, COL.indigo, agentIcons[i]);
  }

  // agent_decisions
  const adX = midX + 220;
  box(adX, agentY, 130, 36, 'agent_decisions', 'D1 audit trail', COL.green, '\\u{1F4DD}');

  // Orchestrator
  box(midX, orchY, 160, 40, 'Orchestrator', 'Verdict Aggregation', COL.indigo, '\\u{1F3AF}');

  // Outcomes
  box(midX - 180, outcomeY, 120, 36, 'Auto-Approve', null, COL.green, '\\u2705');
  box(midX, outcomeY, 120, 36, 'Escalate', 'Human Review', COL.amber, '\\u{1F465}');
  box(midX + 180, outcomeY, 120, 36, 'Auto-Reject', null, COL.red, '\\u274C');

  // Arrows
  arrow(midX, userY + 18, midX, workerY - 20, 'rgba(6,182,212,0.4)');
  arrow(midX - 40, workerY + 20, midX - 180, d1Y - 18, 'rgba(34,197,94,0.3)');
  arrow(midX, workerY + 20, agentsStartX, agentY - 22, 'rgba(99,102,241,0.3)');
  // Agent chain
  for (let i = 0; i < 4; i++) {
    const ax1 = agentsStartX + i * agentSpacing + agentW / 2;
    const ax2 = agentsStartX + (i + 1) * agentSpacing - agentW / 2;
    arrow(ax1, agentY, ax2, agentY, 'rgba(99,102,241,0.25)');
  }
  // Agents → agent_decisions
  const lastAgentX = agentsStartX + 4 * agentSpacing;
  arrow(lastAgentX + agentW / 2, agentY, adX - 65, agentY, 'rgba(34,197,94,0.25)', true);
  // Agents → Orchestrator
  arrow(midX, agentY + 22, midX, orchY - 20, 'rgba(99,102,241,0.3)');
  // Orchestrator → outcomes
  arrow(midX - 30, orchY + 20, midX - 180, outcomeY - 18, 'rgba(34,197,94,0.3)');
  arrow(midX, orchY + 20, midX, outcomeY - 18, 'rgba(245,158,11,0.3)');
  arrow(midX + 30, orchY + 20, midX + 180, outcomeY - 18, 'rgba(239,68,68,0.3)');

  // Label: "HTTPS POST"
  cx.font = '500 9px JetBrains Mono, monospace';
  cx.fillStyle = COL.dim; cx.textAlign = 'left';
  cx.fillText('HTTPS POST', midX + 8, userY + 34);
  cx.fillText('writes to D1', midX - 160, workerY + 42);
  cx.fillText('each agent writes verdict', adX - 120, agentY - 32);

  return [
    // Flow: user → worker → agents → orchestrator → approve
    [{x: midX, y: userY+18}, {x: midX, y: workerY}, {x: agentsStartX, y: agentY},
     ...agentNames.map((_, i) => ({x: agentsStartX + i * agentSpacing, y: agentY})),
     {x: midX, y: orchY}, {x: midX - 180, y: outcomeY}],
  ];
}

function drawTransaction() {
  const midX = cW / 2;
  const userY = 40, workerY = 100, d1Y = 170, doY = 260, queueY = 340, wfY = 340, outcomeY = 430;

  // User
  box(midX, userY, 140, 36, 'API Client', null, COL.cyan, '\\u{1F464}');

  // Worker
  box(midX, workerY, 180, 40, 'Cloudflare Worker', 'POST /transactions', COL.indigo, '\\u26A1');

  // D1
  box(midX - 200, d1Y, 150, 36, 'D1 Database', 'transactions table', COL.green, '\\u{1F5C4}');

  // Durable Object
  box(midX, doY, 200, 50, 'Durable Object', 'Per-transaction state machine', COL.amber, '\\u{1F512}');

  // State labels
  cx.font = '500 10px JetBrains Mono, monospace';
  cx.textAlign = 'center'; cx.fillStyle = COL.dim;
  const states = ['INITIATED', 'PENDING_PSP', 'PENDING_SETTLEMENT', 'SETTLED', 'RECONCILED'];
  const stateW = Math.min(cW - 100, 700);
  const stateStartX = midX - stateW / 2;
  for (let i = 0; i < states.length; i++) {
    const sx = stateStartX + (stateW / 4) * i;
    const sy = doY + 50;
    // State circle
    cx.beginPath();
    cx.arc(sx, sy, 6, 0, Math.PI * 2);
    cx.fillStyle = i === 0 ? COL.indigo : i === 4 ? COL.green : COL.dim;
    cx.fill();
    // Label
    cx.font = '500 8px JetBrains Mono, monospace';
    cx.fillStyle = i === 0 ? COL.indigo : i === 4 ? COL.green : COL.dim;
    cx.fillText(states[i], sx, sy + 16);
    // Arrow to next
    if (i < 4) {
      const nx = stateStartX + (stateW / 4) * (i + 1);
      arrow(sx + 8, sy, nx - 8, sy, 'rgba(99,102,241,0.2)');
    }
  }

  // Queue
  box(midX - 180, queueY, 130, 40, 'Queue', 'Async tasks', COL.cyan, '\\u{1F4EC}');

  // DLQ
  box(midX - 180, queueY + 60, 100, 30, 'Dead Letter Q', 'Poison msgs', COL.red, '\\u{1F4AD}');

  // Workflow
  box(midX + 180, wfY, 160, 40, 'Workflow v2', 'Human approval gate', COL.indigo, '\\u{1F504}');

  // R2
  box(midX + 180, wfY + 60, 130, 30, 'R2 Storage', 'Compliance docs', COL.green, '\\u{1F4E6}');

  // External adapters
  box(midX, outcomeY, 180, 40, 'Port/Adapter Layer', 'Swappable integrations', COL.indigo, '\\u{1F50C}');

  // External systems
  const extY = outcomeY + 55;
  const extSpacing = Math.min(160, (cW - 60) / 4);
  const extStartX = midX - extSpacing * 1.5;
  const exts = [
    {label: 'Bank API', icon: '\\u{1F3E6}', color: COL.cyan},
    {label: 'PSP Bridge', icon: '\\u{1F310}', color: COL.amber},
    {label: 'Exchange', icon: '\\u{1F4B1}', color: COL.green},
    {label: 'Accounting', icon: '\\u{1F4DA}', color: COL.indigo},
  ];
  // Only show if there's room
  if (cH > 460) {
    exts.forEach((e, i) => {
      const ex = extStartX + i * extSpacing;
      box(ex, extY, 100, 30, e.label, null, e.color, e.icon);
      arrow(ex, outcomeY + 20, ex, extY - 15, (e.color + '44'), i === 1);
    });
    // PSP label
    cx.font = '500 8px JetBrains Mono, monospace';
    cx.fillStyle = COL.amber;
    cx.textAlign = 'center';
    cx.fillText('Phase 1 only', extStartX + extSpacing, extY + 22);
  }

  // Arrows
  arrow(midX, userY + 18, midX, workerY - 20, 'rgba(6,182,212,0.4)');
  arrow(midX - 40, workerY + 20, midX - 200, d1Y - 18, 'rgba(34,197,94,0.3)');
  arrow(midX, workerY + 20, midX, doY - 25, 'rgba(245,158,11,0.3)');
  arrow(midX - 60, doY + 10, midX - 180, queueY - 20, 'rgba(6,182,212,0.3)');
  arrow(midX + 60, doY + 10, midX + 180, wfY - 20, 'rgba(99,102,241,0.3)');
  arrow(midX - 180, queueY + 20, midX - 180, queueY + 40, 'rgba(239,68,68,0.2)', true);
  arrow(midX + 180, wfY + 20, midX + 180, wfY + 40, 'rgba(34,197,94,0.2)', true);
  arrow(midX, doY + 25, midX, outcomeY - 20, 'rgba(99,102,241,0.2)');

  // Labels
  cx.font = '500 9px JetBrains Mono, monospace';
  cx.fillStyle = COL.dim; cx.textAlign = 'left';
  cx.fillText('HTTPS POST', midX + 8, userY + 34);
  cx.fillText('creates record', midX - 170, workerY + 40);
  cx.fillText('creates/resumes DO', midX + 8, workerY + 50);

  return [];
}

function switchDiagram(m) {
  mode = m;
  particles = [];
  document.querySelectorAll('.diagram-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.diagram-tab:' + (m === 'pipeline' ? 'first-child' : 'last-child')).classList.add('active');
  document.getElementById('diagram-caption').textContent =
    m === 'pipeline'
      ? 'A payment request enters the Worker, gets stored in D1, flows through 5 agents, and reaches a verdict.'
      : 'A transaction enters the Worker, gets stored in D1, and is managed by a Durable Object state machine with Queue and Workflow support.';
}
window.switchDiagram = switchDiagram;

let lastT = 0;
function animDiagram(ts) {
  const dt = ts - lastT; lastT = ts;
  animT += dt;

  resizeCanvas();
  cx.clearRect(0, 0, cW, cH);

  // Grid dots
  cx.fillStyle = 'rgba(99,102,241,0.03)';
  for (let gx = 0; gx < cW; gx += 25) {
    for (let gy = 0; gy < cH; gy += 25) {
      cx.beginPath(); cx.arc(gx, gy, 0.8, 0, Math.PI * 2); cx.fill();
    }
  }

  if (mode === 'pipeline') drawPipeline();
  else drawTransaction();

  // Animate a pulse on key nodes
  const pulse = 0.5 + 0.5 * Math.sin(animT / 500);
  cx.globalAlpha = pulse * 0.3;
  if (mode === 'pipeline') {
    cx.beginPath(); cx.arc(cW / 2, 260, 8, 0, Math.PI * 2);
    cx.fillStyle = COL.indigo; cx.fill();
  } else {
    cx.beginPath(); cx.arc(cW / 2, 260, 8, 0, Math.PI * 2);
    cx.fillStyle = COL.amber; cx.fill();
  }
  cx.globalAlpha = 1;

  requestAnimationFrame(animDiagram);
}
requestAnimationFrame(animDiagram);
</script>

</body>
</html>`
