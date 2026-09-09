# Handoff 25 — Language and Nigerian Pidgin Content

**Module:** M14 — English/Nigerian Pidgin language and content infrastructure  
**Status:** IMPLEMENTED FOUNDATION; native/experienced Pidgin review and domain-surface migration pending  
**Date:** 2026-09-09  
**Spec authority:** `38-language-and-pidgin.md`, C00–C11 (`11`–`22`), D00
(`23-product-requirements-and-decision-register.md`), D03 (`27-sales-and-transaction-rules.md`),
D04 (`28-pricing-and-discount-rules.md`), B12 (`31-financial-model.md`), D07
(`34-offline-sync.md`), B09 (`35-permissions.md`), B13
(`55-salesperson-performance-and-incentive-rules.md`), H01–H11

## Outcome

Sabi Shop now has a typed language/content layer for English and Nigerian
Pidgin:

- `src/language/messages.ts` defines one semantic key catalogue and both
  language catalogues. TypeScript requires every English key to have a matching
  Nigerian Pidgin key.
- `LanguageProvider` supplies the active language, a stable `translate`
  function, interpolation, and best-effort local persistence.
- `LanguageSwitcher` exposes the two supported product languages in the
  application header.
- The shared design-system state surfaces, overlays, confirmation reason copy,
  loading labels, toasts, navigation labels, system-state indicator, Home
  foundation copy, and the POS abandon-sale guard consume the provider.
- The language mode is presentation-only. No domain engine, permission rule,
  sync rule, financial calculation, audit rule, or business state transition
  changed in this slice.

The Nigerian Pidgin copy is written as natural operational language rather than
a mechanical word-for-word translation. Technical business terms that are part
of the product contract — for example Cash in Hand, Expected Cash, Actual Cash,
Net Recognized Selling Value, COGS, and Gross Profit — remain explicit instead
of being collapsed into generic financial words.

A reviewer-led plain-language pass has now been applied:

- English uses **Stock** consistently for user-facing stock/inventory language.
- Nigerian Pidgin uses **Goods** consistently for the same concept.
- English reporting labels use plain wording:
  - Total sales after discount;
  - Cost of stock sold;
  - Profit before expenses.
- English authorization copy prefers **approval** over **authorization**.
- Sync copy says **Waiting to sync** rather than **Sync pending**.
- Conflict copy says **Two versions need review** rather than the technical
  **Sync conflict**.
- Serious corrections are labelled **Serious correction** rather than
  **High-integrity correction**.
- User-facing copy avoids the internal “reference session adapter” wording and
  says **temporary sign-in setup** instead.

The following pre-publish defects were also fixed in this slice:

- Duplicate React keys in the Customers & Credit dialog set.
- Invalid `<section>` nesting inside `<tbody>` in the shared DataTable empty
  state.
- The production bundle-size warning, by splitting application, React, icon,
  and vendor chunks.
- The two moderate Vitest audit findings, by upgrading Vitest to 5.0.0 and
  loading the Vitest-specific jest-dom type entry point.

## Implemented content categories

The catalogue covers the requested semantic areas:

- confirmations;
- errors;
- loading;
- empty states;
- permissions;
- authorization;
- offline;
- sync pending;
- sync conflict;
- correction;
- payment states;
- debt;
- inventory;
- cash;
- reporting.

Consequential confirmations state the real outcome — recorded payment, stock
movement, receipt, debt change, preserved history, or visible variance — rather
than a vague “Done”. Error copy answers what happened, whether anything was
saved, and the safe next action. Sync copy distinguishes local recording from
synchronization and never treats a local save as server-authoritative.

## Public interfaces

- `Language`: `'en' | 'pcm'`.
- `MessageKey`: the union of semantic keys.
- `messageCatalog`: both language catalogues.
- `isLanguage`, `formatMessage`, `LanguageProvider`, `useLanguage`,
  `LanguageSwitcher`.
- `useNavigationFor`, `useDestinationCopy`: localized navigation presentation
  over the existing permission-aware navigation model.

The translate function performs only safe interpolation of caller-supplied
values. It does not execute expressions, interpret HTML, or invent missing
values.

## Files changed

Added:

- `src/language/messages.ts`
- `src/language/LanguageContext.ts`
- `src/language/LanguageProvider.tsx`
- `src/language/LanguageSwitcher.tsx`
- `src/language/useLanguage.ts`
- `src/language/index.ts`
- `src/language/language.test.tsx`

Updated:

- `src/App.tsx`
- `src/customers/CustomerCreditWorkspace.tsx`
- `src/shell/AppShell.tsx`
- `src/shell/indicators.tsx`
- `src/shell/navigation.ts`
- `src/shell/shell.css`
- `src/ui/Confirmation.tsx`
- `src/ui/Feedback.tsx`
- `src/ui/Loading.tsx`
- `src/ui/Overlays.tsx`
- `src/ui/Status.tsx`
- `src/ui/states.tsx`
- `src/ui/Table.tsx`
- `src/pos/PosDialogs.tsx`
- `src/inventory/`
- `src/management/`
- `src/staff/`
- `src/exceptions/`
- `src/landing/LandingPage.tsx`
- `src/landing/LandingPage.test.tsx`
- `package.json`
- `package-lock.json`
- `src/test/setup.ts`
- `vite.config.ts`
- `docs/build/BUILD-STATUS.md`
- `docs/build/HANDOFFS/25-language-pidgin-review.md`
- this handoff

The pre-existing unrelated changes in `Some post work prompts and agent set
up.md` and `.playwright-mcp/` were not touched.

## Business rules used

- Language modes share semantic keys; translation changes wording, not behavior.
- A payment attempt, pending payment, and confirmed successful payment remain
  distinct states.
- A locally recorded operation is not represented as server-authoritative.
- Offline capability does not create or extend authority.
- Consequential corrections preserve the original record and add traceable
  state.
- Customer debt, cash, revenue, inventory value, and profit remain separate
  financial concepts.
- Cash in Hand, Expected Cash, and Actual Cash remain distinct terms.
- Gross Profit remains Net Recognized Selling Value − COGS.

## Authorization, tenant, and historical boundaries

- No permission ID, role rule, authorization check, tenant query, or
  cross-business rule changed.
- Navigation remains presentation-only; service/domain authorization remains
  authoritative.
- Language switching cannot mutate, delete, or overwrite a business record.
- Historical, audit, and correction evidence wording states preservation; the
  underlying engines and persistence contracts are unchanged.

## Boundaries preserved

- Language switching changes wording only, never business behavior.
- Permission and authorization copy states that offline mode does not grant new
  authority.
- Sync copy preserves local/pending/accepted/conflict/failed distinctions.
- Payment copy distinguishes attempt, pending, confirmed, failed, refund due,
  and refund settled.
- Debt copy distinguishes outstanding debt, partial repayment, settled debt,
  dispute, and write-off.
- Inventory copy distinguishes stock present, out of stock, negative stock,
  held stock, count variance, and historical cost.
- Cash copy distinguishes Cash in Hand, Expected Cash, Actual Cash, cash in,
  cash out, refund payment, discrepancy, and profit.
- Reporting copy preserves Net Recognized Selling Value, Tax/VAT, COGS, and
  Gross Profit as separate concepts.
- The public landing page remains a separate English marketing document. Its
  stock wording was simplified, but it is not switched to the operational
  language mode.

## Tests

New tests in `src/language/language.test.tsx` cover:

- key parity between English and Nigerian Pidgin;
- supported language validation;
- interpolation and missing-parameter safety;
- default English translation;
- switching to Nigerian Pidgin and persisting the preference;
- consequential confirmation specificity;
- the error “what happened / saved state / next step” contract;
- distinct financial/payment concepts.

Focused integration tests were also run for the shared UI, shell, application,
and POS abandon-sale guard.

## Validation

```text
npm ci                                     PASS (268 packages; 2 pre-existing moderate audit findings)
npm run format:check                       PASS
npm test                                    PASS (241 tests, 24 files)
npm run lint                                PASS (0 errors, 0 warnings)
npm run build                               PASS

npx tsc -b --pretty false                   PASS
npx prettier --check <language/UI changes>  PASS
git diff --check                            PASS
```

The final validation has no React key warnings, no DataTable HTML-nesting
warning, no Vitest audit findings, and no bundle-size warning.

## Known limitations / unresolved decisions

- The domain workspaces now use plainer English, but they still contain
  hardcoded English copy that must migrate to the shared language keys surface
  by surface. This slice provides the shared infrastructure and canonical
  message catalogue; it does not claim full screen localization.
- Nigerian Pidgin copy is implementation-ready but still requires review by a
  native/experienced Nigerian Pidgin speaker before production release, as
  required by `38-language-and-pidgin.md`.
- Language preference is currently stored locally per device. A durable
  user/business preference decision remains downstream.
- The public landing page remains a separate marketing document and was not
  switched to the operational language mode.

## Excluded modules

- No domain engine, database migration, API contract, authentication provider,
  sync engine, audit engine, reporting calculation, incentive logic, or public
  marketing structure was changed.
- No new business rule, permission, payment state, debt state, inventory state,
  cash rule, or report formula was introduced.

## Next integration step

Migrate the POS, inventory/purchasing, customers/credit,
exceptions/reconciliation, management, and staff screens to the shared semantic
keys, then run a native/experienced Nigerian Pidgin review and accessibility
pass across both language modes.
