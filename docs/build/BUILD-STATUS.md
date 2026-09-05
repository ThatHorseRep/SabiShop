# Sabi Shop Build Status

**As of:** 2026-09-05

## Overall

The engineering foundation and the M08 inventory domain slice are implemented
and verified. Persistence, authentication/authorization integration, offline
synchronization, reporting, and the remaining domain modules are still
downstream work.

## Verified foundation

- React + Vite TypeScript application shell.
- Strict TypeScript, ESLint, Prettier, and Vitest configuration.
- Reproducible `npm ci` installation.
- Accessible shell with status announcement and uncaught UI error recovery.
- Public-only environment guidance.
- GitHub Actions baseline for formatting, lint, tests, and build.
- Foundation and tenant-isolation migrations/tests documented in
  `docs/build/HANDOFFS/01-foundation.md` and
  `docs/build/HANDOFFS/02-database-tenancy.md`.

## Verified inventory slice

**Module:** M08 — Inventory and costing
**Status:** IMPLEMENTED DOMAIN SLICE
**Handoff:** `docs/build/HANDOFFS/07-inventory.md`

Implemented:

- Append-only inventory movement ledger.
- Receipts, sales deductions, customer returns, supplier returns, and
  adjustments.
- Sellable and held stock balances derived from movements.
- Weighted-average valuation and sale-time historical COGS.
- Explicit provisional COGS for negative-stock sales.
- Negative-stock exception visibility and explainability.
- Historical reconstruction by ledger sequence.
- Integer-kobo money and scaled base-unit quantities using `bigint`.
- Duplicate client-event idempotency and stale-version concurrency rejection.
- Offline-safe receipt data at the domain boundary.

Validation on 2026-09-05:

```text
npm test                                      PASS (9 tests)
npm run build                                 PASS
npm run lint                                  PASS
npx prettier --check <inventory slice files>  PASS
git diff --check                              PASS
```

The test suite covers the normal movement workflow, weighted-average
recalculation, returns, adjustments, negative stock, later receipts,
historical reconstruction, duplicate retry, and concurrent movement failure.
Authorization and durable saved-data tests are not claimed for this in-memory
slice; they belong to the tenant/persistence adapters. Report integration is
also not applicable because no report module exists yet.

## Current module assessment

## Verified sales transaction slice

**Module:** M07 - Sales, payments, credit and receipts
**Status:** IMPLEMENTED DOMAIN SLICE
**Handoff:** `docs/build/HANDOFFS/09-sales.md`

Implemented canonical sale completion with explicit payment confirmation,
split/custom payment classification, tax, credit approval, inventory/COGS,
cash and credit consequences, audit/report events, reversal, negative-stock
visibility, and client-request idempotency. Full validation passed after the
slice was added.

## Verified customers and credit slice

**Module:** M06 customer records and M07 customer credit/debt
**Status:** IMPLEMENTED DOMAIN SLICE
**Handoff:** `docs/build/HANDOFFS/10-customers-credit.md`

Implemented business-scoped customer records, Name + Phone credit identity,
credit eligibility, configurable limits, separate transaction and over-limit
management approvals, multiple debts, partial/multiple repayments with explicit
allocation, optional due dates, approved returns, write-offs, disputes,
authorized corrections/reversals, and append-only credit history. No customer
wallet or generic stored-credit balance was added.

## Verified purchasing and supplier slice

**Module:** M09 - Purchasing, suppliers, liabilities and supplier returns
**Status:** IMPLEMENTED DOMAIN SLICE
**Handoff:** `docs/build/HANDOFFS/08-purchasing-suppliers.md`

Implemented:

- Supplier records and business-scoped purchase history.
- Physical receiving linked to inventory receipt events.
- Multiple supplier payments and confirmed-success settlement accounting.
- Supplier return verification, approval and application history.
- Unpaid payable reductions versus paid supplier credit/receivable.
- Separate replacement receipt and refund/credit settlement events.

| Area                                        | Status                                     | Evidence                                                                      |
| ------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| Product vision and V1 boundary              | BUILD-READY                                | `01-product-vision.md`, `50-mvp-scope.md`                                     |
| Locked business decisions                   | BUILD-READY                                | `00-final-decision-register.md` and reconciled specifications                 |
| Business invariants and state rules         | BUILD-READY                                | `03`–`10`, `27`, `28`, `55`, H01–H02                                          |
| Application foundation                      | VERIFIED                                   | `docs/build/HANDOFFS/01-foundation.md`                                        |
| Tenant/database foundation                  | IMPLEMENTED; execution environment pending | `migrations/001_foundation.sql`, `docs/build/HANDOFFS/02-database-tenancy.md` |
| M08 inventory/costing                       | VERIFIED DOMAIN SLICE                      | `src/domain/inventory.ts`, `src/domain/inventory.test.ts`                     |
| M09 purchasing/supplier liabilities/returns | VERIFIED DOMAIN SLICE; integration pending | `src/domain/purchasing.ts`, `docs/build/HANDOFFS/08-purchasing-suppliers.md`  |
| M07 sales/payments/credit/receipts          | BUILD-READY; integration pending           | `27-sales-and-transaction-rules.md`                                           |
| M06 customers and customer credit           | VERIFIED DOMAIN SLICE; integration pending | `src/domain/customersCredit.ts`, `docs/build/HANDOFFS/10-customers-credit.md` |
| M05 catalogue/pricing/search                | BUILD-READY; integration pending           | `37-catalog-and-search.md`                                                    |
| M10 customer returns/refunds/corrections    | REQUIRES INTEGRATION                       | `05-returns-and-refunds-rules.md`                                             |
| M13 offline sync/conflicts                  | REQUIRES DECISION                          | `34-offline-sync.md`, H06, H11                                                |
| M11 cash/reconciliation                     | REQUIRES DECISION                          | `06-cash-and-reconciliation-rules.md`                                         |
| M15 V1 integration/acceptance               | BLOCKED                                    | dependent modules and unresolved technical decisions                          |

## Locked integration invariants

- No completed business record is deleted or silently overwritten.
- Every business-owned record is tenant-scoped at the authoritative boundary.
- Retried events are idempotent; conflicts preserve evidence and surface review.
- Inventory is derived from accepted movements; negative stock remains visible as
  an exception; weighted-average cost does not rewrite historical COGS.
- A transfer/payment is not successful until required confirmation exists.
- Tax/VAT remains first-class through sale, correction, return, and reporting.
- Gross Profit is Net Recognized Selling Value minus COGS.

## Known unresolved decisions

The inventory slice does not resolve the existing open decisions around API
envelopes, authentication provider, authorization/approval enforcement,
durable database/migration adapter, offline authority and conflict ordering,
quantity/unit formatting, report read models, tax mode, identity recovery,
retention/RPO/RTO, multi-branch boundaries, integrations, or exception
ownership. These remain tracked in the specification and clarification
registers; no new product rule was introduced here.
