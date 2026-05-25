import { Hono } from 'hono'
import type { Env } from '../lib/env'

const flowchart = new Hono<{ Bindings: Env }>()

flowchart.get('/flowchart', (c) => {
  return c.html(FLOWCHART_HTML)
})

export { flowchart }

const FLOWCHART_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Xnumia — Pipeline Architecture</title>
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
    font-size: 16px; color: #94a3b8; max-width: 600px; margin: 0 auto 8px;
    line-height: 1.6;
  }
  .hero .subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; color: #6366f1;
  }

  /* ── Canvas Container ────────────────────── */
  .canvas-wrap {
    position: relative;
    width: 100%; max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
  }
  canvas {
    width: 100%;
    border-radius: 16px;
    background: radial-gradient(ellipse at center, #111827 0%, #0a0e1a 70%);
  }

  /* ── Controls ────────────────────────────── */
  .controls {
    display: flex; justify-content: center; gap: 12px;
    padding: 24px 32px;
  }
  .btn {
    padding: 10px 24px;
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.1);
    color: #c7d2fe;
    font-family: 'Inter', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn:hover {
    background: rgba(99, 102, 241, 0.25);
    border-color: #6366f1;
    color: #e2e8f0;
  }
  .btn.active {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
  }
  .btn.green { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.1); color: #86efac; }
  .btn.green:hover { background: rgba(34,197,94,0.25); }
  .btn.amber { border-color: rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #fcd34d; }
  .btn.amber:hover { background: rgba(245,158,11,0.25); }
  .btn.red { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.1); color: #fca5a5; }
  .btn.red:hover { background: rgba(239,68,68,0.25); }

  /* ── Legend ───────────────────────────────── */
  .legend {
    display: flex; justify-content: center; gap: 32px;
    padding: 16px; font-size: 13px; color: #94a3b8;
  }
  .legend-item { display: flex; align-items: center; gap: 8px; }
  .legend-dot {
    width: 12px; height: 12px; border-radius: 50%;
  }
  .legend-dot.green { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.5); }
  .legend-dot.amber { background: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.5); }
  .legend-dot.red { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); }
  .legend-dot.blue { background: #6366f1; box-shadow: 0 0 8px rgba(99,102,241,0.5); }

  /* ── Info Cards ──────────────────────────── */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
    max-width: 1200px;
    margin: 40px auto;
    padding: 0 32px;
  }
  .info-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 12px;
    padding: 24px;
  }
  .info-card h3 {
    font-size: 15px; font-weight: 700; color: #c7d2fe;
    margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .info-card p {
    font-size: 13px; color: #94a3b8; line-height: 1.7;
  }
  .info-card code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; color: #818cf8;
    background: rgba(99, 102, 241, 0.1);
    padding: 2px 6px; border-radius: 4px;
  }
  .agent-icon {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
  }

  /* ── Footer ──────────────────────────────── */
  .footer {
    text-align: center; padding: 48px 32px;
    font-size: 12px; color: #475569;
    border-top: 1px solid rgba(99, 102, 241, 0.08);
    margin-top: 48px;
  }
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-brand">XNUMIA</div>
  <div class="nav-links">
    <a href="/">Overview</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/flowchart" class="active">Architecture</a>
    <a href="/agents">Agents</a>
    <a href="/api-explorer">API</a>
    <a href="/system-health">Health</a>
  </div>
</nav>

<section class="hero">
  <h1>Payment Pipeline Architecture</h1>
  <p>Five autonomous agents evaluate every payment request in sequence. Each agent adds its assessment. The orchestrator collects all verdicts and decides: approve, escalate, or reject.</p>
  <div class="subtitle">Cloudflare Workers &bull; Durable Objects &bull; D1 &bull; Queues</div>
</section>

<div class="controls">
  <button class="btn green" onclick="runScenario('clean')">&#9654; Clean Payment</button>
  <button class="btn amber" onclick="runScenario('risky')">&#9654; Risky Payment</button>
  <button class="btn red" onclick="runScenario('sanctioned')">&#9654; Sanctioned Entity</button>
  <button class="btn" onclick="runScenario('duplicate')">&#9654; Duplicate Check</button>
</div>

<div class="legend">
  <div class="legend-item"><div class="legend-dot green"></div> Pass (Green)</div>
  <div class="legend-item"><div class="legend-dot amber"></div> Warning (Amber)</div>
  <div class="legend-item"><div class="legend-dot red"></div> Blocked (Red)</div>
  <div class="legend-item"><div class="legend-dot blue"></div> Processing</div>
</div>

<div class="canvas-wrap">
  <canvas id="pipeline"></canvas>
</div>

<div class="info-grid">
  <div class="info-card">
    <h3><span class="agent-icon" style="background:rgba(99,102,241,0.2)">&#128203;</span> Intake Agent</h3>
    <p>Validates all fields: client ID, name, amount &gt; 0, valid currencies (<code>CAD</code> <code>USD</code> <code>EUR</code> <code>GBP</code> &rarr; <code>USDC</code> <code>USDT</code>), and ensures from &ne; to. Flags missing descriptions as amber.</p>
  </div>
  <div class="info-card">
    <h3><span class="agent-icon" style="background:rgba(239,68,68,0.2)">&#128737;</span> Compliance Agent</h3>
    <p>Screens client name against sanctions list (OFAC, blocked entities). Checks KYC status. <strong>Red = instant reject, pipeline short-circuits.</strong> No further agents run.</p>
  </div>
  <div class="info-card">
    <h3><span class="agent-icon" style="background:rgba(245,158,11,0.2)">&#128177;</span> FX Agent</h3>
    <p>Looks up exchange rate for the currency pair, calculates conversion output, and evaluates spread. Transactions &lt; $50k get 0.5% spread (amber). Transactions &ge; $50k get 0.1% (green).</p>
  </div>
  <div class="info-card">
    <h3><span class="agent-icon" style="background:rgba(251,146,60,0.2)">&#9888;</span> Risk Agent</h3>
    <p>Scores 0&ndash;100 from additive factors: amount thresholds (+15/+25), first-time counterparty (+20), high-risk stablecoin (+10), missing description (+15). Score &gt;75 = red, 50&ndash;75 = amber.</p>
  </div>
  <div class="info-card">
    <h3><span class="agent-icon" style="background:rgba(34,197,94,0.2)">&#128202;</span> Recon Agent</h3>
    <p>Queries D1 for matching requests: same client + same amount within 24 hours. Flags possible duplicates (amber) or confirmed duplicates (red). Prevents double-processing.</p>
  </div>
  <div class="info-card">
    <h3><span class="agent-icon" style="background:rgba(99,102,241,0.2)">&#127919;</span> Orchestrator</h3>
    <p>Collects all 5 agent verdicts. <strong>All green &rarr; auto-approve.</strong> Any amber &rarr; escalate to human. Any red &rarr; auto-reject. Every decision is logged to <code>agent_decisions</code> in D1.</p>
  </div>
</div>

<footer class="footer">
  Xnumia &mdash; Agent-run stablecoin orchestration &bull; Built on Cloudflare Workers
</footer>

<script>
const canvas = document.getElementById('pipeline');
const ctx = canvas.getContext('2d');
const DPR = window.devicePixelRatio || 1;

let W, H;
function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  W = rect.width;
  H = 520;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
resize();
window.addEventListener('resize', resize);

// ── Colors ──────────────────────────────────
const C = {
  green: '#22c55e', greenGlow: 'rgba(34,197,94,0.35)',
  amber: '#f59e0b', amberGlow: 'rgba(245,158,11,0.35)',
  red:   '#ef4444', redGlow:   'rgba(239,68,68,0.35)',
  blue:  '#6366f1', blueGlow:  'rgba(99,102,241,0.3)',
  gray:  '#334155', grayGlow:  'rgba(51,65,85,0.2)',
  bg:    '#111827', card: '#1e293b',
  text:  '#e2e8f0', dim: '#64748b',
};

// ── Node Layout ─────────────────────────────
const AGENTS = [
  { id: 'intake',     label: 'Intake',     icon: '\\u{1F4CB}', desc: 'Validate' },
  { id: 'compliance', label: 'Compliance', icon: '\\u{1F6E1}', desc: 'Sanctions & KYC' },
  { id: 'fx',         label: 'FX',         icon: '\\u{1F4B1}', desc: 'Rate & Convert' },
  { id: 'risk',       label: 'Risk',       icon: '\\u26A0',    desc: 'Score 0-100' },
  { id: 'recon',      label: 'Recon',      icon: '\\u{1F4CA}', desc: 'Dedup Check' },
];

function getLayout() {
  const cx = W / 2;
  const startY = 80, agentY = 230, endY = 430;
  const agentSpacing = Math.min(160, (W - 120) / 5);
  const startX = cx - (agentSpacing * 2);

  const nodes = {
    input: { x: cx, y: startY, r: 32, label: 'Payment Request', type: 'input' },
  };
  AGENTS.forEach((a, i) => {
    nodes[a.id] = { x: startX + i * agentSpacing, y: agentY, r: 30, ...a, type: 'agent' };
  });
  nodes.orchestrator = { x: cx, y: 340, r: 28, label: 'Orchestrator', icon: '\\u{1F3AF}', type: 'orchestrator' };
  nodes.approve = { x: cx - 160, y: endY, r: 24, label: 'Auto-Approve', type: 'outcome', color: 'green' };
  nodes.escalate = { x: cx, y: endY, r: 24, label: 'Escalate', type: 'outcome', color: 'amber' };
  nodes.reject = { x: cx + 160, y: endY, r: 24, label: 'Auto-Reject', type: 'outcome', color: 'red' };

  return nodes;
}

// ── State ───────────────────────────────────
let nodes = getLayout();
let agentVerdicts = {};   // { intake: 'green', ... }
let particles = [];
let activeOutcome = null; // 'approve' | 'escalate' | 'reject'
let animPhase = 'idle';   // 'idle' | 'input' | 'agents' | 'orchestrator' | 'outcome'
let animStep = 0;
let animTimer = 0;
let scenarioVerdicts = {};
let scenarioLabel = '';
let hoveredNode = null;

// ── Scenarios ───────────────────────────────
const SCENARIOS = {
  clean: {
    label: '$5,000 CAD \\u2192 USDC — Acme Corp',
    verdicts: { intake: 'green', compliance: 'green', fx: 'green', risk: 'green', recon: 'green' },
    outcome: 'approve',
  },
  risky: {
    label: '$15,000 CAD \\u2192 USDC — NEW_Startup Inc (no description)',
    verdicts: { intake: 'amber', compliance: 'green', fx: 'amber', risk: 'amber', recon: 'green' },
    outcome: 'escalate',
  },
  sanctioned: {
    label: '$10,000 USD \\u2192 USDC — SANCTIONED_CORP',
    verdicts: { intake: 'green', compliance: 'red' },
    outcome: 'reject',
  },
  duplicate: {
    label: '$5,000 CAD \\u2192 USDC — Acme Corp (duplicate)',
    verdicts: { intake: 'green', compliance: 'green', fx: 'green', risk: 'green', recon: 'amber' },
    outcome: 'escalate',
  },
};

function runScenario(key) {
  const s = SCENARIOS[key];
  scenarioVerdicts = { ...s.verdicts };
  scenarioLabel = s.label;
  activeOutcome = s.outcome;
  agentVerdicts = {};
  particles = [];
  animPhase = 'input';
  animStep = 0;
  animTimer = 0;
}

// ── Particles ───────────────────────────────
function spawnParticle(fromNode, toNode, color, count) {
  for (let i = 0; i < (count || 8); i++) {
    particles.push({
      x: fromNode.x, y: fromNode.y,
      tx: toNode.x, ty: toNode.y,
      progress: -i * 0.06,
      speed: 0.012 + Math.random() * 0.008,
      color: color,
      size: 2 + Math.random() * 2,
      trail: [],
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.progress += p.speed;
    if (p.progress >= 0 && p.progress <= 1) {
      const t = p.progress;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      p.x = p.x + (p.tx - p.x) * 0.05;
      p.y = p.y + (p.ty - p.y) * 0.05;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 12) p.trail.shift();
    }
    if (p.progress > 1.3) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    if (p.progress < 0 || p.progress > 1) continue;
    // Trail
    for (let i = 0; i < p.trail.length; i++) {
      const alpha = (i / p.trail.length) * 0.5;
      ctx.beginPath();
      ctx.arc(p.trail[i].x, p.trail[i].y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', ',' + alpha + ')').replace('rgb', 'rgba');
      ctx.fill();
    }
    // Head
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size + 4, 0, Math.PI * 2);
    ctx.fillStyle = p.color.replace(')', ',0.15)').replace('rgb', 'rgba');
    ctx.fill();
  }
}

// ── Drawing Helpers ─────────────────────────
function drawConnection(from, to, color, dashed) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y + from.r);
  ctx.lineTo(to.x, to.y - to.r);
  ctx.strokeStyle = color || 'rgba(99,102,241,0.15)';
  ctx.lineWidth = dashed ? 1 : 1.5;
  if (dashed) ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawNode(node, verdict) {
  const { x, y, r } = node;
  let color = C.gray, glow = C.grayGlow;

  if (verdict === 'green') { color = C.green; glow = C.greenGlow; }
  else if (verdict === 'amber') { color = C.amber; glow = C.amberGlow; }
  else if (verdict === 'red') { color = C.red; glow = C.redGlow; }
  else if (verdict === 'active') { color = C.blue; glow = C.blueGlow; }

  if (node.type === 'outcome') {
    color = C[node.color]; glow = C[node.color + 'Glow'];
    const isActive = activeOutcome === node.label.toLowerCase().replace('auto-', '');
    if (!isActive && animPhase === 'outcome') {
      color = C.gray; glow = C.grayGlow;
    }
  }

  // Glow
  if (verdict || node.type === 'input' || (node.type === 'outcome' && animPhase === 'outcome')) {
    ctx.beginPath();
    ctx.arc(x, y, r + 12, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = C.card;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.fill();
  ctx.stroke();

  // Icon
  if (node.icon) {
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(node.icon, x, y);
  } else if (node.type === 'input') {
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('\\u{1F4E8}', x, y);
  }

  // Label below
  ctx.font = '600 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = C.text;
  ctx.fillText(node.label, x, y + r + 8);

  // Desc below label
  if (node.desc) {
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = C.dim;
    ctx.fillText(node.desc, x, y + r + 24);
  }

  // Verdict badge
  if (verdict && verdict !== 'active') {
    const badge = verdict.toUpperCase();
    ctx.font = '600 9px JetBrains Mono, monospace';
    const bw = ctx.measureText(badge).width + 10;
    const bx = x - bw / 2, by = y - r - 16;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 16, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, x, by + 8);
  }
}

// ── Animation Loop ──────────────────────────
let lastTime = 0;
const STEP_DELAY = 600; // ms per agent

function animate(ts) {
  const dt = ts - lastTime;
  lastTime = ts;

  nodes = getLayout();
  ctx.clearRect(0, 0, W, H);

  // ── Draw grid dots ──────────────────────
  ctx.fillStyle = 'rgba(99,102,241,0.04)';
  for (let gx = 0; gx < W; gx += 30) {
    for (let gy = 0; gy < H; gy += 30) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Draw connections ────────────────────
  const agentKeys = AGENTS.map(a => a.id);
  // Input → agents
  agentKeys.forEach(k => {
    const v = agentVerdicts[k];
    const col = v === 'green' ? 'rgba(34,197,94,0.25)' :
                v === 'amber' ? 'rgba(245,158,11,0.25)' :
                v === 'red' ? 'rgba(239,68,68,0.25)' :
                'rgba(99,102,241,0.1)';
    drawConnection(nodes.input, nodes[k], col);
  });
  // Agents → orchestrator
  agentKeys.forEach(k => {
    if (agentVerdicts[k]) drawConnection(nodes[k], nodes.orchestrator, 'rgba(99,102,241,0.2)');
  });
  // Orchestrator → outcomes
  drawConnection(nodes.orchestrator, nodes.approve, 'rgba(34,197,94,0.1)', true);
  drawConnection(nodes.orchestrator, nodes.escalate, 'rgba(245,158,11,0.1)', true);
  drawConnection(nodes.orchestrator, nodes.reject, 'rgba(239,68,68,0.1)', true);

  // ── Animation state machine ─────────────
  if (animPhase === 'input') {
    animTimer += dt;
    if (animTimer > 400) {
      animPhase = 'agents';
      animStep = 0;
      animTimer = 0;
      // Spawn particles from input to first agent
      const firstKey = agentKeys[0];
      spawnParticle(nodes.input, nodes[firstKey], C.blue, 6);
    }
  }

  if (animPhase === 'agents') {
    animTimer += dt;
    if (animTimer > STEP_DELAY && animStep < agentKeys.length) {
      const key = agentKeys[animStep];
      const verdict = scenarioVerdicts[key];
      if (verdict) {
        agentVerdicts[key] = verdict;
        // Spawn to orchestrator
        const vColor = verdict === 'green' ? C.green : verdict === 'amber' ? C.amber : C.red;
        spawnParticle(nodes[key], nodes.orchestrator, vColor, 5);

        if (verdict === 'red') {
          // Short circuit
          animStep = agentKeys.length; // skip remaining
          setTimeout(() => {
            animPhase = 'orchestrator';
            animTimer = 0;
          }, 500);
        } else {
          animStep++;
          animTimer = 0;
          // Spawn to next agent
          if (animStep < agentKeys.length) {
            spawnParticle(nodes[agentKeys[animStep - 1]], nodes[agentKeys[animStep]], C.blue, 4);
          }
        }
      } else {
        // No verdict for this agent (short-circuited)
        animStep = agentKeys.length;
      }
    }

    if (animStep >= agentKeys.length && animPhase === 'agents') {
      animPhase = 'orchestrator';
      animTimer = 0;
    }
  }

  if (animPhase === 'orchestrator') {
    animTimer += dt;
    if (animTimer > 800) {
      animPhase = 'outcome';
      const outcomeNode = nodes[activeOutcome];
      const oColor = activeOutcome === 'approve' ? C.green : activeOutcome === 'escalate' ? C.amber : C.red;
      spawnParticle(nodes.orchestrator, outcomeNode, oColor, 10);
      animTimer = 0;
    }
  }

  // ── Draw nodes ──────────────────────────
  // Input
  drawNode(nodes.input, animPhase !== 'idle' ? 'active' : null);

  // Agents
  agentKeys.forEach((k, i) => {
    const verdict = agentVerdicts[k];
    const isCurrentAgent = animPhase === 'agents' && i === animStep && !verdict;
    drawNode(nodes[k], verdict || (isCurrentAgent ? 'active' : null));
  });

  // Orchestrator
  const orchVerdict = animPhase === 'orchestrator' || animPhase === 'outcome' ? 'active' : null;
  drawNode(nodes.orchestrator, orchVerdict);

  // Outcomes
  drawNode(nodes.approve);
  drawNode(nodes.escalate);
  drawNode(nodes.reject);

  // ── Scenario label ────────────────────────
  if (scenarioLabel && animPhase !== 'idle') {
    ctx.font = '500 13px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(scenarioLabel, W / 2, 20);
  }

  if (animPhase === 'idle') {
    ctx.font = '500 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';
    ctx.fillText('\\u2191 Click a scenario above to see the pipeline in action', W / 2, 20);
  }

  // ── Particles ──────────────────────────
  updateParticles();
  drawParticles();

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Start with clean scenario auto-playing after 1s
setTimeout(() => runScenario('clean'), 800);
</script>
</body>
</html>`
