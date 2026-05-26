import { Hono } from 'hono'
import type { Env } from '../lib/env'

const simulate = new Hono<{ Bindings: Env }>()

simulate.get('/simulate', (c) => {
  return c.html(SIMULATE_HTML)
})

export { simulate }

const SIMULATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Xnumia &mdash; Live Transaction Simulator</title>
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

  /* ── Hero ─────────────────────────────────── */
  .hero {
    padding: 100px 32px 32px;
    text-align: center;
  }
  .hero h1 {
    font-size: 42px; font-weight: 800;
    background: linear-gradient(135deg, #f8fafc 0%, #818cf8 50%, #6366f1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 10px;
    letter-spacing: -1px;
  }
  .hero .subtitle {
    font-size: 15px; color: #94a3b8; max-width: 640px; margin: 0 auto;
    line-height: 1.7;
  }

  /* ── Layout ──────────────────────────────── */
  .sim-layout {
    display: flex; gap: 24px;
    max-width: 1400px; margin: 24px auto 60px;
    padding: 0 32px;
    align-items: flex-start;
  }

  /* ── Control Panel ───────────────────────── */
  .control-panel {
    width: 40%; flex-shrink: 0;
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 12px;
    padding: 28px;
    position: sticky; top: 80px;
  }
  .control-panel h2 {
    font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #f8fafc;
  }
  .form-group {
    margin-bottom: 16px;
  }
  .form-group label {
    display: block; font-size: 12px; font-weight: 600; color: #94a3b8;
    margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .form-group select,
  .form-group input {
    width: 100%; padding: 10px 14px;
    background: #020617;
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    color: #f8fafc; font-size: 14px;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-group select:focus,
  .form-group input:focus {
    border-color: rgba(99, 102, 241, 0.5);
  }
  .form-group select { cursor: pointer; }
  .form-group select option { background: #0f172a; color: #f8fafc; }

  .btn-run {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none; border-radius: 10px;
    color: #fff; font-size: 15px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    font-family: 'Inter', sans-serif;
    margin-top: 8px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-run:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3); }
  .btn-run:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-ops {
    width: 100%; padding: 12px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 10px;
    color: #818cf8; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    font-family: 'Inter', sans-serif;
    margin-top: 10px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-ops:hover { background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); }
  .btn-ops:disabled { opacity: 0.5; cursor: not-allowed; }

  .spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Feed ─────────────────────────────────── */
  .feed-panel {
    flex: 1; min-width: 0;
  }
  .feed-panel h2 {
    font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #f8fafc;
  }
  .feed-empty {
    text-align: center; padding: 80px 20px;
    color: #475569; font-size: 14px;
  }
  .feed-empty .feed-empty-icon {
    font-size: 48px; margin-bottom: 12px; opacity: 0.3;
  }

  .feed-timeline {
    position: relative;
    padding-left: 32px;
  }
  .feed-timeline::before {
    content: '';
    position: absolute; left: 8px; top: 0; bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, rgba(99, 102, 241, 0.4), rgba(99, 102, 241, 0.05));
  }

  .feed-entry {
    position: relative;
    margin-bottom: 16px;
    opacity: 0;
    transform: translateX(20px);
    animation: slideIn 0.35s ease-out forwards;
  }
  @keyframes slideIn {
    to { opacity: 1; transform: translateX(0); }
  }

  .feed-dot {
    position: absolute; left: -28px; top: 16px;
    width: 12px; height: 12px; border-radius: 50%;
    background: #6366f1;
    box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
    z-index: 1;
  }
  .feed-dot.green { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.5); }
  .feed-dot.amber { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.5); }
  .feed-dot.red { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }
  .feed-dot.pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(99, 102, 241, 0.5); }
    50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.8); }
  }

  .feed-card {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 10px;
    padding: 18px 20px;
    transition: border-color 0.2s;
  }
  .feed-card:hover {
    border-color: rgba(99, 102, 241, 0.25);
  }

  .feed-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px;
  }
  .feed-title {
    font-size: 14px; font-weight: 700; color: #f8fafc;
    display: flex; align-items: center; gap: 8px;
  }
  .feed-time {
    font-size: 11px; color: #475569;
    font-family: 'JetBrains Mono', monospace;
  }
  .feed-body {
    font-size: 13px; color: #94a3b8; line-height: 1.6;
  }

  .verdict-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 6px;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .verdict-badge.green { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
  .verdict-badge.amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
  .verdict-badge.red { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

  .verdict-dot {
    width: 6px; height: 6px; border-radius: 50%;
  }
  .verdict-dot.green { background: #22c55e; }
  .verdict-dot.amber { background: #f59e0b; }
  .verdict-dot.red { background: #ef4444; }

  /* Code blocks */
  .code-block {
    background: #020617;
    border: 1px solid rgba(99, 102, 241, 0.08);
    border-radius: 8px;
    padding: 14px 16px;
    margin-top: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.7;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Detail toggle */
  .detail-toggle {
    display: inline-block; margin-top: 8px;
    font-size: 12px; color: #6366f1; cursor: pointer;
    font-weight: 600; transition: color 0.2s;
    background: none; border: none; font-family: 'Inter', sans-serif;
    padding: 0;
  }
  .detail-toggle:hover { color: #818cf8; }
  .detail-content {
    display: none; margin-top: 8px;
  }
  .detail-content.visible { display: block; }

  /* ── State Machine ───────────────────────── */
  .state-machine {
    background: #0f172a;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 10px;
    padding: 20px;
    margin-top: 10px;
  }
  .state-machine-title {
    font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 14px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .state-row {
    display: flex; align-items: center; justify-content: center; gap: 0;
    flex-wrap: wrap;
  }
  .state-circle {
    width: 40px; height: 40px; border-radius: 50%;
    border: 2px solid #334155;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: #475569;
    text-align: center; line-height: 1.1;
    transition: all 0.4s ease;
    flex-shrink: 0;
    position: relative;
  }
  .state-circle.active {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);
    animation: statePulse 2s ease-in-out infinite;
  }
  .state-circle.done {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
  .state-circle.failed {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
  .state-circle.held {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }
  @keyframes statePulse {
    0%, 100% { box-shadow: 0 0 16px rgba(99, 102, 241, 0.3); }
    50% { box-shadow: 0 0 28px rgba(99, 102, 241, 0.5); }
  }
  .state-line {
    width: 24px; height: 2px;
    background: #334155;
    flex-shrink: 0;
    transition: background 0.4s;
  }
  .state-line.done { background: #22c55e; }
  .state-labels {
    display: flex; align-items: center; justify-content: center; gap: 0;
    margin-top: 8px; flex-wrap: wrap;
  }
  .state-label {
    width: 40px; text-align: center;
    font-size: 8px; color: #475569; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.3px;
    flex-shrink: 0;
  }
  .state-label-spacer { width: 24px; flex-shrink: 0; }

  /* ── Footer ──────────────────────────────── */
  .footer {
    text-align: center; padding: 48px 32px;
    border-top: 1px solid rgba(99, 102, 241, 0.1);
    color: #64748b; font-size: 13px;
  }

  /* ── Responsive ──────────────────────────── */
  @media (max-width: 900px) {
    .sim-layout { flex-direction: column; }
    .control-panel { width: 100%; position: static; }
    .feed-panel { width: 100%; }
    .hero h1 { font-size: 32px; }
    .state-row { gap: 0; }
  }
  @media (max-width: 600px) {
    .nav { padding: 12px 16px; }
    .nav-links a { margin-left: 12px; font-size: 12px; }
    .sim-layout { padding: 0 16px; }
    .hero { padding: 80px 16px 24px; }
    .state-circle { width: 32px; height: 32px; font-size: 7px; }
    .state-line { width: 16px; }
    .state-label { width: 32px; font-size: 7px; }
    .state-label-spacer { width: 16px; }
  }
</style>
</head>
<body>

<!-- ── Nav ──────────────────────────────────────────────────────────────── -->
<nav class="nav">
  <div class="nav-brand">XNUMIA</div>
  <div class="nav-links">
    <a href="/">Overview</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/flowchart">Architecture</a>
    <a href="/agents">Agents</a>
    <a href="/api-explorer">API</a>
    <a href="/simulate" class="active">Simulate</a>
    <a href="/readiness">Readiness</a>
  </div>
</nav>

<!-- ── Hero ─────────────────────────────────────────────────────────────── -->
<section class="hero">
  <h1>Live Transaction Simulator</h1>
  <p class="subtitle">Watch a payment flow through 10 agents in real-time. Every API call, every agent decision, every state transition &mdash; live.</p>
</section>

<!-- ── Main Layout ─────────────────────────────────────────────────────── -->
<div class="sim-layout">

  <!-- Left: Control Panel -->
  <div class="control-panel">
    <h2>Configure Transaction</h2>

    <div class="form-group">
      <label>Scenario</label>
      <select id="scenario">
        <option value="clean">Clean Payment &mdash; $5,000 CAD &rarr; USDC, Acme Corp</option>
        <option value="high-value">High Value &mdash; $150,000 CAD &rarr; USDC, Large Corp</option>
        <option value="sanctioned">Sanctioned Entity &mdash; SANCTIONED_CORP</option>
      </select>
    </div>

    <div class="form-group">
      <label>Client Name</label>
      <input type="text" id="clientName" value="Acme Corp" />
    </div>

    <div class="form-group">
      <label>Amount (dollars)</label>
      <input type="number" id="amount" value="5000" min="1" step="1" />
    </div>

    <div class="form-group">
      <label>Currency From</label>
      <select id="currencyFrom">
        <option value="CAD" selected>CAD</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
      </select>
    </div>

    <div class="form-group">
      <label>Currency To</label>
      <select id="currencyTo">
        <option value="USDC" selected>USDC</option>
        <option value="USDT">USDT</option>
      </select>
    </div>

    <div class="form-group">
      <label>Description (optional)</label>
      <input type="text" id="description" placeholder="Invoice payment, vendor payout..." />
    </div>

    <button class="btn-run" id="btn-run">Run Transaction</button>
    <button class="btn-ops" id="btn-ops">Run Ops Cycle</button>
  </div>

  <!-- Right: Live Feed -->
  <div class="feed-panel">
    <h2>Live Transaction Feed</h2>
    <div id="feed-container">
      <div class="feed-empty" id="feed-empty">
        <div class="feed-empty-icon">&#9881;</div>
        <div>Select a scenario and click Run Transaction to begin.</div>
      </div>
    </div>
  </div>

</div>

<!-- ── Footer ──────────────────────────────────────────────────────────── -->
<footer class="footer">
  Xnumia &mdash; Agent-run stablecoin orchestration &bull; Built on Cloudflare Workers &bull; Phase 0 Foundation
</footer>

<script>
(function() {
  'use strict';

  // ── Scenario presets ────────────────────────────────────────────
  var scenarios = {
    clean: { clientName: 'Acme Corp', amount: 5000, currencyFrom: 'CAD', currencyTo: 'USDC' },
    'high-value': { clientName: 'Large Corp', amount: 150000, currencyFrom: 'CAD', currencyTo: 'USDC' },
    sanctioned: { clientName: 'SANCTIONED_CORP', amount: 10000, currencyFrom: 'CAD', currencyTo: 'USDC' }
  };

  var scenarioEl = document.getElementById('scenario');
  var clientNameEl = document.getElementById('clientName');
  var amountEl = document.getElementById('amount');
  var currFromEl = document.getElementById('currencyFrom');
  var currToEl = document.getElementById('currencyTo');
  var descEl = document.getElementById('description');
  var btnRun = document.getElementById('btn-run');
  var btnOps = document.getElementById('btn-ops');
  var feedContainer = document.getElementById('feed-container');
  var feedEmpty = document.getElementById('feed-empty');

  var timeline = null;

  // ── Helpers: clear children safely ──────────────────────────────
  function removeAllChildren(el) {
    while (el.firstChild) { el.removeChild(el.firstChild); }
  }

  function setButtonLoading(btn, text, spinnerColor) {
    removeAllChildren(btn);
    var sp = document.createElement('span');
    sp.className = 'spinner';
    if (spinnerColor) {
      sp.style.borderColor = 'rgba(129,140,248,0.3)';
      sp.style.borderTopColor = spinnerColor;
    }
    btn.appendChild(sp);
    btn.appendChild(document.createTextNode(' ' + text));
  }

  function setButtonText(btn, text) {
    removeAllChildren(btn);
    btn.appendChild(document.createTextNode(text));
  }

  // ── Scenario switcher ───────────────────────────────────────────
  scenarioEl.addEventListener('change', function() {
    var s = scenarios[scenarioEl.value];
    if (!s) return;
    clientNameEl.value = s.clientName;
    amountEl.value = s.amount;
    currFromEl.value = s.currencyFrom;
    currToEl.value = s.currencyTo;
  });

  // ── Helpers ─────────────────────────────────────────────────────
  function now() {
    return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function clearFeed() {
    removeAllChildren(feedContainer);
    timeline = document.createElement('div');
    timeline.className = 'feed-timeline';
    feedContainer.appendChild(timeline);
  }

  function ensureTimeline() {
    if (timeline) return;
    if (feedEmpty && feedEmpty.parentNode) {
      feedEmpty.parentNode.removeChild(feedEmpty);
      feedEmpty = null;
    }
    timeline = document.createElement('div');
    timeline.className = 'feed-timeline';
    feedContainer.appendChild(timeline);
  }

  function addEntry(opts) {
    if (feedEmpty && feedEmpty.parentNode) {
      feedEmpty.parentNode.removeChild(feedEmpty);
      feedEmpty = null;
    }
    ensureTimeline();

    var entry = document.createElement('div');
    entry.className = 'feed-entry';
    entry.style.animationDelay = (opts.delay || 0) + 'ms';

    var dot = document.createElement('div');
    dot.className = 'feed-dot' + (opts.dotColor ? ' ' + opts.dotColor : '');
    if (opts.pulse) dot.className += ' pulse';
    entry.appendChild(dot);

    var card = document.createElement('div');
    card.className = 'feed-card';

    var header = document.createElement('div');
    header.className = 'feed-header';

    var title = document.createElement('div');
    title.className = 'feed-title';
    title.textContent = opts.title || '';

    if (opts.badge) {
      var badge = document.createElement('span');
      badge.className = 'verdict-badge ' + opts.badge;
      var bdot = document.createElement('span');
      bdot.className = 'verdict-dot ' + opts.badge;
      badge.appendChild(bdot);
      badge.appendChild(document.createTextNode(' ' + opts.badge.toUpperCase()));
      title.appendChild(badge);
    }

    var timeEl = document.createElement('div');
    timeEl.className = 'feed-time';
    timeEl.textContent = now();

    header.appendChild(title);
    header.appendChild(timeEl);
    card.appendChild(header);

    var body = document.createElement('div');
    body.className = 'feed-body';

    if (typeof opts.body === 'string') {
      body.textContent = opts.body;
    } else if (opts.body) {
      body.appendChild(opts.body);
    }
    card.appendChild(body);

    entry.appendChild(card);
    timeline.appendChild(entry);

    setTimeout(function() {
      entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, (opts.delay || 0) + 50);

    return { entry: entry, card: card, body: body, dot: dot };
  }

  function makeCodeBlock(obj) {
    var block = document.createElement('div');
    block.className = 'code-block';
    block.textContent = JSON.stringify(obj, null, 2);
    return block;
  }

  function makeDetailToggle(detailObj) {
    var frag = document.createDocumentFragment();

    var btn = document.createElement('button');
    btn.className = 'detail-toggle';
    btn.textContent = 'Show details';

    var content = document.createElement('div');
    content.className = 'detail-content';
    content.appendChild(makeCodeBlock(detailObj));

    btn.addEventListener('click', function() {
      var visible = content.classList.contains('visible');
      content.classList.toggle('visible');
      btn.textContent = visible ? 'Show details' : 'Hide details';
    });

    frag.appendChild(btn);
    frag.appendChild(content);
    return frag;
  }

  // ── State Machine Widget ────────────────────────────────────────
  function createStateMachine() {
    var states = ['INITIATED', 'PENDING_PSP', 'PENDING_SETTLEMENT', 'SETTLED', 'RECONCILED'];
    var labels = ['Init', 'PSP', 'Settle', 'Settled', 'Recon'];

    var wrapper = document.createElement('div');
    wrapper.className = 'state-machine';

    var title = document.createElement('div');
    title.className = 'state-machine-title';
    title.textContent = 'Durable Object State Machine';
    wrapper.appendChild(title);

    var row = document.createElement('div');
    row.className = 'state-row';

    var circles = [];
    var lineEls = [];

    for (var i = 0; i < states.length; i++) {
      var circle = document.createElement('div');
      circle.className = 'state-circle';
      circle.textContent = labels[i];
      circle.setAttribute('data-state', states[i]);
      circles.push(circle);
      row.appendChild(circle);

      if (i < states.length - 1) {
        var line = document.createElement('div');
        line.className = 'state-line';
        lineEls.push(line);
        row.appendChild(line);
      }
    }

    wrapper.appendChild(row);

    var labelsRow = document.createElement('div');
    labelsRow.className = 'state-labels';
    for (var j = 0; j < states.length; j++) {
      var lbl = document.createElement('div');
      lbl.className = 'state-label';
      lbl.textContent = states[j];
      labelsRow.appendChild(lbl);
      if (j < states.length - 1) {
        var spacer = document.createElement('div');
        spacer.className = 'state-label-spacer';
        labelsRow.appendChild(spacer);
      }
    }
    wrapper.appendChild(labelsRow);

    wrapper._circles = circles;
    wrapper._lines = lineEls;
    wrapper._states = states;

    return wrapper;
  }

  function advanceStateTo(machine, targetState, failType) {
    var states = machine._states;
    var circles = machine._circles;
    var lines = machine._lines;
    var targetIdx = states.indexOf(targetState);

    if (failType === 'red') {
      for (var k = 0; k < circles.length; k++) circles[k].className = 'state-circle';
      circles[targetIdx >= 0 ? targetIdx : 0].className = 'state-circle failed';
      return;
    }
    if (failType === 'amber') {
      for (var m = 0; m < circles.length; m++) circles[m].className = 'state-circle';
      circles[targetIdx >= 0 ? targetIdx : 0].className = 'state-circle held';
      return;
    }

    for (var i = 0; i < circles.length; i++) {
      if (i < targetIdx) circles[i].className = 'state-circle done';
      else if (i === targetIdx) circles[i].className = 'state-circle active';
      else circles[i].className = 'state-circle';
    }
    for (var j = 0; j < lines.length; j++) {
      lines[j].className = j < targetIdx ? 'state-line done' : 'state-line';
    }
  }

  // ── Run Transaction ─────────────────────────────────────────────
  btnRun.addEventListener('click', function() {
    var clientName = clientNameEl.value.trim();
    var amount = parseInt(amountEl.value, 10);
    var currFrom = currFromEl.value;
    var currTo = currToEl.value;
    var desc = descEl.value.trim();

    if (!clientName || !amount || amount <= 0) return;

    var clientId = 'sim-' + Date.now();
    var amountCents = amount * 100;

    var payload = {
      clientId: clientId,
      clientName: clientName,
      amountCents: amountCents,
      currencyFrom: currFrom,
      currencyTo: currTo
    };
    if (desc) payload.description = desc;

    btnRun.disabled = true;
    setButtonLoading(btnRun, 'Running...');

    clearFeed();

    // Step 1: Submit
    var reqBody = document.createDocumentFragment();
    var reqLabel = document.createElement('div');
    reqLabel.textContent = 'POST /mcp/submit-payment';
    reqLabel.style.cssText = 'font-weight:600; color:#818cf8; margin-bottom:6px; font-family:JetBrains Mono,monospace; font-size:12px;';
    reqBody.appendChild(reqLabel);
    reqBody.appendChild(makeCodeBlock(payload));

    addEntry({
      title: 'Submitting Payment',
      dotColor: '',
      pulse: true,
      body: reqBody,
      delay: 0
    });

    var stateMachine = createStateMachine();

    fetch('/mcp/submit-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var agents = data.agentResults || [];
      var agentNames = { validate: 'Validate Agent', quote: 'Quote Agent', screen: 'Screen Agent', execute: 'Execute Agent', reconcile: 'Reconcile Agent' };

      for (var i = 0; i < agents.length; i++) {
        (function(agent, idx) {
          setTimeout(function() {
            var agentBody = document.createDocumentFragment();

            var reasoning = document.createElement('div');
            reasoning.textContent = agent.reasoning;
            reasoning.style.marginBottom = '6px';
            agentBody.appendChild(reasoning);

            var duration = document.createElement('div');
            duration.style.cssText = 'font-size:11px; color:#475569; font-family:JetBrains Mono,monospace;';
            duration.textContent = 'Duration: ' + agent.durationMs + 'ms';
            agentBody.appendChild(duration);

            if (agent.detail && Object.keys(agent.detail).length > 0) {
              agentBody.appendChild(makeDetailToggle(agent.detail));
            }

            addEntry({
              title: agentNames[agent.agentType] || agent.agentType,
              badge: agent.verdict,
              dotColor: agent.verdict,
              body: agentBody,
              delay: 0
            });
          }, idx * 200);
        })(agents[i], i);
      }

      var afterAgentsDelay = agents.length * 200 + 100;

      setTimeout(function() {
        var statusColor = data.status === 'APPROVED' ? 'green' : data.status === 'ESCALATED' ? 'amber' : 'red';
        var summaryBody = document.createDocumentFragment();

        var statusLine = document.createElement('div');
        statusLine.textContent = 'Pipeline verdict: ' + data.status;
        statusLine.style.cssText = 'font-weight:600; margin-bottom:4px;';
        summaryBody.appendChild(statusLine);

        if (data.escalationReason) {
          var escLine = document.createElement('div');
          escLine.textContent = 'Reason: ' + data.escalationReason;
          escLine.style.cssText = 'color:#f59e0b; margin-bottom:4px;';
          summaryBody.appendChild(escLine);
        }

        var durLine = document.createElement('div');
        durLine.style.cssText = 'font-size:11px; color:#475569; font-family:JetBrains Mono,monospace;';
        durLine.textContent = 'Total pipeline: ' + data.totalDurationMs + 'ms | Resolved by: ' + data.resolvedBy;
        summaryBody.appendChild(durLine);

        summaryBody.appendChild(stateMachine);

        if (data.status === 'APPROVED') {
          advanceStateTo(stateMachine, 'PENDING_PSP');
        } else if (data.status === 'ESCALATED') {
          advanceStateTo(stateMachine, 'INITIATED', 'amber');
        } else {
          advanceStateTo(stateMachine, 'INITIATED', 'red');
        }

        addEntry({
          title: 'Pipeline Result',
          badge: statusColor,
          dotColor: statusColor,
          body: summaryBody,
          delay: 0
        });

        if (data.status === 'APPROVED' || data.status === 'ESCALATED') {
          setTimeout(function() {
            showBridgeStep(clientId, amount, currFrom, currTo, stateMachine, data.status);
          }, 400);
        }

        btnRun.disabled = false;
        setButtonText(btnRun, 'Run Transaction');

      }, afterAgentsDelay);
    })
    .catch(function(err) {
      addEntry({
        title: 'Error',
        dotColor: 'red',
        body: 'Request failed: ' + (err.message || String(err)),
        delay: 0
      });
      btnRun.disabled = false;
      setButtonText(btnRun, 'Run Transaction');
    });
  });

  // ── Bridge Simulator Step ───────────────────────────────────────
  function showBridgeStep(clientId, amount, currFrom, currTo, stateMachine, pipelineStatus) {
    var bridgeReqBody = document.createDocumentFragment();

    var bridgeLabel = document.createElement('div');
    bridgeLabel.textContent = 'POST /bridge-sim/v0/transfers';
    bridgeLabel.style.cssText = 'font-weight:600; color:#818cf8; margin-bottom:6px; font-family:JetBrains Mono,monospace; font-size:12px;';
    bridgeReqBody.appendChild(bridgeLabel);

    var bridgePayload = {
      amount: String(amount),
      on_behalf_of: clientId,
      source: { currency: currFrom, payment_rail: 'ach' },
      destination: { currency: currTo.toLowerCase(), payment_rail: 'ethereum' }
    };
    bridgeReqBody.appendChild(makeCodeBlock(bridgePayload));

    var bridgeEntry = addEntry({
      title: 'Bridge Simulator: Creating Transfer',
      dotColor: '',
      pulse: true,
      body: bridgeReqBody,
      delay: 0
    });

    fetch('/bridge-sim/v0/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': 'sim-key'
      },
      body: JSON.stringify(bridgePayload)
    })
    .then(function(res) { return res.json(); })
    .then(function(transfer) {
      bridgeEntry.dot.classList.remove('pulse');
      bridgeEntry.dot.classList.add('green');

      var respBody = document.createDocumentFragment();

      var respLabel = document.createElement('div');
      respLabel.textContent = 'Transfer created: ' + transfer.id;
      respLabel.style.cssText = 'font-weight:600; color:#22c55e; margin-bottom:6px;';
      respBody.appendChild(respLabel);

      var stateLabel = document.createElement('div');
      stateLabel.textContent = 'State: ' + transfer.state;
      stateLabel.style.marginBottom = '6px';
      respBody.appendChild(stateLabel);

      if (transfer.receipt) {
        respBody.appendChild(makeDetailToggle(transfer));
      }

      addEntry({
        title: 'Bridge Transfer Response',
        dotColor: 'green',
        body: respBody,
        delay: 0
      });

      if (pipelineStatus === 'APPROVED') {
        advanceStateTo(stateMachine, 'PENDING_SETTLEMENT');
      }

      addEntry({
        title: 'Waiting for Settlement...',
        dotColor: '',
        pulse: true,
        body: 'Bridge auto-settles after ~5 seconds. Checking in 5s...',
        delay: 0
      });

      setTimeout(function() {
        fetch('/bridge-sim/v0/transfers/' + encodeURIComponent(transfer.id), {
          headers: { 'Api-Key': 'sim-key' }
        })
        .then(function(res) { return res.json(); })
        .then(function(settled) {
          var isSettled = settled.state === 'payment_processed';

          var settlBody = document.createDocumentFragment();
          var stLine = document.createElement('div');
          stLine.textContent = 'State: ' + settled.state + (isSettled ? ' (settled)' : '');
          stLine.style.cssText = 'font-weight:600; color:' + (isSettled ? '#22c55e' : '#f59e0b') + '; margin-bottom:6px;';
          settlBody.appendChild(stLine);

          var checkLabel = document.createElement('div');
          checkLabel.textContent = 'GET /bridge-sim/v0/transfers/' + transfer.id;
          checkLabel.style.cssText = 'font-size:11px; color:#475569; font-family:JetBrains Mono,monospace; margin-bottom:6px;';
          settlBody.appendChild(checkLabel);

          settlBody.appendChild(makeDetailToggle(settled));

          addEntry({
            title: 'Bridge Settlement Check',
            dotColor: isSettled ? 'green' : 'amber',
            body: settlBody,
            delay: 0
          });

          if (isSettled && pipelineStatus === 'APPROVED') {
            advanceStateTo(stateMachine, 'SETTLED');
          }
        })
        .catch(function(err) {
          addEntry({
            title: 'Settlement Check Failed',
            dotColor: 'red',
            body: 'Error: ' + (err.message || String(err)),
            delay: 0
          });
        });
      }, 5000);
    })
    .catch(function(err) {
      bridgeEntry.dot.classList.remove('pulse');
      bridgeEntry.dot.classList.add('red');
      addEntry({
        title: 'Bridge Error',
        dotColor: 'red',
        body: 'Request failed: ' + (err.message || String(err)),
        delay: 0
      });
    });
  }

  // ── Run Ops Cycle ───────────────────────────────────────────────
  btnOps.addEventListener('click', function() {
    btnOps.disabled = true;
    setButtonLoading(btnOps, 'Running Ops...', '#818cf8');

    ensureTimeline();

    addEntry({
      title: 'Starting Ops Cycle',
      dotColor: '',
      pulse: true,
      body: 'POST /ops/run \\u2014 Running all 5 operations agents...',
      delay: 0
    });

    fetch('/ops/run', { method: 'POST' })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var results = data.results || [];
      var agentLabels = {
        settlement: 'Settlement Agent',
        reconciliation: 'Reconciliation Agent',
        fraud: 'Fraud Detection Agent',
        aml: 'AML Compliance Agent',
        ops: 'Payments Ops Agent'
      };

      for (var i = 0; i < results.length; i++) {
        (function(r, idx) {
          setTimeout(function() {
            var verdictColor = r.verdict === 'ok' ? 'green' : r.verdict === 'error' ? 'red' : r.verdict === 'escalated' ? 'amber' : 'green';

            var opsBody = document.createDocumentFragment();

            var summaryLine = document.createElement('div');
            summaryLine.textContent = r.summary;
            summaryLine.style.marginBottom = '6px';
            opsBody.appendChild(summaryLine);

            var statsLine = document.createElement('div');
            statsLine.style.cssText = 'font-size:11px; color:#475569; font-family:JetBrains Mono,monospace; line-height:1.8;';
            statsLine.textContent = 'Processed: ' + r.itemsProcessed + ' | Actions: ' + r.actionsPerformed.length + ' | Escalations: ' + r.escalations.length + ' | Errors: ' + r.errors.length + ' | ' + r.durationMs + 'ms';
            opsBody.appendChild(statsLine);

            if (r.actionsPerformed.length > 0 || r.escalations.length > 0 || r.errors.length > 0) {
              var detail = {
                actionsPerformed: r.actionsPerformed,
                escalations: r.escalations,
                errors: r.errors
              };
              opsBody.appendChild(makeDetailToggle(detail));
            }

            addEntry({
              title: agentLabels[r.agentType] || r.agentType,
              badge: verdictColor,
              dotColor: verdictColor,
              body: opsBody,
              delay: 0
            });
          }, idx * 250);
        })(results[i], i);
      }

      setTimeout(function() {
        addEntry({
          title: 'Ops Cycle Complete',
          dotColor: 'green',
          body: results.length + ' agents ran at ' + (data.ranAt || now()),
          delay: 0
        });

        btnOps.disabled = false;
        setButtonText(btnOps, 'Run Ops Cycle');
      }, results.length * 250 + 100);
    })
    .catch(function(err) {
      addEntry({
        title: 'Ops Error',
        dotColor: 'red',
        body: 'Request failed: ' + (err.message || String(err)),
        delay: 0
      });
      btnOps.disabled = false;
      setButtonText(btnOps, 'Run Ops Cycle');
    });
  });

})();
</script>

</body>
</html>`
