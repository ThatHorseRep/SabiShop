# Handoff 16 - Canonical Reporting

**Status:** IMPLEMENTED REFERENCE PROJECTION
**Module:** M12 - business performance and management visibility

## Outcome

`src/reporting.ts` implements `CanonicalReporting`, a read-only projection over
the existing sales report events, inventory movement/valuation ledger, credit
history, supplier records, cash reconciliation observations/events, expenses,
and optional incentive policy. It does not create alternate business
definitions or mutate source records.

## Canonical behavior

- Net Recognized Selling Value is derived from report-event total less tax.
- Gross Profit is always Net Recognized Selling Value minus COGS.
- Sale reversals and return/correction report events are additive signed effects.
- Rejected or unapplied exception records are not included because they emit no
  canonical report event.
- Tax remains a separate first-class total.
- Payment mix keeps cash, non-cash, and credit distinct.
- Inventory remaining and weighted-average valuation come from the inventory
  ledger; negative stock remains visible as a product exception.
- Credit and supplier balances are derived from their canonical history/events.
- Cash uses reconciliation snapshots and cash events; it does not equate cash
  with profit.
- Staff metrics and floor-based incentive visibility are projections of sale
  attribution and pricing facts. No incentive payout or release logic is added.
- Every report includes an explicit event-time period and source traces/IDs.

## Authorization, tenant, and history boundaries

The projector requires a `businessId` and filters every source by that tenant.
It is intended to sit behind report-read authorization. It never edits or
deletes sales, inventory, debt, supplier, cash, audit, or exception history.
Offline/replayed events remain governed by the source engines' idempotency and
accepted-event boundaries; reporting only consumes accepted canonical events.

## Tests and validation

`src/reporting.test.ts` compares known transaction scenarios for tax, net value,
COGS, gross profit, payment classification, inventory valuation, incentive
eligibility, reversal additivity, traceability, and explicit period boundaries.

Required validation:

```text
npm test
npm run lint
npm run build
npx prettier --check src/reporting.ts src/reporting.test.ts src/domain/returnsCorrections.ts docs/build/HANDOFFS/16-reporting.md docs/build/BUILD-STATUS.md
```

## Known limitations / unresolved decisions

- Expenses, cash snapshots, and incentive policy are explicit adapter inputs
  until durable expense/incentive read models are implemented.
- The in-memory domain engines remain reference boundaries; durable report
  queries, authorization enforcement, and pagination are downstream.
- Exact management dashboard layout and statutory report formats remain outside
  this slice.

## Excluded modules

No incentive payout/release, accounting journal, payment execution, or durable
database/API adapter was added.
