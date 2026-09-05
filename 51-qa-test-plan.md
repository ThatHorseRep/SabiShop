# Sabi Shop --- QA & Test Plan

**Phase:** 7 --- Prove It Works\
**Status:** FINAL — RECONCILED V1

## 1. Test Layers

-   unit tests;
-   domain/business-rule tests;
-   integration tests;
-   API/authorization tests;
-   synchronization tests;
-   UI/component tests;
-   end-to-end tests;
-   accessibility tests;
-   performance tests;
-   recovery tests;
-   user acceptance testing.

## 2. Priority

P0 tests cover money, inventory, debt, permissions, transaction
integrity, offline operation and synchronization.

## 3. Test Data

Use deterministic fixtures representing: - normal sales; - split
payments; - credit; - returns; - supplier purchases; - cash movements; -
multiple devices; - corrections; - reconciliation discrepancies.

## 4. Regression

Every production defect involving financial truth, inventory,
permissions or historical integrity creates a regression test.

## 5. Offline Matrix

Test: - fully offline; - reconnect during write; - reconnect after
multiple events; - duplicate retry; - simultaneous device events; -
failed sync; - conflict; - device restart.

## 6. Security Matrix

Test unauthorized direct API calls, cross-business access, expired
sessions, role changes and self-approval restrictions.

## 7. Financial Tests

Test rounding, discounts, weighted-average costing, returns, credit,
supplier liabilities, cash reconciliation and historical snapshots.

## 8. UAT

Realistic shop users perform representative journeys using phone-sized
devices and realistic catalogue data.

## 9. Exit Criteria

No unresolved P0 defects; agreed P1 defects documented; acceptance
criteria passed; backup/recovery tested; release checklist completed.

## 5. Mandatory V1 Regression Domains

Every release candidate must include automated or controlled tests for:

1. weighted-average costing and historical COGS stability;
2. negative-stock exception visibility;
3. correction window boundary and severity classification;
4. Owner flagging for consequential Manager self-corrections;
5. transfer verification and audit logging;
6. configurable payment methods with cash/non-cash classification;
7. supplier-return accounting states;
8. tax/VAT persistence;
9. business-day sessions crossing midnight;
10. shared versus individual cash custody;
11. Cash in Hand / Expected Cash / Actual Cash reconciliation semantics;
12. incentive value and minimum-sales volume gates;
13. return/correction effects on incentive eligibility;
14. Gross Profit = Net Recognized Selling Value − COGS;
15. management performance visibility including inventory remaining/stock health.
