# D02 — Domain Dictionary / Business Glossary

**Product:** Sabi Shop  
**Document ID:** D02  
**Status:** FINAL — RECONCILED V1  
**Purpose:** Establish a single, unambiguous vocabulary for Sabi Shop so product, design, development, QA, support, and future documentation use the same meanings.

---

## 1. How to use this glossary

A term defined here has a specific Sabi Shop meaning. Where everyday shop language differs from the system meaning, the system meaning takes precedence for product and technical decisions.

The glossary should be updated whenever a later deliverable introduces a genuinely new business concept or clarifies an existing one.

---

# 2. Business and People

## Business
The shop or commercial operation being managed in Sabi Shop.

A user may have more than one business in V1.

## Owner
The person who owns or has ultimate authority over a business.

The Owner can perform sales and other operational activities, not just administrative review.

## Manager
A person given management authority over some or all business operations.

A Manager may perform sales and management activities according to configured permissions.

The exact Manager capability set is defined later in the Roles & Permissions Matrix.

## Staff / Salesperson
A person who performs day-to-day selling activities for the business.

A salesperson is normally the person physically serving the customer and completing the sale.

## User
A person with an account that can access Sabi Shop.

A user may be associated with one or more businesses.

## Customer
A person or entity that purchases goods from the business.

A customer record is especially important when the customer owes the business money.

## Supplier
A person or business from whom the shop obtains stock or other goods for resale.

## Business Day
The operational day represented by a shop's opening-to-closing activity.

The exact technical treatment of dates, midnight crossings, and reopening after interruption is defined later.

---

# 3. Products and Inventory

## Product
A type of item the business sells.

A product has a business-defined identity and may have attributes such as name, unit, selling price, stock quantity, and purchase history.

## SKU
A distinct stock-keeping item used by the business to identify and track a sellable inventory item.

The exact SKU structure and whether businesses may have variants/barcodes are defined later.

## Stock / Inventory
The goods currently held by the business for sale.

Inventory quantity represents physical/business stock and is separate from cash.

## Stock Quantity
The quantity of a particular SKU that the system believes is currently available based on recorded stock movements.

## Stock Movement
A recorded event that changes the quantity of a product in inventory.

Examples include:
- Purchase/stock received
- Sale
- Approved return to stock
- Stock adjustment
- Damage/loss/write-off
- Other explicitly supported inventory movement

## Stock Adjustment
A deliberate change to the recorded stock quantity to reconcile the system with the business's actual stock.

Adjustments must be traceable and must not silently rewrite historical sales or purchases.

## Negative Stock
A state in which the recorded stock quantity for an item falls below zero.

Sabi Shop may allow a sale that produces negative stock rather than blocking the salesperson, while alerting management for follow-up.

## Restock
Obtaining additional stock because inventory needs to be replenished.

Restocking may be based on observed demand, current stock, expected customer needs, or management decisions.

## Unit
The business-defined measurement in which a product is bought, stored, or sold.

Examples may include piece, carton, bag, litre, metre, set, or other units.

## Unit Conversion
A business-defined relationship between units for the same product.

Example: 1 carton = 12 pieces.

The exact rules for conversions, rounding, and whether conversions can change historically are defined later.

---

# 4. Sales and Pricing

## Sale
A completed business event in which the business provides one or more goods to a customer in exchange for payment, credit, or a combination of supported payment methods.

A sale is a historical event. Its recorded item prices and other transaction values must remain historically accurate even if current product prices later change.

## Transaction
A recorded business event in Sabi Shop.

A transaction may represent a sale, purchase, payment, return, refund, expense, withdrawal, stock adjustment, or another supported event.

A transaction is broader than a sale.

## Sale Item / Line Item
One product and quantity recorded as part of a sale.

Each line may have its own actual selling price.

## Selling Price
The price at which a product is currently offered or sold.

The system must preserve the actual price used on a historical sale even if the product's current selling price changes later.

## Actual Selling Price
The price the customer actually pays per unit for a particular sale item after any negotiated pricing or discount.

This is distinct from the current/default selling price.

## Default / Current Selling Price
The business's currently configured normal selling price for a product.

Changing it does not rewrite historical sales.

## Haggling / Negotiated Price
A selling price agreed with a customer that differs from the normal/current selling price.

Sabi Shop treats negotiated pricing as a normal reality of small-business selling, subject to configured authority and review rules.

## Discount
A reduction from the normal/current price or applicable sale value.

Discounts may be routine/authorized or may require management review depending on configured rules.

## Price Floor / Minimum Allowed Price
The lowest price a salesperson is permitted to sell a product for under the configured incentive/discount rules.

The exact authority and exception model is defined later.

## Price Exception
A sale price outside the normal authority/rules for that product or transaction.

Depending on configuration, an exception may be blocked or may be allowed and flagged for management review.

## Profit Contribution / Margin
The economic value remaining after the applicable acquisition cost is considered against the actual selling value.

The exact calculation method and cost basis are intentionally not defined in this glossary and will be formalized in the Financial & Business Performance Model.

---

# 5. Money and Payments

## Payment
Money or value received by the business toward a sale, debt, or other receivable.

## Payment Method
The channel through which a payment is made.

V1-supported methods:
- Cash
- Bank Transfer
- POS/Card
- Customer Credit

## Cash
Physical money received or held by the business.

Cash is a form of money on hand and is not the same thing as revenue or profit.

## Opening Cash / Opening Change Cash
Physical cash brought into the shop at the beginning of the business day for operational purposes such as giving customers change.

The amount is variable and is decided by the person providing the opening cash; it is not a fixed system amount.

Opening cash is not automatically treated as a day's sales or profit.

## Expected Cash
The amount of physical cash the system expects should be present based on recorded cash movements and the applicable opening cash/remittance rules.

## Actual Cash
The physical cash actually counted at reconciliation.

## Cash Variance / Cash Discrepancy
The difference between Expected Cash and Actual Cash.

Example: Expected Cash ₦355,000 and Actual Cash ₦352,000 produces a ₦3,000 shortage.

A discrepancy remains visible and traceable; it is not silently corrected.

## Cash Remittance / Handover
The physical transfer of cash held by a salesperson or other staff member to the person responsible for receiving it.

The exact workflow and records are defined in the Cash & Reconciliation Rules.

## Change
Physical cash returned to a customer when the amount received exceeds the amount due.

The system calculates/displays the expected change; the salesperson physically handles the cash.

## Split Payment
A single sale paid using more than one payment method.

Example: part cash and part bank transfer.

Each payment component must be recorded separately while remaining linked to the same sale.

## Bank Transfer
Payment made by transfer to the business's bank account.

A transfer is not considered confirmed merely because a customer says they have transferred money. Goods should not leave on an unconfirmed transfer.

## POS / Card Payment
Payment made through a card/POS channel.

## Customer Credit
A sale in which the customer receives the goods while some or all of the amount due remains outstanding.

Customer credit requires Owner/Manager authorization under the established rules.

## Repayment / Debt Payment
A payment made by a customer toward an outstanding credit balance.

Each repayment is its own payment record linked to the customer's debt.

## Debt / Receivable
Money a customer owes the business.

Customer debt is separate from cash already received.

## Proof of Clearance
A record or receipt showing that a customer's outstanding debt has been fully paid.

---

# 6. Revenue, Profit, Expenses, and Owner Money

## Revenue
The value of goods/services sold by the business according to the applicable business rules.

Revenue is not the same as cash received, profit, or inventory value.

## Expense
A business cost recorded as an expense.

Examples may include operating costs and other approved business spending.

An expense is not automatically the same thing as an inventory purchase.

## Inventory Purchase
A business transaction in which the business obtains stock from a supplier.

The purchase records the relevant product, quantity, acquisition/purchase cost, supplier, date, payment status, and related liability where applicable.

## Acquisition Cost / Purchase Cost
The cost at which the business obtained stock.

Historical acquisition cost must be preserved and must not be overwritten merely because a later purchase has a different cost.

The exact cost-basis method for calculating profit when the same SKU has multiple acquisition costs is defined later.

## Owner Funding / Capital Contribution
Money introduced by the owner into the business.

Owner funding is distinct from sales revenue and distinct from an inventory purchase.

## Owner Withdrawal
Money or value taken by the owner from the business for personal or owner-directed use.

An Owner Withdrawal is distinct from a business expense and should be recorded as such, including recipient and reason/description where required.

## Cash In Hand
The amount of physical cash currently held by the business or applicable cash custodian.

Cash in hand is not a direct measure of profit.

## Business Performance
The broader picture of how the business is performing, including sales, expenses, profitability, inventory movement, purchasing, receivables/payables, staff activity, and other relevant indicators.

Business performance must not be reduced to one number such as cash in hand.

---

# 7. Suppliers and Purchasing

## Purchase
A recorded acquisition of stock from a supplier.

## Purchase Cost
The cost associated with acquiring a product/quantity from a supplier.

## Supplier Credit
A purchase where the business receives stock while some or all of the supplier amount remains unpaid.

## Supplier Liability / Payable
Money the business owes to a supplier.

Supplier liabilities are separate from customer receivables.

## Purchase History
The historical record of purchases made from suppliers, including relevant products, quantities, costs, dates, payment status, and outstanding amounts.

---

# 8. Returns, Refunds, and Corrections

## Return
A customer bringing goods back to the business after a sale.

A return is a separate recorded event linked to the original sale where possible.

The original sale is not deleted.

Every return requires Owner/Manager approval under the established rules.

## Return Condition
The state of goods being returned.

Initial supported concepts:
- Good / Resalable
- Damaged
- Needs Inspection
- Other

The exact inventory and financial treatment for each condition is defined later.

## Refund
Money returned to a customer in connection with a return or other approved correction.

A refund is distinct from the physical return of goods.

## Transaction Edit
A permitted modification to an existing transaction during the allowed correction period.

Edits do not erase the fact that the original transaction existed. The system must retain an auditable history and flag the edit.

## Cancellation / Void
A mechanism for stopping or reversing a transaction according to explicitly defined rules.

The exact distinction between cancellation, void, return, refund, and reversal must be formalized before implementation.

---

# 9. Reconciliation and Accountability

## Reconciliation
The process of comparing what the system says should have happened with what was physically or operationally observed.

Examples:
- Expected cash vs actual cash
- Recorded stock vs physical stock
- Recorded payments vs confirmed receipts

## End-of-Day (EOD) Reconciliation
The closing process in which the salesperson/staff member reports the day's activity and hands over the required money/cash.

The staff member counts the physical cash and provides the report.

The system must support comparison between expected and actual results and preserve discrepancies for investigation.

## Expected vs Actual
A general comparison between a system-derived expected value and a physically observed or independently confirmed actual value.

## Variance
The difference between expected and actual.

A variance may be positive or negative depending on the context.

## Staff Accountability
The ability to trace operational activity to the user who performed it, including sales, applicable cash handling, edits, and other relevant actions.

Accountability is not the same as assuming wrongdoing when a variance occurs.

---

# 10. Authorization and Review

## Authorization
Permission required before an action may be completed.

Authorization may block an action until an authorized person approves it.

## Management Review
A post-action review by an Owner/Manager.

A management review does not necessarily block the original action.

Example: a permitted exception may be completed while being flagged for later review.

## Exception
An event that falls outside normal configured rules and therefore requires special handling, visibility, or review.

## Review Centre / Exception Centre
A management area intended to collect items requiring attention, such as:
- Discounted/exception sales
- Pending credit reviews
- Transaction edits
- Negative stock alerts
- Suspicious or unusual returns
- Other configured exceptions

The final feature name and exact scope are defined later.

---

# 11. Staff Incentives

## Incentive / Bonus
Additional compensation or reward associated with qualifying sales performance.

Sabi Shop's intended model may reward the salesperson for retaining value above a configured minimum selling price/floor.

Example:
- Normal/current price: ₦5,000
- Allowed floor: ₦4,500
- Actual sale: ₦4,700
- Amount above floor: ₦200

The incentive value gate, volume gate, and management configuration are defined by the Salesperson Performance & Incentive Rules.

## Incentive Floor
The configured minimum price used when determining whether additional selling value qualifies for an incentive.

The incentive model must not encourage staff to reject reasonable customers simply to maximize their own bonus.

---

# 12. Receipts and Records

## Receipt
A customer-facing record of a completed sale/payment.

V1 receipts should be digital/shareable and viewable in the app.

A receipt should contain, as applicable:
- Business identity
- Date/time
- Items
- Quantities
- Actual prices
- Discount
- Payment method(s)
- Total
- Transaction/reference number

## Transaction / Reference Number
A unique identifier used to locate and reference a recorded transaction.

## Record
Any persistent piece of business information stored by Sabi Shop.

Examples include transactions, products, customers, suppliers, payments, stock movements, and audit events.

## Audit Trail
A traceable history showing what important actions/events occurred, when they occurred, and who performed them.

Historical records should not disappear merely because a correction is made.

---

# 13. Offline and Synchronization Terms

## Offline
A state in which the device cannot currently rely on an internet connection but Sabi Shop must continue supporting applicable core operations.

## Sync / Synchronization
The process of transferring locally recorded information between a device and the central/backend system.

## Unsynced
Data recorded locally that has not yet successfully synchronized to the central system.

## Sync Status
The visible state indicating whether important data is synchronized, pending, failed, or otherwise requires attention.

## Stale Data
Data that may not represent the most recent state because synchronization has not completed.

For remote owner/manager monitoring, stale/unsynced status must be visible rather than presenting old information as if it were current.

---

# 14. Reporting and Decision Support

## Dashboard
A screen presenting high-value business information for quick understanding and action.

Owner/Manager dashboard concepts include:
- Total Sales
- Total Expenses
- Cash in Hand
- Business Performance
- Inventory/stock information
- Other decision-relevant indicators defined later

## Sales Performance
Information about sales activity over a selected period, including relevant measures such as sales value, quantity, products sold, and salesperson performance.

## Product Performance
Information showing how products are performing in sales and/or other relevant business measures.

## Customer Demand
Observed evidence of what customers are asking for or buying, useful for purchasing and restocking decisions.

## Business Growth
Change in the business's performance over time.

Growth should be measured using appropriate business metrics rather than assuming that increased cash automatically means growth.

---

# 15. Language and User-Facing Terms

## English
One of Sabi Shop's supported user-facing languages.

## Nigerian Pidgin
A deliberate supported user-facing language/content style for appropriate Sabi Shop interfaces and messaging.

The product should use understandable, practical language rather than unnecessary accounting jargon.

## Accounting Jargon
Specialized financial terminology that may be technically correct but unnecessarily difficult for the target user.

Sabi Shop should translate complex financial concepts into clear business language where possible without sacrificing accuracy.

---

# 16. Important Distinctions

These distinctions are foundational and must remain explicit throughout the product.

### Revenue ≠ Profit
Revenue is the value associated with sales; profit requires consideration of relevant costs.

### Revenue ≠ Cash
A credit sale can create revenue while leaving some or all of the money as a customer receivable rather than cash.

### Profit ≠ Cash
Cash can include opening cash, owner funding, loan/other inflows, or other movements and can be reduced by purchases, withdrawals, or expenses.

### Cash ≠ Inventory
Money held by the business and goods held for sale are different business resources.

### Customer Debt ≠ Cash
An unpaid customer balance is money owed to the business, not money already received.

### Supplier Debt ≠ Expense
An amount owed to a supplier is a liability; its accounting treatment and relationship to inventory acquisition are defined later.

### Inventory Purchase ≠ Operating Expense
Buying stock is not automatically treated as an operating expense.

### Owner Withdrawal ≠ Business Expense
Money taken by the owner for personal/owner use must remain distinguishable from business operating costs.

### Current Price ≠ Historical Sale Price
Changing today's product price must never rewrite yesterday's actual sale price.

### Return ≠ Deletion
Returning goods does not mean deleting the original sale.

### Management Review ≠ Authorization
Authorization can determine whether an action may occur; review can happen after an action has occurred.

### Expected Cash ≠ Actual Cash
Expected cash is system-derived; actual cash is physically counted.

---

# 17. Terms Intentionally Deferred

The following concepts need precise rules in later deliverables and should not be prematurely defined here:

- Detailed profit-reporting implementation beyond the canonical Gross Profit formula
- Detailed inventory costing implementation; V1 cost basis is weighted-average
- Tax/VAT configuration details; tax/VAT is first-class V1 financial data.
- Exact discount authority thresholds
- Incentive release/cutoff and settlement implementation details
- Exact supplier payment workflows
- Exact return/refund financial treatment
- Exact transaction cancellation/void/reversal behavior
- Exact stock adjustment authorization
- Exact multi-branch terminology
- Exact SKU/barcode model
- Exact unit-conversion rules
- Exact synchronization/conflict rules
- Detailed business-day/session implementation; V1 business day is an operational session that may cross midnight
- Exact permission matrix
- Exact audit-log technical implementation

---

# 18. Open Clarifications

The current glossary can proceed without blocking the next deliverables. The following points should be clarified when we reach the relevant rules rather than forcing premature decisions here:

1. **Transaction terminology:** whether “transaction” should remain the umbrella term for every business event, or whether some records should use a more specific “event” terminology.
2. **Cancellation vs void vs reversal:** exact business meanings and when each is permitted.
3. **Revenue timing:** whether Sabi Shop's operational reporting should recognize revenue at sale completion even when payment is on credit, subject to the later financial model.
4. **Stock ownership/timing:** exact moment stock becomes available after supplier purchase/receipt.
5. **Business Day:** an explicit operational session that may continue across midnight until official closure.
6. **Product/SKU relationship:** whether every sellable product must have exactly one SKU in V1.
7. **Unit conversions:** whether conversions can vary by product and how historical quantities are preserved.
8. **Return condition:** exact treatment of damaged/inspection items in inventory.
9. **Owner funding and withdrawals:** whether these should affect cash reporting only or also appear in broader financial reports.

These are deliberately left open because resolving them properly belongs in later domain-specific specifications.

---

# 19. Source-of-Truth Relationship

This glossary is subordinate to explicit business rules in later deliverables when a later document defines a more precise operational meaning.

If a later deliverable introduces a new concept:
1. Define it in that deliverable.
2. Add it to D02.
3. Check for conflicts with existing definitions.
4. Update affected documents before locking the final build specification.

---

# 20. Current Status

**D02 status:** FINAL — RECONCILED V1

The glossary is sufficiently developed to support the next domain-specific requirements work.

It should be reviewed for:
- Incorrect definitions
- Missing Nigerian small-business terminology
- Terms that users/developers may interpret differently
- Contradictions with D00 and B01
- Terms that should be renamed for clarity

After review, D02 can be locked and treated as the vocabulary baseline for subsequent deliverables.

---

# FINAL RECONCILIATION — CANONICAL TERMS

- **Business Day:** explicit operational session through official closure; may span midnight.
- **Cash in Hand:** operational/dashboard concept for physical cash attributable to the business.
- **Expected Cash:** system-derived physical cash for reconciliation.
- **Actual Cash:** physical count entered during reconciliation; not a routine Staff dashboard field.
- **Weighted-Average Cost:** V1 inventory cost-basis method.
- **Negative Stock:** permitted exception state, visible and requiring investigation.
- **Gross Selling Value:** pre-discount selling value.
- **Net Recognized Selling Value:** Gross Selling Value minus approved discount.
- **COGS:** cost basis attributable to goods sold.
- **Gross Profit:** Net Recognized Selling Value minus COGS.
- **Supplier Credit/Receivable:** traceable value owed by a supplier after an approved reduction of a paid purchase.
