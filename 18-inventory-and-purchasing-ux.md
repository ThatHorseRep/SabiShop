# C07 — Inventory & Purchasing UX

**Product:** Sabi Shop  
**Document ID:** C07  
**Package:** C — User Experience Specification  
**Status:** RECONCILED — DESIGN BASELINE — Inventory & Purchasing UX  
**Version:** 1.0  
**Prepared:** 2026-09-04  
**Depends on:** C00 — UX & Design Foundation; C01 — Information Architecture; C02 — User Journeys & Task Flows; C03 — Sabi Shop Design System; C04 — Application Shell & Navigation; C06 — POS UX; B02 — Supplier & Purchasing; B06 — Inventory Accounting; B08 — Correction & Exception Policy; B09 — Roles & Permissions; D02 — Domain Dictionary; D04 — Pricing & Discount Rules; D06–D11 technical specifications  
**Authoritative for:** Inventory and purchasing information hierarchy, receiving UX, stock-count UX, discrepancy UX, supplier purchasing workflows, product detail UX, and related exceptional states  
**Does not replace:** accounting, business, permission, or technical rules owned by their authoritative deliverables

---

# 1. Purpose

C07 defines the user experience for managing products, inventory, purchasing, receiving, supplier liabilities, stock counts, and inventory discrepancies.

The experience must make ordinary inventory work efficient while making inventory-changing actions deliberate and traceable.

The governing principle remains:

> **Fast for ordinary work. Deliberate for consequential work.**

Inventory is especially consequential because a single action can affect stock quantity, inventory value, cost basis, supplier liability, cash, profit, and future sales.

---

# 2. Inventory UX Objective

The inventory area should help an authorized user answer:

- What products do we have?
- How much stock do we have?
- What did we receive?
- What did it cost?
- Which supplier supplied it?
- What stock movements occurred?
- What discrepancies need investigation?
- What inventory value/cost information is available to this user?
- Which purchasing liabilities remain?
- What requires management attention?

The interface should connect these answers back to source records.

---

# 3. Domain Boundary

Products & Inventory is not one undifferentiated screen.

Recommended conceptual areas:

```text
Products
Stock
Purchasing / Receiving
Stock Counts
Inventory History
Inventory Issues
```

Supplier balances and supplier payments remain connected to Suppliers & Purchasing and Money.

---

# 4. Product Catalogue

The product catalogue is the operational starting point for inventory.

A product list should support fast lookup by:

- product name;
- SKU/code;
- other configured identifiers;
- category or grouping where configured.

The list should make product identity obvious.

---

# 5. Product List

Recommended columns/information on larger screens:

```text
Product
SKU
Current selling price
Stock
Stock status
Supplier/context where useful
```

Cost/margin information should be permission-controlled.

Staff should not see internal acquisition cost or margin unless explicitly authorized.

---

# 6. Product Search

Search should be fast and reusable.

A user should be able to move from a product result into:

```text
Product detail
Stock history
Purchase/receiving history
Relevant supplier context
Sales context where permitted
```

The system should not require users to remember where the product's underlying record lives.

---

# 7. Product Detail

Product detail should answer:

> What is this item and what is happening to it?

Recommended sections:

```text
Identity
Pricing
Current stock
Inventory value/cost information by permission
Recent stock movements
Purchasing history
Supplier relationships
Relevant sales/history
Issues
```

The page should prioritize operational facts before secondary metadata.

---

# 8. Product Identity

Product identity is high integrity.

The product record should make these distinctions clear:

- product name;
- SKU;
- unit;
- category;
- active/inactive state;
- identifying attributes.

A SKU should not be casually changed in a way that destroys historical interpretation.

Historical transactions must continue to identify the product they actually recorded.

---

# 9. Product Creation

Product creation is ordinary management work but should still validate:

- required identity fields;
- valid pricing values;
- valid units/configuration;
- duplicate/conflicting SKU where applicable.

Creating a product does not create inventory.

Inventory only changes through authoritative stock-affecting events.

---

# 10. Product Editing

Routine non-historical product metadata may be editable according to permissions.

Historical business events must not be rewritten merely because current product metadata changes.

For high-integrity changes, the UI should distinguish:

```text
Change product configuration
```

from:

```text
Rewrite historical transaction
```

The latter is not permitted through ordinary product editing.

---

# 11. Current Selling Price

Product detail should expose current/default selling price to users who need it.

Historical sale prices remain attached to their original transactions.

Changing the current price must not rewrite previous receipts or sales.

This follows D04 and D03.

---

# 12. Floor Price

Where the user's role permits visibility, the product detail may show:

```text
Current/default price
Floor price
```

The interface should prevent an invalid configuration where floor exceeds current/default price.

The POS remains responsible for enforcing the selling-time rule.

---

# 13. Stock Summary

The stock summary should make current inventory easy to understand.

Recommended:

```text
Current quantity
Unit of measure
Stock status
Last relevant movement
```

Where accounting visibility is authorized:

```text
Weighted-average cost
Inventory value
```

Cost information must remain role-aware.

---

# 14. Stock Is a Business State

Stock is not merely a number typed into a field.

The displayed quantity should be understood as the result of traceable stock movements.

Therefore the UI should provide a path from:

```text
Current stock
→ movement history
→ source business event
```

This supports investigation and auditability.

---

# 15. Stock Movement History

Every inventory movement must be traceable.

The inventory history should identify, as applicable:

- movement type;
- quantity;
- product;
- date/time;
- source transaction/event;
- user;
- resulting stock state;
- relevant cost information by permission.

The history should not present unexplained quantity changes as normal.

---

# 16. Movement Types

The UX should distinguish relevant movement categories such as:

- supplier receipt;
- sale;
- approved return;
- stock count correction;
- controlled adjustment;
- other authorized inventory event.

The exact technical event taxonomy belongs to D06/D07/D10 and related technical specifications.

---

# 17. Purchasing Workspace

Purchasing should support management-owned purchasing operations.

B02 establishes that staff are not responsible for purchasing; management owns supplier/purchasing records, liabilities, payments, returns, corrections, and history.

The UI should therefore make purchasing controls clearly management-oriented.

---

# 18. Purchase Record

A purchase record should make the acquisition understandable.

Recommended:

```text
Supplier
Items
Quantities
Actual acquisition cost
Total acquisition amount
Payment/credit state
Receipt status
Date/time
Responsible user
```

The exact record structure belongs to B02/D03 and schema work.

---

# 19. No External PO Requirement

V1 does not require an external purchase order before recording a purchase.

The UI should not create a mandatory PO workflow merely because purchasing software commonly has one.

The authoritative business action is management recording the purchase/receipt.

---

# 20. Receiving Is the Inventory Trigger

Inventory should increase when management records receipt.

Conceptually:

```text
Goods physically received
        ↓
Management records receipt
        ↓
Inventory increases
```

The interface must not imply that an expected purchase automatically creates stock.

No inventory should appear merely because someone discussed ordering goods.

---

# 21. Receiving Workspace

Receiving should be optimized for physical verification.

Recommended flow:

```text
Select supplier
→ Add received products
→ Enter actual quantities
→ Enter actual acquisition cost
→ Review
→ Record receipt
→ Inventory updated
```

The user should be able to verify quantities before commitment.

---

# 22. Actual Quantity Received

The receiving workflow records what physically arrived.

The interface should not assume the ordered or expected quantity is what was received.

If an expected quantity differs from the actual quantity, the difference should be visible.

---

# 23. Actual Acquisition Cost

Receiving should capture actual acquisition cost.

This is important because B06 establishes weighted-average costing and requires inventory cost explainability.

The UX should distinguish:

```text
Selling price
```

from:

```text
Acquisition cost
```

and:

```text
Supplier payment amount
```

They are related but not interchangeable.

---

# 24. Supplier Discount

Supplier discounts should affect effective acquisition cost according to B06.

The receiving UI should make the discount/adjustment visible where applicable rather than hiding it inside an unexplained total.

The accounting calculation remains owned by B06/technical accounting rules.

---

# 25. Free / Bonus Stock

Free or bonus stock is still physically received inventory.

B06 establishes that the total acquisition cost is allocated across the total acquired quantity.

The receiving UI should therefore allow the user to distinguish:

```text
Paid quantity
Bonus/free quantity
Total quantity received
```

without incorrectly treating bonus stock as having zero inventory cost.

---

# 26. Receiving Review

Before recording receipt, show a review:

```text
Supplier
Products
Received quantities
Acquisition costs
Discount/adjustment
Total acquisition amount
Payment / supplier credit
```

The user should understand the inventory and supplier-liability consequences before committing.

---

# 27. Receiving Completion

After recording:

```text
Receipt recorded
Inventory updated
Supplier balance updated where applicable
```

The UI should provide direct links to:

- receipt;
- product inventory;
- supplier account/history.

---

# 28. Supplier Credit

Supplier credit is a liability, not cash and not revenue.

The purchasing UX should distinguish:

```text
Purchase value
Amount paid
Supplier payable
```

B03 establishes supplier payable as separate from other business financial categories.

---

# 29. Supplier Payment

Supplier payments are separate successful payment events.

The UX should show:

```text
Supplier payable
Payment amount
Payment method
Remaining payable
```

Only successful payment events should affect the business record.

---

# 30. Multiple Supplier Payments

A supplier liability may be settled through multiple payments.

The supplier account should therefore show:

```text
Original purchase
Payment 1
Payment 2
...
Remaining balance
```

Do not collapse multiple payments into one overwritten balance.

---

# 31. Supplier History

Supplier history must preserve:

- purchases;
- receipts;
- payments;
- returns;
- corrections;
- outstanding liabilities.

History should be chronological and source-linked.

Silent deletion or rewriting is not permitted.

---

# 32. Supplier Return

Supplier returns are management-owned.

The UX should preserve the distinction between:

```text
Goods received
```

and:

```text
Goods later returned to supplier
```

The original receiving event should remain historical evidence.

The return becomes a subsequent controlled event.

---

# 33. Stock Count

Stock count is an investigation/control workflow, not casual stock editing.

Recommended flow:

```text
Start count
→ Select scope
→ Record physical quantities
→ Review variances
→ Investigate
→ Authorize correction
→ Apply resulting inventory event
```

---

# 34. Count Entry

Count entry should minimize opportunities for accidental alteration.

The interface may present:

```text
Product
System quantity
Physical quantity
Variance
```

where the user's permissions allow system quantity visibility.

For a blind count, the system may intentionally hide expected quantity until the physical count is recorded. Exact count mode remains a later design decision.

---

# 35. Variance

A variance is not automatically a correction.

Example:

```text
System: 20
Physical: 18
Variance: -2
```

The UI should classify this as:

> discrepancy requiring investigation

rather than immediately changing stock to 18.

This follows B05 and B06.

---

# 36. Inventory Discrepancy

Discrepancy handling should support:

```text
Detected
→ Investigating
→ Explained / unresolved
→ Authorized correction
→ Corrected
```

The original count and discovery remain visible.

---

# 37. Investigation

Investigation should provide links to relevant evidence:

- recent sales;
- returns;
- receiving;
- stock movements;
- previous counts;
- corrections;
- relevant users.

The purpose is to understand what happened before changing inventory.

---

# 38. Missing Sale Discovery

If investigation shows that goods were sold but the sale was never recorded, management may create the missing sale or appropriate corrective business event.

The UI must not encourage the user to hide the missing sale through a simple inventory adjustment.

This follows B05 and B08.

---

# 39. Negative Stock

Negative stock is not a normal operating state.

If it appears:

```text
Flag
→ Investigate
→ Reconcile
```

Do not normalize it by presenting it as an ordinary available quantity.

The POS should also prevent normal workflows from silently creating impossible stock.

---

# 40. Stock Conflict During Sale

If a sale would conflict with legitimate stock:

- flag the conflict;
- stop or escalate according to the authoritative rule;
- provide a path to inventory management;
- preserve the attempted workflow state where appropriate.

Do not silently create negative stock.

This is an important reconciliation with the older D03 wording: B08 is now authoritative on this exception behavior.

---

# 41. Inventory Adjustment

An inventory adjustment is a controlled correction, not a general-purpose “change stock” button.

Where used, the UI should require:

- affected product;
- quantity/effect;
- reason;
- authorized actor;
- resulting state;
- source/context where applicable.

The original stock history remains preserved.

---

# 42. Costing Visibility

B06 establishes weighted-average costing for V1.

Management users may need to see:

- acquisition cost;
- weighted-average cost;
- inventory value;
- cost movement/explanation.

Staff should receive only the information their permissions allow.

The UX must not expose cost merely because it exists in the underlying data.

---

# 43. Cost Explainability

A management user should be able to investigate:

> Why is this product's inventory cost/value what it is?

The UI should provide a path from:

```text
Current weighted-average cost
→ contributing acquisition/stock events
→ historical costs
```

The accounting calculation itself belongs to B06.

---

# 44. Historical Acquisition Costs

Historical acquisition costs must remain visible in the relevant source records.

A new supplier price must not rewrite older receipts.

Product detail may show current cost context while receipt history shows historical acquisition costs.

---

# 45. Inventory Value

Where permitted, inventory value should be presented as an accounting result, not as selling value.

Keep these concepts separate:

```text
Inventory cost/value
Selling value
Potential revenue
```

The interface should avoid labels that make them appear interchangeable.

---

# 46. Supplier and Product Relationship

Product detail may show relevant suppliers.

Supplier detail may show products supplied.

This relationship should be navigable in both directions.

The UX should not require duplicating supplier data inside product records.

---

# 47. Purchasing Offline

Core receiving operations should work offline where the established offline architecture permits.

The user should see:

```text
Offline
Receipt recorded locally
Sync pending
```

rather than being told the system is fully synchronized.

---

# 48. Offline Stock Count

Offline stock counts may be recorded locally where supported.

After synchronization:

- conflicts must be detected deliberately;
- local data must not silently overwrite newer state;
- inventory corrections must follow authorization rules.

---

# 49. Offline Conflict

Inventory conflicts can have serious consequences.

Therefore:

```text
Never silently overwrite.
Never silently merge incompatible stock histories.
Never hide the conflict.
```

The resolution workflow should identify:

- affected product;
- local state;
- synchronized state;
- source events;
- required authority;
- resulting decision.

---

# 50. Receiving Corrections

If a receiving record is wrong:

- do not simply overwrite historical receipt information;
- enter the appropriate correction workflow;
- preserve original state;
- record corrected state;
- record actor/time/reason;
- apply required inventory and supplier-account effects.

B08 governs correction philosophy.

---

# 51. Purchase Price Correction

A corrected acquisition cost can affect inventory costing and supplier liability.

Therefore it is a consequential correction.

The UI should show:

```text
Original cost
Corrected cost
Difference
Affected inventory/accounting consequences
Authorization
```

before applying the correction where applicable.

---

# 52. Quantity Correction After Receipt

A quantity correction may affect:

- stock;
- weighted-average cost;
- supplier payable;
- subsequent business calculations.

The UI should make those consequences visible to authorized users.

Do not treat it as harmless text editing.

---

# 53. Supplier Payment Correction

Payment corrections preserve the original payment event.

The UI should present:

```text
Original payment
Correction
Resulting supplier balance
Authorization
Reason
```

No silent replacement.

---

# 54. Inventory History as Investigation Tool

Inventory history should be useful without becoming an unstructured event dump.

Useful filters may include:

- product;
- movement type;
- date range;
- supplier;
- user;
- source transaction;
- discrepancy/correction state.

Exact filter set can be finalized in later UX validation.

---

# 55. Management Attention

Inventory should surface actionable exceptions such as:

- stock discrepancies;
- negative stock/integrity issues;
- pending receiving review;
- unresolved corrections;
- supplier-payment issues;
- synchronization conflicts.

These should link directly to the affected source record.

---

# 56. Staff Experience

Staff should be able to perform the inventory tasks explicitly granted by B09.

They should not gain management authority merely because they can navigate to a page.

The interface should hide inaccessible management controls while providing clear authorization/request paths where appropriate.

---

# 57. Manager Experience

Managers should have operational control over:

- receiving;
- purchasing;
- inventory investigation;
- stock counts;
- applicable corrections;
- supplier liabilities;
- inventory exceptions;

subject to the exact B09 permission matrix.

---

# 58. Owner Experience

Owner users have the broadest authority but still cannot destroy historical audit evidence.

Owner actions should remain attributable and auditable.

---

# 59. Inventory Dashboard

The inventory landing area should be operational rather than decorative.

Useful high-level information:

```text
Products requiring attention
Stock discrepancies
Recent receiving
Low/critical stock where configured
Pending inventory corrections
Recent inventory movements
```

Do not fill the page with vanity metrics.

---

# 60. Product Status

Product active/inactive status should not be confused with stock availability.

A product can be:

```text
Active + in stock
Active + out of stock
Active + stock issue
Inactive + historical stock/sales
```

Historical records remain intact.

---

# 61. Out-of-Stock State

Out of stock should be distinct from:

```text
Unknown stock
```

and:

```text
Integrity issue
```

The interface should not collapse these into one generic red status.

---

# 62. Low Stock

If low-stock thresholds are configured, they should be treated as management information rather than automatically creating purchases.

The system should not assume that low stock means an order must be placed.

---

# 63. Purchase Creation From Stock

A contextual path may allow management to move from:

```text
Low stock
→ Product
→ Purchasing
```

but the system should not silently create a purchase.

The purchase remains an explicit management action.

---

# 64. Data Density

Inventory interfaces are naturally information-dense.

Use:

- strong column alignment;
- compact but readable rows;
- clear numeric hierarchy;
- persistent context;
- meaningful grouping.

Do not sacrifice legibility for decorative whitespace.

---

# 65. Mobile Inventory

Mobile should prioritize:

- search;
- product detail;
- stock lookup;
- receiving;
- count entry;
- issue review.

Large comparison tables may become stacked cards or horizontally scrollable data where necessary.

Exact responsive behavior belongs to C03/C11 validation.

---

# 66. Receiving on Small Screens

Receiving should use a stepwise flow when simultaneous product/table visibility becomes impractical:

```text
Supplier
→ Products
→ Quantities
→ Costs
→ Review
→ Record
```

The active receiving context must remain visible.

---

# 67. Count on Small Screens

Count entry should prioritize rapid physical entry.

Recommended row/card:

```text
Product
Physical quantity
Variance after entry
```

System quantity may be hidden depending on count mode.

---

# 68. Confirmation Language

Consequential inventory actions should describe the business effect.

Prefer:

> **Record receipt**

over:

> **Save**

Prefer:

> **Apply stock correction**

over:

> **Update**

Prefer:

> **Record supplier payment**

over:

> **Submit**

The exact copy should be finalized during C11 validation.

---

# 69. Loading States

Inventory screens should distinguish:

- loading product list;
- loading product detail;
- loading movement history;
- saving receiving record;
- synchronizing;
- resolving conflict.

Avoid generic full-page spinners when a localized loading state is possible.

---

# 70. Empty States

Examples:

### No products

> No products yet. Add a product to begin managing inventory.

### No movement history

> No stock movements recorded for this product yet.

### No discrepancies

> No inventory discrepancies require attention.

### No supplier purchases

> No purchasing records are linked to this supplier yet.

Exact copy remains subject to content review.

---

# 71. Error States

Important inventory errors include:

- duplicate SKU;
- invalid quantity;
- invalid cost;
- supplier missing;
- receipt incomplete;
- permission denied;
- stock conflict;
- sync failure;
- correction conflict;
- integrity issue.

Errors should explain the next safe action.

---

# 72. Auditability

Every consequential inventory workflow must preserve:

- original business event;
- correction/adjustment;
- actor;
- timestamp;
- reason;
- authorization where applicable;
- resulting state.

The UX should expose enough history for the user to understand what happened without pretending the current state was always so.

---

# 73. No Silent Deletion

Completed purchasing, receiving, inventory, supplier payment, and stock events must not be silently deleted.

Where an event is invalid or duplicated, use the appropriate controlled correction/exception mechanism.

---

# 74. Inventory and Audit Trail

The interface should make the relationship between:

```text
Stock
→ movement
→ source event
→ correction
```

navigable.

This is important for later D10/D11 integrity implementation.

The UX should not depend on hashes being visible to ordinary users.

---

# 75. Integrity Failure

If an inventory record fails integrity validation:

```text
Stop affected operation
→ Preserve evidence
→ Flag issue
→ Escalate
```

Do not offer a casual “repair record” control.

---

# 76. Cross-Domain Navigation

Inventory should link naturally to:

- sale;
- customer where relevant;
- supplier;
- payment;
- return;
- correction;
- activity/history.

Navigation must remain permission-safe.

---

# 77. Example: Receive Supplier Goods

```text
Suppliers & Purchasing
→ Select supplier
→ Record received goods
→ Add products
→ Enter actual quantities
→ Enter actual acquisition cost
→ Apply discount/bonus treatment
→ Review
→ Record receipt
→ Inventory increases
→ Supplier payable/payment state updates
→ Receipt/history available
```

---

# 78. Example: Supplier Credit Purchase

```text
Receive goods
→ Actual acquisition value ₦X
→ Amount paid ₦0
→ Supplier payable ₦X
→ Record receipt
→ Inventory increases
→ Supplier liability recorded
```

The UI must not confuse the purchase with a cash payment.

---

# 79. Example: Partial Supplier Payment

```text
Purchase value ₦100,000
→ Pay ₦40,000
→ Remaining payable ₦60,000
```

The payment is a separate event.

---

# 80. Example: Stock Count Discrepancy

```text
System: 50
Physical: 47
Variance: -3

→ Investigate
→ Review recent movements
→ Determine cause
→ Authorized correction
→ Apply inventory event
→ Preserve count + investigation + correction
```

---

# 81. Example: Missing Sale Found

```text
Stock count variance
→ Review movement history
→ Discover goods sold without recorded sale
→ Management investigation
→ Record missing sale / appropriate corrective event
→ Reconcile inventory
```

Do not simply reduce stock by 3 and close the issue.

---

# 82. Example: Receiving Error

```text
Receipt recorded: 10 units
Actual received: 8

→ Open receiving history
→ Controlled correction
→ Show original 10
→ Proposed corrected 8
→ Show stock/payable implications
→ Authorize
→ Apply
→ Preserve both states
```

---

# 83. Example: Cost Correction

```text
Original acquisition cost: ₦80,000
Corrected cost: ₦75,000

→ Show difference
→ Show affected accounting consequences
→ Require appropriate authority
→ Apply correction
→ Preserve original cost
```

The exact financial calculation remains B06-owned.

---

# 84. Inventory Acceptance Criteria

C07 is successful when:

- product discovery is fast;
- product identity is clear;
- current stock is understandable;
- stock can be traced to movements;
- receiving records physical receipt;
- inventory does not increase from mere purchasing intention;
- actual acquisition cost is captured;
- supplier discounts are represented correctly;
- free/bonus stock is represented without zero-cost accounting errors;
- supplier credit is distinct from cash payment;
- multiple supplier payments remain separate;
- stock counts are investigation workflows;
- discrepancies are not auto-corrected;
- negative stock is treated as an exception;
- missing sales can be investigated without hiding them through stock adjustment;
- weighted-average cost remains the accounting basis;
- cost visibility is permission-controlled;
- historical acquisition costs remain preserved;
- offline receiving/counting is explicit about sync state;
- inventory conflicts cannot silently overwrite history;
- corrections preserve original records;
- management attention is actionable;
- inventory remains connected to source events;
- no UI action can bypass authorization merely through navigation.

---

# 85. Reconciliation With C00

C00 establishes that operational UX must preserve business truth, support first-class offline/conflict states, and make consequential work deliberate.

C07 applies those principles to inventory, where quantity and cost changes can have cascading business consequences.

---

# 86. Reconciliation With C01

C01 places:

```text
Products & Inventory
Suppliers & Purchasing
Money
Activity
Management
```

as distinct but connected areas.

C07 preserves those boundaries while allowing contextual movement between them.

---

# 87. Reconciliation With C02

C02 established receiving, stock checking, discrepancy investigation, offline work, and management review as explicit journeys.

C07 turns those journeys into concrete inventory/purchasing UX.

---

# 88. Reconciliation With C03

C03 owns visual tokens, component behavior, data-density standards, state presentation, accessibility, and responsive design.

C07 defines the inventory-specific information and interaction needs without inventing a competing design system.

---

# 89. Reconciliation With C04

C04 defines the application shell and navigation.

C07 defines the destination experiences reached through:

```text
Products & Inventory
Suppliers & Purchasing
```

and their contextual relationships.

---

# 90. Reconciliation With C06

C06 uses stock information to support safe selling.

C07 owns the deeper inventory workflows.

The POS should route users here when stock requires investigation rather than attempting to solve inventory accounting inside the sale.

---

# 91. Reconciliation With B02

B02 remains authoritative for:

- management-owned purchasing;
- receiving;
- actual acquisition;
- supplier credit;
- supplier payments;
- supplier returns;
- history;
- offline purchasing core.

C07 expresses these rules through UX.

---

# 92. Reconciliation With B06

B06 remains authoritative for:

- supplier discounts;
- bonus/free stock costing;
- weighted-average costing;
- monetary precision;
- historical acquisition costs;
- cost explainability;
- traceable inventory movements.

C07 does not redefine accounting mechanics.

---

# 93. Reconciliation With B08

B08 remains authoritative for:

- corrections;
- inventory discrepancies;
- negative stock exception;
- correction reasons;
- authorization;
- historical preservation;
- offline conflict behavior;
- integrity escalation.

C07 translates these into inventory workflows.

---

# 94. Reconciliation With B09

B09 remains authoritative for permission assignment.

C07 must use permission-aware UI rather than assuming that navigation implies authority.

---

# 95. Historical Question Reconciliation

| Earlier question | Earlier status | C07 treatment | Authority |
|---|---|---|---|
| Who owns purchasing? | Resolved | Management-owned | B02 |
| External PO required? | Resolved | No mandatory V1 PO | B02 |
| When does inventory increase? | Resolved | On recorded receipt | B02 |
| Actual acquisition cost? | Resolved | Required | B02/B06 |
| Supplier credit? | Resolved | Supported | B02/B03 |
| Multiple supplier payments? | Resolved | Separate events | B02/B03 |
| Free/bonus stock costing? | Resolved | Total cost allocated across total quantity | B06 |
| Costing method? | Resolved | Weighted average V1 | B06 |
| Negative stock? | Earlier conflict | Exception requiring flag/reconciliation | B08 |
| Stock discrepancy? | Resolved | Investigate first, correct second | B05/B06 |
| Missing sale found in count? | Resolved | Investigate and record appropriate business event | B05 |
| Historical acquisition price? | Resolved | Preserve | B06 |
| Exact inventory schema? | Deferred | Not invented | D03/D04 |
| Exact sync algorithm? | Deferred | Not invented | D07/D08 |
| Exact permission implementation? | Deferred | B09 governs | B09/D-series |
| Exact count mode? | Open | Blind/open count remains a later UX decision | C11 |

---

# 96. Explicit Non-Decisions

C07 does not establish:

- database tables;
- accounting journal implementation;
- weighted-average calculation algorithm;
- API contracts;
- synchronization algorithm;
- exact stock-status thresholds;
- exact low-stock thresholds;
- exact count mode;
- exact supplier-payment method catalogue;
- exact permission IDs;
- final responsive breakpoints;
- final copy;
- final visual tokens.

Those remain with their authoritative deliverables.

---

# 97. Design Principle Summary

The inventory experience should feel like:

> **A trustworthy operational record of physical goods and purchasing activity.**

Not:

> **A spreadsheet with buttons.**

The product must make the common tasks quick while making inventory-changing decisions understandable and traceable.

---

# 98. Next Deliverable

## C08 — Customer & Credit UX

C08 will specify:

```text
Customers
→ customer search
→ customer detail
→ credit eligibility
→ credit limit
→ credit sales
→ outstanding debts
→ repayments
→ debt allocation
→ disputes
→ write-offs
→ customer-facing correction visibility
→ offline credit workflows
→ management review
```

It will remain aligned with B03 as the authoritative credit/debt domain specification.
