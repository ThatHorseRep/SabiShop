# B04 — Returns & Refund Rules

## Status
**LOCKED — Business Rules**

## 1. Core Principle
A return is a separate, auditable business event linked to an original Sabi Shop sale. The original sale is never deleted or silently rewritten.

A return must have a **verifiable Sabi Shop purchase before management approval is considered**. If the purchase cannot be verified, it does not enter the normal return workflow.

Every verified return requires Owner/Manager approval.

## 2. Return Scope
- Partial returns are supported.
- The exact SKU(s) and quantity(ies) returned must be recorded.
- Every return requires a reason.
- “Other” requires a description.
- A missing physical receipt does not automatically prevent a return if the purchase can be verified from Sabi Shop records.
- A return that cannot be tied to a verified Sabi Shop purchase is not processed as a normal return.

## 3. Approval Flow
1. Return is requested.
2. Original purchase is verified.
3. Return details and reason are recorded.
4. Owner/Manager reviews.
5. Return is approved or rejected.
6. If approved, its inventory, debt, settlement, and incentive effects are recorded.

Rejected returns remain in history and do not alter inventory, debt, or settlement.

## 4. Returned Goods
V1 uses:
- **Sellable**
- **Non-sellable / Held**

Management records the condition when approving the return. Sellable returns may return to sellable inventory; non-sellable/held goods remain outside normal sellable stock.

Supplier returns, disposal, or other downstream treatment use separate workflows.

## 5. Refunds and Settlements
Sabi Shop does **not** collect, hold, execute, or control refund money and does not prescribe the refund method.

Sabi Shop records what the business/management states happened for recordkeeping and reconciliation.

A settlement may normally equal the value associated with the returned goods. Management may approve a lower amount only with an explicit reason.

A settlement greater than the return value is not a normal return outcome; additional money must be represented separately.

## 6. Exchanges
Exchanges are supported as a linked return plus a new sale/transaction.

- More expensive replacement: additional amount is part of the new sale/settlement.
- Cheaper replacement: difference may be settled with the customer, subject to management approval.
- The original sale and replacement transaction remain separately traceable.

No general customer wallet or permanent return-credit balance is created in V1.

## 7. Credit Sales
An approved return reduces the customer's outstanding obligation.

Original sales and historical payments remain unchanged.

Example:
- Sale: ₦100,000
- Paid: ₦40,000
- Debt: ₦60,000
- Returned value: ₦30,000
- Revised obligation: ₦70,000
- Remaining debt: ₦30,000

The original ₦40,000 payment remains a historical payment event.

For a fully paid sale, an approved return creates the resulting settlement/refund record without deleting the original payment.

## 8. Return Window
The business can configure a normal return window. Returns outside it require management-approved exception handling.

The original sale date/time and return request/approval date/time remain recorded.

## 9. Incentives
Approved returns automatically trigger recalculation of provisional salesperson incentives.

The original salesperson remains attributed to the original sale. The person handling the return does not replace that attribution.

If the original salesperson has left the business, historical attribution remains unchanged.

Treatment of already-released incentives is governed by the finalized incentive policy.

## 10. Cash Reconciliation
Sabi Shop records settlement/refund events but does not execute them.

Where management records that business/staff-held cash was used for a refund, the event must be available to cash reconciliation so it is not mistaken for an unexplained shortage.

Exact reconciliation formulas belong to the Cash & Reconciliation deliverable.

## 11. Corrections
Incorrect return records may be corrected using the same audit principles as other transaction corrections.

Corrections preserve:
- original state;
- corrected state;
- user;
- timestamp;
- reason where required;
- audit history.

A correction must not silently erase evidence that the original record existed.

## 12. Offline Operation
Core return recording and required approval rules must work offline.

When connectivity returns, the return, approval, inventory effects, debt effects, settlement records, incentive recalculation, and audit history synchronize without duplicate events.

## 13. Historical Integrity
A return never rewrites the original sale's historical facts.

The system preserves the original transaction, items, quantities, actual selling prices, payment records, return event, returned quantities, reason, approval/rejection, condition, inventory movement, debt adjustment, recorded settlement, incentive recalculation, users, timestamps, and audit history.

## 14. Cross-Deliverable Dependencies
- **Sales:** returns are linked events; original sales remain intact.
- **Pricing:** historical actual selling price is used; today's product price does not overwrite the original sale.
- **Inventory:** approved returns affect stock according to recorded condition.
- **Credit & Debt:** approved returns reduce the relevant obligation without deleting payment history.
- **Incentives:** approved returns trigger automatic recalculation.
- **Cash & Reconciliation:** recorded settlements are incorporated into reconciliation rules.

## 15. Deferred Technical/Policy Details
- Exact return-window UX/configuration
- Exact Owner vs Manager permission split
- Cash reconciliation formulas
- Treatment of already-released incentives after returns
- Detailed exchange UX
- Sync conflict handling
- Data model/schema
- Audit implementation
- Detailed financial/accounting treatment

## 16. Integrity Rules
1. Verify the purchase before approval.
2. Every verified return requires management approval.
3. Never delete the original sale.
4. Never invent an original sale.
5. Support partial returns.
6. Record a reason for every return.
7. Record returned-item condition.
8. Keep inventory effects traceable.
9. Keep debt effects traceable.
10. Keep settlement records separate from money actually handled by Sabi Shop.
11. Preserve historical payment records.
12. Recalculate provisional incentives automatically.
13. Preserve corrections and audit history.
14. Do not create a general customer wallet in V1.
15. Preserve the same rules offline.

## 17. Final State
**B04 is complete and locked as a V1 business-rules deliverable.**
