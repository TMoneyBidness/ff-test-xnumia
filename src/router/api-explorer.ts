import { Hono } from 'hono'
import type { Env } from '../lib/env'

const apiExplorer = new Hono<{ Bindings: Env }>()

apiExplorer.get('/api-explorer', (c) => {
  return c.html(API_HTML)
})

// Keep the raw JSON manifest available
apiExplorer.get('/api/mcp/manifest', (c) => {
  return c.json({
    name: 'xnumia-payment-pipeline',
    version: '0.1.0',
    tools: 'See /mcp/manifest for full tool definitions',
  })
})

export { apiExplorer }

const API_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Xnumia \\u2014 API Explorer</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0e1a; color: #e2e8f0; font-family: 'Inter', sans-serif; min-height: 100vh; }

  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 32px; background: rgba(10,14,26,0.95); backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(99,102,241,0.15); position: sticky; top: 0; z-index: 100;
  }
  .nav-brand { font-size: 18px; font-weight: 700; background: linear-gradient(135deg,#818cf8,#6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .nav-links a { color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500; margin-left: 24px; transition: color 0.2s; }
  .nav-links a:hover, .nav-links a.active { color: #e2e8f0; }

  .container { max-width: 960px; margin: 0 auto; padding: 48px 32px; }

  h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px;
    background: linear-gradient(135deg,#e2e8f0 0%,#818cf8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 12px; }
  .base-url {
    font-family: 'JetBrains Mono', monospace; font-size: 13px;
    color: #818cf8; background: rgba(99,102,241,0.1);
    padding: 8px 16px; border-radius: 8px; display: inline-block; margin-bottom: 40px;
  }

  .section-title { font-size: 18px; font-weight: 700; color: #c7d2fe; margin: 32px 0 16px; }

  .endpoint {
    background: rgba(30,41,59,0.6); border: 1px solid rgba(99,102,241,0.12);
    border-radius: 12px; margin-bottom: 16px; overflow: hidden; transition: all 0.2s;
  }
  .endpoint:hover { border-color: rgba(99,102,241,0.3); }

  .endpoint-header {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px; cursor: pointer; user-select: none;
  }
  .method {
    font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em;
    flex-shrink: 0;
  }
  .method.post { background: rgba(34,197,94,0.15); color: #22c55e; }
  .method.get { background: rgba(99,102,241,0.15); color: #818cf8; }

  .path { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e2e8f0; }
  .path .param { color: #f59e0b; }

  .endpoint-desc { font-size: 13px; color: #94a3b8; margin-left: auto; }

  .endpoint-detail {
    display: none; padding: 0 20px 20px;
    border-top: 1px solid rgba(99,102,241,0.08);
  }
  .endpoint.open .endpoint-detail { display: block; }
  .endpoint-detail h4 { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; }

  .params-table { width: 100%; border-collapse: collapse; }
  .params-table th { text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; padding: 6px 0; border-bottom: 1px solid rgba(51,65,85,0.4); }
  .params-table td { padding: 8px 0; font-size: 13px; border-bottom: 1px solid rgba(51,65,85,0.2); }
  .params-table td:first-child { font-family: 'JetBrains Mono', monospace; color: #818cf8; width: 140px; }
  .params-table .type { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #64748b; width: 80px; }
  .params-table .req { color: #f59e0b; font-size: 11px; font-weight: 600; }

  .curl-block {
    background: rgba(15,23,42,0.8); border: 1px solid rgba(99,102,241,0.1);
    border-radius: 8px; padding: 16px; font-family: 'JetBrains Mono', monospace;
    font-size: 12px; color: #94a3b8; overflow-x: auto; white-space: pre-wrap;
    line-height: 1.6; margin-top: 8px;
  }
  .curl-block .cmd { color: #22c55e; }
  .curl-block .flag { color: #818cf8; }
  .curl-block .url { color: #f59e0b; }
  .curl-block .str { color: #e2e8f0; }

  .response-block {
    background: rgba(15,23,42,0.8); border: 1px solid rgba(99,102,241,0.1);
    border-radius: 8px; padding: 16px; font-family: 'JetBrains Mono', monospace;
    font-size: 12px; color: #94a3b8; overflow-x: auto; white-space: pre;
    line-height: 1.5; margin-top: 8px; max-height: 300px; overflow-y: auto;
  }

  .try-btn {
    margin-top: 12px; padding: 8px 20px;
    background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
    border-radius: 6px; color: #c7d2fe; font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
  }
  .try-btn:hover { background: rgba(99,102,241,0.3); }
  .try-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .chevron { color: #475569; transition: transform 0.2s; margin-left: auto; }
  .endpoint.open .chevron { transform: rotate(90deg); }

  @media (max-width: 640px) {
    .endpoint-header { flex-wrap: wrap; }
    .endpoint-desc { margin-left: 0; width: 100%; margin-top: 4px; }
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
    <a href="/api-explorer" class="active">API</a>
    <a href="/simulate">Simulate</a>
    <a href="/readiness">Readiness</a>
  </div>
</nav>

<div class="container">
  <h1>API Explorer</h1>
  <div class="subtitle">MCP-compatible endpoints for programmatic pipeline interaction</div>
  <div class="base-url">Base URL: https://ff-test.taylorerwin.workers.dev</div>

  <h3 class="section-title">Pipeline Operations</h3>

  <div class="endpoint" onclick="toggle(this)">
    <div class="endpoint-header">
      <span class="method post">POST</span>
      <span class="path">/mcp/submit-payment</span>
      <span class="endpoint-desc">Submit a payment request through the agent pipeline</span>
      <span class="chevron">\\u25B6</span>
    </div>
    <div class="endpoint-detail">
      <h4>Parameters (JSON body)</h4>
      <table class="params-table">
        <thead><tr><th>Name</th><th>Type</th><th></th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>clientId</td><td class="type">string</td><td class="req">required</td><td>Unique client identifier</td></tr>
          <tr><td>clientName</td><td class="type">string</td><td class="req">required</td><td>Display name of the client</td></tr>
          <tr><td>amountCents</td><td class="type">integer</td><td class="req">required</td><td>Amount in cents (15000 = $150.00)</td></tr>
          <tr><td>currencyFrom</td><td class="type">string</td><td class="req">required</td><td>Source currency (CAD, USD, EUR, GBP)</td></tr>
          <tr><td>currencyTo</td><td class="type">string</td><td class="req">required</td><td>Target currency (USDC, USDT)</td></tr>
          <tr><td>description</td><td class="type">string</td><td></td><td>Optional payment description</td></tr>
        </tbody>
      </table>
      <h4>Example</h4>
      <div class="curl-block"><span class="cmd">curl</span> <span class="flag">-X POST</span> <span class="url">https://ff-test.taylorerwin.workers.dev/mcp/submit-payment</span> \\
  <span class="flag">-H</span> <span class="str">'Content-Type: application/json'</span> \\
  <span class="flag">-d</span> <span class="str">'{"clientId":"acme-001","clientName":"Acme Corp","amountCents":500000,"currencyFrom":"CAD","currencyTo":"USDC","description":"Invoice Q2"}'</span></div>
      <button class="try-btn" onclick="event.stopPropagation(); tryEndpoint(this, 'POST', '/mcp/submit-payment', JSON.stringify({clientId:'demo-'+Date.now(),clientName:'Demo Corp',amountCents:500000,currencyFrom:'CAD',currencyTo:'USDC',description:'API Explorer test'}))">\\u25B6 Try it live</button>
      <div class="response-block" style="display:none"></div>
    </div>
  </div>

  <div class="endpoint" onclick="toggle(this)">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="path">/mcp/pipeline-status/<span class="param">:requestId</span></span>
      <span class="endpoint-desc">Full status with all agent decisions</span>
      <span class="chevron">\\u25B6</span>
    </div>
    <div class="endpoint-detail">
      <h4>Path Parameters</h4>
      <table class="params-table">
        <thead><tr><th>Name</th><th>Type</th><th></th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>requestId</td><td class="type">string</td><td class="req">required</td><td>UUID of the payment request</td></tr>
        </tbody>
      </table>
      <h4>Example</h4>
      <div class="curl-block"><span class="cmd">curl</span> <span class="url">https://ff-test.taylorerwin.workers.dev/mcp/pipeline-status/YOUR_REQUEST_ID</span></div>
    </div>
  </div>

  <div class="endpoint" onclick="toggle(this)">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="path">/mcp/escalated</span>
      <span class="endpoint-desc">All payments awaiting human review</span>
      <span class="chevron">\\u25B6</span>
    </div>
    <div class="endpoint-detail">
      <h4>No parameters required</h4>
      <div class="curl-block"><span class="cmd">curl</span> <span class="url">https://ff-test.taylorerwin.workers.dev/mcp/escalated</span></div>
      <button class="try-btn" onclick="event.stopPropagation(); tryEndpoint(this, 'GET', '/mcp/escalated')">\\u25B6 Try it live</button>
      <div class="response-block" style="display:none"></div>
    </div>
  </div>

  <div class="endpoint" onclick="toggle(this)">
    <div class="endpoint-header">
      <span class="method post">POST</span>
      <span class="path">/mcp/approve/<span class="param">:requestId</span></span>
      <span class="endpoint-desc">Approve an escalated payment</span>
      <span class="chevron">\\u25B6</span>
    </div>
    <div class="endpoint-detail">
      <h4>Parameters (JSON body)</h4>
      <table class="params-table">
        <thead><tr><th>Name</th><th>Type</th><th></th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>approvedBy</td><td class="type">string</td><td class="req">required</td><td>Identifier of the approver</td></tr>
          <tr><td>reason</td><td class="type">string</td><td></td><td>Optional approval reason</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="endpoint" onclick="toggle(this)">
    <div class="endpoint-header">
      <span class="method post">POST</span>
      <span class="path">/mcp/reject/<span class="param">:requestId</span></span>
      <span class="endpoint-desc">Reject with reason</span>
      <span class="chevron">\\u25B6</span>
    </div>
    <div class="endpoint-detail">
      <h4>Parameters (JSON body)</h4>
      <table class="params-table">
        <thead><tr><th>Name</th><th>Type</th><th></th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>rejectedBy</td><td class="type">string</td><td class="req">required</td><td>Identifier of the rejector</td></tr>
          <tr><td>reason</td><td class="type">string</td><td class="req">required</td><td>Reason for rejection</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="endpoint" onclick="toggle(this)">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="path">/mcp/ask-why/<span class="param">:requestId</span>/<span class="param">:agentType</span></span>
      <span class="endpoint-desc">Detailed reasoning from a specific agent</span>
      <span class="chevron">\\u25B6</span>
    </div>
    <div class="endpoint-detail">
      <h4>Path Parameters</h4>
      <table class="params-table">
        <thead><tr><th>Name</th><th>Type</th><th></th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>requestId</td><td class="type">string</td><td class="req">required</td><td>UUID of the payment request</td></tr>
          <tr><td>agentType</td><td class="type">string</td><td class="req">required</td><td>One of: validate, quote, screen, execute, reconcile</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="endpoint" onclick="toggle(this)">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="path">/mcp/activity</span>
      <span class="endpoint-desc">Recent agent activity feed</span>
      <span class="chevron">\\u25B6</span>
    </div>
    <div class="endpoint-detail">
      <h4>Query Parameters</h4>
      <table class="params-table">
        <thead><tr><th>Name</th><th>Type</th><th></th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>limit</td><td class="type">integer</td><td></td><td>Number of results (default 20, max 100)</td></tr>
        </tbody>
      </table>
      <button class="try-btn" onclick="event.stopPropagation(); tryEndpoint(this, 'GET', '/mcp/activity?limit=5')">\\u25B6 Try it live</button>
      <div class="response-block" style="display:none"></div>
    </div>
  </div>

  <h3 class="section-title">Infrastructure</h3>

  <div class="endpoint" onclick="toggle(this)">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="path">/api/health</span>
      <span class="endpoint-desc">JSON health check (D1 connectivity)</span>
      <span class="chevron">\\u25B6</span>
    </div>
    <div class="endpoint-detail">
      <button class="try-btn" onclick="event.stopPropagation(); tryEndpoint(this, 'GET', '/api/health')">\\u25B6 Try it live</button>
      <div class="response-block" style="display:none"></div>
    </div>
  </div>

  <div class="endpoint" onclick="toggle(this)">
    <div class="endpoint-header">
      <span class="method get">GET</span>
      <span class="path">/mcp/manifest</span>
      <span class="endpoint-desc">MCP tool manifest (full JSON schema)</span>
      <span class="chevron">\\u25B6</span>
    </div>
    <div class="endpoint-detail">
      <button class="try-btn" onclick="event.stopPropagation(); tryEndpoint(this, 'GET', '/mcp/manifest')">\\u25B6 Try it live</button>
      <div class="response-block" style="display:none"></div>
    </div>
  </div>
</div>

<script>
function toggle(el) { el.classList.toggle('open'); }

async function tryEndpoint(btn, method, path, body) {
  const responseBlock = btn.parentElement.querySelector('.response-block');
  btn.disabled = true;
  btn.textContent = 'Loading...';
  responseBlock.style.display = 'block';
  responseBlock.textContent = 'Sending request...';

  try {
    const opts = { method, headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = body;
    }
    const res = await fetch(path, opts);
    const data = await res.json();
    responseBlock.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    responseBlock.textContent = 'Error: ' + err.message;
  }

  btn.disabled = false;
  btn.textContent = '\\u25B6 Try it live';
}
</script>
</body>
</html>`
