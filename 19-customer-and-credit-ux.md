# C08 — Customer & Credit UX

**Product:** Sabi Shop  
**Document ID:** C08  
**Package:** C — User Experience Specification  
**Status:** RECONCILED — DESIGN BASELINE — Customer & Credit UX  
**Version:** 1.0  
**Prepared:** 2026-09-04  
**Depends on:** C00 — UX & Design Foundation; C01 — Information Architecture; C02 — User Journeys & Task Flows; C03 — Sabi Shop Design System; C04 — Application Shell & Navigation; C06 — POS UX; C07 — Inventory & Purchasing UX; B03 — Credit & Debt; B08 — Correction & Exception Policy; B09 — Roles & Permissions; D02 — Domain Dictionary; D03/D04/D06–D11 technical specifications  
**Authoritative for:** Customer and credit/debt information architecture, customer workflows, credit-sale UX, repayment UX, debt investigation UX, customer-facing correction visibility, and related exceptional states  
**Does not replace:** credit/debt business rules, accounting rules, permissions, or technical implementation owned by their authoritative deliverables

---

# 1. Purpose

C08 defines the user experience for customers, customer identity, credit eligibility, credit sales, outstanding debts, repayments, debt allocation, disputes, write-offs, and customer-facing correction visibility.

The experience must make ordinary customer work fast while making credit and debt decisions deliberate, explicit, and traceable.

The governing principle remains:

> **Fast for ordinary work. Deliberate for consequential work.**

---

# 2. Customer & Credit UX Objective

The customer area should help an authorized user answer:

- Who is this customer?
- What sales are associated with them?
- Is credit allowed?
- What is the credit limit?
- What do they currently owe?
- Which debts are outstanding?
- What repayments have been made?
- How were repayments allocated?
- Is a debt disputed?
- Has anything been written off?
- What customer-facing corrections occurred?
- What requires management attention?

The interface should connect summaries back to source records.

---

# 3. Domain Boundary

Customers and credit are connected but should not become one undifferentiated record.

Recommended conceptual areas:

```text
Customers
Customer Detail
Credit Status
Outstanding Debts
Repayments
Disputes / Investigations
Write-offs
Credit Activity / History
```

Cash, payment-method reconciliation, and broader money operations remain owned by Money and the relevant financial specifications.

---

# 4. Customer Record

The minimum customer credit record established by B03 is:

```text
Name
Phone
```

Additional customer information may be supported where configured.

The UX should not make optional information appear mandatory unless the authoritative business rule requires it.

---

# 5. Customer Identity

Customer identity is high-integrity information.

Before completing a credit sale, the salesperson should confirm the selected customer.

The UI should make the selected customer's identity visible before commitment.

Recommended confirmation information:

```text
Customer name
Phone
Credit status
Relevant credit limit/outstanding information
```

Only information permitted for the current role should be shown.

---

# 6. Customer Search

Customer search should be fast enough for use during POS.

Search should support configured customer identifiers such as:

- name;
- phone;
- other approved identifying attributes.

Results should clearly distinguish customers with similar names.

The user should not be encouraged to select a customer from an ambiguous match.

---

# 7. New Customer During Sale

Where permissions allow, a salesperson may create a customer from the sale workflow.

Creating the customer does not itself authorize credit.

The flow remains:

```text
Create/select customer
→ Check credit eligibility
→ Obtain required authorization
→ Complete credit sale
```

---

# 8. Customer Detail

Customer detail should answer:

> What is the current relationship between this customer and the business?

Recommended sections:

```text
Identity
Credit status
Credit limit
Outstanding debt
Debt history
Sales
Repayments
Disputes
Write-offs
Relevant corrections
Activity
```

The most important current financial state should be visible first.

---

# 9. Credit Status

B03 establishes three customer credit statuses:

```text
Credit Allowed
Restricted
Blocked
```

The UI should use these exact business concepts.

Do not replace them with vague labels such as “good customer” or “bad customer.”

---

# 10. Credit Allowed

A customer with **Credit Allowed** may use approved credit subject to the applicable limit and authorization rules.

Credit eligibility should still be checked at the point of sale.

A status alone must not bypass transaction-level authorization where required.

---

# 11. Restricted

Restricted means credit use requires additional management handling according to the configured rules.

The POS should explain that management authorization is required rather than allowing a salesperson to interpret the status themselves.

---

# 12. Blocked

A blocked customer should not be allowed to complete an ordinary credit sale.

The UI should provide a clear reason category where appropriate without exposing unnecessary internal information.

A management-controlled exception may be possible only where the authoritative rules permit it.

---

# 13. Credit Limit

A customer may have a configured credit limit.

The interface should distinguish:

```text
Credit limit
Current outstanding
Available credit
```

where these values are applicable.

The system should not imply that available credit equals permission to bypass required authorization.

---

# 14. Over-Limit Credit

A credit sale that exceeds the customer's limit requires an authorized exception under B03.

The UX should show the consequence before completion:

```text
Credit limit
Current outstanding
New credit amount
Projected outstanding
Limit difference
Authorization required
```

Do not hide an over-limit sale inside a generic “Complete Sale” flow.

---

# 15. Credit Sale

A credit sale must explicitly establish:

- customer;
- products and actual quantities;
- actual selling prices;
- credit amount;
- required authorization;
- completion state.

Unpaid sales must not silently become customer debt.

---

# 16. Credit + Other Payment Methods

Credit may be combined with other payment methods.

For example:

```text
Sale total: ₦100,000

Cash: ₦20,000
Transfer: ₦30,000
Credit: ₦50,000
```

The POS should show the complete payment composition before completion.

The resulting customer debt should equal the credit portion, not the full sale.

---

# 17. Customer Debt Creation

Debt is created as part of a successfully completed authorized credit sale.

The customer should not receive a debt merely because:

- a product was added to a basket;
- a salesperson discussed credit;
- a payment attempt failed;
- an abandoned sale existed.

Only the successful business event creates the receivable.

---

# 18. Debt as a Separate Business Concept

Customer receivables remain separate from:

- cash;
- revenue;
- profit;
- inventory;
- expenses;
- owner funding;
- withdrawals.

The UI should therefore avoid presenting “customer balance” as if it were business cash.

---

# 19. Outstanding Debt Summary

Customer detail should provide a clear summary:

```text
Total outstanding
Number of open debts
Oldest outstanding debt
Recent repayment
Credit status
```

The exact summary metrics can be validated in C11.

---

# 20. Individual Debt Records

Each credit sale should remain an independently traceable debt source.

The debt view should link to:

```text
Original sale
Customer
Original amount
Payments/repayments allocated
Remaining amount
Current status
```

Multiple credit sales must not be collapsed into one untraceable balance.

---

# 21. Fully Paid Debt

When a debt is fully paid:

```text
Status → Paid
```

The debt remains visible historically.

It must never be deleted merely because the outstanding amount is zero.

---

# 22. Partial Repayment

Partial repayment should clearly show:

```text
Original debt
Amount repaid
Remaining balance
Repayment date/time
Payment method
```

The repayment does not rewrite the original credit sale.

---

# 23. Multiple Repayments

A debt may receive multiple repayments.

The UI should show each successful repayment as its own event.

Example:

```text
Credit sale: ₦100,000

Repayment 1: ₦20,000
Repayment 2: ₦30,000
Repayment 3: ₦50,000

Remaining: ₦0
Status: Paid
```

---

# 24. Repayment Recording

A repayment is recorded only when the relevant payment has successfully occurred and been confirmed according to the payment workflow.

The system should not treat an unconfirmed transfer as a successful repayment.

Failed or reversed payment attempts should not be represented as successful business repayment events.

---

# 25. Repayment Allocation

B03 allows one repayment to be allocated across multiple debts.

The UX should make allocation explicit.

Example:

```text
Customer repayment: ₦100,000

Debt A: ₦60,000 → allocate ₦60,000
Debt B: ₦50,000 → allocate ₦40,000

Unallocated: ₦0
```

The exact allocation strategy remains a business/UI decision where multiple valid strategies exist.

---

# 26. No Customer Wallet

V1 does not use a general customer wallet or generic credit balance.

Therefore the UI should not introduce:

- wallet top-ups;
- wallet withdrawals;
- stored customer funds;
- generic account credit.

Customer financial history should be based on actual sales, debts, repayments, returns, and authorized corrections.

---

# 27. Repayment Review

Before recording a repayment, show:

```text
Customer
Payment amount
Payment method
Debts affected
Allocation
Remaining balances
```

The user should understand which obligations are being reduced.

---

# 28. Repayment Completion

After successful recording:

```text
Repayment recorded
Debt balances updated
Customer history updated
```

Provide direct links to:

- repayment record;
- affected debts;
- customer detail.

---

# 29. Customer Credit History

Customer history should make the relationship understandable over time.

Useful event types include:

- credit sale;
- repayment;
- return affecting obligation;
- approved write-off;
- dispute/investigation;
- authorized correction;
- relevant management action.

The original source events remain preserved.

---

# 30. Returns and Customer Debt

B04 establishes that an approved return can reduce the customer's outstanding obligation.

The original sale and original payment events remain unchanged.

The UI should therefore present:

```text
Original sale
→ Approved return
→ Resulting customer obligation
```

rather than rewriting the original sale amount.

---

# 31. Return With Credit

For a credit sale that is later returned, the customer debt may be reduced according to the approved return and settlement rules.

The customer-facing view should make the relationship understandable without exposing internal audit details.

---

# 32. Refund / Settlement

Sabi Shop records successful refund/settlement events but does not execute or control external money movement.

The UI should therefore distinguish:

```text
Refund/settlement recorded
```

from:

```text
Money movement executed by Sabi Shop
```

Only successful settlement/payment events should be represented as successful business events.

---

# 33. Disputed Debt

A disputed debt remains visible.

The UI should distinguish:

```text
Outstanding
```

from:

```text
Disputed
```

A dispute must not silently erase or rewrite the debt.

---

# 34. Debt Investigation

Management investigation should provide access to:

- original sale;
- customer identity;
- payment events;
- repayments;
- returns;
- corrections;
- relevant salesperson attribution;
- applicable authorization history.

The objective is to understand the discrepancy before changing the business state.

---

# 35. Write-Off

Write-offs require authorization and a reason.

The UX should make the action deliberate:

```text
Debt
→ Write off
→ Amount
→ Reason
→ Authorization
→ Confirm
```

The original debt remains historically visible.

---

# 36. Write-Off Visibility

A written-off debt should remain distinguishable from:

```text
Paid
```

and:

```text
Cancelled
```

The UI should show the write-off as a separate management event affecting the debt state.

---

# 37. Debt Correction

Corrections to debt must preserve the original state.

Where a correction is authorized:

```text
Original state
→ Correction
→ Corrected state
```

The UI should expose enough information to understand that a correction occurred.

B08 remains authoritative for correction mechanics.

---

# 38. Customer Identity Correction

Customer identity is a high-integrity field.

Changing the customer attached to a completed sale is not an ordinary edit.

The system should require confirmation and appropriate management control.

The original association must remain historically recoverable.

Unauthorized alteration of customer identity is treated as a serious integrity concern; the system should not casually classify it as a normal data-entry correction.

---

# 39. Credit Sale Correction

If a credit sale is wrong, the correction workflow must preserve:

- original sale;
- original customer;
- original amount;
- original payment composition;
- correction;
- authorization;
- resulting debt state.

The corrected state should be reflected in customer-facing output where required.

---

# 40. Partially Repaid Debt Correction

If a debt has already received repayments, correction becomes more consequential.

The UI should not simply overwrite the debt balance.

Management should investigate the relationship among:

```text
Original credit sale
Repayments
Returns
Corrections
Current outstanding
```

and apply the appropriate authorized correction.

---

# 41. Closed Business Day

Corrections affecting a closed business day require Manager/Owner authorization under B08.

The UI should make the historical date and current correction date distinguishable.

Do not make it appear that the correction happened on the original business date.

---

# 42. Correction Window

The correction window begins at sale completion.

The exact duration is management-defined.

After the configured window, the system may:

- block editing;
- require Manager/Owner control;
- allow staff to request management approval;
- require a material corrective event.

The applicable path depends on correction type and authority.

---

# 43. Staff Correction

A staff member must not approve their own consequential correction.

Where staff identify an error, the UX should support:

```text
Identify issue
→ Request correction
→ Management review
→ Approve/reject
→ Apply authorized correction
```

The original record remains intact.

---

# 44. Management Correction

Managers and Owners may have different correction authorities according to B09 and later role refinement.

The UX should not assume that “Manager” means unrestricted access.

Permissions determine the available action.

---

# 45. Customer-Facing Correction Visibility

Customers should be able to see that a relevant correction occurred.

They should not automatically see internal audit details such as:

- internal approval reasoning;
- internal investigation notes;
- integrity metadata;
- internal user/security details.

Customer-facing history should be understandable without exposing internal controls.

---

# 46. Customer Receipt After Correction

Where a corrected transaction affects a customer receipt:

```text
Original receipt remains historical evidence
Corrected receipt is generated
Original may be marked as corrected
```

The customer should not be left with an apparently valid receipt that conflicts with the accepted current state without explanation.

---

# 47. Salesperson Attribution

The original salesperson remains attributed to the sale.

A customer view should not silently replace the salesperson merely because another employee processed a later repayment, return, or correction.

---

# 48. Customer Search During POS

The POS should provide contextual customer access.

The user should be able to:

```text
Sell
→ Customer
→ Search/select customer
→ View relevant credit state
→ Continue sale
```

The user should not have to leave the active sale unnecessarily.

---

# 49. Credit Authorization During POS

Credit authorization should appear only when needed.

Example:

```text
Customer selected
Credit status checked
Credit amount calculated
Within limit / over limit
Authorization required if applicable
→ Confirm credit
```

The authorization step should explain why it is required.

---

# 50. Payment and Credit Summary

Before completing a credit or split-payment sale, show:

```text
Sale total
Paid now
Credit
Customer
Projected outstanding
```

For over-limit cases, show the limit comparison.

This prevents accidental conversion of a partial payment into a larger debt.

---

# 51. Credit Sale Receipt

The receipt should show, where applicable:

- customer;
- products;
- quantities;
- historical selling prices;
- sale total;
- payment breakdown;
- credit amount;
- salesperson;
- relevant correction/authorization state.

Do not expose internal acquisition cost to ordinary customers.

---

# 52. Customer History Navigation

From a customer record, users should be able to move to source records:

```text
Customer
→ Sale
→ Debt
→ Repayment
→ Return
→ Correction
```

From a debt:

```text
Debt
→ Original sale
→ Repayments
→ Returns
→ Corrections
```

This creates an evidence path without requiring users to search independently.

---

# 53. Offline Customer Work

Core customer and credit operations should work offline where established by the product's offline architecture.

The UI should make state explicit:

```text
Offline
Locally recorded
Sync pending
Synchronized
Conflict
```

Offline status must never imply that an external payment was successfully confirmed when it was not.

---

# 54. Offline Credit Sale

An offline credit sale may proceed only where the configured permissions and offline policy allow it.

Offline does not bypass:

- customer identity requirements;
- credit authorization;
- credit limits where enforced locally;
- role restrictions;
- audit requirements.

---

# 55. Offline Repayment

Offline repayment recording is subject to the same successful-payment rule.

If the payment cannot be confirmed, the UI must not falsely present the repayment as a successful payment event.

---

# 56. Sync Conflict

A customer/debt conflict must never be silently overwritten.

The conflict workflow should show:

```text
Affected customer
Affected debt/payment
Local state
Synchronized state
Source events
Required authority
Resolution
```

The resolution must preserve both relevant histories.

---

# 57. Duplicate Credit Transaction

If duplicate transactions are discovered, B08 allows different controlled outcomes depending on the situation:

- void duplicate;
- mark duplicate and reverse effects;
- merge.

The UX should preserve both original records and their histories.

A merge is a relationship/result, not permission to erase the source histories.

---

# 58. Integrity Issue

If tampering or integrity failure is suspected:

```text
Block affected correction/action
→ Preserve evidence
→ Flag to higher authority
→ Owner may override/resolve according to B08
```

Do not provide a casual “fix customer balance” control.

---

# 59. Customer Privacy and Visibility

Customer information should be shown according to role and business need.

The UX should avoid unnecessarily exposing:

- internal management notes;
- sensitive operational metadata;
- cost information;
- security/integrity details.

The exact privacy model remains subject to B09 and technical security work.

---

# 60. Staff Experience

Staff should be optimized for:

- customer lookup;
- customer creation where allowed;
- ordinary customer selection during sale;
- viewing permitted credit state;
- recording permitted customer workflows;
- requesting management intervention.

Staff should not receive unrestricted debt correction, write-off, or credit-override controls.

---

# 61. Manager Experience

Managers should be able to handle the operational credit controls granted by B09, including applicable:

- credit authorization;
- over-limit exceptions;
- debt investigation;
- repayment correction;
- write-off;
- customer correction;
- dispute handling.

Exact permission assignment remains B09-owned.

---

# 62. Owner Experience

Owner users have the broadest authority while remaining bound by audit and historical-preservation requirements.

Owner actions remain attributable.

Owner authority does not mean historical evidence can be destroyed.

---

# 63. Customer Overview

The customer landing area should prioritize actionable information:

```text
Customers needing attention
Outstanding credit
Disputed debts
Recent repayments
Recent credit activity
```

Avoid decorative customer metrics that do not support a business action.

---

# 64. Customer Detail State Model

Recommended conceptual states:

```text
No Customer Selected
Customer Found
Customer Detail
Credit Allowed
Restricted
Blocked
Outstanding Debt
Partially Paid
Paid
Disputed
Write-Off Recorded
Correction Pending
Correction Applied
Offline
Sync Pending
Conflict
Permission Denied
Integrity Issue
Error
```

These are UX states, not necessarily database statuses.

---

# 65. Debt State Model

The UX may represent debt states such as:

```text
Outstanding
Partially Paid
Paid
Disputed
Written Off
Under Correction
```

The exact authoritative domain state model remains B03/D03/D06-owned.

---

# 66. Loading States

Customer/credit screens should distinguish:

- searching customers;
- loading customer detail;
- loading debts;
- loading repayment history;
- recording repayment;
- applying authorization;
- synchronizing;
- resolving conflict.

Avoid replacing the whole application with a generic spinner.

---

# 67. Empty States

Examples:

### No customers

> No customers yet. Add a customer when one needs to be associated with a sale.

### No outstanding debt

> This customer has no outstanding credit.

### No repayment history

> No repayments recorded for this customer yet.

### No disputes

> No disputed debts require attention.

Exact copy remains subject to C11 validation.

---

# 68. Error States

Important errors include:

- ambiguous customer match;
- duplicate customer identity;
- invalid phone/name data;
- credit blocked;
- credit limit exceeded;
- authorization rejected;
- repayment amount invalid;
- payment not confirmed;
- allocation mismatch;
- correction conflict;
- sync failure;
- permission denied;
- integrity issue.

Every error should explain the safest next action.

---

# 69. Financial Precision

Financial values should use the established monetary precision:

> **Nearest kobo.**

Do not display ambiguous rounded debt values where the underlying value has greater precision.

---

# 70. Data Density

Customer and debt screens require careful numerical hierarchy.

Prioritize:

```text
Outstanding amount
Payment/repayment amount
Credit limit
Remaining balance
```

Use consistent alignment for monetary values.

---

# 71. Mobile Customer Experience

Mobile should prioritize:

- customer search;
- customer identity confirmation;
- credit status;
- outstanding amount;
- debt list;
- repayment;
- source-record access.

Long history can be progressively disclosed.

---

# 72. Repayment on Small Screens

Recommended sequence:

```text
Customer
→ Repayment amount
→ Payment method
→ Allocation
→ Review
→ Record repayment
```

The customer identity should remain visible throughout.

---

# 73. Consequence Preview

Before consequential credit actions, preview the resulting state.

Examples:

> This credit sale will increase outstanding debt from ₦40,000 to ₦90,000.

> This repayment will reduce Debt A from ₦60,000 to ₦20,000.

> This write-off will reduce the collectible outstanding amount by ₦25,000.

The exact copy should be validated later.

---

# 74. No Silent Balance Editing

A balance should never be presented as a free-edit field.

Where a balance changes, the user should be able to identify the source event:

```text
Sale
Repayment
Return
Write-off
Correction
```

---

# 75. Auditability

Credit/debt UX must preserve:

- original sale;
- repayment events;
- return events;
- write-off;
- correction;
- actor;
- timestamp;
- reason where required;
- authorization where required.

A current balance is a result, not the complete history.

---

# 76. Cross-Domain Navigation

Customer and credit screens should connect naturally to:

- POS sale;
- receipts;
- payments;
- returns;
- supplier-independent money records where relevant;
- activity;
- management review.

Navigation must remain permission-safe.

---

# 77. Example: Normal Credit Sale

```text
POS
→ Select customer
→ Credit Allowed
→ Check credit limit
→ Add products
→ Payment = Credit
→ Required authorization
→ Confirm
→ Complete Sale
→ Debt created
→ Receipt available
```

---

# 78. Example: Credit + Cash

```text
Sale total: ₦100,000

Cash: ₦40,000
Credit: ₦60,000

→ Confirm successful cash payment
→ Complete authorized sale
→ Customer debt = ₦60,000
```

---

# 79. Example: Over-Limit Credit

```text
Current outstanding: ₦80,000
Credit limit: ₦100,000
New credit: ₦40,000

Projected outstanding: ₦120,000
Over limit: ₦20,000

→ Show consequence
→ Require authorized exception
→ Approve/reject
→ Complete only if authorized
```

---

# 80. Example: Repayment

```text
Outstanding debt: ₦100,000
Repayment: ₦30,000

→ Confirm successful payment
→ Allocate ₦30,000
→ Remaining debt: ₦70,000
→ Preserve original debt
→ Record repayment event
```

---

# 81. Example: One Repayment Across Two Debts

```text
Debt A: ₦60,000
Debt B: ₦50,000
Repayment: ₦80,000

Allocation:
A → ₦60,000
B → ₦20,000

Remaining:
A → ₦0
B → ₦30,000
```

Each debt remains independently traceable.

---

# 82. Example: Approved Return on Credit Sale

```text
Original credit sale: ₦100,000
Approved return: ₦20,000

Original sale remains ₦100,000
Approved return reduces resulting obligation
Customer debt is recalculated through the return event
```

The original sale/payment history is not overwritten.

---

# 83. Example: Debt Dispute

```text
Customer disputes ₦30,000 debt
→ Mark/investigate dispute
→ Review original sale
→ Review payments/repayments
→ Review returns/corrections
→ Management decision
→ Preserve investigation history
```

---

# 84. Example: Write-Off

```text
Outstanding: ₦25,000
→ Management authorizes write-off
→ Reason required
→ Write-off recorded
→ Debt remains historically visible
→ Customer no longer treated as owing the written-off amount
```

Exact accounting treatment remains outside C08.

---

# 85. Example: Wrong Customer

```text
Completed sale attached to Customer A
Actual customer should be Customer B

→ High-integrity correction
→ Management-controlled investigation
→ Preserve original association
→ Apply authorized corrective event/state
→ Customer-facing correction visibility as required
```

Do not simply overwrite Customer A with Customer B.

---

# 86. Example: Repayment Correction

```text
Repayment recorded incorrectly
→ Preserve original repayment
→ Investigate affected debts
→ Authorized correction
→ Update resulting debt state
→ Preserve complete history
```

---

# 87. Acceptance Criteria

C08 is successful when:

- customer search is fast and unambiguous;
- minimum credit customer information is respected;
- customer identity is explicitly confirmed for credit;
- credit statuses use the B03 model;
- credit limits are visible where appropriate;
- over-limit credit requires authorization;
- credit can combine with other payment methods;
- unpaid conversations do not become debt;
- each credit sale remains independently traceable;
- repayments remain separate successful payment events;
- repayments can be allocated across multiple debts;
- fully paid debts remain historically visible;
- no customer wallet is introduced in V1;
- returns can reduce obligations without rewriting original sales;
- disputed debts remain visible;
- write-offs require authorization and reasons;
- debt corrections preserve original state;
- customer identity is treated as high-integrity;
- staff cannot approve their own consequential correction;
- closed-day corrections are controlled;
- customer-facing correction visibility is distinct from internal audit detail;
- offline credit workflows do not bypass authorization;
- payment confirmation is not fabricated;
- sync conflicts cannot silently overwrite history;
- integrity issues escalate safely;
- monetary values use nearest-kobo precision;
- current balances remain traceable to source events;
- navigation never bypasses permissions.

---

# 88. Reconciliation With C00

C00 establishes:

- business truth over conversation state;
- deliberate handling of consequential actions;
- first-class offline/conflict states;
- auditability as a UX requirement.

C08 applies these principles to customer credit and debt.

---

# 89. Reconciliation With C01

C01 establishes Customers & Credit as a primary application area while keeping Money, Activity, and Management distinct.

C08 preserves those boundaries and provides contextual links to source records.

---

# 90. Reconciliation With C02

C02 established journeys for:

- credit sale;
- customer repayment;
- debt investigation;
- returns;
- corrections;
- offline credit;
- management review.

C08 turns those journeys into customer/credit UX.

---

# 91. Reconciliation With C03

C03 remains authoritative for visual tokens, components, accessibility, states, density, and responsive behavior.

C08 defines customer/credit-specific content and interaction needs.

---

# 92. Reconciliation With C04

C04 provides the application shell and navigation model.

C08 defines the experiences reached from Customers & Credit and contextual entry from POS.

---

# 93. Reconciliation With C06

C06 owns the active selling experience.

C08 owns the deeper customer and debt experience.

The POS should expose enough credit context to complete a safe sale without turning the POS into a debt-management screen.

---

# 94. Reconciliation With C07

C07 owns inventory and purchasing.

C08 may link customer transactions to relevant inventory/sales history but does not duplicate inventory management.

---

# 95. Reconciliation With B03

B03 remains authoritative for:

- credit authorization;
- customer statuses;
- credit limits;
- debt records;
- repayments;
- allocation;
- write-offs;
- disputes;
- offline debt operations;
- historical preservation.

C08 translates those rules into UX.

---

# 96. Reconciliation With B04

B04 remains authoritative for returns/refunds.

C08 only expresses the customer/debt consequences of approved returns and successful settlement events.

---

# 97. Reconciliation With B08

B08 remains authoritative for correction/exception behavior.

C08 applies it to:

- customer identity;
- credit sales;
- debt;
- repayments;
- payment information;
- returns;
- closed-day corrections;
- duplicate transactions;
- offline conflicts;
- integrity failures.

---

# 98. Reconciliation With B09

B09 remains authoritative for role permissions.

C08 uses role-aware controls and does not infer authorization from navigation.

---

# 99. Historical Question Reconciliation

| Earlier question | Earlier status | C08 treatment | Authority |
|---|---|---|---|
| Minimum customer credit record? | Resolved | Name + phone | B03 |
| Customer credit statuses? | Resolved | Allowed / Restricted / Blocked | B03 |
| Credit limit? | Resolved | Per customer | B03 |
| Over-limit credit? | Resolved | Authorized exception | B03 |
| Multiple credit sales? | Resolved | Independent traceable debts | B03 |
| Multiple repayments? | Resolved | Separate payment events | B03 |
| Repayment across debts? | Resolved | Supported | B03 |
| Customer wallet? | Resolved | Not V1 | B03 |
| Fully paid debt deletion? | Resolved | Never delete | B03 |
| Write-off? | Resolved | Authorized + reason | B03 |
| Disputed debt? | Resolved | Remains visible/investigated | B03 |
| Credit sale with partial payment? | Resolved | Supported | B03/D03 |
| Wrong customer? | Resolved | High-integrity management correction | B08 |
| Payment correction? | Resolved | Preserve trail | B08 |
| Partially repaid debt correction? | Resolved | Management investigation | B08 |
| Closed-day correction? | Resolved | Manager/Owner authorization | B08 |
| Offline credit? | Resolved | Core operations supported | B03/B08 |
| Offline conflict? | Resolved | No silent overwrite | B08 |
| Exact debt schema? | Deferred | Not invented | D03/D04 |
| Exact allocation algorithm? | Not fully specified | UX exposes allocation; business rule remains authoritative | B03 / later decision |
| Exact customer fields beyond name + phone? | Deferred | Not invented | B03/D04 |
| Exact customer privacy model? | Deferred | Permission-aware | B09/D-series |

---

# 100. Explicit Non-Decisions

C08 does not establish:

- database schema;
- accounting journal structure;
- debt calculation implementation;
- exact repayment allocation algorithm where B03 does not prescribe one;
- exact customer field catalogue;
- exact credit-limit enforcement algorithm;
- exact permission IDs;
- authentication;
- sync protocol;
- API contracts;
- final responsive breakpoints;
- final visual tokens;
- final customer-facing copy.

---

# 101. Design Principle Summary

The customer experience should feel like:

> **A clear record of the relationship between a customer, their purchases, and their actual obligations.**

Not:

> **A single editable customer balance.**

The current balance is a result of source events.

The source events remain the evidence.

---

# 102. Next Deliverable

## C09 — Returns, Corrections & Reconciliation UX

C09 will consolidate the highest-integrity exception workflows:

```text
Returns
→ Refund / settlement recording
→ Corrections
→ Void / invalidation handling
→ Duplicate detection
→ Merge
→ Cash reconciliation
→ Inventory discrepancy
→ Debt correction
→ Closed-day correction
→ Management review
→ Rejected corrections
→ Customer-facing correction visibility
→ Integrity escalation
```

It will remain aligned with B04, B05, B08, and B09 as the authoritative business-rule sources.

---

# FINAL RECONCILIATION — BUSINESS DECISIONS APPLIED

This document must express the finalized business decisions: configurable 15-minute-default correction window; ordinary vs high-integrity corrections; Owner visibility for consequential Manager self-corrections; logged/reviewable transfer confirmation; core plus configurable payment methods; tax-aware totals; supplier-return settlement states; operational business-day sessions that may cross midnight; shared or individual cash custody; weighted-average costing; visible negative-stock exceptions; and Cash in Hand / Expected Cash / Actual Cash terminology.
