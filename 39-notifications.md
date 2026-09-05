# Sabi Shop --- Notifications & Attention Specification

**Phase:** 5 --- Product Experience\
**Status:** Working Specification

## 1. Purpose

Notify users about events requiring attention without turning the
application into a noisy alert system.

## 2. Notification Principle

Notifications should be event-driven and actionable.

## 3. Priority Classes

-   **Critical:** integrity/security or business-threatening state.
-   **Action required:** approval, conflict, reconciliation or
    correction requiring a decision.
-   **Attention:** low stock, pending synchronization or meaningful
    operational issue.
-   **Informational:** useful but non-blocking updates.

## 4. Examples

-   pending return approval;
-   unresolved sync conflict;
-   failed synchronization;
-   reconciliation discrepancy;
-   suspected integrity issue;
-   low-stock condition where configured;
-   correction awaiting review;
-   important supplier/customer debt review.

## 5. Notification Content

Each notification should identify: - what happened; - affected
context; - why it matters; - required action; - current state.

## 6. Navigation

Notifications should lead directly to the relevant investigation or
action context.

## 7. Offline

Notification state must not imply a server-side event was processed if
the device has not synchronized.

## 8. Noise Control

Repeated identical failures should be grouped or deduplicated.
