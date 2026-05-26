# Provider Contract: Zero Hash

## Zero Hash — Crypto Custody and Settlement (Deferred to Phase 2)

**Role in Xnumia:** Provides crypto custody and settlement infrastructure. Becomes relevant when MSB license is issued and Xnumia takes direct custody responsibility. Currently deferred — document the contract shape, do not implement.

**Status: DEFERRED** — Zero Hash integration is Phase 2 scope, gated by MSB license (Bo's track).

**Sandbox:** `https://api.sandbox.zerohash.com`
**Production:** `https://api.zerohash.com`

**Authentication:** HMAC-SHA256 signed requests.
- Headers: `X-SCX-API-KEY`, `X-SCX-SIGNED`, `X-SCX-TIMESTAMP`
- Signature: `HMAC-SHA256(timestamp + method + path + body, api_secret)`

---

## Key Operations (Phase 2)

| Operation | Endpoint | Future Xnumia Use |
|-----------|----------|-------------------|
| Create participant | `POST /participants` | Onboard client for custody |
| Submit trade | `POST /trades` | Execute conversion |
| Get trade | `GET /trades/{id}` | Check conversion status |
| Create withdrawal | `POST /withdrawals` | Move stablecoin to client wallet |
| Get balances | `GET /balances` | Check custody balances |
| List settlements | `GET /settlements` | Reconciliation |

---

## Why Deferred

1. Bridge handles the immediate on/off-ramp need in Phase 1
2. Zero Hash's custody model requires MSB licensing to operate legally
3. Building against a custody model that may change with licensing is premature
4. The `ExchangePort` interface is designed to accommodate either Bridge or Zero Hash — switching is an adapter swap, not a rewrite

---

## When to Revisit

When Bo delivers the MSB license. At that point:
- Build `ZeroHashExchangeAdapter` implementing `ExchangePort`
- Remove Stripe PSP adapter (fiat movement becomes direct)
- Zero Hash replaces Bridge for custody-grade operations
- Bridge may remain for on/off-ramp convenience

---

## Idempotency

`X-SCX-IDEMPOTENCY-KEY` header. Format: `xnumia-zh-{transactionId}-{operation}`.

---

## Evidence Retention

Same as other providers — raw API responses and webhook payloads stored in R2 with 7-year retention.
