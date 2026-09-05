# Sabi Shop --- Architecture & API Specification

**Phase:** 6 --- Technical Build Specification\
**Status:** Working Specification

## 1. Architecture

Sabi Shop is an offline-first, phone-friendly application with: - client
application; - durable local data layer; - synchronization service; -
authoritative backend; - authentication/authorization; - derived
reporting/read models; - audit/integrity subsystem.

## 2. Architectural Rule

Business rules must be enforced at the authoritative service boundary,
not only by hiding UI controls.

## 3. Client

The client supports rapid local reads/writes and explicit
synchronization state.

## 4. API Principles

APIs should be: - authenticated; - business-scoped; - idempotent where
event submission can be retried; - explicit about
accepted/rejected/conflicted states; - versioned where contract changes
require it.

## 5. Core Actions

API/domain commands should cover: - create sale; - confirm payment; -
create credit sale; - record repayment; - receive purchase; - record
supplier payment; - record cash movement; - request/approve return; -
request/perform correction; - reconcile cash; - synchronize local
events; - resolve conflicts.

## 6. Read Models

Dashboards and reports may use derived views, but derived views are
never the authoritative record.

## 7. Authorization

Every consequential command evaluates role, business context and
approval requirements.

## 8. Errors

Errors distinguish validation failure, authorization denial,
duplicate/idempotent replay, conflict, unavailable dependency and
integrity failure.

## 9. Observability

Server operations expose enough telemetry to diagnose failed
synchronization, authorization failures and integrity issues without
leaking sensitive information.
