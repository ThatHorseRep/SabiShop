# Sabi Shop --- Audit & Data Integrity Specification

**Phase:** 4 --- Control & Reliability\
**Status:** Working Specification

## 1. Purpose

Define the evidence trail required to reconstruct consequential business
activity.

## 2. Audit Principle

Historical business events are preserved. Corrections create new
evidence; they do not make the original event disappear.

## 3. Audited Events

At minimum: - completed sales; - payments and payment corrections; -
discounts; - credit authorization; - repayments; - purchases/receipts; -
supplier payments; - returns/refunds; - inventory adjustments; -
corrections; - cash movements; - reconciliation; - permission/role
changes; - offline conflict resolution; - integrity alerts; -
incentive-affecting changes.

## 4. Audit Event Content

An audit event should identify: - event ID; - business; - actor; - actor
role; - action; - target record; - timestamp; - previous accepted
state/reference where applicable; - resulting state/reference; -
reason; - authorization/approver; - device/source; - synchronization
metadata; - integrity metadata.

## 5. Immutability

Audit history is append-oriented. No normal user action may delete audit
events.

## 6. Integrity Detection

The system must be able to detect unexpected modification of protected
records. Hash-chain implementation is specified separately at the
technical layer.

## 7. Investigation

An integrity alert is an investigation signal, not an automatic
accusation.

## 8. Correction Traceability

A correction must link to the affected original record and explain: -
what was wrong; - what was requested; - who authorized it; - what
changed; - what downstream effects changed.

## 9. Reconciliation Integrity

Reopening or correcting reconciled periods requires elevated treatment
and full audit history.

## 10. Access

Staff receive only operationally necessary visibility. Managers receive
relevant investigation capability. Owners receive complete authorized
audit visibility.

## 11. Acceptance Standard

A manager/owner should be able to reconstruct the sequence of important
events without relying on deleted or overwritten records.
