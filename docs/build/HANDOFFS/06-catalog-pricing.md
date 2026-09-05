# Handoff 06 — Catalog and Pricing

## Outcome

The catalog/pricing domain is implemented in `src/domain/catalogPricing.ts`.
It provides business-scoped product identity, SKU uniqueness, category/unit
metadata, aliases and model/part lookup, active/available status, current
selling price, explicit price floor, price-change history, discounts, and
floor-aware sale-line pricing.

Money is represented as integer kobo. Product configuration operations require
an Owner or Manager authorization in the domain layer; UI visibility or a
direct caller cannot bypass that check. Below-floor sales are blocked by
default until an Owner/Manager approval is supplied, while the resulting line
retains a review flag.

Completed sale lines snapshot product identity, actual unit price, effective
floor, discount, and exception state. Later product edits only update the
current product and append price history; they never mutate completed sale
lines.

## Incentive handoff

`getIncentivePricingFacts` exposes the later incentive module's pricing facts:
actual selling value, effective floor value, amount above floor, below-floor
status, qualifying completed-sales count, configured minimum volume gate, and
whether that gate is met. It does not calculate or record incentive payouts.
The facts are recomputed from retained sale lines so later returns,
cancellations, reversals, and material corrections can be reflected through
the sale-line status transition without changing the original pricing
snapshot.

## Persistence

`migrations/002_catalog_pricing.sql` adds business-scoped products, aliases,
and append-only price-change records with restrictive foreign keys and RLS.
The migration uses integer kobo and prevents a configured floor from exceeding
the current selling price.

## Verification matrix

| Scenario                 | Coverage                                                    |
| ------------------------ | ----------------------------------------------------------- |
| Normal pricing           | `catalogPricing.test.ts`                                    |
| Unauthorized use         | staff pricing configuration and below-floor rejection tests |
| Price-floor violation    | configuration and sale-line tests                           |
| Authorized exception     | below-floor authorization test                              |
| Discounts                | fixed/percentage discount test                              |
| Historical immutability  | sale-line snapshot test                                     |
| Failed attempt and retry | rejected sale does not save; valid retry succeeds           |
| Product lookup           | SKU, alias, and model/part search test                      |
| Inactive products        | lookup and sale rejection test                              |

## Boundaries

Sale lifecycle, stock effects, returns/corrections, authentication, and
incentive payout/release remain owned by their respective modules. This slice
only supplies immutable pricing evidence and the later incentive calculation
inputs.

## Verification record

Passed:

- `npm ci`
- `npm test -- --run` — 10 tests
- `npm run lint -- --quiet`
- `npm run build`
- `npx prettier --check` for changed catalog/pricing files
- `git diff --check`

The PostgreSQL migration was reviewed statically but not executed because
`psql` is unavailable in the build environment. Offline persistence, sync
retry idempotency, reports, inventory, returns, corrections, and incentive
payouts are outside this slice; their modules were not modified.
