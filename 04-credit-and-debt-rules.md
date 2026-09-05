# B03 — Credit & Debt Rules

**Product:** Sabi Shop  
**Status:** LOCKED — Business Rules

## 1. Purpose

Sabi Shop tracks two primary debt relationships:

1. **Customer debt / receivable:** money a customer owes the business.
2. **Supplier debt / payable:** money the business owes a supplier.

Debt remains distinct from cash, revenue, profit, inventory, expenses, owner funding, and owner withdrawals.

> **Sabi Shop records confirmed information entered by the business. It does not invent or assume events that happened outside the system.**

## 2. Customer Credit

Customers may buy goods on credit.

Credit sales require Owner/Manager authorization. Where the established workflow permits verbal authorization when management is absent, the sale may be recorded and flagged for later management review.

A customer may be marked:

- **Credit Allowed**
- **Credit Restricted**
- **Credit Blocked**

Being credit-eligible does not automatically authorize every credit sale.

## 3. Customer Credit Limits

Management may configure a credit limit per customer.

A limit is a management control, not an accounting fact.

A credit sale above the configured limit requires a management-authorized exception.

## 4. Customer Information

Minimum customer identification for a credit record:

- Name
- Phone number

The business may additionally require address, photograph where permitted, or other identifying information.

## 5. Multiple Credit Sales

A customer may have multiple outstanding credit sales.

Each sale remains an independent transaction, while the customer record may show an aggregate outstanding amount.

The aggregate must always be traceable to the underlying sales.

## 6. Customer Repayments

A repayment is a separate successful payment event against existing customer debt.

Each repayment records, as applicable:

- customer;
- amount;
- payment method;
- date/time;
- person recording it;
- reference information;
- debt allocation;
- resulting outstanding balance.

A repayment is not a sale.

Multiple repayments are supported.

## 7. Repayment Allocation

Where a customer has multiple outstanding debts, management can determine which debt or debts a repayment applies to.

One repayment may be allocated across multiple sales.

The allocation remains traceable.

## 8. No Customer Credit Balances

V1 does **not** maintain a general customer credit balance, wallet, or stored-money balance.

If recorded figures do not reconcile, management investigates the discrepancy rather than Sabi Shop inventing a new balance type.

## 9. Payment Confirmation

Only successful/confirmed payments are recorded as successful payments.

For transfers and similar methods:

> **Unconfirmed payment = no successful payment recorded.**

A customer statement that they have transferred money is not itself a successful payment record.

## 10. Staff and Repayments

Staff may physically receive customer repayment money as part of shop operations, subject to permissions.

The successful repayment must be recorded, and later management reconciliation compares recorded money with actual money handed over.

## 11. Split Repayments

Debt may be repaid using multiple payment methods, such as cash, transfer, and POS/card.

Each successful component is recorded and linked to the relevant debt.

## 12. Fully Paid Debt

When outstanding debt reaches zero, it becomes:

> **Paid / Cleared**

The original sale and all repayment history remain available.

Proof of clearance may be produced where required.

Cleared debt is never deleted.

## 13. Debt Write-Offs

Management may forgive part or all of a customer debt.

A write-off is an explicit authorized adjustment, not a payment.

It records:

- amount;
- affected debt;
- authorization;
- date/time;
- reason;
- responsible person;
- audit history.

The original debt remains visible.

## 14. Customer Debt Disputes

A disputed debt is not automatically deleted, cancelled, or reduced.

The debt remains visible while management investigates.

Sabi Shop should preserve enough evidence to establish what the system says happened, who recorded it, and what happened to the obligation afterward.

Relevant evidence includes, as applicable:

- customer identity;
- original sale;
- transaction/reference number;
- items and quantities;
- actual selling prices;
- date/time;
- salesperson;
- credit authorization;
- payment and repayment records;
- outstanding balance;
- returns;
- adjustments;
- edits/corrections;
- users and timestamps;
- audit history.

Possible investigation outcomes include:

- debt confirmed;
- transaction corrected;
- repayment found/confirmed;
- return applied;
- partial/full write-off approved;
- another documented resolution.

A dispute does not automatically imply fraud, theft, or dishonesty.

## 15. Customer Debt Due Dates

Due dates are optional.

Where a due date exists, the system may identify a debt as due or overdue.

A credit sale without a due date remains outstanding without an artificial deadline.

## 16. Customer Credit History

Management can review a customer's credit history, including:

- credit purchases;
- amounts owed;
- repayments;
- outstanding amounts;
- cleared debts;
- write-offs;
- disputes and resolutions.

This is transaction history, not an automated credit score.

## 17. Restricting Further Credit

Management can restrict or block further credit independently of the customer's outstanding balance or credit limit.

## 18. Returns on Credit Sales

An approved return linked to a credit sale may reduce the customer's outstanding obligation.

Example:

- Credit sale: ₦100,000
- Approved return: ₦30,000
- Revised outstanding obligation: ₦70,000

The original sale remains in history.

Detailed return and refund behavior belongs to Returns & Refund Rules.

## 19. Edited Credit Sales

If an authorized correction changes a credit sale, the customer's outstanding debt recalculates automatically from the corrected transaction state.

The system preserves the original state, correction, corrected state, editor, timestamp, reason where required, and resulting debt impact.

Users should not manually recalculate the new balance.

# PART B — SUPPLIER DEBT

## 20. Supplier Credit

The business may receive inventory from a supplier and owe some or all of its recorded purchase amount.

Example:

- Inventory received: ₦500,000
- Paid: ₦200,000
- Supplier liability: ₦300,000

Inventory is recorded as received; the unpaid amount remains payable.

## 21. Supplier Debt and Received Inventory

Normal V1 supplier debt begins from a recorded received inventory purchase.

Sabi Shop does not record inventory as received before it comes in.

Unreceived purchase intentions are not inventory purchases.

Future purchase orders or supplier deposits may be added later if a real need is established.

## 22. Multiple Supplier Payments

A supplier liability may be settled through multiple successful payments.

Each payment remains separately traceable.

## 23. Supplier Payment Confirmation

Only successful/confirmed supplier payments are recorded as successful payments.

An intended or unconfirmed payment does not reduce the supplier liability.

## 24. Supplier Returns

An approved supplier return may reduce the outstanding supplier liability when the return is accepted as reducing what the business owes.

The return remains a separate event linked to the original receipt.

## 25. Supplier Debt Adjustments

Management may record legitimate supplier debt reductions or forgiveness.

An adjustment must be authorized, identify the supplier liability and amount, include a reason, identify the responsible person, and preserve audit history.

An adjustment is not a fake payment.

## 26. Supplier Value Owed Back to the Business

V1 does not create a general supplier-credit wallet.

If an approved supplier return or adjustment results in the supplier owing the business value, that event is recorded and traceable.

Exact financial treatment of supplier refunds, credits, and offsets is deferred to the Financial & Business Performance Model.

# PART C — INTEGRITY AND REPORTING

## 27. Debt Must Be Explainable

Debt balances must be traceable to recorded events.

For customers, the basic relationship is:

**Credit sales − successful repayments − approved returns/adjustments = outstanding obligation.**

For suppliers:

**Recorded received purchases − successful payments − approved returns/adjustments = outstanding liability.**

Detailed financial treatment may expand later, but the balance must always have an understandable history.

## 28. Debt Is Not Cash

Customer debt is money expected from customers, not cash in hand.

Cash increases only when a successful payment is actually recorded.

## 29. Supplier Debt Is Not Automatically an Expense

A supplier payable is an outstanding obligation. Inventory acquisition and payment must not be confused with ordinary operating expense.

Exact treatment of acquisition cost, COGS, profit, and cash belongs to the Financial & Business Performance Model.

## 30. No Silent Debt Changes

Debt must change only through identifiable events such as:

- credit sale;
- repayment;
- approved return;
- authorized write-off;
- authorized correction;
- other explicitly supported adjustment.

No silent balance edits.

## 31. Successful Payments and Later Reversals

The normal workflow records only successful/confirmed payments.

Failed or unconfirmed payments are not completed payment records.

If a previously successful payment is later legitimately reversed by the underlying payment process, that is an exceptional financial/audit event rather than a normal payment workflow. The broader payment and audit specifications will define it.

## 32. Offline Operation

Core debt operations should work offline where practical, with later synchronization.

Exact synchronization and conflict rules belong to Offline & Synchronization Rules.

## 33. Management Debt View

Management should be able to review:

### Customers
- total outstanding debt;
- individual balances;
- credit history;
- repayments;
- due/overdue debts where due dates exist;
- disputes;
- write-offs/adjustments;
- cleared debts.

### Suppliers
- total outstanding liabilities;
- supplier balances;
- purchase history;
- payments;
- returns;
- adjustments.

Customer receivables and supplier payables must remain clearly distinct.

## 34. V1 Exclusions

V1 does not require:

- customer wallets;
- customer credit balances;
- automated credit scoring;
- complex collections software;
- automatic assumptions about external payments;
- purchase orders merely to support supplier debt;
- artificial due dates;
- accounting-heavy terminology as the primary user experience.

## 35. Audit and Historical Integrity

Debt-related history must preserve:

- original transactions;
- payment/repayment events;
- returns;
- adjustments;
- write-offs;
- disputes;
- resolutions;
- corrections;
- responsible users;
- timestamps.

Corrections explain what changed rather than erasing the earlier record.

## 36. Cross-Deliverable Consistency

B03 remains consistent with:

- D00 — Product Requirements Foundation & Decision Register
- D02 — Domain Dictionary / Business Glossary
- D03 — Sales & Transaction Rules
- D04 — Pricing & Discount Rules
- Salesperson Performance & Incentive Rules
- Inventory Rules
- B02 — Supplier & Purchasing Rules

Downstream deliverables expand these rules without silently contradicting them.

## 37. Locked Business Principles

1. Customer credit is supported.
2. Customer credit requires management authorization.
3. Management controls customer credit eligibility.
4. Customer credit limits are supported.
5. Exceeding a credit limit requires a management-authorized exception.
6. Multiple outstanding credit sales per customer are supported.
7. Repayments are separate successful payment events.
8. Multiple repayments are supported.
9. Repayments may be allocated across multiple debts.
10. V1 has no customer wallet or general customer credit balance.
11. Unconfirmed payments are not successful payment records.
12. Staff may physically collect repayments subject to permissions and reconciliation.
13. Split repayment methods are supported.
14. Fully paid debts are cleared but never deleted.
15. Management may authorize debt write-offs with reasons and audit history.
16. Disputed debts remain visible and are investigated rather than silently erased.
17. Credit records preserve sufficient evidence for dispute investigation.
18. Due dates are optional.
19. Customer credit history is preserved.
20. Management can restrict/block further credit.
21. Approved returns can adjust customer debt.
22. Edited credit transactions automatically recalculate debt while preserving history.
23. Supplier credit is supported.
24. Supplier debt is based on recorded received inventory purchases.
25. Multiple supplier payments are supported.
26. Supplier returns may reduce supplier liability when accepted as such.
27. Supplier debt adjustments require authorization and audit history.
28. V1 has no general supplier-credit wallet.
29. Debt balances must be explainable from recorded events.
30. Customer debt is not cash.
31. Supplier debt is not automatically an operating expense.
32. Debt changes must never happen silently.
33. Only successful/confirmed payments are treated as successful payments.
34. Core debt operations are designed for offline use.
35. Historical debt records remain auditable.

## 38. Status

**LOCKED — Business Rules**

The core Credit & Debt rules are complete and cross-checked conceptually against the existing sales, inventory, supplier, pricing, incentive, cash, and financial principles.

Detailed implementation choices remain intentionally deferred to the appropriate downstream deliverables.
