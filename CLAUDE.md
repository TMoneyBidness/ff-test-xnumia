# Xnumia — ff-test Worker

## What This Is
Stablecoin AR/AP orchestration platform with an agentic operations backend on Cloudflare Workers.

## Stack
- **Runtime**: Cloudflare Workers + Hono router
- **State**: Durable Objects (transaction state machines), D1 (structured data)
- **Storage**: R2 (documents, compliance artifacts)
- **Async**: Queues (task fan-out) with DLQ for poison messages
- **Orchestration**: Workflows v2 (durable multi-step agent flows)

## Key Commands
```bash
npm run dev          # local dev server
npm run deploy:dev   # deploy to dev environment
npm run db:migrate   # apply D1 migrations
```

## Architecture Rules
1. **Port/Adapter pattern** — never call an external system directly. Always go through a port interface in `src/adapters/ports.ts`. Implementations are swapped per environment.
2. **Every agent action writes to `agent_decisions`** — no silent autonomous decisions. This is a compliance requirement, not a nice-to-have.
3. **Single codebase, env-switched** — `ENVIRONMENT` var controls production vs sandbox behavior. Do not create separate codepaths for environments.
4. **PSP is Phase-1-only** — the PSP adapter will be removed when the MSB license is issued. Design everything so PSP removal is a config change.

## Project Structure
```
src/
  index.ts              — Hono app entry point + Worker exports
  router/               — HTTP route handlers
  durable-objects/      — Durable Object classes
  workflows/            — Workflows v2 classes
  agents/               — Agent workload implementations (5 workloads)
  adapters/             — Port interfaces + adapter implementations
    ports.ts            — TypeScript interfaces for all external systems
    bank/               — Bank adapter implementations
    psp/                — PSP adapter implementations (Phase 1)
    exchange/           — Crypto exchange adapter implementations
    accounting/         — Accounting software adapter implementations
  queue/                — Queue consumer
  lib/                  — Shared types, errors, utilities
sql/                    — D1 migration files
Context/                — Architecture docs, ADRs, schema plans
```

## D1 Database
- **Name**: ff-test-control-db
- **ID**: cd4d2bdf-cbe0-4ea8-a48c-6c76f96865c1
- **Tables**: transactions, ledger_entries, agent_decisions, audit_log

## Bindings (wrangler.toml)
- `DB` → D1
- `DOCUMENTS` → R2
- `TASK_QUEUE` → Queue
- `DLQ` → Dead letter queue
- `ORCHESTRATOR` → Durable Object namespace
- `ENGAGEMENT_WORKFLOW` → Workflows v2
