# C09 — Returns, Corrections & Reconciliation UX

**Product:** Sabi Shop  
**Document ID:** C09  
**Package:** C — User Experience Specification  
**Status:** RECONCILED — DESIGN BASELINE — Returns, Corrections & Reconciliation UX  
**Version:** 1.0  
**Prepared:** 2026-09-04  
**Depends on:** C00–C08; B04 — Returns & Refund; B05 — Cash & Reconciliation; B07 — Transaction Lifecycle & State Rules; B08 — Correction & Exception Policy; B09 — Roles & Permissions; B03 — Credit & Debt; B06 — Inventory Accounting; D02–D11 technical specifications  
**Authoritative for:** UX structure and interaction behavior for returns, successful refund/settlement recording, corrections, invalidation/void handling, duplicate handling, merges, reconciliation, management review, and integrity escalation  
**Does not replace:** business/accounting/permission/technical rules owned by authoritative deliverables

---

# 1. Purpose

C09 defines the UX for Sabi Shop's highest-integrity exception workflows.

These workflows exist because real business activity can be recorded incorrectly, returned, disputed, duplicated, reconciled, or discovered after the fact.

The central UX rule is:

> **Correct the business state without pretending the original evidence never existed.**

---

# 2. Governing Principle

C00 establishes:

> **Fast for ordinary work. Deliberate for consequential work.**

C09 applies the second half most strongly.

A return, correction, reconciliation, void, duplicate decision, debt correction, or integrity issue must not look like an ordinary “edit” action.

---

# 3. Exception UX Model

The common pattern is:

```text
Detect
→ Understand
→ Review consequences
→ Authorize where required
→ Apply controlled action
→ Verify resulting state
→ Preserve history
```

The UI should make the transition explicit.

---

# 4. What C09 Treats as an Exception

C09 covers:

- customer returns;
- refund/settlement recording;
- transaction corrections;
- invalidation/void handling;
- duplicate transactions;
- transaction merge;
- cash discrepancies;
- inventory discrepancies;
- debt/credit corrections;
- closed business day corrections;
- rejected corrections;
- management review;
- offline conflicts;
- integrity/tamper escalation.

---

# 5. Exception Is Not Deletion

The UI must never make a consequential correction look like:

```text
Delete
```

or:

```text
Overwrite
```

The user should understand that the original event remains part of the historical record.

---

# 6. Return vs Correction

A return is a separate business event linked to the original sale.

A correction changes an incorrect business record according to B08.

These must be visually and conceptually distinct.

```text
Sale
  └── Return

Sale
  └── Correction
```

A return should not be presented as editing the original sale.

---

# 7. Return Workflow

Recommended flow:

```text
Find original sale
→ Verify customer/context
→ Select returned items
→ Record condition/treatment
→ Review return value
→ Obtain Manager/Owner approval
→ Approve return
→ Apply inventory/obligation effects
→ Record settlement if applicable
→ Complete
```

---

# 8. Partial Return

Partial returns are supported.

The original sale remains intact.

UX should show:

```text
Original sale
Returned quantity
Remaining quantity
Return status
```

A sale with a partial return may be represented as:

> **Completed — Partially Returned**

This is a derived UX state, not necessarily a replacement database state.

---

# 9. Full Return

When all relevant goods are returned:

> **Completed — Fully Returned**

The original sale remains historical evidence.

The return is a separate linked event.

---

# 10. Return Approval

Returns require Manager/Owner approval.

The approval screen should show:

- original sale;
- customer where available;
- products;
- original quantities;
- returned quantities;
- condition;
- return value;
- resulting business effects;
- requested settlement;
- approving authority.

---

# 11. Return Condition

The return workflow records the condition/treatment of returned goods.

At minimum, the UI should distinguish:

```text
Sellable
Non-sellable
Held / requires inspection
```

The exact inventory treatment remains B04/B06-owned.

---

# 12. No-Receipt Return

A no-receipt return may be investigated.

It still requires appropriate approval.

The UI should make clear that absence of a receipt does not create an automatic entitlement.

Recommended:

```text
No receipt found
→ Investigate
→ Verify evidence/context
→ Management approval
→ Return or reject
```

---

# 13. Rejected Return

A rejected return must remain visible as a historical attempt/decision.

It must not:

- reduce inventory;
- reduce debt;
- create a successful refund;
- alter the original sale.

The UI should clearly show:

> Return rejected

with the applicable reason.

---

# 14. Exchange

B04 establishes exchanges as:

```text
Approved return
+
New sale
```

There is no customer wallet.

The UI may provide a guided exchange flow, but the underlying records remain separate.

---

# 15. Refund / Settlement

Sabi Shop records successful refund/settlement activity but does not execute or control external money movement.

The UX should distinguish:

```text
Return approved
Settlement recorded
```

from:

```text
External money movement attempted
```

Only a successfully confirmed settlement/payment event should be recorded as a successful business event.

---

# 16. Settlement Amount

Normally:

```text
Settlement = approved return value
```

A lower settlement is allowed with an explicit reason.

A settlement greater than return value is not a normal return settlement and requires separate treatment.

The UI must not silently convert an excess amount into a return value.

---

# 17. Customer Debt Effect

An approved return can reduce the customer's outstanding obligation.

The original sale and original payment events remain unchanged.

UX:

```text
Original credit sale
→ Approved return
→ Resulting debt reduced
```

---

# 18. Incentive Effect

Approved returns should trigger the applicable incentive recalculation.

The original salesperson attribution remains intact.

The return handler does not replace the original salesperson.

Treatment of already-released incentives remains governed by the finalized incentive policy.

---

# 19. Return Receipt / Record

After approval, provide a return record showing:

- original sale reference;
- returned products/quantities;
- return value;
- condition;
- approval;
- settlement status;
- resulting customer/inventory consequences where appropriate.

---

# 20. Correction Model

B08 establishes a hybrid correction philosophy:

> Minor data-entry corrections may edit the current version; anything affecting money, inventory, debt, payment, incentive, or attribution becomes a separate corrective event.

C09 must make that distinction visible.

---

# 21. Correction Entry Point

Correction should be contextual.

Example:

```text
Sale
→ More / Actions
→ Correct record
```

Not:

```text
Edit everything
```

The action should explain why additional authority may be required.

---

# 22. Correction Window

The correction window starts at transaction completion.

Its duration is management-defined.

After the window, possible behavior depends on correction type:

- editing completely blocked;
- Manager/Owner-controlled correction;
- staff request for management approval;
- material corrective event.

The UI must not hard-code an arbitrary universal duration.

---

# 23. Minor Correction

A minor correction may modify the current accepted version where authorized.

Examples may include limited data-entry corrections that do not alter consequential business effects.

Even then:

- original version is preserved;
- editor recorded;
- timestamp recorded;
- reason recorded;
- history remains inspectable.

---

# 24. Material Correction

A correction affecting:

- money;
- inventory;
- debt;
- payment;
- incentive;
- attribution;

must be represented as a consequential corrective action/event.

The UI should preview the resulting business effect before authorization.

---

# 25. Wrong Quantity

A wrong quantity may require:

- edit;
- adjustment;
- management-controlled correction;

depending on correction window and whether downstream effects have occurred.

If inventory has already moved, the system must account for the resulting stock/cost consequences.

---

# 26. Wrong Price

A wrong price may require:

- edit;
- adjustment;
- management-controlled correction;

depending on timing and consequences.

The system must preserve the original price.

The corrected state must not silently rewrite the historical receipt.

---

# 27. Wrong Product / SKU

Wrong product/SKU is a high-integrity correction.

It should not be treated as a casual field edit.

The UX should require investigation and appropriate management control, especially once inventory, payment, debt, or customer records are affected.

The system should not casually label the user's mistake as criminal; it should instead treat the discrepancy as a serious operational/integrity matter.

---

# 28. Wrong Customer

Customer identity is high-integrity.

Changing the customer on a completed sale should not be an ordinary edit.

The workflow should:

```text
Identify discrepancy
→ Investigate
→ Confirm correct customer
→ Obtain appropriate authorization
→ Apply controlled correction
→ Preserve original association
```

---

# 29. Wrong Salesperson

Salesperson attribution is tied to the authenticated salesperson/user account unless a later assisted-sale model is introduced.

A later correction must not casually replace the original attribution.

Any attribution correction requires appropriate management control.

---

# 30. Payment Method Correction

Payment method changes must preserve the original record.

The UX should show:

```text
Original payment method
Corrected payment method
Reason
Authority
Resulting reconciliation effect
```

If the correction affects reconciled money, stronger authorization is required.

---

# 31. Payment Amount Correction

Payment amount corrections require Manager/Owner authorization.

The UI should show:

```text
Original amount
Corrected amount
Difference
Affected sale/debt/cash state
Authorization
```

The original payment event remains historical evidence.

---

# 32. Credit Sale Correction

A credit sale correction must preserve:

- original customer;
- original sale;
- original payment composition;
- original debt effect;
- corrective action;
- authorization;
- resulting state.

If the debt has already been partially repaid, management investigation is required.

---

# 33. Inventory Consequences

A correction affecting quantity/product/receipt can affect:

- stock;
- weighted-average cost;
- inventory value;
- supplier payable;
- profit calculations.

The UI should preview material consequences where possible.

The actual accounting mechanics remain B06-owned.

---

# 34. Stock Already Moved

If stock associated with a transaction has already moved elsewhere, the correction must not silently rewrite stock history.

The UI should flag the dependency and route the user to the appropriate controlled correction/investigation flow.

---

# 35. Negative Stock

Negative stock is not a normal business state.

If detected:

```text
Flag
→ Investigate
→ Reconcile
```

Do not offer a casual “accept negative stock” action.

---

# 36. Revenue / Profit Correction

Historical transactions should not be silently recalculated as if the original event never occurred.

Where a correction changes economic effects:

```text
Original event
→ Corrective event
→ Current accepted state
```

Current reports should reflect the accepted current state while historical evidence remains preserved.

---

# 37. Historical Reports

C09 must support two truths:

1. current reporting reflects authorized corrections;
2. historical evidence shows what was originally recorded and what changed.

A corrected transaction should never make the original record impossible to investigate.

---

# 38. Closed Business Day

Corrections affecting a closed business day require Manager/Owner authorization.

The UI should display:

```text
Original business date
Correction date/time
Current authorized actor
```

Do not imply that a later correction happened on the original business date.

---

# 39. Correction Reason

Every correction requires a reason.

B08 specifies:

> **Free text only.**

The interface should require reason entry before applying a correction.

---

# 40. Evidence Attachments

B08 does not require attachments/evidence in V1.

C09 therefore does not make attachments a mandatory correction workflow.

A future version may introduce evidence support if separately decided.

---

# 41. Correction Severity

Corrections are classified by severity.

The UI should support severity-aware presentation without inventing a new universal severity scale here.

Severity may influence:

- authority;
- review;
- visibility;
- reporting.

Exact classification remains subject to the authoritative correction/permission design.

---

# 42. Self-Correction

Staff cannot approve their own consequential correction.

A staff user should have:

```text
Request correction
```

rather than:

```text
Approve correction
```

for actions requiring independent authority.

---

# 43. Manager Self-Correction

Manager self-correction rules remain subject to Owner-defined role policy.

The UX should not assume that a Manager may freely approve their own material correction.

---

# 44. Owner Correction

Owner authority is broad, but Owner actions still preserve:

- actor;
- time;
- reason;
- original state;
- resulting state.

Owner authority does not mean history can be erased.

---

# 45. Authorization vs Review

Not every correction requires the same control.

C09 should support:

```text
Authorization required
Review required
No additional authorization
Request pending
Rejected
Applied
```

The exact control is determined by correction type, severity, role, and business rules.

---

# 46. Rejected Correction

If a correction is rejected:

- original transaction remains unchanged;
- correction request remains historical;
- rejection is visible in relevant management history;
- the user should understand that no business effect was applied.

A rejected request is not itself a correction of the underlying transaction.

---

# 47. Correction Applied

After approval/application:

```text
Original
→ Correction
→ Accepted current state
```

The UI should make the relationship explicit.

---

# 48. Correction of a Correction

A correction can itself be wrong.

The system should support further controlled correction.

Do not overwrite the earlier correction.

History becomes:

```text
Original
→ Correction 1
→ Correction 2
```

---

# 49. Approval Mistake

If management approves an incorrect correction, that approval remains historical evidence.

A later authorized correction can resolve the resulting business state.

Do not erase the mistaken approval.

---

# 50. Duplicate Transaction

Duplicate handling depends on the situation.

Possible controlled outcomes:

- void duplicate;
- mark duplicate and compensate/reverse its effects through the appropriate mechanism;
- merge.

Both source records and their histories remain preserved.

---

# 51. Duplicate Review

The duplicate review screen should compare:

```text
Transaction A
Transaction B
Date/time
User
Customer
Products
Quantities
Prices
Payments
Business effects
```

The user should understand why the records are considered duplicates.

---

# 52. Merge

Transactions may be merged where appropriate.

Merge means establishing a controlled accepted relationship/result.

It does not mean:

```text
Delete A
Delete B
Create replacement
```

Both original histories remain accessible.

---

# 53. Merge Confirmation

Before merge, show:

```text
Source record A
Source record B
Proposed accepted relationship/state
Business effects
Potential conflicts
Authority required
```

Do not hide conflicts behind a generic “Merge” button.

---

# 54. Cash Reconciliation

C09 connects transaction exceptions to cash reconciliation.

B05 establishes:

- opening cash;
- cash-in/out;
- handovers;
- physical cash count;
- discrepancy;
- investigation;
- resolution;
- closure;
- correction history.

C09 defines how those become investigation UX.

---

# 55. Cash Discrepancy

A cash discrepancy should be shown as:

> **Discrepancy requiring investigation**

not as automatic accusation.

Example:

```text
Expected cash: ₦250,000
Physical cash: ₦245,000
Difference: -₦5,000
```

The UI should provide a path to investigate contributing events.

---

# 56. Cash Investigation

Useful investigation links include:

- cash sales;
- refunds/settlements affecting cash;
- cash-in;
- cash-out;
- handovers;
- owner withdrawals;
- corrections;
- relevant payment records.

The original reconciliation remains visible.

---

# 57. Cash Discrepancy Resolution

If resolved, preserve:

```text
Discovery
→ Investigation
→ Resolver
→ Date/time
→ Explanation
→ Resulting corrective event
```

Do not silently rewrite the original reconciliation.

---

# 58. Missing Sale Found During Reconciliation

If management determines that goods were sold but a sale was missing:

```text
Investigation
→ Record missing sale / appropriate corrective business event
→ Reconcile inventory and money
```

Do not conceal the missing sale through an arbitrary cash or stock adjustment.

---

# 59. Payment-Method Reconciliation

The reconciliation UX should distinguish:

```text
Cash
Transfer
POS/Card
Credit
Other configured methods
```

The exact payment-method catalogue remains configurable.

A discrepancy in one method should not automatically be hidden inside another method.

---

# 60. Inventory Reconciliation

Inventory discrepancy follows the same principle:

```text
Count
→ Detect variance
→ Investigate
→ Determine cause
→ Authorize correction
→ Apply inventory event
```

A stock count is evidence, not an automatic overwrite.

---

# 61. Debt Reconciliation

Debt reconciliation should connect:

```text
Original credit sale
→ Repayments
→ Returns
→ Write-offs
→ Corrections
→ Current outstanding
```

The UI should expose the source chain.

---

# 62. Management Review Queue

C09 requires a deliberate management review surface for consequential unresolved work.

Possible categories:

```text
Returns awaiting approval
Corrections awaiting approval
Cash discrepancies
Inventory discrepancies
Debt disputes
Write-off requests
Duplicate transaction reviews
Sync conflicts
Integrity issues
```

Each item should link to the affected source record.

---

# 63. Review Item Design

Each review item should show:

```text
What happened
Why it needs attention
Affected business area
Financial/inventory consequence where permitted
Requested action
Required authority
Age/date
```

Avoid unexplained badges such as “12 issues.”

---

# 64. Review Actions

Actions should be explicit:

```text
Review
Approve
Reject
Investigate
Resolve
Request more information
Open source record
```

The exact action set depends on the issue type.

---

# 65. Rejected Review

A rejected action must leave the underlying business record unchanged unless the authoritative workflow defines another effect.

The rejection itself remains visible.

---

# 66. Offline Exception Workflow

Offline exception operations should display:

```text
Offline
Locally recorded
Pending sync
Conflict
Resolved
```

Offline capability does not eliminate authorization.

---

# 67. Offline Correction

An offline correction affecting money, inventory, debt, payment, incentive, or attribution may be recorded only where the configured offline authority permits it.

After synchronization, management review may still be required.

---

# 68. Offline Conflict

Never:

- automatically overwrite;
- discard local history;
- silently choose the server version;
- silently choose the local version.

The conflict must become an explicit resolution workflow.

---

# 69. Integrity / Tamper Detection

If integrity validation indicates suspected tampering:

```text
Block affected action
→ Preserve evidence
→ Flag to higher authority than acting account
→ Owner may override/resolve according to policy
```

The UI should communicate seriousness without exposing technical hash details to ordinary users.

---

# 70. Integrity UX

Recommended user-facing structure:

```text
Integrity issue detected

Affected record
What is blocked
Why management attention is required
Who can resolve it
Open investigation
```

Avoid technical jargon such as “hash-chain mismatch” unless the audience is an authorized technical/administrative user.

---

# 71. No Silent Repair

There must be no casual:

```text
Fix record
Repair transaction
Reset balance
Rebuild history
```

control for suspected integrity failures.

Any recovery must preserve the evidence and follow the authority model.

---

# 72. Audit Trail Presentation

The UI should present audit history in human-readable form.

Example:

```text
10:31 — Sale completed
10:42 — Correction requested by Staff
10:48 — Correction approved by Manager
10:49 — Corrected state applied
```

The underlying D10/D11 technical integrity mechanisms remain separate.

---

# 73. Event vs Current State

Exception screens should distinguish:

```text
Current accepted state
```

from:

```text
Historical events
```

This prevents users from confusing “what is true now” with “what was originally recorded.”

---

# 74. Consequence Preview

Before applying a material exception action, show expected effects.

Examples:

> This correction will reduce inventory by 2 units.

> This approved return will reduce the customer's outstanding obligation by ₦20,000.

> This payment correction will change the reconciled cash difference by ₦5,000.

Exact calculations come from the relevant domain/accounting logic.

---

# 75. Confirmation

High-impact actions should use business-specific confirmation language.

Prefer:

> **Approve return**

over:

> **Save**

Prefer:

> **Apply correction**

over:

> **Update**

Prefer:

> **Resolve discrepancy**

over:

> **Submit**

---

# 76. Loading States

Exception workflows need localized states for:

- loading source record;
- calculating consequences;
- submitting approval;
- applying correction;
- recording settlement;
- reconciling;
- syncing;
- resolving conflict.

Prevent duplicate submissions.

---

# 77. Error States

Important errors include:

- authorization expired;
- correction no longer valid;
- source record changed;
- conflicting correction;
- payment not confirmed;
- stock moved;
- debt already changed;
- duplicate detected;
- sync conflict;
- integrity failure.

Each error should preserve the user's work where safe and explain the next action.

---

# 78. Mobile Exception UX

On mobile, consequential workflows should use deliberate step sequences.

Example:

```text
Issue
→ Evidence/context
→ Consequences
→ Authorization
→ Confirmation
→ Result
```

Avoid dense side-by-side comparisons when the screen cannot support them clearly.

---

# 79. Exception UX State Inventory

C09 should support at least:

```text
Normal
Needs Review
Authorization Required
Pending
Approved
Rejected
Applied
Partially Applied
Disputed
Conflict
Offline
Sync Pending
Integrity Issue
Blocked
Error
Resolved
```

These are UX states and do not automatically define database statuses.

---

# 80. Return Acceptance Criteria

A return experience is successful when:

- original sale remains intact;
- partial return is supported;
- return requires appropriate approval;
- condition is recorded;
- no-receipt return can be investigated;
- rejected return has no business effect;
- exchanges remain return + new sale;
- settlement is recorded only when successful;
- customer debt consequences are traceable;
- salesperson attribution remains intact;
- incentive recalculation is triggered appropriately.

---

# 81. Correction Acceptance Criteria

A correction experience is successful when:

- correction is distinct from deletion;
- correction window is respected;
- high-integrity fields receive stronger control;
- every correction has a reason;
- staff cannot approve their own consequential correction;
- closed-day corrections are controlled;
- original state remains recoverable;
- corrected state is clear;
- corrections can themselves be corrected;
- rejected corrections do not silently alter business state.

---

# 82. Reconciliation Acceptance Criteria

A reconciliation experience is successful when:

- discrepancies are investigation-first;
- cash history remains intact;
- inventory discrepancies remain traceable;
- debt discrepancies remain traceable;
- missing sales can be investigated;
- corrections create appropriate downstream effects;
- unresolved issues remain visible;
- resolution records who/when/why;
- payment methods remain distinguishable.

---

# 83. Integrity Acceptance Criteria

An integrity experience is successful when:

- suspected tampering blocks affected operations;
- evidence is preserved;
- escalation goes to higher authority;
- Owner can resolve according to policy;
- no casual repair exists;
- ordinary users are not burdened with unnecessary technical details;
- audit history remains inspectable.

---

# 84. Reconciliation With C00

C00 establishes auditability, deliberate consequential actions, offline/conflict states, and business truth as foundational UX principles.

C09 is the concentrated application of those principles to exceptions.

---

# 85. Reconciliation With C01

C01 separates:

```text
Activity
Management
Money
Products & Inventory
Customers & Credit
```

C09 connects them through source-linked exception workflows rather than collapsing them into one generic exception page.

---

# 86. Reconciliation With C02

C02 established journeys for:

- returns;
- refunds/settlements;
- corrections;
- duplicate transactions;
- reconciliation;
- offline conflicts;
- integrity issues;
- management review.

C09 turns those journeys into a unified exception UX model.

---

# 87. Reconciliation With C03

C03 remains authoritative for the visual system and component states.

C09 adds domain-specific meaning to states such as:

```text
Needs Review
Authorization Required
Conflict
Integrity Issue
```

---

# 88. Reconciliation With C04

C04 provides the shell and management attention entry point.

C09 defines the content and workflow behind those exception/review destinations.

---

# 89. Reconciliation With C05

C05 is public-facing landing UX.

C09 is internal operational UX and should not inherit marketing-style conversion patterns where they conflict with deliberate business controls.

---

# 90. Reconciliation With C06

C06 owns POS execution.

C09 owns post-completion returns, corrections, and related reconciliation.

The POS may provide contextual entry into C09 but should not duplicate its full exception management workflow.

---

# 91. Reconciliation With C07

C07 owns inventory/purchasing workflows.

C09 owns inventory discrepancies and inventory-affecting corrections as exception workflows.

---

# 92. Reconciliation With C08

C08 owns customer/credit workflows.

C09 owns customer/debt corrections, return consequences, disputes, and reconciliation exceptions.

---

# 93. Reconciliation With B04

B04 remains authoritative for:

- return approval;
- partial returns;
- no-receipt handling;
- condition;
- exchange;
- settlement/refund rules;
- customer obligation effects;
- incentive consequences;
- offline returns;
- correction history.

C09 expresses these as exception UX.

---

# 94. Reconciliation With B05

B05 remains authoritative for:

- cash reconciliation;
- discrepancy handling;
- investigation;
- resolution;
- handovers;
- closure;
- payment-method reconciliation;
- cash correction history.

C09 provides the investigation UX.

---

# 95. Reconciliation With B07

B07 establishes:

- original transaction identity;
- correction/version philosophy;
- void as controlled invalidation/correction;
- returns as separate events;
- no deletion;
- preservation of historical relationships.

C09 turns those lifecycle principles into visible interactions.

---

# 96. Reconciliation With B08

B08 is the primary business authority for correction and exception policy.

C09 must not weaken B08 through convenient UI shortcuts.

---

# 97. Reconciliation With B09

B09 remains authoritative for role and permission assignment.

C09 presents only the actions available to the current user/context.

---

# 98. Reconciliation With B06

B06 remains authoritative for weighted-average costing and inventory-cost consequences.

C09 surfaces consequences but does not redefine costing.

---

# 99. Historical Question Reconciliation

| Earlier question | Earlier status | C09 treatment | Authority |
|---|---|---|---|
| Partial returns? | Resolved | Supported | B04 |
| Return approval? | Resolved | Manager/Owner | B04 |
| No-receipt return? | Resolved | Investigate + approve | B04 |
| Return condition? | Resolved | Record treatment | B04 |
| Exchange? | Resolved | Return + new sale | B04 |
| Settlement execution? | Resolved | Sabi Shop records, does not execute | B04 |
| Settlement less than return value? | Resolved | Allowed with reason | B04 |
| Settlement greater than return value? | Resolved | Not normal return settlement | B04 |
| Return effect on debt? | Resolved | Reduces obligation through separate event | B04 |
| Return effect on incentive? | Resolved | Recalculate provisional incentive | B04/D05 |
| Correction window? | Management-defined | UX does not invent duration | B08 |
| Wrong quantity? | Resolved | Edit/adjustment/dependent on timing | B08 |
| Wrong price? | Resolved | Edit/adjustment/dependent on timing | B08 |
| Wrong SKU? | Resolved | High-integrity controlled correction | B08 |
| Wrong customer? | Resolved | High-integrity controlled correction | B08 |
| Payment correction? | Resolved | Preserve original | B08 |
| Closed-day correction? | Resolved | Manager/Owner authorization | B08 |
| Correction reason? | Resolved | Mandatory free text | B08 |
| Evidence attachments? | Resolved | Not required V1 | B08 |
| Duplicate transaction? | Resolved | Void / duplicate handling / merge depending situation | B08 |
| Merge? | Resolved | Supported, histories preserved | B08 |
| Reconciliation discrepancy? | Resolved | Investigate first | B05/B06 |
| Negative stock? | Resolved | Flag/reconcile | B08 |
| Integrity/tampering? | Resolved | Block + escalate; Owner may resolve | B08 |
| General reversal transaction? | Resolved | Not a normal successful business event | B08 |
| Exact return state model? | Deferred | UX states only; domain/technical model remains authoritative | B04/D06 |
| Exact approval matrix? | Deferred | B09/management policy | B09 |
| Exact settlement payment-method implementation? | Deferred | Not invented | B04/D-series |

---

# 100. Explicit Non-Decisions

C09 does not establish:

- accounting journal implementation;
- database schema;
- technical event names;
- hash-chain implementation;
- exact correction severity taxonomy;
- exact correction window duration;
- exact permission IDs;
- exact settlement integration;
- exact repayment allocation algorithm;
- external payment execution;
- final visual tokens;
- final copy;
- API contracts;
- synchronization algorithm.

---

# 101. Design Principle Summary

The exception experience should feel like:

> **A controlled investigation and correction system.**

Not:

> **An undo button for business history.**

The user's goal is not merely to make the screen look correct.

The goal is to make the business record correct **while preserving evidence of what happened**.

---

# 102. Next Deliverable

## C10 — Offline, Conflict & Exceptional States UX

C10 will consolidate the cross-cutting state model for:

```text
Offline
→ Local recording
→ Sync pending
→ Sync success
→ Sync failure
→ Conflict
→ Conflict resolution
→ Authorization offline
→ Integrity failure
→ Permission denial
→ Loading
→ Empty
→ Error
→ Recovery
```

It will define how these states behave consistently across POS, inventory, purchasing, customers/credit, returns, corrections, money, and management.

---

# FINAL RECONCILIATION — BUSINESS DECISIONS APPLIED

This document must express the finalized business decisions: configurable 15-minute-default correction window; ordinary vs high-integrity corrections; Owner visibility for consequential Manager self-corrections; logged/reviewable transfer confirmation; core plus configurable payment methods; tax-aware totals; supplier-return settlement states; operational business-day sessions that may cross midnight; shared or individual cash custody; weighted-average costing; visible negative-stock exceptions; and Cash in Hand / Expected Cash / Actual Cash terminology.
