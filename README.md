# Sabi Shop — Final Reconciled V1 Specification Package

**Version:** 1.0-final-reconciled-v1  
**Date:** 2026-09-04  
**Source:** 53-source-corpus.md — 58 embedded Markdown artifacts

## What this package does

This package applies the confirmed business decisions from the reconciliation checkpoint across the affected business, UX, financial, technical, QA, and handoff documents. It also explicitly marks obsolete specifications as historical so they cannot compete with the current product definition.

## Canonical outcomes

- Weighted-average inventory costing.
- Negative stock permitted operationally, but always visible as an exception requiring investigation.
- Staff do not maintain routine Actual Cash; physical cash is counted during reconciliation.
- Cash in Hand is the preferred operational/dashboard term.
- Management Business Performance includes inventory remaining/stock health alongside sales, expenses, and profit/performance.
- Correction window configurable; 15-minute V1 default.
- Incentives require both value-above-floor eligibility and a minimum completed-sales volume gate.
- Consequential Manager self-corrections are consistently flagged to Owner.
- Staff transfer confirmation is allowed after external verification and is logged/reviewable.
- Core payment methods plus configurable additional methods.
- Supplier returns have settlement-state-aware payable/credit semantics.
- Tax/VAT is first-class V1 financial data.
- Business day is an operational session and may cross midnight.
- Shared and individual cash custody are configurable.
- Gross Profit = Net Recognized Selling Value − COGS.
- Old `99-historical-product-spec.md` and `98-historical-design-spec.md` are superseded historical references.

## Remaining work

Remaining questions are primarily implementation/design details intentionally delegated by the corpus: exact API contracts, IDs, synchronization algorithms, exact visual tokens/breakpoints, route naming, and similar technical choices. These should be finalized in their authoritative documents without reopening the resolved business rules above.


## Package Structure

The numbered documents form the canonical current specification. `94`–`99` are historical/reference material and are not competing product requirements. `00-*` files are package-level governance artifacts.

The package uses a single professional filename convention: lowercase, numbered, descriptive Markdown filenames. Internal document IDs remain where they are useful for traceability, but filenames are intentionally normalized for repository and AI-agent use.
