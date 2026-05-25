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

</body>
</html>`
