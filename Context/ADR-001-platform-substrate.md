# ADR-001: Use Cloudflare Workers as Platform Substrate

**Status:** Accepted

**Date:** 2026-05-24

**Decision makers:** Taylor Erwin (AI Architecture Lead), Marko (Founder/CEO)

---

## Context

Xnumia needs a serverless platform to host a fintech orchestration layer with the following requirements:

- **Durable state machines** for transaction lifecycle management (pending -> confirmed -> settled -> reconciled)
- **Async processing** for agent workloads (settlement, reconciliation, fraud, AML, payments ops)
- **Relational storage** for transactions, ledger entries, agent decisions, and audit logs
- **Document/blob storage** for receipts, compliance artifacts, and reports
- **Multi-step workflows** that survive failures and restarts
- **Two environments** (production + QA/sandbox) from one codebase
- **Edge-native performance** for API endpoints serving FI clients globally

Team constraint: 1 AI architect at ~10 hrs/week. The platform choice must minimize operational overhead and infrastructure management. There is no dedicated DevOps capacity.

The architecture requires Durable Objects (or equivalent) for per-transaction state machines that maintain in-memory consistency during multi-step settlement and reconciliation flows.

---

## Decision

Use **Cloudflare Workers** as the platform substrate, with the full Cloudflare developer platform:

| Service | Role |
|---------|------|
| **Workers** | Compute — API endpoints, agent entry points, request routing |
| **Durable Objects** | Durable state — transaction state machines, per-object isolation |
| **D1** | Relational storage — SQLite-based, serverless SQL |
| **R2** | Object storage — documents, receipts, compliance artifacts |
| **Queues** | Async messaging — agent task dispatch, event fan-out |
| **Workflows v2** | Durable multi-step workflows — settlement flows, recon cycles |

Environment separation is handled via `wrangler.toml` env bindings. One codebase deploys to both `dev` (QA/sandbox) and `production` environments.

---

## Alternatives Considered

### AWS Lambda + DynamoDB + SQS

- **Pros:** Mature ecosystem, extensive fintech precedent, large talent pool, full IAM/compliance story.
- **Cons:** Significantly higher operational complexity for a 1-person team. No equivalent to Durable Objects — would require Step Functions + DynamoDB streams to approximate transaction state machines. Multi-service wiring (API Gateway + Lambda + DynamoDB + SQS + S3 + Step Functions) adds configuration surface area that is disproportionate to team size. Cold start latency is higher. Cost is higher at low volume due to per-service minimums.
- **Verdict:** Right choice for a 5+ person team. Wrong choice for 1 architect at 10 hrs/week.

### Railway + Supabase

- **Pros:** Developer-friendly, Postgres-based (Supabase), easy deploys.
- **Cons:** No durable state machine primitive. Would require building transaction state management on top of Postgres + background workers, losing the per-object isolation that Durable Objects provide. Railway is a container platform, not a serverless edge platform — operational model is different. Supabase is Postgres, which is more capable than D1 but introduces connection management overhead in serverless contexts.
- **Verdict:** Good for CRUD apps. Missing the primitives that make agent-driven transaction orchestration natural.

### Vercel Edge Functions

- **Pros:** Excellent DX, built-in preview environments, strong Next.js integration.
- **Cons:** No Durable Objects equivalent. No native queue system. No native SQL database (would need external DB). Edge Functions are stateless — would require external state management for transaction lifecycles. Primarily optimized for frontend/fullstack web apps, not backend orchestration workloads.
- **Verdict:** Wrong abstraction level. Vercel is a frontend deployment platform with edge compute, not a backend orchestration substrate.

---

## Consequences

### Positive

- **Single vendor.** Compute, storage, queues, workflows, and durable state all from one provider. No multi-service wiring. One dashboard, one billing account, one deployment tool (`wrangler`).
- **Durable Objects for state machines.** Per-transaction isolation with in-memory consistency is exactly the primitive needed for settlement and reconciliation workflows. No need to build state machine infrastructure from scratch.
- **Edge-native.** API endpoints run at the edge with sub-10ms cold starts. FI clients in different regions get low-latency responses without multi-region deployment complexity.
- **Cost-effective at low volume.** Workers free tier covers early development. D1, R2, and Queues have generous free tiers. Cost scales linearly with usage rather than requiring upfront provisioning.
- **Environment parity.** `wrangler.toml` env bindings make production/QA separation a config concern, not an infrastructure concern.
- **Workflows v2 for durable execution.** Multi-step settlement and reconciliation flows survive Worker restarts and failures without custom retry/checkpoint logic.

### Negative

- **Newer platform.** Cloudflare's developer platform is less battle-tested in fintech than AWS. Fewer reference architectures, fewer Stack Overflow answers, fewer consultants who know it.
- **Smaller ecosystem.** Fewer third-party integrations, fewer ORMs, fewer monitoring tools compared to AWS/GCP.
- **D1 limitations.** SQLite-based, so no stored procedures, no row-level security, limited concurrent write throughput. 10GB max database size per D1 database. May require sharding strategy at scale.
- **Vendor lock-in.** Durable Objects have no equivalent on other platforms. If we leave Cloudflare, the state machine layer must be rewritten. This is the deepest lock-in point.
- **Worker runtime constraints.** 128MB memory limit per Worker invocation. No native file system access. CPU time limits (30s on paid plan for Workflows, 50ms for standard Workers). Some npm packages that rely on Node.js APIs are incompatible.

---

## Exit Criteria

Re-evaluate this decision if any of the following occur:

1. **D1 hits a hard scaling wall.** If transaction volume exceeds D1's write throughput or the 10GB database limit before the platform can justify the migration cost to Postgres/PlanetScale.
2. **Durable Object memory limits block agent workloads.** If agent state machines require more than 128MB of in-memory state per object, the DO model breaks down.
3. **Missing auth/identity primitives.** If Cloudflare Access + Zero Trust cannot satisfy FI-grade authentication requirements (e.g., SAML/OIDC federation with bank identity providers) and no viable workaround exists.
4. **Compliance certification gaps.** If an FI client requires SOC 2 Type II or PCI DSS attestation that Cloudflare cannot provide for the specific services we use.
5. **Workflows v2 reliability issues.** If durable execution proves unreliable for financial workflows (missed steps, lost state) in production.
6. **Cost inversion.** If at scale, Cloudflare pricing exceeds AWS-equivalent pricing by more than 2x for the same workload profile.

If re-evaluation is triggered, the most likely migration target is **AWS Lambda + Step Functions + DynamoDB**, accepting the higher operational complexity in exchange for ecosystem maturity.
