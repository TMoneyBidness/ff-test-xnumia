# What We Are Building — Xnumia Developer Onboarding

## The One-Liner

Xnumia is an **agent-run stablecoin AR/AP orchestration platform**. It sits between banks, crypto exchanges, PSPs, and accounting software, and uses autonomous agents — not humans — to run settlement, reconciliation, fraud detection, AML compliance, and payments operations.

The thing being built is not a stablecoin platform with AI bolted on. It is an agent-run payments operations company that settles in stablecoin.

---

## Two Environments, One Codebase

| Environment | Purpose | Money | Who uses it |
|-------------|---------|-------|-------------|
| **Production** | Live AR/AP processing | Real funds, real rails | Tier 3 production clients |
| **QA / Sandbox** | FI exploration and testing | Real integrations, no real funds | Tier 1 and Tier 2 FI buyers |

Both environments deploy from the same codebase. Environment switching is config-driven (`wrangler.toml` env bindings), never a code fork.

---

## Three Client Tiers

| Tier | Posture | What they get |
|------|---------|---------------|
| **Tier 1 — Curious FI** | "Explain stablecoins to me" | Playbook + sandbox access in QA |
| **Tier 2 — Exploring FI** | Evaluating orchestration middleware | QA environment with configurable modules |
| **Tier 3 — Production client** | Ready to move real money | Full production stack, live rails |

Tier 1 enters through consulting/FI distribution channels. Tier 2 graduates from Tier 1. Tier 3 is direct.

---

## Five Agent Workloads

These are the autonomous agents that replace human ops staff:

1. **Settlement** — Confirm finality across rails, close the loop between bank and exchange ledgers, mark transactions complete in accounting.
2. **Reconciliation** — Match ledger entries across bank, exchange, PSP, and accounting software. Flag and resolve mismatches.
3. **Fraud Detection** — Flag anomalous transactions in-flight, hold suspect movements, escalate.
4. **AML Compliance** — Sanctions screening, transaction monitoring, suspicious activity detection, regulatory reporting prep.
5. **Payments Ops** — Exceptions, retries, customer-service-tier resolution for downstream clients.

All five run in both environments and across both regulatory phases.

---

## The Port/Adapter Pattern (PSP Swappability)

The platform operates in two regulatory phases:

- **Phase 1 (now):** All fund movement goes through a Payment Service Provider (PSP). Xnumia cannot legally custody or move funds pre-MSB-license.
- **Phase 2 (post-license):** PSP is removed. Xnumia connects directly to bank and exchange rails, capturing the margin.

The PSP sits behind an adapter interface. Phase 1 -> Phase 2 is a configuration change (swap the adapter), not a re-platform. Every integration point (bank, exchange, PSP, accounting) uses this port/adapter pattern so rails are always swappable.

---

## The Cloudflare Stack

| Service | Role |
|---------|------|
| **Workers** | Request handling, API endpoints, agent entry points |
| **Durable Objects** | Transaction state machines, per-transaction isolation, in-memory consistency |
| **D1** | SQLite-based relational storage — transactions, ledger entries, agent decisions, audit log |
| **R2** | Document/blob storage — receipts, compliance documents, report artifacts |
| **Queues** | Async processing — agent task dispatch, event fan-out |
| **Workflows v2** | Multi-step durable workflows — settlement flows, reconciliation cycles |

---

## How to Deploy

```bash
# Dev/sandbox environment
npx wrangler deploy --env dev

# Production environment
npx wrangler deploy --env production
```

---

## Key Architectural Rules

1. **Every agent action writes to `agent_decisions`.** No silent decisions. Every judgment call an agent makes is logged with reasoning, confidence, and outcome.
2. **PSP is swappable.** The PSP adapter can be replaced with a direct-rail adapter without touching agent logic or business rules.
3. **Single codebase, env-switched.** Production and QA are the same code. Environment differences live in `wrangler.toml` bindings and environment variables, never in code branches.
4. **Humans review exceptions only.** Agents handle the happy path and known resolution patterns autonomously. Humans are escalation targets, not operators.
5. **Audit everything.** Every transaction state change, every ledger mutation, every agent decision — written to `audit_log` with timestamps and actor identity.
