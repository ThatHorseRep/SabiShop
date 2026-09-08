# Handoff 23 — Staff Dashboard

**Module:** Staff Home / staff-facing daily work surface (C01 §5.1 Staff Home;
consumes M07 sales, M11 cash, M06 customers, M08 inventory, M10 returns,
M12 canonical reporting)
**Status:** IMPLEMENTED WORKSPACE over the verified domain engines and the
canonical reporting projection; durable persistence/API integration remains
downstream
**Date:** 2026-09-08
**Spec authority:** C01 (`12-information-architecture.md` sections 5.1, 10.1,
16.1, 17, 25–26, 30.1, 30.3), C02 (`13-user-journeys-and-task-flows.md`
journeys 01–08, 12, 15–16, 26, 30 and the role × journey matrix), C03
(`14-design-system.md` sections 4, 9, 11, 24–26, 49, 67.1), B05
(`06-cash-and-reconciliation-rules.md` sections 3, 8, 10–15, 22, 28 and the
final reconciliation), B09 (`10-roles-and-permissions.md` sections 3.3, 7, 15,
16, 21, 30), B13 (`55-salesperson-performance-and-incentive-rules.md`
sections 3–4, 6, 11–16, 20), H03 (authorization matrix), H05 (financial metric
contracts), H06 (offline/sync doctrine)
**Domain handoffs consumed:** 03 (authorization), 07 (inventory), 09 (sales),
10 (customers/credit), 11 (returns/corrections), 12 (cash reconciliation),
14 (offline sync), 16 (canonical reporting), 17 (application shell/design
system), 18–22 (workspace UX precedents)

## Outcome

`src/staff/` implements the C01 Staff Home as the staff member's daily work
surface, mounted at the **Home** navigation destination for staff-role
sessions. The dashboard is built around normal work, not analysis: today's
operational context, own sales, Cash in Hand and money-out activity,
stock/product access, customer collection work, personal performance where
permitted, actionable exceptions, and honest sync/offline state.

The workspace is **read-only by design**:

- every figure is either a plain presentation of verified engine records or
  the canonical reporting projection — no alternate business calculation
  exists in `src/staff/`;
- no mutation method is exposed — the controller has no write path;
- selling, cash movements, counting, returns, and corrections happen in the
  owning workspaces (Sell, Money & Reconciliation, Products & Inventory,
  Customers & Credit), and the dashboard links to them;
- there is **no routine Actual Cash entry or tab** anywhere on the surface.
  Cash in Hand is the operational concept, labelled with its basis
  (expected-not-counted, or the last physical count), and the UI states that
  Actual Cash exists only as a deliberate physical count in Money &
  Reconciliation (B05 final reconciliation; C09 §42 precedent).

## Composition

`StaffController` composes the verified engines (`SalesTransactionEngine`,
`InventoryEngine`, `CustomersCreditEngine`, `ReturnsCorrectionsEngine`,
`CashReconciliationEngine`, `CatalogPricing`) and feeds them into
`CanonicalReporting` for the personal performance projection. The reference
dataset is seeded in-memory following the Handoff 18–22 pattern; it does not
share state with the other workspace seeds (documented limitation below).

"Today" is scoped to the **open business-day session** (from the
`business_day.opened` audit event), which may cross midnight until official
closure — not a calendar day (B05 final reconciliation).

## Implemented surfaces

- **Sync and device (H06; C02 journeys 26/28):** online/offline state, sync
  pending and conflict counts, and storage/update warnings from the real POS
  sync queue, with the explicit doctrine that offline is a mode of operation,
  authorization does not change with connectivity, and conflicts go to
  management review without overwriting accepted records. Links to the shell
  system-state drawer.
- **Today at a glance:** business-day state, custody mode, Cash in Hand with
  its basis, own sale count/total/cash component, money-out total, and quick
  actions (Start a sale, Record a repayment, Cash movements & counting) gated
  by the real permission set.
- **My sales today (B09 §30):** only sales attributed to the signed-in staff
  member inside the business day, with payment-method summaries and derived
  return states (`Completed`, `Partially returned`, `Fully returned`,
  `Reversed`). Business-wide figures, other staff members' sales, costs, and
  margins never appear.
- **Cash in Hand and money out (B05):** Cash in Hand (operational view,
  never an input), management-confirmed opening cash, and every cash-out and
  cash-refund event with reason and actor. Cash-out approval policy is stated
  as management-configured, never assumed.
- **Needs my attention:** actionable exceptions derived from real engine
  state only — open returns the staff member requested (awaiting management
  decision, with "changes nothing until applied"), negative stock (selling
  continues; management investigates), and overdue/due credit collection
  work. Each item states what happened, why it matters, and what to do next,
  with a button into the owning workspace.
- **My performance (B13):** qualifying sales progress against the volume
  gate, own net recognized selling value, and — only while the incentive
  policy is enabled — the provisional incentive-eligible value above the
  floor. Everything is labelled provisional; the release schedule and
  decision belong to management; open returns on the staff member's sales are
  listed as items that can still change the figures once applied; floor
  semantics (₦0 at the floor, current price as effective floor when
  unconfigured, below-floor held for review) are stated.
- **Stock and products (C01 §5.1, §16.1):** inline product search with
  current selling price and stock state (in stock / out of stock / stock
  exception), and the negative-stock exception panel. Cost and margin
  information is never shown.
- **Customer work:** credit customers with outstanding debt (overdue/due
  first) that the staff member may collect from where permitted, and the
  repayments the staff member recorded today (confirmed payments only).
- **My activity today:** the staff member's own recorded work (sales, return
  requests, cash events, repayments) in one feed.

## Role and navigation boundary

- Home renders the staff dashboard for staff-role sessions. Management
  sessions keep the honest foundation Home plus an "Open Management" pointer;
  the C01 §5.1 Manager/Owner Home remains a separate downstream deliverable
  and was not invented here.
- Staff never see the Management destination in navigation (it requires
  `audit:read`), and switching the reference session to management while on
  Home removes the staff work surface rather than leaking it (tested).
- No management-only reporting or controls exist on the staff surface: no
  business-wide totals, COGS/gross profit, expenses, supplier liabilities,
  other staff members' data, unrestricted audit history, or configuration.

## Canonical incentive-recalculation defect fixed at source

Exposing personal incentive visibility surfaced a canonical defect that would
have misrepresented eligibility: the `CanonicalReporting` staff projection
processed only `sale.completed` and `sale.reversed` events, so **applied
returns and corrections never recalculated per-salesperson figures**, and
reversals did not decrement the qualifying-sales count (B13 §3, §11, §13).
Both were fixed where they live and pinned with tests:

1. **`src/domain/returnsCorrections.ts`** — `IntegrityReportEvent` now carries
   `incentiveEligibleValueKobo`, the signed, floor-aware delta computed where
   the original sale lines still carry their effective floors: returns
   subtract the above-floor value of returned lines; quantity corrections
   subtract/add the per-unit above-floor value of the quantity change.
   (`returnsCorrections.test.ts` pins both deltas.)
2. **`src/reporting.ts`** — the staff projection now processes every signed
   additive event (completed, reversed, return-applied, correction-applied,
   reversal-applied) for net value, COGS, and gross profit; decrements the
   qualifying-sales count for reversals and for sales whose entire value has
   been returned; and applies the engine's floor-aware eligible-value deltas.
   (`reporting.test.ts` pins a partial return, a full return that fails the
   volume gate, a reversal, and a floorless normal-price sale contributing
   ₦0.)

The management dashboard's staff test was updated for the corrected
semantics: a correction applied inside the period now produces an honest
signed entry for the attributed salesperson instead of being silently
ignored.

## Authorization, tenant, and role boundaries

- The workspace reads only the single `businessId` from the reference
  session; the reporting projector is tenant-scoped by construction.
- Personal performance comes from the canonical projection only, so the staff
  dashboard can never disagree with management's figures (C01 §26).
- The dashboard is read-only, so no approval or separation-of-duty decisions
  are made here; those remain in the owning workspaces and the
  `executeAuthorized` boundary.
- Staff visibility of incentives follows policy enablement in the reference
  adapter; a separate business-level "expose to staff" setting remains an
  unresolved decision (B13 §23.8) and was not invented.

## Files changed

- `src/staff/staffController.ts` — read-only composition of the verified
  engines plus `CanonicalReporting`; session-scoped snapshot builders;
  reference seed.
- `src/staff/StaffWorkspace.tsx` — Home destination shell: reference session,
  sync panel, section layout, read-only footer.
- `src/staff/StaffSections.tsx`, `StaffShared.tsx`, `staffFormat.ts`,
  `staff.css` — the eight surfaces and token-based shared components/styles.
- `src/staff/StaffWorkspace.test.tsx` — focused workspace tests.
- `src/domain/returnsCorrections.ts` — floor-aware
  `incentiveEligibleValueKobo` on integrity report events.
- `src/reporting.ts` — staff projection recalculates from returns,
  corrections, and reversals.
- `src/domain/returnsCorrections.test.ts`, `src/reporting.test.ts` — pinning
  tests for the canonical fix.
- `src/App.tsx`, `src/App.test.tsx` — role-aware Home mounting (staff
  dashboard for staff sessions; foundation Home + Management pointer for
  management) and boundary tests.
- `src/management/ManagementWorkspace.test.tsx` — updated for the corrected
  canonical staff semantics.
- `docs/build/BUILD-STATUS.md`, this handoff.

## Tests and verification

Focused workspace tests (`src/staff/StaffWorkspace.test.tsx`) cover:

- the normal-work surface: business-day state, Cash in Hand with its
  expected-not-counted basis and the no-Actual-Cash-entry boundary note, six
  in-session sales with yesterday's sale excluded by the session boundary,
  and both money-out events with reasons;
- honest provisional performance: the "gates passed so far" chip, the
  eligible value, the release boundary note, the open return that can still
  change the figures, and the applied partial return already reflected in the
  derived sale state;
- stock/product access without cost or margin information, including the
  negative-stock exception and working search;
- customer collection work and own recorded repayments;
- sync state surfacing without blocking local work;
- navigation to the owning workspaces for real work.

App-level tests cover the staff Home mounting, the management pointer on the
management Home, and the staff/management Home boundary in both directions.
Reporting and domain tests pin the canonical incentive recalculation.

Full validation on 2026-09-08 (clean install):

```text
npm ci                                        PASS (268 packages, 0 vulnerabilities)
npm run format:check                          PASS
npm run lint                                  PASS (0 errors, 0 warnings)
npm test                                      PASS (224 tests, 22 files)
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <staff + changed files>  PASS
git diff --check                              PASS
```

Browser verification (production build via `vite preview`, ~304 px mobile
width): the full staff dashboard renders with no horizontal overflow
(`scrollWidth == clientWidth`), all sections are present, and switching the
reference session to management on Home replaces the staff work surface with
the foundation state plus the Management pointer — no staff work data leaks.
The in-app browser's viewport capability was unavailable in this environment,
so the 1280 px two-column grid was not interactively exercised; it reuses the
same `minmax(0, …)` grid and 1023 px collapse pattern verified for the
management workspace in Handoff 22, and the automated suite covers the
content at both mount points.

## Known limitations and unresolved decisions

- The workspace uses in-memory engines and a reference seed dataset, like
  Handoffs 18–22. Durable persistence, API envelopes, real authentication,
  durable audit storage, and durable sync storage remain downstream.
- Each workspace keeps its own in-memory seed, so the staff dashboard's
  reference business day is not the same instance as the POS or Money &
  Reconciliation seeds; the durable, business-scoped API transaction will
  unify the underlying data.
- The incentive projection period is the current business day; the
  management-configured release period (weekly/biweekly/monthly) remains
  unmodelled, so the volume gate is presented as today's progress with that
  caveat stated (B13 §23.4).
- Staff incentive exposure is tied to policy enablement in the reference
  adapter; an explicit business-level staff-visibility setting remains an
  unresolved decision (B13 §23.8).
- The returns engine has no durable list API, so the controller tracks seeded
  return IDs to derive open returns and sale return states (same limitation
  as Handoff 22's attention builder).
- The C01 §5.1 Manager/Owner Home (Total Sales, Total Expenses, Cash in Hand
  business view, performance attention) remains downstream; management users
  currently get the foundation Home plus the Management pointer.
- Period-boundary signed effects (for example a return applied today for a
  sale completed before the session) follow the same event-time additive
  semantics as the business totals and can produce negative in-period values;
  this is stated canonical behaviour, not a staff-specific rule.

## Excluded modules

- No incentive payout, release, recovery, or payroll logic (B13; release is
  owned by the incentive module, and the UI says so).
- No mutation of sales, inventory, credit, cash, audit, or exception records;
  no deletion or historical editing of any kind.
- No Actual Cash entry, count, reconciliation, closure, or resolution
  controls — counting and reconciliation belong to Money & Reconciliation
  with management confirmation.
- No management reporting, controls, configuration, supplier visibility, or
  unrestricted audit history on the staff surface.
- No database migrations, API contracts, authentication provider, or offline
  conflict resolution UI.

## Next integration step

Replace `StaffController`'s in-memory engines and reference seed with the
durable, business-scoped read models: a tenant-filtered, event-time query API
that returns the same `StaffSnapshot` shape (business-day session, own sales,
cash-in-hand basis, money-out events, stock states, collection list, canonical
personal performance, attention, activity) with explicit freshness labelling
for cached read models. Attach durable authorization (the finalized
operation-level permission catalogue from H03 §7), and make the open-return
and return-state derivations consume durable list APIs so tracked IDs
disappear. The workspace states and tests should remain structurally
unchanged for that swap.
