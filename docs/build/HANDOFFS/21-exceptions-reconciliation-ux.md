# Handoff 21 — Exceptions and Reconciliation User Experience

**Module:** M10/M11 returns, corrections, reversals, refund settlement, and
cash reconciliation UX (C09)
**Status:** IMPLEMENTED WORKSPACE over the verified domain engines; durable
persistence/API integration remains downstream
**Date:** 2026-09-08
**Spec authority:** C09 (`20-returns-corrections-and-reconciliation-ux.md`),
C00 (`11-ux-and-design-foundation.md`), C01 (`12-information-architecture.md`
sections 10, 12.2, 20-22), C02 (`13-user-journeys-and-task-flows.md`), C03
(`14-design-system.md`), C04 (`15-application-shell-and-navigation.md`), B04
(`05-returns-and-refunds-rules.md`), B05 (`06-cash-and-reconciliation-rules.md`),
B08 (`09-correction-and-exception-policy.md`), B09/H03/35-permissions
(authorization), 32-audit-and-integrity (audit presentation), H01/H02
(invariants/state)
**Domain handoffs consumed:** 03 (authorization), 07 (inventory), 08
(purchasing/supplier returns), 09 (sales), 10 (customers/credit), 11
(returns/corrections), 12 (cash reconciliation), 14 (offline sync), 17
(application shell/design system), 18-20 (workspace UX precedents)

## Outcome

`src/exceptions/` implements the C09 exceptions workspace behind the existing
C04 `AppShell`, mounted at the **Money** navigation destination. It is a
controlled investigation and correction system, not an undo button: every
consequential surface shows the original record, the reason, the
authorization, the consequence, the audit/history, and the resulting state.

The workspace composes the already-verified domain engines through
`ExceptionsController`:

- `ReturnsCorrectionsEngine` (Handoff 11) — sale returns, corrections,
  reversals, refund settlement records;
- `PurchasingEngine` (Handoff 08) — supplier returns, replacements,
  settlements, payable/credit semantics;
- `CashReconciliationEngine` (Handoff 12) — business-day session, expected
  cash, physical counts, discrepancy, close/reopen;
- `SalesTransactionEngine`, `InventoryEngine`, `CustomersCreditEngine`,
  `CatalogPricing` — the shared reference dataset the flows act on.

Every mutation passes `executeAuthorized` (Handoff 03) with the operation's
permission before the engine runs; UI visibility is never the security
control.

## Implemented surfaces

- **Review queue (C09 §62-65):** consolidated management attention for sale
  returns awaiting verification/approval, applied returns with refunds due,
  supplier returns in progress, Owner-review flags on consequential manager
  corrections, and unresolved cash discrepancies. Each item states what
  happened, why it needs attention, the affected area, the consequence, the
  requested action, the required authority, and its date — no unexplained
  "12 issues" badge. Actions jump to the affected source record.
- **Sale returns (C09 §7-19):** find the original sale (search by ID,
  customer, product); the original record stays fully visible with its
  payments, tax, and per-line sold/returned quantities. Request flow selects
  lines and quantities, requires a reason, and previews the return value and
  its business effects before submission. Management walks
  `requested → verified → approved (condition) → applied → settled`:
  verification, approval (sellable / held) and rejection are
  management-only and separate from the requester; applying records
  inventory, debt, settlement, and reporting effects; rejected returns
  remain in history with an explicit "no business effect applied" note.
  Derived sale states read `Completed`, `Completed — Partially returned`,
  `Completed — Fully returned`, `Completed — Reversed`.
- **Refund state (C09 §15-16, B04 §5):** refunds render as `Not required` /
  `Due` / `Settled` with amount, method, reference, and settling actor.
  Settlement recording states in plain language that Sabi Shop records the
  settlement and does not execute or verify the money movement; only a due
  refund can be settled.
- **Supplier returns (B03 purchasing rules; D8 decision):** purchase finder
  shows paid/outstanding state; the request dialog previews the settlement
  semantics — an unpaid purchase reduces the payable, a paid purchase creates
  supplier credit — plus stock and replacement consequences. Lifecycle
  verify → approve → apply → settle with recorded replacements as separate
  new receipts (never an edit of the return).
- **Corrections (C09 §20-49, B08):** correction entry is contextual to the
  affected sale, with the correction-window state (configurable 15-minute
  default from the domain engine) always visible. Types cover note
  (ordinary), quantity and payment amount (material), customer identity and
  salesperson attribution (high-integrity). The dialog shows an
  original-versus-proposed comparison, expected effects (stock, cost, tax,
  reporting, reconciliation), a mandatory free-text reason, and the authority
  requirement — including separate-approval selection for managers and
  Owner-only authority for high-integrity changes. Staff see the authority
  explanation and a disabled apply control rather than a silent failure.
- **Reversal (C09/B08 §4.3):** a deliberate, separately approved management
  action with a full consequence preview (reporting, stock, credit effects)
  and copy that states the original record, reason, authorization, and
  compensating effects are preserved. The sale remains visible as
  `Completed — Reversed`; reversal is never presented as deletion.
- **Reconciliation (C09 §54-61, B05):** the session state machine
  (`open → count recorded → prepared → management confirmed → closed`,
  plus audited reopen) is visible. The four canonical figures are distinct,
  labelled metrics:
  - **Expected Cash** — system-derived, with its formula shown;
  - **Actual Cash** — the physical count, entered only through the
    deliberate "Count cash" flow (a modal that instructs the user to
    physically count, warns against copying the expected figure, and shows
    the variance preview before recording). It is never a routine dashboard
    input;
  - **Cash Variance** — Actual − Expected, with shortage/excess direction,
    presented as "Discrepancy requiring investigation", explicitly not an
    accusation;
  - **Cash in Hand** — the operational view: the last counted figure when a
    count exists, otherwise the expected figure clearly labelled "not yet
    physically counted".
    Interim counts are management checkpoints that never close the session.
    Cash in/out recording requires a reason and actor. Resolution records the
    investigation outcome while the original reconciliation stays in history;
    closing with an unresolved discrepancy is allowed and the discrepancy stays
    visible; reopening requires a reason (and a separate approver for a
    manager) and is fully audited. Payment-method totals (Cash, Transfer,
    POS/Card, Credit) stay distinguishable so a variance in one method cannot
    hide inside another.
- **Investigation / history (C09 §72-73, 32-audit):** a human-readable,
  filterable timeline across sales, sale returns, corrections, reversals,
  supplier returns, cash/reconciliation events, and authorization decisions
  — each entry with time, actor, role, reason, and detail. Current accepted
  state and historical events stay conceptually distinct; the footer states
  the preserved audit-event count.

## Terminology discipline

- No Delete/Overwrite language anywhere in exception flows; confirmations use
  business-specific verbs (`Approve return`, `Apply correction`, `Reverse
sale`, `Resolve discrepancy`, `Close business day`, `Reopen business day`)
  per C09 §75.
- Expected Cash / Actual Cash / Cash Variance / Cash in Hand use the exact
  B05-final terminology (D15/D16).
- Discrepancy copy is investigation-first; staff accountability copy never
  accuses (B05 §2, §27).

## Authorization and tenant boundaries

- Permission mapping at the controller boundary: sale-return request
  `business:work`; verify/approve/reject `return:approve`; apply/settle
  `return:process`; ordinary correction `correction:request`; material and
  high-integrity corrections, reversal `correction:approve`; supplier return
  operations `supplier:return`; supplier settlement `supplier:settlement`;
  opening-cash entry, cash events, physical count `payment:record`;
  reconciliation preparation `business:work`; opening-cash confirmation,
  interim counts, management confirmation, discrepancy resolution
  `cash:reconcile`; closure and reopen `business-day:close`.
- Separation of duties is enforced by the engines (requester ≠ approver) and
  surfaced by the UI (separate-approval selectors, Owner-only approver for
  high-integrity corrections and manager reopen review).
- Every record and lookup is scoped to the reference business
  (`biz-nkechi-hardware`); the authoritative session/device/business policy
  remains the outer boundary. The domain engines re-check authority, so a
  hidden or disabled control is convenience, not protection (H03 §5).
- Navigation change: the Money destination is now visible to staff
  (`business:work`) because B05 §3/§22/§28 and C09 §42 require staff to enter
  opening cash, record cash events and physical counts, and request returns;
  official figures, confirmation, closure, resolution, and reopen remain
  management-only.

## Historical, audit, and offline behavior

- The workspace never deletes or silently overwrites business history; it
  renders the engines' append-only evidence (original snapshots, corrective
  events, audit events) as human-readable timelines.
- Manager self-corrections flagged by the engine for Owner review appear in
  the review queue.
- Authorization decisions (allowed and denied) from `executeAuthorized` are
  preserved and shown in history.
- The engines' offline-capable inputs (`isOffline`) are not yet wired to a
  durable sync queue in this workspace; states shown are engine states.

## Files changed

- `src/exceptions/exceptionsController.ts` — composition seam: engines,
  reference sessions, authorization mapping, view models, consequence
  previews, review/history builders, reference seed.
- `src/exceptions/ExceptionsWorkspace.tsx` — workspace shell, actor switcher,
  tab navigation, domain-specific failure guidance.
- `src/exceptions/ReviewSection.tsx` — management review queue.
- `src/exceptions/ReturnsSection.tsx` — sale returns finder, original record,
  request/approve/settle dialogs, return lifecycle cases.
- `src/exceptions/SupplierReturnsSection.tsx` — purchase finder, supplier
  return request/settlement/replacement dialogs, lifecycle cases.
- `src/exceptions/CorrectionsSection.tsx` — correction and reversal surfaces
  with preview, authority, and history.
- `src/exceptions/ReconciliationSection.tsx` — cash metrics, deliberate count
  flow, discrepancy, close/reopen workflows, cash activity, reconciliation
  history.
- `src/exceptions/HistorySection.tsx` — investigation/history timeline with
  filters.
- `src/exceptions/ExceptionsShared.tsx`, `src/exceptions/exceptionsFormat.ts`,
  `src/exceptions/exceptions.css` — shared C03-pattern components, formatters,
  and token-based styles.
- `src/exceptions/ExceptionsWorkspace.test.tsx` — workspace tests.
- `src/App.tsx`, `src/shell/navigation.ts`, `src/shell/shell.test.tsx` —
  mounting and the staff-visible Money destination.
- `docs/build/BUILD-STATUS.md`, this handoff.

## Verification

Focused workspace tests (`src/exceptions/ExceptionsWorkspace.test.tsx`) cover:

- review queue content, consequence, and required authority;
- full sale-return lifecycle: verify → approve with condition → apply →
  settle refund, with the original sale intact and derived state
  `Completed — Fully returned`;
- staff return request with management-only approval controls;
- rejected return staying visible with no business effect;
- material correction with preview, reason, separate approval, and applied
  history;
- staff blocked from material correction with the authority explanation;
- deliberate reversal with approver, visible `Completed — Reversed` state,
  and preserved history;
- supplier return on an unpaid purchase as payable reduction and on a paid
  purchase as supplier credit;
- Actual Cash absent from the dashboard as an editable input; deliberate
  physical count flow with variance preview;
- discrepancy → resolve → confirm → close → reopen with reasons;
- investigation history with filters, actors, and reasons.

Full validation on 2026-09-08:

```text
npm test                                      PASS (201 tests, 20 files)
npm run lint                                  PASS (0 errors, 0 warnings)
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <changed files>          PASS
```

Browser verification (production build via `vite preview`, Playwright): all
six tabs rendered without horizontal overflow at 390px and 1280px+; the
count-cash dialog, correction preview with original-vs-proposed comparison,
authorization note, and separate-approval control were exercised
interactively. Screenshots archived under `work/` (gitignored):
`exceptions-review-desktop.png`,
`exceptions-reconciliation-desktop.png`,
`exceptions-count-cash-dialog.png`,
`exceptions-correction-dialog.png`,
`exceptions-reconciliation-mobile.png`. Automated layout checks were run;
human visual review was not available in this environment.

## Known limitations and unresolved decisions

- The workspace uses in-memory engines and a reference session/seed dataset.
  Durable persistence, API envelopes, real authentication, durable audit
  storage, and durable sync storage remain downstream.
- The permission mapping is a reference-adapter policy over the existing
  catalogue; the exact operation-level permission catalogue (H03 §7) must be
  finalized before production. No new permission ID was invented.
- Supplier-return lifecycle transitions are tracked at the controller for
  history display because the purchasing engine does not emit audit events;
  durable audit belongs to the persistence adapter.
- The seeded session uses shared-drawer custody; individual-salesperson
  custody is engine-supported but has no dedicated multi-account UI yet.
- C09 concepts not owned by the consumed engines (duplicate review, merge,
  no-receipt investigation flow, offline conflict resolution UI, integrity
  blocking surfaces) remain future slices; nothing was invented here.
- Exchange flows (return + new sale) remain downstream; this slice records
  the return side.
- The review queue lives in the Money workspace as C01 §12.2 permits; a
  dedicated Management-area review centre remains an architectural option
  for a later slice.

## Excluded modules

- No incentive payout logic (salesperson incentive recalculation is owned by
  the incentive module; the UI only states that recalculation is triggered).
- No money movement, payment execution, or external settlement verification.
- No deletion, destructive restoration, or direct historical editing.
- No database migrations, API contracts, or authentication provider.
- No offline conflict resolution UI.

## Next integration step

Replace `ExceptionsController`'s in-memory engines, reference sessions, and
controller-level supplier-return traces with the durable, business-scoped API
transaction. The adapter must atomically persist return/correction/reversal,
supplier-return, and cash-reconciliation events with their audit evidence,
attach durable authorization decisions, connect the count/reopen flows to the
real business-day session store, and route offline operations through Handoff
14's sync queue with the same state vocabulary. The workspace states and
tests should remain structurally unchanged for that swap.
