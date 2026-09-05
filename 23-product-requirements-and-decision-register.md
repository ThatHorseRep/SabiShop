# D00 — Product Requirements Foundation & Decision Register

**Product:** Sabi Shop  
**Document:** D00 — Product Requirements Foundation & Decision Register  
**Status:** FINAL — RECONCILED V1
**Purpose:** Establish the business/product foundation and authoritative decisions for later Sabi Shop deliverables.

---

## 1. Document Purpose

D00 establishes the foundation for Sabi Shop before detailed design and development.

It defines:

- what Sabi Shop is and is not;
- the target business context;
- the core V1 operating model;
- terminology and business principles;
- confirmed product decisions;
- unresolved decisions that must not be silently assumed;
- boundaries between D00 and later deliverables;
- rules for making and recording future product decisions.

D00 is a **source-of-truth foundation**, not the complete technical or UX specification.

### Decision status vocabulary

| Status | Meaning |
|---|---|
| **CONFIRMED** | Explicitly agreed business/product rule. |
| **PROPOSED** | Sensible candidate rule, but not yet accepted as final. |
| **UNDECIDED** | Deliberately left open; must not become an implicit system rule. |
| **NEEDS RESEARCH** | Requires external/business/technical validation. |
| **LATER DELIVERABLE** | Important, but detailed definition belongs in another specification. |
| **FUTURE/V2** | Recognized future capability outside current V1 scope. |
| **REJECTED** | Considered and intentionally not adopted. |

---

# 2. Product Foundation

## 2.1 Product Vision

Sabi Shop is intended to be a lightweight but rigorous **POS and business operating system for small retail businesses**.

Its core purpose is to help a business reliably record and understand:

- daily sales;
- inventory;
- money received and spent;
- customer credit/debt;
- supplier purchases and liabilities;
- staff activity;
- business performance;
- operational exceptions and discrepancies.

The product should feel simple enough for daily shop operations while preserving the underlying records and controls needed for trustworthy business management.

## 2.2 Target Business Context

The initial real-world reference business is a small retail shop selling agricultural equipment, engine parts, accessories, belts, tools and related goods.

Examples of products include:

- GX160 engine
- A11 mill
- 1115 connecting rod bearing
- 13 bolt and nut
- 175 top gasket
- 950 piston
- 8HP crankshaft
- rice mill flat belt
- B65 belt
- 12x13 spanner
- tank hose
- A11 pulley
- 1110 rings

The product must not be designed so narrowly that it only works for this business. The underlying model should support a broad range of small retail businesses.

## 2.3 V1 Product Character

Sabi Shop should be:

- lightweight;
- operationally fast;
- understandable to non-technical users;
- offline-first;
- rigorous about financial and inventory records;
- useful on phones;
- capable of remote owner/manager visibility;
- adaptable to Nigerian retail realities;
- available in English and Nigerian Pidgin through a deliberate language/content system.

Sabi Shop is **not** intended to become a bloated ERP/accounting package in V1.

---

# 3. Core Business Problems

The product exists to reduce problems such as:

1. Manual sales records becoming difficult to reconcile.
2. Difficulty knowing what sold and how much money should exist.
3. Difficulty understanding stock levels and stock history.
4. Difficulty calculating business performance.
5. Difficulty distinguishing business money from household/personal withdrawals.
6. Difficulty tracking customer debts and repayments.
7. Difficulty tracking supplier purchases and outstanding amounts.
8. Loss of visibility when the owner is away from the shop.
9. Errors or misconduct being difficult to identify after the fact.
10. Manual calculations delaying decisions about reinvestment and business growth.
11. Staff haggling creating uncertainty about actual selling prices.
12. Offline/network problems interrupting shop operations.

---

# 4. V1 Scope Principles

## 4.1 Core V1 Capabilities

V1 is expected to cover, at minimum:

- sales/POS;
- inventory;
- product catalog/search;
- pricing and discounts;
- cash/payment recording;
- expenses;
- owner withdrawals;
- customer credit/debt;
- supplier/purchasing records;
- returns;
- transaction corrections;
- receipts;
- staff activity/performance;
- manager/owner business performance;
- reconciliation;
- offline operation and synchronization;
- auditability/data integrity;
- role-based access.

## 4.2 V1 Exclusions / Boundaries

V1 should not attempt to become a complete enterprise accounting or ERP system.

Potentially complex areas such as advanced accounting, sophisticated CRM, broad integrations, branch management, and advanced enterprise functionality are not core V1 objectives unless later decisions explicitly bring them into scope.

Detailed definitions are delegated to later deliverables.

---

# 5. Users, Roles & Responsibility Model

## 5.1 Core Roles

The initial roles are:

- **Owner**
- **Manager**
- **Staff / Salesperson**

Owner and Manager may be the same person.

The system should therefore be based on **capabilities/permissions**, not assumptions that only one fixed human can perform a role.

Multiple managers/users may be supported.

A single user may operate multiple businesses in V1.

## 5.2 Staff/Salesperson

Staff normally:

- performs sales while on duty;
- records actual selling prices;
- handles customer payments;
- records operational expenses when permitted;
- counts physical cash at reconciliation;
- gives the owner the day's cash/report.

Staff should not normally have access to sensitive acquisition cost, margin, or full business financial analysis.

## 5.3 Owner/Manager

Owner/Manager users may:

- conduct sales themselves;
- authorize or review exceptional actions;
- review discounts;
- review credit;
- investigate discrepancies;
- manage inventory;
- view business performance;
- manage staff;
- review exceptions and audit events.

---

# 6. Real-World Shop Workflow

The reference daily workflow is:

### Morning

1. The owner/mother has the previous day's cash.
2. The salesperson opens the shop.
3. The owner decides how much cash to provide as opening/change money.
4. The salesperson receives that money and brings it to the shop.
5. The amount is variable; it is not necessarily a fixed daily amount.

Opening/change money is **not sales revenue**.

### During the day

The salesperson:

- sells goods;
- records sales;
- receives cash, transfer, POS/card, or records credit;
- gives physical change for cash transactions;
- records permitted expenses;
- records other relevant money movements;
- may sell at negotiated prices within applicable authority;
- may perform actions that later require management review.

The owner/mother may also arrive and personally conduct sales or negotiate with customers.

### Closing

1. The salesperson counts the cash physically.
2. The salesperson prepares/gives the day's report.
3. The salesperson hands over all cash in their possession, including opening/change money.
4. The owner uses the report and records to review the day's activity.
5. The broader business calculations/review may include sales, expenses, money taken, profit/performance, inventory, and reinvestment considerations.

---

# 7. Sales Attribution

**CONFIRMED**

The person who actually performs the sale receives the sale attribution.

Examples:

- Staff performs the sale → staff gets attribution.
- Owner performs the sale → owner gets attribution.
- Manager performs the sale → manager gets attribution.

The system must not automatically attribute every sale to the person logged into the shop if another user actually performed it.

Detailed handover rules belong in the Sales & Transaction Rules deliverable.

---

# 8. Sales & Payment Principles

## 8.1 Payment Methods

Supported payment methods:

- Cash
- Bank transfer
- POS/card
- Customer credit

## 8.2 Split Payments

**CONFIRMED**

A single transaction may use multiple payment components.

Example:

- Total = ₦100,000
- Cash = ₦40,000
- Transfer = ₦60,000

The transaction must preserve the individual payment components.

## 8.3 Transfer Confirmation

**CONFIRMED BUSINESS PRINCIPLE**

If a customer says they have transferred money but payment has not been confirmed, goods do not leave the shop.

The exact technical/operational definition of confirmed transfer belongs in the Payment/Sales specification.

## 8.4 Cash Change

The app may calculate/display the expected change.

The salesperson physically handles the cash.

The V1 design should not unnecessarily complicate this routine operation.

## 8.5 Historical Transaction Values

**CONFIRMED**

Historical transactions must preserve the actual price/value at the time of the transaction.

Later price changes must not rewrite historical sales.

---

# 9. Pricing, Haggling & Discounts

Haggling is a normal part of the target business environment and must be supported rather than removed.

## 9.1 Actual Selling Price

Staff must record the **actual price charged**.

The system must not allow a transaction to claim a lower price than the amount actually collected.

## 9.2 Old Stock / New Selling Price

**CONFIRMED**

Old stock does not retain an old selling price merely because it was purchased earlier.

If the business's current selling price changes, old stock may be sold at the current/new selling price.

Historical acquisition cost remains preserved separately.

## 9.3 Staff Discount Authority

Discount authority should be configurable.

Potential controls may include:

- allowed minimum price/floor;
- product/category-specific limits;
- temporary authority;
- exceptional review.

Exact rules belong in the Pricing & Discount Rules deliverable.

## 9.4 Post-Sale Management Review

**CONFIRMED DIRECTION**

When an owner/manager is not physically present, a salesperson may in appropriate circumstances make a sale at a negotiated discount and have the transaction reviewed later.

This is **management review**, not necessarily a blocking approval.

The owner/manager can later confirm that the discount was permitted or identify it as misconduct.

## 9.5 Authorization vs Review

The system must distinguish:

**System approval**
- action is blocked until authorization.

**Management review**
- action can occur;
- system flags it;
- manager reviews it later.

This distinction is important throughout Sabi Shop.

## 9.6 Multi-Item Discounts

The impact of a discount across multiple products should consider each product's profit contribution rather than blindly distributing the discount equally.

The exact pricing/discount allocation formula is owned by D04 Pricing & Discount Rules. V1 profitability then consumes the resulting Net Recognized Selling Value and weighted-average COGS.

---

# 10. Financial Principles

The system must not collapse the following concepts into one number:

- revenue;
- profit;
- cash;
- inventory;
- receivables;
- payables.

## 10.1 Cash in Hand

The main dashboard term is **Cash in Hand**, not "Balance."

Cash in Hand should reflect relevant physical/business cash movements, not be presented as equivalent to profit.

## 10.2 Business Performance

Manager/Owner users should have Business Performance in V1.

Performance must not misleadingly imply that all apparent appreciation/value increase in old inventory is immediately spendable profit.

The detailed financial model belongs in the Financial & Business Performance Model deliverable.

## 10.3 Reinvestment vs Spendable Money

The system must eventually distinguish between:

- accounting/business performance;
- cash actually available;
- inventory tied up in the business;
- money required to replenish stock;
- money that can reasonably be spent without weakening the business.

Exact calculations belong later.

---

# 11. Opening Cash, Cash Custody & Reconciliation

## 11.1 Opening Cash

Opening/change cash is:

- provided by the owner;
- variable;
- intended primarily to enable change-making;
- not revenue.

## 11.2 Staff Cash Custody

Physical cash may be held by individual staff members until remittance.

The system must not assume that every shop has one shared cash drawer.

## 11.3 Expected vs Actual Cash

The system should calculate expected cash from recorded cash movements.

The salesperson physically counts actual cash at closing.

Example:

- Expected cash = ₦355,000
- Physical cash = ₦352,000
- Difference = ₦3,000 shortage

The system must preserve the discrepancy rather than silently changing records to make the numbers match.

Detailed cash movement and reconciliation rules belong in Cash & Reconciliation Rules.

---

# 12. Expenses & Owner Withdrawals

## 12.1 Business Expenses

Business expenses occurring during the day must be recordable and reflected in cash reconciliation and business performance.

## 12.2 Owner Withdrawal

Money taken by the owner for personal/household purposes must be distinguishable from ordinary business expenses.

The label **Owner Withdrawal** should be used.

It should capture, as applicable:

- amount;
- recipient;
- description/reason.

This remains an owner withdrawal even if the owner directs the payment to another person.

## 12.3 Owner Funding

Money added to the business by the owner may be recorded as:

- amount;
- date;
- reason/reference.

An inventory purchase should then be recorded separately rather than pretending the owner funding itself was a purchase.

---

# 13. Customer Credit / Debt

## 13.1 V1 Customer Record

A lightweight customer/debtor record is required.

Minimum information:

- Name
- Phone number
- Address
- Photograph, if the customer permits

A general CRM is not required for V1.

Ordinary cash/transfer/POS customers do not need full customer profiles.

## 13.2 Credit Authorization

Credit sales require Owner/Manager authorization.

However, real-world verbal authorization may be accepted when the owner/manager is not physically present.

Such a transaction should be flagged for EOD management review/approval.

## 13.3 Credit as Settlement State

Credit is better represented as a settlement/debt state than treated simply as an ordinary completed payment method.

## 13.4 Partial Repayment

Credit supports partial payments.

Every repayment is its own payment record and should have its own receipt.

When fully paid, the system should be capable of issuing proof of debt clearance/payment.

Detailed debt aging, approval, reminders, disputes, and settlement rules belong in Credit & Debt Rules.

---

# 14. Inventory

## 14.1 Inventory Scope

Sabi Shop must support inventory across potentially large product catalogs.

The system should preserve:

- product identity;
- quantities;
- current selling price;
- acquisition/purchase history;
- historical costs;
- stock movements.

## 14.2 Multiple Purchase Costs

A product may be purchased at different acquisition costs over time.

The system must preserve each purchase event and must not overwrite old purchase costs with the latest cost.

V1 uses **weighted-average costing** for inventory and COGS. Historical COGS remains stable after a completed sale.

## 14.3 Negative Stock

**CONFIRMED**

If the system says stock is zero/negative but the physical product is available:

- the salesperson is allowed to complete the sale;
- the salesperson should not be interrupted or annoyed with a negative-stock warning;
- the manager receives an alert/exception;
- the manager investigates the stock discrepancy.

This prioritizes the reality of the physical shop while preserving management visibility.

## 14.4 Units & Conversions

The product should support configurable units and conversions.

Examples may include:

- carton → pieces;
- dozen → pieces;
- other business-defined units.

The business defines what the unit/conversion means. The system must not blindly hard-code assumptions that every business uses a unit in exactly the same way.

Detailed rules belong in Inventory Rules.

---

# 15. Product Search

Because the target catalog can contain many similar product codes/names, product search must be robust.

Potential matching should support, as appropriate:

- exact code;
- partial code;
- product name;
- aliases;
- categories;
- common spelling variations;
- other safe search signals.

The UI should reduce the risk of selecting the wrong product.

Detailed search behavior belongs in Product Catalog & Search Specification.

---

# 16. Offline-First Operation

Offline capability is a core product requirement.

The system must support routine shop operation when connectivity is unavailable.

Routine authorized discounts should continue working offline.

The owner/manager may view business information remotely, but remote information must indicate whether data is current, pending synchronization, or stale.

The owner must not be given a false impression that remote data is fully current when the shop device has unsynchronized changes.

Detailed synchronization, conflict handling, device identity, and concurrency belong in Offline & Synchronization Rules.

---

# 17. Offline Stock Concurrency

The possibility of two staff members independently recording a sale of the same final physical item exists in theory.

The current business assessment is that physical shop reality and payment/customer interaction make invisible simultaneous sales relatively uncommon.

This is therefore **not a D00 blocker**.

However, real-time stock awareness, synchronization, conflict detection, and reconciliation should be addressed in later technical/offline specifications.

---

# 18. Returns

## 18.1 Authorization

**CONFIRMED**

Every return requires Owner/Manager approval.

This applies even where the original sale/receipt exists.

Reason: the business needs protection against cases where goods may have been damaged after purchase.

## 18.2 Receipt / Transaction Lookup

Normal returns should use receipt/transaction lookup where available.

No-receipt returns may be investigated/searchable but still require Owner/Manager approval.

## 18.3 Original Transaction Preservation

A return must not delete the original sale.

The return is a separate linked reversal/return event.

## 18.4 Returned Goods Condition

When a product is returned, the authorized person should be asked to determine its condition/treatment, such as:

- good/resalable;
- damaged;
- needs inspection;
- other.

The inventory consequence should follow the recorded condition.

Detailed return/refund behavior belongs in Returns & Refund Rules.

---

# 19. Transaction Corrections

Transactions should be editable for a **short period** after creation.

Any edit must be flagged for management review.

The original event must remain auditable; corrections must be traceable rather than silently rewriting history.

The exact edit window and editable fields belong in Sales & Transaction Rules and Audit/Data Integrity Rules.

---

# 20. Receipts

V1 minimum receipt direction:

**Digital/shareable receipt.**

It should:

- be viewable in the app;
- work offline;
- be shareable using the phone's normal share options;
- support channels such as WhatsApp, Telegram, email, etc. without requiring dedicated integrations.

Receipt information should include, at minimum:

- business identity;
- date/time;
- items;
- quantities;
- actual prices;
- discounts;
- payment method(s);
- total;
- transaction/reference number.

Dedicated printing hardware and SMS receipts are not core V1 requirements unless later brought into scope.

---

# 21. Staff Performance & Incentives

A salesperson incentive system is required as a future-detailed V1 rule set.

The business concept is that a salesperson may earn a configured share of value retained above a minimum/allowed selling price.

Example:

- Normal/current price = ₦5,000
- Allowed floor = ₦4,500
- Sale at ₦4,700 → ₦200 retained above floor
- Sale at ₦5,000 → ₦500 retained above floor

A configured fraction may become a salesperson bonus.

## Incentive Principle

The incentive system must **not encourage staff to reject reasonable customers merely to chase the highest possible price**.

The objective is to reward effective selling within acceptable business rules, not simply maximum price.

Manager/Owner should be able to understand salesperson performance and the value staff contributes.

Potential metrics may include:

- successful sales;
- revenue;
- value retained above minimum;
- discount behavior;
- returns;
- suspicious behavior;
- other quality indicators.

Exact calculations and anti-gaming rules belong in Salesperson Performance & Incentive Rules.

---

# 22. Dashboards & Visibility

## 22.1 Main Daily Dashboard

The core daily dashboard should include:

- **Total Sales**
- **Total Expenses**
- **Cash in Hand**

## 22.2 Staff Dashboard

Staff should have an operationally simple interface.

Staff should **not** have a separate "actual cash" tab.

At reconciliation:

- staff counts physical cash;
- system provides expected cash;
- discrepancy can be identified/investigated.

Staff should normally see:

- current selling price;
- availability;
- operational sale information.

Staff should not normally see:

- acquisition cost;
- margins;
- detailed business profit analysis.

## 22.3 Owner/Manager Dashboard

Owner/Manager users should have:

- business performance;
- inventory/stock visibility;
- exception/review visibility;
- financial information appropriate to their permissions.

A future/proposed **Manager Exception/Review Centre** could consolidate:

- discounted sales needing review;
- post-sale edits;
- credit transactions pending review;
- negative stock alerts;
- suspicious returns;
- other management exceptions.

This remains an implementation-level requirement delegated to the appropriate downstream technical specification and must not contradict confirmed business rules.

---

# 23. Audit & Data Integrity Principles

The system must preserve trustworthy history.

Core principles:

1. Historical transactions are not rewritten by later price changes.
2. Corrections are traceable.
3. Returns are separate events linked to original transactions.
4. Payment components are preserved.
5. Discrepancies remain visible.
6. Management review does not erase the original event.
7. Inventory purchase history remains available.
8. Financial categories must not be collapsed into misleading totals.

A stronger technical audit trail, including the previously considered hash-chain concept, belongs in the later Audit & Data Integrity Rules / technical architecture work.

---

# 24. Language & Content

English and Nigerian Pidgin are product requirements.

Language should not be implemented as ad-hoc translations scattered throughout the UI.

The product should have a deliberate language/content system so that:

- wording is consistent;
- important financial terms retain stable meanings;
- future translation/content updates are manageable.

Detailed terminology and content rules belong in the Domain Dictionary and Language & Content Specification.

---

# 25. Business Performance & Financial Model — Boundary

The following concepts must eventually be explicitly modeled:

- sales/revenue;
- COGS;
- gross profit;
- operating expenses;
- net operating result;
- cash;
- inventory value;
- receivables;
- payables;
- replenishment needs;
- owner funding;
- owner withdrawals;
- business progress;
- spendable cash vs business/profit position.

D00 establishes the requirement for this distinction but does not define every accounting formula.

---

# 26. Confirmed Decisions Register

The following are currently treated as **CONFIRMED**:

1. Sabi Shop is a lightweight POS/business operating system for small retail businesses.
2. V1 focuses on daily operations rather than becoming a full ERP/accounting suite.
3. Owner, Manager and Staff/Salesperson are core roles.
4. Owner and Manager may be the same user.
5. Multiple managers/users may exist.
6. A user may operate multiple businesses in V1.
7. Branches are not V1 but future architecture should not prevent them.
8. Whoever actually performs a sale receives attribution.
9. Owner/Manager can personally perform sales.
10. Staff normally performs sales while on duty.
11. Main dashboard uses Total Sales, Total Expenses and Cash in Hand.
12. Staff does not need an actual-cash dashboard tab.
13. Owner/Manager gets Business Performance in V1.
14. Staff normally sees current selling price and availability, not acquisition cost/margins.
15. Opening/change cash is owner-provided, variable, and not revenue.
16. Staff hands over all cash at closing, including opening change.
17. Staff physically counts cash at closing and gives a report.
18. Cash may be held by individual staff until remittance.
19. Expected vs actual cash discrepancies remain visible and are not silently corrected.
20. Cash, transfer, POS/card and customer credit are supported settlement mechanisms.
21. Split payments are supported.
22. Unconfirmed transfer means goods do not leave.
23. App can calculate/display cash change; salesperson handles physical change.
24. Historical transaction prices are preserved.
25. Old stock may be sold at the current/new selling price.
26. Historical acquisition costs remain preserved.
27. Staff must record actual selling prices.
28. Haggling is supported.
29. Discount authority should be configurable.
30. Some discounts may be allowed and reviewed later rather than blocked.
31. System approval and management review are distinct concepts.
32. Credit sales require Owner/Manager authorization, while verbal authorization may be accepted and reviewed later.
33. Credit customers have lightweight records with Name, Phone, Address, and permitted Photograph.
34. Credit supports partial repayments.
35. Each repayment is a separate payment record with a receipt.
36. Fully paid debt can produce proof of clearance/payment.
37. Negative stock does not block staff sales and alerts management instead.
38. Inventory supports configurable units/conversions defined by the business.
39. Inventory purchase history preserves different acquisition costs.
40. Every return requires Owner/Manager approval.
41. No-receipt returns can be investigated but still require approval.
42. Returns do not delete original sales.
43. Returned item condition/treatment is asked/recorded.
44. Transactions may be edited for a short period.
45. Edits are flagged for management review and remain auditable.
46. V1 minimum receipt is digital/shareable and offline-capable.
47. Staff incentives may reward value retained above a configured minimum.
48. Incentives must not encourage refusal of reasonable customers.
49. Offline-first operation is required.
50. Remote information must indicate stale/unsynchronized state where relevant.
51. Revenue, profit, cash, inventory, receivables and payables must remain conceptually distinct.
52. Owner withdrawals are distinct from business expenses.
53. Owner funding and inventory purchases are recorded separately.
54. Nigerian Pidgin/English support is a deliberate product requirement.

---

# 27. Delegated / Deliberately Open Decisions

These are **not to be guessed or silently coded**.

### Pricing / Discounts
- Exact staff discount authority and exceptional/offline discount permissions remain owned by D04/B09.
- Exact price-floor mechanics remain owned by D04.
- Basket-level allocation is owned by D04; profitability consumes the resulting net recognized selling value.

### Inventory
- V1 cost basis is resolved as weighted-average; historical COGS remains stable.
- Exact base-unit/fraction/rounding rules remain implementation/domain details.
- Detailed stock adjustment/stocktake behavior remains owned by Inventory Accounting.

### Credit
- Exact credit approval states.
- Debt aging rules.
- Reminder behavior.
- Dispute/write-off rules.

### Returns
- Partial returns are supported.
- Successful settlement states are recorded; Sabi Shop does not execute/control external money movement.
- Exchange and damaged/unresalable treatment remain domain/implementation details where not otherwise specified.
- Return time limits remain business-configurable where required.

### Sales
- Ordinary sale-correction window is configurable with a 15-minute V1 default.
- Correction fields and severity follow B08/D03; high-integrity changes require stronger controls.
- Handover attribution remains a domain detail where multiple people participate.

### Cash
- Expected Cash is derived; Actual Cash is the physical reconciliation count; unresolved discrepancies remain visible.
- Shared-drawer and individual-salesperson custody are supported as configuration modes.
- Detailed remittance and investigation workflow remains implementation detail.

### Incentives
- Value gate: management-configured percentage of eligible amount above the acceptable floor.
- Volume gate: management-configured minimum qualifying completed-sales threshold before payout.
- Returns, cancellations, reversals and material corrections recalculate eligibility before release.
- Exact release schedule/cutoff and already-paid recovery mechanics remain implementation/policy details.

### Payments
- Staff may confirm a transfer after verification; confirmation is logged/reviewable.
- POS-specific provider behavior remains implementation detail.
- Failed/unconfirmed/reversed payments cannot be treated as successful settlement.

### Offline/Sync
- Conflict-resolution rules.
- Device identity.
- Sync ordering.
- Duplicate-event prevention.
- Offline approval/review mechanics.

These belong primarily in later domain specifications rather than being forced into D00.

---

# 28. Proposed / Future Features

The following are recognized but not locked V1 requirements:

- Manager Exception/Review Centre.
- Branch support.
- More advanced CRM.
- Advanced accounting.
- Dedicated SMS receipt infrastructure.
- Dedicated printing integrations.
- Stronger cryptographic/hash-chain audit implementation.
- More sophisticated analytics.
- Broader external integrations.

---

# 29. Decision-Making Rules Going Forward

To prevent the product from becoming "vibe-built":

1. No developer should have to invent a business rule that can reasonably be decided by product/business requirements.
2. If a decision is unresolved, it must be marked unresolved.
3. Later technical specifications must not contradict confirmed business rules.
4. Detailed technical decisions may be made later where D00 intentionally delegates them.
5. Every important decision should have one authoritative home.
6. New decisions should be added to the decision register rather than left only in chat.
7. Requirements should be tested against real-world shop scenarios before being locked.
8. The product should favor traceability over silent rewriting.
9. Operational convenience should not create misleading financial information.
10. The system should accommodate real-world Nigerian retail behavior without sacrificing record integrity.

---

# 30. Validation Standard Before D00 Is Locked

D00 should be considered ready for locking when:

- confirmed decisions are accurately represented;
- no known contradiction exists between major business rules;
- unresolved decisions are explicitly identified;
- assumptions are not disguised as requirements;
- V1 boundaries are clear enough for later specifications;
- the real-world shop workflow is represented;
- later deliverables have clear ownership of detailed rules.

Once approved, D00 becomes the foundational reference for subsequent deliverables.

---

# 31. Relationship to Later Deliverables

D00 intentionally does not replace detailed specifications.

Expected later deliverables include, subject to refinement:

1. **B01 — Business Model**
2. **Domain Dictionary / Glossary**
3. **Sales & Transaction Rules**
4. **Pricing & Discount Rules**
5. **Salesperson Performance & Incentive Rules**
6. **Inventory Rules**
7. **Supplier & Purchasing Rules**
8. **Credit & Debt Rules**
9. **Returns & Refund Rules**
10. **Cash & Reconciliation Rules**
11. **Financial & Business Performance Model**
12. **Roles & Permissions Matrix**
13. **Offline & Synchronization Rules**
14. **Audit & Data Integrity Rules**
15. **Product Catalog & Search Specification**
16. **UX / User Flow Specification**
17. **Language & Content Specification**
18. **Security / Identity / Session Rules**
19. **Backup / Recovery / Disaster Recovery**
20. **Data Model / Schema**
21. **API / Integration / Technical Architecture**
22. **Non-Functional Requirements**
23. **Acceptance Criteria / Test Scenarios**
24. **MVP/V1 Scope & V2 Backlog**
25. **Deployment / Operations / Support**
26. **Analytics / Product Success Metrics**
27. **Training / Onboarding**
28. **QA / Test Plan**
29. **Final Developer Handoff / Build Specification**

This roadmap is **provisional** and will be refined as the project progresses.

---

# 32. Current Status

**D00 is reconciled and finalized for V1 business requirements.**

The next review should focus only on:

1. correcting anything in this consolidation that does not accurately represent the agreed business;
2. identifying contradictions;
3. identifying any genuinely missing foundation-level decisions;
4. deciding which remaining questions belong in D00 versus later deliverables.

After that review, D00 can be locked and treated as the first official project deliverable.

---

# FINAL RECONCILIATION — CANONICAL DECISIONS

**Status:** Finalized for V1 business requirements. This section supersedes earlier “open”, “deferred”, or “working draft” statements on the subjects below.

1. **Salesperson incentive gate:** When incentives are enabled, incentive value is based on a management-configured percentage of the eligible monetary amount above the applicable acceptable floor. Payment also requires a management-configured minimum number of completed qualifying sales in the applicable measurement/release period, preventing gaming through a few unusually high-margin transactions.
2. **Sale correction window:** Management-configurable; **15 minutes is the V1 default** from completed-sale time.
3. **Correction severity:** Ordinary/minor corrections use controlled ordinary flow. Material/high-integrity corrections receive elevated authorization, audit, and review. High-integrity examples include customer identity, product/SKU identity, payment amount/method after completion, credit/debt state, salesperson attribution, and closed-day state.
4. **Manager self-correction:** Permission depends on correction type/severity. Consequential Manager actions are consistently flagged to Owner. Where separate approval is required, the acting Manager cannot satisfy that approval by self-approval.
5. **Transfer confirmation:** Staff may confirm a transfer after checking external evidence. Confirmation is attributable, logged, reviewable, and never fabricated by the system.
6. **Payment methods:** V1 supports Cash, Bank Transfer, POS/Card, Customer Credit, plus configurable additional methods. Each configured method is classified as cash or non-cash.
7. **Refund/settlement:** Sabi Shop records successful settlement/refund events but does not execute or control external money movement. Failed/unconfirmed money movement cannot be represented as successful.
8. **Supplier returns:** If unpaid, an approved return reduces outstanding payable. If already paid, it creates a traceable supplier credit/receivable. Replacement goods are separate linked receipt events. Actual refund/credit settlement is separate.
9. **Tax/VAT:** Tax handling is first-class V1 financial data and is represented explicitly according to the business's configured tax policy.
10. **Business day across midnight:** A business day is an explicit operational session. A shop can remain in the same session across midnight until official closure; calendar date/time remain separately recorded.
11. **Cash custody:** V1 supports shared-drawer and individual-salesperson custody as a configurable business setting.
12. **Historical specifications:** `99-historical-product-spec.md` and `98-historical-design-spec.md` are superseded historical references.
13. **Gross profit:** Keep Gross Selling Value, Discount, Net Recognized Selling Value, COGS, and Gross Profit distinct. **Gross Profit = Net Recognized Selling Value − COGS.** Discount must not be subtracted twice.

## Canonical terminology

- **Cash in Hand:** operational/dashboard concept for physical cash attributable to the business.
- **Expected Cash:** system-derived physical-cash amount used for reconciliation.
- **Actual Cash:** physical cash count entered during reconciliation; not a routine editable Staff dashboard truth.
- **Negative stock:** operationally permitted so legitimate sales are not automatically blocked, but always visible as an exception requiring management investigation.
- **Weighted-average costing:** V1 inventory cost-basis method with historical COGS stability.
