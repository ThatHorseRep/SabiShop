# Handoff 05 — Money, Tax & Financial Engine

**Status:** Implemented and verified V1 financial primitives  
**Scope:** Canonical financial arithmetic and derived calculations only. This
handoff does not define dashboard presentation, permissions, persistence, tax
registration configuration, or statutory reporting.

## Authoritative representation

- `Money` is `{ currency, minor }`, where `minor` is a non-negative `bigint`
  count of the currency's smallest unit. NGN therefore stores kobo.
- Monetary input is accepted as a decimal string, never as a JavaScript
  `number`. Invalid scientific notation and negative authoritative amounts are
  rejected.
- `Quantity` is a reduced positive-denominator rational
  `{ numerator, denominator }`. Fractional quantities are supported where the
  product's configured unit permits them.
- Currency mismatches are errors; no implicit conversion is performed.
- JPY is represented with zero decimal places. NGN, USD, GBP and EUR use two.

## Rounding policy

Rounding is deterministic **round half up**. Money input is rounded once to the
currency minor unit. Multiplication/division (including fractional quantities,
tax, and weighted-average cost) rounds to the nearest minor unit at the
calculation boundary. Do not round to naira or use binary floating point as
financial truth.

## Canonical formulas

For a completed sale line:

```text
Gross Selling Value = actual unit selling price × quantity
Net Recognized Selling Value = Gross Selling Value − approved discount
Tax (exclusive) = round(Net Recognized Selling Value × rate / 10,000)
Total Due (exclusive) = Net Recognized Selling Value + Tax
Gross Profit = Net Recognized Selling Value − COGS
```

Tax rates are integer basis points (`750` means 7.50%). For tax-inclusive
pricing, tax is extracted from the recorded total:

```text
Tax = round(Total × rate / (10,000 + rate))
Net = Total − Tax
```

Tax is first-class and is not included in net recognized selling value or
gross profit. Discounts are applied exactly once.

## Weighted-average inventory costing

`weightedAverageUnitCost` calculates:

```text
weighted-average unit cost = total acquisition cost / available quantity
COGS = weighted-average unit cost × sold quantity
```

Historical acquisition events and sale COGS snapshots remain separate from
future receipts. A later purchase price cannot rewrite a completed sale.
Negative stock is permitted operationally, but when no positive reliable
quantity/cost basis exists, COGS must remain provisional/undetermined rather
than inventing a cost; the current primitive rejects that calculation so the
caller must record the exception and later adjustment explicitly.

## Outstanding balances and sign conventions

Positive money values are obligations, receipts, or reductions supplied as
explicit inputs. A returned `Money` outstanding balance is positive when the
party still owes the business and negative when the business owes a credit or
over-settlement.

Customer balance:

```text
valid credit obligations
− repayments
− approved return credits
− approved write-offs
+ authorized corrections
```

Supplier balance:

```text
received purchase obligations
− supplier settlements
− unpaid-return reductions
− paid-return credits
+ authorized corrections
```

Paid supplier returns create a credit/receivable event but do not erase the
original receipt. Replacement goods are a separate receipt obligation.

## Calculation boundaries

The engine accepts explicit inputs and returns explicit outputs. It does not
infer payment confirmation, sale completion, tax configuration, return
approval, inventory availability, business-day membership, or external money
movement. Those states must be established by the owning domain before calling
these functions.

Corrections and refunds are additive events. The original sale, COGS, receipt,
payment, return, or settlement is not mutated or deleted. Cash reconciliation
must separately apply only confirmed cash components and refunds paid from the
till, per B05.

## Verification matrix

The accompanying `src/domain/finance.test.ts` covers:

- zero money, zero quantity and zero tax;
- kobo half-up rounding boundaries;
- fractional quantities;
- discounts and over-discount rejection;
- exclusive and inclusive tax;
- weighted-average COGS and canonical gross profit;
- multiple obligations, repayments, returns and corrections;
- negative input rejection and currency/precision constraints.

Additional integration tests must verify event ordering/idempotency and
provisional COGS resolution when negative stock later receives reliable
acquisition information. Those concerns belong to the transaction, inventory,
and offline-sync implementations rather than this arithmetic module.

## Slice completion record

**Built:** `src/domain/finance.ts` and its focused Vitest coverage. The module
is pure and deterministic; it has no persistence or network side effects.

**Verification:** The full existing test suite passed (9 tests), the
TypeScript/Vite production build passed, and ESLint passed. A targeted finance
test run also passed (8 tests).

**Known limitations:** Unauthorized-use checks, saved-data/history checks,
offline retry/failure checks, and report/inventory integration checks are not
implemented in this slice because identity, persistence, synchronization,
transaction, inventory, and reporting modules do not yet exist. The pure
functions reject invalid inputs and preserve additive correction/refund
semantics, but they do not authorize events or persist history.

**Unresolved decisions:** Tax registration/configuration, inclusive versus
exclusive pricing at product/business level, statutory reporting, event
envelopes/idempotency, provisional negative-stock COGS resolution, and
authorization/persistence boundaries remain delegated to the owning modules
and existing decision register. No new product rules were introduced here.
