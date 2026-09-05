# B05 — Cash & Reconciliation Rules

## Status
**LOCKED — Business Rules**

## 1. Purpose

This deliverable defines how Sabi Shop should record, reconcile, investigate, and preserve cash-related business events without pretending to control money that exists outside the system.

The goal is to make the shop's physical cash position understandable, auditable, and manageable while keeping the workflow practical for a small Nigerian shop.

---

## 2. Core Principle

Sabi Shop records what happened, calculates what should have happened, compares that with what was actually counted or recorded, identifies discrepancies, preserves evidence, and gives Owner/Manager control over investigation and resolution.

Sabi Shop does **not** automatically accuse staff, punish staff, classify unexplained money as theft, or invent financial explanations.

---

## 3. Opening Cash

- Staff may enter the physical opening cash count.
- The Owner/Manager confirms the official opening cash figure.
- Management owns the official opening balance.
- If staff and management figures differ, the confirmed figure must be preserved with an audit trail.
- Money brought to the shop at the start of the day is treated as that day's opening cash.
- Sabi Shop does not need to model household overnight cash movements.

---

## 4. Expected Physical Cash

Expected physical cash is based only on events that actually affect the physical till.

### Expected Cash Formula

**Expected Cash = Confirmed Opening Cash + Cash received from completed sales + Cash In − Cash Out − Cash refunds recorded as paid from the till**

The following do **not** increase expected physical cash:

- Bank transfer
- POS/card payment
- Credit
- Other non-cash payment methods

---

## 5. Split Payments

A single sale may use multiple payment methods.

Example:

- Sale total: ₦10,000
- Cash: ₦4,000
- Transfer: ₦3,000
- Credit: ₦3,000

Sabi Shop records and reconciles each portion separately.

Only the ₦4,000 cash component affects expected physical cash.

---

## 6. Successful Payment Requirement

Sabi Shop records completed sales only after the required payment has been successfully confirmed.

- No confirmed payment = no completed sale.
- No confirmed payment = goods should not leave.
- Transfer/POS payments are only treated as confirmed when the shop confirms them.
- Sabi Shop does not independently verify bank or POS systems unless an external integration is added later.

---

## 7. Cash In

Cash added to the till during the day must be recorded.

A Cash In record should include:

- Amount
- Reason
- Person who added the cash
- Date/time

Typical reasons may include:

- Change money added
- Owner added cash
- Manager added cash
- Other

“Other” requires an explanation.

---

## 8. Cash Out

Cash leaving the till for a reason other than a sale or refund must be recorded.

A Cash Out record should include:

- Amount
- Reason
- Person who took or received the cash
- Date/time
- Relevant responsible staff/manager

Examples include:

- Shop expense
- Transport
- Money given to Owner
- Bank deposit
- Other legitimate shop cash movement

### Approval

Cash-out approval rules are decided by management.

Sabi Shop should not hard-code one universal threshold. Management decides which cash-outs staff may record independently and which require approval.

---

## 9. Owner Withdrawals and Bank Deposits

If the Owner takes cash from the till, Sabi Shop records the physical movement as a Cash Out.

If cash is removed from the till for a bank deposit, Sabi Shop records the physical cash leaving the till.

B05 does not attempt to determine the accounting classification of that movement. That belongs to the later financial model.

---

## 10. Salesperson and Cash Responsibility

The person who makes the sale is responsible for the money from that sale until reconciliation.

This preserves the operational chain:

**Sale → Salesperson → Money Held → Reconciliation**

The system should not separate salesperson attribution from cash responsibility when that salesperson actually receives and holds the money.

---

## 11. Cash-Holding Structure

The shop may operate in either of these ways:

1. One person is responsible for a shared physical cash drawer.
2. Each salesperson holds their own sale cash until reconciliation.

Management decides the operating structure.

If several people are on duty, all people who are genuinely responsible for cash during the relevant period may be held accountable.

The system must not arbitrarily assign a discrepancy to one person when multiple people were actually responsible.

---

## 12. Staff Handovers

When cash responsibility changes between people, Sabi Shop should support a handover count.

Example:

- Staff A handover count: ₦85,000
- Staff B accepts responsibility from that point

A handover establishes a clear accountability boundary.

If no responsibility change occurs, unnecessary handover steps should not be forced.

---

## 13. Physical Cash Count

At end of day, the responsible person counts the actual physical cash and enters the result.

Staff may prepare or enter the count.

Management confirms the official reconciliation and closure.

---

## 14. Expected vs Actual Cash

Sabi Shop compares:

- Expected physical cash
- Actual physical cash counted

Possible results:

- Balanced
- Shortage
- Excess

A shortage or excess is a **discrepancy**, not an automatic accusation.

---

## 15. Discrepancy Investigation

Owner/Manager investigates discrepancies.

Staff may provide:

- Explanations
- Evidence
- Supporting information

Staff should not close their own discrepancy.

Management may mark a discrepancy as explained when evidence supports the explanation.

Examples:

- Forgotten Cash Out
- Incorrect recorded amount
- Unrecorded cash movement
- Unrecorded sale
- Counting error
- Other verified cause

---

## 16. Unresolved Discrepancies

If the cause is not known, the discrepancy remains:

**Unresolved Cash Discrepancy**

Sabi Shop must not automatically classify it as:

- Theft
- Business loss
- Staff misconduct
- Salary deduction
- Any other punishment

Management decides what the situation means after investigation.

An unresolved discrepancy may remain open after the day itself has been closed.

---

## 17. Resolving Old Discrepancies

Management may resolve a discrepancy later.

The resolution should preserve:

- What was discovered
- Who resolved it
- Date/time
- Explanation
- Any resulting corrective event

The original reconciliation should not be silently rewritten.

---

## 18. Corrections

Cash records should preserve history.

If a Cash In, Cash Out, handover, or reconciliation record was wrong, the correction should be auditable.

Example:

- Original Cash Out: ₦20,000
- Later correction: +₦5,000
- Corrected value: ₦25,000

The system preserves:

- Original entry
- Correction
- Who made the correction
- When it was made
- Why it was made

---

## 19. Unrecorded Sales Found During Investigation

If investigation shows that goods were sold but the sale was never recorded, management should be able to create the missing sale or appropriate corrective business event.

This allows Sabi Shop to distinguish:

**Goods sold → money should have entered the business**

from:

**Goods missing/lost/damaged/stolen/etc.**

The system must not hide missing sales through inventory adjustment.

---

## 20. Refunds and Cash Reconciliation

If management records that cash was physically returned to a customer from the till, expected cash decreases by that amount.

If management records that settlement was made through another payment method, physical cash should not be reduced.

Sabi Shop records the settlement; it does not execute or control the refund.

This rule follows B04 — Returns & Refund Rules.

---

## 21. Payment-Method Reconciliation

End-of-day reporting should separate payment methods.

Management should be able to see figures such as:

- Cash expected vs actual
- Transfer recorded
- POS/card recorded
- Credit outstanding
- Other configured payment methods

Sabi Shop should not falsely describe externally reported transfer or POS amounts as independently verified unless an external integration exists.

---

## 22. End-of-Day Closure

A business day is officially closed only after:

- Physical cash count is entered
- Reconciliation is performed
- Required explanations are entered
- Manager/Owner confirms closure

Staff may prepare the reconciliation, but staff do not officially close the business day without management confirmation.

---

## 23. Closing With an Unresolved Discrepancy

Management may close the day even when a discrepancy remains unresolved.

The unresolved discrepancy:

- Remains visible
- Remains open for investigation
- Does not disappear because the day was closed

---

## 24. Reopening a Closed Day

Manager/Owner may reopen a closed day when necessary.

Reopening must be audited with:

- Who reopened it
- When
- Why

Owner may review, correct, reopen, and resolve actions performed by Manager.

---

## 25. Owner Away From the Shop

Manager may perform reconciliation and officially close the day.

Owner can review remotely later.

This supports the real operating model where the Owner may not always be physically present.

---

## 26. Interim Cash Counts

Management may perform optional cash counts during the day.

These are checkpoints only.

An interim count does not close the business day and does not replace final EOD reconciliation.

---

## 27. Staff Accountability

Sabi Shop should preserve who was responsible for money during the relevant period.

Management should be able to identify patterns such as repeated shortages or excesses.

However, Sabi Shop must not automatically:

- Deduct salary
- Suspend staff
- Disable staff
- Label staff dishonest
- Assign guilt

The system provides evidence; management decides consequences.

---

## 28. Management View

The reconciliation dashboard should prioritize:

1. Expected cash
2. Actual cash
3. Shortage/excess
4. Unresolved discrepancies
5. Cash In / Cash Out
6. Payment-method totals
7. Responsible person(s)
8. Relevant sales, returns, corrections, and investigation events

---

## 29. Offline Operation

Cash counts and reconciliation must work offline.

When connectivity returns, the system should sync the recorded business events while preserving:

- Original event time
- Event identity
- Order/history
- Audit information

Technical duplicate-prevention and sync implementation belong to the technical architecture rather than B05 business rules.

---

## 30. Cross-Deliverable Rules

B05 must remain consistent with:

### Sales
- Only successful completed sales affect payment totals.
- Split payments are supported.
- Salesperson attribution is preserved.

### Credit
- Credit does not increase expected physical cash.
- Credit is tracked separately from physical cash.

### Returns & Refunds
- Cash refunds recorded as physically paid reduce expected cash.
- Sabi Shop records settlement but does not execute it.

### Inventory
- Cash discrepancies do not automatically alter inventory.
- Inventory discrepancies do not automatically alter cash.
- Investigations may reveal linked events such as an unrecorded sale.

---

## 31. Deferred Technical Details

The following are implementation concerns and are not business-policy decisions in B05:

- Unique transaction/event IDs
- Sync conflict algorithms
- Duplicate event prevention
- Server reconciliation logic
- Device-level retry behavior
- Database locking
- API design

These should be handled in later technical deliverables while preserving the business rules above.

---

## 32. Final Integrity Rules

Sabi Shop must preserve these principles:

- Do not silently rewrite cash history.
- Do not invent money movements.
- Do not treat non-cash payment as physical cash.
- Do not automatically blame staff for discrepancies.
- Do not hide missing sales through cash or inventory adjustments.
- Preserve responsibility and timestamps.
- Staff may enter operational records; management confirms official figures.
- Management controls reconciliation, investigation, resolution, and closure.

---

## Final State

**B05 — Cash & Reconciliation Rules is LOCKED.**

---

# FINAL RECONCILIATION — CASH MODEL

Staff record sales and money-out activity. They do **not** maintain a continuously editable “Actual Cash” dashboard value. During reconciliation/close, the responsible person physically counts cash and enters that count as **Actual Cash**.

**Cash in Hand** is the operational/dashboard concept. **Expected Cash** is system-derived. **Actual Cash** is the physical count. The difference is a discrepancy, not an automatic accusation.

Both shared-drawer and individual-salesperson cash custody are supported as business settings. A business day is an explicit operational session and may cross midnight until official closure.
