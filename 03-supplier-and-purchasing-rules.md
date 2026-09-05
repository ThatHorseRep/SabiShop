# B02 — Supplier & Purchasing Rules

**Product:** Sabi Shop  
**Status:** FINAL — RECONCILED V1
**Purpose:** Define the business rules for suppliers, purchasing, receiving inventory, supplier credit, supplier payments, supplier returns, and supplier information.

---

## 1. Purpose

Supplier & Purchasing in Sabi Shop exists to keep an accurate record of:

- who the business buys from;
- what inventory was actually received;
- what acquisition cost was recorded;
- what has been paid;
- what remains owed to the supplier;
- supplier purchase history;
- supplier returns and corrections.

Sabi Shop is a record-keeping system. It should not invent or assume purchasing information that management has not recorded.

---

## 2. Purchasing Responsibility

Staff are not responsible for purchasing stock.

Staff may help management with practical purchasing activities, such as:

- contacting suppliers;
- arranging deliveries;
- communicating product requirements;
- helping inspect or receive goods.

However, the supplier relationship and purchasing decisions belong to management.

Staff must not independently create or authorize purchases as though they own the purchasing relationship.

---

## 3. Management Owns the Supplier Relationship

Only management can own and control the supplier relationship in Sabi Shop.

Management responsibilities include:

- creating supplier records;
- editing supplier information;
- recording or approving purchasing information;
- recording supplier liabilities;
- recording supplier payments;
- handling supplier returns;
- correcting supplier records;
- reviewing supplier purchase history.

The exact permission matrix for Owner vs Manager will be defined in the Roles & Permissions deliverable.

---

## 4. Sabi Shop Does Not Assume an External Purchase Order

Sabi Shop does not need to know what was originally ordered unless the business chooses to record that information.

The system should not require an order-versus-delivery workflow merely to record inventory.

The authoritative question for inventory receiving is:

> **What inventory did management record as having been received?**

If management records that 50 units were received, Sabi Shop records 50 units.

If management records that 45 units were received, Sabi Shop records 45 units.

Sabi Shop does not independently determine whether that quantity was more or less than something that may have been discussed with a supplier.

---

## 5. Receiving Inventory

Inventory increases when management records inventory as received.

A supplier purchase/receipt record should capture, as applicable:

- supplier;
- product/SKU;
- quantity received;
- unit;
- acquisition/purchase cost;
- total purchase value;
- date;
- payment status;
- amount paid;
- amount outstanding;
- supplier-credit information where applicable;
- relevant notes/reference information.

The recorded receipt is what creates the corresponding inventory movement.

There is no requirement that Sabi Shop first contain a purchase order.

---

## 6. No Inventory Before Receipt

A purchase of inventory should not be recorded as received inventory if the inventory has not actually come in.

Sabi Shop must distinguish between:

- an intention or arrangement to buy something; and
- inventory that has physically been received and recorded.

For the core V1 workflow, Sabi Shop does not need to create an inventory purchase record for goods that have not arrived.

Future versions may support purchase orders or expected deliveries if the business needs them.

---

## 7. Actual Purchase Cost

The acquisition/purchase cost entered by management is the historical cost recorded for that receipt.

Sabi Shop should not require a previously entered “expected price” in order to accept the actual purchase cost.

If the supplier charges a different amount from what someone expected outside the system, that is not something Sabi Shop needs to infer.

The system records the actual information management enters.

Historical acquisition costs must remain preserved.

---

## 8. Different Costs for the Same Product

The same product/SKU can be purchased at different acquisition costs over time.

Example:

- Purchase 1: 10 units at ₦4,000 each
- Purchase 2: 10 units at ₦4,500 each

These remain purchases of the same product.

Sabi Shop must preserve both historical acquisition costs.

V1 inventory and COGS use weighted-average costing as defined by B06. The Financial & Business Performance Model consumes that authoritative cost basis for profitability reporting.

---

## 9. Supplier Credit

Supplier credit is supported.

Example:

- Inventory received: ₦500,000
- Amount paid: ₦200,000
- Amount owed to supplier: ₦300,000

The inventory received is recorded as inventory.

The ₦200,000 payment is recorded as paid.

The ₦300,000 remains a supplier liability/payable.

Supplier credit does not mean the inventory was not received.

---

## 10. Multiple Payments for One Purchase

A single purchase or supplier liability may be settled through multiple payments.

Example:

- Purchase/liability: ₦500,000
- Payment 1: ₦200,000
- Payment 2: ₦150,000
- Payment 3: ₦150,000

Each payment is recorded separately and linked to the relevant supplier liability/purchase.

The system should therefore be able to show:

- original liability;
- each payment;
- total paid;
- remaining outstanding amount;
- payment dates;
- relevant payment information.

---

## 11. Supplier Payment Methods

The exact payment-method model should remain consistent with the broader payment model in Sabi Shop.

Supplier payments must be recorded as business outflows/payment events rather than silently changing the original purchase amount.

The purchase cost and payment history are separate records.

---

## 12. Supplier Returns / Wrong Goods

Supplier returns are supported.

A supplier return must be linked to the relevant received inventory/purchase where possible.

Example:

- 20 units received;
- 3 units returned to supplier;
- 17 units remain accepted inventory.

The return is recorded as a separate event.

It must not delete or rewrite the original receipt.

The inventory effect of the return must be traceable.

---

## 13. Goods Damaged After Acceptance

If goods were accepted into inventory and later become damaged, the situation follows the Inventory Rules for damaged/non-sellable stock.

This is not automatically treated as a supplier return.

The business may separately decide to pursue a supplier claim, replacement, refund, or other arrangement, but Sabi Shop must first accurately record the condition and inventory movement.

---

## 14. Supplier Price History

Sabi Shop preserves supplier purchase-price history.

Changing a supplier's current pricing or recording a new purchase at a different cost must never rewrite historical purchase records.

Management should be able to understand how much the business actually paid for products at different points in time.

---

## 15. Supplier Information Changes

Supplier information can be updated by management.

Examples include:

- supplier name;
- phone number;
- address;
- contact details;
- notes;
- other current supplier information.

Updating the supplier profile changes current supplier information.

It must not rewrite historical purchase facts.

Historical transactions must continue to preserve the information necessary to understand what happened at the time.

---

## 16. Purchase Corrections and Editing

Corrections are allowed.

However, corrections to a completed purchase/receipt must preserve history rather than silently rewriting the past.

A correction should retain:

- the original recorded event/state;
- what was corrected;
- the corrected state;
- who made the correction;
- when it was made;
- the reason where required;
- an audit trail.

The exact correction mechanism should mirror the audit principles already established for sales and inventory.

---

## 17. Cancellation

Sabi Shop must not record a completed inventory purchase/receipt for inventory that has not come in.

Therefore, V1 does not need a separate workflow for cancelling a completed inventory receipt merely because goods were never received: the receipt should not have been recorded as received in the first place.

If a purchase arrangement is cancelled before inventory is received, there is no inventory receipt to record.

If an already-recorded receipt is later found to be incorrect, the system should use a correction/reversal/return mechanism that preserves the original history rather than pretending the original event never existed.

---

## 18. Inventory and Supplier Records Must Stay Connected

Supplier purchasing records and inventory records must remain traceable to each other.

A received purchase should explain:

- what inventory entered the business;
- how much entered;
- the unit used;
- the recorded acquisition cost;
- which supplier supplied it;
- when it was received.

A supplier return should explain what previously received inventory was removed.

This traceability is important for stock control, purchasing decisions, supplier evaluation, and financial analysis.

---

## 19. Staff Receiving Goods

Staff may physically help receive goods at the shop.

However, physical handling does not automatically mean the staff member owns or controls the supplier relationship.

The business may record who physically received or checked goods as operational information.

Management remains responsible for the supplier and purchasing record.

Exact staff permissions for recording receipt information will be defined in the Roles & Permissions Matrix.

---

## 20. Offline Behaviour

Core supplier and purchasing record functions should work offline where practical.

Management should be able to record:

- supplier information;
- received inventory;
- purchase costs;
- supplier credit;
- supplier payments;
- supplier returns;
- corrections,

without requiring an internet connection for the core operation.

Changes synchronize later.

Exact synchronization and conflict-resolution rules are deferred to the Offline & Synchronization Rules deliverable.

---

## 21. Audit and Historical Integrity

Supplier and purchasing history must be auditable.

Sabi Shop must not silently:

- change an old purchase cost;
- change an old received quantity;
- delete a supplier return;
- erase supplier payments;
- erase a supplier liability;
- rewrite historical supplier information in a way that makes the original event impossible to understand.

Corrections and reversals are separate traceable events where appropriate.

---

## 22. Management Visibility

Management should be able to see supplier-related information needed to run the business, including:

- supplier list;
- purchase history;
- products bought from each supplier;
- acquisition costs over time;
- amounts paid;
- outstanding supplier liabilities;
- supplier returns;
- relevant corrections.

Supplier reporting and broader business analytics will be defined later.

---

## 23. What Sabi Shop Should NOT Do

Sabi Shop should not unnecessarily complicate basic purchasing by requiring:

- purchase orders;
- expected delivery quantities;
- expected supplier prices;
- automatic comparison against an order;
- automatic assumptions about supplier commitments.

Those features may be added later if a real business need is established.

The V1 principle is:

> **Record what actually happened, based on the information the business enters.**

---

## 24. Edge Cases

### 24.1 Supplier delivers more than someone expected

Record the quantity actually received.

Sabi Shop does not need to know that it was “more than ordered” unless an order was separately recorded.

### 24.2 Supplier delivers less than someone expected

Record the quantity actually received.

No artificial quantity should be created to match an external expectation.

### 24.3 Supplier price is higher or lower than someone expected

Record the actual acquisition cost entered by management.

No automatic “price variance” is required unless the business later chooses to record an expected price/order.

### 24.4 Goods arrive but payment has not been made

Record the received inventory and the supplier liability.

### 24.5 Goods arrive and are partly paid

Record the full received inventory, the payment made, and the remaining liability.

### 24.6 Part of a delivery is returned

Record the received inventory first, then record the supplier return as a separate linked event.

### 24.7 Goods are damaged after acceptance

Follow Inventory Rules for damaged/non-sellable stock.

### 24.8 A purchase record contains an error

Correct it through an auditable correction mechanism. Do not silently overwrite history.

---

## 25. Dependencies

This deliverable depends on and must remain consistent with:

- D00 — Product Requirements Foundation & Decision Register
- D02 — Domain Dictionary / Business Glossary
- D03 — Sales & Transaction Rules
- Inventory Rules
- Payment model
- Offline & Synchronization Rules
- Roles & Permissions Matrix
- Financial & Business Performance Model
- Audit & Data Integrity Rules

---

## 26. Delegated Implementation Details

The following are intentionally owned by downstream specifications rather than left as business-rule contradictions:

1. Exact Owner vs Manager purchasing permissions.
2. Exact staff permission for recording physical receipt information.
3. Purchase/receipt data model.
4. Supplier liability data model.
5. Exact supplier payment-method implementation.
6. Exact supplier-return workflow and approval UX.
7. Exact synchronization/conflict behaviour.
8. Exact audit/hash-chain implementation.
9. Cost-basis method for profit/COGS calculations.
10. Advanced purchase orders or expected-delivery functionality.
11. Supplier performance metrics and reporting formulas.

These are deferred implementation or downstream business-model decisions, not unresolved contradictions in the core purchasing rules.

---

## 27. Review Checklist

Before locking this deliverable, verify:

- [x] Staff are not responsible for purchasing.
- [x] Staff may help arrange purchasing/receiving activities.
- [x] Management owns supplier relationships.
- [x] Sabi Shop records what management says was received.
- [x] The system does not invent purchase-order information.
- [x] Inventory increases when received inventory is recorded.
- [x] Inventory cannot be recorded as received before it comes in.
- [x] Actual acquisition cost is recorded rather than inferred.
- [x] Supplier credit is supported.
- [x] Multiple supplier payments are supported.
- [x] Supplier returns are supported.
- [x] Post-acceptance damage follows inventory rules.
- [x] Supplier price history is preserved.
- [x] Supplier profile changes do not rewrite historical events.
- [x] Purchase corrections preserve history.
- [x] Unreceived purchases are not recorded as completed inventory receipts.
- [x] Supplier and inventory records remain traceable.
- [x] Core operations are designed for offline use.
- [x] No unnecessary purchase-order complexity is required for V1.

---

## 28. Current Status

**Formalized working draft.**

The business rules above represent the current agreed direction from discovery.

The next step is a cross-check against the existing Inventory, Sales, Pricing, Incentive, and broader financial rules before this deliverable is locked.

---

# FINAL RECONCILIATION — SUPPLIER RETURNS

Approved supplier returns are separate linked events. If the related payable is unpaid, the accepted return reduces the outstanding payable. If it has already been paid, the return creates a supplier credit/receivable. Replacement goods are recorded as separate linked receipt events. Any actual refund/credit settlement is a separate successful settlement event. V1 inventory valuation follows weighted-average costing.
