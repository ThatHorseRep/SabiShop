# Sabi Shop --- Acceptance Criteria

**Phase:** 7 --- Prove It Works\
**Status:** FINAL — RECONCILED V1

## 1. Definition of Done

A capability is accepted only when its normal behavior, authorization,
financial/inventory effects, auditability and failure behavior are
verified.

## 2. Sales

-   A valid sale can be completed offline.
-   Confirmed payments are reflected correctly.
-   Unconfirmed payments are not treated as successful.
-   Stock effects are correct.
-   Historical sale data remains traceable.

## 3. Credit

-   Credit requires appropriate management authorization.
-   Multiple debts can exist.
-   Repayments are separate events.
-   Debt remains explainable from recorded events.

## 4. Purchasing

-   Management can record received inventory.
-   Inventory increases only from recorded receipt.
-   Supplier liability reflects unpaid received purchases.

## 5. Returns

-   Original purchase is verifiable.
-   Return requires management approval.
-   Partial return is supported.
-   Rejected return changes nothing economically.

## 6. Cash

-   Expected cash follows B05.
-   Reconciliation exposes discrepancies.
-   Corrections do not erase the underlying evidence.

## 7. Inventory

-   Accepted movements produce correct stock.
-   Historical cost remains stable for prior transactions.
-   Discrepancies enter investigation/correction flow.

## 8. Permissions

Unauthorized actions are rejected even if a client attempts them
directly.

## 9. Offline/Sync

Retrying a synchronized event does not duplicate it. Conflicts preserve
evidence and require appropriate resolution.

## 10. Integrity

Material historical changes are auditable and integrity violations are
detectable.

## 11. UX

Routine work is fast; consequential work is deliberate and explicit.

## 12. Reporting

Financial and operational reports can be traced back to underlying
records.
