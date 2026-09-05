# Sabi Shop — Corpus Reconciliation Report

## Scope

Reviewed the 58 embedded Markdown artifacts in `53-source-corpus.md` and reconciled confirmed decisions across business rules, UX, financial, technical, QA, and historical documents.

## Resolved contradictions

1. Weighted-average inventory costing is canonical; historical COGS remains stable.
2. Negative stock is permitted operationally but is an explicit management exception.
3. Staff cash workflow uses physical counting at reconciliation; no routine Actual Cash dashboard field.
4. Cash in Hand is the operational/dashboard term.
5. Adaptive hybrid navigation is the resolved shell direction; old unresolved-navigation labels are stale.
6. Supplier-return accounting follows unpaid-payable vs paid-credit semantics.
7. Gross profit is Net Recognized Selling Value minus COGS, eliminating double discount subtraction.
8. Incentives now require both a floor-based value gate and a minimum completed-sales volume gate.
9. Tax/VAT is first-class V1 financial data.
10. Business day is an operational session that may cross midnight.
11. Shared and individual cash custody are both supported settings.
12. Legacy Firebase/single-shop specifications are explicitly superseded.

## Professional AI tooling recommendation

For the actual repository/specification audit loop, use a Git-backed coding agent with evidence-gated review. The open-source AUDIT.md framework is designed to run rigorous audits with Claude Code, Cursor, Gemini CLI, Codex CLI, or Windsurf and to gate changes on evidence/tests. urlAUDIT.md frameworkhttps://github.com/cyberskill-official/code-audit-framework

For a dedicated structured requirements layer, Specsource is a strong fit for this project because it models features, decisions, constraints, glossary terms, acceptance criteria, and agent instructions and exposes them to MCP-compatible coding agents. urlSpecsource documentationhttps://specsource.dev/en/platform/ai-agent-documentation

## Remaining work

Remaining work is predominantly technical/design finalization: exact API contracts, identifiers, sync algorithms, visual tokens/breakpoints, route names, and other implementation-level details intentionally delegated by the corpus. These should be finalized in their authoritative documents and propagated into developer handoff and QA without reopening resolved business decisions.


## Second-pass normalization

The affected documents were normalized in-place so resolved business decisions are part of their primary bodies rather than relying on reconciliation appendices. Superseded historical material remains isolated in the `94`–`99` reference range. Downstream acceptance, QA, failure-testing, and scenario artifacts now explicitly cover the reconciled financial, cash, inventory, correction, payment, supplier-return, business-day, and incentive rules.
