# D04 — Pricing & Discount Rules

**Status:** FINAL — RECONCILED V1
**Product:** Sabi Shop  
**Purpose:** Define how Sabi Shop handles selling prices, minimum allowed prices, negotiated prices, and multi-item price reductions without creating unnecessary complexity for staff.

---

## 1. Purpose

This document defines the business rules for pricing products during sales.

The goal is to make pricing flexible enough for the realities of small Nigerian retail businesses—especially negotiation and haggling—while protecting the business from uncontrolled pricing and preserving accurate historical records.

This document focuses on **what the business rules are**. Exact financial formulas, permissions, database structures, and interface details belong to later deliverables.

---

## 2. Core Pricing Principle

Sabi Shop must distinguish between:

- the product's **current/default selling price**;
- the product's **configured price floor**; and
- the **actual selling price** used in a particular sale.

The actual selling price is the authoritative price for that transaction.

A later change to the product's current price or price floor must never rewrite the actual price recorded on an old sale.

---

## 3. Current / Default Selling Price

Each product may have one current/default selling price at a time.

This price serves as the business's normal reference price and may change over time.

When the current/default selling price changes:

- future sales use the new current price as the normal reference;
- existing sales retain the price that was actually charged;
- historical receipts and transaction records remain unchanged.

The current/default selling price is therefore **not** the historical selling price of previous transactions.

---

## 4. Actual Selling Price

For every sold product line, Sabi Shop must record the actual selling price used for that sale.

This is the price the customer actually agreed to pay for that product.

Example:

- Current price: ₦5,000
- Floor: ₦4,500
- Customer agrees to ₦4,700
- Actual selling price recorded: **₦4,700**

If staff charges ₦5,500, the actual selling price is **₦5,500**. The system must preserve the actual amount exactly.

---

## 5. Price Floor

Each product may have a business-configured **minimum allowed selling price**, called the price floor.

The price floor is:

- configured by an Owner or Manager;
- an internal business rule;
- visible to authorized staff as pricing guidance;
- not shown to customers;
- not printed on customer receipts.

Sabi Shop must not automatically calculate the floor from acquisition cost. The business decides the floor.

The floor is therefore a pricing-control value, not automatically a cost or profit calculation.

### 5.1 No Price Floor Configured

If a product does not yet have an explicitly configured price floor, the product's **current/default selling price temporarily acts as its effective floor for normal staff sales**.

This means:

- staff may sell at or above the current/default price normally;
- a staff member attempting to sell below the current/default price is treated as attempting to sell below the effective floor;
- the business's configured below-floor behavior applies;
- the event should be surfaced to Owner/Manager management review/notification so management knows that the product has no explicit floor and can configure one for future sales.

This prevents an unconfigured floor from becoming an accidental loophole while still allowing the business to operate normally.

The notification/review is intended not only to review the particular sale but also to help management correct the missing product configuration.


---

## 6. Owner / Manager Configuration

Owner/Manager users must be able to configure:

- current/default selling price;
- price floor.

These changes must work while the device is offline and synchronize later.

Price/floor changes must be auditable so the business can determine who changed them and when.

The detailed permission matrix belongs to the later Roles & Permissions deliverable.

---

## 7. Staff Pricing Authority

Staff may choose the actual selling price without authorization when the chosen price is at or above the configured floor.

Therefore:

- above the current/default price → allowed;
- exactly at the current/default price → allowed;
- below the current/default price but at or above the floor → allowed;
- exactly at the floor → allowed;
- below the floor → subject to the business's configured exception behavior.

This supports normal negotiation without forcing staff to seek approval for every small adjustment.

---

## 8. Selling Above the Normal Price

A staff member may sell a product above its current/default selling price.

The system should not treat a higher actual selling price as an error.

This may happen when market conditions or customer circumstances permit a higher price.

The actual selling price must be recorded exactly.

This also supports later salesperson incentive calculations where appropriate.

---

## 9. Selling Below the Floor

A sale below the effective floor is a **price exception**.

The effective floor is:

- the explicitly configured product floor, when one exists; or
- the current/default selling price, when no explicit floor has been configured.

The business may configure how below-floor exceptions behave.

### Mode A — Block Until Authorized

The system prevents completion of the sale below the floor until the required Owner/Manager authorization is obtained.

### Mode B — Allow and Flag for Management Review

The system allows the sale to proceed below the floor but records it as an exception requiring management review.

When the product has no explicit floor, the exception should additionally notify/surface the missing configuration to Owner/Manager so management can set an explicit floor for future sales.

The exact authorization workflow and permission rules belong to later deliverables.

---

## 10. Price Floor Is Not Automatically Profitability

The price floor should not be assumed to equal:

- acquisition cost;
- cost plus a fixed markup;
- minimum profit; or
- break-even price.

The business may configure the floor based on its own commercial judgment.

The later Financial & Business Performance Model will define actual profitability and cost-basis rules.

---

## 11. Multi-Item Negotiation

Sabi Shop must eventually support both:

1. **item-level price reductions**, where individual products are negotiated separately; and
2. **whole-sale / basket-level negotiation**, where a customer agrees on a reduced total for several products together.

The system should ultimately record the actual selling price attributable to each sold product line.

Staff should not be required to classify the reduction as “discount” versus “haggling.”

The important fact is **what price was actually charged**.

---

## 12. Profitability-Aware Multi-Item Recommendation

When a customer negotiates a reduction across multiple products, Sabi Shop should eventually be able to recommend how the reduction can be distributed across the items in a way that protects overall profitability as much as reasonably possible.

The recommendation should consider the profit contribution of individual goods.

For example, if two products are sold together and one contributes substantially more profit than the other, Sabi Shop should not blindly reduce both by the same amount if another allocation would preserve more overall profit.

The exact mathematical allocation method is **not defined in D04**.

It belongs in the later Financial & Business Performance Model, where cost basis, profit contribution, margin, and optimization rules will be formally defined.

---

## 13. What Staff Sees

Staff should be able to see:

- current/default selling price;
- configured price floor;
- product availability;
- the actual price they are entering for the sale.

Staff should not see acquisition cost or business margin by default.

Additional financial visibility belongs to the later Roles & Permissions deliverable.

---

## 14. What the Customer Sees

The customer does not need to see the business's internal price floor.

The floor must not be exposed through:

- customer-facing screens;
- receipts;
- shared transaction records intended for the customer;
- normal customer communications generated by Sabi Shop.

The customer sees the price actually agreed for the transaction.

---

## 15. No Discount-vs-Haggling Distinction

Sabi Shop should not make staff classify a price reduction as either:

- a discount; or
- haggling / negotiated pricing.

Both are simply different ways of arriving at the **actual selling price**.

Operationally:

> Customer and salesperson agree on a price → salesperson records the actual price → Sabi Shop applies the configured pricing rules.

---

## 16. Price Changes and Historical Integrity

Changing a product's current/default price must not alter historical sales.

Changing a product's price floor must not alter historical sales.

For every completed sale, Sabi Shop must preserve at least:

- product sold;
- quantity;
- actual selling price;
- transaction date/time;
- salesperson attribution;
- applicable transaction/payment information.

A historical receipt must continue to show the price that was actually charged at the time.

---

## 17. Price Change History

Price and floor changes are business-significant events.

Sabi Shop should retain a history sufficient to establish:

- previous value;
- new value;
- who made the change;
- when the change occurred;
- whether the change was made offline and later synchronized.

Detailed audit implementation belongs to Audit & Data Integrity.

Exact effective-time and synchronization conflict rules belong to Offline & Synchronization Rules.

---

## 18. Interaction with Salesperson Incentives

Pricing rules must work with the later Salesperson Performance & Incentive Rules.

Because staff may sell above the current/default price, the system can later determine whether the additional amount above an approved baseline/floor contributes to an incentive.

D04 does **not** define:

- incentive percentages;
- bonus formulas;
- maximum bonuses;
- target prices;
- anti-gaming rules.

Those belong to the dedicated incentive deliverable.

The pricing system must preserve actual selling price accurately so those later calculations are possible.

---

## 19. Management Review / Exception Centre

Pricing exceptions should integrate with the planned management review/exception mechanism.

Examples include:

- sales below the configured floor in review mode;
- unusual pricing events;
- other pricing-related exceptions defined later.

A management review is different from authorization:

- **Authorization** can be required before an action is allowed.
- **Management review** allows an action to proceed but records it for later attention.

This distinction must remain consistent throughout Sabi Shop.

---

## 20. Offline Pricing Behaviour

Core pricing operations must work offline.

While offline:

- staff can view locally available current price and floor;
- staff can record actual selling prices;
- Owner/Manager users can change current prices and floors;
- applicable pricing rules continue to operate locally;
- completed transactions are stored for later synchronization.

The later Offline & Synchronization Rules deliverable will define conflict handling when multiple devices make changes while disconnected.

---

## 21. Edge Cases

### 21.1 Sale exactly at the floor
Allowed. No exception is created merely because the price equals the floor.

If no explicit floor exists, the current/default selling price is treated as the effective floor.


### 21.2 Sale above the current/default price
Allowed. Record the actual price.

### 21.3 Sale below the current/default price but above the floor
Allowed. Record the actual price.

### 21.4 Sale below the floor
Handled according to the business-configured exception mode: block until authorized, or allow and flag for management review.

If no explicit floor exists, the current/default selling price is used as the effective floor and management is notified/surfaced to address the missing configuration.

### 21.5 Multiple quantities of the same product
The actual selling price must be clear for the relevant sale line. If different units of the same SKU are sold at different prices within one transaction, the data model must be capable of representing those differences. Exact UI treatment is a later UX/data-model decision.

### 21.6 Multiple products with different profitability
A basket-level negotiated reduction should not automatically be distributed equally. A future profitability-aware recommendation should consider each item's profit contribution.

### 21.7 Price changes after a sale
The historical sale remains unchanged.

### 21.8 Floor changes after a sale
The historical sale remains unchanged.

### 21.9 Offline price changes
The local change applies according to offline rules and is synchronized later. Conflict resolution is deferred to Offline & Synchronization Rules.

### 21.10 Invalid selling-price values
Sabi Shop should prevent invalid selling-price values such as negative prices.

### 21.11 Zero-price / Free Sale
A sale with an actual selling price of ₦0 is supported, but it requires Owner/Manager approval.

The system should record:

- the fact that the sale was free;
- who approved it;
- when it was approved;
- the reason for the free sale.

A staff member must not independently complete a ₦0 sale.

Exact approval workflow belongs to Roles & Permissions and UX/User Flow.

### 21.12 Floor Higher Than Current Price
The system must prevent an Owner/Manager from configuring a price floor above the product's current/default selling price.

For example:

- Current price = ₦5,000
- Proposed floor = ₦5,500

The configuration must be rejected rather than silently changing either value.


---

## 22. Delegated Implementation Details

The following are owned by the indicated specifications rather than unresolved business contradictions:

1. Financial profitability formula — Financial & Business Performance Model.
2. Inventory cost basis — B06; V1 is weighted-average.
3. Basket-level allocation formula — D04; exact implementation may be refined without changing the financial formula.
4. Staff incentive policy — Salesperson Performance & Incentive Rules.
5. Authorization — B09 Roles & Permissions.
6. Management review — B09 and applicable UX workflows.
7. Offline synchronization conflicts — Offline & Synchronization specification.
8. Price-history database representation — Data Model specification.
9. Basket-total UI — POS UX.
10. Zero-price/free promotional handling — domain/authorization rules.
11. Notification presentation — Notifications/UX specifications.

These should be resolved in the appropriate later deliverables rather than guessed here.

---

## 23. Dependencies

D04 depends on or interacts with:

- D02 — Domain Dictionary / Business Glossary
- D03 — Sales & Transaction Rules
- Salesperson Performance & Incentive Rules
- Inventory Rules
- Financial & Business Performance Model
- Roles & Permissions Matrix
- Offline & Synchronization Rules
- Audit & Data Integrity Rules
- Product Catalog & Search Specification
- UX / User Flow Specification
- Data Model / Schema

---

## 24. Review Checklist

Before D04 is locked, confirm:

- [ ] Every product can have a current/default selling price.
- [ ] The actual selling price is the authoritative transaction price.
- [ ] Historical prices cannot be silently rewritten.
- [ ] Owner/Manager can configure price floors.
- [ ] Staff can freely sell at or above the floor.
- [ ] Staff can sell above the normal price.
- [ ] A missing explicit floor uses the current/default price as the temporary effective floor.
- [ ] Missing-floor below-price activity is surfaced to management for correction.
- [ ] Below-floor behavior is configurable.
- [ ] Floor is visible to staff but not customers.
- [ ] Floor is not exposed on receipts.
- [ ] Offline price/floor changes are supported.
- [ ] Multi-item negotiation is supported conceptually.
- [ ] Profitability-aware reduction recommendations are planned without prematurely fixing the formula.
- [ ] Staff do not need to classify a reduction as “discount” versus “haggling.”
- [ ] Pricing exceptions can feed management review.
- [ ] Pricing data can support future incentive calculations.
- [ ] ₦0/free sales require Owner/Manager approval and preserve approval/reason information.
- [ ] A floor above the current/default price cannot be configured.
- [ ] Deferred decisions are clearly assigned to later deliverables.

---

## 25. Current Status

**IN PROGRESS — Working Draft**

This document is ready for review and challenge.

It should only be marked **LOCKED** after review confirms the decisions now captured for missing floors, floor/current-price conflicts, and zero-price/free-sale handling, and after any remaining genuine ambiguities are consciously deferred to the appropriate later specification.

---

# FINAL RECONCILIATION — PRICING OWNERSHIP

D04 is authoritative for the business rules of multi-item/basket discount allocation. The Financial Model supplies economic inputs such as cost basis, COGS, net recognized selling value, and margin. Allocation must be deterministic, auditable, preserve the exact total discount, respect price-floor constraints, and use explicit rounding/residual handling.
