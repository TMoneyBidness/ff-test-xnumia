# Agent Workloads

Five operational workloads owned end-to-end by autonomous agents. Humans review exceptions only.

## Priority Order (Phase 1 Build)

### 1. Settlement Agent
- **Scope**: Confirm finality across rails, close the loop between bank and exchange ledgers, mark transactions complete in accounting
- **Ports used**: BankPort, ExchangePort, AccountingPort
- **Priority**: HIGHEST — this is the core transaction lifecycle

### 2. Reconciliation Agent
- **Scope**: Match ledger entries across bank, exchange, PSP (Phase 1), and accounting software. Flag mismatches, propose and execute resolutions
- **Ports used**: BankPort, ExchangePort, PSPPort (Phase 1), AccountingPort
- **Priority**: HIGH — reconciliation failures are the #1 operational cost in payments

### 3. Fraud Detection Agent
- **Scope**: Flag anomalous transactions in-flight, hold suspect movements, escalate to human review
- **Ports used**: BankPort, ExchangePort (read-only for pattern analysis)
- **Priority**: MEDIUM — must exist before production launch but can start simple

### 4. AML Compliance Agent
- **Scope**: Sanctions screening, transaction monitoring, suspicious activity pattern detection, regulatory reporting prep
- **Ports used**: BankPort, ExchangePort (read-only), external sanctions list APIs
- **Priority**: MEDIUM — regulatory requirement, design against FINTRAC/FinCEN guidance

### 5. Payments Operations Agent
- **Scope**: Exceptions, retries, customer-service-tier resolution for downstream clients
- **Ports used**: All ports
- **Priority**: LOWER — handles the long tail of edge cases

## Key Rule
Every agent action MUST write to the `agent_decisions` table with: agent_type, action, reasoning, outcome. No silent decisions.
