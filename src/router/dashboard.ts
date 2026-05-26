import { Hono } from 'hono'
import type { Env } from '../lib/env'

const dashboard = new Hono<{ Bindings: Env }>()

// ── Dashboard HTML (inlined for Cloudflare Workers) ──────────────────────────
// NOTE: All dynamic content rendered client-side is sanitized via the esc()
// helper which uses textContent to prevent XSS. Data originates from our own
// D1 database and is escaped before DOM insertion.

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Xnumia \u2014 Payment Pipeline</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f172a;
    --card: #1e293b;
    --card-hover: #253349;
    --text: #e2e8f0;
    --text-muted: #94a3b8;
    --border: #334155;
    --green: #22c55e;
    --amber: #f59e0b;
    --red: #ef4444;
    --blue: #3b82f6;
    --gray: #6b7280;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.5;
  }

  .site-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 32px;
    background: rgba(10, 14, 26, 0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
    position: sticky; top: 0; z-index: 200;
  }
  .site-nav .nav-brand {
    font-size: 18px; font-weight: 700;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .site-nav .nav-links a {
    color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500;
    margin-left: 24px; transition: color 0.2s;
  }
  .site-nav .nav-links a:hover { color: #e2e8f0; }
  .site-nav .nav-links a.active { color: #e2e8f0; }

  .header {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-bottom: 1px solid var(--border);
    padding: 1.25rem 2rem;
    position: sticky;
    top: 52px;
    z-index: 100;
  }

  .header-inner {
    max-width: 1440px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header h1 {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .header h1 span {
    color: var(--blue);
  }

  .stats-bar {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .stat {
    text-align: center;
  }

  .stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-top: 0.2rem;
  }

  .refresh-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .refresh-toggle input { display: none; }

  .toggle-track {
    width: 40px;
    height: 22px;
    background: var(--border);
    border-radius: 11px;
    position: relative;
    transition: background 0.2s;
  }

  .toggle-track::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    background: var(--text-muted);
    border-radius: 50%;
    transition: transform 0.2s, background 0.2s;
  }

  .refresh-toggle input:checked + .toggle-track {
    background: var(--green);
  }

  .refresh-toggle input:checked + .toggle-track::after {
    transform: translateX(18px);
    background: white;
  }

  .layout {
    max-width: 1440px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    min-height: calc(100vh - 80px);
  }

  .pipeline-section h2 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .card:hover {
    border-color: #475569;
  }

  .card.escalated {
    animation: pulse-border 2s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%, 100% { border-color: var(--amber); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    50% { border-color: var(--amber); box-shadow: 0 0 12px 0 rgba(245, 158, 11, 0.15); }
  }

  .card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .card-client {
    font-weight: 600;
    font-size: 1rem;
  }

  .card-amount {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.95rem;
    color: var(--text);
  }

  .card-currencies {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.15rem;
  }

  .card-id {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--gray);
    margin-top: 0.25rem;
  }

  .badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    white-space: nowrap;
  }

  .badge-APPROVED { background: rgba(34,197,94,0.15); color: var(--green); }
  .badge-ESCALATED { background: rgba(245,158,11,0.15); color: var(--amber); }
  .badge-REJECTED { background: rgba(239,68,68,0.15); color: var(--red); }
  .badge-PROCESSING { background: rgba(59,130,246,0.15); color: var(--blue); }
  .badge-PENDING { background: rgba(107,114,128,0.15); color: var(--gray); }

  .pipeline-viz {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .agent-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
  }

  .agent-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 600;
    color: white;
    transition: transform 0.15s, box-shadow 0.15s;
    position: relative;
  }

  .agent-circle:hover {
    transform: scale(1.15);
  }

  .agent-circle.active {
    transform: scale(1.15);
    outline: 2px solid white;
    outline-offset: 2px;
  }

  .agent-circle.green  { background: var(--green); box-shadow: 0 0 12px rgba(34,197,94,0.4); }
  .agent-circle.amber  { background: var(--amber); box-shadow: 0 0 12px rgba(245,158,11,0.4); }
  .agent-circle.red    { background: var(--red);   box-shadow: 0 0 12px rgba(239,68,68,0.4); }
  .agent-circle.gray   { background: var(--gray);  box-shadow: none; }

  .agent-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .agent-connector {
    width: 24px;
    height: 2px;
    background: var(--border);
    margin-bottom: 1.2rem;
  }

  .agent-detail {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
    margin-top: 0;
  }

  .agent-detail.open {
    max-height: 300px;
    opacity: 1;
    margin-top: 1rem;
  }

  .agent-detail-inner {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
  }

  .agent-detail-header {
    font-weight: 600;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .agent-detail-field {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.35rem;
  }

  .agent-detail-field strong {
    color: var(--text);
  }

  .sidebar {
    position: sticky;
    top: 100px;
    align-self: start;
  }

  .sidebar h2 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sidebar h2 .count {
    background: var(--amber);
    color: #0f172a;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.1rem 0.5rem;
    border-radius: 10px;
  }

  .queue-cards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .queue-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem;
  }

  .queue-client {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .queue-amount {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    margin-top: 0.2rem;
  }

  .queue-reason {
    font-size: 0.75rem;
    color: var(--amber);
    margin-top: 0.4rem;
    padding: 0.4rem 0.6rem;
    background: rgba(245,158,11,0.08);
    border-radius: 6px;
  }

  .queue-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .queue-actions button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition: opacity 0.15s;
    font-family: inherit;
  }

  .queue-actions button:hover { opacity: 0.85; }

  .btn-approve { background: var(--green); color: white; }
  .btn-reject  { background: var(--red); color: white; }

  .reject-input {
    display: none;
    margin-top: 0.5rem;
  }

  .reject-input.show {
    display: flex;
    gap: 0.5rem;
  }

  .reject-input input {
    flex: 1;
    padding: 0.4rem 0.6rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 0.8rem;
    font-family: inherit;
    outline: none;
  }

  .reject-input input:focus { border-color: var(--blue); }

  .reject-input button {
    padding: 0.4rem 0.75rem;
    background: var(--red);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .empty-state {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
    padding: 2rem 1rem;
  }

  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
      padding: 1rem;
    }
    .sidebar {
      position: static;
    }
    .header-inner {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
</head>
<body>

<nav class="site-nav">
  <div class="nav-brand">XNUMIA</div>
  <div class="nav-links">
    <a href="/">Overview</a>
    <a href="/dashboard" class="active">Dashboard</a>
    <a href="/flowchart">Architecture</a>
    <a href="/agents">Agents</a>
    <a href="/api-explorer">API</a>
    <a href="/simulate">Simulate</a>
    <a href="/readiness">Readiness</a>
  </div>
</nav>

<header class="header">
  <div class="header-inner">
    <h1><span>Xnumia</span> \\u2014 Payment Pipeline</h1>
    <div class="stats-bar">
      <div class="stat">
        <div class="stat-value" id="stat-total">\\u2014</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color:var(--green)" id="stat-approved">\\u2014</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color:var(--amber)" id="stat-escalated">\\u2014</div>
        <div class="stat-label">Escalated</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color:var(--red)" id="stat-rejected">\\u2014</div>
        <div class="stat-label">Rejected</div>
      </div>
    </div>
    <label class="refresh-toggle">
      <input type="checkbox" id="auto-refresh" checked>
      <div class="toggle-track"></div>
      Auto-refresh
    </label>
  </div>
</header>

<main class="layout">
  <section class="pipeline-section">
    <h2>Pipeline Requests</h2>
    <div class="cards" id="cards-container">
      <div class="empty-state">Loading...</div>
    </div>
  </section>

  <aside class="sidebar">
    <h2>Approval Queue <span class="count" id="queue-count">0</span></h2>
    <div class="queue-cards" id="queue-container">
      <div class="empty-state">No escalated requests</div>
    </div>
  </aside>
</main>

<script>
(function() {
  var AGENTS = ['validate', 'quote', 'screen', 'execute', 'reconcile'];
  var AGENT_LABELS = { validate: 'Validate', quote: 'Quote', screen: 'Screen', execute: 'Execute', reconcile: 'Reconcile' };
  var AGENT_ICONS = { validate: 'VA', quote: 'QT', screen: 'SC', execute: 'EX', reconcile: 'RC' };

  var decisionsCache = {};
  var expandedAgents = {};
  var refreshInterval = null;

  /* esc() sanitizes strings for safe DOM insertion via textContent round-trip */
  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function formatAmount(cents, currency) {
    var dollars = (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var symbols = { USD: '$', CAD: 'C$', EUR: '\\u20AC', GBP: '\\u00A3', JPY: '\\u00A5', CHF: 'CHF ' };
    var sym = symbols[currency] || '';
    return esc(sym + dollars + ' ' + currency);
  }

  function fetchJSON(url, opts) {
    return fetch(url, opts).then(function(res) { return res.json(); });
  }

  function loadStats() {
    fetchJSON('/api/stats').then(function(s) {
      document.getElementById('stat-total').textContent = s.total != null ? s.total : 0;
      document.getElementById('stat-approved').textContent = s.approved != null ? s.approved : 0;
      document.getElementById('stat-escalated').textContent = s.escalated != null ? s.escalated : 0;
      document.getElementById('stat-rejected').textContent = s.rejected != null ? s.rejected : 0;
    }).catch(function(e) { console.error('Stats error', e); });
  }

  function loadDecisions(requestId) {
    if (decisionsCache[requestId]) return Promise.resolve(decisionsCache[requestId]);
    return fetchJSON('/api/requests/' + encodeURIComponent(requestId) + '/decisions').then(function(data) {
      var map = {};
      (data.decisions || data || []).forEach(function(d) { map[d.agent_type] = d; });
      decisionsCache[requestId] = map;
      return map;
    }).catch(function(e) {
      console.error('Decisions error', e);
      return {};
    });
  }

  function verdictToBadgeClass(verdict) {
    if (verdict === 'green') return 'APPROVED';
    if (verdict === 'red') return 'REJECTED';
    return 'ESCALATED';
  }

  function buildAgentDetailDOM(decision) {
    if (!decision) return '';
    var detail;
    try {
      detail = typeof decision.detail === 'string' ? JSON.parse(decision.detail || '{}') : (decision.detail || {});
    } catch(e) { detail = {}; }
    var detailStr = Object.keys(detail).map(function(k) {
      return '<div class="agent-detail-field"><strong>' + esc(k) + ':</strong> ' + esc(String(detail[k])) + '</div>';
    }).join('');
    return '<div class="agent-detail-inner">' +
      '<div class="agent-detail-header"><span class="badge badge-' + verdictToBadgeClass(decision.verdict) +
      '">' + esc(decision.verdict.toUpperCase()) + '</span> ' + esc(AGENT_LABELS[decision.agent_type]) + ' Agent</div>' +
      '<div class="agent-detail-field"><strong>Action:</strong> ' + esc(decision.action || '\\u2014') + '</div>' +
      '<div class="agent-detail-field"><strong>Reasoning:</strong> ' + esc(decision.reasoning || '\\u2014') + '</div>' +
      (decision.duration_ms ? '<div class="agent-detail-field"><strong>Duration:</strong> ' + esc(String(decision.duration_ms)) + 'ms</div>' : '') +
      detailStr +
      '</div>';
  }

  function renderCards(requests) {
    var container = document.getElementById('cards-container');
    if (!requests || requests.length === 0) {
      container.textContent = '';
      var empt = document.createElement('div');
      empt.className = 'empty-state';
      empt.textContent = 'No payment requests yet';
      container.appendChild(empt);
      return Promise.resolve();
    }

    return Promise.all(requests.map(function(r) { return loadDecisions(r.id); })).then(function() {
      /* All values inserted via esc() which sanitizes through textContent */
      var html = requests.map(function(r) {
        var decisions = decisionsCache[r.id] || {};
        var isEscalated = r.status === 'ESCALATED';
        var expandedAgent = expandedAgents[r.id];

        var pipelineHtml = AGENTS.map(function(agent, i) {
          var d = decisions[agent];
          var verdict = d ? d.verdict : 'gray';
          var isActive = expandedAgent === agent;
          var node = '<div class="agent-node" data-request="' + esc(r.id) + '" data-agent="' + esc(agent) + '">' +
            '<div class="agent-circle ' + esc(verdict) + (isActive ? ' active' : '') + '">' + esc(AGENT_ICONS[agent]) + '</div>' +
            '<div class="agent-label">' + esc(AGENT_LABELS[agent]) + '</div>' +
            '</div>';
          var connector = i < AGENTS.length - 1 ? '<div class="agent-connector"></div>' : '';
          return node + connector;
        }).join('');

        var detailHtml = '';
        if (expandedAgent && decisions[expandedAgent]) {
          detailHtml = '<div class="agent-detail open">' + buildAgentDetailDOM(decisions[expandedAgent]) + '</div>';
        } else if (expandedAgent) {
          detailHtml = '<div class="agent-detail open"><div class="agent-detail-inner"><div class="agent-detail-field">Agent has not run yet</div></div></div>';
        }

        return '<div class="card' + (isEscalated ? ' escalated' : '') + '">' +
          '<div class="card-top">' +
            '<div>' +
              '<div class="card-client">' + esc(r.client_name || r.client_id) + '</div>' +
              '<div class="card-amount">' + formatAmount(r.amount_cents, r.currency_from) + '</div>' +
              '<div class="card-currencies">' + esc(r.currency_from) + ' \\u2192 ' + esc(r.currency_to) + '</div>' +
              '<div class="card-id">' + esc(r.id.slice(0, 8)) + '...</div>' +
            '</div>' +
            '<span class="badge badge-' + esc(r.status) + '">' + esc(r.status) + '</span>' +
          '</div>' +
          '<div class="pipeline-viz">' + pipelineHtml + '</div>' +
          detailHtml +
          '</div>';
      }).join('');

      container.innerHTML = html;

      container.querySelectorAll('.agent-node').forEach(function(node) {
        node.addEventListener('click', function() {
          var reqId = node.dataset.request;
          var agent = node.dataset.agent;
          if (expandedAgents[reqId] === agent) {
            delete expandedAgents[reqId];
          } else {
            expandedAgents[reqId] = agent;
          }
          renderCards(requests);
        });
      });
    });
  }

  function renderQueue(requests) {
    var escalated = (requests || []).filter(function(r) { return r.status === 'ESCALATED'; });
    document.getElementById('queue-count').textContent = escalated.length;
    var container = document.getElementById('queue-container');

    if (escalated.length === 0) {
      container.textContent = '';
      var empt = document.createElement('div');
      empt.className = 'empty-state';
      empt.textContent = 'No escalated requests';
      container.appendChild(empt);
      return;
    }

    /* All values inserted via esc() which sanitizes through textContent */
    container.innerHTML = escalated.map(function(r) {
      return '<div class="queue-card">' +
        '<div class="queue-client">' + esc(r.client_name || r.client_id) + '</div>' +
        '<div class="queue-amount">' + formatAmount(r.amount_cents, r.currency_from) + '</div>' +
        (r.escalation_reason ? '<div class="queue-reason">' + esc(r.escalation_reason) + '</div>' : '') +
        '<div class="queue-actions">' +
          '<button class="btn-approve" data-id="' + esc(r.id) + '">Approve</button>' +
          '<button class="btn-reject" data-id="' + esc(r.id) + '">Reject</button>' +
        '</div>' +
        '<div class="reject-input" id="reject-' + esc(r.id) + '">' +
          '<input type="text" placeholder="Rejection reason...">' +
          '<button data-id="' + esc(r.id) + '">Send</button>' +
        '</div>' +
        '</div>';
    }).join('');

    container.querySelectorAll('.btn-approve').forEach(function(btn) {
      btn.addEventListener('click', function() {
        fetchJSON('/api/requests/' + encodeURIComponent(btn.dataset.id) + '/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approvedBy: 'dashboard-user' })
        }).then(function() { refresh(); });
      });
    });

    container.querySelectorAll('.btn-reject').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var el = document.getElementById('reject-' + btn.dataset.id);
        el.classList.toggle('show');
      });
    });

    container.querySelectorAll('.reject-input button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var input = btn.previousElementSibling;
        var reason = input.value || 'Rejected by reviewer';
        fetchJSON('/api/requests/' + encodeURIComponent(btn.dataset.id) + '/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejectedBy: 'dashboard-user', reason: reason })
        }).then(function() { refresh(); });
      });
    });
  }

  var lastRequests = [];

  function refresh() {
    fetchJSON('/api/requests').then(function(data) {
      lastRequests = data.requests || data || [];
      decisionsCache = {};
      renderCards(lastRequests).then(function() {
        renderQueue(lastRequests);
      });
      loadStats();
    }).catch(function(e) {
      console.error('Refresh error', e);
    });
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshInterval = setInterval(refresh, 5000);
  }

  function stopAutoRefresh() {
    if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
  }

  document.getElementById('auto-refresh').addEventListener('change', function() {
    if (this.checked) startAutoRefresh(); else stopAutoRefresh();
  });

  refresh();
  startAutoRefresh();
})();
<` + `/script>
</body>
</html>`

// ── Serve the dashboard page ─────────────────────────────────────────────────

dashboard.get('/dashboard', (c) => {
  return c.html(DASHBOARD_HTML)
})

// ── API: List payment requests ───────────────────────────────────────────────

dashboard.get('/api/requests', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM payment_requests ORDER BY created_at DESC LIMIT 50'
  ).all()

  return c.json({ requests: results })
})

// ── API: Get agent decisions for a request ───────────────────────────────────

dashboard.get('/api/requests/:id/decisions', async (c) => {
  const requestId = c.req.param('id')

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM agent_decisions WHERE request_id = ? ORDER BY created_at ASC'
  ).bind(requestId).all()

  return c.json({ decisions: results })
})

// ── API: Approve an escalated request ────────────────────────────────────────

dashboard.post('/api/requests/:id/approve', async (c) => {
  const requestId = c.req.param('id')
  const body = await c.req.json<{ approvedBy: string }>()
  const now = new Date().toISOString()

  // Update the payment request
  await c.env.DB.prepare(
    `UPDATE payment_requests
     SET status = 'APPROVED', resolved_by = ?, resolved_at = ?, updated_at = ?
     WHERE id = ? AND status = 'ESCALATED'`
  ).bind(body.approvedBy, now, now, requestId).run()

  // Write audit log
  await c.env.DB.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, actor, detail, created_at)
     VALUES (?, 'payment_request', ?, 'APPROVE', ?, NULL, ?)`
  ).bind(crypto.randomUUID(), requestId, body.approvedBy, now).run()

  return c.json({ ok: true, requestId, status: 'APPROVED' })
})

// ── API: Reject an escalated request ─────────────────────────────────────────

dashboard.post('/api/requests/:id/reject', async (c) => {
  const requestId = c.req.param('id')
  const body = await c.req.json<{ rejectedBy: string; reason: string }>()
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `UPDATE payment_requests
     SET status = 'REJECTED', resolved_by = ?, resolved_at = ?, escalation_reason = ?, updated_at = ?
     WHERE id = ? AND status = 'ESCALATED'`
  ).bind(body.rejectedBy, now, body.reason, now, requestId).run()

  await c.env.DB.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, actor, detail, created_at)
     VALUES (?, 'payment_request', ?, 'REJECT', ?, ?, ?)`
  ).bind(crypto.randomUUID(), requestId, body.rejectedBy, JSON.stringify({ reason: body.reason }), now).run()

  return c.json({ ok: true, requestId, status: 'REJECTED' })
})

// ── API: Stats ───────────────────────────────────────────────────────────────

dashboard.get('/api/stats', async (c) => {
  const countQuery = (status: string) =>
    c.env.DB.prepare('SELECT COUNT(*) as count FROM payment_requests WHERE status = ?').bind(status).first<{ count: number }>()

  const [total, approved, escalated, rejected, verdicts] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM payment_requests').first<{ count: number }>(),
    countQuery('APPROVED'),
    countQuery('ESCALATED'),
    countQuery('REJECTED'),
    c.env.DB.prepare(
      'SELECT verdict, COUNT(*) as count FROM agent_decisions GROUP BY verdict'
    ).all<{ verdict: string; count: number }>(),
  ])

  const verdictDist: Record<string, number> = {}
  for (const row of verdicts.results) {
    verdictDist[row.verdict] = row.count
  }

  return c.json({
    total: total?.count ?? 0,
    approved: approved?.count ?? 0,
    escalated: escalated?.count ?? 0,
    rejected: rejected?.count ?? 0,
    verdicts: verdictDist,
  })
})

export { dashboard }
