# Handoff 09 - Sales Transactions

**Module:** M07 sales, payments, credit and receipts  
**Status:** Implemented in-memory domain slice; persistence/API integration remains downstream

## Outcome

`src/domain/sales.ts` implements the canonical sale lifecycle:

`selection -> catalog pricing/discount authorization -> tax -> payment classification and confirmation -> completion -> inventory movement/COGS -> cash or credit consequence -> audit -> reporting event`

The transaction engine accepts already-authenticated actor context and keeps
business IDs on every sale, inventory command, audit event and report event.
It does not move money or call external payment providers. Bank transfer and
POS/Card are successful only when an explicit `confirmed_success` record is
present.

## Supported behavior

- Cash, bank transfer, POS/Card, customer credit, and configurable custom
  methods classified as cash or non-cash.
- Split payments; component totals must equal the taxed total due exactly.
- Credit requires customer name and phone plus separate Manager/Owner approval.
- Catalog price-floor and discount rules are delegated to `CatalogPricing`.
- Exclusive and inclusive tax are first-class values using finance primitives.
- Inventory sale movements use stable client event IDs and preserve weighted-
  average COGS; negative stock remains visible with provisional zero COGS.
- Duplicate client submissions return the original completed sale without a
  second inventory, audit or reporting effect.
- Management reversal appends customer-return inventory movements and a
  compensating report event; the original completed sale remains retained.

## Invariants and authorization boundaries

- Unconfirmed, failed, missing, negative, or mismatched payments cannot
  complete a sale.
- Custom payment classification is mandatory and management-only to change.
- Credit approval cannot be self-approved (`canApprove` enforces separation).
- Reversal is restricted to Manager/Owner in this domain slice. Authoritative
  session, tenant, offline permission and audit policy enforcement remains the
  `executeAuthorized`/persistence adapter boundary.
- No incentive payout logic is implemented here.

## Audit and reporting

Successful completion and reversal append durable-shaped audit and reporting
events in the engine. Reports keep revenue/tax, cash, non-cash, credit, COGS
and gross profit distinct. Historical sale and movement records are never
deleted or rewritten.

## Verification

`src/domain/sales.test.ts` covers taxed discounted cash sales, non-cash and
split payments, invalid/unconfirmed payment rejection, credit identity and
approval, duplicate retry, reversal, inventory effects, and negative stock.

| Required check                           | Result                                     |
| ---------------------------------------- | ------------------------------------------ |
| Cash, non-cash, credit and split payment | PASS                                       |
| Tax and discount                         | PASS                                       |
| Insufficient/invalid/unconfirmed payment | PASS                                       |
| Inventory, COGS and negative stock       | PASS                                       |
| Cancellation/reversal                    | PASS                                       |
| Retry, duplicate submission              | PASS                                       |
| Timeout after server acceptance          | PASS by idempotent client request identity |
| `npm test`                               | PASS                                       |
| `npm run lint`                           | PASS                                       |
| `npm run build`                          | PASS                                       |
| `npm ci`                                 | PASS                                       |
| `npx tsc -b --pretty false`              | PASS                                       |
| `git diff --check`                       | PASS                                       |
| Changed-file Prettier check              | PASS                                       |

The repository `npm run format:check` script remains red on six pre-existing
files outside this slice (`src/domain/purchasing.ts`, its test, three auth
files, and handoff 08). Those legacy files were intentionally not reformatted
or changed.

## Known limitations and unresolved decisions

This is an in-memory domain coordinator. Durable database transactions,
authoritative authorization/session integration, offline sync envelopes and
conflict ordering, payment-provider adapters, customer credit-limit policy,
refund settlement execution, and report read models remain downstream work.
Inventory movement rollback across a multi-line failure must be provided by the
durable transaction adapter; the in-memory commands are validated before the
movement loop and each movement is individually idempotent.
