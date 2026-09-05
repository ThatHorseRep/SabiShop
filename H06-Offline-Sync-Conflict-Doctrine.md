# H06 — Offline, Synchronization & Conflict Doctrine

**Status:** Pre-build hardening draft

## 1. Doctrine

Offline mode preserves operational continuity without pretending local
state is automatically authoritative.

## 2. Required state dimensions

Keep distinct:

- local persistence state;
- business lifecycle state;
- payment state;
- authorization state;
- server acceptance state;
- synchronization state;
- conflict state.

Do not encode these into one status field.

## 3. Client event identity

Every offline-capable consequential operation requires a
client-generated stable event/idempotency identity.

The exact format remains a technical decision, but the identity must
survive retries and reconnects.

## 4. Idempotency

For one logical client event:

`Repeated delivery → same accepted result`

Never:

`Repeated delivery → duplicate sale/payment/debt/stock effect`

The server must persist enough information to recognize
already-processed events.

## 5. Ordering

Events that have explicit causal dependencies must preserve their
dependency relationship.

Example:

`Sale completion → inventory movement`

`Credit sale → debt obligation`

`Return approval → return effects`

If causal order cannot be established safely, the system must preserve
the conflict rather than invent order.

## 6. Conflict classes

### Safe automatic resolution

Only for conflicts where both business meaning and resulting state are
deterministic and lossless.

### Review-required conflict

Use management review where competing events could change:

- money;
- stock;
- debt;
- attribution;
- permissions;
- historical truth.

### Integrity conflict

Potential tampering, impossible state or corrupted evidence must be
escalated and not silently merged.

## 7. Conflict handling

`Detect → Preserve evidence → Classify → Resolve safely or escalate → Record resolution → Reconcile derived state`

Never use a generic destructive “merge” operation for consequential
conflicts.

## 8. Retry doctrine

Retryable failures may retry with the same idempotency identity.

A new idempotency identity means a new logical operation and must not be
used merely because the first request timed out.

## 9. Interrupted operations

If the app is killed during a consequential operation:

- recover the durable local operation state;
- do not assume success from UI completion;
- resume/reconcile using the same event identity;
- preserve evidence of the interruption where useful.

## 10. Offline authorization

Offline mode does not grant new permissions.

Operations that cannot be safely authorized offline must remain
pending/restricted until authority can be established.

## 11. Reconnect

Reconnect must be safe under:

- duplicate delivery;
- reordered delivery;
- partial delivery;
- server timeout;
- app restart;
- device restart;
- simultaneous edits from another device.

## 12. Recovery principle

The desired operator experience is:

> The system knows what happened, tells me what is uncertain, prevents
> me from making it worse, and gives the right person a safe way
> forward.
