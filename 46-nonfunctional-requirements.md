# Sabi Shop --- Non-Functional Requirements

**Phase:** 6 --- Technical Build Specification\
**Status:** Working Specification

## 1. Reliability

Core daily operations must remain usable during intermittent
connectivity.

## 2. Performance

Routine product search and sale interaction should feel immediate on
supported phones. Local reads/writes should not wait on the network.

## 3. Integrity

No accepted business event may be duplicated by retries or silently lost
by synchronization.

## 4. Security

Business isolation, least privilege, session control, secure secret
handling and auditability are mandatory.

## 5. Accessibility

Support readable text, sufficient touch targets, clear focus/interaction
states, meaningful labels and understandable errors.

## 6. Scalability

The architecture must comfortably support the initial reference workload
of a high-SKU small retail shop and approximately hundreds of daily
transactions without introducing enterprise complexity.

## 7. Maintainability

Business rules, domain logic and UI should be separated enough that
changing a UI does not silently alter financial truth.

## 8. Observability

Monitor: - sync success/failure; - conflict rates; - authentication
failures; - authorization denials; - integrity alerts; - API failures; -
application errors; - backup status.

## 9. Compatibility

The product is mobile-first and browser/PWA friendly. Device-specific
assumptions must be minimized.

## 10. Localization

English and Nigerian Pidgin must be supported without duplicating
business logic.

## 11. Data Durability

Persistence and backup mechanisms must support recovery objectives.

## 12. Cost

Initial architecture should remain appropriate for a small-business
product and avoid unnecessary infrastructure burden.
