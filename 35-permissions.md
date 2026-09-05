# Sabi Shop --- Permissions & Authorization Specification

**Phase:** 4 --- Control & Reliability\
**Status:** Working Specification\
**Authority:** B09 Roles & Permissions.

## 1. Purpose

Translate the business authority model into enforceable application
authorization.

## 2. Roles

-   **Owner:** highest business authority; maximum authority to resolve
    issues, never permission to erase evidence.
-   **Manager:** delegated operational authority.
-   **Staff / Salesperson:** routine operational authority with
    restricted consequential actions.

Owner and Manager may be the same person.

## 3. Authorization Principles

1.  Screen visibility does not imply action authority.
2.  Permissions are evaluated inside the active business context.
3.  Offline status does not remove authority rules.
4.  Consequential actions require explicit authorization.
5.  A user should not approve their own material corrective action by
    default.
6.  No role can silently rewrite or delete historical evidence.

## 4. Routine Staff Actions

Subject to configured permissions: - search products; - create normal
sales; - record confirmed payments; - perform permitted repayment
collection; - view permitted stock/customer information; -
report/request corrections.

## 5. Management Actions

Management may, within configured authority: - manage products and
inventory; - manage suppliers and purchasing; - authorize credit; -
approve returns; - apply/configure permitted discounts; - reconcile
cash; - perform/approve corrections; - investigate audit/integrity
alerts; - manage incentive policy.

## 6. High-Integrity Actions

Elevated authorization applies to: - customer identity changes; -
completed-sale SKU changes; - salesperson attribution changes; -
material payment corrections; - reconciled-record corrections; -
inventory corrections after subsequent movement; - closed-day
corrections; - duplicate handling; - suspected tampering; - integrity
conflicts.

## 7. Denied Actions

Denied actions must be explicit and understandable. The system must not
imply that a hidden button means a user is merely missing a screen.

## 8. Delegation

Owner-defined Manager authority must be configurable without weakening
mandatory audit, reason, approval and separation-of-duty controls.

## 9. Business Boundary

Every authorization check must include the active business identifier.
Cross-business access is prohibited unless explicitly authorized.

## 10. Audit

Authorization decisions and material actions must be auditable,
including actor, business, target record, action, time, result and
relevant reason/approval context.
