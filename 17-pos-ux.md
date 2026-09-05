# C06 — POS UX

**Product:** Sabi Shop  
**Document ID:** C06  
**Package:** C — User Experience Specification  
**Status:** RECONCILED — DESIGN BASELINE — POS UX  
**Version:** 1.0  
**Prepared:** 2026-09-04  
**Depends on:** C00 — UX & Design Foundation; C01 — Information Architecture; C02 — User Journeys & Task Flows; C03 — Sabi Shop Design System; C04 — Application Shell & Navigation; D03 — Sales & Transaction Rules; D04 — Pricing & Discount Rules; D05 — Salesperson Performance & Incentive Rules; B03 — Credit & Debt; B04 — Returns & Refund; B06 — Inventory Accounting; B07 — Transaction Lifecycle; B08 — Correction & Exception Policy; B09 — Roles & Permissions  
**Authoritative for:** POS information hierarchy, selling workflow UX, sale composition, payment interaction, completion feedback, correction entry points, and operational states  
**Does not replace:** business/domain rules or technical enforcement owned by B/D deliverables

---

# 1. Purpose

C06 defines the user experience for Sabi Shop's primary selling workflow.

The POS must make ordinary sales extremely fast while making consequential decisions explicit.

The governing UX principle from C00 is:

> **Fast for ordinary work. Deliberate for consequential work.**

Routine work such as product search, adding items, changing quantities before completion, recording successful payment, and looking up a customer should be fast and predictable. Consequential actions such as credit authorization, material payment corrections, inventory conflicts, attribution changes, and post-completion corrections require deliberate handling. fileciteturn30file9L1338-L1372

---

# 2. POS Objective

The POS exists to help an authorized salesperson complete a real sale correctly with minimal friction.

The ideal normal flow is:

```text
Start sale
  ↓
Find product
  ↓
Add product
  ↓
Set quantity
  ↓
Review prices
  ↓
Optional customer
  ↓
Choose payment
  ↓
Confirm successful payment
  ↓
Complete sale
  ↓
Receipt / completion
```

The interface must not force the salesperson through unnecessary management workflows during an ordinary sale.

---

# 3. Business Truth

The POS is not a conversation recorder.

A completed sale requires actual business activity and the required conditions for completion.

Therefore:

- browsing a product is not a sale;
- adding an item to an unfinished basket is not a completed sale;
- an abandoned basket is not a completed sale;
- an unconfirmed transfer is not a completed payment;
- a failed payment is not a successful payment event;
- a completed sale must not be presented before the required business conditions are satisfied.

This reflects D03's transaction rules.

---

# 4. POS Screen Model

The core POS workspace should expose four persistent conceptual areas:

```text
┌──────────────────────────────────────────────────────────┐
│ POS header / business context / connection state         │
├───────────────────────────────┬──────────────────────────┤
│ Product search / discovery    │ Current sale              │
│                               │                           │
│ Search                        │ Items                     │
│ Categories / recent products  │ Quantities                │
│ Product results               │ Prices                    │
│ Stock visibility              │ Discounts / overrides     │
│                               │ Customer                  │
│                               │                           │
│                               │ Totals                    │
│                               │ Payment                   │
│                               │                           │
│                               │ [Complete Sale]            │
└───────────────────────────────┴──────────────────────────┘
```

On smaller screens the same information hierarchy should become sequential without losing the active sale context.

---

# 5. POS Header

The POS header should communicate only information relevant to safe operation.

Recommended:

- current business;
- current user;
- online/offline state;
- sync state where relevant;
- sale/session context;
- exit/back control.

Avoid filling the POS header with dashboard metrics.

---

# 6. Active Sale Context

An active sale is work in progress.

The interface should make it obvious:

- a sale is open;
- which items are currently included;
- current total;
- current customer if selected;
- payment status;
- whether any approval is required;
- whether the sale is offline/pending synchronization.

Leaving the POS while an active sale exists should be deliberate.

The system should protect against accidental loss of work.

---

# 7. Product Search

Product search is one of the highest-frequency POS actions.

It should support fast discovery using available product identifiers such as:

- product name;
- SKU/code;
- other approved searchable attributes.

Search results should prioritize:

1. exact/high-confidence match;
2. useful product name;
3. current selling price;
4. stock status/availability;
5. identifying information.

Cost/margin should not be exposed to ordinary sales staff because the business context explicitly says cost/margin is not visible to sales staff. fileciteturn30file7L1015-L1023

---

# 8. Search Interaction

The search field should be immediately usable.

Expected behavior:

- keyboard focus when entering the POS where appropriate;
- rapid typing;
- fast result feedback;
- no unnecessary modal;
- keyboard-friendly selection on supported devices;
- touch-friendly results on mobile/tablet;
- clear no-result state.

Do not make product discovery depend on navigating through several pages.

---

# 9. Product Result

Each product result should provide enough information to safely choose the intended item.

Recommended:

```text
Product name
SKU / identifying code
Current selling price
Stock indication
```

Where product identity is ambiguous, the UI should provide more identifying information rather than guessing.

The POS must never silently select a similar product because it cannot find an exact match.

---

# 10. Stock Visibility

Stock should be visible during selling.

However, stock display and stock authorization are separate concerns.

A product may appear in the catalogue while its actual available quantity requires investigation.

The POS must not silently invent inventory to complete a sale.

B08 establishes that negative stock should not be treated as normal; it is an integrity/operational exception that must be flagged and reconciled.

---

# 11. Adding a Product

Adding a product should be a low-friction action.

After selection:

```text
Product → Sale line
```

The interface should immediately show:

- product;
- quantity;
- line price;
- line total.

If the same product is added again, the UI should follow the configured line/quantity behavior rather than silently creating confusing duplicates.

---

# 12. Quantity

Quantity should be easy to change before sale completion.

Routine quantity changes should not require management approval.

However, the system must validate the resulting business effect.

If the requested quantity creates an inventory conflict, the POS must surface that conflict rather than silently allowing impossible stock.

---

# 13. Quantity and Inventory Conflict

If the salesperson attempts to sell more stock than is legitimately available:

```text
Do not silently create negative stock.
Do not silently invent stock.
Do not silently rewrite inventory history.
```

Instead:

1. identify the conflict;
2. explain the issue;
3. prevent or escalate the sale according to the authoritative inventory rule;
4. direct the user toward the appropriate management/inventory resolution.

This reflects B06/B08: negative stock may be operationally permitted, but it is an explicit exception state that must remain visible and require investigation.

---

# 14. Multiple Quantities and Line Pricing

D03/D04 allow multiple quantities of the same product to have different line prices.

Therefore the POS should not assume:

```text
same SKU = one immutable price for every unit
```

Where the workflow requires separate line pricing, the interface must preserve the distinction.

Example:

```text
Pump — Qty 2 — ₦50,000 each
Pump — Qty 1 — ₦45,000
```

should remain representable if permitted by the configured business rules.

---

# 15. Current Selling Price

The current/default selling price should be readily visible.

The POS should distinguish:

- current/default price;
- entered/actual line price;
- floor price where the user is authorized to see it;
- approved discount/override where applicable.

Ordinary sales staff should not be shown internal cost/margin.

---

# 16. Floor Price

The floor is a pricing control.

The POS must support:

```text
At floor → allowed
Above floor → allowed
Below current price but above floor → allowed
Below floor → controlled exception
```

D04 defines below-floor sales as configurable:

- block until authorized; or
- allow and flag for management review.

The POS must express whichever configuration is active.

---

# 17. Below-Floor Sale

A below-floor price must never look like an ordinary unremarkable price entry.

The UI should:

1. detect the exception;
2. show the consequence;
3. identify that authorization/review is required;
4. require the applicable authority;
5. record the reason where required;
6. preserve the event for later review.

The exact authorization mechanism belongs to B09 and later technical implementation.

---

# 18. Sale Above Current Price

Selling above the current/default price is allowed.

The POS should not block it merely because the entered price differs from the current price.

However, the design should avoid encouraging overcharging.

Where incentive calculations depend on price above floor, the UI should not turn incentive value into a prompt to maximize price.

---

# 19. Zero / Free Sale

A ₦0/free sale is supported only with Owner/Manager approval.

The POS should make this a clearly consequential action.

It must record:

- fact of free sale;
- approver;
- time;
- reason.

Staff cannot independently complete a free sale.

---

# 20. Price Editing

Before completion, authorized users may change a line price according to the configured pricing rules.

The UI should make it obvious when the entered value differs materially from the normal price.

Avoid hiding an override inside an obscure secondary menu.

The exact approval interaction is governed by B09.

---

# 21. Discount UX

Discounts should be presented as a business action, not merely a decorative field.

The POS should communicate:

- what is being reduced;
- which line(s) are affected;
- resulting total;
- whether authorization is required.

The system must not automatically distribute a basket-level reduction equally when that would conflict with the configured profitability-aware allocation model.

---

# 22. Customer Selection

Customer selection should be optional for ordinary cash/transfer/card sales unless another business rule requires it.

For credit sales, the customer is required.

Customer lookup should be fast and contextual.

Recommended actions:

```text
Search customer
Select existing customer
Create eligible credit customer record where permitted
```

Do not turn this into a general CRM workflow.

---

# 23. Customer Identity Protection

Customer identity is a high-integrity field.

Before completion, the salesperson should have a clear opportunity to confirm the selected customer.

After completion, changing customer identity must not behave like ordinary editing.

C02 and B08 establish that customer identity corrections are consequential and require management handling.

The POS should therefore emphasize confirmation before completion.

---

# 24. Credit Sale Entry

Credit should be presented as a payment option with explicit consequences.

Conceptual flow:

```text
Payment
  ↓
Credit
  ↓
Select / confirm customer
  ↓
Check credit eligibility
  ↓
Authorization if required
  ↓
Confirm credit amount
  ↓
Complete sale
```

The POS should never silently convert an unpaid sale into customer debt.

---

# 25. Credit Authorization

Customer credit requires Owner/Manager authorization.

If authorization is required:

```text
Credit requested
      ↓
Authorization required
      ↓
Authorized
      ↓
Continue
```

If authorization is unavailable, the system should not pretend that credit has been approved.

B03 permits verbal authorization when management is absent, with later review; the exact UI mechanism should reflect the configured workflow.

---

# 26. Credit Limit

The POS should show enough information to support a responsible decision.

Where applicable:

- customer credit status;
- current outstanding amount;
- credit limit;
- resulting outstanding amount;
- over-limit condition;
- required authorization.

Do not expose unnecessary internal debt detail to users who do not have permission to see it.

---

# 27. Split Payment

Split payment is supported.

The POS should make the relationship between:

```text
Sale total
Paid amount
Payment methods
Credit amount
Remaining amount
```

unambiguous.

Example:

```text
Total                     ₦100,000
Cash                       ₦30,000
Transfer                   ₦50,000
Credit                     ₦20,000
──────────────────────────────────
Settled                   ₦100,000
```

The sale should not be completed until the required payment state is satisfied and the business rules allow completion.

---

# 28. Payment Methods

The POS should support configured payment methods including:

- cash;
- bank transfer;
- POS/card;
- approved credit.

The exact payment-method catalogue is a configuration/domain decision, not a reason to hard-code UI assumptions.

---

# 29. Successful Payment Only

The POS must distinguish:

> payment attempted

from:

> payment successfully confirmed.

Only successful payment events should be treated as successful business activity.

An unconfirmed transfer must not produce a completed paid sale.

A failed or reversed attempt must not be represented as a successful payment transaction.

This follows D03 and the established B08 correction philosophy.

---

# 30. Transfer Confirmation

For bank transfer:

```text
Transfer initiated
≠
Transfer confirmed
```

The interface should provide an explicit confirmation step.

The salesperson must be able to tell whether the payment is:

- not confirmed;
- confirmed;
- awaiting management handling where applicable.

Do not show “Paid” merely because the salesperson says the customer transferred money.

---

# 31. Payment Amount

The POS should clearly display:

```text
Amount due
Amount entered
Remaining
Change where applicable
```

Payment amount corrections after completion are consequential.

B08 requires management authorization for material payment-amount corrections.

---

# 32. Payment Review

Before completion, provide a compact review:

```text
Items
Subtotal
Discount / adjustment
Total

Payment
Cash
Transfer
POS/Card
Credit

Amount settled
Amount remaining
```

The salesperson should be able to verify the transaction without leaving the sale.

---

# 33. Complete Sale Action

The primary action should be:

> **Complete Sale**

It must not say merely:

> Save

The action represents an actual business commitment.

The final action should be visually dominant but should not be unnecessarily obstructive for ordinary sales.

---

# 34. Completion Preconditions

Before completion, the system should verify applicable conditions:

- valid product lines;
- valid quantities;
- valid prices;
- required customer information;
- required credit authorization;
- required payment confirmation;
- required permissions;
- no unresolved blocking stock condition;
- applicable offline constraints.

The interface should explain the first blocking issue clearly.

---

# 35. Completion Feedback

After successful completion, the POS should provide immediate confirmation.

Recommended:

```text
Sale completed

Receipt / sale reference
Total
Payment summary
Customer where applicable

[View Receipt]
[New Sale]
```

The user should not have to wonder whether the sale was actually recorded.

---

# 36. Receipt

Receipt generation/display should communicate:

- sale identity;
- date/time;
- products;
- quantities;
- actual historical prices;
- total;
- payment information;
- customer information where appropriate;
- salesperson attribution where appropriate;
- relevant correction/authorization status if applicable.

The exact receipt numbering format belongs to technical/data-model work.

---

# 37. Historical Price Integrity

The POS must not rewrite completed historical prices merely because current prices change.

A receipt represents the completed transaction as accepted at that time.

Current product pricing belongs to the product/pricing context.

Historical sale pricing belongs to the sale.

---

# 38. Salesperson Attribution

The system should automatically associate the sale with the authenticated salesperson/user where applicable.

The POS should not make attribution a casual dropdown.

If an assisted-sale model is later enabled, it must be explicit and governed by B09.

Changing attribution after completion is consequential.

---

# 39. Incentive Visibility

If incentives are shown to the salesperson, the presentation must not encourage overcharging.

The POS may show:

- incentive status;
- provisional amount where approved for visibility;
- relevant qualification state.

It should not turn incentive value into a game that encourages unsafe pricing.

D05 explicitly requires customer-trust protection and avoidance of incentives that encourage overcharging.

---

# 40. Offline POS

Offline selling is a supported operating condition.

The POS should continue supported core workflows when offline.

The user must know:

```text
Offline
```

without interpreting it as:

```text
System failure
```

C00 explicitly establishes offline as a first-class state. fileciteturn30file9L1255-L1257

---

# 41. Offline Sale Feedback

When an offline sale is successfully recorded locally:

```text
Sale recorded
Sync pending
```

This is preferable to pretending that the sale has already synchronized.

The interface should distinguish:

- recorded locally;
- synchronized;
- conflict requiring resolution;
- failed synchronization.

---

# 42. Offline Authorization

Offline permissions must not bypass B09.

If an authorized manager is locally available, applicable approval may proceed according to the offline authorization rules.

If the workflow permits later management review, the UI must clearly mark the action as requiring review.

Offline must never become a back door around authorization.

---

# 43. Offline Credit Sale

An offline credit sale may proceed only where the configured business rules and available authorization permit it.

The POS should show:

```text
Credit sale
Recorded offline
Management review / sync status
```

where applicable.

The system must not imply that an offline credit sale was synchronized or remotely verified when it was not.

---

# 44. Sync Conflict

If an offline sale conflicts with synchronized business state:

```text
Do not silently overwrite.
Do not silently discard.
Do not automatically choose one history.
```

The user should be directed into the conflict-resolution workflow.

C00 establishes that sync conflicts are first-class states and must be deliberately resolved. fileciteturn30file9L1224-L1251

---

# 45. POS Error States

Important error states include:

- product not found;
- product ambiguous;
- insufficient/invalid stock state;
- invalid price;
- below-floor exception;
- customer not eligible for credit;
- credit authorization required;
- payment not confirmed;
- payment failure;
- incomplete payment;
- permission denied;
- offline restriction;
- synchronization failure;
- conflict requiring resolution;
- integrity issue.

Errors must explain what the salesperson can do next.

---

# 46. Empty POS State

A new sale should have a useful empty state.

Recommended conceptual message:

> **Start a sale**  
> Search for a product to add it to the basket.

The empty state should immediately focus attention on product search.

---

# 47. Abandoning a Sale

An unfinished sale is not a completed business transaction.

If the salesperson exits with items in the basket, the interface should protect against accidental loss where appropriate.

Possible actions:

```text
Continue sale
Save draft locally if supported
Discard basket
```

Any persisted draft must remain clearly distinct from a completed sale.

The exact persistence model is a later technical decision.

---

# 48. Double Submission

The completion action must prevent accidental double submission.

After the user commits:

```text
Complete Sale
      ↓
Processing
      ↓
Completed
```

The button must not allow repeated commitment that could create duplicate sales.

Idempotency/duplicate handling belongs to technical specifications, but the UX must provide immediate feedback.

---

# 49. Duplicate Transaction

If a duplicate is detected:

- do not silently delete one transaction;
- do not hide the duplicate;
- provide management resolution;
- preserve both histories.

B08 permits management-controlled outcomes including voiding a duplicate, marking/reversing its effects where applicable, or merging depending on the situation.

A merge must preserve both original records and histories.

---

# 50. Correction Entry Point

The normal POS should not encourage editing completed sales.

After completion, the user should have access to an explicit:

> **Correct sale**

or equivalent management-controlled action where permitted.

The visual treatment must communicate that this is not deletion.

C00 explicitly requires correction UX not to resemble destructive deletion. fileciteturn30file9L1376-L1408

---

# 51. Correction Window

The correction window begins at sale completion.

The exact duration is management-defined.

After the configured window, the available action may change according to correction type:

- blocked completely;
- Manager/Owner controlled correction;
- staff request for management approval;
- material correction through a separate corrective event.

The POS must not expose one universal “edit anything” action.

---

# 52. Staff Correcting Their Own Sale

A staff member should not independently approve their own consequential correction.

The UI should route the request to the appropriate authorized person.

This reflects B08 and B09's separation-of-duty principles.

---

# 53. High-Integrity Fields

The following should receive elevated UX treatment after completion:

- customer identity;
- product/SKU;
- salesperson attribution;
- payment amount;
- payment method;
- quantity;
- inventory effect;
- credit/debt effect.

These should not be presented as casual editable fields.

---

# 54. Wrong SKU / Product

If the wrong product was recorded:

```text
Do not silently replace it.
```

The UI should trigger a controlled correction/investigation workflow.

The product attribution can materially affect:

- inventory;
- price;
- profit;
- incentives;
- customer record;
- reporting.

The interface should communicate those consequences.

---

# 55. Wrong Customer

Customer identity is similarly high integrity.

A post-completion customer change should require management-controlled handling.

The interface should preserve:

- original customer;
- corrected customer;
- who made the correction;
- when;
- reason;
- applicable authorization.

The customer-facing history should show that a correction occurred without exposing internal audit details unnecessarily.

---

# 56. Wrong Quantity

Wrong quantity may be handled as:

- ordinary edit during the correction window where permitted;
- controlled adjustment;
- management-controlled correction after the window.

If inventory has already moved, the correction must account for the resulting inventory effect and costing.

B06 weighted-average costing remains authoritative for inventory accounting.

---

# 57. Wrong Price

Wrong price may be handled as:

- ordinary edit during the correction window where permitted;
- controlled adjustment after the window.

The correction must preserve the original historical state.

Revenue/profit should not be silently rewritten as if the original sale never happened.

---

# 58. Payment Correction

Payment corrections are high consequence.

The UI should expose:

- original payment state;
- proposed corrected state;
- difference;
- resulting business effect;
- authorization requirement;
- reason.

B08 requires management authorization for payment amount correction.

---

# 59. Credit Correction

A credit-sale correction must preserve the relationship between:

```text
Original sale
Customer obligation
Payments/repayments
Correction
```

If debt has already been partially repaid, the correction requires management investigation.

The UI should not simply overwrite the debt balance.

---

# 60. Return from POS

A completed sale may later have a return.

The original sale remains.

The POS may provide a contextual path:

```text
Sale
→ Return item(s)
```

but the return itself is a separate approved business event.

B04 requires Manager/Owner approval for returns.

---

# 61. Fully Returned / Partially Returned

The sale detail may display derived presentation states:

```text
Completed — Partially Returned
Completed — Fully Returned
```

These are presentation states.

They do not replace or delete the original sale.

C00 establishes this presentation principle. fileciteturn30file9L1396-L1408

---

# 62. Refund

The POS may record a refund/settlement only when the relevant successful settlement/payment event actually occurred.

A failed or unconfirmed refund attempt must not be presented as a successful refund business transaction.

Sabi Shop records the settlement; it does not execute or control the external money movement.

---

# 63. POS and Returns

Return processing should not interrupt ordinary selling unless the user deliberately enters the return workflow.

The POS remains optimized for new sales.

Returns, corrections, reconciliation, and investigations belong to deliberate workflows.

---

# 64. Permission UX

Permission states should be clear without exposing unnecessary internal authorization architecture.

Examples:

```text
You can complete this sale.
```

versus:

```text
Manager approval required.
```

versus:

```text
You can request this correction.
```

versus:

```text
You do not have permission to perform this action.
```

The UI should distinguish:

- not allowed;
- approval required;
- request submitted;
- approved;
- rejected.

---

# 65. Management Approval

When approval is required, the POS should show:

- action requiring approval;
- relevant business consequence;
- amount/value where appropriate;
- reason;
- approver;
- approval state.

Avoid forcing the salesperson to navigate through a generic management settings page.

Approval should be contextual.

---

# 66. Rejected Approval

A rejected action must not appear completed.

The user should see:

```text
Request rejected
Sale remains unchanged
```

where applicable.

The rejection should remain visible in the relevant history without pretending the requested change happened.

---

# 67. Integrity Issue

If tampering or integrity failure is suspected:

```text
Stop the affected consequential action.
Do not overwrite history.
Escalate to higher authority.
```

The POS should not provide a “fix anyway” shortcut.

Owner override/resolve authority is governed by B08/B09 and technical integrity controls.

---

# 68. Activity Link

After completion, the user should be able to open the sale's activity/history.

This should show relevant business history without turning the POS into a full audit console.

For ordinary staff, only permitted information should be shown.

Management users may access deeper investigation views according to B09.

---

# 69. POS Performance

The POS should optimize for frequent actions:

- search;
- add;
- quantity;
- payment;
- completion.

Avoid unnecessary:

- full-page transitions;
- confirmation dialogs for harmless actions;
- repeated identity prompts;
- hidden save buttons;
- decorative animations that delay action.

---

# 70. Keyboard and Touch

Desktop POS should support efficient keyboard interaction where practical.

Touch targets should remain sufficiently large for:

- tablet;
- touch-enabled desktop;
- mobile.

The same business rules must apply regardless of input method.

---

# 71. Mobile POS

Mobile POS should preserve the same conceptual hierarchy:

```text
Search
→ Basket
→ Customer
→ Payment
→ Complete
```

The active sale should remain visible/contextually recoverable.

The mobile design must not turn a simple sale into a multi-screen maze.

---

# 72. Responsive Behavior

Desktop:

```text
Product discovery + basket visible together
```

Tablet:

```text
Product discovery and basket remain easily switchable
```

Mobile:

```text
Focused task view
with persistent total / sale state
and fast access to basket/payment
```

Exact breakpoints remain a C03/implementation decision.

---

# 73. Visual Hierarchy

The most important information during a sale is:

1. selected products;
2. quantities;
3. actual prices;
4. total;
5. payment state;
6. completion action.

Secondary information should not visually overpower these.

---

# 74. Financial Presentation

Amounts should be highly legible.

Use consistent:

- currency symbol;
- thousand separators;
- decimal precision;
- alignment;
- positive/negative semantics.

B06 establishes monetary precision to the nearest kobo for accounting.

The POS should not hide meaningful monetary differences through poor formatting.

---

# 75. No Cost Visibility for Staff

The POS must not reveal inventory acquisition cost or internal margin to ordinary sales staff unless a later permission decision explicitly authorizes it.

This is an existing business requirement and must remain reflected in the UX.

---

# 76. Sale Summary

The sale summary should make it possible to answer:

> What am I about to record?

before commitment.

At minimum:

```text
Items
Quantities
Actual prices
Discount/adjustment
Total
Customer if applicable
Payment method(s)
Credit amount if applicable
```

---

# 77. Consequence Preview

For consequential actions, show consequences before commitment.

Examples:

### Credit

> Customer balance will increase by ₦X.

### Below-floor price

> This price is below the configured floor and requires authorization/review.

### Free sale

> This sale is ₦0 and requires Manager/Owner approval.

### Material correction

> This will create a correction and update the current business state while preserving the original history.

The exact copy should be finalized later.

---

# 78. State Inventory

The POS must account for:

```text
Empty
Searching
Results
Selected
Editing
Payment pending
Authorization required
Authorization approved
Authorization rejected
Processing
Completed
Offline
Sync pending
Sync conflict
Permission denied
Error
Integrity issue
Correction required
```

Not every screen needs every state, but every applicable consequential state must be designed.

---

# 79. POS Cross-Domain Context

The POS should provide contextual access to:

```text
Product
Customer
Payment
Credit
Sale history
Return
Correction
```

C02 specifically established contextual access to Products, Customers, and Money to reduce navigation during selling.

---

# 80. Do Not Turn POS Into Dashboard

Do not place:

- revenue charts;
- staff rankings;
- supplier balances;
- inventory reports;
- management alerts

inside the normal selling workspace unless directly relevant to the current sale.

Those belong in the appropriate application areas.

The POS is for selling.

---

# 81. Do Not Turn POS Into CRM

Customer lookup should remain focused on completing the sale.

Customer management belongs to Customers & Credit.

The POS should link to the customer context without duplicating the entire customer-management experience.

---

# 82. Do Not Turn POS Into Inventory Management

Stock information should support safe selling.

Receiving, counting, adjusting, costing, and inventory investigation belong to Products & Inventory.

The POS should route users to those workflows when a stock problem requires management handling.

---

# 83. Normal Sale Journey

The canonical journey is:

```text
1. Enter Sell
2. Search product
3. Select product
4. Confirm quantity
5. Confirm line price
6. Repeat as needed
7. Select customer if needed
8. Review total
9. Choose payment method
10. Confirm successful payment
11. Complete sale
12. Show receipt
13. Return to ready state
```

This should be the fastest and most polished path in the product.

---

# 84. Normal Cash Sale

Canonical example:

```text
Product selected
→ Qty 2
→ Price confirmed
→ Total ₦X
→ Cash received
→ Cash confirmed
→ Complete Sale
→ Receipt
```

No management workflow should appear if no exception is present.

---

# 85. Normal Transfer Sale

```text
Product selected
→ Total
→ Transfer selected
→ Transfer confirmed
→ Complete Sale
→ Receipt
```

The UI must distinguish confirmation from initiation.

---

# 86. Normal Credit Sale

```text
Products
→ Customer
→ Credit selected
→ Eligibility checked
→ Authorization
→ Credit amount confirmed
→ Complete Sale
→ Receipt
```

No completed credit sale before the required authorization.

---

# 87. Split Payment Journey

```text
Products
→ Total
→ Cash amount
→ Transfer amount
→ Credit amount if applicable
→ Verify sum
→ Complete Sale
```

The sum of payment allocations must reconcile with the required sale settlement state.

---

# 88. Below-Floor Journey

```text
Enter price
→ Floor exception detected
→ Explain
→ Authorization/review
→ Approved
→ Complete
```

or:

```text
Enter price
→ Floor exception detected
→ Block
→ Sale cannot complete
```

depending on configuration.

---

# 89. Free Sale Journey

```text
Set ₦0
→ Explain free sale
→ Manager/Owner approval
→ Reason
→ Complete
```

Staff cannot independently bypass the approval.

---

# 90. Payment Failure Journey

```text
Payment attempted
→ Not confirmed
→ Sale remains incomplete
→ Retry / choose another valid payment
```

Do not create a successful sale from the failed attempt.

---

# 91. Stock Conflict Journey

```text
Add quantity
→ Conflict detected
→ Explain stock issue
→ Stop/escalate
→ Management resolves
```

Do not automatically create negative stock.

---

# 92. Offline Journey

```text
Offline
→ Supported sale
→ Record locally
→ Confirm sale recorded
→ Sync pending
→ Synchronize later
```

The user should remain productive without being misled about synchronization.

---

# 93. Sync Conflict Journey

```text
Offline sale
→ Sync
→ Conflict detected
→ Preserve records
→ Open resolution
→ Authorized decision
→ Record resolution
```

No silent overwrite.

---

# 94. Correction Journey

```text
Completed sale
→ Open sale history
→ Correct sale
→ Identify correction type
→ Show original state
→ Show proposed state
→ Determine authorization
→ Approve
→ Apply correction
→ Preserve history
→ Generate corrected presentation/receipt where applicable
```

---

# 95. POS Acceptance Criteria

C06 is successful when:

- a normal sale is fast;
- product search is immediate;
- product identity is clear;
- quantities are easy to change;
- current prices are visible;
- staff do not see cost/margin without permission;
- floor behavior is explicit;
- below-floor sales cannot bypass configured controls;
- free sales require management approval;
- customer credit cannot bypass authorization;
- payment confirmation is distinct from payment attempt;
- split payments are understandable;
- incomplete payment cannot appear completed;
- successful completion is obvious;
- receipts preserve historical transaction facts;
- offline sales remain understandable;
- sync status is visible;
- conflicts cannot silently overwrite history;
- completed transactions are not treated as deletable;
- correction UX does not resemble deletion;
- high-integrity fields receive elevated treatment;
- staff cannot approve their own consequential corrections;
- inventory conflicts are surfaced rather than silently converted into negative stock;
- return and correction workflows remain distinct from ordinary selling;
- POS remains focused on selling rather than becoming a dashboard;
- responsive behavior preserves the same business truth;
- all important operational states are designed.

---

# 96. Reconciliation With C00

C00 established:

- fast routine work;
- deliberate consequential work;
- preservation of business truth;
- first-class offline/conflict states;
- permission-aware UX;
- correction that does not resemble deletion.

C06 applies those principles directly to the POS.

The POS must therefore optimize speed without simplifying away important business controls. fileciteturn30file9L1340-L1372

---

# 97. Reconciliation With C01

C01 established:

```text
Sell
Products & Inventory
Customers & Credit
Money
Activity
Management
```

C06 keeps the POS focused on **Sell** while providing contextual links to the other areas.

It does not duplicate those domains.

---

# 98. Reconciliation With C02

C02 established normal sale as the highest-priority journey and emphasized:

- contextual access;
- deliberate authorization;
- consequence visibility;
- offline continuity;
- deliberate conflict resolution.

C06 turns those journey principles into the concrete POS interaction model.

---

# 99. Reconciliation With C03

C03 owns the visual system.

C06 defines:

- what information needs emphasis;
- which controls exist;
- which states are consequential;
- how financial information is prioritized.

C06 must use C03 rather than inventing an independent visual language.

---

# 100. Reconciliation With C04

C04 establishes the application shell and keeps Sell immediately accessible.

C06 defines the actual Sell workspace inside that shell.

The POS must preserve:

- business context;
- user context;
- offline state;
- active-sale context;
- navigation safety.

---

# 101. Reconciliation With D03

D03 remains authoritative for:

- sale completion;
- actual business activity;
- successful payment;
- historical prices;
- salesperson attribution;
- split payments;
- credit;
- offline sales;
- editing/correction principles.

C06 provides the UX expression.

---

# 102. Reconciliation With D04

D04 remains authoritative for:

- current/default price;
- floor;
- above-floor selling;
- below-floor exception;
- free/₦0 sales;
- price history.

C06 provides the interaction and visual treatment.

---

# 103. Reconciliation With B03

B03 remains authoritative for:

- customer credit;
- credit status;
- credit limits;
- authorization;
- repayment/debt behavior.

C06 provides the POS entry path.

---

# 104. Reconciliation With B04

B04 remains authoritative for:

- returns;
- approval;
- settlement;
- original-sale preservation.

C06 provides contextual access without turning returns into ordinary sale editing.

---

# 105. Reconciliation With B06

B06 remains authoritative for:

- weighted-average costing;
- acquisition cost;
- inventory movement;
- cost explainability;
- monetary precision.

C06 must account for inventory consequences without implementing accounting logic in the UI.

---

# 106. Reconciliation With B08

B08 remains authoritative for corrections/exceptions.

Important implications for C06:

- negative stock is not normal;
- customer/SKU/payment/attribution corrections are consequential;
- every correction requires a reason;
- correction history is preserved;
- rejected corrections do not change the current transaction;
- duplicate handling preserves both histories;
- offline conflicts cannot silently overwrite;
- suspected integrity issues escalate.

C06 expresses these rules without changing them.

---

# 107. Reconciliation With B09

B09 remains authoritative for permissions.

C06 must not hard-code a role's authority merely because a particular button is visible.

The POS must use permission state to determine:

- who can approve;
- who can correct;
- who can complete exceptional sales;
- who can view sensitive information;
- who can resolve conflicts.

---

# 108. Historical Question Reconciliation

| Earlier question | Earlier status | C06 treatment | Authority |
|---|---|---|---|
| POS priority | Open | Normal sale is highest priority | C02/C06 |
| Product search behavior | Open | Fast contextual search | C06 |
| Cost visibility | Established | Hidden from staff | B01/C06 |
| Negative stock | Previously conflicting | Flag/reconcile; not normal | B08 |
| Below-floor sale | Established | Explicit controlled exception | D04 |
| Free sale | Established | Owner/Manager approval | D04 |
| Credit sale | Established | Explicit authorization | B03 |
| Payment confirmation | Established | Successful payment only | D03 |
| Split payment | Established | Explicit allocation | D03 |
| Offline sale | Established | Supported with sync state | D03/D07 |
| Correction | Established | Deliberate post-sale workflow | B08 |
| Wrong customer | Established | High-integrity correction | B08 |
| Wrong SKU | Established | High-integrity correction | B08 |
| Duplicate sale | Established | Preserve histories; management resolution | B08 |
| Receipt after correction | Established | Original + corrected presentation | B08 |
| Exact receipt numbering | Deferred | Not invented | D-series |
| Exact correction window | Deferred | Begins at completion; duration remains management-defined | B08 |
| Exact approval mechanics | Deferred | Permission-aware placeholder | B09/D-series |

Historical open labels must not be treated as unresolved where later deliverables have already resolved them.

---

# 109. Explicit Non-Decisions

C06 does not establish:

- exact database structure;
- exact API behavior;
- exact offline synchronization algorithm;
- exact receipt numbering;
- exact authentication mechanism;
- exact Manager self-approval rule;
- exact correction-window duration;
- incentive value/volume gates are resolved; only release-state presentation remains to be designed;
- exact final visual token values;
- exact responsive breakpoints.

Those remain with their authoritative deliverables.

---

# 110. Next Deliverable

## C07 — Inventory & Purchasing UX

C07 will design:

```text
Products
→ stock visibility
→ product detail
→ receiving
→ supplier purchase
→ supplier credit
→ supplier payments
→ stock counts
→ discrepancy investigation
→ inventory history
→ costing visibility by role
→ offline receiving/count workflows
```

It will preserve the same principle:

> **Fast for ordinary work. Deliberate for consequential work.**

---

# FINAL RECONCILIATION — BUSINESS DECISIONS APPLIED

This document must express the finalized business decisions: configurable 15-minute-default correction window; ordinary vs high-integrity corrections; Owner visibility for consequential Manager self-corrections; logged/reviewable transfer confirmation; core plus configurable payment methods; tax-aware totals; supplier-return settlement states; operational business-day sessions that may cross midnight; shared or individual cash custody; weighted-average costing; visible negative-stock exceptions; and Cash in Hand / Expected Cash / Actual Cash terminology.
