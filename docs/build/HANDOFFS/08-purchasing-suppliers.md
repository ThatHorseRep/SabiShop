# Handoff 08 - Purchasing & Suppliers

**Module:** M09 purchasing, supplier liabilities, receiving and supplier returns  
**Status:** Implemented and verified in-memory domain slice

## Outcome

`src/domain/purchasing.ts` adds a purchasing boundary over the inventory
movement ledger. It supports supplier profiles, received purchase records,
multiple supplier payments, supplier return history, supplier credit,
replacement receipts, and separate supplier settlement events.

Receiving a purchase appends one inventory receipt per line. An unreceived
purchase intention is not represented. Historical purchase lines preserve
supplier, quantity, unit cost and receipt event identity.

## Canonical return semantics

- An unpaid purchase return produces an approved payable reduction.
- A return against a fully paid purchase produces supplier credit/receivable;
  it does not fabricate a cash refund.
- Replacement goods are appended as separate inventory receipt events.
- A refund or credit-note settlement is a separate settlement event and only a
  confirmed-success settlement changes the derived supplier balance.
- Return application is separate from verification, approval and settlement.

Inventory remains authoritative for stock movements and weighted-average
valuation. Supplier accounting keeps obligations, payments, return reductions,
credits and settlements distinct.

## Authorization and tenant boundary

The domain core accepts already-authorized commands. Management-only permission
vocabulary was added for `supplier:manage`, `purchase:record`,
`supplier:payment`, `supplier:return`, and `supplier:settlement`; Manager and
Owner roles receive these permissions, while Staff do not. Persistence/API
adapters must enforce active business context, RLS/tenant isolation, approval,
and audit recording before calling the core.

## History and audit behavior

Purchase, payment, return, replacement and settlement records are retained as
separate records. Client event IDs make purchase and payment retries idempotent;
inventory keeps its own event idempotency boundary.

## Tests and validation

`src/domain/purchasing.test.ts` covers receiving and liability calculation,
unpaid-return payable reduction, paid-return supplier credit, separate
replacement receipt, separate settlement state, retry idempotency, immutable
history snapshots, and invalid-command no-effect behavior. The authorization
test suite covers staff denial and management authorization for purchasing.
Existing inventory and finance tests cover weighted-average valuation and
supplier-balance/reporting primitives consumed by this slice.

Final repository checks:

- `npm test` - PASS (48 tests)
- `npx tsc -b --pretty false` - PASS
- `npm run lint` - PASS
- `npm run build` - PASS
- `npx prettier --check` on changed files - PASS
- `git diff --check` - PASS

The repository CI formatter gate is scoped to this slice's implementation,
authorization integration, tests, and handoff/status files. The legacy
repository-wide formatter list contains unrelated pre-existing drift and is
not rewritten as part of this slice.

## Known limitations and excluded modules

This is an in-memory domain slice. Durable PostgreSQL persistence/RLS,
authorization middleware and approval service, offline conflict resolution,
financial report projections, cash execution, and UI/API envelopes remain
downstream. Supplier payment and settlement methods are recorded facts; the
application does not execute external money movement. Purchase corrections and
advanced purchase orders are intentionally excluded from V1. Saved-data
coverage is limited to append-only in-memory records and defensive snapshots;
durable persistence validation remains a database-adapter responsibility.
Unresolved technical decisions remain the documented persistence schema, API
envelope, sync conflict policy, and exact Owner-versus-Manager approval split.
