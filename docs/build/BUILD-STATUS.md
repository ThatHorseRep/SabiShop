# Sabi Shop Build Status

**As of:** 2026-09-23

## Overall

The engineering foundation, the application shell/design system, the POS
selling workspace, the inventory/purchasing workspace, the customer/credit
workspace, the exceptions/reconciliation workspace, the management dashboard
workspace, the staff dashboard workspace, the public landing page, the
English/Nigerian Pidgin content foundation, the implemented domain slices, the
cross-domain integration journeys, the failure-injection suite, and the
Playwright role-journey E2E suite are verified. Persistence,
authentication/authorization integration, business onboarding/configuration,
user/permission administration, the remaining domain screens, and the remaining
modules are still downstream work.

## Verified end-to-end role-journey suite

**Module:** M15 — Browser E2E verification across Owner, Manager, and Staff journeys
**Status:** VERIFIED BROWSER/COMPOSITION E2E SUITE; production runtime gaps pending
**Handoff:** `docs/build/HANDOFFS/29-e2e.md`

Implemented:

- Playwright 1.63 Chromium suite with a Vite web server, 17 tests, and a
  dedicated 390 × 844 mobile-viewport journey.
- Owner, Manager, and Staff journeys covering performance, exceptions, stock,
  staff activity, returns, corrections, reconciliation/reopening, normal sales,
  payment methods, authorized credit, offline operation, and role-specific
  reconciliation boundaries.
- Failure/security journeys for permission denial, cross-tenant denial, failed
  payment, correction, return, sync-conflict escalation, and mobile layout.
- Business-truth assertions for stock reduction, customer debt, report formula,
  return settlement, correction history, cash variance, sync state, and failed
  payment effects — not merely navigation or button clicks.

Validation on 2026-09-23 (branch `thathorserep-e2e`):

```text
npm run test:e2e                               PASS (17 tests, 6.1 m)
npm test                                       PASS (27 files, 275 tests)
npm run lint                                   PASS
npm run build                                  PASS
npx tsc -b --pretty false                      PASS
npm run format:check                           PASS
npx prettier --check <changed code files>      PASS
git diff --check                               PASS
```

Environment notes for this validation: `npm ci` could not complete on this
Windows checkout because another local process held locks on
`node_modules/@phosphor-icons` (`ENOTEMPTY`/`EPERM`); an `npm install` into the
existing tree produced a working install used for the checks above. The
Playwright per-test timeout was raised to 180 s in `playwright.config.ts`
because journeys take 23–57 s each under two parallel workers on this machine
(a first run failed 9 of 17 tests purely on the 30 s default, with zero
assertion failures). A first `npm test` run recorded one 15 s timeout in
`src/exceptions/ExceptionsWorkspace.test.tsx` under full-machine contention;
that file passes in isolation and no product code changed.

Known limitations remain explicit in Handoff 29: the app still uses reference
sessions and in-memory engines; business creation/configuration and user
permission mutation are not implemented; cross-tenant enforcement is tested at
the composition boundary rather than a production API; and the browser conflict
test injects conflict state into a genuinely created offline operation because
no second-device backend exists.

## Verified failure-injection suite

**Module:** Cross-cutting domain, authorization, offline sync, local recovery and reporting reliability
**Status:** VERIFIED FAILURE-INJECTION SUITE; durable runtime/backup gates pending
**Handoff:** `docs/build/HANDOFFS/28-failure-testing.md`

Implemented:

- Adversarial tests for network loss, partial synchronization, timeout after
  server acceptance, duplicate delivery (including concurrent in-flight
  delivery), app restart, stale authorization, reordered causal events,
  simultaneous inventory edits, conflicting debt changes, conflicting
  corrections, invalid corrected values, and corrupt local state with WAL
  recovery.
- Six reliability fixes: credit corrections prevalidate debt effects before
  inventory changes; credit corrections/reversals require customer/debt
  lineage; impossible corrected quantities/payments fail closed; a valid WAL
  recovers corrupt main local state; concurrent duplicate server delivery joins
  one in-flight operation; stale offline authority is denied and escalated to
  management review.
- The exceptions composition adapter now passes credit lineage into corrections
  and reversals, preventing contradictory sale/debt state.
- Prompt-book triage on 2026-09-10 confirmed that backup/restore, production
  API/auth integration, runtime database execution, and final acceptance
  belong to future M14/M15 conversations. The past database-contract gap and
  unowned stale-authority safety gap were fixed in this follow-up.
- `migrations/003_sync_durability.sql` now persists immutable operation
  fingerprints, payloads, dependencies, responses, sequences, and append-only
  effect links; `tests/database/003_sync_durability.sql` prepares tamper,
  duplicate, accepted-effect, and rollback checks.
- Server authorization denial for an offline operation now blocks execution and
  escalates the local operation to management review.

Validation on 2026-09-10:

```text
npm test                                      PASS (27 files, 275 tests)
npm run lint                                  PASS
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <changed source files>   PASS
git diff --check                              PASS
tests/database/003_sync_durability.sql        NOT RUN — PostgreSQL/psql unavailable
```

Known release blockers remain explicit in Handoff 28: no runtime PostgreSQL
adapter executing the prepared transaction/effect contract, no backup/restore
test, no production API/auth/device revocation adapter, and formal H11 Q24
sign-off for the implemented fail-closed stale-permission default.

## Verified cross-domain integration suite

**Module:** M06–M13 integration journeys, authorization, sync and reporting
**Status:** VERIFIED INTEGRATION TEST SUITE
**Handoff:** `docs/build/HANDOFFS/27-integration-testing.md`

Implemented:

- Journey-level tests for the ten critical business operations: sale →
  payment → inventory → COGS → reporting; credit sale → debt → repayment;
  purchase → receiving → supplier obligation; supplier return → payable /
  credit / settlement; sale return consequences; correction → audit →
  recalculation; cash sale → Expected Cash → reconciliation; business-day
  lifecycle; offline sale → sync → authoritative state; authorization →
  operation → audit.
- Failure paths between components: refused payments, blocked and over-limit
  credit, illegal supplier-return states, cumulative over-returns,
  unauthorized corrections, premature/closed-day cash events, tampered sync
  identities, server-side authorization rejection and cross-business
  requests — each proven to leave no domain effect.
- Five specification-driven integration fixes: tax-inclusive return
  reversals and refunds; tax-consistent corrected totals; cumulative
  return-quantity guard; report reconciliation with confirmed supplier-return
  settlements; POS credit eligibility validated before the sale commits.

Validation on 2026-09-09:

```text
npm ci                                       PASS (252 packages, 0 vulnerabilities)
npm run format:check                         PASS
npm run lint                                 PASS
npm test                                     PASS (26 files, 263 tests)
npm run build                                 PASS
npx tsc -b --pretty false                    PASS
npx vitest run src/domain/integration.test.ts
                                             PASS (10 tests)
npx prettier --check <changed source files>  PASS
git diff --check                             PASS
```

Known gaps remain explicitly documented in Handoff 27: adapter-level cash
integration, durable multi-domain transactions, evidence-only refund
settlement, durable server-side sync replay, and the physical-count /
provisional-COGS / incentive-release items carried from Handoff 26.

## Verified cross-domain verification suite

**Module:** M06–M11 domain/state/finance/inventory/sales/credit/cash
verification
**Status:** VERIFIED DOMAIN TEST SUITE
**Handoff:** `docs/build/HANDOFFS/26-domain-testing.md`

Implemented:

- Consolidated public-boundary tests for state machines, exact money/tax,
  weighted-average costing, negative stock, payment states, credit, returns,
  corrections, cash reconciliation, tenant scope, authorization, idempotency
  and audit relationships.
- A full requirement → invariant → test coverage matrix in Handoff 26.
- A specification-driven fix so a failed or unconfirmed payment attempt can no
  longer leave a completed catalog pricing line before sale completion fails.

Validation on 2026-09-09:

```text
npm ci                                       PASS (252 packages, 0 vulnerabilities)
npm run format:check                         PASS
npm run lint                                 PASS
npm test                                      PASS (25 files, 252 tests)
npm run build                                 PASS
npx tsc -b --pretty false                    PASS
npx vitest run src/domain/domainVerification.test.ts
                                              PASS (11 tests)
npx prettier --check <changed source files>   PASS
git diff --check                              PASS
```

Known gaps remain explicitly documented in Handoff 26: physical inventory count
workflow, provisional negative-stock COGS settlement, automatic cash-event
integration, durable multi-domain transactions, and the H01/H02 wording tension
around closing a day with an unresolved cash discrepancy.

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

## Implemented customer and credit UX slice

**Module:** M06/M07 — Customer, credit/debt, and repayment UX (C08)
**Status:** IMPLEMENTED WORKSPACE; durable API/persistence integration pending
**Handoff:** `docs/build/HANDOFFS/20-customer-credit-ux.md`

Implemented the Customers & Credit workspace in `src/customers/`, installed
behind the existing C04 application shell and synchronized with the current
reference session actor/business context:

- customer overview with outstanding credit, an attention queue (restricted
  credit, disputed debts, overdue debts), recent repayments, and recent
  credit activity;
- customer list/search by name and phone with similar names kept
  distinguishable, and creation limited to the authoritative Name + Phone
  minimum identity;
- customer profile with the exact B03 credit statuses, credit limit and
  available credit, outstanding-debt summary, independently traceable debts,
  and full credit history;
- credit sale flow with consequence preview, separate Manager/Owner approval,
  and a second separate over-limit exception approval;
- repayment flow with confirmed payment components, split methods, and
  explicit allocation across multiple debts, including partial repayment;
- return impact that reduces the obligation without rewriting the original
  sale, write-offs distinguishable from Paid, corrections and reversals that
  preserve original state, and disputes that remain visible;
- exception/authorization states: restricted/blocked credit, permission
  denials, offline operation with sync-pending envelopes, sync conflict
  display, and three-part errors (what happened, whether anything was saved,
  what to do next).

Debt is never presented as an ambiguous generic “balance”: the workspace uses
precise financial terms (outstanding debt, remaining obligation, resulting
obligation, collectible outstanding amount), and the POS credit-approval copy
was corrected to match. The interface contains no free-edit balance field;
every mutation passes through `executeAuthorized` and the verified
`CustomersCreditEngine`.

Validation on 2026-09-07/08:

```text
npm ci                                       PASS (268 packages, 0 vulnerabilities)
npm run format:check                         PASS
npm test                                      PASS (189 tests, 19 files)
npm run lint                                  PASS
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <customer/credit files>  PASS
git diff --check                              PASS
```

Browser verification (production build, 320–1600 px) found no horizontal
overflow on the profile or credit-sale dialog; screenshots are archived with
the slice deliverables.

## Implemented exceptions and reconciliation UX slice

**Module:** M10/M11 — Returns, corrections, reversals, refund settlement, and
cash reconciliation UX (C09)
**Status:** IMPLEMENTED WORKSPACE; durable API/persistence integration pending
**Handoff:** `docs/build/HANDOFFS/21-exceptions-reconciliation-ux.md`

Implemented the Exceptions & Reconciliation workspace in `src/exceptions/`,
mounted at the Money navigation destination and synchronized with the current
reference session actor/business context:

- management review queue for returns awaiting verification/approval, refunds
  due, supplier returns, Owner-review flags, and cash discrepancies — every
  item states what happened, why it needs attention, its consequence, the
  requested action, and the required authority;
- sale returns linked to the intact original sale, with partial/full derived
  states, condition recording, separate management approval, applied
  inventory/debt/reporting effects, rejected attempts that apply nothing, and
  refund `Not required / Due / Settled` states recorded without executing
  money movement;
- supplier returns with settlement-state-aware consequence preview (unpaid
  purchase → payable reduction; paid purchase → supplier credit), separate
  replacement receipts, and recorded settlements;
- corrections with the correction-window state, original-versus-proposed
  comparison, consequence preview, mandatory reason, ordinary/material/
  high-integrity authority guidance, separate approvals, and preserved
  correction chains; deliberate reversal as a management action that is never
  presented as deletion;
- cash reconciliation with the four canonical B05 figures distinct —
  Expected Cash (derived, formula shown), Actual Cash (only from a deliberate
  physical count, never a routine dashboard input), Cash Variance
  (investigation-first discrepancy, not an accusation), and Cash in Hand
  (operational view, labelled when not yet counted) — plus interim counts,
  cash in/out with reasons, audited close/reopen with reasons, and
  payment-method totals that stay distinguishable;
- investigation/history timeline across sales, returns, corrections,
  reversals, supplier returns, cash, and authorization decisions, with
  filters and preserved audit-event counts.

Every mutation passes `executeAuthorized` with the operation's permission
before the verified domain engines (Handoffs 08, 11, 12) run. The Money
navigation destination is now staff-visible because staff must record cash
events, enter physical counts, and request returns (B05 §3, §22, §28; C09
§42); official figures, confirmation, closure, resolution, and reopen remain
management-only. No correction is ever disguised as deletion.

Validation on 2026-09-08:

```text
npm test                                      PASS (201 tests, 20 files)
npm run lint                                  PASS (0 errors, 0 warnings)
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <exceptions files>       PASS
```

Browser verification (production build, 390–1280 px) found no horizontal
overflow on any tab; the count-cash dialog and correction preview were
exercised interactively. Screenshots are archived with the slice deliverables
under `work/`.

## Implemented management dashboard slice

**Module:** M12 — Management dashboards and business visibility
**Status:** IMPLEMENTED WORKSPACE; durable API/persistence integration pending
**Handoff:** `docs/build/HANDOFFS/22-management-dashboard.md`

Implemented the Management workspace in `src/management/`, mounted at the
Management navigation destination (Manager/Owner only via `audit:read`) and
synchronized with the current reference session actor/business context:

- business performance over an explicit event-time period (last 24 hours /
  7 days / 30 days) using the canonical reporting projection only — sales,
  tax kept first-class, COGS, Gross Profit shown as Net Recognized Selling
  Value − COGS, expenses, and the cash/non-cash/credit payment mix;
- attention items derived from real engine state — unresolved cash
  discrepancies, negative stock, sale returns awaiting decisions, Owner-review
  flags on consequential manager self-corrections, unconfirmed supplier
  payments, and overdue customer credit — each stating what happened, the
  consequence, where it is resolved, and linking to the owning workspace;
- investigation drill-down: summary → attention → record → business event →
  history, including a sale detail dialog with the intact original record,
  payments, lines, inventory effects, signed report events, and return/
  correction history with resolution pointers;
- inventory remaining and stock health from the movement ledger (sellable,
  held, negative, provisional cost, weighted-average value);
- cash/reconciliation exception status with expected/actual/variance, cash
  activity, reconciliation audit history, and expense records;
- customer credit outstanding and supplier obligations with their underlying
  debt, purchase, payment, and return records;
- staff activity/performance and incentive visibility per the incentive rules
  (provisional eligible value above floor, volume gate, contributing sales)
  with no payout/release logic.

The dashboard is read-only: it exposes no mutation method, recalculates
nothing, and never becomes a second source of truth. Staff sessions receive a
permission-denied state instead of financial analysis. Two canonical defects
found while wiring the dashboard were fixed at their source and pinned with
tests: the reporting cash accumulator discarded counted variance (Handoff 16
bug), and the sales engine double-subtracted exclusive tax from per-sale
Gross Profit (H05 §8 contract).

Validation on 2026-09-08:

```text
npm test                                      PASS (215 tests, 21 files)
npm run lint                                 PASS (0 errors, 0 warnings)
npm run build                                 PASS
npx tsc -b --pretty false                    PASS
npx prettier --check <management slice files> PASS
```

Browser verification (production build, 390–1280 px) found no horizontal
overflow on the exercised tabs; the sale drill-down dialog, attention
deep-link into Money & Reconciliation, and the staff permission-denied state
were exercised interactively. Screenshots are archived under `work/`.

## Implemented staff dashboard slice

**Module:** Staff Home — staff-facing daily work surface over M06–M12
**Status:** IMPLEMENTED WORKSPACE; durable API/persistence integration pending
**Handoff:** `docs/build/HANDOFFS/23-staff-dashboard.md`

Implemented the staff dashboard in `src/staff/`, mounted at the Home
navigation destination for staff-role sessions and synchronized with the
current reference session actor/business context:

- sync/offline status from the real POS sync queue, with offline treated as a
  mode of operation and conflicts routed to management review;
- today's operational work scoped to the open business-day session (which may
  cross midnight): business-day state, custody mode, quick actions gated by
  the real permission set;
- Cash in Hand as the operational cash concept with its basis labelled
  (expected-not-counted or last physical count), management-confirmed opening
  cash, and every money-out event (cash out and cash refunds) with reason and
  actor — with no routine Actual Cash entry or tab anywhere;
- own sales only, with payment summaries and derived return states;
  business-wide figures, other staff members' sales, costs, and margins never
  appear;
- stock/product access with current prices and stock states (no cost or
  margin information), including the negative-stock exception;
- customer collection work (overdue/due credit first) and own recorded
  repayments;
- personal performance where permitted: qualifying-sales progress against the
  volume gate and provisional incentive-eligible value above the floor, all
  labelled provisional with open returns called out as items that can still
  change the figures once applied;
- actionable exceptions (open returns awaiting management decisions, negative
  stock, overdue credit) each stating what happened, why it matters, and what
  to do next, linking to the owning workspace;
- own activity feed across sales, return requests, cash events, and
  repayments.

The workspace is read-only and never becomes a second source of truth:
personal performance comes from the canonical reporting projection, and every
other figure is a plain presentation of verified engine records. Management
sessions keep the foundation Home plus an Open Management pointer; the C01
Manager/Owner Home remains downstream. Wiring the dashboard surfaced a
canonical defect that would have misrepresented incentive eligibility: the
reporting staff projection ignored applied returns and corrections and did
not decrement qualifying sales for reversals. It was fixed at the source —
integrity report events now carry a floor-aware
`incentiveEligibleValueKobo` delta and the projection recalculates from every
signed event — and pinned with tests.

Validation on 2026-09-08 (clean install):

```text
npm ci                                        PASS (268 packages, 0 vulnerabilities)
npm run format:check                          PASS
npm run lint                                  PASS (0 errors, 0 warnings)
npm test                                      PASS (224 tests, 22 files)
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <staff slice files>      PASS
git diff --check                              PASS
```

Browser verification (production build, ~304 px mobile width) found no
horizontal overflow; the full dashboard and the staff/management Home
boundary were exercised interactively. The 1280 px grid reuses the management
workspace's verified pattern (viewport control was unavailable in this
environment).

## Implemented public landing page slice

**Module:** C05 — Public landing page (marketing experience)
**Status:** IMPLEMENTED MARKETING PAGE; acquisition/onboarding path pending
**Handoff:** `docs/build/HANDOFFS/24-landing-page.md`

Implemented the public landing experience as a separate Vite entry
(`landing.html` + `src/landing/`) so the marketing page never loads the
operational application code, while sharing its visual DNA by consuming the
same C03 tokens, base styles, button/badge component classes, Geist
typeface, and Phosphor icon family:

- one conversion objective and one primary CTA (Get Started), with the
  final CTA matching it exactly; the temporary destination is the working
  product because onboarding does not exist yet, and no fake signup is
  presented;
- C05 page sequence: header, hero, problem recognition, five outcome
  pillars, tagline reveal, how it works (record, connect, see what needs
  attention), product areas, trust and control, audience fit, ten-question
  FAQ, final CTA, footer;
- the external landing-page methodology is followed for structure,
  copywriting discipline, scroll reveals, the floating glass pill nav with
  morphing mobile menu, and the word-by-word tagline reveal, while Sabi Shop
  product truth outranks it where they differ;
- no testimonials, user numbers, revenue claims, performance statistics,
  customer logos, or fabricated social proof; the hero visual is a
  representative sale workspace using the application's own seed catalogue
  and is labelled as example data; proof near claims is honest capability
  statements only;
- offline support is stated as a bounded capability, corrections as
  controlled and traceable, and no pricing, security, or legal claims are
  invented; the footer states that privacy and terms arrive with the public
  release;
- SEO/AEO: indexed page with title, meta description, Open Graph and
  Twitter tags, semantic landmarks, skip link, and FAQ structured data
  rendered from the same copy source; a noscript summary links to the
  product;
- accessibility: semantic HTML, keyboard-operable menu with focus wrap and
  Escape, native FAQ disclosures, visible focus, reduced-motion support,
  and progressive enhancement so all content renders fully without
  scripting or observers.

Validation on 2026-09-08:

```text
npm test                                      PASS (232 tests, 23 files)
npm run lint                                  PASS (0 errors, 0 warnings)
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <landing slice files>    PASS
git diff --check                              PASS
```

Browser verification (production build via `vite preview`, 390 px and
1440 px): no horizontal overflow at either width, hero/CTAs/tagline/FAQ/menu
exercised interactively, scroll reveals and tagline words activate through
IntersectionObserver, and the Geist typeface and shared button system render
as designed. Screenshots are archived under `work/`.

## Implemented language and Nigerian Pidgin content slice

**Module:** M14 — English/Nigerian Pidgin language and content infrastructure
**Status:** IMPLEMENTED FOUNDATION; native/experienced Pidgin review and domain-surface migration pending
**Handoff:** `docs/build/HANDOFFS/25-language-pidgin.md`

Implemented a typed semantic message catalogue and React language layer for
English and Nigerian Pidgin. The catalogue covers confirmations, errors,
loading, empty, permissions, authorization, offline, sync pending, sync
conflict, correction, payment states, debt, inventory, cash, and reporting.
Consequential confirmations state the actual business outcome, errors state
what happened/what was saved/what to do next, and financial concepts remain
distinct.

A reviewer-led plain-language pass is also applied. English uses **Stock**
consistently for stock/inventory language, while Nigerian Pidgin uses
**Goods**. English reporting labels now use plain wording such as “Total sales
after discount,” “Cost of stock sold,” and “Profit before expenses.” Internal
technical wording such as “reference session adapter” is kept out of main UI
copy.

Pre-publish defects were also fixed: duplicate Customers & Credit dialog keys,
invalid DataTable empty-state nesting, the production bundle-size warning, and
the two moderate Vitest audit findings.

The application shell, shared state components, overlays, confirmation reason
copy, loading labels, toasts, navigation, system-state indicator, Home
foundation copy, and POS abandon-sale guard now consume the language provider
and expose a two-language selector. Domain workspaces also received a plain-
English pass, but their copy is not yet fully migrated to the shared language
keys. No domain rule or calculation changed. Nigerian Pidgin production release
remains gated on native/experienced-speaker sign-off.

Validation on 2026-09-09:

```text
npm ci                                     PASS (253 packages; 0 vulnerabilities)
npm run format:check                       PASS
npm test                                    PASS (241 tests, 24 files)
npm run lint                                PASS (0 errors, 0 warnings)
npm run build                               PASS
npx tsc -b --pretty false                   PASS
npx prettier --check <language/UI changes>  PASS
git diff --check                            PASS
```

The final validation has no React key warnings, no DataTable HTML-nesting
warning, no Vitest audit findings, and no bundle-size warning.

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

| Area                                         | Status                                                       | Evidence                                                                            |
| -------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Product vision and V1 boundary               | BUILD-READY                                                  | `01-product-vision.md`, `50-mvp-scope.md`                                           |
| Locked business decisions                    | BUILD-READY                                                  | `00-final-decision-register.md` and reconciled specifications                       |
| Business invariants and state rules          | BUILD-READY                                                  | `03`–`10`, `27`, `28`, `55`, H01–H02                                                |
| Application foundation                       | VERIFIED                                                     | `docs/build/HANDOFFS/01-foundation.md`                                              |
| Application shell and design system          | IMPLEMENTED FOUNDATION                                       | `docs/build/HANDOFFS/17-application-shell-design-system.md`                         |
| Tenant/database foundation                   | IMPLEMENTED; execution environment pending                   | `migrations/001_foundation.sql`, `docs/build/HANDOFFS/02-database-tenancy.md`       |
| M08 inventory/costing                        | VERIFIED DOMAIN SLICE                                        | `src/domain/inventory.ts`, `src/domain/inventory.test.ts`                           |
| M09 purchasing/supplier liabilities/returns  | VERIFIED DOMAIN SLICE; integration pending                   | `src/domain/purchasing.ts`, `docs/build/HANDOFFS/08-purchasing-suppliers.md`        |
| M08/M09 inventory & purchasing UX            | IMPLEMENTED WORKSPACE; API/persistence pending               | `src/inventory/`, `docs/build/HANDOFFS/19-inventory-purchasing-ux.md`               |
| M07 sales/payments/credit/receipts           | IMPLEMENTED DOMAIN SLICE; integration pending                | `src/domain/sales.ts`, `docs/build/HANDOFFS/09-sales.md`                            |
| M07 POS selling workspace (C06)              | IMPLEMENTED WORKSPACE; persistence integration pending       | `src/pos/`, `docs/build/HANDOFFS/18-pos-ux.md`                                      |
| M06 customers and customer credit            | VERIFIED DOMAIN SLICE; integration pending                   | `src/domain/customersCredit.ts`, `docs/build/HANDOFFS/10-customers-credit.md`       |
| M06/M07 customer & credit UX (C08)           | IMPLEMENTED WORKSPACE; API/persistence pending               | `src/customers/`, `docs/build/HANDOFFS/20-customer-credit-ux.md`                    |
| M05 catalogue/pricing/search                 | BUILD-READY; integration pending                             | `37-catalog-and-search.md`                                                          |
| M10 customer returns/refunds/corrections     | IMPLEMENTED DOMAIN SLICE; integration pending                | `src/domain/returnsCorrections.ts`, `docs/build/HANDOFFS/11-returns-corrections.md` |
| M13 offline sync/conflicts                   | IMPLEMENTED REFERENCE BOUNDARY; integration pending          | `src/sync/offlineSync.ts`, `docs/build/HANDOFFS/14-offline-sync.md`                 |
| M11 cash/reconciliation                      | VERIFIED DOMAIN SLICE; integration pending                   | `src/domain/cashReconciliation.ts`, `docs/build/HANDOFFS/12-cash-reconciliation.md` |
| M10/M11 exceptions & reconciliation UX (C09) | IMPLEMENTED WORKSPACE; API/persistence pending               | `src/exceptions/`, `docs/build/HANDOFFS/21-exceptions-reconciliation-ux.md`         |
| M12 management dashboard UX                  | IMPLEMENTED WORKSPACE; API/persistence pending               | `src/management/`, `docs/build/HANDOFFS/22-management-dashboard.md`                 |
| Staff Home / staff dashboard UX              | IMPLEMENTED WORKSPACE; API/persistence pending               | `src/staff/`, `docs/build/HANDOFFS/23-staff-dashboard.md`                           |
| Public landing page (C05)                    | IMPLEMENTED MARKETING PAGE; acquisition path pending         | `landing.html`, `src/landing/`, `docs/build/HANDOFFS/24-landing-page.md`            |
| M14 English/Nigerian Pidgin content          | IMPLEMENTED FOUNDATION; review/migration pending             | `src/language/`, `docs/build/HANDOFFS/25-language-pidgin.md`                        |
| Cross-domain verification suite              | VERIFIED TEST SUITE                                          | `src/domain/domainVerification.test.ts`, `docs/build/HANDOFFS/26-domain-testing.md` |
| Cross-domain integration suite               | VERIFIED TEST SUITE                                          | `src/domain/integration.test.ts`, `docs/build/HANDOFFS/27-integration-testing.md`   |
| Failure-injection suite                      | VERIFIED TEST SUITE; durable runtime/backup gates pending    | `src/domain/failureTesting.test.ts`, `docs/build/HANDOFFS/28-failure-testing.md`    |
| End-to-end role-journey suite                | VERIFIED BROWSER/COMPOSITION E2E; production runtime pending | `tests/e2e/`, `docs/build/HANDOFFS/29-e2e.md`                                       |
| M15 V1 integration/acceptance                | BLOCKED                                                      | dependent modules and unresolved technical decisions                                |

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
