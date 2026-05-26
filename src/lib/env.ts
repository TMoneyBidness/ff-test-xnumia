/**
 * Typed bindings for the Cloudflare Worker environment.
 * Must stay in sync with wrangler.toml bindings.
 */
export interface Env {
  // ── D1 ────────────────────────────────────────
  DB: D1Database

  // ── R2 ────────────────────────────────────────
  DOCUMENTS: R2Bucket

  // ── Queues ────────────────────────────────────
  TASK_QUEUE: Queue
  DLQ: Queue

  // ── Durable Objects ───────────────────────────
  ORCHESTRATOR: DurableObjectNamespace

  // ── Workflows v2 ─────────────────────────────
  ENGAGEMENT_WORKFLOW: Workflow

  // ── Vars ──────────────────────────────────────
  ENVIRONMENT: 'production' | 'sandbox'

  // ── Secrets (optional per provider) ──────
  STRIPE_WEBHOOK_SECRET?: string
}
