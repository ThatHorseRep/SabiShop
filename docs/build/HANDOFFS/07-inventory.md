# Handoff 07 — Inventory Engine

**Module:** M08 inventory and costing  
**Status:** Implemented domain slice; persistence/API integration remains downstream

## Outcome

`src/domain/inventory.ts` implements an append-only, movement-driven inventory
engine. It deliberately does not expose a mutable stock setter. Current stock,
valuation, negative-stock visibility, and explanations are derived from the
preserved movement ledger.

Supported commands and views:

- physical receipts with supplier/acquisition unit cost;
- completed-sale deductions and offline-safe digital receipt data;
- approved customer returns linked to the original sale;
- supplier returns linked to the original receipt;
- sellable versus held stock;
- supplier-return-compatible movement type in the event model;
- signed inventory adjustments with a required reason;
- weighted-average inventory valuation;
- historical COGS captured on the sale event;
- provisional/undetermined COGS for negative-stock sales;
- negative-stock exception visibility;
- latest reliable acquisition cost for replacement-cost comparison;
- historical reconstruction through a ledger sequence;
- client-event idempotency and optimistic version checks for concurrent writes;
- event references, actor, timestamps, reasons, and business scope for traceability.

Money is represented as integer kobo (`bigint`). Quantities are represented as
base units scaled by 1,000, allowing fractional quantities without binary
floating-point truth. Output/reporting layers can format these values for the
configured product unit.

## Invariants and behavior

- Every stock change appends an event; no event is updated or deleted.
- Negative sellable stock is permitted so operations are not blocked, but the
  returned stock level marks `negative_stock` and `explain()` states that
  management investigation/reconciliation is required.
- A later receipt records the full physical quantity; it never nets against or
  erases an earlier negative sale.
- A sale captures the applicable weighted-average cost at sale time. If no
  reliable positive stock cost exists, its provisional quantity is explicit and
  COGS is zero rather than fabricated.
- Return events retain the original sale reference and condition. Held returns
  do not increase sellable stock.
- Duplicate client event IDs return the original event without a second
  business effect. A stale expected version fails with a typed concurrency
  error.

## Tests

`src/domain/inventory.test.ts` covers receiving and weighted-average costing,
sales and receipts, sellable/held returns, adjustments, negative stock and
later receipts, historical reconstruction, duplicate submission, and stale
concurrent movement rejection.

| Required check                       | Result                          | Evidence or boundary                                                                                                                             |
| ------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Normal workflow                      | PASS                            | Receipt → sale → customer return/supplier return → adjustment flows                                                                              |
| Unauthorized use                     | NOT APPLICABLE in this slice    | Authorization belongs to the tenant/permissions adapter; the in-memory domain core accepts already-authorized commands and does not invent roles |
| Saved data and history               | PASS for domain history         | Append-only event list, event references, sequence reconstruction, and no mutable stock setter                                                   |
| Offline, retry, and failure behavior | PASS for relevant core behavior | Duplicate client-event retry is idempotent; stale versions fail without mutation; provisional negative-stock cost remains explicit               |
| Reports and related modules          | NOT APPLICABLE                  | No report, persistence, finance, catalogue, or purchasing adapter exists in this slice; valuation output preserves their documented boundaries   |

Final repository checks passed:

- `npm test` — 9 tests passed;
- `npm run build` — TypeScript and Vite production build passed;
- `npm run lint` — passed;
- Prettier check for the slice files — passed;
- `git diff --check` — passed.

Run with:

```text
npm test -- --run src/domain/inventory.test.ts
```

## Integration contract

The persistence adapter must store `InventoryEvent` records append-only,
enforce `(business_id, client_event_id)` uniqueness, and execute command
append plus derived projection updates in one transaction. It must preserve
the event sequence/version as an ordering boundary and map business identity
through the foundation tenant/RLS boundary. A database projection may cache
stock and valuation, but it is never authoritative over the event ledger.

The sales, purchasing, returns, finance, and catalogue modules consume this
engine through commands and identifiers; they must not directly mutate stock.
Finance should consume sale-event COGS and valuation output while keeping
selling value, replacement cost, payables, and cash distinct.

## Known boundary

The in-memory engine is the tested domain core. Durable PostgreSQL migration,
authorization/approval enforcement, synchronization conflict resolution, and
provisional-cost settlement adjustments belong to the persistence and
integration modules. Those adapters must retain the original sale and append
an explicit cost-resolution adjustment when reliable acquisition information
later resolves provisional COGS.

Unresolved implementation decisions remain outside this slice: the durable
database adapter, API envelope, authentication/authorization provider,
offline synchronization conflict policy, approval workflow, quantity
formatting by catalogue unit, and report persistence/read models. No product
rules were added to resolve those decisions.
