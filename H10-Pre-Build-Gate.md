# H10 — Pre-Build Readiness Gate

**Status:** Final gate template; execute after H11 clarification
consolidation

## Gate 0 — Scope

- [ ] V1 boundary is explicit.
- [ ] Historical specifications are marked superseded.
- [ ] No P0 feature depends on an unresolved product decision.

## Gate 1 — Business truth

- [ ] All consequential business rules have invariant IDs.
- [ ] All material lifecycle states are explicit.
- [ ] Illegal transitions are defined.
- [ ] Financial metrics have canonical contracts.
- [ ] Returns, corrections and reversals preserve history.

## Gate 2 — Data

- [ ] Business ownership is explicit.
- [ ] Foreign keys and uniqueness rules are defined.
- [ ] Historical snapshots are defined where required.
- [ ] Derived state is distinguishable from authoritative state.
- [ ] Deletion/retention rules protect evidence.
- [ ] Exact financial representation is fixed.

## Gate 3 — Authorization

- [ ] Operation-level permission matrix is complete.
- [ ] Server/domain enforcement is specified.
- [ ] Self-approval rules are explicit.
- [ ] Offline authorization behavior is explicit.
- [ ] Permission revocation behavior is explicit.

## Gate 4 — Transactions

- [ ] Sale lifecycle is complete.
- [ ] Payment lifecycle is complete.
- [ ] Credit lifecycle is complete.
- [ ] Return lifecycle is complete.
- [ ] Correction lifecycle is complete.
- [ ] Cross-domain atomicity boundaries are defined.
- [ ] Idempotency is defined.

## Gate 5 — Offline/sync

- [ ] Local event identity is fixed.
- [ ] Retry behavior is fixed.
- [ ] Ordering rules are fixed.
- [ ] Conflict classes are fixed.
- [ ] Recovery behavior is fixed.
- [ ] Duplicate delivery is tested.
- [ ] Interrupted operations are tested.

## Gate 6 — Security

- [ ] Tenant isolation is enforced.
- [ ] Threat-to-control mapping is complete.
- [ ] Audit evidence is protected.
- [ ] Device/session risk is covered.
- [ ] Sensitive operations fail safely.

## Gate 7 — Reliability

- [ ] Failure matrix exists.
- [ ] Backup policy exists.
- [ ] Disaster recovery plan exists.
- [ ] Restore procedure is tested.
- [ ] RPO/RTO are explicitly approved.
- [ ] Monitoring/alerting requirements are defined.

## Gate 8 — QA

- [ ] Requirement traceability is complete.
- [ ] Unit tests cover domain invariants.
- [ ] Integration tests cover cross-domain effects.
- [ ] E2E covers critical journeys.
- [ ] Offline matrix is covered.
- [ ] Permission matrix is covered.
- [ ] Financial accuracy suite is independent.
- [ ] Security tests are executable.
- [ ] Recovery tests are executable.

## Gate 9 — Documentation

- [ ] H01–H11 consolidated.
- [ ] D-series contracts agree with business rules.
- [ ] C-series UX does not contradict technical state.
- [ ] F-series tests map to invariants.
- [ ] No contradictory historical artifact is treated as current
  authority.

## Release decision

### BUILD-READY

All P0 gates pass and all remaining open items are non-blocking
implementation details.

### CONDITIONAL

Only explicitly approved non-P0 items remain.

### NOT READY

Any unresolved item can cause incorrect money, stock, debt,
authorization, tenant isolation, historical integrity, or
synchronization behavior.

## Hard rule

Do not start production feature implementation merely because screens
can be built.

The build gate is passed only when the system’s consequential behavior
can be explained, enforced, recovered and tested.
