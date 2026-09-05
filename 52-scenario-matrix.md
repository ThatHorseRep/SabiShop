# Sabi Shop --- Scenario Matrix

**Phase:** 7 --- Prove It Works\
**Status:** FINAL — RECONCILED V1

  --------------------------------------------------------------------------------
  ID                Scenario          Primary Risk      Expected Result
  ----------------- ----------------- ----------------- --------------------------
  SALE-001          Normal sale       Transaction       Sale completes once;
                    online            correctness       stock/payment effects
                                                        correct

  SALE-002          Normal sale       Offline           Sale saved locally and
                    offline           durability        later synchronized once

  SALE-003          Split payment     Money allocation  Each confirmed payment is
                                                        recorded correctly

  SALE-004          Unconfirmed       False payment     Payment remains
                    transfer                            unconfirmed

  CREDIT-001        Authorized credit Debt integrity    Sale completes and debt is
                    sale                                created

  CREDIT-002        Credit beyond     Authorization     Requires authorized
                    limit                               exception

  CREDIT-003        Repayment across  Allocation        Repayment is traceable to
                    debts                               selected debts

  PUR-001           Receive stock     Inventory         Accepted receipt increases
                                                        stock

  PUR-002           Supplier credit   Liability         Unpaid received purchase
                                                        creates supplier liability

  INV-001           Concurrent        Lost stock        Accepted movements both
                    offline sales                       affect stock

  INV-002           Stock discrepancy Integrity         Investigation/correction
                                                        workflow triggered

  RET-001           Partial return    Return effects    Correct quantity returned;
                                                        original sale preserved

  RET-002           Unverified return Fraud/error       Normal return workflow
                                                        blocked

  CASH-001          End-of-day        Cash truth        Expected vs actual cash
                    reconciliation                      discrepancy is explicit

  COR-001           Minor correction  History           Original evidence
                                                        preserved

  COR-002           Material          Authority         Appropriate authorization
                    correction                          required

  COR-003           Staff             Separation of     Restricted/denied
                    self-correction   duty              according to B09

  SEC-001           Cross-business    Data isolation    Access denied
                    access                              

  SYNC-001          Duplicate event   Duplication       One accepted event
                    retry                               

  SYNC-002          Sync conflict     Overwrite risk    Conflict preserved and
                                                        surfaced

  INT-001           Tampered          Integrity         Alert generated
                    protected record                    

  INC-001           Return after      Incentive truth   Unreleased incentive
                    incentive                           recalculates

  REPORT-001        Historical cost   Reporting         Prior profit remains
                    change                              accurate
  --------------------------------------------------------------------------------


### Reconciled V1 Scenarios

| ID | Scenario | Expected Result |
|---|---|---|
| INV-003 | Sale with insufficient recorded stock | Sale may complete; resulting negative stock is visible as an exception for investigation. |
| INV-004 | Cost changes after completed sale | Historical COGS and historical transaction profit remain stable. |
| CORR-001 | Correction within default window | Ordinary eligible correction can proceed within 15 minutes. |
| CORR-002 | Correction after default window | Requires the applicable high-integrity/management control path. |
| CORR-003 | Consequential Manager self-correction | Action is consistently flagged to Owner and remains auditable. |
| PAY-005 | Custom cash payment method | Method is classified as cash and contributes to physical-cash expectation. |
| PAY-006 | Custom non-cash payment method | Method is classified as non-cash and does not increase physical cash. |
| DAY-001 | Sale continues after midnight before close | Transaction remains in the same operational business day. |
| CASH-004 | Reconciliation mismatch | Actual Cash differs from Expected Cash; discrepancy remains visible. |
| SUP-003 | Return unpaid supplier purchase | Outstanding payable is reduced by the accepted return. |
| SUP-004 | Return already-paid supplier purchase | Supplier credit/receivable is created; no fake cash refund is recorded. |
| INC-001 | Value gate passed, volume gate failed | No incentive payout release. |
| INC-002 | Volume gate passed, value gate failed | No incentive payout release. |
| INC-003 | Both incentive gates passed | Incentive becomes eligible under the configured policy. |
| INC-004 | Return/correction changes qualification | Incentive is recalculated before release. |
| FIN-001 | Tax/VAT retained | Tax/VAT remains available as first-class financial data. |
| FIN-002 | Gross profit calculation | Gross Profit equals Net Recognized Selling Value minus COGS, with no double discount subtraction. |
| PERF-001 | Manager performance view | Inventory remaining/stock health is visible alongside sales, expenses and profit/performance. |
