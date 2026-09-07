# Handoff 19 — Inventory and Purchasing User Experience

**Module:** M08/M09 inventory, purchasing, receiving, supplier liability, and
supplier-return UX<br>
**Status:** IMPLEMENTED WORKSPACE over the verified domain engines; durable
persistence/API integration remains downstream<br>
**Date:** 2026-09-07
**Spec authority:** C07 (`18-inventory-and-purchasing-ux.md`), C02
(`13-user-journeys-and-task-flows.md`), C03 (`14-design-system.md`), C04
(`15-application-shell-and-navigation.md`), C09
(`20-returns-corrections-and-reconciliation-ux.md`), C10
(`21-offline-conflict-and-exceptional-states-ux.md`), B02
(`03-supplier-and-purchasing-rules.md`), B06
(`07-inventory-accounting-rules.md`), B08
(`09-correction-and-exception-policy.md`), B09 (`10-roles-and-permissions.md`),
D07 (`34-offline-sync.md`)
**Domain handoffs consumed:** 03 (authorization), 06 (catalog/pricing), 07
(inventory), 08 (purchasing/suppliers), 11 (returns/corrections), 13
(audit/integrity), 14 (offline sync), 17 (application shell/design system), 18
(POS UX)

## Outcome

`src/inventory/` now provides the Products & Inventory workspace, installed
behind the existing C04 `AppShell` and synchronized with the current reference
session actor/business context. It is an operational record of physical goods
and purchasing activity, not a generic spreadsheet with an editable stock
column.

Implemented surfaces:

- **Inventory overview:** actionable products, negative-stock exceptions,
  supplier payable, open investigations, recent movements, and recent
  purchasing.
- **Product discovery/detail:** identity and SKU search, current price, stock,
  permission-aware cost context, recent movements, purchasing history, supplier
  context, and replacement-cost warning.
- **Stock levels:** sellable/held/total positions, last movement, and explicit
  out-of-stock versus negative-stock states.
- **Stock investigation:** physical count entry, system/physical/variance
  evidence, working cause, investigation record, mandatory reason, and a
  separate authorized correction movement.
- **Stock exception:** negative stock is visually separated, linked to its
  source sale/receipt, and routed to management investigation. A sale that
  completed operationally is never represented as healthy inventory.
- **Receiving:** management selects the supplier, records actual paid and
  bonus/free quantities, actual unit cost, supplier discount, condition,
  payment now, and reviews inventory plus supplier-payable consequences before
  recording the receipt.
- **Supplier records:** supplier profile, live payable, purchase count, and
  supplied products.
- **Purchasing:** purchase history with each line, receipt movement ID,
  acquisition value, separate payments, paid amount, and remaining payable.
- **Supplier returns:** requested → verified → approved → applied → settled
  workflow with unpaid-payable reduction versus supplier credit, replacement
  receipts as separate events, and separate settlement outcomes.
- **Inventory history:** product/type/source filtering, quantity, resulting
  sellable state, source record, actor, reason, movement ID, and client event
  ID. Selecting a source opens a **Source transaction** panel for the purchase,
  sale receipt, supplier return/replacement, or investigation that explains the
  movement.

The interface preserves the required traceability chain:

```text
Stock level
→ relevant movement
→ source purchase/sale/return/investigation
→ replacement, settlement, or correction where applicable
```

The UI contains no independent stock setter. It calls the existing append-only
`InventoryEngine` and `PurchasingEngine`; weighted-average valuation, provisional
negative-stock COGS, supplier balances, and movement history remain domain
outputs.

## Files and interfaces

**New — `src/inventory/`:**

| File                          | Responsibility                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `InventoryWorkspace.tsx`      | Top-level workspace, role-aware tabs, feedback, and action composition         |
| `inventoryController.ts`      | Composition seam over catalog, inventory, purchasing, auth, and audit adapters |
| `OverviewSection.tsx`         | Operational dashboard and attention queue                                      |
| `ProductSection.tsx`          | Product search, identity, stock, cost, movements, and supplier context         |
| `StockSection.tsx`            | Stock levels, count/investigation, correction, and negative-stock exceptions   |
| `PurchasingSection.tsx`       | Suppliers, receiving, purchases/payments, and supplier-return workflow         |
| `HistorySection.tsx`          | Filterable movement ledger and source traceability                             |
| `InventoryShared.tsx`         | Status, panel, field, state, and source-link presentation primitives           |
| `inventoryFormat.ts`          | Kobo/quantity parsing and business formatting                                  |
| `inventory.css`               | Inventory-specific C03-aligned layout, density, status, and responsive styles  |
| `InventoryWorkspace.test.tsx` | Interface journey tests                                                        |

**Changed:**

- `src/App.tsx` routes the authorized `products-inventory` destination to the
  workspace while preserving the application shell, POS, connection, sync,
  update, and error-boundary behavior.
- `src/App.test.tsx` adds shell-to-inventory navigation and actor-synchronization
  coverage.
- `src/index.css` imports the inventory stylesheet into the centralized C03
  stylesheet chain.
- `src/domain/purchasing.ts` adds the domain-owned
  `effectiveAcquisitionUnitCost()` calculation for supplier discounts and
  bonus/free stock. It allocates net acquisition cost across total acquired
  quantity and rejects a discount larger than paid acquisition cost.
- `src/domain/purchasing.test.ts` adds focused bonus/discount cost coverage.
- `vitest.config.ts` raises the test timeout to 15 seconds so the full parallel
  suite remains stable on this machine.

**No database/schema migration was added.**

## State model and invariants

- Stock is always event-derived; no UI action edits a stock balance directly.
- A physical count is evidence and produces an investigation record; it never
  overwrites the ledger.
- A correction requires a reason and appends a movement linked to the
  investigation. The count, variance, investigation, actor, and correction
  remain separately inspectable.
- Negative sellable stock is allowed operationally but is marked as
  `negative_stock` and presented as an exception requiring investigation. A
  later receipt records its full physical quantity and does not erase the
  earlier negative history.
- Receiving records physical receipt; inventory does not rise from purchase
  intention, expectation, or discussion.
- Supplier credit is distinct from cash, revenue, inventory value, and customer
  debt. Purchase value, amount paid, and remaining payable are separate.
- Multiple supplier payments remain separate successful events.
- An unpaid supplier return reduces the payable; a paid return creates supplier
  credit/receivable. Replacement goods append separate receipts. A refund or
  credit settlement is another separate event, and only confirmed success moves
  the return to settled and changes the derived balance.

## Authorization and tenant boundary

Every mutation is submitted through `executeAuthorized` with an active business,
target business, target record, actor, device/session context, and explicit
permission. The UI never treats navigation visibility as authorization.

Role behavior in this slice:

- Staff can inspect product/stock surfaces permitted by `business:work`, but
  the Purchasing tab is hidden, and cost/floor/valuation information is hidden.
- Manager/Owner can receive, adjust, manage suppliers, record purchases and
  payments, process supplier returns, record replacements, and settle credits
  according to the current permission vocabulary.
- Authorization decisions are recorded through the authorization audit sink.
- The workspace reuses the current clearly labeled reference session actors and
  business context from the POS/session adapter, so the AppShell user and
  inventory authorization state remain synchronized. The authoritative
  authentication provider remains the downstream replacement for this seam.

## Offline and synchronization behavior

The workspace renders Online/Offline and pending-sync state, but it does not
weaken authorization when offline. Under the current policy,
`purchase:record`, `inventory:receive`, `inventory:adjust`,
`supplier:payment`, `supplier:return`, and `supplier:settlement` are not
offline permissions. Offline attempts display a safe authorization failure and
do not create a business event.

This slice does not invent a new offline policy. If the authoritative offline
permission set later permits receiving or counts, the controller can pass the
same operation envelope to the durable sync boundary without redesigning the
screen. Sync conflicts remain Handoff 14's explicit human-review workflow; no
automatic overwrite is offered.

## Reporting effects

None new. The workspace consumes movement, valuation, purchase, payment, return,
and settlement outputs from the domain engines. It does not create a competing
report, mutate reporting events, or claim durable reporting integration.

## Verification

Focused interface coverage:

- negative stock is visible as an exception and linked to source sale
  `SAL-9001`;
- Staff loses the Purchasing destination and cost visibility;
- a count records evidence before an authorized correction is applied;
- bonus stock and supplier discount allocate cost across total received quantity
  and show the payable consequence;
- offline receiving is refused instead of bypassing authorization;
- supplier return, replacement receipt, supplier credit, and settlement states
  remain separate;
- history traces movement → source sale → actor/reason/resulting state.
- selecting a source movement opens the source transaction panel and shows the
  linked sale receipt and total.

**Manual production-build browser check:** desktop 1440×900 and mobile 390×844
had no page-level horizontal overflow. Wide purchasing/history tables scroll
inside their own table wrapper rather than expanding the page.

Full validation:

```text
npm ci                                      PASS (268 packages, 0 vulnerabilities)
npm run format:check                        PASS
npm test                                      PASS (166 tests, 18 files)
npm run lint                                  PASS
npm run build                                 PASS
npx tsc -b                                    PASS
npx prettier --check <inventory/UI changes>   PASS
git diff --check                              PASS
```

Repository-wide formatting now passes after normalizing working-tree line
endings; no authorization source changes were needed. The Vitest timeout was
raised to 15 seconds to remove parallel-run POS timeouts on this machine.

## Known limitations and unresolved decisions

- The workspace uses in-memory domain engines and a reference session/seed
  dataset. Durable PostgreSQL persistence, API envelopes, real authentication,
  and durable audit storage remain downstream.
- Receiving currently records a purchase and then a separate payment command.
  The production API adapter must make purchase, inventory movement, payment,
  idempotency, and audit acceptance atomic.
- Stock-count and investigation records are currently held by the UI controller;
  their durable schema and management-review queue remain downstream.
- The interface intentionally does not offer supplier-profile editing because
  the current `PurchasingEngine` has no update method. A future update must
  preserve historical supplier facts.
- Offline receiving/count is displayed but denied under the current policy. Any
  expansion must come from the authoritative permission policy, not the UI.
- Low-stock thresholds, blind/open count mode, exact low-stock thresholds, final
  copy, final visual-token validation, and exact responsive validation remain
  open C07/C11 decisions.
- Supplier-return approval is represented by the existing domain state machine;
  a separate-approver workflow remains an authorization-policy integration
  decision.

## Excluded modules

No customer return/refund UI, sales POS, cash reconciliation, management review
queue, report persistence, incentive logic, purchase orders, expected-delivery
workflow, database migration, or sync conflict-resolution UI was added.

## Next integration step

Replace `InventoryPurchasingController`'s in-memory engines and reference
session with the durable, business-scoped API transaction. The adapter must
atomically persist inventory movements, purchases, payments, returns,
replacements, settlements, counts/investigations, authorization decisions, and
idempotency records; then attach the domain-specific conflict classifiers to
Handoff 14's sync delivery and management-review path. The workspace states and
tests should remain structurally unchanged for that swap.
