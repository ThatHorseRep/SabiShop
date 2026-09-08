# Handoff 22 — Management Dashboard

**Module:** M12 — Management dashboards and business visibility
**Status:** IMPLEMENTED WORKSPACE over the canonical reporting projection and
verified domain engines; durable persistence/API integration remains
downstream
**Date:** 2026-09-08
**Spec authority:** C01 (`12-information-architecture.md` sections 5.1, 12,
16, 17, 25–26, 30.1), C02 (`13-user-journeys-and-task-flows.md` journeys 25,
30–32), C03 (`14-design-system.md` sections 9, 22–26, 55–59, 67.1),
B12 (`31-financial-model.md` financial truth and performance views),
B13 (`55-salesperson-performance-and-incentive-rules.md` sections 3, 12, 20),
B09/H03/35-permissions (authorization), H05 (financial metric contracts),
H01 (domain invariants)
**Domain handoffs consumed:** 03 (authorization), 07 (inventory), 08
(purchasing/suppliers), 09 (sales), 10 (customers/credit), 11
(returns/corrections), 12 (cash reconciliation), 13 (audit/integrity), 14
(offline sync), 16 (canonical reporting), 17 (application shell/design
system), 18–21 (workspace UX precedents)

## Outcome

`src/management/` implements the C01 Management destination as a
decision surface, not a decorative dashboard. It is mounted in the existing
C04 `AppShell` at the **Management** navigation destination, which requires
the `audit:read` permission, so only Manager and Owner roles can reach it.

The workspace is **read-only by design**:

- every figure comes from `CanonicalReporting` (Handoff 16) or directly from
  the same verified domain engines the projector consumes;
- no alternate business calculation exists in `src/management/`;
- no mutation method is exposed — the controller has no write path;
- corrections, returns, reconciliation, and resolutions happen in the owning
  workspaces (Money & Reconciliation, Products & Inventory, Customers &
  Credit, Suppliers & Purchasing), and the dashboard links to them.

## Composition

`ManagementController` composes the verified engines
(`SalesTransactionEngine`, `InventoryEngine`, `CustomersCreditEngine`,
`PurchasingEngine`, `ReturnsCorrectionsEngine`,
`CashReconciliationEngine`, `CatalogPricing`) and feeds them plus the
expense adapter records and incentive policy into `CanonicalReporting`.
The reference dataset is seeded in-memory following the Handoff 18–21
pattern; it does not share state with the other workspace seeds (documented
limitation below).

## Implemented surfaces

- **Overview (C01 §5.1, §12.1):** canonical business performance for an
  explicit event-time period — Net Recognized Selling Value, Tax (kept
  first-class and separate), COGS, Gross Profit displayed with its formula
  (Net Recognized Selling Value − COGS), expenses, and the payment mix
  (cash/non-cash/credit distinct). A Position panel shows inventory
  remaining and valuation, stock health, cash in drawer with expected and
  variance, customer credit outstanding, and supplier obligations, each
  labelled with its owning-record basis. The period is selectable
  (24 hours / 7 days / 30 days) and always stated with the event-time basis
  and source-trace count.
- **Attention (C01 §12.2, C02 journey 25):** items derived from real engine
  state only — unresolved cash discrepancies, negative stock, sale returns
  awaiting verification/approval, Owner-review flags on consequential
  manager self-corrections, unconfirmed supplier payments, and overdue
  customer credit. Each item states what happened, the business consequence,
  and exactly where it is resolved, with a button that navigates to the
  owning application area.
- **Sales (C01 §25, C02 journeys 31–32):** the canonical sales figures, then
  the underlying sales records with per-sale net/tax/profit/totals and
  derived states (`Completed`, `Completed — Partially returned`,
  `Completed — Fully returned`, `Completed — Reversed`). Sales with report
  events in the period are listed first; older sales can be included for
  context. A sale detail dialog walks summary → record → business event →
  history: the intact original record, payments with confirmations and
  references, lines, inventory effect IDs, signed report events
  (`sale.completed`, `sale.correction.applied`, …), return and correction
  history with Owner-review flags, the payment-correction delta, and where to
  act.
- **Money & expenses (B05, B12):** the live reconciliation session —
  confirmed opening cash, expected cash with its component breakdown,
  actual counted cash, variance, and discrepancy state — the cash activity
  with reasons and actors, the reconciliation audit history, and expense
  records with a note that they are reporting adapter inputs until the
  durable expense read model exists. Owner withdrawals are explicitly not
  folded into expenses.
- **Inventory (B06):** stock health from the append-only movement ledger —
  sellable, held, total, provisional quantity, weighted-average cost, value,
  movement counts, and last movement per product — plus a stock-exceptions
  panel for negative stock that explains the provisional-cost consequence
  and points to the owning workspace.
- **Credit & suppliers (B03, B02):** per-customer outstanding with debt
  snapshots (`Current`/`Due`/`Overdue`), due dates, and recent credit
  history; per-supplier outstanding with purchase, payment
  (confirmed/pending state), and supplier-return records. Credit is never
  collapsed into a generic balance, and supplier liability is explicitly not
  an operating expense.
- **Staff & incentives (B13 §3, §12, §20):** per-salesperson qualifying
  sales, net selling value, COGS, and gross profit using the same canonical
  contract as the business totals; incentive visibility with the policy
  facts (enabled state, configured percentage, minimum qualifying sales),
  per-person status (`eligible` provisional / `pending` volume gate /
  `disabled` / not measured), eligible value above floor, contributing sale
  event IDs, and a recent activity feed across sales, returns, corrections,
  cash, credit, and supplier payments. Released incentives are shown as
  "Not shown" because no release records exist and release/payout is owned
  by the incentive module. The unapplied pending return is called out as
  having no effect until applied, because unapplied exceptions emit no
  report event.

## Investigation flow

The workspace implements the required movement:

```text
summary → attention → record → business event → history/correction/resolution
```

Summary metrics link to the Sales records; attention items link to the
owning workspace; sale records open to the original record, its signed
business events, and its correction/return history; and every dead end
states where the authorized correction or resolution is performed. The
dashboard itself records no changes anywhere.

## Canonical defects fixed at source

Wiring the dashboard surfaced two defects that would have produced wrong or
missing canonical numbers; both were fixed where they live and pinned with
tests:

1. **`src/reporting.ts` cash accumulator** — the reduce started from
   `undefined` actual/variance, so every counted snapshot was discarded and
   cash exceptions never appeared in reports. The accumulator now starts at
   zero while any missing count still makes the total undefined.
   (`src/reporting.test.ts` pins summed variance and the missing-count case.)
2. **`src/domain/sales.ts` per-sale Gross Profit** — the engine computed
   `totals − tax − COGS`, double-subtracting exclusive tax and disagreeing
   with the H05 §8 contract (`Gross Profit = Net Recognized Selling Value −
COGS`) and with the corrections engine's own snapshot math. It now
   computes `totalDue − tax − COGS`, which is the net recognized selling
   value under both exclusive and inclusive tax modes.
   (`src/domain/sales.test.ts` pins the taxed-sale figure.)

## Authorization, tenant, and role boundaries

- The Management destination requires `audit:read`; staff never see it in
  navigation (C01 §16.1, C04) and receive a permission-denied state with no
  financial figures if the reference session switches to staff while the
  workspace is open.
- No staff-only or owner-only information crosses roles: everything shown is
  business-performance and attention data that Manager and Owner are both
  authorized to see; incentive visibility follows B13 §20 (Owner/Manager).
- All engine reads are scoped to the single `businessId`; the reporting
  projector is tenant-scoped by construction (Handoff 16).
- The dashboard is read-only, so there are no approval or separation-of-duty
  decisions to enforce here; those remain in the owning workspaces and
  `executeAuthorized` boundary.

## Files changed

- `src/management/managementController.ts` — read-only composition of the
  verified engines plus `CanonicalReporting`; period options; view builders
  for sales, stock, credit, suppliers, cash, staff, and attention; reference
  seed.
- `src/management/ManagementWorkspace.tsx` — Management destination shell:
  reference session, permission gate, period selector, tabs.
- `src/management/OverviewSection.tsx`, `SalesSection.tsx`,
  `MoneySection.tsx`, `InventorySection.tsx`,
  `CreditSuppliersSection.tsx`, `StaffSection.tsx` — the six surfaces.
- `src/management/ManagementShared.tsx`, `managementFormat.ts`,
  `management.css` — shared C03-pattern components, formatters, and
  token-based styles.
- `src/management/ManagementWorkspace.test.tsx` — focused workspace tests.
- `src/reporting.ts`, `src/reporting.test.ts` — canonical cash-variance fix
  and its pinning test.
- `src/domain/sales.ts`, `src/domain/sales.test.ts` — canonical per-sale
  gross-profit fix and its pinning test.
- `src/App.tsx`, `src/App.test.tsx` — Management destination mounting,
  cross-area navigation for resolution, and the staff-denial test.
- `docs/build/BUILD-STATUS.md`, this handoff.

## Tests and verification

Focused workspace tests (`src/management/ManagementWorkspace.test.tsx`) cover:

- staff permission denial (no financial figures, no tabs) and recovery when
  the session returns to management;
- canonical overview figures for the default 24-hour event-time period,
  including tax kept separate and the Gross Profit formula hint;
- position balances (inventory value, negative-stock count, counted cash
  with expected and variance, credit outstanding, supplier obligations);
- all six attention items with consequence and resolution pointers, plus the
  deep-link into the owning area;
- the sales drill-down: period-filtered records, the sale detail dialog with
  payments/totals/business events, the corrected sale showing its signed
  `sale.correction.applied` effect, the pending return, and the Owner-review
  flag;
- cash reconciliation exception state, cash activity, reconciliation audit
  history, and expense records;
- stock health including the negative-stock exception and provisional cost;
- credit/supplier records with overdue and unconfirmed-payment states;
- staff performance, incentive visibility without payout logic, contributing
  sale events, and activity;
- period switching changing the canonical figures and staff eligibility
  state.

App-level tests cover mounting the Management destination for a management
session and denying staff. Reporting and sales tests pin the two canonical
fixes.

Full validation on 2026-09-08:

```text
npm ci                                         PASS (268 packages, 0 vulnerabilities)
npm run format:check                           PASS
npm run lint                                  PASS (0 errors, 0 warnings)
npm test                                       PASS (215 tests, 21 files)*
npm run build                                  PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <management slice files> PASS
git diff --check                              PASS
```

\* `npm test` passed 215/215 twice on this machine earlier in the day
(111 s and 305 s runs). During the final re-check the machine was under
sustained extreme load (module collect times 3–5× normal), and unrelated
pre-existing files (`src/customers`, `src/exceptions`, `src/pos`) hit the
15 s per-test timeout under full parallelism while every management, App,
reporting, and sales test passed in every run. Those files pass in
isolation (35/35 and 19/19), and the complete suite passes 215/215 with
constrained parallelism (`npx vitest run --maxWorkers=2 --minWorkers=1`).
This extends the machine-specific parallel-run timeout sensitivity already
documented for the 15 s Vitest timeout in `docs/build/BUILD-STATUS.md`;
no test code or timeout configuration was changed in this slice.

Browser verification (production build via `vite preview`, 390 px and
1280 px): no horizontal overflow on the exercised tabs; the sale drill-down
dialog, the attention deep-link into Money & Reconciliation, and the staff
permission-denied state were exercised interactively. Screenshots archived
under `work/` (gitignored): `management-overview-desktop.png`,
`management-overview-mobile.png`,
`management-sale-detail-dialog.png`, `management-money-desktop.png`,
`management-staff-desktop.png`. Automated layout checks were run; human
visual review was not available in this environment.

## Known limitations and unresolved decisions

- The workspace uses in-memory engines and a reference seed dataset, like
  Handoffs 18–21. Durable persistence, API envelopes, real authentication,
  durable audit storage, and durable sync storage remain downstream.
- Each workspace currently keeps its own in-memory seed, so navigating from
  an attention item opens the owning workspace rather than the exact same
  record instance. The durable, business-scoped API transaction will unify
  the underlying data; the workspace structure and tests are designed to
  survive that swap.
- Expenses and the incentive policy are explicit reporting adapter inputs
  until durable expense/incentive read models exist (Handoff 16 limitation).
  No durable expense entry screen exists yet.
- The attention builder reads `listOwnerReviewRequired` and tracked return
  records from the returns/corrections engine; once that engine gains a
  durable list API the controller should consume it directly instead of
  tracking seeded return IDs.
- No charts are implemented. C03 §55 permits management visuals only when
  explainable and connected to source records; the record-linked tables and
  timelines implement that requirement for V1, and any chart addition must
  remain secondary to the figures and their drill-downs.
- Exact statutory report formats, accounting journal integration, owner
  withdrawal read models, and multi-period comparisons remain open and were
  not invented here.
- The permission mapping remains the reference-adapter policy; the exact
  operation-level permission catalogue (H03 §7) must be finalized before
  production. No new permission ID was invented.

## Excluded modules

- No incentive payout, release, recovery, or payroll logic (B13; M12 owns
  eligibility only, and the UI states where release is owned).
- No mutation of sales, inventory, credit, supplier, cash, audit, or
  exception records; no deletion or historical editing of any kind.
- No accounting journal, statutory reporting, tax filing, or external
  accounting integration.
- No database migrations, API contracts, authentication provider, or
  offline conflict resolution UI.

## Next integration step

Replace `ManagementController`'s in-memory engines and reference seed with
the durable, business-scoped reporting read model: a tenant-filtered,
event-time query API over the accepted event log that returns the same
`BusinessPerformanceReport` shape plus the record drill-downs, with explicit
freshness/staleness labelling for cached read models (M12 contract). Attach
durable authorization (`audit:read` plus any finalized report-level
permissions), connect expenses and incentive policy to their durable
configuration, and make the attention items consume the durable review
queues so the deep-links resolve to the exact records. The workspace states
and tests should remain structurally unchanged for that swap.
