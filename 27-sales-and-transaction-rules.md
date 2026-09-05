# D03 — Sales & Transaction Rules

**Product:** Sabi Shop  
**Document ID:** D03  
**Status:** FINAL — RECONCILED V1

## 1. Purpose

Define exactly how Sabi Shop records, completes, pays for, attributes, edits, and corrects sales.

The core principle is simple: **Sabi Shop records real business activity, not customer conversations or unconfirmed payments.**

## 2. What Counts as a Sale

A sale becomes an official completed sale when:

1. One or more products are recorded.
2. Actual quantities are recorded.
3. Actual selling prices are recorded.
4. Payment has been made and recorded, including an approved credit component where applicable.
5. Any required authorization has been satisfied.
6. The transaction reaches the appropriate completion state.

A salesperson may use Sabi Shop to check price or availability while engaging a customer. They do not need to create a sale merely because they are speaking to a customer.

## 3. Sale States

### Draft / In Progress
A sale currently being entered but not yet completed. It is not a permanent completed-sale record.

### Abandoned
The customer does not proceed. The unfinished sale can be discarded and does not need to become a permanent transaction.

### Partially Paid
Some payment has been made, but the sale has not satisfied its completion conditions. The outstanding amount remains visible.

Example: ₦50,000 due, ₦20,000 paid → **Partially Paid**, ₦30,000 outstanding.

### Completed
The sale has satisfied its payment and authorization conditions and becomes an official historical sale.

### Corrected / Returned / Refunded
A completed sale may later have an approved correction, return, refund, or reversal. The original sale is not deleted.

## 4. Payment Requirement

Sabi Shop only records an official completed sale when the required payment has actually been made and recorded.

The following do **not** count as confirmed payment:

- A promise to pay
- An unconfirmed bank transfer
- A payment screenshot that has not been verified
- A pending payment
- A verbal claim that payment was made

There is no separate “payment pending sale” workflow in V1.

## 5. Payment Methods

V1 supports:

- Cash
- Bank Transfer
- POS/Card
- Customer Credit

A sale may use more than one method.

## 6. Split Payments

A single sale may contain multiple payment components.

Examples:

- ₦50,000 cash + ₦50,000 transfer
- ₦40,000 cash + ₦60,000 credit
- ₦20,000 POS + ₦30,000 cash + ₦50,000 credit

Each component is recorded separately and linked to the same sale.

The system must show the total paid, credited amount, and any outstanding balance clearly.

## 7. Customer Credit

Customer credit is a supported payment component and requires Owner/Manager authorization under the established rules.

Credit may cover the whole sale or part of it.

Example:

**Sale:** ₦100,000  
**Cash:** ₦40,000  
**Customer credit:** ₦60,000

The ₦60,000 becomes customer debt under the Credit & Debt Rules.

An approved credit component can satisfy the payment arrangement required to complete a sale. A genuinely incomplete partial payment remains **Partially Paid**.

The later Credit & Debt Rules must formalize this distinction precisely.

## 8. Bank Transfer

An unconfirmed transfer is not a completed payment.

Goods must not leave based only on the customer's claim that they have transferred money.

No “payment pending” sale needs to be created.

## 9. Cash and Change

For cash payment:

1. The system records the amount received.
2. The system calculates/displays change due.
3. The salesperson physically handles the cash.
4. The salesperson gives the customer the change.
5. The cash movement is recorded.

Example: ₦18,500 sale, ₦20,000 received → ₦1,500 change.

## 10. Sale Total and Line Items

Each sale item preserves:

- Product/SKU
- Quantity
- Actual selling price
- Applicable discount/price adjustment
- Line total

The sale total is based on the actual values used at the time.

Changing today's product price must never rewrite a historical sale.

## 11. Haggling and Negotiated Pricing

Haggling is a normal supported sales behavior.

The salesperson records the actual price agreed with the customer, subject to configured authority rules.

Example:

Current price: ₦5,000  
Agreed price: ₦4,700

The historical sale records ₦4,700 even if the product later becomes ₦5,500.

## 12. Discounts and Price Authority

Discounts and negotiated prices may be governed by configurable authority rules.

Two concepts must remain distinct:

**System Authorization:** the action cannot proceed until required authority is obtained.

**Management Review:** the action may proceed but is flagged for later Owner/Manager review.

Routine authorized discounts must work offline.

Exact thresholds and authority rules belong in the Pricing & Discount Rules.

## 13. Salesperson Attribution

The user who actually performs the sale receives the sales attribution.

This applies whether the seller is:

- Staff
- Manager
- Owner

Attribution is based on who actually performed the sale, not simply who owns the business.

Assisted-sale attribution, if needed, will be defined later.

## 14. Inventory Effect

A completed sale normally reduces recorded stock by the quantities sold.

The inventory movement must be linked to the sale.

Negative stock is allowed. A sale may proceed even if it causes negative stock, while management receives appropriate visibility/alerts.

## 15. Offline Sales

Core sales operations must work offline.

An offline sale is recorded locally and later synchronized.

Offline synchronization, transaction identity, and conflict handling belong in the Offline & Synchronization Rules.

## 16. Duplicate Protection

Sabi Shop must reduce the risk of the same real-world sale being recorded twice.

Synchronization must not blindly create duplicate copies of a locally recorded sale.

Any duplicate discovered later must remain traceable and correctable.

## 17. Abandoned Sales

If a customer changes their mind before completion, the unfinished sale can simply be discarded.

Examples:

- Customer decides not to buy.
- Price cannot be agreed.
- Customer leaves to get money.
- Customer was only checking information.

These interactions should not inflate completed-sales reports.

## 18. Editing Completed Sales

A completed sale may be edited during a configured short correction window.

**Everything about the sale may potentially be edited**, including:

- Products/items
- Quantities
- Selling prices
- Discounts
- Customer
- Payment method
- Payment amounts
- Credit component
- Salesperson attribution
- Other sale fields

However, editing must never silently erase history.

Every edit must:

1. Preserve the original state/history.
2. Record the new state.
3. Identify who made the edit.
4. Record when it happened.
5. Flag the transaction as edited.
6. Remain available for audit/review.

The exact edit window and authorization requirements belong in later rules.

## 19. Historical Integrity

Changing current product information must not rewrite historical sales.

A sale records what actually happened at the time, including its actual selling price and quantity.

Purchase/acquisition cost is a separate historical value and must not be overwritten by later purchases.

## 20. Transaction Identity

Every completed sale needs a unique transaction/reference number.

It must support:

- Finding the sale
- Receipt reference
- Payment linkage
- Inventory linkage
- Return/refund linkage
- Edit/audit linkage

The exact ID format is a technical/data-model decision.

## 21. Receipts

A completed sale should produce a digital receipt that can be viewed in-app and shared using the phone's normal sharing options.

Minimum receipt content:

- Business identity
- Date/time
- Items
- Quantities
- Actual prices
- Discount where applicable
- Payment method(s)
- Total
- Transaction/reference number

The receipt reflects the actual recorded sale and must remain usable offline after an offline sale is recorded.

## 22. Failed or Interrupted Entry

If sale entry is interrupted before completion, it must not be falsely marked as a completed sale.

The user may discard the unfinished operation.

Incomplete operations must not appear in completed-sales reporting.

## 23. Sales Integrity Rules

1. No confirmed payment, no completed sale.
2. No confirmed transfer, no goods released on that transfer.
3. Customer conversations are not sales.
4. Abandoned sale attempts do not become completed sales.
5. Actual selling price is preserved historically.
6. The actual salesperson receives attribution.
7. Split payments remain linked to one sale.
8. Credit may be combined with other payment methods.
9. Partial payment is not silently treated as full payment.
10. Negative stock does not automatically block a sale.
11. Completed-sale edits remain auditable.
12. Returns do not delete the original sale.
13. Offline sales remain valid and synchronize later.
14. Current product prices never rewrite historical sale prices.

## 24. Delegated Implementation Details

These belong in later deliverables:

- Correction window: configurable, 15-minute V1 default
- Which edits require authorization
- Discount/price-floor thresholds
- Incentive calculations
- Exact credit authorization flow
- Exact partial-payment settlement workflow
- Receipt numbering format
- Offline ID and synchronization design
- Duplicate-detection mechanism
- Profit/cost-basis calculations
- Return/refund/reversal states
- Midnight/business-day handling
- Assisted-sale attribution

## 25. Dependencies

D03 must remain consistent with:

- D00 — Product Requirements Foundation & Decision Register
- B01 — Business Model
- D02 — Domain Dictionary / Business Glossary

It feeds into:

- Pricing & Discount Rules
- Salesperson Performance & Incentive Rules
- Inventory Rules
- Credit & Debt Rules
- Returns & Refund Rules
- Cash & Reconciliation Rules
- Financial & Business Performance Model
- Roles & Permissions Matrix
- Offline & Synchronization Rules
- Audit & Data Integrity Rules
- Product Catalog & Search Specification
- UX/User Flow Specification
- Data Model/Schema
- Acceptance Criteria/Test Scenarios

## 26. Review Checklist

Before locking D03, confirm:

- Sale completion definition
- Partial-payment behavior
- Credit behavior
- Split payments
- Transfer confirmation
- Abandoned sales
- Haggling/actual prices
- Salesperson attribution
- Negative stock
- Offline sales
- Duplicate protection
- Full sale editing with audit history
- Receipt requirements
- Any missing real-world sales scenario
- Consistency with D00, B01, and D02

**Current status: FINAL — RECONCILED V1**

---

# FINAL RECONCILIATION — SALES RULES

- Correction window: configurable, **15-minute V1 default**.
- Transfer confirmation: Staff may confirm after external evidence is checked; confirmation is logged/reviewable.
- Negative stock does not automatically block a legitimate sale, but the resulting exception state is explicitly surfaced for management investigation.
- Correction severity follows the ordinary vs high-integrity model.
- Completed sale history remains preserved; corrections create subsequent traceable state.
