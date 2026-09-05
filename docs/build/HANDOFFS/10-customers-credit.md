# Handoff 10 — Customers & Credit

**Module:** M06 customer records and M07 customer credit/debt behavior

**Status:** Implemented in-memory domain slice; persistence/API integration remains downstream

## Outcome

`src/domain/customersCredit.ts` implements a business-scoped customer and
credit/debt ledger. Credit is represented as an outstanding business
obligation derived from source events, not as a generic payment label, wallet,
or stored-money balance.

The implementation supports:

- customer records with the current B03/C08 minimum identity: name and phone;
- explicit credit status: allowed, restricted, or blocked;
- configurable per-customer credit limits;
- separate Manager/Owner approval for every credit sale;
- separate Manager/Owner exception approval when a sale exceeds the limit;
- multiple independent debts per customer;
- multiple and partial repayments, including one repayment allocated across
  multiple debts;
- aggregate and per-debt outstanding balances;
- optional due dates with due/overdue visibility;
- approved returns that reduce obligation without rewriting the original sale;
- authorized write-offs with reasons;
- disputes that remain visible and do not erase debt;
- authorized sale-amount corrections and credit-sale reversals;
- append-only customer/credit history and duplicate-event idempotency.

## Business rules used

- B03 sections 2–19: customer credit, limits, minimum identity, multiple sales,
  repayments/allocation, no wallet, write-offs, disputes, due dates, history,
  restriction, returns, and corrected debt.
- C08 sections 4–40: customer identity, status, limit, outstanding summary,
  repayment allocation, no wallet, history, returns, disputes, and write-offs.
- B04 sections 5–7: approved returns reduce credit-sale obligation while
  preserving original sales and payments.
- Finance handoff: `customerOutstanding` derives balance from obligations,
  repayments, return credits, write-offs, and authorized corrections.
- H03: separate management approval and requester/approver separation for
  consequential credit actions.

## Authorization and tenant boundaries

- Every customer, debt, and history event carries `businessId`.
- Lookups and mutations are keyed by business plus record ID; another business
  cannot read or mutate the same customer ID.
- Credit sale approval uses `canApprove`, requiring Manager/Owner authority and
  a different requester/approver identity.
- Over-limit credit requires an additional separate Manager/Owner exception.
- Management-only operations include credit status and limit changes, return
  approval, write-off, correction, reversal, and dispute resolution.
- Staff may record a confirmed repayment or raise a dispute where the outer
  authorization adapter permits it. This domain engine does not replace the
  authoritative session/permission service.

## Historical and audit behavior

- Customer creation, status changes, limit changes, credit sales, repayments,
  returns, write-offs, corrections, reversals, disputes, and dispute
  resolutions are retained as history events.
- Each credit-affecting event records actor, role where applicable, timestamp,
  client event ID, customer/debt/sale references, amount, resulting balance,
  reason where required, approvals where applicable, repayment components, and
  debt allocations.
- Original sale amounts and repayment events are never overwritten.
- Corrections are additive adjustment events; reversals record the remaining
  obligation reduction and preserve repayments already received.
- Duplicate client event IDs return the original event and do not create a
  second financial effect.
- No customer wallet, stored-credit balance, top-up, withdrawal, or generic
  account credit exists in this module.

## Files changed

- `src/domain/customersCredit.ts`
- `src/domain/customersCredit.test.ts`
- `docs/build/HANDOFFS/10-customers-credit.md`
- `docs/build/BUILD-STATUS.md`

## Verification

`src/domain/customersCredit.test.ts` covers:

- eligible customer credit;
- blocked and restricted/ineligible customer handling;
- normal credit sale;
- over-limit rejection;
- authorized over-limit exception;
- multiple sales;
- partial repayment across multiple debts;
- full repayment;
- return against debt;
- correction and reversal;
- duplicate repayment;
- write-off and dispute visibility/resolution;
- optional due date and overdue state;
- tenant isolation and complete event history/auditability.

Required validation results:

```text
npm ci                                       PASS
npm test                                      PASS (62 tests)
npm run lint                                  PASS
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npm run format:check                          PASS
npx prettier --check <customers/credit files> PASS
git diff --check                              PASS
```

## Known limitations

- This is an in-memory domain engine. Durable database transactions, migration
  storage, API envelopes, offline synchronization, conflict ordering, and
  report read models remain downstream.
- The module does not execute external money movement or payment-provider
  confirmation. It accepts only explicit confirmed-success repayment components.
- Sales, inventory, customer-return inventory, incentive recalculation, and
  cash reconciliation integration are not implemented here.
- Customer search, identity correction, address/photo configuration, and UI
  presentation remain downstream because this slice is the domain ledger.
- Restricted credit is deliberately rejected with a stable error because the
  additional management-handling rule is not specified. No policy was invented.

## Unresolved decisions

The Product Bible still marks **minimum required customer profile information**
as an unresolved user decision. B03 and C08 consistently establish Name + Phone
as the credit-record minimum, while Address and Photo are optional downstream.
This slice implements only Name + Phone as mandatory and does not require or
store address or photograph. Optional profile configuration must be decided
before adding those fields.

The exact restricted-credit management-handling rule also remains unresolved.
Blocked credit is rejected; restricted credit is surfaced as requiring a
configured rule rather than silently treating it as allowed.

## Excluded modules

- No customer wallet or generic stored-credit balance.
- No incentive payout logic.
- No supplier debt behavior.
- No inventory movement, cash reconciliation, refund settlement execution, or
  reporting module.
- No durable persistence, authentication provider, API, or offline-sync
  implementation.
