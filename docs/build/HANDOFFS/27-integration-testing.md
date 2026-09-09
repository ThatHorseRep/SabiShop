# Handoff 27 — Cross-Domain Integration Testing

**Status:** VERIFIED INTEGRATION TEST SUITE  
**Verified:** 2026-09-09  
**Module:** Cross-domain integration of M06–M13 domain engines, authorization, offline sync and reporting

## Outcome

`src/domain/integration.test.ts` adds a journey-level integration suite that
tests complete business operations across domain boundaries rather than
isolated functions. Every journey runs against one composed engine graph
(`world()`) that mirrors how the authoritative adapter must wire the domain
slices: pricing, inventory, sales, customers/credit,
returns/corrections/integrity, purchasing, cash reconciliation and canonical
reporting, plus the shared audit boundary.

The suite covers the ten critical journeys:

1. product → sale → payment → inventory → COGS → reporting;
2. credit sale → debt → repayment → reporting;
3. purchase → receiving → inventory → supplier obligation;
4. supplier return → payable/credit → inventory → settlement;
5. sale return → inventory/financial/refund/reporting consequences;
6. correction → audit lineage → downstream recalculation;
7. cash sale → Expected Cash → reconciliation;
8. opening cash → business day lifecycle → close/reopen;
9. offline sale → sync → authoritative state (plus duplicate/tamper/rejection);
10. authorization → operation → audit.

Each journey includes failure paths **between** components — refused
payments, blocked credit, over-limit credit, illegal supplier-return states,
over-returns, unauthorized corrections, premature cash events, closed-day
movements, server-side authorization rejection and cross-business requests —
and asserts that no domain effect leaks when a component refuses.

## Integration defects found and fixed

The suite was written to the specified behavior first; the following defects
surfaced as failing tests and were then fixed.

### 1. Return reversal of total due excluded the proportional tax share

**Specification:** B04 §5 (a settlement normally equals the value associated
with the returned goods), FIN-001 (tax retained through returns), H05 §8
(Net Recognized Selling Value excludes tax; Gross Profit = NRSV − COGS).

**Defect:** `ReturnsCorrectionsEngine.applyReturn` reversed only the net line
value from `totalDueKobo` while separately reversing the proportional tax.
On a VAT sale, a partial return under-reversed total due, under-refunded the
customer by the tax share, and left the report's net recognized value
₦75-too-high per returned unit (for 7.5% VAT). Credit-sale returns also left
the customer owing the tax share of the returned goods.

**Fix:** the total-due reversal and the refund are now tax-inclusive
(`value + taxShare`); the tax, net and gross-profit effects remain
tax-exact. Net after a half return of a ₦2,150 two-unit sale is now exactly
the one remaining unit's ₦1,000.

**Executable proof:** J5 — `applied.financialEffect` and the settled-refund
amount; the canonical report reconciles to net ₦1,000 / tax ₦75 / COGS ₦500 /
GP ₦500.

### 2. Correction of total due excluded the tax delta

**Specification:** FIN-001 (tax retained through corrections), H05 §8.

**Defect:** `correctedSnapshot` moved `totalDueKobo` by the net line change
only, while moving `taxKobo` by the proportional delta. Correcting a 3-unit
₦3,225 sale to 2 units produced total due ₦2,225 instead of ₦2,150, and net
recognized value ₦2,075 instead of ₦2,000.

**Fix:** the corrected total due now includes the tax delta, so the
sale-plus-correction report equals exactly a clean corrected sale.

**Executable proof:** J6 — correction effect `totalDueKobo −1075 /
taxKobo −75 / cogsKobo −500 / grossProfitKobo −500`, and the projected report
equals the corrected two-unit sale.

### 3. Cumulative returns could exceed the sold quantity

**Specification:** B04 §2/§13 (partial returns; returned quantities
preserved), H01 INV-GLOBAL-002.

**Defect:** `requestReturn` validated each request only against the original
sale-line quantity. Two sequential requests of the full line quantity were
both accepted and could both be applied, creating phantom stock and
over-refunding the customer.

**Fix:** previously accepted (non-rejected) returns for the same sale line
now reserve quantity; a new request cannot exceed the remaining sale
quantity. Duplicate lines inside one request are aggregated before the
check. The POS/exceptions UI clamp remains advisory; the domain check is the
authority.

**Executable proof:** J5 — a second legitimate one-unit return on a two-unit
line is accepted, while a request that would exceed the sold quantity is
refused with `invalid_return` and leaves no record.

### 4. Report's supplier outstanding ignored confirmed supplier-return settlements

**Specification:** Handoff 08 (only a confirmed-success settlement changes
the derived supplier balance), Gate C (derived reports reconcile to
authoritative records).

**Defect:** `CanonicalReporting` computed supplier outstanding as
purchases − confirmed payments − applied/settled returns, omitting confirmed
settlements. After settling a supplier credit, the report still showed the
receivable while `PurchasingEngine.supplierOutstanding()` returned the
settled balance.

**Fix:** confirmed settlements are added exactly as the authoritative engine
does, and `suppliers.sourceEventIds` now drills down to confirmed payments,
accepted returns and confirmed settlements as well as purchases.

**Executable proof:** J4 — after settlement the report equals the engine
balance (₦36.00 total across both suppliers) and includes `settlement-b` in
its source ids.

### 5. POS composition committed credit sales the credit engine would refuse

**Specification:** H01 INV-GLOBAL-004 (denied actions have no business
effect), B04 credit rules (blocked customers cannot complete a credit sale;
over-limit requires a separate exception).

**Defect:** `PosController.completeSale` called
`engines.sales.complete` first and `engines.customers.recordCreditSale`
second. Called directly (the "API without the UI" path the repo explicitly
tests for authorization), a blocked/restricted/over-limit customer's credit
sale committed the sale, inventory and report effects, then threw when
recording the debt — leaving a completed sale whose receivable existed
nowhere in the debt ledger.

**Fix:** the controller now runs the same credit assessment before
committing; a blocked, restricted or over-limit-without-exception sale throws
before any engine records anything. The credit engine remains the
authoritative post-commit check.

**Executable proof:** `src/pos/pos.test.tsx` — "leaves no sale effects when
credit is refused at the composition boundary"; J2 exercises the same
contract at the domain composition level.

## Composition contract demonstrated

The suite's `completeSale` helper encodes the ordering a durable adapter
must implement:

1. validate credit eligibility **before** committing the sale;
2. let the sales engine commit pricing/payment/inventory/report atomically;
3. record the credit debt idempotently by client event id;
4. record explicit cash events for cash-bearing sales into the open business
   day (the documented manual boundary from Handoffs 12/26).

Offline sync uses the durable-shaped `SyncCoordinator` envelopes with an
`InMemorySyncServer` whose `apply` replays the operation into a fresh
authoritative engine graph; server-side authorization is rechecked and
identity reuse is a preserved conflict.

## Coverage matrix

`IT` means `src/domain/integration.test.ts`; `POS` means `src/pos/pos.test.tsx`.

| Journey                                                 | Executable test               | Key invariants proven                                                                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| product → sale → payment → inventory → COGS → reporting | IT J1                         | exact tax/COGS/GP arithmetic; weighted average; movement-derived stock; historical COGS stability after later receipts; event-time period filtering; failed payment leaves no domain effect                  |
| credit sale → debt → repayment → reporting              | IT J2                         | debt only from approved credit sales; partial/full repayment states; over-limit exception; blocked customer leaves no effects; report receivable clears exactly                                              |
| purchase → receiving → inventory → supplier obligation  | IT J3                         | receipt increases stock and obligation; confirmed-only payments settle; failed payment recorded without effect; duplicate purchase delivery idempotent; cross-business purchase excluded                     |
| supplier return → payable/credit → inventory            | IT J4                         | unpaid-return payable reduction; paid-return supplier credit; settlement consumes the credit; report reconciles with the engine; apply-before-approval and over-quantity refused                             |
| sale return → consequences                              | IT J5                         | tax-inclusive reversal/refund; held stock separation; original sale preserved; settled refund state; report recalculation; cumulative over-return refused                                                    |
| correction → audit → downstream recalculation           | IT J6                         | material-correction authority; tax-consistent corrected totals; original/corrected snapshots in audit; downstream inventory and report ids; dependent-event block                                            |
| cash sale → Expected Cash → reconciliation              | IT J7                         | opening-cash gate; custom cash/non-cash classification (PAY-005/006); expected/actual/variance; explicit unresolved discrepancy and resolution; report cash section reconciles                               |
| opening cash → business day → close                     | IT J8                         | full lifecycle audit sequence; staff cannot confirm/close; closed day rejects events; reopen preserves an unresolved variance                                                                                |
| offline sale → sync → authoritative state               | IT J9                         | LOCAL_ONLY → SYNCHRONIZED; server replay equals local state; duplicate delivery idempotent; tampered identity reuse is a preserved conflict; server rejection surfaces REJECTED while local evidence remains |
| authorization → operation → audit                       | IT J10 + POS composition test | denied staff adjustment/purchase leaves no mutation and one denial audit; authorized manager purchase applies and is audited; cross-business request denied                                                  |

## Authorization, tenant and audit boundaries

- Domain-side role gates verified: management-only reversal, return
  verification/approval/application, material-correction separate approval,
  opening-cash confirmation, reconciliation confirmation/closure, interim
  counts and discrepancy resolution.
- `executeAuthorized` is exercised as the authoritative boundary: denials are
  audited (`authorization.denied`), allowances audited
  (`authorization.decision`), and `perform` never runs when denied.
- Business scoping verified on sales, customers, credit history, cash
  sessions, purchasing records and report projections; another business's
  purchase and cross-business authorization request never reach the active
  business's report or audit scope.
- The in-memory inventory read helpers remain single-scope by design
  (documented in Handoff 26); the suite exercises cross-business inventory
  only through business-tagged events and report filtering.

## Historical and audit behavior

- Original sale snapshots are preserved after returns and corrections; the
  audit lineage keeps original/corrected states, reason, actor and downstream
  inventory/report/credit identifiers.
- Failed, unauthorized and illegal operations leave every touched domain
  unchanged (asserted via before/after effect counts).
- The cash audit trail records the full open → close → reopen lifecycle.

## Files changed

- `src/domain/integration.test.ts` (new) — the ten-journey integration suite.
- `src/domain/returnsCorrections.ts` — tax-inclusive return reversals and
  refunds; tax-consistent corrected totals; cumulative return-quantity guard.
- `src/reporting.ts` — supplier settlements reconcile with the purchasing
  engine; supplier source ids drill to payments, returns and settlements.
- `src/pos/posController.ts` — credit eligibility validated before the sale
  commits.
- `src/pos/pos.test.tsx` — composition-boundary credit atomicity regression.
- `docs/build/HANDOFFS/27-integration-testing.md` (this file).
- `docs/build/BUILD-STATUS.md`.

## Validation

```text
npm ci                                       PASS (252 packages, 0 vulnerabilities)
npm run format:check                         PASS
npm run lint                                 PASS
npm test                                     PASS (26 files, 263 tests)
npm run build                                PASS (TypeScript + Vite)
npx tsc -b --pretty false                    PASS
npx vitest run src/domain/integration.test.ts
                                             PASS (10 tests)
npx prettier --check <changed source files>  PASS
git diff --check                             PASS
```

All commands ran in the repository environment; none were skipped.

## Genuine gaps surfaced

1. **Cash integration remains adapter-level.** The suite feeds completed-sale
   cash and settled cash refunds into the business day explicitly; no
   automatic sale→cash event integration exists yet.
2. **No durable multi-domain transaction.** The in-memory engines commit
   per-command; a durable adapter must still wrap cross-domain sequences
   (sale + debt, return + refund) in one transaction.
3. **Refund settlement is evidence only.** Sabi Shop records the stated
   settlement; it does not verify external money movement.
4. **Server replay is a reference.** J9's authoritative server replays into a
   second in-memory graph; durable server-side idempotency and conflict
   storage remain downstream.
5. **Physical inventory counts, provisional COGS settlement, incentive
   release and payment-provider execution** remain unimplemented, as
   documented in Handoff 26.

## Known limitations

- In-memory integration suite; no persistence, API or E2E UI driver.
- The exceptions UI's return-quantity clamp counts only applied returns; the
  domain now rejects overlapping in-flight requests, which surfaces as an
  explicit domain error instead of a silent accept.
- The H01/H02 wording tension on closing a day with an unresolved variance
  remains a product decision (Handoff 26 item 3); J8 preserves the current
  reconciled behavior.

## Excluded modules

- Durable PostgreSQL/API adapters, authentication provider integration.
- Incentive payout calculation/release.
- General ledger/accounting classification.
- Payment-provider execution.
- Purchase-order workflows beyond the implemented receiving model.

## Next integration step

Stand up the durable persistence/authorization adapter behind
`executeAuthorized` and replay these ten journeys against durable storage:
transactional sale+debt commit, server-side sync replay with persisted
idempotency/conflicts, and report projections materialized from the same
authoritative records — without changing the business rules proven here.
