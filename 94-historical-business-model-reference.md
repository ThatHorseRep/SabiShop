# Sabi Shop — B01 Business Model

**Document:** B01  
**Product:** Sabi Shop  
**Status:** Formalized — V1 business model  
**Purpose:** Establish the business/domain model and operating rules that Sabi Shop V1 is designed to support.

---

## 1. Purpose of B01

B01 defines the real-world business model Sabi Shop must represent before implementation begins.

It answers:

- Who uses Sabi Shop?
- What businesses can a user manage?
- How do sales happen?
- How are customers and suppliers represented?
- How does credit work?
- How does inventory purchasing work?
- How does money move?
- Who is allowed to perform sensitive actions?
- How should returns, discounts, and selling-price visibility behave?

B01 intentionally does **not** define detailed accounting formulas, database schema, UI screens, or technical architecture. Those belong in later deliverables.

---

# 2. Business Structure

## 2.1 Multiple Businesses

A single Sabi Shop user may manage or belong to **multiple businesses**.

The business is therefore a first-class entity.

A user should be able to switch between businesses they are authorized to access without creating a separate account for each business.

### V1 requirement

- Multiple businesses per user: **Yes**
- A business has its own users, inventory, transactions, customers/debtors, suppliers, and financial records.

---

## 2.2 Branches

Branches are **not supported in V1**.

The underlying business model should not make future branches impossible, but V1 should not introduce branch-management complexity into the product.

### V1 requirement

- Branches: **No**
- Future branch support: **Possible later**

---

# 3. Users, Roles and Permissions

Sabi Shop uses a **Role → Permission → User** model.

The system should not rely on one rigid, hard-coded combined role.

## 3.1 Core Roles

### Owner

The owner has authority over the business and may perform management activities.

Typical capabilities include:

- Viewing business performance
- Viewing sales and inventory
- Managing users
- Reviewing money movement
- Approving sensitive actions
- Reviewing reconciliation problems
- Managing pricing
- Managing suppliers
- Reviewing customer credit
- Recording money added to or taken from the business

### Manager

A manager may perform operational and supervisory activities according to assigned permissions.

A business may have:

- No dedicated manager
- One manager
- Multiple managers

### Staff / Salesperson

Sales staff handle normal sales operations and record their own business activity.

They should be able to:

- Search products
- See current selling prices
- See available stock
- Record sales
- Record money received
- Record money spent/handed out when authorized
- End their shift
- Reconcile their expected cash against physically counted cash
- Review their own relevant transactions

They should **not** automatically have access to sensitive business information such as acquisition costs, gross margins, or unrestricted price overrides.

---

## 3.2 Owner + Manager Capability

A user may possess both owner and manager capabilities.

This is important because some small businesses will have no separate manager.

The product should therefore grant capabilities through permissions rather than creating a special permanent "Owner Manager" role.

---

# 4. Sales Model

Sabi Shop is an operational sales system, not merely a historical sales recorder.

The sales flow must help staff make a sale correctly and quickly.

## 4.1 Who Records a Sale?

A sale is recorded under the user who actually conducted the sale.

Normal rule:

> If a salesperson is on duty, the salesperson handles the sale.

The owner/mum may assist, inspect, negotiate, or intervene when necessary, but if the salesperson remains the active salesperson, the transaction should remain attributable to the appropriate salesperson.

If no salesperson is on duty and the owner/mum sells directly, the sale is recorded under the owner's own user account.

This preserves accountability without preventing legitimate owner involvement.

---

# 5. Product and Selling-Price Model

## 5.1 Current Selling Price

Sabi Shop maintains a **current selling price** for each sellable product.

The current selling price is the price the business currently intends to charge customers.

It is independent from the historical price at which older inventory was purchased.

### Important business rule

Older stock does **not** have to retain an old selling price.

If the replacement cost of a product has increased, the business may sell existing older stock at the current/new selling price.

Therefore:

- Current selling price = current commercial price
- Historical acquisition cost = what the business paid when acquiring stock

These are separate concepts.

---

## 5.2 Selling-Price Visibility for Staff

Sales staff **must be able to see the current selling price while making a sale**.

The salesperson should not need to leave the sales flow and navigate to inventory just to discover the price.

Example:

> 1115 Connecting Rod Bearing  
> Selling price: ₦4,500  
> Available: 23

Staff can therefore use Sabi Shop as an actual sales tool.

---

## 5.3 Cost and Profit Visibility

Sales staff should not automatically see sensitive financial information such as:

- Acquisition cost
- Gross profit
- Margin percentage
- Cost history

Those are management-level business information.

Managers/owners may access them according to permission.

---

# 6. Discounts and Price Overrides

Discounts are a supported business activity, but they must remain controlled.

A salesperson should not be able to freely alter selling prices without the appropriate authorization.

Sensitive pricing actions should be governed by permissions/approval rules.

## 6.1 Multi-Item Discount Principle

A discount applied to a sale containing multiple products must be reflected correctly in profitability.

The system must **not assume that a bundle discount should simply be divided equally across all products**.

For example, two products can have the same selling price but radically different acquisition costs and gross-profit contributions. A ₦10,000 discount therefore should not automatically become ₦5,000 of discount cost against each item.

### Established business rule

> Discount allocation must consider the economic contribution of the products involved so that item-level revenue and gross-profit reporting remain meaningful.

The exact mathematical allocation method is **not finalized in B01**.

A dedicated Pricing & Discount Rules deliverable will define:

- The allocation formula
- Margin/profit considerations
- Minimum-margin protections
- Manual allocation where appropriate
- Rounding
- Edge cases
- Manager overrides
- How discounts appear in reports

This keeps B01 focused on the business model while ensuring the principle is already established.

---

# 7. Customer Model

Sabi Shop V1 does **not** require a general customer CRM.

Most ordinary customers who pay immediately do not need a stored customer profile.

However, customer records become necessary when the business sells on credit.

## 7.1 Credit Customers / Debtors

A customer who receives goods without paying the full amount immediately must be represented as a debtor.

Credit sales require:

- Customer identity/details sufficient to identify the debtor
- Items purchased
- Sale amount
- Amount paid, if any
- Amount outstanding
- Date/time
- User who recorded the transaction
- Subsequent repayments
- Remaining balance
- Payment method for repayments
- Relevant references/status

---

## 7.2 Credit Approval

Customer credit is a controlled business action.

**Manager/Owner approval is required.**

A salesperson should not independently create unrestricted customer debt.

---

## 7.3 Partial Credit Payments

Partial payments are supported.

Example:

- Credit sale: ₦100,000
- Customer pays: ₦40,000
- Outstanding: ₦60,000

Later payments reduce the outstanding amount until the debt is cleared.

When fully paid, the customer should be able to receive proof of payment/debt clearance showing relevant transaction history.

---

## 7.4 Credit Is Not Simply a Payment Method

For the domain model, credit is better understood as a **settlement status**.

The sale has occurred and inventory has left the business, but the full amount has not yet been received.

This distinction is important for accurate:

- Sales reporting
- Receivables
- Cashflow
- Reconciliation
- Business performance

---

# 8. Supplier Model

Suppliers are first-class business entities in V1.

A supplier record should support useful purchasing history.

The business should be able to understand:

- Who supplied a product
- What was bought
- When it was bought
- Quantity purchased
- Purchase cost
- Payment status
- Outstanding supplier liability, where applicable
- Historical purchasing relationships

This allows the business to compare suppliers and understand purchasing patterns.

---

# 9. Supplier Credit

Supplier credit is supported in V1.

A business may receive inventory from a supplier and pay later.

The system therefore needs to distinguish:

- Inventory received/acquired
- Amount paid
- Amount outstanding
- Supplier liability

Supplier credit should remain traceable until settled.

---

# 10. Inventory Purchasing

Inventory purchases must preserve historical acquisition information.

A purchase record should capture, at minimum:

- Supplier
- Product(s)
- Quantity
- Acquisition/buying price
- Total purchase amount
- Date/time
- Payment status
- Relevant outstanding amount when purchased on credit

The acquisition cost must remain historically traceable.

This is necessary for later:

- COGS calculations
- Profit calculations
- Stock valuation
- Purchasing analysis
- Price decisions

The system must not overwrite historical acquisition costs merely because a new purchase has a different cost.

---

# 11. Payment and Settlement Types

Sabi Shop V1 supports the following common sale settlement forms:

- Cash
- Bank transfer
- POS/card
- Credit

However, **credit is modeled as a settlement state rather than being treated identically to an immediate payment channel**.

For example:

- Cash sale → money received now
- Transfer sale → money received through bank transfer
- POS/card sale → money received through POS/card settlement
- Credit sale → customer owes money

Later financial specifications will define settlement timing and reconciliation details.

---

# 12. Physical Cash Model

Sabi Shop must not assume that all physical cash is held in one universal cash drawer.

In the initial operating model:

- Multiple staff may hold cash separately.
- Staff can accumulate cash from their own sales.
- Staff may hand money to the owner/authorized person.
- Staff may spend or hand out authorized business money.
- Each person's expected cash position must remain traceable.

This supports the real operating environment of small retail businesses.

---

# 13. Staff Cash and End-of-Shift Reconciliation

The system internally calculates expected cash from recorded transactions.

Staff do **not** need to maintain an "Actual Cash" figure continuously during the day.

The intended flow is:

**Record Sales → Record Money Out → End Shift → Physically Count Cash → Reconcile → Investigate Difference**

Example:

- Expected Cash: ₦355,000
- Cash physically counted: ₦352,000
- Difference: ₦3,000 short

The difference should trigger an investigation path rather than silently changing the records.

The original transactions remain traceable.

---

# 14. Money Added to the Business

The owner may put personal money into the business.

For example, the owner may add money to fund inventory purchasing.

This should be recorded as a distinct money movement with:

- Amount
- Date/time
- Person responsible
- Reason/description
- Appropriate classification

The subsequent inventory purchase remains a separate business transaction.

This distinction prevents the system from confusing:

> money entering the business

with:

> what the business spent that money on.

Detailed financial classification will be defined later.

---

# 15. Money Taken Out of the Business

Money may leave the business for several reasons.

Sabi Shop should not reduce all such activity to a vague "withdrawal" record.

A money-out record should capture sufficient context, including:

- Amount
- Recipient
- Description/reason
- Date/time
- User recording the transaction
- Appropriate classification

Examples include:

- Owner/personal withdrawal
- Money handed to a person on the owner's instruction
- Business expense
- Feeding/food expense
- Other legitimate business spending

Owner/personal withdrawals must remain distinguishable from genuine business expenses because they have different implications for business performance.

---

# 16. Business Expenses

The business may spend money on operational needs such as:

- Feeding/food
- Transport
- Supplies
- Other operating expenses

Expenses must be recorded as money-out activity with sufficient description and classification.

The detailed expense taxonomy and its effect on business performance will be defined in the financial model.

---

# 17. Returns

Returns are supported but are a controlled operation.

## 17.1 Approval

**Every return requires Manager/Owner approval.**

This applies even when the original receipt/sale is valid.

Reason:

A valid receipt proves that the sale occurred, but it does not automatically prove that the returned item is in acceptable condition.

The business may need to determine whether an item was:

- Unused
- Used
- Damaged
- Incorrectly supplied
- Otherwise eligible for return

---

## 17.2 Return Lookup

Normal return processing should use receipt/transaction lookup.

A no-receipt return may still be investigated through searchable transaction history.

However, approval remains mandatory.

---

## 17.3 Return Record

A return must create a **separate return/reversal record linked to the original sale**.

The original sale must never simply be deleted.

The history should remain traceable:

**Original Sale → Return Request/Action → Approval → Inventory/Financial Adjustment**

This preserves accountability and historical truth.

---

# 18. Owner Direct Sales

When a salesperson is actively on duty:

> The salesperson should normally handle the sale.

The owner may inspect, negotiate, or assist with the customer.

When no salesperson is on duty and the owner sells directly:

> The sale is recorded under the owner's own user account.

This keeps sales attribution consistent with the actual person conducting the transaction.

---

# 19. Business Model Principles

The following principles govern the B01 model.

### 19.1 Record the real event

Sabi Shop should represent what actually happened rather than forcing activity into artificial accounting categories.

### 19.2 Preserve historical truth

Historical transactions, acquisition costs, sales, returns, payments, and money movements should remain traceable.

### 19.3 Separate concepts that have different business meanings

Examples:

- Selling price ≠ acquisition cost
- Sale ≠ payment
- Credit ≠ immediate payment
- Money added ≠ inventory purchase
- Money taken out ≠ business expense
- Return ≠ deletion of original sale

### 19.4 Make accountability explicit

Important actions should be attributable to a user and, where necessary, require approval.

### 19.5 Keep V1 lightweight

Sabi Shop should support the real business without becoming an enterprise ERP or full accounting suite.

### 19.6 Build for future growth without adding V1 complexity

Multiple businesses are supported now.

Branches are intentionally deferred.

More advanced accounting and organizational structures can be added later without changing the core business concepts.

---

# 20. Explicit V1 Boundaries

The following are intentionally **not finalized by B01**:

### Deferred to Financial/Accounting Rules

- COGS cost-basis method (e.g. FIFO vs weighted average)
- Detailed profit calculations
- Stock valuation methodology
- Exact treatment of owner capital/injections in financial statements
- Detailed expense classification
- Cash/bank reconciliation rules

### Deferred to Pricing & Discount Rules

- Exact multi-item discount allocation formula
- Margin-aware discount algorithm
- Minimum-margin protection
- Discount rounding rules
- Complex promotional pricing
- Price override authorization workflow

### Deferred to Technical/Architecture Rules

- Database schema
- Offline data structures
- Sync/conflict resolution
- Audit hash-chain implementation
- Device/session security
- API architecture
- Branch-ready technical architecture

### Deferred to UX/Product Specifications

- Screen-by-screen flows
- Navigation
- Exact wording
- Nigerian Pidgin usage rules
- Onboarding
- Staff training/support
- Visual design

---

# 21. B01 V1 Decision Summary

| Area | V1 Decision |
|---|---|
| Multiple businesses per user | **Yes** |
| Branches | **No — later** |
| Owner | **Yes** |
| Manager | **Yes** |
| Multiple managers | **Supported** |
| Owner + Manager capabilities | **Supported through permissions** |
| General customer CRM | **No** |
| Credit customer records | **Yes** |
| Customer credit | **Yes — Manager/Owner approval** |
| Partial customer payments | **Yes** |
| Supplier records | **Yes** |
| Supplier credit | **Yes** |
| Cash sales | **Yes** |
| Bank transfer | **Yes** |
| POS/card | **Yes** |
| Credit settlement | **Yes** |
| Multiple staff cash holdings | **Yes** |
| Current selling price visible to sales staff | **Yes** |
| Cost/margin visible to sales staff | **No** |
| Controlled discounts/price overrides | **Yes** |
| Multi-item discount principle | **Profit/margin-aware; exact formula later** |
| Inventory purchase history | **Yes** |
| Historical acquisition cost | **Yes** |
| Old stock forced to old selling price | **No** |
| Returns | **Yes** |
| Return approval | **Always Manager/Owner** |
| No-receipt return investigation | **Yes** |
| Original sale deletion for returns | **Never** |
| Owner adding money to business | **Yes** |
| Owner/personal money taken out | **Yes** |
| Business expenses | **Yes** |
| Owner direct sales | **Yes, when owner is the seller** |

---

# 22. Completion Status

**B01 — Business Model: COMPLETE**

The business model is sufficiently established to proceed to the next foundational deliverable.

The remaining unresolved details are intentionally moved into later specifications rather than left as accidental ambiguity.

**Next deliverable:** B02 — Commerce Glossary / Domain Dictionary.

---

# FINAL RECONCILIATION — CANONICALITY

This duplicate business-model artifact is subordinate to the canonical `02-business-model.md` and the final decision register. Where differences exist, the canonical current package governs V1.
