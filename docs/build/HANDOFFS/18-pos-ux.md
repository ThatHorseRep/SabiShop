# Handoff 18 — POS User Experience

**Module:** M07 POS selling workspace (C06)  
**Status:** IMPLEMENTED WORKSPACE on the verified domain engines; persistence/API integration remains downstream  
**Date:** 2026-09-07  
**Spec authority:** C06 (`17-pos-ux.md`), C02 (`13-user-journeys-and-task-flows.md`), C03 (`14-design-system.md`), C04 (`15-application-shell-and-navigation.md`), D03 (`27-sales-and-transaction-rules.md`), D04 (`28-pricing-and-discount-rules.md`), B03 (`04-credit-and-debt-rules.md`), B06 (`07-inventory-accounting-rules.md`), B08 (`09-correction-and-exception-policy.md`), B09 (`10-roles-and-permissions.md`), D07 (`34-offline-sync.md`)  
**Domain handoffs consumed:** 03 (authorization), 06 (catalog/pricing), 07 (inventory), 09 (sales), 10 (customers/credit), 14 (offline sync), 17 (shell/design system)

## Outcome

The application now has its primary selling workspace. `src/pos/` implements
the C06 POS screen model as a production interface over the existing,
tested domain engines:

- **Two persistent areas on desktop** (product discovery + current sale) and
  one focused mobile flow with a persistent sale bar, per C06 §4/§72.
- **Fast ordinary path:** search (autofocused, Enter adds the first result),
  add, quantity steppers, current price visible, default-amount payments with
  one-tap confirmation, and a visually dominant `Complete Sale` action that
  names the exact total. No management step appears unless an exception
  exists.
- **Consequential interactions are deliberate:** below-floor prices, free
  sales, stock exceptions, and credit (including over-limit) each surface
  their consequence, require a separate Manager/Owner approver with a
  recorded reason, and show approved/declined states on the line or sale.
- **Payment state is explicit:** every component is _not confirmed_ until
  confirmed; failed attempts are never recorded as successful and the sale
  stays incomplete; splits track Settled/Remaining and must settle the total
  exactly (the domain contract).
- **Completion is unmistakable:** receipt reference, total, payment summary,
  customer, salesperson attribution, historical prices, and the true
  local/sync state; `New sale` returns to a clean ready state.

The UI contains no business rules of its own: pricing facts, totals/tax,
credit assessment, completion, inventory effects, and sync envelopes all
delegate to `src/domain` engines and the `src/sync` boundary (C06 §105;
DEVELOPMENT.md “UI code must not become the source of business truth”).

## Files and interfaces

**New — `src/pos/`:**

| File                           | Responsibility                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `PosScreen.tsx`                | The POS workspace: discovery, basket, totals/tax, payments, completion gate, dialogs, mobile bar                            |
| `PosDialogs.tsx`               | Customer picker (search/select/create), line price & discount editor with floor preview, management approval, abandon guard |
| `PosReceipt.tsx`               | Completion view and receipt dialog                                                                                          |
| `posController.ts`             | Composition root + UI-facing operations (search, preview, assess credit, complete, enqueue/sync) over the engines           |
| `posSession.ts`                | Reference session adapter (see Authorization)                                                                               |
| `posData.ts`                   | Reference operational data (products, stock, customers, custom payment method)                                              |
| `posTypes.ts` / `posFormat.ts` | UI draft types and naira-entry parsing                                                                                      |
| `pos.css`                      | POS styles — token-only, no ad hoc values (C03-DEC-11)                                                                      |

**Domain additions (read-only projections — no rule changes):**

- `CatalogPricing.previewSaleLine()`: same pricing facts as
  `priceSaleLine` (discount, actual price, effective floor, below-floor,
  free sale, authorization required) **without** recording a sale line.
  Shared computation extracted into `computeLinePricing`; authorization
  remains enforced only at completion.
- `SalesTransactionEngine.previewTotals()`: draft basket totals through the
  exact tax computation `complete()` applies.
- `CustomersCreditEngine.listCustomers()`: business-scoped read for lookup.
- `PricingAuthorization.reason` + `SaleLine.pricingApprovedBy`/
  `pricingApprovalReason`: approver and reason evidence for price
  exceptions, per D04 (free sales must record fact, approver, reason).
- `SalesTransactionEngine.complete()`: an approved fully-free (₦0) sale now
  settles with an empty payment list. Previously _no_ ₦0 sale could
  complete (payments had to be positive), contradicting D04 §21.11; every
  other sale still requires at least one confirmed positive payment, and
  the free-sale pricing authorization is still mandatory.

**App wiring:** `src/App.tsx` runs the shell on the reference session
(role-aware navigation via `navigationFor(effectivePermissions(...))`),
routes `sell` to the POS, guards navigation away from a dirty basket with
the abandon dialog, and feeds the system-state indicator from the
controller's operation queue. Non-POS destinations show an honest
module-pending state (no dead screens, no fake data).

## Screen model and states (C06 §78 inventory)

Implemented as applicable per surface:

| C06 state                                    | Where                                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Empty                                        | “Start a sale” basket empty state; “No products found” search state                                 |
| Searching / Results                          | Debounce-free live search by name, SKU, alias, model/part                                           |
| Selected / Editing                           | Basket lines with quantity steppers, price editor, discounts                                        |
| Payment pending                              | Per-component “Not confirmed” with amount entry + optional reference                                |
| Authorization required / approved / rejected | Approval dialogs; line/sale approval chips; declined-approval alert “sale remains unchanged”        |
| Processing                                   | Complete button loading state (double submission blocked)                                           |
| Completed                                    | Completion view + receipt dialog                                                                    |
| Offline                                      | POS context badge + shell indicator; sales continue locally                                         |
| Sync pending                                 | “Recorded on this device · Sync pending” + `Synchronize now` when online                            |
| Conflict                                     | Conflict status on the completion view and system panel                                             |
| Error                                        | Line pricing errors, payment validation, domain-rejection alerts (mapped messages, never raw codes) |
| Correction required                          | Price-exception and stock-exception flags on completion (management review)                         |

Other explicit states: stock conflict (blocked completion + escalation),
credit not allowed / restricted / over-limit, unsettled remaining, invalid
amount, customer required, and the abandon-sale guard.

## Authorization behavior

- `posSession.ts` is a **reference session adapter** (staff/manager/owner
  actors for one business), standing in for the downstream authentication
  provider exactly as Handoff 03 defines the seam. Switching actors never
  grants authority: the domain engines remain the enforcement point, and
  the adapter is labelled as such in the UI.
- Approvals (below-floor, free sale, stock exception, credit, over-limit)
  list only Manager/Owner actors **other than the current actor**
  (`approvalCandidates`), enforcing B09 separation of duty in the surface
  while the engines re-check authoritatively.
- Price-exception authorizations are constructed as
  `{ actorId: requester, role: approverRole, approvedBy: approverId, reason }`
  and recorded on the completed line. Credit approvals flow to both the
  sales engine (`canApprove`) and the customers/credit ledger; over-limit
  credit additionally requires the separate exception approval (B03).
- Offline approvals are recorded locally and labelled “revalidated when the
  sale synchronizes”; offline never bypasses approval (C06 §42).
- Staff never see cost or margin anywhere in the POS (C06 §75). Floors are
  visible per D04, but only inside the price editor.

## Offline and sync behavior

- Offline sales complete locally through the same domain rules, then a
  durable sync envelope (`sale.complete`, with business/payment/
  authorization states and a JSON-safe summary) is queued via the real
  `SyncCoordinator` + `LocalStorageStore` from Handoff 14.
- The shell indicator and system panel derive pending/conflict counts from
  the controller's queue; the receipt offers `Synchronize now` once online.
  Synchronization delivers through the reference `InMemorySyncServer`
  (idempotent, authority recheck hook) and clears the pending state.
- Conflicts render the C03 §39 conflict state on the completion view and
  system panel; no automatic winner, no silent overwrite.

## Verification

Automated (`npm test` — 157 passed, 17 files; includes 19 new POS journey
tests + 2 new domain tests):

Normal cash sale (search/qty/totals/stock deduction), SKU+name search and
no-result state, stock-conflict block + manager exception + negative-stock
visibility, below-floor approval with recorded approver/reason + review
flag, free-sale approval and ₦0 completion, exclusive/inclusive tax,
unconfirmed transfer cannot complete, failed payment not recorded as
successful + retry, split payment exact settlement, credit requires
customer + separate approval + debt ledger effect, blocked customer
refused, over-limit second exception, offline sale → sync pending →
synchronize, POS customer creation (zero limit), approval declined leaves
sale unchanged, custom payment method, abandon guard, empty state, and
conflict-state rendering.

```text
npm run lint     PASS (0 warnings)
npm run build    PASS
npx tsc -b       PASS
npx prettier --check <changed files>  PASS
npx vitest run   PASS (157 tests)
```

**Manual mobile + desktop verification** (production build, Playwright):

- Desktop 1440×900: two-column layout (discovery + 420px sale panel),
  autofocus search, no horizontal overflow; full normal sale, receipt
  dialog with historical prices; below-floor price editor → approval
  dialog (consequences, approver choice, reason) → flagged-for-review
  completion; stock-conflict alert blocking completion.
- Mobile 390×844: single column, sticky sale bar above the shell bottom
  nav showing items + total with `Review & pay` scroll-to-payment, no
  overflow; split cash+transfer sale completed on a phone-sized viewport.
- Responsive recheck after field validation: the two-column layout now
  collapses by `1199px` (rather than relying on the viewport alone), allowing
  for shell navigation and browser zoom. The workspace clips accidental
  horizontal overflow, while the 1440×900 desktop grid remains contained at
  708px discovery + 420px sale panel.
- Second responsive audit (19 widths, 320–1600px): removed the base
  `body { min-width: 320px }`, which forced horizontal scroll on viewports
  whose usable width falls below 320px when a classic scrollbar is present.
  After the fix, no width in the sweep overflows its client area; the fixed
  sale bar and mobile bottom nav span the full usable width at 320px, and the
  price-editor dialog fits within a 305px client width.
- Offline (network emulated): Offline badge, sale recorded locally with
  sync pending, no synchronize action while offline; on reconnect,
  `Synchronize now` clears pending and the shell returns to Online.

Verification screenshots are archived with this task's deliverables
(`pos-desktop-initial/completed/price-dialog/stock-conflict.png`,
`pos-mobile-initial/completed.png`).

## Known limitations / deferred decisions

- Exact-settlement payments mean cash overpayment/change is not yet
  expressible; the domain (Handoff 09) requires component totals to equal
  the total due. When the sales domain models change, the payment card's
  Amount/Remaining presentation extends without redesign (C06 §31).
- Draft-basket persistence (save unfinished sale across restarts) is not
  implemented; C06 §47 leaves the persistence model to a later technical
  decision. Leaving the POS is guarded; discarding applies no business
  effect.
- The `350 ms` processing yield is a UI affordance demonstrating the
  double-submission guard; the real adapter will be an async network call.
- Reference adapters, not production: the session actors, seeded catalogue/
  stock/customers, in-memory engines, and `InMemorySyncServer`. The
  controller is the seam the durable API transaction replaces.
- Stock-exception approval evidence lives in the POS draft and sync
  envelope; durable negative-stock evidence and the management review
  queue belong to Handoff 07/C09 integration.
- Receipt numbering (`SR-YYYYMMDD-…`) is a presentation reference only;
  D-series still owns the real format (C06 §109).
- No correction/return workflow is opened from the POS beyond the
  completion view's review flags; C09 owns those screens (C06 §50/§63).

## Reporting effects

None new. Completion continues to append `sale.completed` report events
through the sales engine (revenue/tax/cash/non-cash/credit/COGS/gross
profit), and credit sales append to the customer/credit ledger. The POS
renders only engine output.

## Next integration step

Connect `PosController` to the durable persistence/API boundary: replace
the in-memory engines with the business-scoped API transaction (atomic
sale + inventory + credit + audit + idempotency), wire the reference
session to the real authentication provider, and attach domain-specific
conflict classifiers to the sync delivery path. The POS screen, its
states, and its tests require no redesign for that swap.
