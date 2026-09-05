# B06 — Inventory Accounting Rules

**Product:** Sabi Shop  
**Document ID:** B06  
**Title:** Inventory Accounting Rules — Exactly how stock moves.  
**Status:** FINAL — RECONCILED V1  
**Scope:** V1

---

## 1. Purpose

B06 defines how Sabi Shop accounts for inventory quantity and inventory cost as stock moves through the business.

The core principle is:

> **Record → Preserve → Compare → Investigate → Correct**

Inventory history must remain explainable. Sabi Shop must not silently rewrite historical stock movements merely to make the current balance look correct.

B06 defines inventory mechanics and costing. Broader financial interpretation belongs in the Financial & Business Performance Model.

---

## 2. Inventory Identity

### B06-RULE-001 — Product identity is preserved

A product remains the same product/SKU even when its supplier, purchase price, or acquisition cost changes.

A change in purchase cost must not create a duplicate product merely because the supplier now charges a different price.

### B06-RULE-002 — Purchase history is preserved

Every inventory purchase/receipt preserves its own:

- product;
- quantity;
- unit;
- acquisition cost;
- supplier;
- date;
- payment status;
- related purchase information.

A later purchase must never overwrite an earlier purchase cost.

This preserves the acquisition history required for inventory and business analysis.

---

## 3. Inventory Cost-Basis

### B06-RULE-003 — Weighted-average costing

For V1, Sabi Shop uses **weighted-average costing** for inventory cost and COGS.

Where the same product has been acquired at different costs, Sabi Shop maintains an applicable weighted-average cost rather than assigning stock to individual purchase layers.

Example:

- 10 units × ₦1,000 = ₦10,000
- 10 units × ₦1,290 = ₦12,900
- Total = 20 units costing ₦22,900
- Weighted-average cost = ₦1,145 per unit

The original purchase events remain preserved even though the active inventory cost is represented through the weighted-average method.

### B06-RULE-004 — Historical COGS is preserved

A completed sale uses the applicable inventory cost determined under the costing rules at the time of the sale.

Future supplier-price changes must not silently rewrite historical COGS or historical transaction profit.

---

## 4. Historical Cost vs Current Replacement Cost

### B06-RULE-005 — Historical cost and replacement cost are different concepts

Sabi Shop must not treat weighted-average inventory cost as the same thing as current replacement cost.

**Historical/Inventory Cost** answers:

> What acquisition cost is applicable to the inventory under our costing method?

**Current Replacement Cost** answers:

> What would it cost the business to replace this stock now?

These are separate values and serve different purposes.

### B06-RULE-006 — Replacement cost is based on current acquisition information

Current replacement cost must be based on the **latest reliable acquisition price**, not calculated from the weighted-average inventory cost.

Example:

- Weighted-average inventory cost = ₦1,145
- Latest reliable acquisition price = ₦1,362.50
- Current selling price = ₦1,300

Sabi Shop may therefore show:

- Historical/inventory cost: ₦1,145
- Selling price: ₦1,300
- Historical gross profit before other applicable costs: ₦155
- Current replacement cost: ₦1,362.50
- Amount below replacement cost: ₦62.50

This does **not** change the historical COGS from ₦1,145 to ₦1,362.50.

### B06-RULE-007 — Replacement-cost analysis is a management view

Replacement-cost information is intended to support:

- purchasing decisions;
- pricing decisions;
- restocking awareness;
- identification of selling prices that may no longer be sufficient to replace stock.

Replacement-cost analysis is not itself a rewrite of historical accounting profit.

### B06-RULE-008 — Selling price below replacement cost

Where the current selling price is below the current replacement cost, Sabi Shop should be capable of flagging the product for management attention/pricing review.

This flag does not automatically change the product price.

### B06-RULE-009 — Profit is not automatically spendable cash

Neither historical gross profit nor replacement-cost margin should be presented as the amount the owner can automatically withdraw from the business.

Cash, profit, inventory, supplier liabilities, customer receivables, expenses, and owner withdrawals remain distinct business concepts.

---

## 5. Negative Stock

### B06-RULE-010 — Negative stock is permitted

Sabi Shop permits sales that result in negative stock, consistent with the established business rule.

A negative-stock sale must not be blocked merely because the system's recorded quantity is insufficient.

The resulting negative quantity remains visible for management investigation.

### B06-RULE-011 — Cost of negative-stock sales

Where a sale occurs while there is insufficient recorded stock to establish a reliable inventory cost, Sabi Shop must not invent a historical purchase cost that it does not know.

The sale may temporarily carry an **undetermined/provisional COGS state**.

When reliable acquisition information later becomes available, Sabi Shop may calculate the applicable cost and record the resulting adjustment transparently.

The original sale must remain preserved.

### B06-RULE-012 — Later receipt does not erase the negative stock

If Sabi Shop shows **-3 units** and the business physically receives **10 units**, the purchase/receipt is recorded as **10 units received**.

The receipt does not get reduced to 7 units merely to make the balance appear zero.

The existing -3 position remains part of the inventory history and is resolved through the appropriate accounting/investigation logic.

---

## 6. Units and Conversions

### B06-RULE-013 — Base unit

Each product has a defined base unit.

Inventory quantities are ultimately represented in the product's base-unit system.

### B06-RULE-014 — Configurable conversions

Businesses may define conversions such as:

- 1 carton = 12 pieces;
- 1 dozen = 12 pieces;
- 1 bag = 50 kg.

The business defines what its units mean.

### B06-RULE-015 — Historical conversion preservation

When a conversion changes, historical transactions retain the conversion that applied when they were recorded.

A new conversion must not rewrite old inventory movements.

### B06-RULE-016 — Base-unit changes protect the existing ledger

A change to a product's base-unit definition must not casually transform or rewrite the existing inventory ledger.

Existing stock history remains protected.

---

## 7. Monetary Precision and Rounding

### B06-RULE-017 — Monetary precision

Sabi Shop must maintain sufficient internal precision for inventory calculations.

Monetary values are ultimately rounded to the **nearest kobo (₦0.01)**.

The system must not round monetary calculations to the nearest naira merely for convenience.

### B06-RULE-018 — Quantity precision

Quantity precision must support the product's configured unit/conversion requirements.

Fractional quantities may be supported where the business/product requires them.

---

## 8. Inventory Conditions

### B06-RULE-019 — Sellable and non-sellable stock

V1 distinguishes at least:

- **Sellable stock**
- **Non-sellable/Held stock**

### B06-RULE-020 — Damaged/non-sellable movement

When stock becomes damaged or otherwise non-sellable, Sabi Shop records a stock movement that moves the quantity out of sellable stock and into the appropriate non-sellable/held state.

The history and reason are preserved.

Example:

> 20 units → 18 sellable + 2 non-sellable/held.

### B06-RULE-021 — Inventory loss/write-off

When management confirms that stock is genuinely lost, stolen, expired, or otherwise requires write-off, Sabi Shop records an inventory loss/write-off event rather than silently changing the stock quantity.

The financial impact of such losses is interpreted in the Financial Model.

### B06-RULE-022 — Stock found/recovered

Stock previously recorded as lost and subsequently found is restored through a new **stock found/recovered** event.

The previous loss event is not silently erased.

---

## 9. Customer Returns

### B06-RULE-023 — Resalable returned goods

A customer return that is approved and determined to be resalable returns to sellable inventory.

Its inventory cost is associated with the original sale/cost applicable to the returned quantity.

### B06-RULE-024 — Damaged returned goods

A returned item that is damaged or otherwise not resalable does not automatically return to sellable stock.

It enters the appropriate non-sellable/held state.

### B06-RULE-025 — Return history

A return is a separate inventory event linked to the original sale where possible.

The original sale is never deleted simply because goods are returned.

---

## 10. Supplier Returns

### B06-RULE-026 — Supplier-return treatment

Supplier returns are recorded as inventory events and must preserve the relevant history.

The exact accounting treatment of the associated cost/valuation is **management-decided**.

Sabi Shop must not silently erase the original purchase history.

---

## 11. Purchase Corrections

### B06-RULE-027 — Correcting a purchase

If an acquisition cost is later discovered to be incorrect, Sabi Shop must preserve the original recorded purchase and create an appropriate correction/adjustment.

Example:

- 100 units originally recorded at ₦1,000;
- 60 units have already been sold;
- the correct supplier cost is later discovered to be ₦1,100.

The correction must not silently rewrite the original purchase or completed sales.

The resulting inventory/COGS adjustment must remain traceable.

### B06-RULE-028 — Payment timing does not determine inventory cost

Whether a purchase is paid immediately, partially paid, or bought on supplier credit does not by itself change the acquisition cost assigned to the inventory.

Inventory cost and supplier liability/payment status remain separate concepts.

---

## 12. Supplier Discounts and Additional Stock

### B06-RULE-029 — Supplier discounts

Where a supplier discount changes the effective acquisition price of stock, the effective net acquisition cost is used for inventory costing.

Example:

> Supplier price = ₦1,000  
> Discount = ₦100  
> Effective acquisition cost = ₦900

### B06-RULE-030 — Free/bonus stock

Where a supplier provides additional units free with a purchase, V1 may treat the total acquired quantity as part of the same acquisition and allocate the total acquisition cost across the total quantity.

Example:

> Pay for 10 units at ₦1,000 = ₦10,000  
> Receive 2 additional units free  
> Total acquired = 12 units  
> Effective cost = ₦833.33... per unit before kobo rounding.

The underlying purchase/receipt information remains recorded.

---

## 13. Physical Stock Counts and Discrepancies

### B06-RULE-031 — Physical count does not overwrite the ledger

A physical stock count compares observed physical quantity with system quantity.

A difference first becomes an **inventory discrepancy/investigation**, not an automatic overwrite.

Example:

> System = 100  
> Physical count = 96  
> Difference = -4  
> Status = inventory discrepancy awaiting investigation.

### B06-RULE-032 — Investigation precedes correction

Management investigates possible causes, including:

- unrecorded sale;
- wrong quantity;
- incorrect stock movement;
- damaged/missing stock;
- theft/suspected loss;
- counting error;
- other documented causes.

Once the cause is established, the appropriate corrective inventory event is recorded.

### B06-RULE-033 — Corrections remain auditable

A correction must not make the original discrepancy disappear from history.

The system must preserve:

1. what the system originally said;
2. what was physically observed;
3. what investigation found;
4. what corrective event was made;
5. who authorized/recorded the correction;
6. when it occurred;
7. the reason.

---

## 14. Inventory Movement Ledger

### B06-RULE-034 — Every stock change is traceable

Every inventory quantity change must have a traceable movement/event.

This includes, as applicable:

- purchase/receipt;
- sale;
- customer return;
- supplier return;
- damage;
- loss/write-off;
- stock found/recovered;
- physical-count correction;
- authorized manual adjustment;
- other approved inventory events.

### B06-RULE-035 — No silent quantity changes

The system must never silently change inventory quantity without an attributable event.

A current stock balance is the result of recorded inventory movements; it is not an independently editable number.

---

## 15. Inventory Valuation Views

### B06-RULE-036 — Cost valuation

Sabi Shop's primary inventory accounting value is based on inventory acquisition cost under the selected costing method.

### B06-RULE-037 — Selling-value view

Sabi Shop may separately show the potential selling value of inventory using current selling prices.

Selling value must not be confused with inventory cost.

### B06-RULE-038 — Multiple business views remain distinct

The system must keep distinct:

- inventory quantity;
- inventory cost;
- selling value;
- historical COGS;
- historical gross profit;
- current replacement cost.

These values answer different business questions and must not be collapsed into one number.

---

## 16. Explainability

### B06-RULE-039 — Cost explainability

Sabi Shop must be able to explain the basis of an inventory cost.

For example:

> Average inventory cost: ₦1,145  
> Based on preserved acquisition history from the applicable purchase events.

The user should be able to trace the figure back to the underlying inventory movements/purchases.

### B06-RULE-040 — Historical records remain understandable

Changes in purchase cost, selling price, conversion rules, returns, losses, and corrections must not make earlier inventory history misleading or impossible to explain.

---

## 17. Management and V1 Boundaries

### B06-RULE-041 — Management control

Management remains responsible for decisions requiring judgment, including supplier-return treatment and inventory exceptions where the business rules explicitly delegate the decision to management.

### B06-RULE-042 — B06 boundary

B06 defines **inventory truth and inventory movement**.

It does not replace later specifications for:

- broader financial statements;
- safe owner withdrawals;
- business-growth interpretation;
- detailed expense classification;
- tax/VAT treatment;
- technical database/schema implementation;
- offline synchronization/conflict resolution;
- detailed permissions;
- transaction lifecycle/correction policy outside inventory mechanics.

---

## 18. Locked Decisions Summary

| Area | V1 Decision |
|---|---|
| Cost-basis method | **Weighted average** |
| Historical purchase costs | **Preserved** |
| Historical COGS | **Preserved; future prices do not rewrite it** |
| Current replacement cost | **Separate from weighted-average cost** |
| Replacement-cost basis | **Latest reliable acquisition price** |
| Selling price below replacement cost | **Management attention/pricing-review flag** |
| Negative stock | **Allowed** |
| Negative-stock COGS | **Do not invent unknown cost; resolve transparently when reliable cost becomes available** |
| Later receipt after negative stock | **Record the full physical receipt** |
| Units/conversions | **Business-configurable** |
| Historical conversions | **Preserved** |
| Monetary precision | **Nearest kobo (₦0.01)** |
| Sellable/non-sellable | **Supported in V1** |
| Inventory loss | **Recorded as an inventory event** |
| Found stock | **New recovery event** |
| Customer return cost | **Original applicable sale cost** |
| Damaged return | **Non-sellable/held** |
| Supplier return | Unpaid return reduces payable; paid return creates supplier credit/receivable; replacement is a separate receipt event. |
| Purchase correction | **Correct through traceable adjustment, never silent rewrite** |
| Supplier discount | **Use effective net acquisition cost** |
| Free/bonus stock | **Allocate total acquisition cost across total acquired quantity** |
| Physical count discrepancy | **Investigation first, correction second** |
| Inventory movement history | **Every stock change traceable** |
| Inventory cost explainability | **Required** |
| Selling value | **Separate view from cost** |

---

## 19. Status

**B06 — Inventory Accounting Rules: FINAL — LOCKED**

This document establishes the V1 inventory-accounting foundation for Sabi Shop.

Later specifications may define implementation details, but they must not contradict these locked business rules without an explicit product decision and revision of this document.

---

# FINAL RECONCILIATION — INVENTORY ACCOUNTING

V1 uses **weighted-average costing**. Later receipts affect the future applicable cost basis but must not rewrite historical COGS/results.

Negative stock is **operationally permitted** so a legitimate sale is not automatically blocked by incomplete/delayed stock records. It is an exception state that must remain visible and trigger management investigation; it is not a healthy inventory condition.
