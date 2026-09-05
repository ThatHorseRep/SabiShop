# Sabi Shop --- Deployment & Operations Specification

**Phase:** 6 --- Technical Build Specification\
**Status:** Working Specification

## 1. Environments

Maintain separate development, test/staging and production environments
where practical.

## 2. Configuration

Environment-specific configuration must be externalized. Secrets must
never be committed to source control.

## 3. CI/CD

Production releases should pass: - automated tests; - type/build
checks; - migration validation; - security checks where configured; -
release acceptance checks.

## 4. Database Changes

All schema changes require versioned migrations and
rollback/forward-recovery consideration.

## 5. Monitoring

Production monitoring should cover application health, backend health,
synchronization, errors, integrity alerts and backup status.

## 6. Incident Response

Incidents affecting financial truth, synchronization, security or data
integrity receive priority over cosmetic defects.

## 7. Release

Each release should have: - version; - change summary; - migration
status; - known issues; - rollback/recovery plan; - acceptance status.

## 8. Rollback

Rollback must not blindly revert accepted financial events. Application
rollback and data rollback are separate decisions.

## 9. Support

Operational support should capture reproducible context without asking
users to manually reconstruct technical logs.

## 10. Training

Operational documentation should explain ordinary workflows and
escalation paths in user-understandable language.
