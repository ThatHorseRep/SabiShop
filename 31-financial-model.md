# Sabi Shop --- Financial & Business Performance Model

**Phase:** 3 --- Financial Truth\
**Status:** FINAL — RECONCILED V1
**Authority:** Financial truth derived from approved sales, pricing,
inventory, purchasing, credit, returns, cash and incentive rules.

## 1. Purpose

Define how Sabi Shop distinguishes sales, revenue, cash, inventory
value, cost of goods sold, gross profit, receivables, payables,
expenses, owner withdrawals and business performance.

## 2. Core Principle

Sabi Shop must never equate cash with profit. Financial views must be
reconstructable from recorded business events.

## 3. Financial Domains

-   Sales and recognized selling activity
-   Confirmed payments and cash movement
-   Cost of goods sold
-   Inventory valuation
-   Customer receivables/debt
-   Supplier liabilities
-   Operating expenses
-   Owner withdrawals
-   Returns/refunds
-   Incentive obligations
-   Reconciliation differences

## 4. Core Relationships

For a completed sale item:

- **Gross Selling Value** = pre-discount selling value.
- **Discount** = approved discount.
- **Net Recognized Selling Value** = Gross Selling Value − Discount.
- **COGS** = applicable weighted-average cost basis of goods sold.
- **Gross Profit** = Net Recognized Selling Value − COGS.

Discount must not be subtracted twice. Inventory costing follows B06
weighted-average costing and preserves historical acquisition/cost
information. A later change in product cost must not rewrite historical COGS.

Cash follows B05:
`Expected Cash = Confirmed Opening Cash + Cash received from completed sales + Cash In − Cash Out − Cash refunds paid from till`.

Customer debt and supplier debt are liabilities/receivables derived from
events, not cash balances.

## 5. Performance Views

The system should support: - daily, weekly and monthly sales; - gross
profit; - cash movement; - inventory position/value; - customer
receivables; - supplier payables; - expenses; - owner withdrawals; -
returns; - reconciliation status; - performance by product and
salesperson where authorized.

## 6. Timing Rules

A report must distinguish: - transaction date/time; - event completion
time; - payment confirmation time where relevant; - return/correction
time; - reporting period.

Historical records must remain stable when later corrections are made;
corrections create traceable effects rather than erasing history.

## 7. Treatment of Returns

Approved returns reverse or adjust the relevant economic effects
according to B04/B06/B05. Rejected returns have no financial effect.

## 8. Treatment of Credit

A credit sale contributes to the sale/performance record while the
unpaid portion remains customer receivable. Repayment is a separate
confirmed payment event.

## 9. Treatment of Supplier Credit

Received inventory creates the purchase/inventory event. The unpaid
portion creates supplier liability. Supplier liability is not
automatically an operating expense.

## 10. Reconciliation

Financial reporting must expose discrepancies rather than silently force
totals to agree.

## 11. Integrity Requirements

Every material figure must be traceable to underlying business events.
Reports are derived views, not independent sources of truth.

## 12. Deferred Detail

Exact journal implementation, tax treatment, advanced accounting
standards, statutory reporting and external accounting integrations are
outside this model unless separately approved.

---

# FINAL RECONCILIATION — FINANCIAL TRUTH

## Gross profit
**Gross Selling Value** = pre-discount selling value.  
**Discount** = approved discount.  
**Net Recognized Selling Value** = Gross Selling Value − Discount.  
**COGS** = applicable weighted-average cost basis of goods sold.  
**Gross Profit** = **Net Recognized Selling Value − COGS**.

This is the canonical formula and prevents double subtraction of discount.

## Tax/VAT
Tax/VAT is a first-class V1 financial value. Tax must be separately represented from selling value and discount and included in the configured totals/reporting.

## Supplier returns
Unpaid supplier returns reduce payable. Paid supplier returns create supplier credit/receivable until separately settled. Replacement goods are separate receipt events.

## Incentives
Incentive calculations use the approved floor-based value gate and additionally require the configured minimum qualifying completed-sales threshold before payout.
