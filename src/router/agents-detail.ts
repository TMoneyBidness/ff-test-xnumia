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
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: 10px;
    padding: 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.7;
    color: #cbd5e1;
    margin-bottom: 16px;
    overflow-x: auto;
  }
  .logic-block .kw { color: #c084fc; }
  .logic-block .fn { color: #818cf8; }
  .logic-block .str { color: #34d399; }
  .logic-block .num { color: #fbbf24; }
  .logic-block .cmt { color: #64748b; font-style: italic; }

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
    <a href="/system-health">Health</a>
  </div>
</nav>

<div class="hero">
  <h1>Agent Fleet &mdash; Technical Reference</h1>
  <p>Five specialist agents evaluate every payment request. Each operates autonomously with scoped access to specific systems.</p>
</div>

<div class="grid">

  <!-- ── 1. Intake Agent ─────────────────────── -->
  <div class="card">
    <div class="pipeline-pos">1st in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x1F4E5;</div>
      <h2>Intake Agent</h2>
    </div>
    <div class="card-role">First-line validation and normalization</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      Decision Logic
    </div>
    <div class="logic-block">
<span class="cmt">// Validate required fields</span>
<span class="kw">if</span> (!clientId || !clientName || amountCents &lt;= <span class="num">0</span>)
  <span class="kw">return</span> <span class="str">RED</span>

<span class="cmt">// Currency whitelist</span>
<span class="kw">const</span> fiat = [<span class="str">"CAD"</span>, <span class="str">"USD"</span>, <span class="str">"EUR"</span>, <span class="str">"GBP"</span>]
<span class="kw">const</span> stablecoin = [<span class="str">"USDC"</span>, <span class="str">"USDT"</span>]
<span class="kw">if</span> (!whitelist.<span class="fn">includes</span>(currencyFrom))
  <span class="kw">return</span> <span class="str">RED</span>

<span class="cmt">// Same-currency check</span>
<span class="kw">if</span> (currencyFrom === currencyTo)
  <span class="kw">return</span> <span class="str">RED</span>

<span class="cmt">// Optional description</span>
<span class="kw">if</span> (!description)
  <span class="kw">return</span> <span class="str">AMBER</span> <span class="cmt">// warning only</span>

<span class="kw">return</span> <span class="str">GREEN</span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M18 6L6 18"/></svg>
        None &mdash; pure validation
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
      <strong style="color:#4ade80">GREEN</strong> = all fields valid &nbsp;|&nbsp;
      <strong style="color:#fbbf24">AMBER</strong> = missing description &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = invalid/missing required fields or unknown currency
    </div>
    <div class="divider"></div>
    <div class="short-circuit">&#x26A0; Short-circuits pipeline on RED</div>
  </div>

  <!-- ── 2. Compliance Agent ─────────────────── -->
  <div class="card">
    <div class="pipeline-pos">2nd in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x1F6E1;</div>
      <h2>Compliance Agent</h2>
    </div>
    <div class="card-role">Sanctions screening and KYC verification</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      Decision Logic
    </div>
    <div class="logic-block">
<span class="cmt">// Sanctions screening (case-insensitive)</span>
<span class="kw">const</span> sanctions = [
  <span class="str">"SANCTIONED_CORP"</span>,
  <span class="str">"BLOCKED_ENTITY"</span>,
  <span class="str">"OFAC_TARGET"</span>
]
<span class="kw">if</span> (sanctions.<span class="fn">includes</span>(clientName.<span class="fn">toUpperCase</span>()))
  <span class="kw">return</span> <span class="str">RED</span> <span class="cmt">// instant reject</span>

<span class="cmt">// KYC-expired check</span>
<span class="kw">if</span> (clientId === <span class="str">"EXPIRED_KYC_CLIENT"</span>)
  <span class="kw">return</span> <span class="str">RED</span>

<span class="cmt">// KYC expiring soon</span>
<span class="kw">if</span> (clientId.<span class="fn">startsWith</span>(<span class="str">"EXPIRING_"</span>))
  <span class="kw">return</span> <span class="str">AMBER</span>

<span class="kw">return</span> <span class="str">GREEN</span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge api">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
        OFAC SDN / FINTRAC (prod)
      </span>
      <span class="sys-badge api">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
        KYC provider (prod)
      </span>
      <span class="sys-badge none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M18 6L6 18"/></svg>
        Currently: hardcoded mock lists
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
      <strong style="color:#4ade80">GREEN</strong> = cleared all screens &nbsp;|&nbsp;
      <strong style="color:#fbbf24">AMBER</strong> = KYC expiring soon &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = sanctions match or KYC expired
    </div>
    <div class="divider"></div>
    <div class="short-circuit">&#x26A0; Short-circuits pipeline on RED &mdash; instant reject</div>
  </div>

  <!-- ── 3. FX Agent ─────────────────────────── -->
  <div class="card">
    <div class="pipeline-pos">3rd in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x1F4B1;</div>
      <h2>FX Agent</h2>
    </div>
    <div class="card-role">Exchange rate lookup and conversion calculation</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      Decision Logic
    </div>
    <div class="logic-block">
<span class="cmt">// Rate table (hardcoded, prod: ExchangePort)</span>
<span class="kw">const</span> rates = {
  <span class="str">"CAD-USDC"</span>: <span class="num">0.73</span>,  <span class="str">"USD-USDC"</span>: <span class="num">1.00</span>,
  <span class="str">"EUR-USDC"</span>: <span class="num">1.08</span>,  <span class="str">"GBP-USDC"</span>: <span class="num">1.27</span>,
  <span class="cmt">// + reverse pairs</span>
}

<span class="kw">const</span> rate = rates[pair]
<span class="kw">if</span> (!rate) <span class="kw">return</span> <span class="str">RED</span>

<span class="kw">const</span> output = Math.<span class="fn">round</span>(amountCents * rate)

<span class="cmt">// Spread calculation</span>
<span class="kw">const</span> spread = amountCents &gt; <span class="num">5_000_000</span>
  ? <span class="num">0.001</span>  <span class="cmt">// 0.1% for &gt; $50k</span>
  : <span class="num">0.005</span>  <span class="cmt">// 0.5% for smaller</span>

<span class="kw">if</span> (spread &gt; <span class="num">0.003</span>) <span class="kw">return</span> <span class="str">AMBER</span>
<span class="kw">return</span> <span class="str">GREEN</span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge api">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
        ExchangePort (prod)
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
      <span class="verdict amber">&#x25CF; AMBER</span>
      <span class="verdict red">&#x25CF; RED</span>
    </div>
    <div class="verdict-desc">
      <strong style="color:#4ade80">GREEN</strong> = rate found, preferred spread (&le; 0.3%) &nbsp;|&nbsp;
      <strong style="color:#fbbf24">AMBER</strong> = rate found, standard spread (&gt; 0.3%) &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = currency pair not supported
    </div>
    <div class="divider"></div>
    <div class="short-circuit no">&#x2714; Does not short-circuit pipeline</div>
  </div>

  <!-- ── 4. Risk Agent ───────────────────────── -->
  <div class="card">
    <div class="pipeline-pos">4th in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x1F6A8;</div>
      <h2>Risk Agent</h2>
    </div>
    <div class="card-role">Transaction risk scoring (0&ndash;100 scale)</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      Decision Logic
    </div>
    <div class="logic-block">
<span class="kw">let</span> score = <span class="num">20</span> <span class="cmt">// base score</span>

<span class="cmt">// Amount thresholds (not cumulative)</span>
<span class="kw">if</span> (amount &gt; <span class="num">5_000_000</span>)      score += <span class="num">25</span>
<span class="kw">else if</span> (amount &gt; <span class="num">1_000_000</span>) score += <span class="num">15</span>

<span class="cmt">// First-time counterparty</span>
<span class="kw">if</span> (clientName.<span class="fn">includes</span>(<span class="str">"NEW_"</span>)) score += <span class="num">20</span>

<span class="cmt">// Higher-risk stablecoin</span>
<span class="kw">if</span> (currencyTo === <span class="str">"USDT"</span>)       score += <span class="num">10</span>

<span class="cmt">// Missing description</span>
<span class="kw">if</span> (!description)              score += <span class="num">15</span>

<span class="kw">if</span> (score &gt; <span class="num">75</span>)  <span class="kw">return</span> <span class="str">RED</span>
<span class="kw">if</span> (score &gt;= <span class="num">50</span>) <span class="kw">return</span> <span class="str">AMBER</span>
<span class="kw">return</span> <span class="str">GREEN</span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge api">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
        Velocity checks via D1 (prod)
      </span>
      <span class="sys-badge none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M18 6L6 18"/></svg>
        Currently: rule-based scoring
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
      <strong style="color:#4ade80">GREEN</strong> = score &lt; 50 &nbsp;|&nbsp;
      <strong style="color:#fbbf24">AMBER</strong> = score 50&ndash;75 &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = score &gt; 75
    </div>
    <div class="divider"></div>
    <div class="short-circuit no">&#x2714; Does not short-circuit pipeline</div>
  </div>

  <!-- ── 5. Recon Agent ──────────────────────── -->
  <div class="card">
    <div class="pipeline-pos">5th in pipeline</div>
    <div class="card-header">
      <div class="card-icon">&#x1F50D;</div>
      <h2>Recon Agent</h2>
    </div>
    <div class="card-role">Duplicate detection and reconciliation</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      Decision Logic
    </div>
    <div class="logic-block">
<span class="cmt">// Query D1 for recent duplicates</span>
<span class="kw">SELECT</span> * <span class="kw">FROM</span> payment_requests
<span class="kw">WHERE</span> client_id = <span class="str">?</span>
  <span class="kw">AND</span> amount_cents = <span class="str">?</span>
  <span class="kw">AND</span> created_at &gt; <span class="fn">datetime</span>(<span class="str">'now'</span>, <span class="str">'-24 hours'</span>)
  <span class="kw">AND</span> status != <span class="str">'REJECTED'</span>
  <span class="kw">AND</span> id != <span class="str">:currentId</span>

<span class="kw">const</span> matches = results.length

<span class="kw">if</span> (matches &gt;= <span class="num">2</span>) <span class="kw">return</span> <span class="str">RED</span>
<span class="kw">if</span> (matches === <span class="num">1</span>) <span class="kw">return</span> <span class="str">AMBER</span>
<span class="kw">return</span> <span class="str">GREEN</span>
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge db">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
        D1 payment_requests
      </span>
      <span class="sys-badge api">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
        AccountingPort (prod)
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
      <strong style="color:#4ade80">GREEN</strong> = no duplicates &nbsp;|&nbsp;
      <strong style="color:#fbbf24">AMBER</strong> = 1 possible duplicate &nbsp;|&nbsp;
      <strong style="color:#f87171">RED</strong> = 2+ matches (likely duplicate)
    </div>
    <div class="divider"></div>
    <div class="short-circuit no">&#x2714; Does not short-circuit pipeline</div>
  </div>

  <!-- ── Orchestrator ────────────────────────── -->
  <div class="card orchestrator">
    <div class="pipeline-pos">Aggregator</div>
    <div class="card-header">
      <div class="card-icon" style="background:rgba(129,140,248,0.15);">&#x1F3AF;</div>
      <h2>Orchestrator</h2>
    </div>
    <div class="card-role">Verdict aggregation and final decision engine</div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
      Decision Logic
    </div>
    <div class="logic-block">
<span class="cmt">// Collect all agent verdicts</span>
<span class="kw">const</span> verdicts = [intake, compliance, fx, risk, recon]

<span class="cmt">// Any RED &rarr; pipeline already short-circuited at that agent</span>
<span class="kw">if</span> (verdicts.<span class="fn">some</span>(v =&gt; v === <span class="str">"RED"</span>))
  status = <span class="str">"REJECTED"</span>

<span class="cmt">// Any AMBER &rarr; escalate to human review</span>
<span class="kw">else if</span> (verdicts.<span class="fn">some</span>(v =&gt; v === <span class="str">"AMBER"</span>))
  status = <span class="str">"ESCALATED"</span>

<span class="cmt">// All GREEN &rarr; auto-approve</span>
<span class="kw">else</span>
  status = <span class="str">"APPROVED"</span>

<span class="cmt">// Persist every decision</span>
<span class="fn">writeAgentDecisions</span>(db, requestId, verdicts)
<span class="fn">updatePaymentStatus</span>(db, requestId, status)
    </div>

    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Systems
    </div>
    <div class="systems">
      <span class="sys-badge db">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
        D1 payment_requests
      </span>
      <span class="sys-badge db">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
        D1 agent_decisions
      </span>
      <span class="sys-badge queue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Queue (async notifications)
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
