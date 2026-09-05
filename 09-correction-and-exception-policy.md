# B08 --- Correction & Exception Policy

**Status:** FINAL — RECONCILED V1
**Package:** B --- Business Operations Specification

## 1. Purpose

B08 defines how Sabi Shop handles mistakes, corrections, exceptions,
duplicates, disputed records, and situations where recorded business
activity needs to be corrected or investigated.

> **Core rule: Correct the business record without destroying its
> history.**

B08 applies across sales, payments, credit/debt, inventory, purchasing,
returns/refunds, cash, incentives, attribution, and related business
records.

## 2. Core Principles

### 2.1 Audit trails are non-negotiable

Every correction preserves the relevant history:

-   original recorded state;
-   corrected/current state;
-   who performed it;
-   when it occurred;
-   why it occurred;
-   required authorization/review;
-   resulting downstream effects.

No correction may silently erase, overwrite, or destroy this history.

### 2.2 Successful business activity versus unsuccessful attempts

Sabi Shop records successful business activity.

An unsuccessful or reversed attempt must not be treated as a successful
sale, payment, transfer, or completed business event merely because an
attempt was made.

Salespeople are expected to exercise care before completing
transactions. Serious operational problems should be flagged for
management rather than hidden by inventing compensating business
transactions.

### 2.3 Corrections are not deletion

A correction does not mean the original record never existed. The
original remains part of the history even when its current business
effect changes.

### 2.4 No destructive restoration

If a correction is later discovered to be wrong, Sabi Shop does not
erase it and pretend it never happened. A further correction is recorded
while preserving the complete chain.

## 3. Correction Model

Sabi Shop uses a hybrid correction model.

### 3.1 Minor data-entry correction

Minor corrections that do not materially affect money, inventory, debt,
payment, incentives, or attribution may edit the current version within
the management-configured correction window. The previous state remains
preserved in history.

### 3.2 Material corrective event

Anything affecting money, payment, inventory, customer debt, supplier
liability, incentive, salesperson attribution, or another material
business effect is treated as a separate corrective event rather than a
silent rewrite.

## 4. Void, Adjustment, and Reversal

### 4.1 Void

A void is a controlled correction for a transaction that should no
longer count economically, including a transaction determined to have
been invalid from the beginning.

A void may require compensating inventory, payment, debt, accounting, or
other downstream effects.

The original transaction is never deleted. The void preserves the
original transaction, reason, actor, authorization, time, and resulting
compensating effects.

### 4.2 Adjustment

An adjustment is a controlled correction that changes one or more
business effects without pretending the original event never happened.

### 4.3 Reversal

Sabi Shop does **not** use a general reversal business transaction to
cover salesperson mistakes.

Only successful transfers, sales, and payment events are treated as
successful business activity. An unsuccessful attempt is not
manufactured into a successful event merely to balance the books.

Where a failed attempt exposes a serious operational or integrity
problem, Sabi Shop flags it and management handles the matter.

## 5. Correction Window

### 5.1 Authority

Management decides the correction window.

### 5.2 Start

The correction window begins at the **sale completion time**.

### 5.3 Inside the window

Permitted corrections depend on correction type and authority. Minor
corrections may be handled as edits where appropriate. Material
corrections must preserve the corrective trail and may require
authorization.

### 5.4 Outside the window

After the configured window:

-   ordinary staff editing is blocked;
-   Manager/Owner-controlled corrections may be performed where
    authorized;
-   staff may request correction for management approval;
-   material corrections use appropriate corrective events/adjustments
    rather than pretending the original never existed.

There is no permanent historical cutoff for discovering a mistake. Old
records may still be corrected when properly authorized, provided the
full trail is preserved.

## 6. Authority and Approval

-   Staff may not independently correct their own completed sale where
    authorization is required.
-   Another appropriately authorized person must approve or perform the
    correction.
-   Manager self-correction authority belongs to Roles & Permissions.
-   Owner authority does not permit destruction of the audit trail.
-   Some correction types require authorization; others may proceed
    under defined authority with management review.
-   Offline approval may occur when an authorized manager is locally
    available; otherwise permitted review may occur after
    synchronization.

## 7. Field-Specific Integrity

### Quantity

A wrong quantity may be handled as an edit or adjustment depending on
the correction window and materiality. If inventory changes, the
resulting inventory and costing effects must also be correct.

### Price

A wrong price may be handled as an edit or adjustment depending on the
correction window and authority. Historical pricing is never silently
rewritten.

### Product / SKU

A wrong SKU is a high-integrity issue because it may imply the wrong
price, inventory item, or business effect. It is not a casual field edit
and should be flagged for management investigation.

### Customer

Customer identity is a protected high-integrity field. A customer
identity correction is not a casual edit and requires confirmation and
appropriate management control. Unauthorized alteration should be
treated as a serious integrity/misconduct issue.

### Salesperson attribution

Salesperson attribution comes from the salesperson user account
associated with the recorded sale. It should not be casually editable. A
genuine attribution correction requires management approval.

## 8. Payment Corrections

Payment history must always remain traceable.

-   Changing payment method preserves the original payment history and
    correction trail.
-   Payment amount correction requires Manager/Owner authorization.
-   A payment already included in reconciliation requires Owner/Manager
    approval.
-   Original reconciliation evidence remains preserved.

## 9. Credit and Debt Corrections

Credit-sale corrections require management authorization where
applicable and remain visible in transaction history.

Where a corrected credit sale generates a new receipt, the corrected
state appears on the new receipt while the historical/original receipt
remains part of the record.

If a debt has already been partially repaid and the original credit
transaction is found to be wrong, management investigates and decides
the correction. Repayment history is not silently rewritten.

## 10. Inventory Corrections

### 10.1 Negative stock

Negative stock is operationally permitted so staff can complete a sale when recorded stock is insufficient. It is not treated as a healthy inventory condition: Sabi Shop must make it visible as an exception and require management investigation/reconciliation.

### 10.2 Subsequent stock movement

If stock has already moved after the transaction being corrected, the
system must not silently manufacture or erase stock merely to make
numbers convenient. The conflict is flagged for
management/reconciliation.

### 10.3 Costing

Where a correction changes inventory, inventory valuation, cost basis,
payment consequences, and profit consequences must be corrected
appropriately under B06.

**B06 V1 costing: weighted-average costing.**

## 11. Revenue, Profit, and Historical Reporting

A historical correction must not silently rewrite the fact that the
original transaction existed.

If a correction affects revenue, cost, profit, margin, or another
financial measure:

-   the correction remains traceable;
-   current reporting reflects the accepted correction;
-   historical snapshots remain preserved where applicable.

The system distinguishes the original event, corrective event/state, and
current accepted result.

## 12. Incentive Corrections

If a correction changes an incentive outcome, the incentive recalculates
according to applicable incentive rules.

Where a correction reduces or changes an incentive that has already
progressed beyond provisional calculation, management decides the
treatment.

Attribution changes require management approval.

## 13. Returns and Refunds

Returns remain separate linked business events and do not delete the
original sale.

Refunds are recorded only when an actual successful settlement/payment
event occurs.

A refund without physical return is allowed only as a
management-approved exception.

An unsuccessful refund/payment attempt is not recorded as a successful
refund business transaction.

## 14. Duplicate Transactions

Duplicate handling is situation-dependent. A duplicate may be:

-   voided;
-   identified as a duplicate and have its business effects corrected;
-   merged where appropriate.

Regardless of the action, the original duplicate record and complete
history remain preserved.

The system never resolves a duplicate by simply deleting one record.

## 15. Transaction Merging

Transactions may be merged where genuinely required.

A merge does **not** mean either original disappears.

The merge must:

1.  preserve both original transaction records;
2.  preserve both histories;
3.  record the accepted merged relationship/result;
4.  identify which originals contributed to the result;
5.  preserve relevant downstream effects and corrections.

## 16. Repeated Corrections

A corrected transaction may be corrected again.

Every correction remains visible in sequence. If a correction is later
found wrong, it remains in history and a further correction establishes
the new accepted state.

There is no destructive reset that removes intervening history.

## 17. Approval Errors

An incorrect approval remains historical evidence. If later found wrong,
the original approval remains recorded and the later correction
identifies what changed and records new authorization/review where
required.

## 18. Rejected Corrections

Rejected correction attempts remain auditable and do not change the
accepted/current business state.

## 19. Correction Reasons and Severity

Every correction requires a mandatory reason.

V1 uses **free-text reason entry**.

Evidence attachments are not required in V1.

Corrections are classified by severity, at minimum:

-   **Minor** --- limited data-entry correction with no material
    business effect.
-   **Material** --- affects money, payment, inventory, debt, incentive,
    attribution, or another material effect.
-   **High Integrity / Exceptional** --- protected identity, suspected
    manipulation, major discrepancy, serious inventory conflict, or
    similar elevated matter.

## 20. Closed Business Days

Corrections involving a closed business day are permitted only with
Manager/Owner authorization. The original reconciliation remains
preserved.

## 21. Receipts

After correction:

-   original receipt remains valid historical evidence;
-   corrected receipt may be generated;
-   original may be marked as corrected;
-   corrected receipt reflects the current accepted state.

Customers may be informed that a correction occurred, but internal audit
details should not be exposed.

## 22. Offline Corrections

Core correction operations may occur offline where otherwise authorized.

Offline corrections preserve the same integrity rules as online
corrections.

### 22.1 Conflicts

Offline conflicts must **never automatically overwrite** one side with
another. A conflict requires resolution.

### 22.2 Material offline corrections

Offline corrections affecting credit/debt, payment, inventory, or other
material effects may proceed under configured authority but require
management review after synchronization where specified.

## 23. Integrity and Tamper Detection

Sabi Shop must not allow suspected tampering to silently alter business
records.

When integrity violation or unauthorized manipulation is detected:

1.  block the attempted operation where possible;
2.  flag the issue;
3.  escalate to an authority higher than the acting account where
    applicable;
4.  allow Owner override/resolution where Owner authority permits;
5.  preserve the underlying history.

D10/D11 own technical audit/hash implementation. B08 owns the business
rule that integrity history must not be destroyed.

## 24. Management Handling of Serious Operational Mistakes

Sabi Shop should flag serious mistakes rather than automatically hiding
poor operational behavior.

Examples include:

-   wrong SKU;
-   wrong customer;
-   material price error;
-   inventory conflict;
-   payment discrepancy;
-   attribution concern;
-   suspected manipulation.

Management determines the appropriate business correction and,
separately, any personnel or operational response.

The business record and personnel-management response remain distinct
concerns.

## 25. Cross-Domain Non-Negotiable Invariants

1.  Never delete a completed business record to hide a mistake.
2.  Never silently overwrite historical evidence.
3.  Never manipulate timestamps to make a correction appear original.
4.  Never remove authorization or correction history.
5.  Never rewrite historical prices or quantities without preserving the
    original state.
6.  Never create a fake successful transaction to compensate for an
    unsuccessful attempt.
7.  Permit negative stock operationally when required to complete a sale, but always expose it as an inventory exception requiring investigation.
8.  Never automatically resolve an offline conflict by overwriting
    accepted history.
9.  Every correction requires a mandatory reason.
10. Material corrections require configured management authority/review.
11. Repeated corrections preserve the complete chain.
12. Rejected corrections remain auditable.
13. Original receipts remain historical evidence after correction.
14. Current reporting may reflect accepted corrections while historical
    snapshots remain preserved.
15. Customer-facing correction information must not expose unnecessary
    internal audit details.
16. Technical integrity mechanisms must support, not weaken, these
    business rules.

## 26. Ownership and Related Deliverables

B08 owns cross-domain correction and exception principles.

-   **B03 --- Credit & Debt:** debt lifecycle and credit rules.
-   **B04 --- Returns & Refund:** return approval, treatment,
    settlement, and return-specific rules.
-   **B05 --- Cash & Reconciliation:** reconciliation and cash
    correction mechanics.
-   **B06 --- Inventory Accounting:** weighted-average costing and
    inventory valuation.
-   **B07 --- Transaction Lifecycle & State Rules:** lifecycle/state
    interpretation.
-   **D05 --- Salesperson Performance & Incentive Rules:** incentive
    mechanics.
-   **Roles & Permissions:** exact authority matrix.
-   **D10 --- Audit Trail:** technical audit implementation.
-   **D11 --- Hash Chain / Integrity:** technical tamper-evidence
    implementation.

## 27. Reconciliation Notes

### 27.1 Negative-stock rule

The earlier D03 working rule that negative stock does not automatically
block a sale is inconsistent with B08.

**B08 resolution:** negative stock is not an acceptable normal state and
must be flagged and reconciled.

D03 should be updated during reconciliation; its older statement is
stale.

### 27.2 Inventory-cost-basis questions

Earlier unresolved inventory-cost-basis questions in pricing/incentive
work are no longer unresolved.

**B06 resolved them:** V1 uses weighted-average costing.

### 27.3 Historical correction questions

Earlier unresolved questions concerning correction windows,
authorization, duplicate handling, audit preservation, historical
corrections, receipts, offline conflicts, and related matters are
resolved by B08 and should not be re-asked as open questions.

### 27.4 Reversal terminology

B08 intentionally does not establish a general "reversal transaction" as
a normal Sabi Shop business record.

Where other documents use "reversal," distinguish unsuccessful attempts
from successful business events and use the appropriate domain-specific
corrective mechanism such as void, adjustment, return, or refund where
applicable.

### 27.5 Merge terminology

A merge is a relationship/result, not deletion. Both source transactions
and their histories remain preserved and traceable to the resulting
accepted state.

## 28. Deferred / Owned Elsewhere

B08 does not reopen:

-   exact correction permission matrix;
-   Manager self-correction authority;
-   exact severity thresholds;
-   exact incentive release/cutoff and settlement mechanics;
-   exact refund mechanics;
-   detailed inventory costing implementation mechanics;
-   exact audit schema;
-   exact hash-chain implementation;
-   exact offline synchronization algorithm;
-   exact transaction ID format;
-   payroll integration.

## 29. Acceptance Criteria

B08 is ready for lock when:

-   correction principles are internally consistent;
-   no correction destroys historical evidence;
-   void, adjustment, return, refund, and unsuccessful attempts are
    clearly distinguished;
-   material financial/inventory/debt/payment/incentive/attribution
    changes cannot be silently rewritten;
-   staff self-correction is controlled;
-   every correction requires a reason;
-   duplicate and merge handling preserves all source histories;
-   repeated corrections preserve the full chain;
-   offline conflicts cannot automatically overwrite accepted history;
-   negative stock is treated as an exception requiring investigation;
-   receipts preserve original and corrected evidence;
-   historical and current reporting are distinguishable;
-   technical audit/hash ownership is clear;
-   stale earlier rules are explicitly reconciled.

## Summary

B08 establishes Sabi Shop's correction philosophy:

> **The system should correct the business, not rewrite history.**

Minor data-entry mistakes may be edited within management-defined
controls. Material changes become controlled corrective events. Serious
integrity issues are flagged for management. Successful business
activity remains distinct from unsuccessful attempts. Duplicates may be
voided, corrected, or merged depending on circumstances, but no source
history disappears.

**Above all, the audit trail is preserved.**

---

# FINAL RECONCILIATION — CORRECTION AUTHORITY

The V1 default ordinary sale-correction window is **15 minutes from completion**, configurable by management.

**Ordinary/minor corrections** cover controlled non-material data-entry mistakes. **High-integrity/material corrections** include protected identity, payment, debt, attribution, and closed-day changes. These receive elevated controls. Manager self-correction is type/severity dependent; consequential Manager actions are consistently flagged to Owner, and a Manager cannot self-approve an action requiring separate approval.

Corrections preserve original history and create traceable subsequent state; they are never destructive deletion.
