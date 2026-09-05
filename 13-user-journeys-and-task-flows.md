# C02 — User Journeys & Task Flows

**Product:** Sabi Shop  
**Document ID:** C02  
**Package:** C — User Experience Specification  
**Status:** FINAL — RECONCILED V1
**Version:** 1.0  
**Prepared:** 2026-09-04  
**Depends on:** C00 — UX & Design Foundation; C01 — Information Architecture  
**Authoritative for:** UX journey structure, task sequencing, workflow intent, role-specific journey behavior, and major success/failure paths  
**Does not replace:** B01–B09 business rules, D03–D11 technical specifications, or later domain-specific UX documents

---

## 1. Purpose

C02 translates Sabi Shop's information architecture and established business rules into real user journeys and task flows.

The objective is not to produce generic UX diagrams.

The objective is to define how a real person moves through Sabi Shop to complete work while preserving:

- business truth;
- authorization;
- payment confirmation;
- inventory integrity;
- debt integrity;
- cash accountability;
- correction history;
- offline continuity;
- auditability.

The governing UX principle from C00 remains:

> **Fast for ordinary work. Deliberate for consequential work.**

---

# 2. Source Hierarchy

Journey decisions follow:

1. Locked Sabi Shop business rules.
2. C01 information architecture.
3. C00 UX foundation.
4. Later domain UX specifications.
5. Design system and implementation decisions.

C02 must not invent business behavior that conflicts with B01–B09.

Where a business rule is not yet fully specified, the journey should expose the decision point rather than silently invent a rule.

---

# 3. Journey Model

Sabi Shop journeys use five conceptual layers:

```text
1. Discover
   Find the record/product/action.

2. Prepare
   Enter or confirm the information required.

3. Authorize
   Obtain required authority when applicable.

4. Commit
   Record the successful business event.

5. Verify
   Show the resulting accepted state and relevant downstream effects.
```

Not every journey needs a visible authorization step.

The UX should keep authorization invisible for ordinary permitted actions and explicit only when authority is actually required.

---

# 4. Core Roles

## Staff / Salesperson

Primary goal:

> Complete normal shop work quickly and correctly.

Typical journeys:

- sell;
- record confirmed payment;
- identify customer;
- request/handle credit authorization;
- record permitted repayment;
- search products;
- view relevant own activity;
- respond to approval requirements.

Staff should not become the normal operator of management corrections, purchasing, or sensitive reconciliation.

## Manager

Primary goal:

> Run daily operations, authorize controlled actions, investigate exceptions, and reconcile the business.

Typical journeys:

- approve credit;
- receive stock;
- manage suppliers;
- resolve corrections;
- approve returns;
- reconcile cash;
- investigate inventory discrepancies;
- review staff activity;
- resolve permitted exceptions.

## Owner

Primary goal:

> Maintain business control, authority, integrity, and long-term visibility.

Owner can perform the broadest management functions, subject to the established permission model.

Owner authority never includes destroying historical evidence.

---

# 5. Journey Priority

The following journeys are the core UX workload and should receive the strongest design attention.

| Priority | Journey |
|---|---|
| P0 | Normal sale |
| P0 | Sale with confirmed payment |
| P0 | Split payment |
| P0 | Credit sale |
| P0 | Customer repayment |
| P0 | Product search / stock check |
| P0 | Purchase receiving |
| P0 | Cash reconciliation |
| P1 | Return |
| P1 | Correction |
| P1 | Duplicate / merge handling |
| P1 | Inventory discrepancy |
| P1 | Management review |
| P1 | Offline sale |
| P1 | Sync conflict |
| P1 | Payment / debt investigation |
| P2 | Incentive review |
| P2 | Historical investigation |
| P2 | Integrity escalation |

P0 journeys should be optimized before secondary reporting and configuration workflows.

---

# 6. Journey 01 — Normal Sale

**Primary role:** Staff  
**Goal:** Complete a legitimate sale quickly and accurately.

## Happy path

```text
Open Sell
   ↓
Find product
   ↓
Confirm correct product/SKU
   ↓
Add quantity
   ↓
Confirm actual selling price
   ↓
Add additional items if needed
   ↓
Identify customer if needed
   ↓
Choose payment method
   ↓
Confirm successful payment
   ↓
Complete sale
   ↓
Show receipt / accepted sale
```

## UX requirements

The user should not need to visit Products, Customers, or Money as separate navigation journeys for ordinary selling.

Contextual access is preferred.

The completion point must be unmistakable.

The system should make it difficult to confuse:

- selected product vs intended product;
- quoted price vs actual price;
- claimed payment vs confirmed payment;
- incomplete sale vs completed sale.

## Success state

Show:

- sale reference;
- completed state;
- total;
- payment summary;
- customer where applicable;
- salesperson;
- receipt access;
- relevant offline/sync state.

---

# 7. Journey 02 — Product Search During Sale

**Primary role:** Staff

```text
Sell
 ↓
Search
 ↓
Review matching products
 ↓
Distinguish product/SKU
 ↓
Select correct product
 ↓
Return to sale
```

Search should reduce wrong-SKU risk.

The result should provide sufficient distinguishing information without overwhelming the salesperson.

If stock information indicates a conflict, the user should be warned before the sale is committed.

---

# 8. Journey 03 — Sale With Multiple Quantities

```text
Find product
 ↓
Add quantity
 ↓
Review line
 ↓
Adjust actual quantity
 ↓
Confirm line price
 ↓
Continue
```

If multiple quantities of the same product have different line prices, the UI must preserve the actual line-level pricing rather than silently averaging or rewriting it.

---

# 9. Journey 04 — Sale Above or Below Current Price

## Sale at current price

```text
Product selected
 ↓
Current/default price shown
 ↓
Confirm
 ↓
Continue
```

## Sale above current price

Allowed by D04.

The workflow should not imply that every sale must equal the current displayed price.

## Sale below current price but above floor

Allowed according to pricing rules.

## Sale below floor

```text
Attempt below floor
 ↓
System identifies exception
 ↓
Configured policy:
    ├── Block → request authorization
    └── Allow + flag → complete with management attention
```

The interface must communicate that the sale is outside normal pricing control.

---

# 10. Journey 05 — Split Payment

**Primary role:** Staff  
**Management involvement:** only when required by the payment/correction rules.

```text
Sale total
 ↓
Choose split payment
 ↓
Enter first confirmed payment
 ↓
Enter next confirmed payment
 ↓
System calculates remaining amount
 ↓
Confirm all successful components
 ↓
Complete sale
```

Example:

```text
Sale total: ₦100,000

Cash:     ₦40,000
Transfer: ₦35,000
Credit:   ₦25,000
          ─────────
Total:   ₦100,000
```

Each payment component remains individually traceable.

The customer does not have a generic wallet or stored credit balance.

---

# 11. Journey 06 — Unconfirmed Transfer

**Primary role:** Staff

```text
Customer claims transfer
 ↓
Transfer not confirmed
 ↓
Do not record successful payment
 ↓
Do not release goods on that transfer
 ↓
Continue only through an approved valid payment path
```

The UI should make this distinction extremely clear.

> **Unconfirmed payment is not a successful payment.**

A failed or unconfirmed attempt must not accidentally complete the sale.

---

# 12. Journey 07 — Credit Sale

**Primary role:** Staff  
**Authorization:** Manager/Owner as required by B03/B09.

```text
Build sale
 ↓
Select customer
 ↓
Check credit status
 ↓
Check applicable limit
 ↓
If permitted:
      request/obtain authorization
 ↓
If approved:
      record credit component
 ↓
Complete sale
 ↓
Show outstanding debt
```

## Credit states

The customer may be:

- Credit Allowed;
- Credit Restricted;
- Credit Blocked.

A credit-eligible customer is not automatically authorized for every credit sale.

## Over-limit

```text
Credit exceeds limit
 ↓
Management-authorized exception required
 ↓
Approved → continue
Rejected → sale cannot complete using that credit
```

Authorization must remain traceable.

---

# 13. Journey 08 — Customer Repayment

**Primary role:** Staff or Manager, subject to permissions.

```text
Open Customers & Credit
 ↓
Find customer
 ↓
Review outstanding debts
 ↓
Record successful repayment
 ↓
Choose payment method(s)
 ↓
Allocate repayment
 ↓
Confirm
 ↓
Show resulting outstanding balance
```

A repayment is not a sale.

Where multiple debts exist:

```text
Repayment
   ↓
Debt A: ₦20,000
Debt B: ₦30,000
Debt C: ₦10,000
   ↓
Management allocation
   ↓
Traceable allocation
```

A single repayment may be allocated across multiple sales.

---

# 14. Journey 09 — Credit Debt Investigation

**Primary role:** Manager/Owner

```text
Customer debt attention
 ↓
Open Customer Detail
 ↓
Review:
   ├── Credit sales
   ├── Repayments
   ├── Outstanding amounts
   ├── Returns
   ├── Adjustments
   ├── Disputes
   └── History
 ↓
Identify discrepancy
 ↓
Investigate underlying events
 ↓
Choose authorized resolution
 ↓
Record resolution
 ↓
Preserve history
```

Possible resolution types are domain-defined.

The UI must not present "edit balance" as the normal investigation mechanism.

---

# 15. Journey 10 — Purchase Receiving

**Primary role:** Manager/Owner

```text
Suppliers & Purchasing
 ↓
Select supplier
 ↓
Record received purchase
 ↓
Enter actual quantities
 ↓
Enter actual acquisition cost
 ↓
Confirm physical receipt
 ↓
Commit purchase receipt
 ↓
Inventory increases
 ↓
Supplier liability/payment state updates
 ↓
Show purchase detail
```

Inventory does not increase because goods were merely discussed, ordered, expected, or promised.

The authoritative receiving event is the recorded physical receipt.

---

# 16. Journey 11 — Supplier Payment

**Primary role:** Manager/Owner

```text
Supplier Detail
 ↓
Review outstanding liability
 ↓
Record successful payment
 ↓
Allocate payment
 ↓
Confirm
 ↓
Show resulting supplier balance
```

Supplier payable remains distinct from:

- cash;
- inventory;
- profit;
- customer debt.

---

# 17. Journey 12 — Stock Check During Sale

**Primary role:** Staff

```text
Select product
 ↓
Review stock information
 ↓
System checks availability/integrity
 ↓
If normal → continue
If conflict → stop / flag
```

Sabi Shop should not silently create negative stock as a normal selling outcome.

If a stock conflict is detected, the salesperson should be prevented from simply selling through the problem where the applicable rule requires a stop.

The issue becomes a management reconciliation problem.

---

# 18. Journey 13 — Inventory Discrepancy

**Primary role:** Manager/Owner

```text
Stock discrepancy detected
 ↓
Open stock issue
 ↓
Review expected quantity
 ↓
Perform / review physical count
 ↓
Inspect stock movements
 ↓
Investigate cause
 ↓
Record authorized correction
 ↓
Recalculate resulting inventory state
 ↓
Preserve original discrepancy and correction history
```

The system must not use inventory adjustment as a way to hide a missing sale.

---

# 19. Journey 14 — Cash Reconciliation

**Primary role:** Manager/Owner

```text
Open reconciliation
 ↓
Review opening cash
 ↓
Review cash movements
 ↓
Review expected cash
 ↓
Count physical cash
 ↓
Enter actual cash
 ↓
System calculates variance
 ↓
If match:
      reconcile
If discrepancy:
      investigate
      ↓
      record resolution/corrective event
 ↓
Close / resolve reconciliation
```

A discrepancy is not automatically an accusation.

It is an investigation state.

Unresolved discrepancies remain visible.

---

# 20. Journey 15 — Cash Handover

**Primary role:** Staff → Manager/Owner

```text
Staff completes custody period
 ↓
Review recorded cash
 ↓
Physical handover
 ↓
Receiving authority confirms
 ↓
Record handover
 ↓
Reconciliation can compare:
   recorded cash
   vs
   handed-over cash
```

The handover must preserve who gave, who received, when, and what amount was recorded.

---

# 21. Journey 16 — Return

**Primary role:** Staff initiates / Manager or Owner approves.

```text
Open original sale
 ↓
Select return
 ↓
Select item(s) and quantity
 ↓
Record condition/treatment
 ↓
Provide reason
 ↓
Request approval
 ↓
Management approves/rejects
```

### Approved

```text
Approved return
 ↓
Record return event
 ↓
Apply applicable inventory effects
 ↓
Apply applicable financial/debt effects
 ↓
Record settlement/refund when successful
 ↓
Original sale remains
 ↓
Show linked return
```

### Rejected

```text
Rejected
 ↓
Record decision/history
 ↓
Original sale unchanged
 ↓
No return inventory/debt/settlement effect
```

---

# 22. Journey 17 — Refund / Settlement

A refund should only be presented as a successful settlement when the underlying money movement has actually succeeded.

```text
Approved return/correction
 ↓
Determine applicable settlement
 ↓
Record successful settlement/payment event
 ↓
Link to return/correction
 ↓
Preserve original payment history
```

Failed or unconfirmed money movement must not be represented as a successful refund.

---

# 23. Journey 18 — Minor Correction

**Primary role:** Authorized user.

```text
Open completed record
 ↓
Choose correction
 ↓
System checks correction window/permission
 ↓
Edit permitted minor field
 ↓
Enter mandatory reason
 ↓
Review resulting state
 ↓
Confirm
 ↓
Current accepted version updates
 ↓
Previous accepted state remains recoverable
```

Correction must never look like deletion.

---

# 24. Journey 19 — Material Correction

For changes affecting money, inventory, debt, payment, incentives, or attribution:

```text
Open record
 ↓
Identify material correction
 ↓
System requires appropriate authority
 ↓
Enter reason
 ↓
Review proposed effect
 ↓
Authorize
 ↓
Create corrective event
 ↓
Update accepted current state/effects
 ↓
Preserve original state
 ↓
Record complete history
```

The UX should explicitly distinguish this from a minor data-entry correction.

---

# 25. Journey 20 — Staff Attempts to Correct Own Sale

```text
Staff opens own completed sale
 ↓
Correction requested
 ↓
System detects self-correction restriction
 ↓
Staff cannot self-approve
 ↓
Request management authorization
 ↓
Manager/Owner reviews
 ↓
Approve / reject
 ↓
Result recorded
```

The user should understand that this is an authorization rule, not a system error.

---

# 26. Journey 21 — Wrong Customer Identity

Customer identity is a protected field.

```text
Open sale
 ↓
Attempt identity correction
 ↓
System treats as high-integrity action
 ↓
Require appropriate confirmation/authority
 ↓
Review original identity
 ↓
Record corrected state if approved
 ↓
Preserve original identity/history
```

The UI should use careful language.

It should not automatically accuse the user of criminal behavior.

---

# 27. Journey 22 — Wrong SKU / Product

Wrong product selection can have downstream pricing, stock, profitability, and customer consequences.

```text
Wrong SKU identified
 ↓
Flag high-integrity correction
 ↓
Inspect original sale
 ↓
Confirm actual product
 ↓
Management authorization where required
 ↓
Apply appropriate corrective event
 ↓
Correct inventory/financial consequences
 ↓
Preserve original sale history
```

The workflow should be deliberately slower than ordinary product selection because the consequence is materially greater.

---

# 28. Journey 23 — Duplicate Transaction

```text
Duplicate identified
 ↓
Open both records
 ↓
Compare evidence
 ↓
Management decision
 ↓
Possible outcomes:
   ├── Void duplicate
   ├── Correct/reverse effects
   └── Merge
 ↓
Preserve both original histories
 ↓
Record accepted resulting relationship/state
```

A merge never means silently deleting one source transaction.

---

# 29. Journey 24 — Closed Business Day Correction

```text
Historical record identified
 ↓
System identifies closed business day
 ↓
Management authorization required
 ↓
Review original event
 ↓
Enter reason
 ↓
Review downstream effects
 ↓
Authorize correction
 ↓
Record corrective event
 ↓
Preserve original business-day history
```

There is no correction cutoff that permits history to disappear.

---

# 30. Journey 25 — Management Review Queue

Recommended cross-domain management flow:

```text
Management
 ↓
Exceptions / Review
 ↓
Select issue
 ↓
Understand:
   What happened?
   Who recorded it?
   When?
   What is the current state?
   What effects exist?
   What authority is required?
 ↓
Choose permitted action
 ↓
Authorize / reject / resolve
 ↓
Verify resulting state
```

Potential queue items include:

- pricing exceptions;
- credit approvals;
- corrections;
- returns;
- stock discrepancies;
- cash discrepancies;
- offline conflicts;
- integrity issues.

This is an architectural recommendation. The final screen structure is subject to C04/C09/C10.

---

# 31. Journey 26 — Offline Sale

**Primary role:** Staff

```text
Open Sell
 ↓
System indicates offline state
 ↓
Continue with supported offline workflow
 ↓
Find locally available product information
 ↓
Build sale
 ↓
Record successful payment according to available confirmation rules
 ↓
Complete locally
 ↓
Receipt / local confirmation
 ↓
Mark Sync Pending
 ↓
Later synchronization
```

Offline mode must not weaken authorization or audit requirements.

---

# 32. Journey 27 — Offline Credit Sale

```text
Offline
 ↓
Customer selected
 ↓
Credit eligibility checked from available local state
 ↓
If authorized person locally available:
      obtain required approval
If workflow permits management review:
      record according to approved offline policy
 ↓
Complete locally
 ↓
Flag for sync/review where required
```

Offline is not permission bypass.

---

# 33. Journey 28 — Sync Conflict

```text
Local change
 ↓
Synchronization
 ↓
Conflict detected
 ↓
Do NOT automatically overwrite accepted history
 ↓
Create conflict state
 ↓
Present:
   ├── Local version
   ├── Remote/other version
   ├── timestamps
   ├── users
   └── relevant effects
 ↓
Authorized resolution
 ↓
Preserve conflict history
 ↓
Accepted state established
```

The conflict workflow is deliberately more cautious than normal editing.

---

# 34. Journey 29 — Integrity / Tamper Detection

```text
Integrity issue detected
 ↓
Block affected action
 ↓
Preserve evidence
 ↓
Escalate above acting account
 ↓
Owner may override/resolve where authorized
 ↓
Record resolution
```

The user should not be able to "fix" a suspected integrity problem through an ordinary edit.

---

# 35. Journey 30 — Incentive Recalculation

Incentives follow actual transaction state.

```text
Sale recorded
 ↓
Incentive calculated
 ↓
Sale later corrected/returned
 ↓
Eligible incentive recalculated
 ↓
If already released:
      management decision under incentive policy
```

The salesperson should see the resulting incentive state without being given a mechanism to manipulate it independently.

---

# 36. Journey 31 — Management Performance Investigation

```text
Home / Management
 ↓
Select performance metric
 ↓
Drill into underlying records
 ↓
Filter by:
   ├── date
   ├── product
   ├── salesperson
   ├── customer
   └── other permitted dimensions
 ↓
Open source transaction
 ↓
Inspect related events
 ↓
Take authorized action if needed
```

Important metrics should always have an explainable path to underlying evidence.

---

# 37. Journey 32 — Historical Transaction Investigation

```text
Activity / Search
 ↓
Find transaction
 ↓
Open Detail
 ↓
Review current accepted state
 ↓
Review original state
 ↓
Review corrections
 ↓
Review related payments
 ↓
Review inventory/debt/return effects
 ↓
Review authorization/history
```

The purpose is reconstruction, not merely display.

---

# 38. Journey Design Rules

## 38.1 Keep ordinary paths short

The normal sale should not feel like an accounting process.

## 38.2 Add friction only where consequence requires it

Examples:

- below-floor pricing;
- credit authorization;
- material correction;
- return approval;
- reconciliation discrepancy;
- integrity issue.

## 38.3 Never use friction as decoration

Confirmation dialogs should exist because the action is consequential, not because generic UX convention says every button needs one.

## 38.4 Show consequences before commitment

For material actions, the user should understand what will change before confirming.

## 38.5 Preserve context

A correction from Sale Detail should not dump the user into a generic settings page.

## 38.6 Return users to useful work

After a successful normal sale, the next sale should be easy to start.

After management resolution, the user should be able to return to the review queue.

---

# 39. Journey State Model

Every major journey should explicitly account for:

```text
Ready
 ↓
In Progress
 ↓
Awaiting Confirmation / Authorization
 ↓
Committed
 ↓
Verified
```

And exceptions:

```text
Blocked
Rejected
Cancelled
Failed
Offline
Sync Pending
Conflict
Integrity Block
```

Not every state is a business transaction state.

These are UX/task states and must not be confused with B07 lifecycle states.

---

# 40. Receipt / Completion Feedback

Completion feedback must distinguish:

### Successfully completed

> Sale completed.

### Locally completed while offline

> Sale recorded on this device. Sync pending.

### Awaiting authorization

> Approval required before this action can complete.

### Payment unconfirmed

> Payment not confirmed. Sale cannot be completed using this payment.

### Rejected

> Action rejected. No corresponding business effect was applied.

### Conflict

> This record needs authorized review before the change can be accepted.

The exact copy will be finalized during domain UX and design-system work.

---

# 41. Journey-to-IA Matrix

| Journey | Primary IA area | Supporting areas |
|---|---|---|
| Normal sale | Sell | Products, Customers, Money |
| Split payment | Sell | Money |
| Credit sale | Sell | Customers & Credit, Management |
| Repayment | Customers & Credit | Money |
| Product search | Products & Inventory | Sell |
| Purchase receiving | Suppliers & Purchasing | Products & Inventory, Money |
| Supplier payment | Suppliers & Purchasing | Money |
| Cash reconciliation | Money | Activity, Management |
| Return | Sale Detail / Management | Inventory, Money |
| Correction | Source Detail / Management | Activity |
| Duplicate / Merge | Source Detail / Management | Activity |
| Inventory discrepancy | Products & Inventory | Management |
| Management review | Management | All domains |
| Offline sale | Sell | System state |
| Sync conflict | Contextual source record | Management |
| Integrity issue | Management / Integrity | Source record |
| Incentive review | Management | Sales |

---

# 42. Role × Journey Matrix

| Journey | Staff | Manager | Owner |
|---|---:|---:|---:|
| Normal sale | Execute | Execute / oversee | Execute / oversee |
| Split payment | Execute | Execute | Execute |
| Credit sale | Request / execute if authorized | Authorize | Authorize |
| Repayment | Record if permitted | Manage | Manage |
| Purchase receiving | Limited / physical receipt role where permitted | Execute | Execute |
| Supplier payment | No normal authority | Execute | Execute |
| Cash reconciliation | Participate / handover | Execute | Execute |
| Return | Initiate | Approve | Approve |
| Minor correction | Limited | Authorize/execute per permission | Authorize/execute |
| Material correction | Request | Authorize | Authorize |
| Own-sale correction | Restricted | Controlled | Controlled |
| Inventory correction | Request | Authorize | Authorize |
| Closed-day correction | Request | Controlled | Controlled |
| Duplicate / merge | Report | Resolve | Resolve |
| Management review | No | Yes | Yes |
| Integrity resolution | No | Escalate / limited | Highest authority |

Exact permission mechanics remain B09 / final permission configuration.

---

# 43. Offline Journey Rules

Offline journeys must preserve the same business principles as online journeys.

Offline may change:

- where data comes from;
- when synchronization occurs;
- when management review happens;
- how conflict is surfaced.

Offline may not change:

- authorization requirements;
- payment confirmation rules;
- audit requirements;
- business membership boundaries;
- completed transaction history;
- correction philosophy.

---

# 44. Cross-Journey Invariants

Every journey must preserve:

1. Confirmed business activity is distinguishable from an attempt.
2. Unconfirmed payment is not successful payment.
3. Completed transactions are not deleted.
4. Corrections preserve previous accepted state.
5. Returns remain linked to original sales.
6. Customer debt remains explainable.
7. Supplier liability remains distinct from customer debt.
8. Inventory effects remain traceable.
9. Cash discrepancies remain visible until resolved.
10. Authorization is attributable.
11. Required correction reasons are recorded.
12. Offline operation does not bypass permission.
13. Sync conflicts do not silently overwrite accepted history.
14. Integrity failures are escalated rather than casually edited.
15. Historical relationships remain intact.

---

# 45. Reconciliation With C01

C01 established the logical areas:

```text
Home
Sell
Products & Inventory
Customers & Credit
Suppliers & Purchasing
Money
Activity
Management
Settings
```

C02 converts those areas into workflows.

The important distinction is:

> **C01 says where work lives. C02 says how work happens.**

C02 therefore does not introduce a new top-level business domain.

---

# 46. Reconciliation With C00

C00 established:

- business truth over visual convention;
- fast ordinary work;
- deliberate consequential work;
- complete interaction states;
- permission-aware UX;
- offline/conflict as first-class states;
- auditability as UX.

C02 applies these principles directly.

The external design skills do not determine the business workflow.

---

# 47. Reconciliation With B07

B07 requires that completed transactions remain historically intact and that returns, corrections, and related actions preserve the original record. fileciteturn27file0L84-L128

C02 therefore treats correction as a workflow layered over the accepted record, not as deletion.

B07 also establishes that returns remain separate linked events and that partial returns preserve the original sale. fileciteturn27file0L10-L41

C02 reflects this in the Return journey.

---

# 48. Reconciliation With B08

B08 establishes that corrections affecting money, inventory, debt, payment, incentives, or attribution require stronger control and that every correction requires a reason. fileciteturn27file8L861-L895

C02 therefore separates:

- minor correction;
- material correction;
- high-integrity correction;
- management review.

B08 also establishes that offline conflicts cannot automatically overwrite accepted history. fileciteturn27file8L861-L880

C02 therefore gives Sync Conflict its own deliberate journey.

---

# 49. Reconciliation With B03

B03 establishes that credit requires management authorization, customers may have multiple independent credit sales, repayments are separate successful payment events, and repayments can be allocated across multiple debts. fileciteturn27file5L612-L676

C02 therefore does not model customer credit as a wallet or generic balance.

The repayment journey begins from the customer's actual outstanding debts and preserves allocation traceability.

---

# 50. Reconciliation With B09

B09 establishes role-based access and controlled permissions, including restrictions on self-correction and stronger controls for material payment corrections and post-window corrections. fileciteturn27file7L797-L810

C02 therefore models authorization as a contextual journey step rather than assuming role access alone completes an action.

---

# 51. Historical Question Reconciliation

Older requirements may contain unresolved workflow questions that were later answered by B07, B08, B09, or the existing business specifications.

C02 must not reopen those questions.

Examples:

| Historical topic | Current treatment |
|---|---|
| Completed transaction deletion | Resolved: prohibited |
| Returns replacing original sale | Resolved: prohibited |
| Partial return | Resolved |
| Correction history | Resolved |
| Correction reason | Resolved |
| Offline conflict overwrite | Resolved: prohibited |
| Staff self-correction | Controlled |
| Customer credit authorization | Resolved |
| Repayment as sale | Resolved: it is not a sale |
| Negative stock | Exception requiring reconciliation |

If an older document still calls these "unresolved," that label is stale for the business-rule question already resolved.

---

# 52. Journey Documentation Standard

Future C-domain journey documents should use this structure where applicable:

```text
Journey
Actor
Goal
Trigger
Preconditions
Happy Path
Alternative Paths
Blocked Paths
Authorization
Business Effects
User Feedback
Offline Behavior
Sync Behavior
Audit / History
Postconditions
```

This creates a consistent handoff format for UX designers and coding agents.

---

# 53. C02 Decisions

### C02-DEC-01
Normal selling is the highest-priority operational journey.

### C02-DEC-02
Contextual access to Products, Customers, and Payment information should reduce navigation during a sale.

### C02-DEC-03
Authorization should appear only when the business rule requires it.

### C02-DEC-04
Material actions should expose consequences before commitment.

### C02-DEC-05
Correction journeys must visually and conceptually differ from deletion.

### C02-DEC-06
Management review is a cross-domain workflow.

### C02-DEC-07
Offline is a variation of a supported workflow, not a separate business workflow.

### C02-DEC-08
Sync conflict is a deliberate resolution workflow and must not silently overwrite accepted history.

### C02-DEC-09
Important metrics and management alerts should lead back to source records.

### C02-DEC-10
Journey design must preserve domain ownership rather than inventing generic business behavior.

---

# 54. Remaining Open Decisions

C02 does not silently settle only implementation/design details that belong elsewhere:

- exact refund-provider/external settlement mechanics;
- exact payment-provider behavior;
- exact offline conflict-resolution algorithm;
- exact receipt numbering;
- exact device/responsive interaction;
- exact UI copy;
- final visual shell details owned by C04/C03.

Resolved business rules must not be reopened here: correction window (15-minute default/configurable), Manager self-correction escalation, verified/logged transfer confirmation, incentive value + volume gates, and payment-method classification are authoritative elsewhere.

These belong to their authoritative later deliverables.

---

# 55. Acceptance Criteria

C02 is successful when:

- the major Staff journeys are defined;
- the major Manager journeys are defined;
- Owner control journeys are defined;
- normal sale is optimized;
- split payment is represented;
- credit sale is represented;
- repayment is represented;
- purchasing/receiving is represented;
- supplier payment is represented;
- cash reconciliation is represented;
- returns are represented;
- corrections are represented;
- duplicate/merge handling is represented;
- inventory discrepancy handling is represented;
- management review is represented;
- offline workflows are represented;
- sync conflict is represented;
- integrity escalation is represented;
- role differences are visible;
- authorization points are clear;
- unsuccessful payment is not treated as successful business activity;
- historical integrity is preserved throughout;
- later C06–C10 deliverables have clear workflow inputs.

---

# 56. Next Deliverables

## C03 — Sabi Shop Design System

Define the visual language needed to express these journeys consistently.

## C04 — Application Shell & Navigation

Turn C01's logical IA into the actual responsive application shell.

## C05 — Landing Page UX

Define the public-facing product experience.

## C06 — POS UX

Deeply specify the P0 selling journey.

## C07 — Inventory & Purchasing UX

Deeply specify products, stock, receiving, suppliers, and inventory investigation.

## C08 — Customer & Credit UX

Deeply specify customer identity, credit, debt, repayments, and disputes.

## C09 — Returns, Corrections & Reconciliation UX

Deeply specify the consequential management workflows.

## C10 — Offline, Conflict & Exceptional States

Deeply specify system-state UX across all domains.

---

# 57. Summary

C02 turns Sabi Shop's architecture into a practical operating model.

The most important distinction is:

> **Routine work should feel almost effortless. Consequential work should feel unmistakably deliberate.**

A salesperson should be able to sell quickly.

A manager should be able to understand and authorize exceptions.

An owner should be able to reconstruct what happened.

And throughout all three:

> **The system should correct the business without pretending the original event never happened.**

---

# FINAL RECONCILIATION — BUSINESS DECISIONS APPLIED

This document must express the finalized business decisions: configurable 15-minute-default correction window; ordinary vs high-integrity corrections; Owner visibility for consequential Manager self-corrections; logged/reviewable transfer confirmation; core plus configurable payment methods; tax-aware totals; supplier-return settlement states; operational business-day sessions that may cross midnight; shared or individual cash custody; weighted-average costing; visible negative-stock exceptions; and Cash in Hand / Expected Cash / Actual Cash terminology.
