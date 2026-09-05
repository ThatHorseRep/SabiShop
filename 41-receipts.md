# Sabi Shop --- Receipts Specification

**Phase:** 5 --- Product Experience\
**Status:** Working Specification

## 1. Purpose

Provide a trustworthy customer-facing record of a completed sale or
relevant payment event.

## 2. Receipt Truth

A receipt must reflect the accepted transaction state at the time it is
generated.

## 3. Sale Receipt Content

As applicable: - business identity; - transaction reference; -
date/time; - products; - quantities; - selling prices; - discounts; -
total; - confirmed payment methods; - credit amount where applicable; -
relevant customer information; - salesperson/shift reference where
appropriate.

## 4. Payment Status

Unconfirmed payment attempts must never be presented as successful
payment.

## 5. Returns

A return does not erase the original receipt. A return/refund document
references the original transaction and states the accepted
return/refund effect.

## 6. Corrections

Corrected transactions must retain traceability to the original record.
Reissued receipts should make the current accepted state clear without
pretending the original event never existed.

## 7. Delivery

V1 may support on-screen/share/print-friendly receipts. Dedicated
external messaging/printing integrations remain separate decisions.

## 8. Offline

A locally completed sale may produce a local receipt marked according to
synchronization state where necessary.
