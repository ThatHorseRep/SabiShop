# Sabi Shop --- Security, Identity & Session Rules

**Phase:** 4 --- Control & Reliability\
**Status:** Working Specification

## 1. Purpose

Define identity, session, business isolation and account-security
requirements.

## 2. Identity

Each person has a unique user identity. A user may belong to multiple
businesses and must switch business context explicitly.

## 3. Business Isolation

Every business-owned record is scoped to its business. Queries, writes,
cached records and synchronization must enforce this boundary.

## 4. Authentication

V1 should support a low-friction authentication mechanism appropriate to
Nigerian small-business use, while avoiding shared unrestricted
credentials. Exact credential technology belongs to the technical
implementation decision.

## 5. Sessions

Sessions must: - expire or reauthenticate according to risk; - be
revocable; - identify the active user and business; - not silently
change business context.

## 6. Device Risk

A lost or stolen device must not provide indefinite access.
Account/session revocation must be possible.

## 7. Authorization

Authentication answers "who are you?" Authorization answers "what may
you do here?" B09 remains authoritative for business permissions.

## 8. Sensitive Actions

Sensitive actions should require appropriate reauthentication or
management authorization where the threat model warrants it.

## 9. Local Data

Offline data must be minimized to what the device needs. Sensitive
records should not be exposed to unauthorized users sharing the device.

## 10. Security Events

Record relevant authentication, authorization, session and
security-state events without exposing secrets.

## 11. Secrets

API keys and service credentials must never be embedded in
client-visible source. Environment-specific secrets belong in managed
secret storage.

## 12. Recovery

Account recovery must not become an authorization bypass. Recovery
procedures must preserve business ownership and auditability.
