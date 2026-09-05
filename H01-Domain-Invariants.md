# H01 — Domain Invariants Specification

**Status:** Pre-build hardening draft

## 1. Purpose

Turn distributed Sabi Shop business rules into explicit conditions that
implementation, database constraints, APIs and tests can enforce.

## 2. Core invariants

### INV-GLOBAL-001 — Durable explainability

Every consequential number or state must be explainable from durable
authoritative records.

### INV-GLOBAL-002 — No silent historical destruction

Completed sales, payments, stock movements, debt changes, returns,
corrections, reconciliation records and authorization evidence are never
silently deleted or rewritten.

### INV-GLOBAL-003 — Corrections preserve lineage

A correction creates attributable subsequent state while preserving the
original event.

### INV-GLOBAL-004 — Denied actions have no business effect

A denied consequential operation cannot create or mutate a business
record.

### INV-TENANT-001 — Business isolation

Every business-owned record is scoped to exactly one business context.
Cross-business access is denied.

### INV-SALE-001 — Completion requires valid completion conditions

A normal sale is not complete merely because a basket exists or a
payment was attempted.

### INV-SALE-002 — One logical sale completion

Retries and duplicate submissions cannot produce multiple accepted
business effects.

### INV-SALE-003 — Historical sale values are preserved

Current product prices never rewrite historical selling price, quantity
or line meaning.

### INV-PAY-001 — Attempt is not success

Pending, failed, rejected or unconfirmed payments are not successful
payments.

### INV-PAY-002 — Completion cannot rely on unconfirmed external payment

A transfer/POS claim cannot complete a sale until the shop has the
required confirmation.

### INV-PAY-003 — External money movement is not fabricated

Sabi Shop records external settlement information but does not claim
execution or independent verification without an integration.

### INV-CREDIT-001 — Debt is event-created

Customer debt arises from a valid completed credit obligation, not from
an abandoned attempt.

### INV-CREDIT-002 — Credit equals the approved credit component

For split payment, only the approved credit portion creates customer
debt.

### INV-CREDIT-003 — Debt is distinct from cash

Receivables are not represented as physical cash.

### INV-INV-001 — Stock changes have source events

Every quantity change has a traceable inventory movement.

### INV-INV-002 — Negative stock is exceptional

Negative stock may exist operationally but remains visible and requires
investigation.

### INV-INV-003 — No fabricated cost

The system must not invent inventory cost merely to make a report look
complete.

### INV-INV-004 — Weighted-average costing

V1 inventory costing uses weighted-average cost. Later costs do not
rewrite historical COGS.

### INV-INV-005 — Count is evidence

A physical stock count identifies variance; it does not silently
overwrite the ledger.

### INV-RETURN-001 — Return is separate from original sale

Returns remain linked events; the original sale remains historical
truth.

### INV-RETURN-002 — Approved return only

A normal return requires the defined verification and management
authorization.

### INV-RETURN-003 — Refund is distinct from return

Goods return and monetary settlement are separate events.

### INV-SUP-001 — Receipt creates inventory

Inventory increases from accepted physical receiving, not merely
purchase intent.

### INV-SUP-002 — Supplier liability is distinct from expense

Unpaid received stock creates a supplier obligation; it is not
automatically an operating expense.

### INV-CASH-001 — Expected Cash is derived

Expected Cash = Confirmed Opening Cash + Cash received from completed
sales + Cash In − Cash Out − cash refunds paid from till.

### INV-CASH-002 — Non-cash does not increase physical cash

Transfer, POS/card, credit and other non-cash methods do not increase
Expected physical Cash.

### INV-CASH-003 — Actual Cash is observed

Actual Cash is the physical count recorded during reconciliation, not a
routine editable dashboard truth.

### INV-CASH-004 — Discrepancy does not rewrite sources

A cash variance is investigated; source records are not changed merely
to make Expected and Actual agree.

### INV-DAY-001 — Business Day is an operational session

A business day may cross midnight and remains open until official
closure.

### INV-DAY-002 — Closure requires management confirmation

Physical count, reconciliation, explanations and management confirmation
are required for official closure.

### INV-CORR-001 — Default ordinary correction window

V1 default is 15 minutes from sale completion; management may configure
the window.

### INV-CORR-002 — Material corrections are elevated

Payment, debt, protected identity, attribution and closed-day changes
receive elevated controls.

### INV-CORR-003 — No self-approval

An actor cannot self-approve an action requiring independent approval.

### INV-INC-001 — Incentive gates are conjunctive

Both the value-above-floor gate and minimum completed-sales-volume gate
must pass.

### INV-INC-002 — Returns/corrections can alter eligibility

Incentive eligibility must be recalculated when qualifying sales
materially change.

### INV-FIN-001 — Financial concepts stay separate

Revenue, cash, inventory, receivables, payables and profit are distinct
concepts.

### INV-FIN-002 — Gross Profit

Gross Profit = Net Recognized Selling Value − COGS.

### INV-MONEY-001 — Exact money

Financial values use exact representation; V1 monetary precision is
nearest kobo.

### INV-SYNC-001 — Offline is not automatically authoritative

Local, pending, accepted, rejected, conflicted and failed
synchronization states remain distinguishable.

### INV-SYNC-002 — Offline does not bypass authority

Offline capability does not create permissions the user does not have.

### INV-SYNC-003 — Idempotency

One logical client event can create at most one accepted business
effect.

### INV-SYNC-004 — No silent conflict overwrite

Conflicting consequential events are preserved and explicitly resolved
or escalated.

### INV-AUDIT-001 — Consequential attribution

Material operations retain actor, business, operation, target, time,
authorization and result context.

### INV-XDOMAIN-001 — Cross-domain ownership

One domain may reference another domain’s identifiers/state but must not
bypass the owning domain by directly mutating its authoritative data.

## 3. Enforcement hierarchy

Each invariant must map to one or more of:

1.  database constraint;
2.  domain/service rule;
3.  API authorization/validation;
4.  transaction boundary;
5.  UI prevention/explanation;
6.  automated test;
7.  observability/alert where applicable.

## 4. Violation rule

If an invariant cannot be enforced safely, the system must fail closed
for consequential actions or preserve the uncertain state for review. It
must never manufacture a successful outcome merely to keep the interface
tidy.
