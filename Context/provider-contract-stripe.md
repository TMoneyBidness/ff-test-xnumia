# Provider Contract: Stripe

## Stripe — Fiat Collection and Disbursement (Phase 1 PSP)

**Role in Xnumia:** Acts as the Phase 1 PSP — handles all fiat money movement until MSB license is issued. Collects payments from clients' customers (AR) and disburses to vendors (AP).

**Sandbox:** `https://api.stripe.com` with test API keys (prefix `sk_test_`)
**Production:** Same URL with live keys (prefix `sk_live_`)

**Authentication:** Bearer token via `Authorization: Bearer sk_test_...` header. API key stored as Worker secret.

**Idempotency:** `Idempotency-Key` header on all POST requests. Format: `xnumia-{transactionId}-{operation}`. Keys are unique per operation per transaction. Stripe retains idempotency for 24 hours.

---

## Key Operations

| Operation | Endpoint | Xnumia Use |
|-----------|----------|------------|
| Collect payment | `POST /v1/payment_intents` | AR: collect CAD from payer |
| Confirm payment | `POST /v1/payment_intents/{id}/confirm` | Confirm payment after client authorization |
| Create payout | `POST /v1/payouts` | AP: disburse CAD to vendor bank account |
| Get balance | `GET /v1/balance` | Pre-flight check before disbursement |
| List transactions | `GET /v1/balance_transactions` | Reconciliation: match against internal ledger |

---

## Webhook Verification

- Stripe sends `Stripe-Signature` header with each webhook
- Verify using HMAC-SHA256 with webhook signing secret (`whsec_...`)
- Verification: `expected = HMAC-SHA256(timestamp + '.' + payload, webhook_secret)`
- Compare against `v1=` signature in header
- Reject if timestamp older than 5 minutes (replay protection)

---

## Key Webhook Events

| Event | Xnumia Action |
|-------|---------------|
| `payment_intent.succeeded` | AR: fiat collected, trigger conversion |
| `payment_intent.payment_failed` | AR: mark failed, notify client |
| `payout.paid` | AP: vendor paid, trigger reconciliation |
| `payout.failed` | AP: disbursement failed, create exception |
| `charge.dispute.created` | Fraud: dispute received, hold funds |

---

## State Mapping

| Stripe Status | Xnumia Status |
|---------------|---------------|
| `requires_payment_method` | INITIATED |
| `requires_confirmation` | INITIATED |
| `processing` | PENDING_PSP |
| `succeeded` | PENDING_SETTLEMENT (fiat leg confirmed) |
| `canceled` | FAILED |
| `requires_action` | HELD_FOR_REVIEW |

---

## Retry Semantics

- 429 (rate limit): retry after `Retry-After` header value
- 500, 502, 503: retry with exponential backoff (1s, 2s, 4s), max 3 attempts
- 400, 401, 404: terminal, do not retry
- All retries use same idempotency key

---

## Evidence Retention

- Store raw Payment Intent object in R2 at `compliance/stripe/{date}/{payment_intent_id}.json`
- Store raw webhook payloads in R2 at `webhooks/stripe/{date}/{event_id}.json`
- Retain for 7 years (FINTRAC + Stripe's own 7-year dispute window)

---

## Phase 2 Removal

When MSB license is issued, Stripe adapter is removed. Direct bank connection (via aggregator) replaces fiat collection/disbursement. The `PSPPort` interface is removed from the adapter factory. No other code changes required — this is the Port/Adapter pattern in action.
