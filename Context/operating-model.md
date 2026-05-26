# Xnumia Operating Model — Payment Operations Reference

This document defines what each payment operation means at the business level. Agents are built against these definitions. If an agent's behavior contradicts this document, this document wins.

## External Systems

| System | Product | Role | Phase |
|--------|---------|------|-------|
| **PSP** | Stripe | Fiat collection (payment intents) and disbursement (payouts). Regulatory bridge — Xnumia cannot custody or move funds pre-MSB. | Phase 1 only |
| **Exchange** | Bridge | Stablecoin on/off-ramp. Converts between fiat (CAD/USD) and stablecoin (USDC). | Phase 1 + 2 |
| **Custody** | Zero Hash | Stablecoin custody, institutional-grade key management. | Phase 2 only |
| **Accounting** | Xero (v1) | Client-facing books. Every completed operation syncs here. | Phase 1 + 2 |

---

## 1. Accounts Receivable (AR)

**Business meaning:** A client's customer owes the client money. The client wants to collect in CAD and receive USDC in their stablecoin wallet.

| Aspect | Detail |
|--------|--------|
| **Trigger** | Client submits AR request via API with payer details, amount (CAD), and destination wallet |
| **Parties** | Payer (client's customer) → Xnumia (orchestrator) → Client (USDC recipient) |
| **Fiat leg** | Stripe creates a payment intent. Payer pays in CAD via ACH/EFT or card. Stripe settles to Xnumia's connected account. |
| **Conversion leg** | Bridge converts settled CAD to USDC at market rate. Xnumia records the quoted rate and the executed rate. |
| **Delivery leg** | Bridge deposits USDC to the client's designated wallet address. |
| **Complete when** | USDC confirmed on-chain in client wallet AND accounting entry synced to Xero AND ledger balanced (debit to `client_receivable`, credit to `exchange_balance`, then debit `exchange_balance`, credit `client_wallet`) |
| **Evidence retained** | Stripe payment intent ID + status, Bridge conversion receipt (conversion ID, rate, amounts), on-chain tx hash, ledger entries (D1), Xero sync confirmation |
| **What can go wrong** | Payer payment fails (NSF, card decline) → transaction marked `failed`, no conversion initiated. Stripe settles but Bridge conversion fails → funds held in Stripe, exception raised, retry or manual intervention. Bridge conversion succeeds but wallet deposit fails → exception raised, funds in Bridge limbo, payments ops agent escalates. FX slippage between quote and execution → logged, tolerance check (0.5%), alert if exceeded. |

### AR Transaction States

```
pending → confirmed → processing → converting → settling → settled → reconciled
                                                                    → failed (from any state)
                                                                    → held (fraud/AML block)
```

---

## 2. Accounts Payable (AP)

**Business meaning:** A client needs to pay a vendor. The vendor expects CAD. The client holds USDC.

| Aspect | Detail |
|--------|--------|
| **Trigger** | Client submits AP request via API with vendor bank details, amount (CAD), and source wallet |
| **Parties** | Client (USDC sender) → Xnumia (orchestrator) → Vendor (CAD recipient) |
| **Stablecoin leg** | Client sends USDC to Bridge via Xnumia-provided deposit address. Bridge confirms receipt. |
| **Conversion leg** | Bridge converts USDC to CAD at market rate. |
| **Fiat leg** | Stripe disburses CAD to vendor's bank account via payout (ACH/EFT or wire). |
| **Complete when** | Vendor's bank confirms receipt (Stripe `payout.paid` webhook) AND accounting entry synced to Xero AND ledger balanced |
| **Evidence retained** | On-chain tx hash (USDC transfer), Bridge conversion receipt, Stripe payout ID + status, ledger entries, Xero sync confirmation |
| **What can go wrong** | Client sends wrong USDC amount → Bridge holds, exception raised. Bridge conversion fails → USDC returned to client wallet, transaction marked `failed`. Stripe payout rejected by vendor's bank (bad account details) → `payout.failed` webhook, funds returned to Stripe balance, payments ops agent notifies client. Payout returned after settlement (bank return) → reversal ledger entry, client notified, re-collection flow. |

### AP Transaction States

```
pending → confirmed → receiving_stablecoin → converting → disbursing → settled → reconciled
                                                                               → failed
                                                                               → held
```

---

## 3. Conversion (Standalone)

**Business meaning:** Client wants to convert between fiat and stablecoin without a specific AR/AP context. Typically portfolio rebalancing or treasury management.

| Aspect | Detail |
|--------|--------|
| **Trigger** | Client submits conversion request via API specifying source currency, destination currency, and amount |
| **Parties** | Client → Xnumia (orchestrator) → Bridge (conversion) |
| **Direction** | Either fiat-to-stablecoin or stablecoin-to-fiat |
| **Flow** | Xnumia requests a quote from Bridge → client confirms → Bridge executes conversion → Xnumia records ledger entries |
| **Complete when** | Bridge confirms conversion settled AND ledger entries balanced AND accounting synced |
| **Evidence retained** | Bridge quote ID, Bridge conversion receipt, ledger entries, Xero sync confirmation |
| **What can go wrong** | Quote expires before confirmation → new quote required. Conversion fails mid-execution → Bridge rolls back, exception raised. Rate slippage beyond tolerance → alert, human review if > 0.5%. |

---

## 4. Settlement

**Business meaning:** Confirming that funds have actually moved and are final. A transaction is not complete until both legs (fiat + stablecoin) settle independently.

### Settlement by Rail

| Rail | Provider | Settlement window | Finality signal |
|------|----------|-------------------|-----------------|
| ACH / EFT | Stripe | T+2 business days | `payment_intent.succeeded` (collection) or `payout.paid` (disbursement) |
| Wire | Stripe | T+0 to T+1 | `payout.paid` |
| Card | Stripe | T+2 | `payment_intent.succeeded` |
| Stablecoin (USDC) | Bridge | Near-instant (minutes) | Bridge conversion completion webhook or poll confirmation |

### Settlement Rules

1. **Dual confirmation required.** Both the fiat leg and the stablecoin leg must settle independently before a transaction is marked `settled`.
2. **Settlement agent polls for confirmation** on a schedule (every 5 minutes for pending settlements) and processes webhooks as they arrive.
3. **Settlement timeout.** If either leg has not settled within its expected window + 1 business day buffer, the settlement agent escalates to payments ops.
4. **Partial settlement.** If one leg settles but the other fails, the settled leg is recorded and the transaction enters exception handling. Funds are not automatically returned — human review required.
5. **Settlement batch.** Transactions are grouped into settlement batches by rail and date (stored in `settlement_batches`). Batch settlement status is tracked independently from individual transaction status.

### What Can Go Wrong

| Failure | Cause | Response |
|---------|-------|----------|
| Bank return (NSF) | Payer's account has insufficient funds | Stripe sends `charge.dispute.created` or `payment_intent.payment_failed`. Reversal ledger entry. Client notified. |
| Conversion failure | Bridge rejects or times out | Retry up to 3x with exponential backoff. If still failing, escalate. Fiat leg held. |
| Partial settlement | One leg settled, other failed | Exception raised. No auto-reversal. Human review determines next step. |
| Settlement timeout | Expected window exceeded | Settlement agent flags transaction, escalates to payments ops agent. |
| Duplicate settlement | Webhook delivered twice | Idempotency check on external reference ID. Duplicate ignored, logged. |

---

## 5. Reconciliation

**Business meaning:** Matching Xnumia's internal ledger against external system records to confirm that what we think happened actually happened.

### Match Types

| Phase | Match type | Sources compared |
|-------|-----------|-----------------|
| Phase 1 | Four-way | Xnumia ledger (D1) vs Stripe records vs Bridge records vs PSP settlement report |
| Phase 2 | Three-way | Xnumia ledger (D1) vs Stripe records vs Bridge records |

In both phases, reconciled results are also checked against the client's accounting software (Xero) to confirm sync integrity.

### Reconciliation Schedule

| Cycle | Frequency | Scope |
|-------|-----------|-------|
| Micro-recon | Every 15 minutes | Newly settled transactions since last micro-recon |
| Full recon | Daily at 00:00 UTC | All unreconciled entries + re-check of today's micro-recon results |
| Manual recon | On-demand (operator trigger) | Specified date range or transaction set |

### Reconciliation Logic

1. For each settled transaction, pull the corresponding record from Stripe (payment intent or payout) and Bridge (conversion receipt).
2. Compare amounts. **Tolerance: 0.01%** (covers FX rounding at the sub-cent level). Amounts within tolerance are auto-reconciled.
3. Compare timestamps. Entries are expected to appear within their settlement window. A timing mismatch (entry exists in one system but not yet in another) is flagged but not treated as an error until the settlement window expires.
4. Mark matched ledger entries as `reconciled = 1` with `reconciled_at` timestamp.
5. Write results to `recon_runs` and any exceptions to `recon_mismatches`.

### Exception Types

| Type | Meaning | Auto-resolution |
|------|---------|-----------------|
| Amount mismatch | Amounts differ beyond 0.01% tolerance | No. Escalate to human review. |
| Missing entry | Record exists in one system but not another | Wait one settlement window. If still missing after window, escalate. |
| Duplicate entry | Same transaction appears twice in one system | Flag. Agent checks idempotency keys. If true duplicate, mark one as void. |
| Timing mismatch | Entry timestamps differ beyond expected window | Log. Usually resolves on next recon cycle. If persistent, escalate. |

---

## 6. Exception Handling

**Business meaning:** Something went wrong in the pipeline and the system cannot auto-resolve it.

### Exception Sources

| Source | Examples |
|--------|----------|
| Adapter failure | Stripe API timeout, Bridge rate service unavailable, webhook delivery failure |
| Business rule violation | Amount exceeds client limit, unknown counterparty, currency mismatch |
| Settlement failure | Bank return, conversion rejection, partial settlement |
| Reconciliation mismatch | Amount or entry discrepancy that exceeds auto-resolution tolerance |
| Agent uncertainty | Agent confidence below threshold (< 0.7), ambiguous data |

### Classification

| Class | Meaning | System response |
|-------|---------|-----------------|
| **Transient** | Temporary failure, likely to succeed on retry | Exponential backoff: 30s → 2min → 8min. Max 3 retries. |
| **Terminal** | Permanent failure, retry will not help | Marked `failed`. Sent to DLQ. Human review required. |
| **Ambiguous** | Agent cannot determine if transient or terminal | Treated as transient for first retry cycle. If still failing after 3 retries, reclassified as terminal. |

### Retry Policy

- **Backoff:** Exponential with jitter. Base = 30 seconds. Factor = 4x. Max interval = 8 minutes.
- **Max retries:** 3 per exception.
- **DLQ:** After 3 failed retries, the message goes to the dead letter queue. DLQ messages are never auto-retried.
- **Idempotency:** Every retry uses the same idempotency key as the original attempt to prevent duplicate execution.

### Exception Lifecycle

```
detected → classified (transient | terminal) → retrying (if transient) → resolved | escalated → DLQ (if terminal)
```

Every exception is recorded in `payment_exceptions` with: transaction ID, exception type, retry count, next retry timestamp, and resolution.

---

## 7. Human Review

**Business meaning:** A human operator examines a transaction or decision that the system cannot or should not handle autonomously.

### When Human Review Triggers

| Trigger | Source |
|---------|--------|
| Agent returns AMBER verdict | Any agent's confidence is below threshold or rule requires human judgment |
| Exception exhausts retries | 3 retries failed, DLQ reached |
| Settlement timeout | Expected settlement window + buffer exceeded |
| Reconciliation mismatch | Amount mismatch beyond tolerance, persistent missing entry |
| Regulatory flag | AML screening returns `potential_match`, fraud alert severity `high` or `critical` |

### Who Reviews

| Phase | Reviewers |
|-------|-----------|
| Phase 0 | Taylor and Marko (founders) |
| Phase 1+ | Hired ops person, with Taylor/Marko as escalation |

### Available Actions

| Action | Effect |
|--------|--------|
| **Approve** | Resume the pipeline from where it paused. Transaction continues to next state. |
| **Reject** | Mark transaction as terminal. No further processing. Client notified. |
| **Adjust** | Modify amount, counterparty, or rail details, then resume. Creates a new version in audit trail. |
| **Investigate** | Request more information from adapter (re-pull status from Stripe/Bridge) or from client. Transaction stays in `held` state. |
| **Override** | Override an agent decision. Original decision preserved in `agent_decisions` with `outcome = 'overridden'`. |

### Audit Requirements

Every human action writes to `audit_log` with:
- `actor`: human user ID
- `event`: the action taken
- `old_value`: state before action
- `new_value`: state after action
- `ip_address`: request origin

Every overridden agent decision updates `agent_decisions` with `reviewed_by`, `reviewed_at`, and `outcome = 'overridden'`.

---

## 8. Regulatory Reporting (FINTRAC — Canada)

**Business meaning:** Canadian MSB regulations require specific reports filed with FINTRAC. Even in Phase 1 (PSP-bridged), Xnumia must prepare and retain the data for these reports. In Phase 2 (MSB-licensed), Xnumia files them directly.

### Required Reports

| Report | Trigger | Threshold | Filing deadline |
|--------|---------|-----------|-----------------|
| **Large Cash Transaction Report (LCTR)** | Single transaction or multiple transactions within 24 hours by same person | >= $10,000 CAD | 15 calendar days |
| **Electronic Funds Transfer Report (EFTR)** | International EFT (sending or receiving) | >= $1,000 CAD | 5 business days |
| **Suspicious Transaction Report (STR)** | Flagged by fraud or AML agent, or by human reviewer | No threshold — suspicion-based | 30 calendar days from determination |
| **Terrorist Property Report (TPR)** | Sanctions screening returns confirmed match | Any amount | Immediately (without delay) |

### How Agents Support Reporting

1. **AML agent** monitors every transaction against FINTRAC thresholds. When a threshold is crossed, the agent creates a draft report in `suspicious_activity_reports` (reused for all report types in Phase 0; dedicated tables per report type in Phase 1).
2. **Fraud agent** flags transactions that meet STR criteria. Flag is passed to AML agent for report preparation.
3. **Sanctions screening** runs on every transaction counterparty before processing begins. A `confirmed_match` on any sanctions list halts the transaction immediately and triggers TPR preparation.
4. **Aggregation logic:** The AML agent tracks cumulative 24-hour totals per person/entity to catch structured transactions designed to avoid the $10,000 LCTR threshold (structuring/smurfing).

### Record Retention

- **Minimum retention period:** 5 years from the date of the transaction or report.
- **Storage:** All reports, supporting evidence, and transaction records stored in R2 with immutable object locks.
- **Deletion:** No automated deletion of compliance-relevant records. Purge only after retention period expires AND legal review confirms no ongoing obligations.
- **Audit trail:** Every report status change (draft → review → filed) logged in `audit_log`.

### Phase 1 vs Phase 2

| Aspect | Phase 1 (PSP-bridged) | Phase 2 (MSB-licensed) |
|--------|----------------------|----------------------|
| Who files reports | PSP is the reporting entity. Xnumia prepares data and passes to PSP. | Xnumia files directly with FINTRAC. |
| Sanctions screening | Xnumia screens; PSP also screens (dual screening). | Xnumia is sole screener. |
| Record keeping | Xnumia retains its own records. PSP retains theirs. | Xnumia is sole record keeper. |

---

## Cross-Cutting Concerns

### Idempotency

Every external API call (Stripe, Bridge) uses an idempotency key derived from the transaction ID + operation step. Retries and duplicate webhooks never create duplicate financial effects.

### Ledger Integrity

All financial operations produce double-entry ledger records. For every debit there is a corresponding credit. The reconciliation agent verifies this invariant on every cycle. A ledger imbalance is a critical alert — it halts new transaction processing until resolved.

### Environment Isolation

Production and sandbox transactions share the same schema but are tagged with `environment = 'production'` or `environment = 'sandbox'`. Agents query with environment filters. A sandbox transaction can never trigger a real Stripe payment or Bridge conversion — adapter implementations for sandbox return simulated responses.

### Agent Decision Logging

Every agent decision — approve, hold, escalate, retry, flag, report — writes to `agent_decisions` with the agent name, action, reasoning (plain text), confidence score, and input snapshot. This is a compliance requirement. An agent that takes an action without logging it is a bug.
