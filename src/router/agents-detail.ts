import { Hono } from 'hono'
import type { Env } from '../lib/env'

const agentsDetail = new Hono<{ Bindings: Env }>()

agentsDetail.get('/agents', (c) => {
  return c.html(AGENTS_HTML)
})

export { agentsDetail }

const AGENTS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agent Architecture</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #020617;
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
    background: rgba(2, 6, 23, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
  }
  .nav-brand {
    font-size: 18px; font-weight: 700;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .nav-links { display: flex; align-items: center; gap: 0; }
  .nav-links a {
    color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500;
    margin-left: 24px; transition: color 0.2s;
  }
  .nav-links a:hover, .nav-links a.active { color: #e2e8f0; }

  /* ── Layout ──────────────────────────────── */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
  }

  /* ── Hero ─────────────────────────────────── */
  .hero {
    padding: 120px 32px 48px;
    text-align: center;
  }
  .hero h1 {
    font-size: 42px; font-weight: 800;
    background: linear-gradient(135deg, #e2e8f0 0%, #818cf8 50%, #6366f1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 12px;
  }
  .hero p {
    font-size: 16px; color: #94a3b8; max-width: 720px; margin: 0 auto;
    line-height: 1.7;
  }

  /* ── Section headings ────────────────────── */
  .section-heading {
    font-size: 28px; font-weight: 700; color: #f1f5f9;
    margin: 56px 0 8px;
  }
  .section-sub {
    font-size: 14px; color: #94a3b8; margin-bottom: 32px;
    line-height: 1.6;
  }

  /* ── Pipeline flow ───────────────────────── */
  .pipeline-flow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin-bottom: 40px;
    padding: 24px 0;
    overflow-x: auto;
  }
  .pipeline-node {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 10px;
    padding: 12px 20px;
    text-align: center;
    min-width: 120px;
    flex-shrink: 0;
  }
  .pipeline-node .p-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 500; color: #6366f1;
    margin-bottom: 4px;
  }
  .pipeline-node .p-name {
    font-size: 14px; font-weight: 600; color: #e2e8f0;
  }
  .pipeline-arrow {
    color: #6366f1;
    font-size: 20px;
    padding: 0 8px;
    flex-shrink: 0;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Agent card ──────────────────────────── */
  .agent-card {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: 14px;
    padding: 28px 28px 24px;
    margin-bottom: 24px;
    position: relative;
  }
  .agent-card.pipeline {
    border-left: 3px solid #6366f1;
  }
  .agent-card.ops {
    border-left: 3px solid #22c55e;
  }
  .agent-card:hover {
    border-color: rgba(99, 102, 241, 0.25);
  }
  .agent-card.pipeline:hover {
    border-left-color: #818cf8;
  }
  .agent-card.ops:hover {
    border-left-color: #4ade80;
  }

  .agent-title {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 4px;
  }
  .agent-title h3 {
    font-size: 20px; font-weight: 700; color: #f1f5f9;
  }
  .agent-position {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 500;
    padding: 2px 10px;
    border-radius: 5px;
  }
  .agent-position.pipeline-pos {
    color: #818cf8;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
  .agent-position.ops-pos {
    color: #4ade80;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
  .agent-desc {
    font-size: 14px; color: #94a3b8; margin-bottom: 20px;
  }

  /* ── Architecture sections ───────────────── */
  .arch-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 768px) {
    .arch-grid { grid-template-columns: 1fr; }
  }
  .arch-box {
    background: rgba(2, 6, 23, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.06);
    border-radius: 10px;
    padding: 16px 18px;
  }
  .arch-box.full {
    grid-column: 1 / -1;
  }
  .arch-label {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.08em; color: #64748b;
    margin-bottom: 8px;
  }
  .arch-label.indigo { color: #818cf8; }
  .arch-label.green { color: #4ade80; }
  .arch-label.amber { color: #fbbf24; }
  .arch-label.red { color: #f87171; }

  .arch-text {
    font-size: 13px; color: #cbd5e1; line-height: 1.7;
  }
  .arch-text .none {
    color: #64748b; font-style: italic;
  }

  /* ── Port call rows ──────────────────────── */
  .port-call {
    display: flex; align-items: baseline; gap: 8px;
    padding: 4px 0;
    font-size: 13px;
  }
  .port-method {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; color: #c4b5fd;
    white-space: nowrap;
  }
  .port-arrow {
    color: #475569; font-family: 'JetBrains Mono', monospace;
    font-size: 11px; flex-shrink: 0;
  }
  .port-target {
    font-size: 12px; color: #94a3b8;
  }
  .port-target .sandbox { color: #64748b; }
  .port-target .prod { color: #fbbf24; }

  /* ── D1 rows ─────────────────────────────── */
  .d1-row {
    padding: 3px 0;
    font-size: 13px; color: #cbd5e1;
  }
  .d1-table {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; color: #34d399;
  }
  .d1-query {
    color: #94a3b8; font-size: 12px;
  }

  /* ── Returns ─────────────────────────────── */
  .returns-row {
    padding: 3px 0;
    font-size: 13px; color: #cbd5e1;
  }
  .verdict-tag {
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 600;
    padding: 1px 8px; border-radius: 3px;
    margin-right: 4px;
  }
  .verdict-tag.green { background: rgba(34,197,94,0.15); color: #4ade80; }
  .verdict-tag.amber { background: rgba(245,158,11,0.15); color: #fbbf24; }
  .verdict-tag.red { background: rgba(239,68,68,0.15); color: #f87171; }

  /* ── Ops grid ────────────────────────────── */
  .ops-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 40px;
  }
  @media (max-width: 900px) {
    .ops-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 600px) {
    .ops-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .ops-node {
    background: #0f172a;
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 10px;
    padding: 14px 16px;
    text-align: center;
  }
  .ops-node .o-name {
    font-size: 13px; font-weight: 600; color: #e2e8f0;
  }
  .ops-node .o-trigger {
    font-size: 11px; color: #64748b; margin-top: 4px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Interface blocks ────────────────────── */
  .interface-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 48px;
  }
  @media (max-width: 768px) {
    .interface-grid { grid-template-columns: 1fr; }
  }
  .interface-block {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: 12px;
    padding: 24px;
  }
  .interface-block h4 {
    font-size: 16px; font-weight: 700; color: #f1f5f9;
    margin-bottom: 4px;
  }
  .interface-block .i-sub {
    font-size: 12px; color: #64748b; margin-bottom: 16px;
  }
  .code-block {
    background: rgba(2, 6, 23, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.08);
    border-radius: 8px;
    padding: 16px 18px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.8;
    overflow-x: auto;
    white-space: pre;
  }
  .code-block .kw { color: #c4b5fd; }
  .code-block .type { color: #818cf8; }
  .code-block .str { color: #34d399; }
  .code-block .comment { color: #475569; }
  .code-block .prop { color: #e2e8f0; }

  /* ── Tables ──────────────────────────────── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-bottom: 48px;
  }
  .data-table th {
    text-align: left;
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(99, 102, 241, 0.12);
    white-space: nowrap;
  }
  .data-table td {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(99, 102, 241, 0.05);
    color: #cbd5e1;
    vertical-align: top;
  }
  .data-table tr:hover td {
    background: rgba(99, 102, 241, 0.03);
  }
  .data-table .mono {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #c4b5fd;
  }
  .data-table .tbl {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #34d399;
  }
  .data-table .agent-list {
    color: #94a3b8;
  }
  .data-table .sandbox-col { color: #64748b; }
  .data-table .prod-col { color: #fbbf24; }

  /* ── Responsive ──────────────────────────── */
  @media (max-width: 600px) {
    .hero h1 { font-size: 28px; }
    .hero { padding: 100px 16px 32px; }
    .container { padding: 0 16px; }
    .agent-card { padding: 20px 16px; }
    .arch-grid { gap: 12px; }
    .pipeline-flow { justify-content: flex-start; }
    .data-table { font-size: 12px; }
    .data-table th, .data-table td { padding: 8px 10px; }
    .nav { padding: 12px 16px; }
    .nav-links a { margin-left: 12px; font-size: 12px; }
  }

  /* ── Scroll padding for anchor nav ───────── */
  [id] { scroll-margin-top: 80px; }

  /* ── Responsive table wrapper ────────────── */
  .table-wrap {
    overflow-x: auto;
    margin-bottom: 48px;
  }
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-brand">FF-TEST</div>
  <div class="nav-links">
    <a href="/">Overview</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/flowchart">Architecture</a>
    <a href="/agents" class="active">Agents</a>
    <a href="/api-explorer">API</a>
    <a href="/simulate">Simulate</a>
    <a href="/readiness">Readiness</a>
  </div>
</nav>

<!-- ════════════════════════════════════════════════════════════════ -->
<!-- HERO                                                            -->
<!-- ════════════════════════════════════════════════════════════════ -->

<div class="hero">
  <h1>Agent Architecture</h1>
  <p>10 agents, two tracks. Pipeline agents process every transaction inline. Operations agents run the back office autonomously.</p>
</div>

<div class="container">

<!-- ════════════════════════════════════════════════════════════════ -->
<!-- SECTION 1: PIPELINE TRACK                                       -->
<!-- ════════════════════════════════════════════════════════════════ -->

<h2 class="section-heading" id="pipeline">Pipeline Track</h2>
<p class="section-sub">Five agents execute sequentially on every payment request. A RED verdict at any stage short-circuits the pipeline.</p>

<div class="pipeline-flow">
  <div class="pipeline-node">
    <div class="p-num">01</div>
    <div class="p-name">Validate</div>
  </div>
  <div class="pipeline-arrow">&rarr;</div>
  <div class="pipeline-node">
    <div class="p-num">02</div>
    <div class="p-name">Quote</div>
  </div>
  <div class="pipeline-arrow">&rarr;</div>
  <div class="pipeline-node">
    <div class="p-num">03</div>
    <div class="p-name">Screen</div>
  </div>
  <div class="pipeline-arrow">&rarr;</div>
  <div class="pipeline-node">
    <div class="p-num">04</div>
    <div class="p-name">Execute</div>
  </div>
  <div class="pipeline-arrow">&rarr;</div>
  <div class="pipeline-node">
    <div class="p-num">05</div>
    <div class="p-name">Reconcile</div>
  </div>
</div>

<!-- ── Validate Agent ──────────────────────────────────────────── -->

<div class="agent-card pipeline">
  <div class="agent-title">
    <h3>ValidateAgent</h3>
    <span class="agent-position pipeline-pos">01 / pipeline</span>
  </div>
  <div class="agent-desc">Field validation and client eligibility. Pure logic &mdash; no external calls, no database access.</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label indigo">Receives</div>
      <div class="arch-text">
        <span class="port-method">PaymentRequest</span> &mdash; id, clientId, clientName, amountCents, currencyFrom, currencyTo, description?
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Calls</div>
      <div class="arch-text">
        <span class="none">Nothing. Pure in-process validation.</span><br>
        <span style="color:#64748b;font-size:12px;">Future: <span class="port-method">VerificationPort.getVerificationStatus()</span></span>
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Reads</div>
      <div class="arch-text"><span class="none">No D1 queries.</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Writes</div>
      <div class="arch-text"><span class="none">No D1 writes.</span></div>
    </div>

    <div class="arch-box full">
      <div class="arch-label indigo">Returns &mdash; AgentResult</div>
      <div class="returns-row"><span class="verdict-tag green">GREEN</span> All fields valid, client eligible, KYC current</div>
      <div class="returns-row"><span class="verdict-tag amber">AMBER</span> KYC expiring soon, or missing description (audit trail gap)</div>
      <div class="returns-row"><span class="verdict-tag red">RED</span> Missing clientId/clientName, zero/negative amount, unsupported currency, same-currency pair, KYC expired</div>
    </div>
  </div>
</div>

<!-- ── Quote Agent ─────────────────────────────────────────────── -->

<div class="agent-card pipeline">
  <div class="agent-title">
    <h3>QuoteAgent</h3>
    <span class="agent-position pipeline-pos">02 / pipeline</span>
  </div>
  <div class="agent-desc">Looks up the exchange rate for the currency pair and calculates the output amount. Quoting is binary &mdash; the pair is supported or it is not.</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label indigo">Receives</div>
      <div class="arch-text">
        <span class="port-method">PaymentRequest</span> &mdash; reads currencyFrom, currencyTo, amountCents
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Calls</div>
      <div class="arch-text">
        <span class="none">Nothing. Hardcoded rate map (8 pairs: CAD, USD, EUR, GBP &harr; USDC).</span><br>
        <span style="color:#64748b;font-size:12px;">Future: <span class="port-method">ExchangePort.getQuote()</span> <span class="port-arrow">&rarr;</span> <span class="prod">Bridge API</span></span>
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Reads</div>
      <div class="arch-text"><span class="none">No D1 queries.</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Writes</div>
      <div class="arch-text"><span class="none">No D1 writes.</span></div>
    </div>

    <div class="arch-box full">
      <div class="arch-label indigo">Returns &mdash; AgentResult</div>
      <div class="arch-text" style="margin-bottom:8px;">
        detail: <span class="port-method">{ rate, pair, inputAmountCents, outputAmountCents, spread, expiresIn }</span>
      </div>
      <div class="returns-row"><span class="verdict-tag green">GREEN</span> Pair supported &mdash; rate, outputAmountCents, spread (0.1% if &gt; $500, 0.5% otherwise)</div>
      <div class="returns-row"><span class="verdict-tag red">RED</span> Unsupported currency pair</div>
      <div class="returns-row" style="color:#64748b;font-size:12px;">Never AMBER. Quoting is binary.</div>
    </div>
  </div>
</div>

<!-- ── Screen Agent ────────────────────────────────────────────── -->

<div class="agent-card pipeline">
  <div class="agent-title">
    <h3>ScreenAgent</h3>
    <span class="agent-position pipeline-pos">03 / pipeline</span>
  </div>
  <div class="agent-desc">Transaction monitoring &mdash; sanctions screening, velocity checks, amount thresholds, counterparty risk. The real compliance gate.</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label indigo">Receives</div>
      <div class="arch-text">
        <span class="port-method">PaymentRequest</span> &mdash; reads clientName (sanctions), clientId (velocity), amountCents, currencyTo
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Calls</div>
      <div class="arch-text">
        <span class="none">Nothing external. Hardcoded sanctions list (SANCTIONED_CORP, BLOCKED_ENTITY, OFAC_TARGET).</span><br>
        <span style="color:#64748b;font-size:12px;">Future: <span class="port-method">CompliancePort.screenEntity()</span> <span class="port-arrow">&rarr;</span> <span class="prod">OFAC / ComplyAdvantage</span></span>
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Reads</div>
      <div class="d1-row"><span class="d1-table">payment_requests</span> <span class="d1-query">&mdash; COUNT(*) WHERE client_id = ? AND created_at &gt; 1 hour ago (velocity)</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Writes</div>
      <div class="arch-text"><span class="none">No D1 writes.</span></div>
    </div>

    <div class="arch-box full">
      <div class="arch-label indigo">Returns &mdash; AgentResult</div>
      <div class="arch-text" style="margin-bottom:8px;">
        detail: <span class="port-method">{ sanctionsHit, velocityCount, velocityWindow, amountFlags, riskNotes }</span>
      </div>
      <div class="returns-row"><span class="verdict-tag green">GREEN</span> All screens clear</div>
      <div class="returns-row"><span class="verdict-tag amber">AMBER</span> Single warning: velocity &gt; 5/hr, or amount &gt; $100k, or USDT destination</div>
      <div class="returns-row"><span class="verdict-tag red">RED</span> Sanctions hit, or 2+ amber signals compound to red</div>
    </div>
  </div>
</div>

<!-- ── Execute Agent ───────────────────────────────────────────── -->

<div class="agent-card pipeline">
  <div class="agent-title">
    <h3>ExecuteAgent</h3>
    <span class="agent-position pipeline-pos">04 / pipeline</span>
  </div>
  <div class="agent-desc">Calls adapters to move funds &mdash; checks balance, initiates fiat transfer, converts to stablecoin, submits PSP payment, writes ledger entries.</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label indigo">Receives</div>
      <div class="arch-text">
        <span class="port-method">PaymentRequest</span> + injected adapters: <span class="port-method">BankPort</span>, <span class="port-method">ExchangePort</span>, <span class="port-method">PSPPort</span>
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Calls</div>
      <div class="port-call">
        <span class="port-method">BankPort.getBalance()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">MockBankAdapter</span> / <span class="prod">StripeBankAdapter</span></span>
      </div>
      <div class="port-call">
        <span class="port-method">BankPort.initiateTransfer()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">MockBankAdapter</span> / <span class="prod">StripeBankAdapter</span></span>
      </div>
      <div class="port-call">
        <span class="port-method">ExchangePort.convertFiatToStable()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">BridgeSimAdapter</span> / <span class="prod">BridgeExchangeAdapter</span></span>
      </div>
      <div class="port-call">
        <span class="port-method">PSPPort.submitPayment()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">MockPSPAdapter</span> / <span class="prod">StripePSPAdapter</span></span>
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Reads</div>
      <div class="arch-text"><span class="none">No D1 reads.</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Writes</div>
      <div class="d1-row"><span class="d1-table">ledger_entries</span> <span class="d1-query">&mdash; INSERT debit (fiat rail, currencyFrom) + credit (stablecoin rail, currencyTo)</span></div>
    </div>

    <div class="arch-box full">
      <div class="arch-label indigo">Returns &mdash; AgentResult</div>
      <div class="arch-text" style="margin-bottom:8px;">
        detail: <span class="port-method">{ transferId, conversionId, pspPaymentId, debitEntry, creditEntry, settlementStatus }</span>
      </div>
      <div class="returns-row"><span class="verdict-tag green">GREEN</span> Funds moved, ledger balanced, settlement completed</div>
      <div class="returns-row"><span class="verdict-tag amber">AMBER</span> Transfer initiated but settlement pending, or PSP payment awaiting webhook</div>
      <div class="returns-row"><span class="verdict-tag red">RED</span> Insufficient funds (&gt; $5,000 simulated) or adapter error</div>
    </div>
  </div>
</div>

<!-- ── Reconcile Agent ─────────────────────────────────────────── -->

<div class="agent-card pipeline">
  <div class="agent-title">
    <h3>ReconcileAgent</h3>
    <span class="agent-position pipeline-pos">05 / pipeline</span>
  </div>
  <div class="agent-desc">Post-execution bookkeeping &mdash; checks that debit and credit ledger entries balance, scans for duplicate payments in the last 24 hours.</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label indigo">Receives</div>
      <div class="arch-text">
        <span class="port-method">PaymentRequest</span> &mdash; uses id (ledger lookup), clientId + amountCents (duplicate detection)
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Calls</div>
      <div class="arch-text"><span class="none">Nothing. Pure D1 queries.</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Reads</div>
      <div class="d1-row"><span class="d1-table">ledger_entries</span> <span class="d1-query">&mdash; SELECT type, amount_cents WHERE reference = ? (balance check)</span></div>
      <div class="d1-row"><span class="d1-table">payment_requests</span> <span class="d1-query">&mdash; SELECT id WHERE client_id = ? AND amount_cents = ? AND created_at &gt; 24h ago AND id != ? (duplicates)</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label indigo">Writes</div>
      <div class="arch-text"><span class="none">No D1 writes.</span></div>
    </div>

    <div class="arch-box full">
      <div class="arch-label indigo">Returns &mdash; AgentResult</div>
      <div class="arch-text" style="margin-bottom:8px;">
        detail: <span class="port-method">{ ledgerBalanced, debitTotal, creditTotal, duplicateCount, matchingIds }</span>
      </div>
      <div class="returns-row"><span class="verdict-tag green">GREEN</span> Ledger balanced, no duplicates</div>
      <div class="returns-row"><span class="verdict-tag amber">AMBER</span> 1 possible duplicate, or debit/credit mismatch</div>
      <div class="returns-row"><span class="verdict-tag red">RED</span> 2+ duplicates detected &mdash; likely double-payment</div>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════════ -->
<!-- SECTION 2: OPERATIONS TRACK                                     -->
<!-- ════════════════════════════════════════════════════════════════ -->

<h2 class="section-heading" id="operations">Operations Track</h2>
<p class="section-sub">Five agents run on schedules or manual triggers. They operate across many transactions, not a single request. Each writes to agent_decisions for audit.</p>

<div class="ops-grid">
  <div class="ops-node">
    <div class="o-name">Settlement</div>
    <div class="o-trigger">cron / manual</div>
  </div>
  <div class="ops-node">
    <div class="o-name">Reconciliation</div>
    <div class="o-trigger">cron / manual</div>
  </div>
  <div class="ops-node">
    <div class="o-name">Fraud</div>
    <div class="o-trigger">cron / manual</div>
  </div>
  <div class="ops-node">
    <div class="o-name">AML</div>
    <div class="o-trigger">cron / manual</div>
  </div>
  <div class="ops-node">
    <div class="o-name">Payments Ops</div>
    <div class="o-trigger">cron / manual</div>
  </div>
</div>

<!-- ── Settlement Agent ────────────────────────────────────────── -->

<div class="agent-card ops">
  <div class="agent-title">
    <h3>SettlementAgent</h3>
    <span class="agent-position ops-pos">ops / settlement</span>
  </div>
  <div class="agent-desc">Polls PENDING_SETTLEMENT transactions, confirms finality on both fiat and stablecoin rails (dual-confirmation rule), advances Durable Object state.</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label green">Trigger</div>
      <div class="arch-text">Scheduled (every 5 min) or manual via <span class="port-method">POST /ops/run</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Calls</div>
      <div class="port-call">
        <span class="port-method">BankPort.getTransferStatus()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">MockBankAdapter</span> / <span class="prod">StripeBankAdapter</span></span>
      </div>
      <div class="port-call">
        <span class="port-method">ExchangePort.getConversionStatus()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">BridgeSimAdapter</span> / <span class="prod">BridgeExchangeAdapter</span></span>
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Reads</div>
      <div class="d1-row"><span class="d1-table">transactions</span> <span class="d1-query">&mdash; WHERE status = 'PENDING_SETTLEMENT'</span></div>
      <div class="d1-row"><span class="d1-table">ledger_entries</span> <span class="d1-query">&mdash; WHERE transaction_id = ? (fetch associated entries)</span></div>
      <div class="d1-row"><span class="d1-table">agent_decisions</span> <span class="d1-query">&mdash; WHERE request_id = ? AND agent_type = 'execute' (get transferId, conversionId)</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Writes</div>
      <div class="d1-row"><span class="d1-table">transactions</span> <span class="d1-query">&mdash; UPDATE status to SETTLED or FAILED</span></div>
      <div class="d1-row"><span class="d1-table">ledger_entries</span> <span class="d1-query">&mdash; UPDATE reconciled = 1 (on settlement)</span></div>
      <div class="d1-row"><span class="d1-table">agent_decisions</span> <span class="d1-query">&mdash; INSERT verdict per transaction</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Advances DO</div>
      <div class="arch-text">
        PENDING_SETTLEMENT <span class="port-arrow">&rarr;</span> <span style="color:#4ade80">SETTLED</span> (dual confirmation)<br>
        PENDING_SETTLEMENT <span class="port-arrow">&rarr;</span> <span style="color:#f87171">FAILED</span> (bank or exchange failure)
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label amber">Escalates</div>
      <div class="arch-text">Stale settlements pending &gt; 2 hours &mdash; writes amber agent_decisions with STALE_SETTLEMENT action</div>
    </div>
  </div>
</div>

<!-- ── Reconciliation Agent ────────────────────────────────────── -->

<div class="agent-card ops">
  <div class="agent-title">
    <h3>ReconciliationAgent</h3>
    <span class="agent-position ops-pos">ops / reconciliation</span>
  </div>
  <div class="agent-desc">Matches ledger entries across internal records and external sources (bank, accounting). Flags mismatches as exceptions. Tolerance: 0.01%.</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label green">Trigger</div>
      <div class="arch-text">Scheduled (micro-recon every 15 min, full recon daily) or manual via <span class="port-method">POST /ops/run</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Calls</div>
      <div class="port-call">
        <span class="port-method">BankPort.listTransactions()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">MockBankAdapter</span> / <span class="prod">StripeBankAdapter</span></span>
      </div>
      <div class="port-call">
        <span class="port-method">AccountingPort.getUnreconciledEntries()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">MockAccountingAdapter</span> / <span class="prod">XeroAdapter</span></span>
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Reads</div>
      <div class="d1-row"><span class="d1-table">ledger_entries</span> <span class="d1-query">&mdash; WHERE reconciled = 0 (grouped by transaction_id)</span></div>
      <div class="d1-row"><span class="d1-table">payment_requests</span> <span class="d1-query">&mdash; duplicate detection: same client_id + amount in 24h window</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Writes</div>
      <div class="d1-row"><span class="d1-table">reconciliation_exceptions</span> <span class="d1-query">&mdash; INSERT amount_mismatch, missing_bank_entry, missing_accounting_entry, duplicate_entry</span></div>
      <div class="d1-row"><span class="d1-table">agent_decisions</span> <span class="d1-query">&mdash; INSERT per transaction (RECONCILED or EXCEPTIONS_FOUND)</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Advances DO</div>
      <div class="arch-text"><span class="none">No DO state transitions.</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label amber">Escalates</div>
      <div class="arch-text">Amount mismatches beyond 0.01% tolerance, missing bank entries, missing accounting entries, duplicate payments (2+)</div>
    </div>
  </div>
</div>

<!-- ── Fraud Detection Agent ───────────────────────────────────── -->

<div class="agent-card ops">
  <div class="agent-title">
    <h3>FraudDetectionAgent</h3>
    <span class="agent-position ops-pos">ops / fraud</span>
  </div>
  <div class="agent-desc">Batch analysis of recent transactions for anomalous patterns. Scores each transaction 0-100 using velocity, amount anomaly, structuring, and rapid movement signals.</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label green">Trigger</div>
      <div class="arch-text">Scheduled or manual via <span class="port-method">POST /ops/run</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Calls</div>
      <div class="arch-text"><span class="none">Nothing external. All analysis from D1 data.</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Reads</div>
      <div class="d1-row"><span class="d1-table">transactions</span> <span class="d1-query">&mdash; LEFT JOIN agent_decisions WHERE agent_type = 'fraud' IS NULL AND created_at &gt; 1h (unchecked)</span></div>
      <div class="d1-row"><span class="d1-table">transactions</span> <span class="d1-query">&mdash; COUNT by client_id (hourly + daily velocity)</span></div>
      <div class="d1-row"><span class="d1-table">transactions</span> <span class="d1-query">&mdash; AVG(amount_cents) by client_id (amount anomaly)</span></div>
      <div class="d1-row"><span class="d1-table">transactions</span> <span class="d1-query">&mdash; structuring: $90-$100 range in 24h, rapid AR+AP in 1h</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Writes</div>
      <div class="d1-row"><span class="d1-table">agent_decisions</span> <span class="d1-query">&mdash; INSERT with score-based verdict: green (&le;30), amber (31-60), amber/HOLD (61-80), red/HOLD (81+)</span></div>
      <div class="d1-row"><span class="d1-table">fraud_cases</span> <span class="d1-query">&mdash; INSERT for score 61+: status 'open' (61-80) or 'investigating' (81+)</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Advances DO</div>
      <div class="arch-text">
        Score 61+ <span class="port-arrow">&rarr;</span> <span style="color:#fbbf24">HELD_FOR_REVIEW</span> (sends hold request to DO via <span class="port-method">POST /hold</span>)
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label amber">Escalates</div>
      <div class="arch-text">Compound risk signals (score 61+). Score 81+ triggers immediate investigation status. Signals: high_hourly_velocity, high_daily_velocity, amount_anomaly, structuring, rapid_movement</div>
    </div>
  </div>
</div>

<!-- ── AML Compliance Agent ────────────────────────────────────── -->

<div class="agent-card ops">
  <div class="agent-title">
    <h3>AMLComplianceAgent</h3>
    <span class="agent-position ops-pos">ops / aml</span>
  </div>
  <div class="agent-desc">Three sequential sub-tasks: sanctions re-screening of stale counterparties, FINTRAC threshold monitoring (LCTR/EFTR), suspicious activity detection (STR drafts from fraud signals).</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label green">Trigger</div>
      <div class="arch-text">Scheduled or manual via <span class="port-method">POST /ops/run</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Calls</div>
      <div class="port-call">
        <span class="port-method">CompliancePort.screenEntity()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">MockComplianceAdapter</span> / <span class="prod">OFAC / ComplyAdvantage</span></span>
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Reads</div>
      <div class="d1-row"><span class="d1-table">counterparties</span> <span class="d1-query">&mdash; WHERE last_screened_at IS NULL OR &gt; 24h stale</span></div>
      <div class="d1-row"><span class="d1-table">transactions</span> <span class="d1-query">&mdash; LCTR: amount_cents &ge; $10k CAD. EFTR: cross-currency &ge; $1k CAD. Joined with regulatory_reports to find unreported.</span></div>
      <div class="d1-row"><span class="d1-table">agent_decisions</span> <span class="d1-query">&mdash; WHERE agent_type = 'fraud' AND verdict IN ('amber','red') AND created_at &gt; 24h (STR source)</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Writes</div>
      <div class="d1-row"><span class="d1-table">sanctions_screenings</span> <span class="d1-query">&mdash; INSERT per counterparty screened (result, match_score, lists_checked)</span></div>
      <div class="d1-row"><span class="d1-table">regulatory_reports</span> <span class="d1-query">&mdash; INSERT LCTR, EFTR, STR drafts</span></div>
      <div class="d1-row"><span class="d1-table">agent_decisions</span> <span class="d1-query">&mdash; INSERT per screening + summary RUN_COMPLETE</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Advances DO</div>
      <div class="arch-text">
        Sanctions match <span class="port-arrow">&rarr;</span> <span style="color:#fbbf24">HELD_FOR_REVIEW</span> (holds all active transactions for the matched counterparty's client)
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label amber">Escalates</div>
      <div class="arch-text">Any sanctions match or partial match. Updates counterparty status to 'match' or 'pending_review'. Partial matches get amber agent_decisions for human review.</div>
    </div>
  </div>
</div>

<!-- ── Payments Ops Agent ──────────────────────────────────────── -->

<div class="agent-card ops">
  <div class="agent-title">
    <h3>PaymentsOpsAgent</h3>
    <span class="agent-position ops-pos">ops / payments-ops</span>
  </div>
  <div class="agent-desc">Exception handler &mdash; detects stuck transactions, auto-retries open cases, and cleans up stale cases after 7 days. Three sequential sub-tasks.</div>

  <div class="arch-grid">
    <div class="arch-box">
      <div class="arch-label green">Trigger</div>
      <div class="arch-text">Scheduled or manual via <span class="port-method">POST /ops/run</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Calls</div>
      <div class="port-call">
        <span class="port-method">PSPPort.getPaymentStatus()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">MockPSPAdapter</span> / <span class="prod">StripePSPAdapter</span></span>
      </div>
      <div class="port-call">
        <span class="port-method">BankPort.getTransferStatus()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">MockBankAdapter</span> / <span class="prod">StripeBankAdapter</span></span>
      </div>
      <div class="port-call">
        <span class="port-method">ExchangePort.getConversionStatus()</span>
        <span class="port-arrow">&rarr;</span>
        <span class="port-target"><span class="sandbox">BridgeSimAdapter</span> / <span class="prod">BridgeExchangeAdapter</span></span>
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Reads</div>
      <div class="d1-row"><span class="d1-table">transactions</span> <span class="d1-query">&mdash; stuck detection: INITIATED &gt; 10 min, PENDING_PSP &gt; 1 hr, PENDING_SETTLEMENT &gt; 2 hr</span></div>
      <div class="d1-row"><span class="d1-table">ops_cases</span> <span class="d1-query">&mdash; WHERE status IN ('open','retrying') AND retry_count &lt; max_retries</span></div>
      <div class="d1-row"><span class="d1-table">agent_decisions</span> <span class="d1-query">&mdash; WHERE agent_type = 'execute' (get transferId, conversionId, pspPaymentId)</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Writes</div>
      <div class="d1-row"><span class="d1-table">ops_cases</span> <span class="d1-query">&mdash; INSERT new cases, UPDATE status (retrying/resolved/escalated/closed)</span></div>
      <div class="d1-row"><span class="d1-table">transactions</span> <span class="d1-query">&mdash; UPDATE status on successful retry (PENDING_SETTLEMENT, SETTLED, FAILED)</span></div>
      <div class="d1-row"><span class="d1-table">agent_decisions</span> <span class="d1-query">&mdash; INSERT per action (STUCK_DETECTED, CASE_RESOLVED, CASE_ESCALATED, CASE_AUTO_CLOSED)</span></div>
    </div>

    <div class="arch-box">
      <div class="arch-label green">Advances DO</div>
      <div class="arch-text">
        Retry success <span class="port-arrow">&rarr;</span> advances via <span class="port-method">POST /advance</span> to PENDING_SETTLEMENT, SETTLED, or FAILED<br>
        STUCK_INITIATED <span class="port-arrow">&rarr;</span> pokes DO to retry state transition
      </div>
    </div>

    <div class="arch-box">
      <div class="arch-label amber">Escalates</div>
      <div class="arch-text">Max retries exhausted (default: 3). Terminal failures (PSP failed, bank/exchange failed). Stale cases auto-closed after 7 days with amber decision.</div>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════════ -->
<!-- SECTION 3: AGENT INTERFACES                                     -->
<!-- ════════════════════════════════════════════════════════════════ -->

<h2 class="section-heading" id="interfaces">Agent Interfaces</h2>
<p class="section-sub">Two contracts. Pipeline agents evaluate a single request synchronously. Ops agents run batch processing across many transactions.</p>

<div class="interface-grid">
  <div class="interface-block">
    <h4>PipelineAgent</h4>
    <div class="i-sub">Inline, per-request. Called sequentially by the orchestrator.</div>
    <div class="code-block"><span class="kw">interface</span> <span class="type">PipelineAgent</span> {
  <span class="kw">readonly</span> <span class="prop">type</span>: <span class="type">AgentType</span>
  <span class="comment">// 'validate' | 'quote' | 'screen' | 'execute' | 'reconcile'</span>
  <span class="kw">readonly</span> <span class="prop">name</span>: <span class="type">string</span>
  <span class="prop">evaluate</span>(<span class="prop">request</span>: <span class="type">PaymentRequest</span>): <span class="type">Promise</span>&lt;<span class="type">AgentResult</span>&gt;
}

<span class="kw">interface</span> <span class="type">PaymentRequest</span> {
  <span class="prop">id</span>: <span class="type">string</span>
  <span class="prop">clientId</span>: <span class="type">string</span>
  <span class="prop">clientName</span>: <span class="type">string</span>
  <span class="prop">amountCents</span>: <span class="type">number</span>
  <span class="prop">currencyFrom</span>: <span class="type">string</span>
  <span class="prop">currencyTo</span>: <span class="type">string</span>
  <span class="prop">description</span>?: <span class="type">string</span>
}

<span class="kw">interface</span> <span class="type">AgentResult</span> {
  <span class="prop">agentType</span>: <span class="type">AgentType</span>
  <span class="prop">verdict</span>: <span class="str">'green'</span> | <span class="str">'amber'</span> | <span class="str">'red'</span>
  <span class="prop">action</span>: <span class="type">string</span>
  <span class="prop">reasoning</span>: <span class="type">string</span>
  <span class="prop">detail</span>: <span class="type">Record</span>&lt;<span class="type">string</span>, <span class="type">unknown</span>&gt;
  <span class="prop">durationMs</span>: <span class="type">number</span>
}</div>
  </div>

  <div class="interface-block">
    <h4>OpsAgent</h4>
    <div class="i-sub">Back-office, scheduled. Processes batches across multiple transactions.</div>
    <div class="code-block"><span class="kw">interface</span> <span class="type">OpsAgent</span> {
  <span class="kw">readonly</span> <span class="prop">type</span>: <span class="type">OpsAgentType</span>
  <span class="comment">// 'settlement' | 'reconciliation' | 'fraud' | 'aml' | 'ops'</span>
  <span class="kw">readonly</span> <span class="prop">name</span>: <span class="type">string</span>
  <span class="prop">run</span>(): <span class="type">Promise</span>&lt;<span class="type">OpsRunResult</span>&gt;
}

<span class="kw">interface</span> <span class="type">OpsRunResult</span> {
  <span class="prop">agentType</span>: <span class="type">OpsAgentType</span>
  <span class="prop">verdict</span>: <span class="str">'ok'</span> | <span class="str">'action_taken'</span> | <span class="str">'escalated'</span> | <span class="str">'error'</span>
  <span class="prop">summary</span>: <span class="type">string</span>
  <span class="prop">itemsProcessed</span>: <span class="type">number</span>
  <span class="prop">actionsPerformed</span>: <span class="type">string</span>[]
  <span class="prop">escalations</span>: <span class="type">string</span>[]
  <span class="prop">errors</span>: <span class="type">string</span>[]
  <span class="prop">durationMs</span>: <span class="type">number</span>
}</div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════════ -->
<!-- SECTION 4: PORT CONNECTIONS MAP                                 -->
<!-- ════════════════════════════════════════════════════════════════ -->

<h2 class="section-heading" id="ports">Port Connections Map</h2>
<p class="section-sub">Every external system is accessed through a port interface. Implementations are swapped per environment via dependency injection.</p>

<div class="table-wrap">
<table class="data-table">
  <thead>
    <tr>
      <th>Port</th>
      <th>Methods</th>
      <th>Called By</th>
      <th>Sandbox</th>
      <th>Production</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="mono">BankPort</span></td>
      <td><span class="mono">getBalance</span>, <span class="mono">initiateTransfer</span>, <span class="mono">getTransferStatus</span>, <span class="mono">listTransactions</span></td>
      <td class="agent-list">Execute, Settlement, Reconciliation, Ops</td>
      <td class="sandbox-col">MockBankAdapter</td>
      <td class="prod-col">StripeBankAdapter</td>
    </tr>
    <tr>
      <td><span class="mono">PSPPort</span></td>
      <td><span class="mono">submitPayment</span>, <span class="mono">getPaymentStatus</span></td>
      <td class="agent-list">Execute, Ops</td>
      <td class="sandbox-col">MockPSPAdapter</td>
      <td class="prod-col">StripePSPAdapter</td>
    </tr>
    <tr>
      <td><span class="mono">ExchangePort</span></td>
      <td><span class="mono">getQuote</span>, <span class="mono">convertFiatToStable</span>, <span class="mono">convertStableToFiat</span>, <span class="mono">getConversionStatus</span></td>
      <td class="agent-list">Execute, Settlement, Ops</td>
      <td class="sandbox-col">BridgeSimAdapter</td>
      <td class="prod-col">BridgeExchangeAdapter</td>
    </tr>
    <tr>
      <td><span class="mono">AccountingPort</span></td>
      <td><span class="mono">createInvoice</span>, <span class="mono">reconcileEntry</span>, <span class="mono">getUnreconciledEntries</span></td>
      <td class="agent-list">Reconciliation</td>
      <td class="sandbox-col">MockAccountingAdapter</td>
      <td class="prod-col">XeroAdapter</td>
    </tr>
    <tr>
      <td><span class="mono">CompliancePort</span></td>
      <td><span class="mono">screenEntity</span>, <span class="mono">getListUpdates</span></td>
      <td class="agent-list">AML</td>
      <td class="sandbox-col">MockComplianceAdapter</td>
      <td class="prod-col">OFAC / ComplyAdvantage</td>
    </tr>
    <tr>
      <td><span class="mono">VerificationPort</span></td>
      <td><span class="mono">initiateVerification</span>, <span class="mono">getVerificationStatus</span></td>
      <td class="agent-list">(future: Validate)</td>
      <td class="sandbox-col">MockVerificationAdapter</td>
      <td class="prod-col">Jumio / Onfido</td>
    </tr>
  </tbody>
</table>
</div>

<!-- ════════════════════════════════════════════════════════════════ -->
<!-- SECTION 5: D1 DATA FLOW                                         -->
<!-- ════════════════════════════════════════════════════════════════ -->

<h2 class="section-heading" id="dataflow">D1 Data Flow</h2>
<p class="section-sub">Which agents read and write which tables. Every agent writes to agent_decisions &mdash; no silent autonomous decisions.</p>

<div class="table-wrap">
<table class="data-table">
  <thead>
    <tr>
      <th>Table</th>
      <th>Written By</th>
      <th>Read By</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="tbl">payment_requests</span></td>
      <td>Pipeline orchestrator</td>
      <td>Screen (velocity), Reconcile (duplicates), Reconciliation (duplicates)</td>
    </tr>
    <tr>
      <td><span class="tbl">agent_decisions</span></td>
      <td>ALL agents</td>
      <td>Fraud (unchecked filter), AML (fraud signals for STR), Settlement (execute detail: transferId, conversionId), Ops (execute detail: pspPaymentId)</td>
    </tr>
    <tr>
      <td><span class="tbl">ledger_entries</span></td>
      <td>Execute</td>
      <td>Reconcile (balance check), Settlement (associated entries), Reconciliation (unreconciled)</td>
    </tr>
    <tr>
      <td><span class="tbl">transactions</span></td>
      <td>Pipeline orchestrator, Settlement, Ops</td>
      <td>Settlement (PENDING_SETTLEMENT), Fraud (unchecked in last hour), AML (threshold monitoring), Ops (stuck detection)</td>
    </tr>
    <tr>
      <td><span class="tbl">fraud_cases</span></td>
      <td>Fraud</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td><span class="tbl">sanctions_screenings</span></td>
      <td>AML</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td><span class="tbl">regulatory_reports</span></td>
      <td>AML</td>
      <td>AML (dedup check: existing STR/LCTR/EFTR for transaction)</td>
    </tr>
    <tr>
      <td><span class="tbl">ops_cases</span></td>
      <td>Ops</td>
      <td>Ops (retry tracking, stale case detection)</td>
    </tr>
    <tr>
      <td><span class="tbl">reconciliation_exceptions</span></td>
      <td>Reconciliation</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td><span class="tbl">counterparties</span></td>
      <td>AML (status updates)</td>
      <td>AML (stale screenings: last_screened_at &gt; 24h)</td>
    </tr>
  </tbody>
</table>
</div>

</div><!-- /container -->

</body>
</html>`
