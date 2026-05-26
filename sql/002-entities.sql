-- Xnumia D1 Schema — Entity Model Migration
-- Applied with: npx wrangler d1 execute ff-test-control-db --file=sql/002-entities.sql
-- This adds the entity model that the codebase currently lacks entirely.
-- Without these tables, KYC/AML/sanctions screening has nothing to screen against.

-- Organizations that use Xnumia (Matt's back office, downstream clients)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  operating_name TEXT,
  jurisdiction TEXT NOT NULL DEFAULT 'CA',
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  environment TEXT NOT NULL CHECK (environment IN ('production', 'sandbox')),
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'expired', 'rejected')),
  kyc_expires_at TEXT,
  risk_tier TEXT NOT NULL DEFAULT 'standard' CHECK (risk_tier IN ('low', 'standard', 'elevated', 'high')),
  stripe_customer_id TEXT,
  bridge_customer_id TEXT,
  onboarded_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_kyc ON clients(kyc_status);
CREATE INDEX IF NOT EXISTS idx_clients_tier ON clients(tier);
CREATE INDEX IF NOT EXISTS idx_clients_env ON clients(environment);

-- The other side of a transaction (a client's customer or vendor)
CREATE TABLE IF NOT EXISTS counterparties (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('individual', 'business')),
  jurisdiction TEXT,
  risk_rating TEXT DEFAULT 'standard' CHECK (risk_rating IN ('low', 'standard', 'elevated', 'high')),
  sanctions_status TEXT DEFAULT 'not_screened' CHECK (sanctions_status IN ('not_screened', 'clear', 'match', 'pending_review')),
  last_screened_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_counterparties_client ON counterparties(client_id);
CREATE INDEX IF NOT EXISTS idx_counterparties_sanctions ON counterparties(sanctions_status);

-- Ultimate Beneficial Owner records for AML
CREATE TABLE IF NOT EXISTS beneficial_owners (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  date_of_birth TEXT,
  ownership_pct INTEGER,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  verification_session_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ubo_client ON beneficial_owners(client_id);

-- Payment recipients — who receives funds
CREATE TABLE IF NOT EXISTS beneficiaries (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  counterparty_id TEXT REFERENCES counterparties(id),
  name TEXT NOT NULL,
  rail TEXT NOT NULL CHECK (rail IN ('fiat', 'stablecoin')),
  account_ref_encrypted TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_client ON beneficiaries(client_id);

-- Bank accounts and wallet addresses linked to clients/counterparties
CREATE TABLE IF NOT EXISTS external_accounts (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('client', 'counterparty', 'beneficiary')),
  owner_id TEXT NOT NULL,
  rail TEXT NOT NULL CHECK (rail IN ('fiat', 'stablecoin')),
  institution TEXT,
  account_ref_encrypted TEXT,
  provider TEXT,
  provider_account_id TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_extacct_owner ON external_accounts(owner_type, owner_id);

-- KYC/KYB verification attempts
CREATE TABLE IF NOT EXISTS verification_sessions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'counterparty', 'beneficial_owner')),
  entity_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'verified', 'failed', 'expired')),
  evidence_r2_key TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_verification_entity ON verification_sessions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_sessions(status);

-- Webhook events — verified, deduplicated, normalized
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed')),
  raw_r2_key TEXT,
  created_at TEXT NOT NULL,
  processed_at TEXT,
  UNIQUE(provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_provider ON webhook_events(provider, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_entity ON webhook_events(entity_id);

-- Operations tables for back-office agents

-- Reconciliation exceptions
CREATE TABLE IF NOT EXISTS reconciliation_exceptions (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  exception_type TEXT NOT NULL CHECK (exception_type IN ('amount_mismatch', 'missing_bank_entry', 'missing_exchange_entry', 'missing_accounting_entry', 'duplicate_entry', 'timing_mismatch')),
  expected_amount_cents INTEGER,
  actual_amount_cents INTEGER,
  source TEXT NOT NULL,
  resolution_status TEXT NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open', 'proposed', 'auto_resolved', 'manually_resolved', 'written_off')),
  resolution_detail TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_recon_tx ON reconciliation_exceptions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_recon_status ON reconciliation_exceptions(resolution_status);

-- Fraud investigation cases
CREATE TABLE IF NOT EXISTS fraud_cases (
  id TEXT PRIMARY KEY,
  transaction_ids TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  signals TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'cleared', 'confirmed_fraud', 'reported')),
  assigned_to TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

-- Operations exception tickets
CREATE TABLE IF NOT EXISTS ops_cases (
  id TEXT PRIMARY KEY,
  transaction_id TEXT REFERENCES transactions(id),
  exception_type TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'retrying', 'resolved', 'escalated', 'closed')),
  assigned_to TEXT,
  resolution TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ops_status ON ops_cases(status);

-- Sanctions screening results
CREATE TABLE IF NOT EXISTS sanctions_screenings (
  id TEXT PRIMARY KEY,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'counterparty', 'beneficiary', 'beneficial_owner')),
  entity_id TEXT NOT NULL,
  list_checked TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('clear', 'match', 'partial_match', 'error')),
  match_score REAL,
  match_details TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sanctions_entity ON sanctions_screenings(entity_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_result ON sanctions_screenings(result);

-- Regulatory reports (FINTRAC)
CREATE TABLE IF NOT EXISTS regulatory_reports (
  id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('LCTR', 'EFTR', 'STR', 'TPR')),
  transaction_ids TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'submitted', 'acknowledged')),
  r2_key TEXT,
  submitted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON regulatory_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON regulatory_reports(status);
