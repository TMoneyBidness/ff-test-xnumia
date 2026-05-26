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
<title>Xnumia — Agent Fleet</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0e1a;
    color: #e2e8f0;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
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

  /* ── Hero ─────────────────────────────────── */
  .hero {
    padding: 120px 32px 40px;
    text-align: center;
  }
  .hero h1 {
    font-size: 42px; font-weight: 800;
    background: linear-gradient(135deg, #e2e8f0 0%, #818cf8 50%, #6366f1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 12px;
  }
  .hero p {
    font-size: 16px; color: #94a3b8; max-width: 680px; margin: 0 auto;
    line-height: 1.6;
  }

  /* ── Grid ─────────────────────────────────── */
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 32px 64px;
  }
  @media (max-width: 800px) {
    .grid { grid-template-columns: 1fr; }
  }

  /* ── Agent Card ───────────────────────────── */
  .card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 16px;
    padding: 28px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, transform 0.2s;
  }
  .card:hover {
    border-color: rgba(99, 102, 241, 0.35);
    transform: translateY(-2px);
  }
  .card.orchestrator {
    grid-column: 1 / -1;
    border-color: rgba(129, 140, 248, 0.25);
    background: rgba(30, 41, 59, 0.75);
  }

  /* pipeline position badge */
  .pipeline-pos {
    position: absolute; top: 16px; right: 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 500;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 6px;
    padding: 3px 10px;
  }

  .card-header {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 6px;
  }
  .card-icon {
    font-size: 28px;
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(99, 102, 241, 0.08);
    border-radius: 10px;
    flex-shrink: 0;
  }
  .card-header h2 {
    font-size: 20px; font-weight: 700; color: #f1f5f9;
  }
  .card-role {
    font-size: 13px; color: #94a3b8; margin-bottom: 20px;
    padding-left: 56px;
  }

  /* sections */
  .section-label {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.08em; color: #818cf8; margin-bottom: 8px;
    display: flex; align-items: center; gap: 6px;
  }
  .section-label svg {
    width: 14px; height: 14px; opacity: 0.7;
  }

  .logic-block {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.08);
    border-radius: 10px;
    padding: 16px 20px;
    font-size: 13px;
    line-height: 1.9;
    color: #cbd5e1;
    margin-bottom: 16px;
  }
  .logic-block ul { list-style: none; padding: 0; margin: 0; }
  .logic-block li { padding: 3px 0 3px 20px; position: relative; }
  .logic-block li::before { content: '\\25B8'; position: absolute; left: 0; color: #6366f1; }
  .logic-block .then {
    display: inline-block; font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 3px; margin-left: 4px;
  }
  .logic-block .then.red { background: rgba(239,68,68,0.15); color: #f87171; }
  .logic-block .then.amber { background: rgba(245,158,11,0.15); color: #fbbf24; }
  .logic-block .then.green { background: rgba(34,197,94,0.15); color: #4ade80; }
  .logic-block .highlight { font-weight: 600; color: #e2e8f0; }

  .systems {
    display: flex; flex-wrap: wrap; gap: 8px;
    margin-bottom: 16px;
  }
  .sys-badge {
    font-size: 12px; font-weight: 500;
    padding: 4px 12px;
    border-radius: 6px;
    display: flex; align-items: center; gap: 6px;
  }
  .sys-badge.db {
    background: rgba(52, 211, 153, 0.1);
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.2);
  }
  .sys-badge.api {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.2);
  }
  .sys-badge.none {
    background: rgba(100, 116, 139, 0.1);
    color: #94a3b8;
    border: 1px solid rgba(100, 116, 139, 0.2);
  }
  .sys-badge.queue {
    background: rgba(129, 140, 248, 0.1);
    color: #818cf8;
    border: 1px solid rgba(129, 140, 248, 0.2);
  }
  .sys-badge svg { width: 14px; height: 14px; }

  /* verdicts */
  .verdicts {
    display: flex; flex-wrap: wrap; gap: 8px;
    margin-bottom: 12px;
  }
  .verdict {
    font-size: 12px; font-weight: 600;
    padding: 5px 14px;
    border-radius: 20px;
    display: flex; align-items: center; gap: 5px;
  }
  .verdict.green {
    background: rgba(34, 197, 94, 0.12);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.25);
  }
  .verdict.amber {
    background: rgba(251, 191, 36, 0.12);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.25);
  }
  .verdict.red {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }
  .verdict.approved {
    background: rgba(34, 197, 94, 0.12);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.25);
  }
  .verdict.escalated {
    background: rgba(251, 191, 36, 0.12);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.25);
  }
  .verdict.rejected {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }
  .verdict-desc {
    font-size: 11px; color: #94a3b8; margin-top: 4px; line-height: 1.5;
  }

  .short-circuit {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600;
    color: #f87171;
    margin-top: 4px;
  }
  .short-circuit.no {
    color: #64748b;
  }

  .divider {
    height: 1px;
    background: rgba(99, 102, 241, 0.1);
    margin: 16px 0;
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
    <a href="/agents" class="active">Agents</a>
    <a href="/api-explorer">API</a>
    <a href="/readiness">Readiness</a>
  </div>
</nav>

<div class="hero">
  <h1>Agent Fleet &mdash; Technical Reference</h1>
  <p>Five specialist agents form the payments pipeline. Each evaluates a different dimension of every payment request, from field validation through execution and reconciliation.</p>
</div>

<div class="grid">

  <!-- ── 1. Validate Agent ─────────────────────── -->
  <div class="card">
    <div class="pipeline-pos">1st in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x2705;</div>
      <h2>Validate Agent</h2>
    </div>
    <div class="card-role">Field validation and client eligibility</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      What It Checks
    </div>
    <div class="logic-block">
      <ul>
        <li>Missing client ID, name, or zero/negative amount <span class="then red">REJECT</span></li>
        <li>Currency not in accepted list (CAD, USD, EUR, GBP, USDC, USDT) <span class="then red">REJECT</span></li>
        <li>From and To currencies are the same <span class="then red">REJECT</span></li>
        <li>Client&rsquo;s KYC has expired <span class="then red">REJECT</span></li>
        <li>KYC is valid but expiring soon <span class="then amber">FLAG</span></li>
        <li>No description provided <span class="then amber">FLAG</span> &mdash; recommended for audit trail</li>
        <li>Everything checks out <span class="then green">PASS</span></li>
      </ul>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M18 6L6 18"/></svg>
        None &mdash; pure validation, no external calls
      </span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
      Verdicts
    </div>
    <div class="verdicts">
      <span class="verdict green">&#x25CF; GREEN</span>
      <span class="verdict amber">&#x25CF; AMBER</span>
      <span class="verdict red">&#x25CF; RED</span>
    </div>
    <div class="verdict-desc">
      <strong style="color:#4ade80">GREEN</strong> = eligible &nbsp;|&nbsp;
      <strong style="color:#fbbf24">AMBER</strong> = minor warnings &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = invalid or KYC expired
    </div>
    <div class="divider"></div>
    <div class="short-circuit">&#x26A0; Short-circuits pipeline on RED</div>
  </div>

  <!-- ── 2. Quote Agent ────────────────────────── -->
  <div class="card">
    <div class="pipeline-pos">2nd in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x1F4B1;</div>
      <h2>Quote Agent</h2>
    </div>
    <div class="card-role">FX rate lookup and conversion calculation</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      What It Checks
    </div>
    <div class="logic-block">
      <ul>
        <li>Looks up exchange rate for the currency pair</li>
        <li>Calculates output amount (input &times; rate)</li>
        <li>Calculates spread (0.1% for large, 0.5% for small transactions)</li>
        <li>Currency pair not supported <span class="then red">REJECT</span></li>
        <li>Rate found and conversion calculated <span class="then green">PASS</span></li>
      </ul>
      <p style="margin-top:10px;font-size:12px;color:#94a3b8;">This agent quotes &mdash; it does not judge risk. Spread is a business parameter, not a risk flag.</p>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge api">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
        ExchangePort (prod: live rates)
      </span>
      <span class="sys-badge none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M18 6L6 18"/></svg>
        Currently: hardcoded rate map
      </span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
      Verdicts
    </div>
    <div class="verdicts">
      <span class="verdict green">&#x25CF; GREEN</span>
      <span class="verdict red">&#x25CF; RED</span>
    </div>
    <div class="verdict-desc">
      <strong style="color:#4ade80">GREEN</strong> = quoted successfully &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = unsupported pair.
      <strong style="color:#fbbf24">Never AMBER</strong> &mdash; quoting is binary
    </div>
    <div class="divider"></div>
    <div class="short-circuit">&#x26A0; Short-circuits pipeline on RED</div>
  </div>

  <!-- ── 3. Screen Agent ───────────────────────── -->
  <div class="card">
    <div class="pipeline-pos">3rd in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x1F6E1;</div>
      <h2>Screen Agent</h2>
    </div>
    <div class="card-role">Transaction monitoring &mdash; the real compliance and risk gate</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      What It Checks
    </div>
    <div class="logic-block">
      <ul>
        <li>Client name appears on sanctions list (OFAC, blocked entities) <span class="then red">REJECT</span> &mdash; <span class="highlight">pipeline stops here</span></li>
        <li>Transaction velocity: more than 5 payments from this client in the last hour <span class="then amber">FLAG</span></li>
        <li>Transaction amount over $100,000 <span class="then amber">FLAG</span> &mdash; requires enhanced monitoring</li>
        <li>Multiple warning signals compound: two or more flags <span class="then red">REJECT</span></li>
        <li>All screens clear <span class="then green">PASS</span></li>
      </ul>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge db">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
        D1 payment_requests (velocity queries)
      </span>
      <span class="sys-badge api">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
        Prod: OFAC SDN API, FINTRAC feeds, KYC provider
      </span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
      Verdicts
    </div>
    <div class="verdicts">
      <span class="verdict green">&#x25CF; GREEN</span>
      <span class="verdict amber">&#x25CF; AMBER</span>
      <span class="verdict red">&#x25CF; RED</span>
    </div>
    <div class="verdict-desc">
      <strong style="color:#4ade80">GREEN</strong> = clear &nbsp;|&nbsp;
      <strong style="color:#fbbf24">AMBER</strong> = single warning &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = sanctions hit or compound risk
    </div>
    <div class="divider"></div>
    <div class="short-circuit">&#x26A0; Short-circuits pipeline on RED</div>
  </div>

  <!-- ── 4. Execute Agent ──────────────────────── -->
  <div class="card">
    <div class="pipeline-pos">4th in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x26A1;</div>
      <h2>Execute Agent</h2>
    </div>
    <div class="card-role">Calls adapters to move funds, writes ledger entries</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      What It Checks
    </div>
    <div class="logic-block">
      <ul>
        <li>Verifies sufficient funds via bank adapter</li>
        <li>Initiates fiat transfer via bank</li>
        <li>Converts fiat to stablecoin via exchange adapter</li>
        <li>Writes two ledger entries to D1: one debit (fiat rail), one credit (stablecoin rail)</li>
        <li>Insufficient funds (simulated for amounts &gt; $500k) <span class="then red">REJECT</span></li>
        <li>Transfer initiated but settlement pending <span class="then amber">FLAG</span></li>
        <li>Funds moved and ledger entries written <span class="then green">PASS</span></li>
      </ul>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge api">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
        BankPort (MockBankAdapter)
      </span>
      <span class="sys-badge api">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
        ExchangePort (MockExchangeAdapter)
      </span>
      <span class="sys-badge db">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
        D1 ledger_entries
      </span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
      Verdicts
    </div>
    <div class="verdicts">
      <span class="verdict green">&#x25CF; GREEN</span>
      <span class="verdict amber">&#x25CF; AMBER</span>
      <span class="verdict red">&#x25CF; RED</span>
    </div>
    <div class="verdict-desc">
      <strong style="color:#4ade80">GREEN</strong> = executed &nbsp;|&nbsp;
      <strong style="color:#fbbf24">AMBER</strong> = pending settlement &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = insufficient funds
    </div>
    <div class="divider"></div>
    <div class="short-circuit">&#x26A0; Short-circuits pipeline on RED</div>
  </div>

  <!-- ── 5. Reconcile Agent ────────────────────── -->
  <div class="card">
    <div class="pipeline-pos">5th in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x1F50D;</div>
      <h2>Reconcile Agent</h2>
    </div>
    <div class="card-role">Post-execution bookkeeping &mdash; matches ledger and detects duplicates</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      What It Checks
    </div>
    <div class="logic-block">
      <ul>
        <li>Verifies debit and credit ledger entries balance</li>
        <li>Searches for duplicate payments: same client + same amount in last 24 hours</li>
        <li>No duplicates and ledger balanced <span class="then green">PASS</span></li>
        <li>1 possible duplicate found <span class="then amber">FLAG</span> &mdash; needs human review</li>
        <li>2+ duplicates detected <span class="then red">REJECT</span> &mdash; likely double-payment</li>
      </ul>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge db">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
        D1 ledger_entries
      </span>
      <span class="sys-badge db">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
        D1 payment_requests
      </span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
      Verdicts
    </div>
    <div class="verdicts">
      <span class="verdict green">&#x25CF; GREEN</span>
      <span class="verdict amber">&#x25CF; AMBER</span>
      <span class="verdict red">&#x25CF; RED</span>
    </div>
    <div class="verdict-desc">
      <strong style="color:#4ade80">GREEN</strong> = balanced, no duplicates &nbsp;|&nbsp;
      <strong style="color:#fbbf24">AMBER</strong> = possible duplicate &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = confirmed duplicates
    </div>
    <div class="divider"></div>
    <div class="short-circuit no">&#x2714; Does not short-circuit pipeline (last agent)</div>
  </div>

  <!-- ── Orchestrator ────────────────────────── -->
  <div class="card orchestrator">
    <div class="pipeline-pos">Aggregator</div>
    <div class="card-header">
      <div class="card-icon" style="background:rgba(129,140,248,0.15);">&#x1F3AF;</div>
      <h2>Orchestrator</h2>
    </div>
    <div class="card-role">Verdict aggregation and final decision</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      What It Checks
    </div>
    <div class="logic-block">
      <ul>
        <li>Collects all five agent verdicts and makes one final call</li>
        <li>Any agent returned <span class="then red">RED</span> &rarr; payment is <span class="highlight">auto-rejected</span> (pipeline already stopped at that agent)</li>
        <li>Any agent returned <span class="then amber">AMBER</span> &rarr; payment is <span class="highlight">escalated</span> to dashboard for human review</li>
        <li>All agents returned <span class="then green">GREEN</span> &rarr; payment is <span class="highlight">auto-approved</span>, no human needed</li>
        <li>Every verdict and final decision written to D1 for audit trail</li>
      </ul>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge db">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
        D1 payment_requests (status update)
      </span>
      <span class="sys-badge db">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
        D1 agent_decisions (write all verdicts)
      </span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
      Final Outcomes
    </div>
    <div class="verdicts">
      <span class="verdict approved">&#x2713; APPROVED</span>
      <span class="verdict escalated">&#x21BB; ESCALATED</span>
      <span class="verdict rejected">&#x2717; REJECTED</span>
    </div>
    <div class="verdict-desc">
      <strong style="color:#4ade80">APPROVED</strong> = all agents GREEN &nbsp;|&nbsp;
      <strong style="color:#fbbf24">ESCALATED</strong> = any AMBER, human review required &nbsp;|&nbsp;
      <strong style="color:#f87171">REJECTED</strong> = any RED, auto-rejected
    </div>
  </div>

</div>

</body>
</html>`
