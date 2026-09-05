# B01 — Business Model

**Product:** Sabi Shop  
**Document:** B01 — Business Model  
**Status:** FINAL — RECONCILED V1
**Depends on:** D00 — Product Requirements Foundation & Decision Register

## 1. Purpose

B01 defines the business Sabi Shop is designed to serve, the value it creates, the outcomes it should produce, and the commercial/business assumptions that guide product decisions.

It does not replace detailed product rules in D00 or later domain specifications.

## 2. Primary Customer

Sabi Shop is primarily for **small retail businesses with an owner/manager and salesperson-style operating structure**.

The initial reference business is an agricultural equipment/engine-parts shop, but the product should work across small retail categories with similar operating patterns.

Typical characteristics include:
- an owner responsible for the business;
- one or more people selling on the owner's behalf;
- daily physical product sales;
- inventory requiring replenishment;
- cash and other payment methods;
- periods when the owner is away from the shop;
- a need for the owner to understand what happened during the day.

The number of salespeople may vary. Family members or other staff may operate the shop on different days.

A Manager is a supported V1 role. Detailed authority is governed by B09 Roles & Permissions and the underlying domain rules.

## 3. Core Value Proposition

The primary value of Sabi Shop is:

> **Help a small-business owner understand everything happening in the business so they can identify what needs attention and make better decisions about how and where to improve.**

Sabi Shop is therefore more than a transaction recorder.

It should help the owner understand:
- what happened;
- what sold;
- what customers need;
- what needs restocking;
- where money went;
- how staff performed;
- whether the business is progressing;
- what needs attention;
- where decisions should be made.

The product should turn daily business activity into useful, understandable business information.

## 4. Core Customer Problems

### 4.1 Business visibility
The owner may know the products and customers personally but still lack an organized view of total business activity. Sabi Shop should provide a reliable record that reduces manual reconstruction.

### 4.2 Stock and customer demand
Owners often already know which products customers need and what should be restocked. Sabi Shop should strengthen that knowledge with recorded history and timely information rather than replace owner judgment.

### 4.3 Business growth visibility
The owner should be able to see whether the business is growing and how performance changes over time. Growth must be assessed using meaningful business information, not a single sales figure.

### 4.4 Staff accountability
When staff operate on behalf of the owner, the owner needs confidence that sales, actual selling prices, money and exceptions are being recorded. Accountability should improve without making the staff workflow unnecessarily difficult.

### 4.5 Manual record burden
Manual records and calculations can make end-of-day and longer-term analysis difficult. Sabi Shop should reduce this burden while preserving trustworthy underlying records.

## 5. Value by User

### Owner
Sabi Shop should help the owner:
- understand daily business activity;
- monitor sales;
- understand expenses and cash;
- understand inventory;
- identify customer demand;
- make better purchasing/restocking decisions;
- monitor staff activity;
- identify exceptions;
- understand business performance;
- track growth;
- manage the business when not physically present.

### Staff / Salesperson
Sabi Shop should help staff:
- record sales quickly;
- find the correct product;
- know current selling prices;
- see availability;
- record actual negotiated prices;
- handle supported payment types;
- record relevant operational events;
- reconcile cash at day end.

The staff experience should remain simple and practical.

### Manager
Manager value overlaps with Owner value in relevant operational areas, but authority is explicitly constrained by B09 and domain-specific approval rules. Consequential Manager self-corrections are consistently visible to the Owner.

## 6. Remote Monitoring

Remote visibility is both:
1. an important feature; and
2. part of Sabi Shop's value proposition.

The owner should be able to understand business activity without always being physically present.

Remote information must clearly indicate when data is stale, pending synchronization, or otherwise incomplete. Remote visibility must not create false confidence.

## 7. Success Criteria

Sabi Shop should produce meaningful improvements such as:
- fewer missing or unrecorded sales;
- better stock control;
- faster/easier reconciliation;
- better purchasing decisions;
- increased or better-understood profit;
- less dependence on notebooks and manual calculations;
- stronger staff accountability;
- ability for the owner to manage without being physically present;
- clearer understanding of business performance;
- measurable business growth.

These outcomes should later inform the Product Success Metrics / Analytics deliverable.

## 8. Differentiation

Sabi Shop should not compete merely as another sales-recording application.

Its differentiation should come from combining:
- operational simplicity;
- business visibility;
- practical inventory intelligence;
- money/cash understanding;
- staff accountability;
- offline-first operation;
- remote owner visibility;
- support for Nigerian retail realities;
- understandable language;
- useful business-performance information.

The product should remain lightweight even as capability increases.

## 9. Product Philosophy

### 9.1 Simple outside, rigorous inside
Staff-facing operations should be fast and simple while the underlying system maintains rigorous records.

### 9.2 Assist the owner, don't replace the owner
Sabi Shop should strengthen practical owner knowledge rather than pretend an algorithm knows the business better than its owner.

### 9.3 Information should lead to action
Reports and insights should help answer:
- What happened?
- What is changing?
- What needs attention?
- What should I restock?
- Where is money going?
- How is staff performing?
- Is the business improving?
- What can I safely do with business money?

Detailed financial calculations belong in later specifications.

## 10. Business Model Scope

Sabi Shop is currently defined as:

> **A business operating system for small retail shops, centered on POS, inventory, money visibility, staff accountability and business performance.**

It should not become:
- unnecessarily complicated;
- dominated by accounting jargon;
- prohibitively expensive for target businesses;
- dependent on continuous internet;
- overloaded with unnecessary features;
- designed primarily around large corporations;
- difficult for ordinary Nigerian shop workers.

## 11. Commercial Model

### 11.1 Monetization
**UNDECIDED**

No final charging model has been selected. Possible models include subscription, free/paid tiers, one-time payment, feature-based pricing, or another model. These are possibilities, not commitments.

### 11.2 Revenue Sources
**UNDECIDED**

Future revenue could come from software, premium capabilities, additional businesses/users, services, integrations, hardware, payments, or other sources. Nothing is confirmed.

### 11.3 Pricing Philosophy
Although the pricing model is undecided, the product must remain economically appropriate for target small businesses. "Too expensive" is explicitly a product/business failure mode.

## 12. Long-Term Ambition

**UNDECIDED**

The long-term destination has intentionally not been fixed. Possibilities include a best-in-class small-shop POS, a complete small-business operating system, a broader African small-business platform, or something larger.

This does not block V1. Current foundations should remain coherent and extensible without prematurely committing to a specific long-term destination.

## 13. Business Model Assumptions

1. Small retail owners have significant practical business knowledge that should be strengthened, not replaced.
2. Small businesses may rely on family members and/or salespeople to operate the shop.
3. The owner may not be physically present all day.
4. Businesses need visibility into more than sales totals.
5. Inventory and customer demand are closely related.
6. Business growth requires understanding trends and performance over time.
7. Staff accountability matters, but excessive operational friction is harmful.
8. Internet availability cannot be assumed.
9. Nigerian retail workflows include haggling, mixed payment behavior, informal authorization and other real-world practices that software must accommodate responsibly.
10. Owners need business information in language they can understand and act upon.
11. A lightweight product can still maintain rigorous underlying records.

These assumptions should eventually be validated against additional businesses beyond the initial reference shop.

## 14. Business Model Guardrails

### Guardrail 1 — Don't optimize for feature count
More features do not automatically mean more value.

### Guardrail 2 — Don't sacrifice operational speed for theoretical perfection
Routine sales must remain practical.

### Guardrail 3 — Don't sacrifice record integrity for convenience
The system must preserve trustworthy history.

### Guardrail 4 — Don't confuse business performance with cash
Sales, profit, cash, inventory, receivables and payables must remain distinct.

### Guardrail 5 — Don't assume internet availability
Core operations must work offline.

### Guardrail 6 — Don't design for corporations first
The target is the small-business owner and their staff.

### Guardrail 7 — Don't force accounting expertise onto users
The system may perform sophisticated calculations internally, but explanations should remain understandable.

### Guardrail 8 — Don't turn staff into data-entry machines
The operational experience must be fast enough for real selling.

### Guardrail 9 — Don't replace owner judgment
Insights should support decisions, not pretend to eliminate business judgment.

### Guardrail 10 — Don't create incentives that damage sales
Staff incentives must not encourage refusing reasonable customers simply to maximize price.

## 15. Open Business-Model Decisions

| Decision | Status |
|---|---|
| Exact monetization model | **UNDECIDED** |
| Revenue sources beyond core product | **UNDECIDED** |
| Final pricing structure | **UNDECIDED** |
| Long-term product/company ambition | **UNDECIDED** |
| Initial market-entry strategy | **LATER DELIVERABLE / UNDECIDED** |
| Customer acquisition strategy | **LATER DELIVERABLE / UNDECIDED** |
| Geographic expansion strategy | **LATER DELIVERABLE / UNDECIDED** |

These do not block current product requirements work.

## 16. Relationship to D00

D00 establishes the product foundation and confirmed operational decisions. B01 translates that foundation into the business model.

B01 must not contradict D00.

Examples:
- D00 requires offline-first operation; B01 identifies internet independence as a business guardrail for the target market.
- D00 requires business-performance visibility; B01 identifies business understanding and decision support as core value.
- D00 requires simple staff operations; B01 establishes simplicity as a business guardrail.

## 17. Relationship to Later Deliverables

B01 informs, but does not replace:
- Product Success Metrics / Analytics;
- UX/User Flow Specification;
- Language & Content Specification;
- Pricing & Discount Rules;
- Salesperson Performance & Incentive Rules;
- Financial & Business Performance Model;
- MVP/V1 Scope & V2 Backlog;
- any later Commercial/Go-to-Market specification.

## 18. Current Status

**B01 is finalized for V1 business-model purposes. Later technical and visual implementation choices remain owned by their respective specifications.

Before locking, confirm:
1. The customer definition accurately reflects the intended target.
2. The value proposition accurately captures why Sabi Shop should exist.
3. The success criteria represent meaningful business outcomes.
4. The guardrails accurately represent what Sabi Shop must not become.
5. Undecided commercial and long-term questions have not been turned into assumptions.
6. B01 remains consistent with D00.

Once approved, B01 can be locked and exported as the second official project deliverable.
