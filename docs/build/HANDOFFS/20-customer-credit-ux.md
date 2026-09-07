# Handoff 20 — Customer and Credit User Experience

**Module:** M06/M07 customer records, credit/debt, and repayment UX (C08)
**Status:** IMPLEMENTED WORKSPACE over the verified domain engine; durable
persistence/API integration remains downstream
**Date:** 2026-09-07
**Spec authority:** C08 (`19-customer-and-credit-ux.md`), C02
(`13-user-journeys-and-task-flows.md` journeys 07/08/09/16/17/18/19/20/21/23/24/27/28/29),
C03 (`14-design-system.md`), C04 (`15-application-shell-and-navigation.md`),
C09 (`20-returns-corrections-and-reconciliation-ux.md`), B03
(`04-credit-and-debt-rules.md`), B04 (`05-returns-and-refunds-rules.md`), B08
(`09-correction-and-exception-policy.md`), B09/H03/35-permissions
(authorization), H01/H02 (invariants/state)
**Domain handoffs consumed:** 03 (authorization), 09 (sales), 10
(customers/credit), 11 (returns/corrections), 14 (offline sync), 17
(application shell/design system), 18 (POS UX)

## Outcome

`src/customers/` implements the C08 Customers & Credit workspace behind the
existing C04 `AppShell`, synchronized with the reference session
actor/business context. It is a clear record of the relationship between each
customer, their purchases, and their actual obligations — not a single
editable customer balance. The current outstanding amount is always presented
as a result of source events (credit sale, repayment, approved return,
write-off, correction), and the source events remain the evidence.

Implemented surfaces:

- **Customer overview:** total outstanding debt, customers with outstanding
  debt, disputed-debt count, a needs-attention queue (restricted credit,
  disputed debts, overdue debts), recent repayments, and recent credit
  activity. Every entry links back to the customer record (C08 §63).
- **Customer list/search:** name and phone search fast enough for POS use;
  results always show the phone number so similar names (Ada Obi / Ada
  Obiora) stay distinguishable; ambiguous matches are called out; no-result
  and no-customer empty states.
- **Customer creation:** the authoritative minimum identity only — name and
  phone. No additional customer fields are invented (C08 §4, §99). Creating a
  customer never authorizes credit: new customers start with a zero credit
  limit, so the first credit sale always requires a management exception.
- **Customer profile:** identity, exact B03 credit status (Credit Allowed /
  Restricted / Blocked), credit limit with available credit, outstanding-debt
  summary (total, open debts, oldest outstanding debt, recent repayment),
  independently traceable debts, and the full customer credit history.
- **Credit status:** the three exact B03 concepts with their meaning;
  management-only change control with consequence explanation; staff see an
  explicit note that these are management controls (no hidden-button
  ambiguity).
- **Credit limit:** management-only change control; the limit is presented as
  a control, never as permission to bypass authorization; available credit is
  labeled with that warning.
- **Credit sale flow:** customer identity is visible before commitment;
  blocked and restricted states are explained rather than interpreted by the
  salesperson; the assessment shows credit limit, current outstanding debt,
  new credit amount, projected outstanding debt, and the over-limit
  difference; every credit sale requires a separate Manager/Owner approval;
  over-limit sales require a second separate exception approval; the
  confirmation states the real effect (“This credit sale will increase
  outstanding debt from ₦40,000 to ₦50,000”).
- **Repayment flow:** customer identity stays visible; payment method
  components (cash, bank transfer, POS/card) each require explicit
  confirmation that the payment succeeded before anything can be recorded;
  one repayment may be split across methods and allocated across multiple
  debts; allocation defaults oldest-first and is editable; the review shows
  exactly which obligations are being reduced and by how much.
- **Partial repayment:** allocation below a debt's outstanding amount leaves
  the remaining obligation explicit (Partially repaid state); full repayment
  moves the debt to Paid and the debt is never deleted.
- **Debt history:** every debt shows its evidence chain (original sale →
  approved returns → write-offs → corrections → repayments → outstanding),
  due/overdue state, per-debt event timeline with actors, reasons, approvals,
  and resulting balances.
- **Return impact:** approved returns reduce the resulting obligation while
  the original sale amount remains unchanged in history; the confirmation
  states both facts.
- **Exception/authorization states:** restricted/blocked credit,
  over-limit exceptions, disputes (visible, non-erasing), write-offs
  (distinguishable from Paid), corrections and reversals (preserve original
  state), permission denials, offline operation, sync pending, sync conflict,
  and actionable errors.

## Financial terminology

Debt is never presented as an ambiguous generic “balance.” The workspace uses
precise terms: **outstanding debt**, **remaining obligation**, **resulting
obligation**, **collectible outstanding amount**, **original sale amount**,
and **available credit**. One POS credit-approval string that previously said
“Customer balance will increase by …” now says “Outstanding debt will
increase by …” (with the matching test updated), because C08 owns the
credit-sale consequence language.

## Error contract

Every failed operation explains three things (C08 §68; C03 §27): what
happened (the domain/authorization message), whether anything was saved
(“Nothing was saved and no debt state changed”), and what to do next
(role/permission-specific guidance such as “A separate Manager or Owner must
approve this credit sale”). Domain error codes and authorization denial
reasons each map to specific next-step guidance in
`CustomerCreditWorkspace.failureGuidance`.

## Files and interfaces

**New — `src/customers/`:**

| File                          | Responsibility                                                               |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `CustomerCreditWorkspace.tsx` | Top-level workspace, tabs, feedback/error contract, dialog composition       |
| `customersController.ts`      | Composition seam: credit engine + authorization + sync + reference seed data |
| `customersFormat.ts`          | Naira/kobo parsing and formatting, status/state/event labels                 |
| `CustomersShared.tsx`         | Status chips, panels, fields, metrics, three-part operation feedback         |
| `OverviewSection.tsx`         | Outstanding-credit dashboard and attention queue                             |
| `CustomerListSection.tsx`     | Customer list/search with unambiguous identity                               |
| `CustomerProfileSection.tsx`  | Profile, credit status/limit, debts, debt cards, credit history timeline     |
| `HistorySection.tsx`          | Cross-customer credit activity ledger with type filter                       |
| `CustomerDialogs.tsx`         | Create-customer, credit-sale, and repayment dialogs                          |
| `ManagementDialogs.tsx`       | Status, limit, write-off, return, correction, dispute, and reversal dialogs  |
| `customers.css`               | Token-only workspace styles (no ad hoc values)                               |
| `customers.test.tsx`          | 23 interface journey tests                                                   |

**Modified:**

- `src/App.tsx` — mounts `CustomerCreditWorkspace` at the existing
  `customers-credit` navigation destination.
- `src/pos/PosScreen.tsx` / `src/pos/pos.test.tsx` — the debt-precision copy
  fix described above.
- `.gitignore` / `eslint.config.js` — the local `work/` verification-artifact
  directory is ignored the same way `dist` and `coverage` are.

The UI contains no business rules of its own: credit status, limit
enforcement, separate-approval and over-limit exception rules, repayment
component/allocation validation, return/write-off/correction/reversal
effects, and append-only history all delegate to the verified
`CustomersCreditEngine` (Handoff 10) through `CustomerCreditController`.

## Authorization and tenant boundaries

- Every engine call is business-scoped (`biz-nkechi-hardware` in the reference
  adapter); the engine keys customers, debts, and events by business plus
  record ID.
- Every mutation passes `executeAuthorized` before touching the ledger:
  session, device, active business, membership, permission, and offline
  policy are checked by the authoritative policy engine, and every decision
  is audited.
- Permission mapping used by this slice (reference-adapter policy, pending
  the final operation-level catalogue required by H03 §7):
  - customer creation and dispute raising → `business:work` (staff);
  - credit sale request → `credit:request` with a verified separate approval
    (requester ≠ approver) — the engine re-checks separation;
  - repayment → `repayment:record`;
  - credit status, credit limit, dispute resolution → `credit:approve`;
  - approved return on debt → `return:approve`;
  - write-off, correction, reversal → `correction:approve`.
- Screen visibility is never authorization: staff see an explicit management
  note instead of hidden controls, and the domain engine remains the enforcing
  boundary.

## Offline and synchronization behavior

- Offline-permitted operations (per the authoritative offline permission
  set): customer creation, credit sale requests (with the separate approval
  still required), repayments, and dispute raising. These record locally and
  enqueue durable sync envelopes for authoritative revalidation on delivery;
  the workspace shows Online/Offline and Sync pending chips and offers
  “Synchronize now” when reconnected.
- Management operations (status, limit, returns, write-offs, corrections,
  reversals, dispute resolution) are refused offline by the authorization
  boundary with the full error contract (nothing saved, reconnect and retry).
  The UI does not weaken this.
- Sync conflicts render the conflict state with no automatic overwrite; the
  human-review workflow remains Handoff 14's.
- Offline status never implies that an external payment was confirmed; the
  repayment dialog requires explicit payment confirmation regardless of
  connectivity.

## Historical and audit behavior

- The workspace renders engine output only; it never edits balances, deletes
  debts, or rewrites history. Fully paid, written-off, and reversed debts
  remain visible with distinguishable states.
- Corrections and reversals show original state → correction → resulting
  state, with reasons; corrections on partially settled debts warn that
  repayments/returns/write-offs must be preserved, and the engine enforces
  the floor.
- Authorization decisions are appended to the controller's audit sink
  (reference adapter); durable audit storage remains downstream.

## Verification

Automated — `src/customers/customers.test.tsx` (23 tests, all passing):

- overview shows outstanding credit, attention queue, recent repayments and
  activity;
- name/phone search with similar names distinguished and no-result state;
- profile with exact credit status, limit, and independently traceable debts
  (partially repaid, paid, overdue, disputed, written off);
- credit sale with consequence preview and separate approval;
- over-limit exception requires the second separate approval and shows the
  limit comparison;
- blocked credit refused and restricted credit routed to management handling;
- partial repayment allocated across multiple debts with per-debt effect
  preview (oldest-first default, editable allocation);
- repayment disabled until the payment is confirmed;
- approved return reduces the obligation while the original sale remains
  ₦35,000 in history;
- write-off with reason, collectible-amount consequence, debt stays visible;
- dispute raised (debt remains visible and outstanding) and resolved with a
  documented outcome;
- correction with original → correction → corrected chain; correction below
  the already-settled amount is blocked with an explanation;
- staff see no management controls but keep repayment/dispute workflows;
- credit status and limit changes with consequence explanations;
- customer creation with name and phone only;
- offline repayment → Sync pending → synchronize on reconnect;
- offline management refusal with the full error contract (nothing saved);
- reversal records the remaining obligation as reversed and keeps repayments
  in history;
- activity ledger filter and debt-history evidence (actors, reasons,
  approvals).

Full validation:

```text
npm ci                                       PASS (268 packages, 0 vulnerabilities)
npm run format:check                         PASS
npm test                                      PASS (189 tests, 19 files)
npm run lint                                  PASS (0 warnings)
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <changed files>          PASS
git diff --check                              PASS
```

`npm test` passed with the configured 15-second per-test timeout on the
unloaded machine (twice). During a period of heavy concurrent system load
the same suite was re-verified with
`npx vitest run --test-timeout=60000 --no-file-parallelism` and passed
identically (189/189); the load-period failures were timeout-only.

**Browser verification** (production build, Playwright 1.62 against
`vite preview`): customer profile and credit-sale dialog checked at
320/390/768/1024/1280/1440/1600 px — no horizontal overflow at any width;
mobile navigation through the More drawer verified. Screenshots archived with
this task's deliverables (`work/customer-credit-profile-desktop.png`,
`work/customer-credit-profile-mobile.png`,
`work/customer-credit-sale-dialog-{1440,390}.png`,
`work/verify-customer-credit-ux.mjs`). Note: automated layout checks were
run; human visual review was not available in this environment.

## Known limitations and unresolved decisions

- The workspace uses the in-memory domain engine and a reference
  session/seed dataset. Durable PostgreSQL persistence, API envelopes, real
  authentication, durable audit storage, and durable sync storage remain
  downstream.
- The permission mapping above is a reference-adapter policy. The exact
  operation-level permission catalogue (H03 §7) must be finalized before
  production; no new product rule was invented here.
- Credit sales recorded in this workspace create ledger debts against
  generated sale references. The durable adapter must connect them to the
  real sales/receipt records atomically (the POS path already does this in
  memory for POS-completed sales).
- The repayment default allocation strategy is oldest-first with manual
  override. B03 leaves the exact strategy as a business decision; the UI
  exposes allocation explicitly rather than fixing policy.
- Credit status/limit change reasons are optional (B03 does not mandate
  them); the UI records them with history when provided.
- Restricted credit remains a stable rejection (management-handling rule not
  yet specified); no policy was invented.
- Minimum customer identity remains Name + Phone; optional address/photo
  configuration is still an unresolved product decision (B03/C08 §99).
- Sync conflicts are displayed but not resolvable from this workspace; the
  management review queue remains C09/downstream work.
- The workspace's offline sync queue is separate from the POS queue and does
  not feed the shell's pending count; unifying the device sync boundary is
  part of the durable integration step.

## Excluded modules

- No customer wallet, stored-credit balance, top-up, or generic account
  credit (B03 §8; C08 §26).
- No incentive payout logic.
- No cash reconciliation, refund settlement execution, or money movement.
- No full returns workflow UI (return approval, condition, settlement) —
  C09 owns those screens; this slice records the credit-side return impact
  through the domain engine.
- No management review queue, report persistence, or sync conflict
  resolution UI.
- No customer identity correction workflow (high-integrity customer-record
  correction remains a C09/downstream slice).
- No database migration, authentication provider, or API contracts.

## Next integration step

Replace `CustomerCreditController`'s in-memory engine, reference session, and
reference sync server with the durable, business-scoped API transaction. The
adapter must atomically persist customers, credit sales, repayments,
allocations, returns, write-offs, corrections, reversals, disputes,
authorization decisions, and idempotency records; connect workspace-recorded
credit sales to real sale/receipt records; and attach domain-specific
conflict classifiers to Handoff 14's sync delivery and management-review
path. The workspace states and tests should remain structurally unchanged
for that swap.
