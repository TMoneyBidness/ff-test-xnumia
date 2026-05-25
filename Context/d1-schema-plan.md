# D1 Database Schema Plan

D1 is Cloudflare's serverless SQLite database. All types follow SQLite conventions: `TEXT`, `INTEGER`, `REAL`. UUIDs are stored as `TEXT`. Timestamps are `TEXT` in ISO 8601 format. Money amounts are `INTEGER` (cents/smallest unit) to avoid floating-point errors.

---

## Core Tables (Phase 0 — Foundation)

### `transactions`

The central record of every payment flowing through the platform.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `TEXT PRIMARY KEY` | UUID v4 |
| `external_id` | `TEXT` | ID from the originating system (PSP, bank, exchange) |
| `type` | `TEXT NOT NULL` | `ar_invoice`, `ap_payment`, `conversion`, `settlement` |
| `status` | `TEXT NOT NULL` | `pending`, `confirmed`, `processing`, `settled`, `reconciled`, `failed`, `held` |
| `source_rail` | `TEXT NOT NULL` | `fiat_ach`, `fiat_eft`, `fiat_wire`, `stablecoin`, `psp` |
| `dest_rail` | `TEXT NOT NULL` | Same enum as `source_rail` |
| `amount` | `INTEGER NOT NULL` | Amount in smallest currency unit (cents) |
| `currency` | `TEXT NOT NULL` | ISO 4217 code or stablecoin symbol (`CAD`, `USD`, `USDC`, `USDT`) |
| `client_id` | `TEXT NOT NULL` | Tier 3 client or downstream client identifier |
| `counterparty_id` | `TEXT` | The other party in the transaction |
| `psp_reference` | `TEXT` | PSP transaction reference (Phase 1 only, nullable for Phase 2) |
| `metadata` | `TEXT` | JSON blob for rail-specific data |
| `environment` | `TEXT NOT NULL` | `production` or `sandbox` |
| `created_at` | `TEXT NOT NULL` | ISO 8601 timestamp |
| `updated_at` | `TEXT NOT NULL` | ISO 8601 timestamp |
| `settled_at` | `TEXT` | Timestamp when settlement confirmed |

**Indexes:**

```sql
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_client ON transactions(client_id);
CREATE INDEX idx_transactions_external ON transactions(external_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_env_status ON transactions(environment, status);
```

---

### `ledger_entries`

Double-entry ledger. Every transaction produces at least two ledger entries (debit + credit).

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `TEXT PRIMARY KEY` | UUID v4 |
| `transaction_id` | `TEXT NOT NULL` | FK to `transactions.id` |
| `entry_type` | `TEXT NOT NULL` | `debit` or `credit` |
| `account` | `TEXT NOT NULL` | Logical account: `client_receivable`, `psp_holding`, `exchange_balance`, `settlement_clearing`, etc. |
| `amount` | `INTEGER NOT NULL` | Amount in smallest currency unit |
| `currency` | `TEXT NOT NULL` | ISO 4217 or stablecoin symbol |
| `balance_after` | `INTEGER` | Running balance for the account after this entry (nullable until recon runs) |
| `source` | `TEXT NOT NULL` | System that originated this entry: `platform`, `bank_feed`, `exchange_feed`, `psp_webhook`, `recon_agent` |
| `reconciled` | `INTEGER NOT NULL DEFAULT 0` | 0 = unreconciled, 1 = reconciled |
| `reconciled_at` | `TEXT` | Timestamp when reconciliation agent matched this entry |
| `created_at` | `TEXT NOT NULL` | ISO 8601 timestamp |

**Indexes:**

```sql
CREATE INDEX idx_ledger_transaction ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_account ON ledger_entries(account);
CREATE INDEX idx_ledger_unreconciled ON ledger_entries(reconciled) WHERE reconciled = 0;
CREATE INDEX idx_ledger_created ON ledger_entries(created_at);
```

---

### `agent_decisions`

Every autonomous decision an agent makes is recorded here. This is the auditability backbone of the platform.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `TEXT PRIMARY KEY` | UUID v4 |
| `transaction_id` | `TEXT` | FK to `transactions.id` (nullable — some decisions are system-wide) |
| `agent` | `TEXT NOT NULL` | Which agent: `settlement`, `reconciliation`, `fraud`, `aml`, `payments_ops`, `orchestrator` |
| `action` | `TEXT NOT NULL` | What the agent did: `approve`, `hold`, `escalate`, `retry`, `resolve`, `flag`, `report` |
| `reasoning` | `TEXT NOT NULL` | Plain-text explanation of why the agent made this decision |
| `confidence` | `REAL` | Agent's confidence score (0.0 to 1.0), if applicable |
| `input_snapshot` | `TEXT` | JSON snapshot of the data the agent evaluated |
| `outcome` | `TEXT` | Result of the action: `success`, `failed`, `pending_review`, `overridden` |
| `reviewed_by` | `TEXT` | Human reviewer ID if the decision was reviewed/overridden |
| `reviewed_at` | `TEXT` | Timestamp of human review |
| `environment` | `TEXT NOT NULL` | `production` or `sandbox` |
| `created_at` | `TEXT NOT NULL` | ISO 8601 timestamp |

**Indexes:**

```sql
CREATE INDEX idx_decisions_transaction ON agent_decisions(transaction_id);
CREATE INDEX idx_decisions_agent ON agent_decisions(agent);
CREATE INDEX idx_decisions_action ON agent_decisions(action);
CREATE INDEX idx_decisions_env_agent ON agent_decisions(environment, agent);
CREATE INDEX idx_decisions_created ON agent_decisions(created_at);
```

---

### `audit_log`

Immutable append-only log of every state change and significant event in the system.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `TEXT PRIMARY KEY` | UUID v4 |
| `entity_type` | `TEXT NOT NULL` | `transaction`, `ledger_entry`, `agent_decision`, `config`, `client` |
| `entity_id` | `TEXT NOT NULL` | ID of the entity that changed |
| `event` | `TEXT NOT NULL` | What happened: `created`, `status_changed`, `reconciled`, `escalated`, `config_updated` |
| `actor` | `TEXT NOT NULL` | Who/what caused it: agent name, human user ID, `system`, `webhook` |
| `old_value` | `TEXT` | JSON of previous state (for updates) |
| `new_value` | `TEXT` | JSON of new state |
| `ip_address` | `TEXT` | Request origin (for human actions) |
| `environment` | `TEXT NOT NULL` | `production` or `sandbox` |
| `created_at` | `TEXT NOT NULL` | ISO 8601 timestamp |

**Indexes:**

```sql
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_log(actor);
CREATE INDEX idx_audit_event ON audit_log(event);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

---

## Table Relationships

```
transactions (1) ----< (N) ledger_entries       [transaction_id FK]
transactions (1) ----< (N) agent_decisions      [transaction_id FK]
transactions (1) ----< (N) audit_log            [entity_id where entity_type = 'transaction']
ledger_entries (1) ---< (N) audit_log           [entity_id where entity_type = 'ledger_entry']
agent_decisions (1) --< (N) audit_log           [entity_id where entity_type = 'agent_decision']
```

Note: D1/SQLite supports `FOREIGN KEY` constraints but they must be enabled per-connection with `PRAGMA foreign_keys = ON`. Enforce referential integrity in application code as the primary mechanism, with FK constraints as a safety net.

---

## Phase 1 Schema Evolution — Per Agent Workload

### Settlement Agent

| Table | Purpose |
|-------|---------|
| `settlement_batches` | Groups transactions into settlement windows. Columns: `id`, `batch_date`, `rail`, `status` (`open`, `settling`, `settled`), `transaction_count`, `total_amount`, `currency`, `opened_at`, `settled_at` |
| `settlement_confirmations` | Finality confirmations from bank/exchange feeds. Columns: `id`, `settlement_batch_id`, `source` (`bank`, `exchange`, `psp`), `confirmation_ref`, `confirmed_at`, `raw_payload` |

### Reconciliation Agent

| Table | Purpose |
|-------|---------|
| `recon_runs` | Each reconciliation cycle. Columns: `id`, `run_type` (`scheduled`, `manual`, `triggered`), `scope` (`full`, `incremental`), `started_at`, `completed_at`, `matched_count`, `unmatched_count`, `status` |
| `recon_mismatches` | Unmatched entries flagged for review. Columns: `id`, `recon_run_id`, `ledger_entry_id`, `expected_value`, `actual_value`, `mismatch_type` (`amount`, `missing`, `duplicate`, `timing`), `resolution`, `resolved_at` |

### Fraud Detection Agent

| Table | Purpose |
|-------|---------|
| `fraud_alerts` | Flagged transactions. Columns: `id`, `transaction_id`, `alert_type` (`velocity`, `amount_anomaly`, `pattern`, `geo`), `severity` (`low`, `medium`, `high`, `critical`), `details`, `status` (`open`, `investigating`, `cleared`, `confirmed_fraud`), `created_at` |
| `fraud_rules` | Configurable detection rules. Columns: `id`, `rule_name`, `rule_type`, `parameters` (JSON), `enabled`, `created_at`, `updated_at` |

### AML Compliance Agent

| Table | Purpose |
|-------|---------|
| `aml_screenings` | Sanctions/watchlist screening results. Columns: `id`, `transaction_id`, `counterparty_id`, `screen_type` (`sanctions`, `pep`, `adverse_media`), `result` (`clear`, `potential_match`, `confirmed_match`), `details`, `screened_at` |
| `suspicious_activity_reports` | SAR prep records. Columns: `id`, `transaction_ids` (JSON array), `counterparty_id`, `narrative`, `status` (`draft`, `review`, `filed`), `filing_reference`, `created_at`, `filed_at` |

### Payments Ops Agent

| Table | Purpose |
|-------|---------|
| `payment_exceptions` | Failed or stuck payments requiring intervention. Columns: `id`, `transaction_id`, `exception_type` (`timeout`, `rejected`, `insufficient_funds`, `invalid_details`, `rail_error`), `retry_count`, `max_retries`, `next_retry_at`, `resolved_at`, `resolution` |
| `ops_tickets` | Internal support tickets for downstream client issues. Columns: `id`, `client_id`, `transaction_id`, `category`, `description`, `status` (`open`, `in_progress`, `resolved`, `escalated`), `assigned_to`, `created_at`, `resolved_at` |

---

## Indexing Strategy

1. **Primary keys** are always `TEXT` UUIDs. SQLite uses B-tree indexes for primary keys automatically.
2. **Status columns** are indexed on all tables because agents query by status constantly (`WHERE status = 'pending'`).
3. **Timestamp columns** (`created_at`) are indexed to support time-range queries for reconciliation windows and audit reporting.
4. **Composite indexes** (`environment + status`, `environment + agent`) support environment-scoped queries, which are the dominant access pattern since production and sandbox data share tables.
5. **Partial indexes** (e.g., `WHERE reconciled = 0`) are used where SQLite supports them to speed up "find unprocessed items" queries that agents run continuously.
6. **Foreign key columns** (`transaction_id`) are indexed on all child tables to support joins and cascading lookups.
7. **No full-text indexes** in Phase 1. If search over `reasoning` or `narrative` fields is needed, add FTS5 virtual tables later.

---

## D1-Specific Notes

- **Max database size:** 10GB per D1 database. Monitor growth; if approaching limit, consider sharding by environment or archiving old audit logs to R2.
- **Write throughput:** D1 is single-writer. High-volume concurrent writes should be buffered through Queues and written in batches.
- **No stored procedures:** All business logic lives in Workers/Durable Objects, not in the database.
- **Migrations:** Use `wrangler d1 migrations` for schema changes. All migrations are forward-only SQL files.
- **Backup:** D1 supports point-in-time restore. For compliance, also export daily snapshots to R2.
