# Sabi Shop — Product Vision

**Document ID:** A01  
**Version:** 1.1  
**Status:** Approved Working Specification  
**Product:** Sabi Shop

## 1. Product Vision

Sabi Shop is a simple, lightweight business management application designed to help small retail businesses accurately record sales, manage inventory, track business money, reconcile daily activity, and understand their financial performance without requiring complicated accounting or POS software.

Sabi Shop transforms day-to-day physical retail activities into a clear, trustworthy digital record.

The product should help a business answer:

- What did we sell?
- What do we still have?
- How much money came in?
- Where did the money go?
- What business expenses did we incur?
- How much cash should be in hand?
- Does the cash in hand tally with recorded activity?
- Who handled or authorised important transactions?
- Are we actually making money?
- Which products are performing best?
- How is the business progressing?
- Are we reinvesting enough into the business?

## 2. Product Context

Sabi Shop is initially being designed around the realities of a small agricultural equipment and engine-parts retail business.

The initial operating environment may include:

- A very large catalogue of individual SKUs and parts.
- Approximately 200 sales transactions per day.
- Multiple sales staff.
- Staff using individual phones as well as potentially shared shop devices.
- An owner who may also act as the manager.
- An owner/manager who may monitor the business remotely.
- Periods where internet connectivity is unavailable or unreliable.
- Staff and management handling sales, discounts, cash, business expenses, stock purchases, and handovers.

The product must therefore be designed around messy, real-world retail operations rather than an idealised shop environment.

## 3. Core Value Proposition

Sabi Shop's core value is not merely digitising a sales book.

It should continuously turn daily business activity into useful business information so that the owner does not have to reconstruct the business manually weeks later.

> **Sabi Shop does the business arithmetic continuously, so the owner does not have to spend a month reconstructing what happened.**

### Value to the Owner

- Understand what is happening in the business without being physically present every minute.
- See business performance.
- Understand sales, expenses, inventory and money movement.
- Identify strong and weak products.
- Monitor reinvestment and stock position.
- Maintain accountability.

### Value to the Manager

- Organise daily operations.
- Monitor sales and staff activity.
- Manage inventory.
- Review money movement.
- Reconcile operational activity.
- Investigate discrepancies.

### Value to Sales Staff

- Record sales quickly.
- Record money taken out of business funds.
- See their day's activity.
- Close their shift and reconcile.
- Know whether their recorded activity accounts for the cash they hand over.

## 4. Product Pillars

Sabi Shop V1 is built around six connected pillars:

1. **Sales** — record what the business sells.
2. **Inventory** — know what the business has and how stock changes.
3. **Cashflow / Money** — track money entering, leaving and moving through the business.
4. **Reconciliation** — compare expected cash with counted cash and identify discrepancies.
5. **Business Performance** — understand revenue, costs, profit, product performance and business progress.
6. **Accountability** — know who performed or authorised important actions and preserve trustworthy historical records.

These pillars must work together. A sale should not become an isolated record; it should contribute to the appropriate inventory, money, reconciliation and performance views.

## 5. V1 Product Scope Direction

Business Performance is explicitly included in V1.

The Owner/Manager experience should provide a business-level view covering, as appropriate:

- Sales/revenue.
- Cost of goods sold.
- Gross profit.
- Business expenses.
- Net business performance.
- Inventory remaining.
- Low-stock and out-of-stock items.
- Stock value where supported by the underlying inventory-cost model.
- Product performance.
- Money movement.
- Staff activity and accountability.
- Reconciliation status.

The Sales Staff experience should remain focused on operational execution rather than accounting analysis.

## 6. Sales Staff Cash Workflow

The sales staff dashboard must **not** require the staff member to maintain an "Actual Cash" figure throughout the day.

The intended workflow is:

**Record Sales → Record Money Out → End Shift → Physically Count Cash → Reconcile → Investigate Difference if Necessary**

The product may calculate **Expected Cash** internally for reconciliation, but the primary staff-facing concept is:

> **Cash in Hand**

"Cash in Hand" replaces the ambiguous term "Balance" when referring to the expected physical cash associated with the staff member's activity.

The reconciliation process is where the staff member enters or confirms the physically counted amount and discovers whether the recorded activity tallies.

Example:

- Expected Cash: ₦355,000
- Cash counted: ₦352,000
- Difference: ₦3,000 short

The system should help the staff member investigate relevant activity rather than simply displaying an unexplained error.

## 7. Owner and Manager Role Model

Sabi Shop must support:

- **Owner**
- **Manager**
- **Owner + Manager**

Owner and Manager are distinct roles because they represent different responsibilities, even though one person may legitimately hold both.

The system should use a **Role → Permission → User** model rather than creating a permanently separate special role for every possible combination.

This allows:

### Business with a dedicated manager

- Owner: strategic/business authority.
- Manager: operational authority.

### Business without a dedicated manager

- Owner: Owner + Manager permissions.

### Future growth

The permission model should be capable of supporting additional specialised roles without redesigning the entire authorization system.

## 8. Manager / Owner Business View

The Owner/Manager dashboard should make the business understandable at a glance.

It should surface, where applicable:

- Today's sales.
- Business performance.
- Money movement.
- Inventory remaining.
- Low-stock products.
- Out-of-stock products.
- Product performance.
- Staff activity.
- Reconciliation issues.
- Important alerts or exceptions.

Inventory is therefore a first-class part of the Manager/Owner experience, not a secondary administrative screen.

## 9. Product Principles

### 1. Simple by Default
The common action should be obvious and fast. Complexity should be hidden unless it is needed.

### 2. Speed Matters
The application must support fast retail operations and a high daily transaction volume without making staff wait unnecessarily.

### 3. Record Once, Use Everywhere
Information should be entered once and reused across sales, inventory, money, reconciliation and reporting wherever appropriate.

### 4. Every Important Number Should Be Explainable
A displayed number should have a traceable underlying calculation or set of transactions.

### 5. Historical Truth Matters
Important financial and operational history should not be silently rewritten or destroyed.

### 6. Offline Should Be Normal
Loss of connectivity should not make normal shop operations impossible. Offline operation and later synchronisation are core requirements, not an afterthought.

### 7. Human-Friendly, Not Accountant-Heavy
The underlying financial model must be sound, but the interface should use language and workflows ordinary business operators can understand.

### 8. Lightweight
Sabi Shop should solve the most important problems extremely well rather than becoming an overloaded ERP.

### 9. Designed for Messy Real-World Retail
The product must account for discounts, handovers, mistakes, missing connectivity, corrections, returns, stock discrepancies and other realities of small businesses.

### 10. Trustworthy
The user must be able to trust what Sabi Shop says about sales, stock, money and performance.

## 10. Nigerian Market and Language Direction

Sabi Shop is being designed for Nigerian small-business realities.

English is the primary product language.

**Nigerian Pidgin is also an intentional UX/content consideration**, especially for friendly guidance, warnings, confirmations, onboarding and selected contextual messages where it improves comprehension and feels natural.

Pidgin should not be forced into every part of the interface. Financial figures, formal records and important business information should remain clear and unambiguous.

The future UX Writing Specification (C09) will define:

- Where English is preferred.
- Where Nigerian Pidgin is useful.
- Tone and vocabulary.
- Translation/content rules.
- Error and reconciliation messaging.
- Whether language can be changed by the user or business.

## 11. What Sabi Shop Is Not

Sabi Shop should not become:

- An enterprise ERP.
- Complicated accounting software.
- A feature-heavy generic POS.
- A restaurant management platform.
- A bloated CRM.
- A social network.
- A marketplace.
- An unnecessarily sophisticated inventory suite.
- An "everything for everyone" business application.

Features should be judged against the core product problem before being added.

## 12. Strategic Development Approach

Sabi Shop should first be proven against the difficult operating conditions of the real-world business that inspired it.

The initial business is a valuable product test environment because it exposes the application to:

- High SKU complexity.
- High transaction volume.
- Multiple operators.
- Owner involvement in sales.
- Negotiated discounts.
- Money handed between people.
- Business and personal money movement.
- Manual end-of-day reconciliation.
- Stock decisions based on performance.
- Offline conditions.

Once the product works reliably in this environment, the underlying model can be generalised for other small retail businesses.

## 13. V1 Success Direction

Sabi Shop V1 should succeed if a small-business owner can reliably use it to answer, without reconstructing the business manually:

1. What did we sell?
2. How much money came in?
3. What money went out, and why?
4. What cash should be accounted for?
5. Did the recorded cash tally?
6. What stock do we have left?
7. Which products are performing?
8. What is the business's financial performance?
9. Who handled important transactions?
10. What needs attention?

If the product cannot answer these questions reliably, additional features should not take priority over fixing the core system.

## 14. Guiding Product Statement

> **Sabi Shop helps small businesses know what happened, know what they have, know where their money went, and know whether the business is actually progressing — without making them become accountants.**
