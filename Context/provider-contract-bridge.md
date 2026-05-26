# Provider Contract: Bridge

## Bridge — Stablecoin On/Off-Ramp

**Role in Xnumia:** Handles all stablecoin conversion — fiat to USDC, USDC to fiat. Replaces the generic "crypto exchange" concept.

**Sandbox:** `https://api.sandbox.bridge.xyz`
**Production:** `https://api.bridge.xyz`

**Authentication:** `Api-Key: {api_key}` header. API key stored as Worker secret.

**Idempotency:** `Idempotency-Key` header on POST requests. Format: `xnumia-bridge-{transactionId}-{operation}`.

---

## Key Operations

| Operation | Endpoint | Xnumia Use |
|-----------|----------|------------|
| Create customer | `POST /v0/customers` | Onboard client entity |
| Create KYC link | `POST /v0/kyc_links` | Initiate client verification |
| Get customer | `GET /v0/customers/{id}` | Check verification status |
| Create virtual account | `POST /v0/customers/{id}/virtual_accounts` | Fiat receive endpoint |
| Create external account | `POST /v0/customers/{id}/external_accounts` | Link bank/wallet for payouts |
| Create transfer | `POST /v0/transfers` | Execute conversion (fiat->stable or stable->fiat) |
| Get transfer | `GET /v0/transfers/{id}` | Check conversion status |
| List transfers | `GET /v0/transfers` | Reconciliation |

---

## Webhook Verification

- Bridge sends webhook events to registered URL
- Verify using webhook secret and signature header (check Bridge docs for exact HMAC scheme)
- Deduplicate on event ID

---

## Key Webhook Events

| Event | Xnumia Action |
|-------|---------------|
| `transfer.completed` | Conversion settled, advance state machine |
| `transfer.failed` | Conversion failed, create exception |
| `customer.updated` | KYC status changed, update client entity |
| `virtual_account.created` | Fiat receive endpoint ready |

---

## State Mapping

| Bridge Status | Xnumia Status |
|---------------|---------------|
| `pending` | PENDING_SETTLEMENT (stablecoin leg) |
| `completed` | SETTLED (stablecoin leg confirmed) |
| `failed` | FAILED |
| `refunded` | REVERSED |

---

## Entity Model Integration

Bridge has its own customer/KYC model. Xnumia must:
- Store Bridge `customer_id` in `clients.bridge_customer_id`
- Store Bridge `external_account_id` in `external_accounts.provider_account_id`
- Map Bridge KYC status to `clients.kyc_status`

---

## Retry Semantics

- 429: retry after `Retry-After` header
- 5xx: exponential backoff, max 3 attempts
- 4xx: terminal

---

## Evidence Retention

- Store raw transfer objects in R2 at `compliance/bridge/{date}/{transfer_id}.json`
- Store webhook payloads in R2 at `webhooks/bridge/{date}/{event_id}.json`
- 7-year retention
