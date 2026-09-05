# Sabi Shop --- UX & Task Flow Specification

**Phase:** 5 --- Product Experience\
**Status:** Consolidated Working Specification

## 1. UX Principle

**Fast for ordinary work. Deliberate for consequential work.**

## 2. Journey Model

Primary flows follow: **Discover → Prepare → Authorize → Commit →
Verify**

## 3. Core Journeys

-   normal sale;
-   product search;
-   multiple quantities;
-   price exception;
-   split payment;
-   unconfirmed transfer;
-   credit sale;
-   customer repayment;
-   purchase receiving;
-   supplier payment;
-   stock investigation;
-   cash reconciliation;
-   cash handover;
-   return;
-   refund/settlement;
-   minor correction;
-   material correction;
-   wrong customer/SKU/attribution correction;
-   duplicate transaction;
-   closed-day correction;
-   management review;
-   offline sale;
-   offline credit sale;
-   sync conflict;
-   integrity escalation;
-   incentive recalculation;
-   performance investigation;
-   historical investigation.

## 4. Routine Work

Routine screens should minimize steps, preserve context and support
rapid repeated actions.

## 5. Consequential Work

Consequential screens must show: - affected record; - consequence; -
required authority; - reason; - confirmation; - resulting state.

## 6. Historical Truth

Completed transactions are not presented as deletable objects.
Corrections and returns are linked events.

## 7. Error Handling

Errors must explain what happened, whether the operation committed, what
the user can do next, and whether management review is required.

## 8. Offline

Users must understand whether a record is locally saved, synchronized,
pending or conflicted.

## 9. Role Adaptation

The same underlying business truth may have different action
availability by role, but role differences must never create
contradictory records.

## 10. Responsive Principle

Phone is a first-class operating device. Desktop/tablet should expand
visibility without turning routine mobile workflows into desktop-only
forms.
