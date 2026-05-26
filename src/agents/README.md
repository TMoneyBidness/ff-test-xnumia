# Payment Pipeline Agents

Five agents process every payment request in sequence, aligned with how real payments infrastructure works.

## Pipeline Order

### 1. Validate Agent (pre-execution)
- **What it does**: Checks that the request is well-formed and the client is eligible to transact
- **Checks**: Required fields, valid currencies, KYC status
- **Blocks on**: Invalid data, expired KYC

### 2. Quote Agent (pre-execution)
- **What it does**: Looks up the exchange rate and calculates the conversion output
- **Checks**: Currency pair is supported, calculates spread
- **Blocks on**: Unsupported currency pair
- **Note**: Does NOT judge risk — it just does math

### 3. Screen Agent (pre-execution)
- **What it does**: Transaction monitoring — sanctions, velocity, amount patterns
- **Checks**: OFAC/sanctions lists, transaction velocity (last hour), large-value thresholds
- **Blocks on**: Sanctions hit (instant reject), compound risk signals
- **Database**: D1 `payment_requests` for velocity queries

### 4. Execute Agent (post-authorization)
- **What it does**: Calls bank and exchange adapters to move funds, writes ledger entries
- **Calls**: BankPort.getBalance(), BankPort.initiateTransfer(), ExchangePort.convertFiatToStable()
- **Writes**: D1 `ledger_entries` — one debit (fiat) + one credit (stablecoin)
- **Blocks on**: Insufficient funds

### 5. Reconcile Agent (post-execution)
- **What it does**: Matches ledger entries and checks for duplicate payments
- **Checks**: Debit and credit amounts balance, duplicate detection (same client + amount in 24h)
- **Database**: D1 `ledger_entries`, D1 `payment_requests`
- **Blocks on**: 2+ duplicate payments detected

## Key Rule
Every agent action writes to `agent_decisions` in D1 with: agent_type, verdict, reasoning, detail. No silent decisions.

## Pipeline Behavior
- All GREEN → auto-approved
- Any AMBER → escalated to human review (dashboard)
- Any RED → auto-rejected, pipeline stops at that agent
