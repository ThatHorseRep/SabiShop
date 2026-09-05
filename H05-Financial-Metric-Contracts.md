# H05 — Financial Metric Contracts

**Status:** Pre-build hardening draft

## 1. Contract structure

Every financial metric must define:

- name;
- business meaning;
- formula;
- authoritative source records;
- time basis;
- inclusion rules;
- exclusion rules;
- return/correction treatment;
- tax treatment;
- rounding;
- reconciliation method.

## 2. Expected Cash

**Formula**

`Expected Cash = Confirmed Opening Cash + Cash received from completed sales + Cash In − Cash Out − Cash refunds paid from till`

**Excludes**

- transfer;
- POS/card;
- credit;
- other non-cash methods.

**Source records**

- confirmed opening cash;
- successful completed sale payment components;
- cash-in;
- cash-out;
- cash refund settlement events.

## 3. Actual Cash

Actual Cash is the physical cash counted during reconciliation.

It is an observation, not a continuously maintained accounting balance.

## 4. Cash discrepancy

`Variance = Actual Cash − Expected Cash`

A non-zero variance is an investigation state, not automatic proof of
theft or error.

## 5. Gross Selling Value

`Gross Selling Value = applicable selling value before discount`

## 6. Net Recognized Selling Value

`Net Recognized Selling Value = Gross Selling Value − approved applicable discount`

Discount must not be deducted twice.

## 7. COGS

COGS is the applicable cost attributable to goods sold using V1
weighted-average costing.

Historical COGS must remain stable when later acquisition prices change.

## 8. Gross Profit

`Gross Profit = Net Recognized Selling Value − COGS`

This is the canonical V1 gross-profit formula.

## 9. Customer outstanding

Conceptually:

`Outstanding = valid credit obligations − valid repayments − approved return effects − approved write-offs ± authorized corrections`

The exact allocation/journal implementation belongs to the financial
technical specification.

## 10. Supplier outstanding

Supplier payable must be derived from received obligations and valid
supplier settlement events.

A supplier return must respect whether the underlying purchase was
unpaid or already paid.

## 11. Inventory value

Inventory value must use weighted-average cost for V1 and must remain
explainable from inventory movement and acquisition history.

## 12. Tax/VAT

Tax/VAT is first-class V1 financial data.

The exact configuration, inclusive/exclusive pricing behavior,
exemptions and reporting treatment remain clarification/technical items
where not already fixed.

## 13. Money precision

V1 financial values use exact representation and nearest-kobo monetary
precision.

No binary floating-point representation may be used as financial truth.

## 14. Time basis

Reports must state whether their period is based on:

- transaction/event time;
- business-day/session time;
- settlement time;
- reporting date.

A report must not silently mix time bases.

## 15. Reconciliation principle

Every displayed financial total must be reproducible from its
authoritative source records and must survive:

- retry;
- correction;
- return;
- refund;
- offline sync;
- report regeneration.
