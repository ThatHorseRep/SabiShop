# H08 — Security Threat-to-Control Matrix

**Status:** Pre-build hardening draft

| Threat                             | Control                              | Enforcement              | Test                      |
|------------------------------------|--------------------------------------|--------------------------|---------------------------|
| Cross-business access              | Business scoping                     | API + DB + service layer | Cross-tenant tests        |
| Unauthorized price change          | Permission + state rules             | Server/domain            | Role matrix               |
| Unauthorized discount              | Configured authority                 | Server/domain            | Boundary tests            |
| Unauthorized credit exception      | Approval policy                      | Server/domain            | Self/other approval tests |
| Payment replay                     | Idempotency                          | Transaction layer        | Replay test               |
| Duplicate sale                     | Stable event identity                | Transaction/sync         | Duplicate delivery        |
| Local storage tampering            | Integrity validation                 | Client/server            | Tamper simulation         |
| Stolen device                      | Session/device controls              | Auth layer               | Revocation test           |
| Historical record manipulation     | Append/correction model              | Domain + DB              | Mutation tests            |
| Privilege escalation               | Least privilege + scoped permissions | Auth service             | Role abuse tests          |
| Deep-link bypass                   | Re-authorize target                  | API/server               | Unauthorized deep link    |
| Sync conflict overwrite            | Conflict doctrine                    | Sync service             | Concurrent-device test    |
| Audit deletion                     | Protected audit storage              | DB/service               | Delete attempt            |
| Sensitive data overexposure        | Field/scope authorization            | API                      | Response inspection       |
| Expired approval reuse             | Authorization expiry                 | Domain                   | Replay stale approval     |
| Manager self-approval              | Separation of duties                 | Domain                   | Self-approval test        |
| Fake external payment verification | Explicit payment states              | Payment domain           | Unverified transfer test  |

## Security principles

- Authorization is never UI-only.
- Business context is part of authorization.
- Sensitive operations fail closed.
- Security failures must not mutate business truth.
- Audit evidence is protected from ordinary business mutation.
- Offline capability cannot become an authorization bypass.
- Integrity uncertainty is visible and escalated.
