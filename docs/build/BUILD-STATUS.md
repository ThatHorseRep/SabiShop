# Sabi Shop Build Status

**As of:** 2026-09-07

## Overall

The engineering foundation, the application shell/design system, the POS
selling workspace, the inventory/purchasing workspace, and the implemented
domain slices are verified. Persistence, authentication/authorization
integration, the remaining domain screens, and the remaining modules are still
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

## Verified offline synchronization slice

**Module:** M13 - offline synchronization and conflict resolution
**Status:** IMPLEMENTED REFERENCE BOUNDARY; durable API integration pending
**Handoff:** `docs/build/HANDOFFS/14-offline-sync.md`

Implemented durable-shaped local operation envelopes, globally unique
caller-supplied operation identities, separate device identity, independent
state dimensions, deterministic operation fingerprints, idempotent acceptance,
bounded retry, causal ordering, rejected/failed/conflict/superseded states,
server-side authorization recheck, tenant-scoped queues, management conflict
escalation, explicit human supersession, write-ahead local recovery, and
corrupt-state preservation. Adversarial tests cover duplicate delivery,
identity reuse, timeout after acceptance, app restart, stale clients, partial
batch failure, causal cycles, denial, tenant isolation, retry bounds, conflict
resolution, interrupted writes, and corrupted local state.

The in-memory server and browser storage classes are reference adapters. The
authoritative database/API transaction, domain-specific conflict classifiers,
management review queue, and production retry schedule remain downstream.

## Current module assessment

## Verified PWA and device-resilience slice

**Module:** M15 — PWA shell and device resilience
**Status:** IMPLEMENTED FOUNDATION; production API/cache integration pending
**Handoff:** `docs/build/HANDOFFS/15-pwa.md`

Implemented install metadata, shell service-worker caching with offline navigation fallback, explicit update activation, connection/sync visibility, local-storage failure handling, and mobile viewport/touch defaults. The UI consumes the existing offline-sync storage boundary and does not duplicate sync or business rules.

## Verified application shell and design-system slice

**Module:** Cross-cutting application UI foundation
**Status:** IMPLEMENTED FOUNDATION; domain screens pending
**Handoff:** `docs/build/HANDOFFS/17-application-shell-design-system.md`

Implemented the C03 token system (Geist typography, closed spacing and radius
scales, semantic color roles, restrained surfaces, motion with reduced-motion
support), the C04 adaptive hybrid shell (desktop rail, tablet compact rail,
mobile bottom navigation plus More drawer, role-aware navigation over the real
permission model, persistent system-state and attention indicators), and the
shared component library with the complete operational state vocabulary
(loading, empty, error, permission denied, authorization required, offline,
sync pending, sync conflict, correction required, rejected, completed,
cancelled). Fonts are bundled locally for offline use. No business data,
metrics, or placeholder records are rendered.

## Verified POS selling-workspace slice

**Module:** M07 POS user experience (C06)
**Status:** IMPLEMENTED WORKSPACE on the verified domain engines; persistence/API integration pending
**Handoff:** `docs/build/HANDOFFS/18-pos-ux.md`

Implemented the production POS interface in `src/pos/`: fast product search
and basket building with quantity and stock-visibility, line price editing
with discount and floor-preview, per-sale tax, cash/transfer/POS-card/
credit/custom methods with explicit successful-payment confirmation, split
payments that must settle the total exactly, customer lookup/creation with
credit assessment, deliberate management approval for below-floor, free
sale, stock-exception, credit, and over-limit actions, unmistakable
completion with receipts and historical prices, offline sales with sync
pending and synchronize actions, and the abandon-sale guard. The UI contains
no business rules: pricing previews, totals, credit assessment, completion,
and sync envelopes all delegate to the tested `src/domain` engines and the
`src/sync` boundary. Verified on desktop and mobile viewports in a browser
against the production build.

Validation on 2026-09-07 (clean install):

```text
npm ci                       PASS (268 packages, 0 vulnerabilities)
npm run format:check         PASS
npm run lint                 PASS
npm test                     PASS (157 tests, 17 files)
npm run build                PASS
npx tsc -b --pretty false    PASS
git diff --check             PASS
npx prettier --check <POS slice files>  PASS
```

Responsive audit: 19 viewport widths from 320px to 1600px measured with zero
horizontal overflow; the two-column layout holds from 1200px, the sticky sale
bar stacks above mobile bottom navigation, and the base `min-width: 320px`
was removed so classic-scrollbar viewports do not force horizontal scroll.

## Implemented inventory and purchasing UX slice

**Module:** M08/M09 — Inventory, purchasing, receiving, and supplier-return UX
**Status:** IMPLEMENTED WORKSPACE; durable API/persistence integration pending
**Handoff:** `docs/build/HANDOFFS/19-inventory-purchasing-ux.md`

Implemented the Products & Inventory workspace in `src/inventory/`, installed
behind the existing C04 application shell and synchronized with the current
reference session actor/business context:

- operational overview with exceptions and recent source-linked activity;
- product discovery and detail with permission-aware cost context;
- event-derived sellable/held stock and explicit negative-stock exceptions;
- physical-count investigation and authorized append-only correction;
- management-owned receiving with actual quantity, bonus stock, discount,
  effective acquisition-cost preview, payment, and supplier payable;
- supplier records, purchase/payment history, and remaining liabilities;
- supplier return workflow with payable reduction, supplier credit, separate
  replacement receipts, and separate settlement outcomes;
- filterable inventory history tracing stock → movement → source record →
  correction/return, with a source-transaction panel for the selected purchase,
  sale, supplier return, replacement, or investigation.

The interface contains no generic editable stock field. Every mutation passes
through `executeAuthorized`; Staff purchasing controls and cost information are
hidden, and offline management mutations remain denied under the current policy.
The workspace uses in-memory engines plus the labeled reference session/seed
adapter; durable persistence and the real authentication provider remain
downstream.

Validation on 2026-09-07:

```text
npm ci                                      PASS (268 packages, 0 vulnerabilities)
npm run format:check                        PASS
npm test                                     PASS (166 tests, 18 files)
npm run lint                                 PASS
npm run build                                PASS
npx tsc -b --pretty false                    PASS
npx prettier --check <inventory slice files> PASS
git diff --check                             PASS
```

Repository-wide formatting now passes after normalizing working-tree line
endings; no authorization source changes were needed. The Vitest timeout was
raised to 15 seconds to remove parallel-run POS timeouts on this machine.

## Verified canonical reporting slice

**Module:** M12 - business performance and management visibility
**Status:** IMPLEMENTED REFERENCE PROJECTION
**Handoff:** `docs/build/HANDOFFS/16-reporting.md`

Implemented `CanonicalReporting` as a tenant-scoped, event-time projection of
canonical sales, returns/corrections, inventory, credit, supplier, cash, and
optional expense/incentive source records. Reports preserve signed additive
effects for reversals and approved exceptions, expose tax separately, use the
canonical Gross Profit formula, surface negative stock and cash discrepancies,
and return traceable source IDs. No incentive payout logic was added.

Focused reporting tests cover known sale, tax, COGS, payment, valuation,
reversal, period-boundary, incentive-eligibility, and traceability scenarios.

## Verified audit and historical-integrity slice

**Module:** M04 - audit, integrity, and correction evidence
**Status:** VERIFIED REFERENCE INFRASTRUCTURE
**Handoff:** `docs/build/HANDOFFS/13-audit-integrity.md`

Implemented a shared append-only audit contract with tenant-scoped querying,
stable operation-id retry deduplication, accepted/denied/failed/recovered
results, actor/session/device context, correction/reversal/recovery links,
recursive secret-key redaction, and immutable returned snapshots. The
foundation migration now enforces the corresponding operation identity and
result fields with a business-scoped uniqueness constraint while preserving
RLS and the no-update/no-delete trigger.

Authorization decisions write through the normalized contract shape; domain
engines continue to preserve their existing detailed correction and
reconciliation snapshots until the durable adapter is connected.

## Verified cash/reconciliation slice

**Module:** M11 - operational business-day and cash reconciliation
**Status:** IMPLEMENTED DOMAIN SLICE
**Handoff:** `docs/build/HANDOFFS/12-cash-reconciliation.md`

Implemented explicit business-day sessions, management-confirmed opening cash,
cash-in/out/sales/refunds paid from till, Expected Cash, physical Actual Cash,
variance and unresolved discrepancy handling, interim checkpoints, shared or
individual custody accounts, closure, audited reopen, and additive audit history.

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

## Verified returns, corrections and reversals slice

**Module:** M10 — Customer returns, refunds, and corrections
**Status:** IMPLEMENTED DOMAIN SLICE
**Handoff:** `docs/build/HANDOFFS/11-returns-corrections.md`

Implemented:

- Customer return request, verification, approval, rejection, and application.
- Partial returns with sellable/held inventory consequences.
- Refund `due` and `settled` states without external money execution.
- Additive ordinary, material, and high-integrity sale corrections.
- Configurable correction window with the 15-minute default.
- Manager/Owner authority, separate approval, and Owner review flags for
  consequential Manager self-corrections.
- Audit snapshots preserving original and corrected actor, reason, time,
  values, authorization, state, and downstream effects.
- Inventory, financial, reporting, and credit recalculation through existing
  domain engines.
- Controlled reversal, dependent-event blocking, duplicate/offline idempotency,
  and explicit local/pending/accepted synchronization states.

| Area                                        | Status                                                 | Evidence                                                                            |
| ------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Product vision and V1 boundary              | BUILD-READY                                            | `01-product-vision.md`, `50-mvp-scope.md`                                           |
| Locked business decisions                   | BUILD-READY                                            | `00-final-decision-register.md` and reconciled specifications                       |
| Business invariants and state rules         | BUILD-READY                                            | `03`–`10`, `27`, `28`, `55`, H01–H02                                                |
| Application foundation                      | VERIFIED                                               | `docs/build/HANDOFFS/01-foundation.md`                                              |
| Application shell and design system         | IMPLEMENTED FOUNDATION                                 | `docs/build/HANDOFFS/17-application-shell-design-system.md`                         |
| Tenant/database foundation                  | IMPLEMENTED; execution environment pending             | `migrations/001_foundation.sql`, `docs/build/HANDOFFS/02-database-tenancy.md`       |
| M08 inventory/costing                       | VERIFIED DOMAIN SLICE                                  | `src/domain/inventory.ts`, `src/domain/inventory.test.ts`                           |
| M09 purchasing/supplier liabilities/returns | VERIFIED DOMAIN SLICE; integration pending             | `src/domain/purchasing.ts`, `docs/build/HANDOFFS/08-purchasing-suppliers.md`        |
| M08/M09 inventory & purchasing UX           | IMPLEMENTED WORKSPACE; API/persistence pending         | `src/inventory/`, `docs/build/HANDOFFS/19-inventory-purchasing-ux.md`               |
| M07 sales/payments/credit/receipts          | IMPLEMENTED DOMAIN SLICE; integration pending          | `src/domain/sales.ts`, `docs/build/HANDOFFS/09-sales.md`                            |
| M07 POS selling workspace (C06)             | IMPLEMENTED WORKSPACE; persistence integration pending | `src/pos/`, `docs/build/HANDOFFS/18-pos-ux.md`                                      |
| M06 customers and customer credit           | VERIFIED DOMAIN SLICE; integration pending             | `src/domain/customersCredit.ts`, `docs/build/HANDOFFS/10-customers-credit.md`       |
| M05 catalogue/pricing/search                | BUILD-READY; integration pending                       | `37-catalog-and-search.md`                                                          |
| M10 customer returns/refunds/corrections    | IMPLEMENTED DOMAIN SLICE; integration pending          | `src/domain/returnsCorrections.ts`, `docs/build/HANDOFFS/11-returns-corrections.md` |
| M13 offline sync/conflicts                  | IMPLEMENTED REFERENCE BOUNDARY; integration pending    | `src/sync/offlineSync.ts`, `docs/build/HANDOFFS/14-offline-sync.md`                 |
| M11 cash/reconciliation                     | VERIFIED DOMAIN SLICE; integration pending             | `src/domain/cashReconciliation.ts`, `docs/build/HANDOFFS/12-cash-reconciliation.md` |
| M15 V1 integration/acceptance               | BLOCKED                                                | dependent modules and unresolved technical decisions                                |

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
