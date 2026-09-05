# Salesperson Performance & Incentive Rules

**Status:** FINAL — RECONCILED V1
**Product:** Sabi Shop

## 1. Purpose

Sabi Shop may provide an optional incentive/reward system for people who personally perform sales.

The incentive is a **bonus for good salesmanship and business value**. It is not a replacement for salary or ordinary compensation.

Different businesses may use different reward policies, so the incentive system must be configurable rather than mandatory.

## 2. Core Principle

The incentive system should reward responsible, profitable selling and good use of business pricing rules.

It must **not encourage unnecessary overpricing or damage customer relationships**.

> **Reward good salesmanship, not merely expensive sales.**

## 3. Incentives Are Optional

The business may enable or disable the incentive system.

If disabled:
- sales continue normally;
- salesperson attribution still occurs;
- no incentive is accrued.

If enabled, the Owner defines the applicable policy.

### V1 payout gates

A payout is eligible only when **both** gates are satisfied:

1. **Value gate:** the configured incentive percentage is applied to the eligible amount above the business's acceptable price floor.
2. **Volume gate:** the salesperson reaches the management-configured minimum number of qualifying completed sales within the applicable measurement/release period.

The volume gate exists to prevent gaming through a very small number of high-value transactions. Returns, cancellations, reversals, and material corrections must recalculate eligibility before payout release.

## 4. Eligibility

A person may earn an incentive when they personally perform a qualifying sale.

Eligible people include:
- Staff/Salespersons;
- Managers;
- the Owner.

Eligibility follows actual salesperson attribution, not job title alone.

## 5. Salary vs Incentive

An incentive is a bonus on top of salary, where salary exists.

It is not:
- a replacement for salary;
- a deduction from salary;
- automatically guaranteed compensation.

## 6. Floor-Based Incentive Concept

Where enabled, the amount sold above the applicable price floor can become incentive-eligible.

Example:
- Current price: ₦5,000
- Floor: ₦4,500
- Actual selling price: ₦4,700
- Amount above floor: ₦200

The Owner defines what portion, if any, becomes reward-eligible. Sabi Shop must not hard-code a universal percentage.

## 7. Owner-Defined Policy

The Owner decides whether the business uses floor-based incentives and how they are rewarded.

Some businesses may use incentives heavily, occasionally, differently, or not at all.

Exact formula parameters belong to the later Financial & Business Performance Model.

## 8. Selling at the Floor

If the actual selling price equals the effective floor, the amount above the floor is ₦0.

Therefore the price-based incentive contribution is **₦0**.

The sale may still contribute to ordinary sales-performance metrics.

## 9. Selling Above the Normal Price

Sabi Shop permits sales above the current/default price, but incentives must not encourage staff to overcharge customers.

The incentive model should reward responsible profitable selling rather than simply maximizing the transaction price.

The current/default price remains the normal commercial reference.

## 10. Profitability as an Incentive Input

The incentive system should eventually support profitability-aware rewards.

The floor is an operational baseline, but actual profitability may be a better measure of business value.

The later Financial & Business Performance Model will define:
- acquisition/cost basis;
- profit contribution;
- margin;
- inventory cost treatment;
- profitability calculations;
- any optimization used by incentives.

## 11. Automatic Calculation

Sabi Shop should calculate provisional incentive amounts automatically as transaction data changes.

If a sale changes, the incentive must recalculate automatically.

Relevant changes include:
- price edits;
- quantity edits;
- item removal;
- cancellation/void;
- approved returns/refunds;
- transaction corrections;
- other changes affecting incentive eligibility.

The original transaction state remains auditable.

## 12. Provisional vs Payable

A calculated incentive is not necessarily immediately payable.

The Owner may configure a release schedule such as:
- weekly;
- biweekly;
- monthly / added to salary;
- another approved schedule.

Until release, the incentive remains **provisional/pending**.

This allows legitimate returns, refunds, cancellations, and corrections to be reflected before payment.

## 13. Returns and Refunds

Returns/refunds must affect unreleased incentives.

If a qualifying sale is later reversed, Sabi Shop recalculates the associated provisional incentive.

For partial returns, only the affected portion should be adjusted according to the eventual financial rules.

If an incentive was already released and a later return requires recovery or offset, the exact mechanism belongs to the financial/payroll policy.

## 14. Edited Sales

When a sale is edited, its incentive is automatically recalculated from the corrected transaction.

Example:
- Original provisional incentive: ₦500
- Corrected sale would produce: ₦200
- System automatically updates the provisional amount to ₦200.

The audit trail preserves the fact that the transaction and calculation changed.

## 15. Below-Floor Sales

A below-floor sale should **not automatically produce a normal price-based incentive**.

Recommended rule:

> **Below-floor incentive is placed on hold pending management review.**

This applies whether the sale was authorized before completion or allowed under a review/exception mode.

Legitimate reasons may include:
- clearing old stock;
- matching a legitimate competitor price;
- supporting a loyal customer;
- moving damaged-but-usable goods;
- another documented business reason.

Management can determine whether the transaction qualifies under the business's incentive policy.

## 16. Products Without an Explicit Floor

If no explicit floor is configured, the current/default selling price acts as the effective floor.

A sale below that effective floor is treated as a below-floor exception.

If allowed, its incentive remains subject to management review.

Management should also be notified/surfaced that the product has no explicit floor so the configuration can be corrected for future sales.

## 17. ₦0 / Free Sales

A ₦0/free sale is supported only with Owner/Manager approval.

A free sale earns **no salesperson incentive**.

The system records:
- that the sale was free;
- approving Owner/Manager;
- approval time;
- reason.

## 18. No Universal Hard Maximum

Sabi Shop should not impose a universal hard maximum on incentives.

A hard cap could create undesirable behavior and does not solve the underlying customer-pricing problem.

The business's pricing rules, profitability rules, exception handling, and incentive policy should provide safeguards.

A particular business may later choose its own compensation limits if required.

## 19. Customer Relationship Protection

The incentive system must not reward:
- unnecessary overpricing;
- refusing reasonable customers;
- withholding reasonable negotiation;
- manipulating recorded prices;
- steering customers toward less favorable purchases solely for personal reward.

Customer trust and sustainable business relationships take priority over maximizing an individual transaction.

More precise anti-gaming rules will be developed after the financial model and reporting requirements are defined.

## 20. Management Visibility

Owner/Manager users should be able to see:
- provisional incentives;
- incentives pending review;
- released incentives;
- transactions contributing to incentives;
- adjustments caused by returns, refunds, edits, or cancellations;
- the salesperson associated with each incentive.

Exact dashboard design belongs to later UX and Business Performance deliverables.

## 21. Offline Behaviour

Core incentive calculation must work with Sabi Shop's offline-first architecture.

While offline:
- qualifying sales can be recorded;
- provisional calculations can be made from local rules and transaction data;
- transaction changes can trigger local recalculation;
- incentive records synchronize later.

Authoritative synchronized data may cause recalculation.

Detailed conflict handling belongs to Offline & Synchronization Rules.

## 22. Auditability

The system should be able to establish:
- which transaction produced an incentive;
- who performed the sale;
- transaction values used;
- applicable incentive policy/version;
- provisional incentive calculated;
- later changes affecting it;
- management review;
- release/payment status;
- subsequent adjustments.

Detailed audit implementation belongs to Audit & Data Integrity.

## 23. Delegated Implementation & Policy Details

1. Resolved: management-configured incentive percentage.
2. Resolved for V1: floor-based eligible monetary amount.
3. Resolved: weighted-average inventory costing is the COGS basis used by the incentive calculation.
4. Release schedule/cutoff mechanics remain configuration/implementation details.
5. Already-paid recovery/offset remains a payroll/settlement policy concern; unreleased incentives must recalculate.
6. Resolved for V1: management-configured minimum qualifying completed-sales threshold.
7. Exact reporting/dashboard design.
8. Exact permission rules for configuration and approval.
9. Exact treatment across multiple businesses for one user.
10. Exact payroll integration, if any.
11. Exact treatment of management-approved below-floor incentives beyond the pending-review principle.

## 24. Dependencies

- D02 — Domain Dictionary / Business Glossary
- D03 — Sales & Transaction Rules
- D04 — Pricing & Discount Rules
- Inventory Rules
- Credit & Debt Rules
- Returns & Refund Rules
- Financial & Business Performance Model
- Roles & Permissions Matrix
- Offline & Synchronization Rules
- Audit & Data Integrity Rules
- UX / User Flow Specification
- Data Model / Schema

## 25. Review Checklist

- [ ] Incentives are optional.
- [ ] Salary remains distinct from incentive.
- [ ] Staff, Managers, and Owner may earn incentives for qualifying sales they personally perform.
- [ ] Owner defines the incentive policy.
- [ ] Floor-based incentives are configurable.
- [ ] Selling at the floor produces ₦0 price-based incentive.
- [ ] Incentives do not encourage unnecessary overpricing.
- [ ] Profitability can eventually inform incentives.
- [ ] Transaction changes automatically recalculate provisional incentives.
- [ ] Rewards can remain provisional until an Owner-defined release period.
- [ ] Returns/refunds affect unreleased incentives.
- [ ] Below-floor incentives are held for management review.
- [ ] Missing-floor situations use the current price as the effective floor.
- [ ] ₦0/free sales require Owner/Manager approval and earn no incentive.
- [ ] No universal hard incentive cap is imposed.
- [ ] Customer trust is an explicit design constraint.
- [ ] Incentive calculations are auditable.
- [ ] Offline operation is supported.
- [ ] Deferred financial formulas remain open for the Financial Model.

## 26. Current Status

**RECONCILED — V1 BUSINESS RULES FINALIZED**

The core incentive philosophy and operating rules are defined.

The exact mathematical incentive formula, profitability basis, payout mechanics, and detailed anti-gaming rules remain intentionally deferred to later deliverables.

---

# FINAL RECONCILIATION — INCENTIVE POLICY

When enabled, incentive value is the management-configured percentage of the eligible amount above the applicable acceptable floor.

### Minimum-sales gate
A calculated amount is not payable solely because one sale generated an eligible amount. The salesperson must also reach the **management-configured minimum number of completed qualifying sales** within the applicable measurement/release period.

This creates two gates: **value above floor** and **minimum qualifying sales volume**. Returns, cancellations, reversals, and material corrections recalculate both the incentive value and qualification state before release.

The Owner controls the incentive percentage, floor policy, minimum qualifying-sales threshold, and release policy. The policy/version used for each calculation is auditable.
