# H11 — Final Clarification Register

**Status:** Awaiting user decisions after hardening pass

## How to answer

Answer only the questions that require your business/product judgment.
Technical choices can be proposed after your answers.

Where a question is already resolved in the Product Bible, it is
deliberately NOT repeated here.

## A. Business terminology

### Q01 — Transaction terminology

Should “transaction” remain the umbrella term for business records,
while specific records use names such as sale, payment, return,
correction and reconciliation?

**Current safe recommendation:** Yes.

### Q02 — Cancellation / void / reversal

The Bible already establishes that void is a correction/exception
action, returns are separate events, and refund/reversal preserves
original history. What exact user-facing distinction should remain
between: - cancellation; - void; - reversal; - correction?

Please define when each should be available and whether any are merely
aliases.

## B. Sales and pricing

### Q03 — Revenue timing

For operational reporting, should a completed credit sale be recognized
as revenue immediately at sale completion, with the receivable tracked
separately?

### Q04 — Discount authority

What exact discount limits, if any, should be configurable by: -
Staff; - Manager; - Owner?

Should the limit be percentage, amount, both, or business-configurable
rules?

### Q05 — Tax/VAT behavior

Should prices be: - tax-exclusive; - tax-inclusive; - configurable per
business/product?

What exact behavior should apply to discounts and tax calculation?

## C. Inventory

### Q06 — Stock availability timing

At what exact point does received stock become sellable: - when
receiving begins; - when receiving is saved; - when receiving is
completed/confirmed; - after inspection/approval?

### Q07 — SKU model

Must every sellable product have exactly one SKU in V1, or can one
product have multiple variants/SKUs?

### Q08 — Unit conversions

Can conversions vary per product? Can they change later? If a conversion
changes, should old transactions retain the historical conversion used?

### Q09 — Fractional quantities

Which product/unit types may be sold in fractional quantities (e.g. 0.5
kg, 1.5 litres), and what precision is allowed?

### Q10 — Returned stock condition

Who determines whether returned stock is: - immediately sellable; - held
for inspection; - damaged/non-sellable?

Should the default differ by product category?

## D. Customers and credit

### Q11 — Customer identity

Beyond name + phone, which customer fields are required in V1?

### Q12 — Credit approval

What exact credit rules should be configurable? - credit limit; -
overdue balance; - minimum deposit; - manager approval; -
customer-specific exceptions.

### Q13 — Write-offs

Who may approve debt write-offs, and must every write-off require a
reason?

## E. Cash and finance

### Q14 — Owner funding

Should Owner cash-in/funding appear only in Cash/Reconciliation, or also
in broader financial reports?

### Q15 — Owner withdrawals

Should Owner withdrawals appear in broader financial reports as a
distinct owner-related movement, or only as Cash Out?

### Q16 — Cash custody

Should a business be able to switch between shared and individual
custody at any time, or must the custody model be fixed per
business/day/session?

### Q17 — Cash refund settlement

When a return is approved, may the system record a refund as “due”
before physical payment, or should the refund event only exist once
settlement is actually confirmed?

## F. Suppliers

### Q18 — Supplier payment workflow

What exact supplier payment states are required? For example:
`Due → Partially Paid → Paid` with failed/pending states where external
payments are involved.

### Q19 — Supplier credit

For a paid supplier return, should supplier credit remain indefinitely
until used, or expire/require management resolution?

## G. Business day

### Q20 — Business-day start

Does a business day begin automatically at first activity, manually when
management starts a session, or at a configured opening time?

### Q21 — Reopening

When a closed day is reopened, which operations become permitted, and
which require Owner authorization?

## H. Offline and synchronization

### Q22 — Offline consequential operations

Which operations must be permitted offline without server confirmation?

Candidate set: - sales; - cash-in/out; - repayments; - receiving; -
inventory counts; - returns; - corrections; - authorization requests.

Please mark any that must require connectivity.

### Q23 — Conflict authority

When two offline devices produce conflicting consequential events, who
has final authority: - Owner; - Manager; - automatic domain rule; -
depends on operation?

### Q24 — Stale permissions

If a user is revoked while their device is offline, should
already-created offline operations: - execute when they reconnect; - be
rejected; - be conditionally reviewed?

## I. Security / account lifecycle

### Q25 — Account recovery

What identity/recovery methods should V1 support?

### Q26 — Device/session policy

Should businesses be able to see and revoke registered devices/sessions?

### Q27 — Sensitive action re-authentication

Which actions should require password/PIN/biometric re-authentication
even when the user is already signed in?

## J. Reliability / operations

### Q28 — RPO

What maximum acceptable amount of data loss is acceptable after a
catastrophic incident?

### Q29 — RTO

How quickly must Sabi Shop be operational again after catastrophic
failure?

### Q30 — Backup retention

How long should backups be retained, and how many historical restore
points should be guaranteed?

### Q31 — Data retention

How long should Sabi Shop retain: - sales; - customer records; - staff
records; - audit records; - payment records; - logs; - deleted
products; - synchronization records?

## K. Product boundary

### Q32 — Multi-branch

Is multi-branch/warehouse support explicitly V2, or should the V1 model
quietly remain extensible for it without exposing branch functionality?

### Q33 — Accounting integration

Is external accounting integration explicitly outside V1?

### Q34 — Payment integrations

Which payment-provider integrations, if any, are actually planned for
V1? The current model deliberately avoids claiming independent
verification without an integration.

## L. Final terminology / UX

### Q35 — “Cash in Hand”

Confirm that “Cash in Hand” remains the preferred operational/dashboard
term for physical cash, while “Actual Cash” remains the reconciliation
count terminology.

### Q36 — Exception ownership

For each unresolved exception category, who is the default resolver? -
cash discrepancy; - inventory discrepancy; - debt dispute; - return; -
correction; - sync conflict; - integrity issue.

## Final instruction

These answers should be treated as a single decision batch.

After they are supplied, the answers should be propagated across:

`B-series → D-series → C-series → F-series → H01-H10`

before the hardening deliverables are declared final.
