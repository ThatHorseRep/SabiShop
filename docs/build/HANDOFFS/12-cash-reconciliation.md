# Handoff 12 — Cash Reconciliation

**Status:** IMPLEMENTED DOMAIN SLICE  
**Module:** M11 — operational business-day and cash reconciliation

## Outcome

`src/domain/cashReconciliation.ts` implements an in-memory operational
business-day/session engine. A session may remain open across midnight until
management closes it. Staff can enter opening cash and physical counts; only
Manager/Owner can confirm official opening cash, prepare/resolve reconciliation,
close a day, or reopen a closed day.

## Implemented rules

- Confirmed Opening Cash is management-owned and preserves staff entry as audit evidence.
- Expected Cash is `Confirmed Opening Cash + cash received from completed sales + Cash In − Cash Out − cash refunds paid from till`.
- Cash events are explicitly typed; non-cash payments are outside this engine and do not increase Expected Cash.
- Actual Cash is a physical observation recorded for reconciliation, not a routine dashboard field.
- Variance is `Actual Cash − Expected Cash`; non-zero variance becomes an unresolved investigation signal.
- Management may close with an unresolved discrepancy; it remains visible and open.
- Reconciliation follows `open_session -> count_recorded -> reconciliation_prepared -> management_confirmed -> closed`.
- Manager/Owner reopen requires a reason and produces an audit event.
- Interim counts are management checkpoints and never close a session.
- Shared-drawer and individual-salesperson custody modes are supported through `cashAccountId`.
- Cash events are additive and immutable in the in-memory history; duplicate event IDs are idempotent.

## Authorization and tenant boundaries

Every session/event is keyed by `businessId`. Staff may record operational
cash events and physical counts; management controls official figures,
reconciliation, closure, discrepancy resolution, and reopen. The engine is
designed to sit behind the authoritative session/tenant authorization adapter.

## Historical and audit behavior

Opening confirmation, cash movements, interim counts, actual counts,
reconciliation preparation, closure, discrepancy resolution, and reopen all
append audit evidence. No source event or closed-day record is deleted or
silently rewritten.

## Files changed

- `src/domain/cashReconciliation.ts`
- `src/domain/cashReconciliation.test.ts`
- `docs/build/HANDOFFS/12-cash-reconciliation.md`
- `docs/build/BUILD-STATUS.md`

## Verification

Focused tests cover canonical Expected Cash, zero-value counts, interim
checkpoints, unresolved discrepancy closure, audited reopen, individual
salesperson custody, management-confirmed closure, and tenant isolation.

## Known limitations / unresolved decisions

This is an in-memory domain boundary. Durable persistence, server-side
authorization, offline synchronization, configurable cash-out approval
thresholds, and integration adapters for sales and return settlement events
remain downstream. Accounting balance and incentive payout logic are excluded.

## Excluded modules

- Accounting balances and general-ledger classification.
- Incentive calculation or payout logic.
- Payment-provider execution or verification.
- Durable database/API/offline-sync adapters.
