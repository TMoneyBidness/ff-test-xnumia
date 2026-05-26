# Xnumia Infrastructure Demo

This is the simple version of how to explain and demonstrate the infrastructure.

Xnumia is an agent-run payments operations platform. A payment request comes in, the system stores it, a set of agents reviews it, every agent writes down its reasoning, and humans only step in when something needs review.

The point of the demo is to show that this is not just a slide. There is a working Worker, live routes, a D1 database, agent decisions, dashboard views, and a transaction orchestrator.

---

## 1. What Is Running

The current system runs on Cloudflare:

| Part | What it does |
|------|--------------|
| Worker | Receives API calls and serves the demo pages |
| Hono routes | Organize the HTTP endpoints |
| D1 | Stores payment requests, transactions, agent decisions, ledger entries, and audit logs |
| Agent pipeline | Reviews each payment request |
| Dashboard | Shows requests, decisions, and human review actions |
| Durable Object | Holds per-transaction state for the transaction orchestrator |
| Queue | Handles async work like advancing a transaction |
| Workflow | Handles longer-running processes with approval gates |
| R2 | Reserved for documents, receipts, reports, and compliance artifacts |

The current demo has two important flows:

1. **Payment request demo flow**
   - Uses `/mcp/submit-payment`
   - Runs the five demo agents
   - Writes to `payment_requests` and `agent_decisions`
   - Powers the dashboard and API explorer

2. **Transaction orchestrator flow**
   - Uses `/transactions`
   - Writes to `transactions`
   - Hands the transaction to a Durable Object state machine
   - Shows the direction for production transaction orchestration

---

## 2. Open The Live Pages

Use these pages to show the system visually:

| Page | What to show |
|------|--------------|
| `/` | Plain-English overview of Xnumia |
| `/flowchart` | Visual agent pipeline demo |
| `/agents` | What each agent checks |
| `/api-explorer` | API examples and live test buttons |
| `/dashboard` | Requests, decisions, approvals, and rejections |
| `/system-health` | Worker, D1, R2, Queue, Durable Object, and Workflow bindings |

Simple demo script:

> "This is the Xnumia control plane. A request enters through a Worker route, gets stored in D1, passes through agents, records every decision, and only escalates to a human when needed."

---

## 3. Submit A Payment Request

The easiest demo starts with the MCP payment endpoint.

```bash
curl -X POST https://ff-test.taylorerwin.workers.dev/mcp/submit-payment \
  -H 'Content-Type: application/json' \
  -d '{
    "clientId": "acme-001",
    "clientName": "Acme Corp",
    "amountCents": 500000,
    "currencyFrom": "CAD",
    "currencyTo": "USDC",
    "description": "Invoice Q2"
  }'
```

What happens:

1. The Worker receives the request.
2. The route creates a row in `payment_requests`.
3. The agent pipeline runs.
4. Each agent writes a row to `agent_decisions`.
5. The request becomes `APPROVED`, `ESCALATED`, or `REJECTED`.
6. The dashboard can show the result.

In plain English:

> "This proves the system can accept a payment request, evaluate it automatically, and leave an audit trail."

---

## 4. How The Agents Evaluate It

The current demo pipeline has five agents:

| Agent | What it checks |
|-------|----------------|
| Intake | Required fields, amount, currencies, description |
| Compliance | Sanctions list and KYC status |
| FX | Currency pair, conversion rate, spread |
| Risk | Amount, new counterparty, destination currency, missing description |
| Recon | Possible duplicate requests in D1 |

The result is simple:

| Verdict | Meaning |
|---------|---------|
| Green | Continue |
| Amber | Escalate for human review |
| Red | Reject or block |

The orchestrator rule is:

| Agent result | Final result |
|--------------|--------------|
| All green | Auto-approved |
| Any amber | Escalated |
| Any red | Rejected |

---

## 5. Show The Decision Trail

After submitting a payment, copy the returned `requestId` and check its status:

```bash
curl https://ff-test.taylorerwin.workers.dev/mcp/pipeline-status/REQUEST_ID
```

This returns:

- The payment request
- Every agent decision
- Each agent's verdict
- The reasoning behind the verdict
- The detail JSON used by that agent

You can also show recent decisions:

```bash
curl https://ff-test.taylorerwin.workers.dev/mcp/activity
```

Simple explanation:

> "Every autonomous decision is explainable. The system does not just say approved or rejected. It shows which agent made which call and why."

---

## 6. Show Human Review

If a payment is escalated, open:

```text
/dashboard
```

The dashboard shows the request and allows a human to approve or reject it.

The API versions are:

```bash
curl -X POST https://ff-test.taylorerwin.workers.dev/mcp/approve/REQUEST_ID \
  -H 'Content-Type: application/json' \
  -d '{
    "approvedBy": "demo-user",
    "reason": "Reviewed and approved"
  }'
```

```bash
curl -X POST https://ff-test.taylorerwin.workers.dev/mcp/reject/REQUEST_ID \
  -H 'Content-Type: application/json' \
  -d '{
    "rejectedBy": "demo-user",
    "reason": "Rejected after review"
  }'
```

Simple explanation:

> "Humans are not the operators of every payment. They are exception reviewers. The agents handle clean work automatically."

---

## 7. Show The Transaction Orchestrator

The payment request demo shows the agent pipeline. The transaction route shows the deeper orchestration direction.

```bash
curl -X POST https://ff-test.taylorerwin.workers.dev/transactions \
  -H 'Content-Type: application/json' \
  -d '{
    "clientId": "acme-001",
    "type": "AR",
    "amountCents": 500000,
    "currencyFrom": "CAD",
    "currencyTo": "USDC"
  }'
```

What happens:

1. The Worker receives the transaction.
2. D1 stores a row in `transactions`.
3. The Worker creates or finds a Durable Object for that transaction ID.
4. The Durable Object stores the transaction state.
5. The transaction starts as `INITIATED`.

The Durable Object state path is:

```text
INITIATED -> PENDING_PSP -> PENDING_SETTLEMENT -> SETTLED -> RECONCILED
```

Simple explanation:

> "This is the production-shaped transaction state machine. Each transaction can have its own isolated coordinator."

---

## 8. Show System Health

Open:

```text
/system-health
```

This page shows the infrastructure bindings:

- Worker online
- D1 connected
- R2 bound
- Queue bound
- Durable Object bound
- Workflow bound

Simple explanation:

> "This proves the Cloudflare infrastructure pieces are connected. The app is not only a mockup; it is wired to real platform primitives."

---

## 9. Simple Architecture Flow

```text
User or API client
    |
    v
Cloudflare Worker route
    |
    v
D1 database record
    |
    v
Agent pipeline
    |
    v
Agent decisions written to D1
    |
    +--> Approved automatically
    |
    +--> Escalated to dashboard for human review
    |
    +--> Rejected or blocked

Production transaction path:

Transaction API
    |
    v
D1 transactions table
    |
    v
Durable Object transaction state machine
    |
    v
Queues and Workflows for async or long-running steps
```

---

## 10. What Is Live Today vs. Direction

Live today:

- Worker routes
- Demo pages
- D1 schema
- Payment request pipeline
- Agent decision logging
- Dashboard review flow
- Durable Object transaction state machine
- Queue consumer
- Workflow class
- Mock adapter interfaces for bank, PSP, exchange, and accounting systems

Production direction:

- Real bank integration
- Real PSP integration during Phase 1
- Real exchange integration
- Real accounting integration
- Real sanctions/KYC sources
- Settlement and reconciliation over live rails
- R2 document storage for receipts, reports, and compliance artifacts
- Phase 2 removal of PSP after licensing

Simple close:

> "The demo shows the skeleton of the operating system: request intake, agent judgment, audit trail, human exception review, and transaction orchestration. The next step is replacing mocks and demo rules with live rail integrations and production controls."
