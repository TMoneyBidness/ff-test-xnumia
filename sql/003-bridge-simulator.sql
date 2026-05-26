-- Bridge API Simulator tables
-- Mimics Bridge XYZ's data model for local demo/sandbox usage

CREATE TABLE IF NOT EXISTS bridge_sim_transfers (
  id TEXT PRIMARY KEY,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  on_behalf_of TEXT,
  source_currency TEXT NOT NULL,
  source_payment_rail TEXT NOT NULL,
  destination_currency TEXT NOT NULL,
  destination_payment_rail TEXT NOT NULL,
  destination_address TEXT,
  state TEXT NOT NULL DEFAULT 'awaiting_funds',
  client_reference_id TEXT,
  idempotency_key TEXT,
  receipt TEXT, -- JSON blob with fee breakdown
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bridge_sim_transfers_idempotency
  ON bridge_sim_transfers(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS bridge_sim_customers (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
