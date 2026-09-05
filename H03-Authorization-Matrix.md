# H03 — Authorization Matrix

**Status:** Pre-build hardening draft

## 1. Authorization model

Authorization is contextual:

`Identity + Business + Role + Permission + Operation + Target + State + Severity + Approval Requirement + Device/Sync Context`

Screen visibility is never sufficient authority.

## 2. Role baseline

| Capability                            | Staff               | Manager                           | Owner                    |
|---------------------------------------|---------------------|-----------------------------------|--------------------------|
| Normal sale                           | Yes                 | Yes                               | Yes                      |
| Customer lookup                       | Yes, scoped         | Yes                               | Yes                      |
| Normal repayment                      | Yes where permitted | Yes                               | Yes                      |
| Inventory receiving                   | Configurable        | Yes where assigned                | Yes                      |
| Cash-in/out                           | Policy-dependent    | Yes where assigned                | Yes                      |
| Reconciliation preparation            | Yes where allowed   | Yes                               | Yes                      |
| Official day closure                  | No                  | Yes                               | Yes                      |
| Material correction                   | No                  | Request/limited                   | Yes                      |
| Consequential Manager self-correction | N/A                 | Restricted + Owner flag/review    | Yes                      |
| Return approval                       | No                  | Yes where authorized              | Yes                      |
| Permission administration             | No                  | Configurable/limited              | Yes                      |
| Business membership administration    | No                  | No unless explicitly delegated    | Yes                      |
| Cross-business access                 | Never               | Never without explicit membership | Never without membership |
| Audit review                          | Limited             | Yes where permitted               | Yes                      |

This is a hardening baseline, not a replacement for the final
operation-level permission catalogue.

## 3. Separation of duties

Where an operation requires independent approval:

`requester != approver`

Self-approval is forbidden.

This applies especially to consequential:

- corrections;
- permission changes;
- return approvals;
- credit exceptions;
- high-risk cash actions;
- integrity remediation.

## 4. Permission dimensions

Each permission should identify:

- permission ID;
- operation;
- resource;
- scope;
- allowed roles;
- state prerequisites;
- approval requirement;
- self-approval rule;
- offline behavior;
- audit requirement;
- escalation target.

## 5. Enforcement

Authorization must be enforced server-side/domain-side.

The UI may hide unavailable actions, but hidden UI is not a security
control.

Offline clients must use the same effective authority rules available to
them and must not grant new authority because connectivity is absent.

## 6. Denial contract

A denied action:

- produces no business mutation;
- returns a stable machine-readable error;
- provides a safe human-readable explanation;
- is auditable when security-sensitive;
- does not create a fake transaction.

## 7. Finalization requirement

The exact permission IDs and every operation/resource combination must
be enumerated before production implementation.
