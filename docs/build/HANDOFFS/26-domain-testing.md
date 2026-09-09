# Handoff 26 — Domain Verification

**Status:** VERIFIED DOMAIN TEST SUITE  
**Verified:** 2026-09-09  
**Module:** Cross-domain verification of M06–M11 and shared state/finance/audit boundaries

## Outcome

`src/domain/domainVerification.test.ts` adds a consolidated, executable
verification suite over the public domain engines. It complements the existing
focused module tests with cross-domain scenarios for:

- canonical state separation and illegal transitions;
- exact money, tax and gross-profit arithmetic;
- weighted-average inventory costing;
- movement-derived stock, negative stock and historical COGS stability;
- payment confirmation and failed-attempt no-effect behavior;
- credit, repayment, return, write-off and history relationships;
- customer returns and separate refund settlement;
- correction lineage, authorization and downstream effects;
- cash expected/actual/variance and business-day lifecycle;
- tenant scope and attribution on authoritative records;
- duplicate submission idempotency;
- unauthorized consequential operations.

The suite deliberately tests through public engine boundaries. It does not
inspect private state or mutate a domain engine's authoritative records directly.

## Implementation defect fixed

### Failed payment attempt could leave a completed pricing line

**Specification:** H01 `INV-GLOBAL-004`, `INV-SALE-001`, and `INV-PAY-001..002`;
B07 requires an abandoned or failed attempt to have no completed-sale effect.

**Defect:** `SalesTransactionEngine.complete` called
`CatalogPricing.priceSaleLine` before validating payment confirmation and
amounts. An unconfirmed transfer could therefore leave a completed line in the
catalog pricing history even though no sale, audit, report or inventory movement
was created.

**Fix:** `CatalogPricing.validateSaleLine` now builds and authorizes the
authoritative line snapshot without recording it. `complete` validates every
line and every payment first, then records lines and appends inventory, audit
and reporting effects only after all completion conditions pass.

**Executable proof:** `src/domain/domainVerification.test.ts` —
“INV-GLOBAL-004/SALE-001/PAY-001..002: failed payment completion leaves no
domain effect”.

## Coverage matrix

The matrix below maps the canonical requirement/invariant to at least one
executable test. `DV` means `src/domain/domainVerification.test.ts`. Existing
focused tests remain authoritative for their module-specific edge cases.

| Requirement         | Invariant                                                            | Executable test                                                                                                                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H01 INV-GLOBAL-001  | Durable explainability                                               | DV: “INV-TENANT-001/AUDIT-001: keeps business scope and attribution on authoritative records”; `src/audit.test.ts`: “records consequential evidence with stable identity and queryable tenant scope”                                                                                           |
| H01 INV-GLOBAL-002  | No silent historical destruction                                     | DV: “INV-CORR-001..003/GLOBAL-003: preserves correction lineage and downstream relationships”; `src/domain/returnsCorrections.test.ts`: “records a controlled reversal without deleting sale history”                                                                                          |
| H01 INV-GLOBAL-003  | Corrections preserve lineage                                         | DV: “INV-CORR-001..003/GLOBAL-003: preserves correction lineage and downstream relationships”; `src/audit.test.ts`: “links corrections and recovery while preserving the original event”                                                                                                       |
| H01 INV-GLOBAL-004  | Denied actions have no business effect                               | DV: “INV-GLOBAL-004/SALE-001/PAY-001..002: failed payment completion leaves no domain effect” and “INV-GLOBAL-004/CORR-003/TENANT-001: denies unauthorized consequential operations without effects”; `src/auth/auth.test.ts`: “rechecks authorization when the API is invoked without the UI” |
| H01 INV-TENANT-001  | Business isolation                                                   | DV: “INV-TENANT-001/AUDIT-001: keeps business scope and attribution on authoritative records”; `src/auth/auth.test.ts`: “denies access to another business even when membership exists”                                                                                                        |
| H01 INV-SALE-001    | Completion requires valid completion conditions                      | DV: “INV-SALE/PAY/SYNC: separates completion, payment and synchronization states” and “failed payment completion leaves no domain effect”                                                                                                                                                      |
| H01 INV-SALE-002    | One logical sale completion                                          | DV: “INV-SALE-002/SYNC-003: duplicate sale and correction submissions create one effect”                                                                                                                                                                                                       |
| H01 INV-SALE-003    | Historical sale values are preserved                                 | `src/domain/catalogPricing.test.ts`: “keeps completed sale pricing immutable after product price edits”                                                                                                                                                                                        |
| H01 INV-PAY-001     | Attempt is not success                                               | DV: “failed payment completion leaves no domain effect”; `src/domain/sales.test.ts`: “supports non-cash and split payments but rejects unconfirmed or mismatched amounts”                                                                                                                      |
| H01 INV-PAY-002     | Completion cannot rely on unconfirmed external payment               | DV: “failed payment completion leaves no domain effect”; `src/domain/sales.test.ts`: same unconfirmed-transfer test                                                                                                                                                                            |
| H01 INV-PAY-003     | External money movement is not fabricated                            | `src/domain/sales.test.ts`: “supports non-cash and split payments…” verifies explicit confirmation only; no payment-provider execution exists in the domain                                                                                                                                    |
| H01 INV-CREDIT-001  | Debt is event-created                                                | DV: “INV-CREDIT-001..003: creates debt only from approved events and tracks reductions separately”                                                                                                                                                                                             |
| H01 INV-CREDIT-002  | Credit equals the approved credit component                          | `src/domain/sales.test.ts`: “requires customer identity and separate management approval for credit”; `src/domain/customersCredit.test.ts`: “requires management approval for every credit sale…”                                                                                              |
| H01 INV-CREDIT-003  | Debt is distinct from cash                                           | DV: “INV-CASH-001..004/DAY-001..002…” verifies cash expected value excludes the transfer and credit components                                                                                                                                                                                 |
| H01 INV-INV-001     | Stock changes have source events                                     | DV: “INV-INV-001..004: derives stock from movements and preserves historical COGS”                                                                                                                                                                                                             |
| H01 INV-INV-002     | Negative stock is exceptional                                        | DV: “INV-INV-001..004…” asserts negative stock, exception state and provisional quantity                                                                                                                                                                                                       |
| H01 INV-INV-003     | No fabricated cost                                                   | DV: “INV-INV-001..004…” keeps provisional quantity explicit and COGS zero for the unknown portion; `src/domain/finance.test.ts`: “does not invent COGS when stock has no reliable positive cost basis”                                                                                         |
| H01 INV-INV-004     | Weighted-average costing; later costs do not rewrite historical COGS | DV: “INV-FIN/MONEY/INV-004…” and “INV-INV-001..004…”                                                                                                                                                                                                                                           |
| H01 INV-INV-005     | Physical count is evidence and does not overwrite the ledger         | **Partial executable coverage / implementation gap:** `src/domain/inventory.test.ts`: “supports adjustments and historical reconstruction” proves no silent quantity overwrite, but no physical-stock-count observation command exists in the domain engine                                    |
| H01 INV-RETURN-001  | Return is separate from original sale                                | DV: “INV-RETURN-001..003: links approved returns to original sales and keeps refunds separate”                                                                                                                                                                                                 |
| H01 INV-RETURN-002  | Approved return only                                                 | DV: “INV-GLOBAL-004/CORR-003/TENANT-001…” denies staff approval without effects; `src/domain/returnsCorrections.test.ts`: “rejects unauthorized return approval without changing the return state”                                                                                             |
| H01 INV-RETURN-003  | Refund is distinct from return                                       | DV: “INV-RETURN-001..003…” applies goods return first, then records and settles the due refund separately                                                                                                                                                                                      |
| H01 INV-SUP-001     | Receipt creates inventory                                            | `src/domain/purchasing.test.ts`: “receives purchases into inventory and keeps supplier liability separate from payments”                                                                                                                                                                       |
| H01 INV-SUP-002     | Supplier liability is distinct from expense                          | `src/domain/purchasing.test.ts`: same receiving/liability test and “reduces unpaid payable on an approved supplier return”                                                                                                                                                                     |
| H01 INV-CASH-001    | Expected Cash is derived                                             | DV: “INV-CASH-001..004/DAY-001..002…”; `src/domain/cashReconciliation.test.ts`: “derives Expected Cash from confirmed cash-affecting events only”                                                                                                                                              |
| H01 INV-CASH-002    | Non-cash does not increase physical cash                             | DV: “INV-CASH-001..004…” records only the cash component of a split cash/transfer sale                                                                                                                                                                                                         |
| H01 INV-CASH-003    | Actual Cash is observed                                              | DV: “INV-CASH-001..004…” records the physical count and derives variance from it                                                                                                                                                                                                               |
| H01 INV-CASH-004    | Discrepancy does not rewrite sources                                 | DV: “INV-CASH-001..004…” closes and reopens with the variance still visible; source cash events remain four immutable entries                                                                                                                                                                  |
| H01 INV-DAY-001     | Business Day is an operational session                               | DV: “INV-CASH-001..004…” records a cash event after midnight while the session remains open until official closure                                                                                                                                                                             |
| H01 INV-DAY-002     | Closure requires management confirmation                             | DV: “INV-GLOBAL-004/CORR-003/TENANT-001…” denies staff closure; DV cash test confirms management closure state                                                                                                                                                                                 |
| H01 INV-CORR-001    | Default 15-minute ordinary correction window                         | `src/domain/returnsCorrections.test.ts`: “applies an ordinary correction inside the configurable window…” and “blocks ordinary staff correction outside the 15-minute default…”                                                                                                                |
| H01 INV-CORR-002    | Material corrections are elevated                                    | `src/domain/returnsCorrections.test.ts`: “applies a material correction…”, “flags consequential Manager self-correction…”, and “requires Owner authority for high-integrity customer identity correction”                                                                                      |
| H01 INV-CORR-003    | No self-approval                                                     | DV: “INV-GLOBAL-004/CORR-003/TENANT-001…” checks `canApprove`; `src/auth/auth.test.ts`: “denies self-approval for a consequential operation”                                                                                                                                                   |
| H01 INV-INC-001     | Incentive value and volume gates are conjunctive                     | `src/domain/catalogPricing.test.ts`: “uses normal pricing and records floor-based facts” and volume-gate recalculation coverage                                                                                                                                                                |
| H01 INV-INC-002     | Returns/corrections alter incentive eligibility                      | `src/domain/returnsCorrections.test.ts`: “emits a floor-aware incentive delta on applied returns and corrections”; `src/domain/catalogPricing.test.ts`: “recalculates the volume gate after a completed sale is reversed”                                                                      |
| H01 INV-FIN-001     | Revenue, cash, receivables, payables and profit stay separate        | DV: “INV-CASH-001..004…” keeps cash, non-cash and credit distinct; `src/domain/purchasing.test.ts` keeps supplier liability separate                                                                                                                                                           |
| H01 INV-FIN-002     | Gross Profit = Net Recognized Selling Value − COGS                   | DV: “INV-FIN/MONEY/INV-004…”; `src/domain/finance.test.ts`: “calculates gross profit from net recognized selling value minus COGS”                                                                                                                                                             |
| H01 INV-MONEY-001   | Exact money and nearest-kobo precision                               | DV: “INV-FIN/MONEY/INV-004…” tests half-up kobo rounding and exact bigint minor units                                                                                                                                                                                                          |
| H01 INV-SYNC-001    | Offline is not automatically authoritative                           | `src/domain/stateMachines.test.ts`: “keeps synchronization state separate and retryable”; `src/sync/offlineSync.test.ts`: “durably persists stable identities and recovers after app restart”                                                                                                  |
| H01 INV-SYNC-002    | Offline does not bypass authority                                    | `src/sync/offlineSync.test.ts`: “rechecks authorization at the server and records rejection”; `src/auth/auth.test.ts`: “does not grant a new permission while offline”                                                                                                                         |
| H01 INV-SYNC-003    | One logical client event creates one accepted effect                 | DV: “INV-SALE-002/SYNC-003…”; `src/sync/offlineSync.test.ts`: “retries timeout after server acceptance without a duplicate effect”                                                                                                                                                             |
| H01 INV-SYNC-004    | No silent conflict overwrite                                         | `src/sync/offlineSync.test.ts`: “escalates material conflicts and requires separate human resolution” and “preserves causal cycles as conflicts instead of inventing an order”                                                                                                                 |
| H01 INV-AUDIT-001   | Consequential attribution                                            | DV: “INV-TENANT-001/AUDIT-001…”; `src/audit.test.ts`: “normalizes authorization evidence with actor, session, and device context”                                                                                                                                                              |
| H01 INV-XDOMAIN-001 | Cross-domain ownership                                               | DV correction/return tests reach inventory, credit and reporting only through owning engines and retain downstream IDs; `src/domain/returnsCorrections.test.ts` module coverage                                                                                                                |

## Authorization and tenant boundaries

The suite verifies domain-side role gates for management-only reversal, return
approval, reconciliation closure and material correction, plus separate-approval
semantics. It also verifies business-scoped sale, customer, credit, cash and
return lookups.

The in-memory inventory and purchasing cores are still designed to sit behind
the authoritative `executeAuthorized` session/business adapter and durable
persistence boundary. Their public read helpers are not independently
tenant-authorizing APIs; the existing `src/auth/auth.test.ts` cross-business
test is the executable outer-boundary proof. A production adapter must not
expose those engines without active-business enforcement.

## Historical and audit behavior

The new tests retain the original sale snapshot after corrections and returns,
verify downstream inventory/report/credit identifiers, and confirm that failed
or unauthorized operations leave no domain mutation. The shared audit boundary
continues to own denial/failure evidence and normalized actor/session/device
context.

## Files changed

- `src/domain/catalogPricing.ts`
- `src/domain/sales.ts`
- `src/domain/domainVerification.test.ts`
- `docs/build/HANDOFFS/26-domain-testing.md`
- `docs/build/BUILD-STATUS.md`

## Validation

```text
npm ci                                      PASS (252 packages added, 0 vulnerabilities)
npm run format:check                        PASS
npm run lint                               PASS
npm test                                     PASS (25 files, 252 tests)
npm run build                                PASS (TypeScript + Vite)
npx tsc -b --pretty false                    PASS
npx vitest run src/domain/domainVerification.test.ts
                                             PASS (11 tests)
npx prettier --check <changed source files>  PASS
git diff --check                             PASS
```

## Genuine gaps surfaced

1. **Physical inventory count workflow is not implemented.** B06 requires a
   physical count to become an inventory discrepancy/investigation before any
   correction. The current engine supports adjustments but has no count command
   or discrepancy state. The adjustment test is only partial coverage.
2. **Provisional negative-stock COGS resolution is not implemented.** B06 allows
   a transparent cost-resolution adjustment when reliable acquisition information
   later becomes available. The current engine preserves provisional quantity
   and historical COGS but does not settle the provisional cost. Durable
   adapter/integration work remains required.
3. **Cash closure wording is inconsistent across specifications.** H01 says
   closure requires “explanations”; H02 and Handoff 12 explicitly allow an
   unresolved discrepancy to coexist with `closed`. The implementation follows
   the latter and the new test preserves the unresolved variance. Product should
   decide whether “explanation” means mandatory resolution before closure or
   management-owned closure with an open investigation.
4. **Cash integration is not automatic.** The cash engine records explicit cash
   events; it does not consume completed sale payments or refund settlements.
   The new test demonstrates the boundary manually. A downstream integration
   adapter is still required.
5. **Durable multi-domain atomicity is not provided by the in-memory engines.**
   Payment/pricing validation now fails before any line is recorded, but a
   durable transaction is still required for multi-line inventory writes and
   persisted cross-domain effects.

## Known limitations

- This is an in-memory domain verification suite, not a persistence, API or
  end-to-end UI test.
- Cryptographic audit hash-chain verification remains downstream.
- Payment-provider execution/verification is intentionally absent; the domain
  records explicit confirmation evidence only.
- No incentive payout logic was added.
- The suite does not rewrite or reinterpret unresolved product decisions.

## Next integration step

Use this suite as the standing regression gate for the domain engines. The next
integration slice should connect the durable persistence/authorization adapter
and extend these scenarios with transactional multi-domain persistence, tenant
enforcement, and audit projection storage without changing the business rules.

## Excluded modules

- Durable PostgreSQL/API/offline-sync adapters.
- Authentication provider integration.
- Incentive payout and release.
- General ledger/accounting classification.
- Supplier purchase-order workflows beyond the implemented receiving model.
