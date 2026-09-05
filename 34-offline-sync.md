# Sabi Shop --- Offline & Synchronization Specification

**Phase:** 4 --- Control & Reliability\
**Status:** Working Specification

## 1. Purpose

Define how Sabi Shop continues core work without connectivity and later
converges devices without duplicate, destructive or silent changes.

## 2. Offline-First Principle

Core shop operations must remain usable offline. Local writes are
durable before synchronization is attempted.

## 3. Identity

Every business event receives a globally unique event/record identifier
at creation. Device identity is distinct from user identity.

## 4. Local State

Each local record carries enough metadata to distinguish: - local
creation; - pending synchronization; - synchronized; - retry required; -
conflict; - rejected/invalid; - superseded/derived state where
applicable.

## 5. Synchronization

Synchronization is retryable and idempotent. Replaying the same event
must not create a second business event.

## 6. Ordering

Events retain creation metadata and causal relationships. The server
must not rely on client wall-clock time alone to establish financial
truth.

## 7. Inventory

Inventory changes are event-based. Concurrent offline movements must not
be resolved by naïve quantity overwrites. The authoritative inventory
balance is derived from accepted movements.

## 8. Conflicts

A conflict must never silently overwrite an accepted consequential
record. The system should: 1. preserve both relevant evidence; 2.
identify the conflict; 3. determine whether automatic safe resolution is
possible; 4. otherwise place it into management review.

## 9. Offline Approvals

Offline permissions remain subject to the same authorization rules.
Actions requiring later verification must be clearly marked.

## 10. Failed Sync

Failed synchronization must remain visible without blocking safe local
work. Retries must be bounded and observable.

## 11. Duplicate Prevention

The same client event submitted multiple times must resolve to one
accepted event.

## 12. Recovery

After device reconnection or reinstall, the system must not fabricate
missing business events. Recovery must be based on synchronized
authoritative records and documented local recovery mechanisms.

## 13. User Experience

The UI must clearly distinguish: - saved locally; - synchronized; -
pending; - conflict; - failed; - requires review.

## 14. Integrity

Synchronization must preserve audit history and must not bypass
permissions or correction rules.
