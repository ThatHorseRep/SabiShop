# H04 — Tenant Isolation Specification

**Status:** Pre-build hardening draft

## 1. Definition

A Sabi Shop Business is the primary ownership boundary for business
data.

A user may belong to multiple businesses. Membership in one business
does not imply access to another.

## 2. Mandatory ownership

Every business-owned entity must carry or inherit an unambiguous
`business_id` boundary.

At minimum this applies to:

- users/memberships;
- products/SKUs;
- sales;
- sale lines;
- payments;
- customers;
- debts;
- repayments;
- suppliers;
- purchases/receipts;
- inventory movements;
- returns;
- corrections;
- cash sessions;
- cash counts;
- reconciliations;
- authorization requests;
- audit events;
- sync operations;
- devices;
- reporting projections.

## 3. Request rule

Every request resolving a business-owned resource must establish:

`authenticated_user → active_business → membership/permission → target_business`

The target business must equal the authorized active business unless an
explicitly defined system-level operation says otherwise.

## 4. Database enforcement

Where practical:

- foreign keys should include business context;
- unique constraints should include business scope where the identifier
  is business-local;
- queries should be business-scoped by construction;
- service methods should require business context;
- direct unrestricted repository methods for business data should be
  prohibited or tightly isolated.

## 5. Cross-business tests

Test:

1.  read another business’s sale;
2.  update another business’s product;
3.  infer another business’s customer;
4.  submit a payment against another business;
5.  replay an event using another business ID;
6.  access another business’s report;
7.  manipulate a cross-business authorization request;
8.  sync a local event against the wrong business.

All must fail without leaking sensitive data.

## 6. Business switching

Business switching must establish a new explicit active context and
re-evaluate permissions.

Previously loaded data from another business must not remain actionable
after switching context.

## 7. Audit

Cross-business authorization failures that are security-sensitive should
be retained as security/audit evidence without exposing the protected
target’s data.

## 8. Build gate

Tenant isolation is P0. No production release is acceptable if a normal
user can access or mutate another business through an API, local-state
replay, deep link, search endpoint, synchronization endpoint or report
query.
