# Sabi Shop Build Status

**As of:** 2026-09-05

## Overall

The foundation and catalog/pricing slice are implemented and verified. Other
domain modules remain outside this slice and retain their prior readiness or
decision status.

## Foundation slice

**Status:** VERIFIED

The React/Vite TypeScript shell, strict checks, Vitest setup, accessible error
boundary, environment guidance, CI baseline, and foundation handoff remain
unchanged.

## Catalog/pricing slice

**Status:** IMPLEMENTED AND VERIFIED

Implemented:

- Product identity with business-local SKU uniqueness.
- Category, unit, aliases, model/part identifiers, active state, and sale
  availability.
- Current selling price and explicit acceptable price floor using integer kobo.
- Owner/Manager-only pricing and status configuration.
- Append-only price history with actor and timestamp facts.
- Search by name, SKU, category, unit, alias, and model/part identifier.
- Fixed and percentage discounts.
- Configurable below-floor behavior with authorization enforcement for the
  default blocking mode.
- Immutable sale-line pricing snapshots.
- Incentive pricing facts: amount above effective floor and minimum completed
  sales volume gate, without incentive payout logic.
- Recalculation inputs after returned, cancelled, reversed, or corrected
  sale-line status.

Evidence:

- `src/domain/catalogPricing.ts`
- `src/domain/catalogPricing.test.ts`
- `migrations/002_catalog_pricing.sql`
- `docs/build/HANDOFFS/06-catalog-pricing.md`

## Verification

```text
npm ci                  PASS
npm test -- --run       PASS (10 tests)
npm run lint -- --quiet PASS
npm run build           PASS (TypeScript + Vite production build)
npx prettier --check    PASS (changed catalog/pricing files)
git diff --check        PASS
```

The tests cover normal pricing, unauthorized pricing configuration and
below-floor use, saved sale-line snapshots and price history, invalid/failing
attempts followed by retry, discounts, lookup, inactive products, and
incentive volume-gate recalculation.

The existing application-shell test remains passing. No reports, sales,
inventory, returns, corrections, or incentive-payout modules were changed;
their existing behavior is preserved by scope. PostgreSQL migration execution
was not run because `psql` is unavailable in this environment.

## Offline, retry, and failure boundaries

The in-memory domain operation does not implement device persistence,
synchronization, or retry idempotency. Its relevant failure behavior is
covered: rejected operations do not append sale evidence, and a later valid
attempt can complete. Offline storage, sync conflict handling, and
business-scoped database execution remain owned by the foundation/sync
modules.

## Unresolved decisions and limitations

- The migration assumes the foundation `app` schema and authorization
  functions from `001_foundation.sql`.
- Exact service/API envelopes, offline conflict ordering, and database
  repository wiring remain deferred to their owning modules.
- Returns, cancellations, reversals, and material corrections currently enter
  pricing facts through sale-line status; their authoritative workflows remain
  outside this slice.
- Incentive payout, release, recovery, and payroll behavior are intentionally
  not implemented.
- No product rules beyond the Product Bible, D04, catalog specification,
  authorization baseline, and incentive handoff were introduced.

## Module status

| ID      | Module                               | Status                   |
| ------- | ------------------------------------ | ------------------------ |
| M00     | Decision and specification control   | IN PROGRESS              |
| M01     | Platform/domain primitives           | VERIFIED                 |
| M02     | Identity/membership/sessions         | REQUIRES DECISION        |
| M03     | Roles/permissions/approvals          | BUILD-READY              |
| M04     | Audit/integrity/corrections evidence | BUILD-READY              |
| M05     | Catalogue/pricing/search             | IMPLEMENTED AND VERIFIED |
| M06–M15 | Other domain and integration modules | UNCHANGED                |
