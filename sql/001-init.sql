-- Xnumia D1 Schema — Initial Migration
-- Applied with: npx wrangler d1 execute ff-test-control-db --file=sql/001-init.sql
-- IMPORTANT: All money amounts stored as INTEGER in cents (e.g. $150.00 = 15000)

-- Core transaction lifecycle
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('AR', 'AP', 'conversion', 'settlement')),
  amount_cents INTEGER NOT NULL,
  currency_from TEXT NOT NULL,
  currency_to TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'INITIATED',
  environment TEXT NOT NULL CHECK (environment IN ('production', 'sandbox')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_env ON transactions(environment);

-- Payment requests — the pipeline demo flow
CREATE TABLE IF NOT EXISTS payment_requests (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency_from TEXT NOT NULL,
  currency_to TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'APPROVED', 'ESCALATED', 'REJECTED')),
  pipeline_result TEXT, -- JSON: per-agent verdicts
  escalation_reason TEXT,
  resolved_by TEXT, -- 'auto' or human user id
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pr_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_client ON payment_requests(client_id);

-- Dual-entry bookkeeping for fiat and stablecoin rails
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  rail TEXT NOT NULL CHECK (rail IN ('fiat', 'stablecoin')),
  direction TEXT NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  counterparty TEXT,
  reconciled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ledger_tx ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_unreconciled ON ledger_entries(reconciled) WHERE reconciled = 0;

-- Every agent action must be explainable and reviewable
CREATE TABLE IF NOT EXISTS agent_decisions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL, -- payment_request or transaction id
  agent_type TEXT NOT NULL CHECK (agent_type IN ('validate', 'quote', 'screen', 'execute', 'reconcile', 'intake', 'compliance', 'fx', 'risk', 'recon', 'settlement', 'reconciliation', 'fraud', 'aml', 'ops', 'orchestrator')),
  verdict TEXT NOT NULL CHECK (verdict IN ('green', 'amber', 'red')),
  action TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  detail TEXT, -- JSON: agent-specific data (scores, rates, flags)
  duration_ms INTEGER,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_request ON agent_decisions(request_id);
CREATE INDEX IF NOT EXISTS idx_agent_type ON agent_decisions(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_verdict ON agent_decisions(verdict);

-- Full audit trail for compliance
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor);
