> **STATUS: SUPERSEDED — HISTORICAL REFERENCE**
> Retained for historical context only. It is not an active Sabi Shop V1 specification and must not override the current B/C/D/PHASE package.

# Shop Inventory & Sales PWA — Design Spec (v1 MVP)

## 1. Overview

A mobile-first Progressive Web App (PWA) for a single shop with 1 manager and up to 2 sales staff. Works offline by default and syncs when internet is available. Zero hosting budget — built on free tiers only.

**Core promise:** record a sale or stock change instantly, even with no signal, and never lose or double-count data when it syncs later.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite, PWA (service worker + manifest) | Installable on phone/tablet, one codebase, works on any device via browser too |
| Local storage | IndexedDB via Dexie.js | Fast, reliable offline-first storage; app reads/writes locally first always |
| Backend/DB | Firebase (Firestore + Auth) | Free tier is generous for this scale; Firestore has mature built-in offline persistence and sync, which matters more than Supabase's relational niceties given the ₦0 budget and offline-first requirement |
| Auth | Firebase Auth (email/PIN-based) | Simple role field on each user doc: `manager` / `sales` |
| Hosting | Firebase Hosting (free tier) | Free SSL, free tier easily covers single-shop traffic |

No barcode scanning in v1 — manual product selection. Structure the product-select UI so a barcode scanner (using the device camera + a JS library like `html5-qrcode`) can be dropped in later without restructuring anything.

---

## 3. Data Model

### `users`
| field | type | notes |
|---|---|---|
| id | string | Firebase Auth UID |
| name | string | |
| role | 'manager' \| 'sales' | |
| pin | string (hashed) | quick login on shared tablet |
| active | boolean | manager can deactivate a staff account |

### `products`
| field | type | notes |
|---|---|---|
| id | string | |
| name | string | |
| category | string | optional |
| cost_price | number | manager-only visibility |
| sell_price | number | current price — can change over time |
| unit | string | e.g. "pcs", "kg", "pack" |
| stock_qty | number | current on-hand quantity, derived from stock_transactions but cached here for fast reads |
| low_stock_threshold | number | optional, for alerts |
| created_by, created_at | | |

### `stock_transactions` (append-only — manager only)
| field | type | notes |
|---|---|---|
| id | string | |
| product_id | string | |
| type | 'addition' \| 'removal' \| 'correction' | |
| quantity | number | positive number; type determines direction |
| note | string | e.g. supplier name, reason for removal |
| created_by | string (user id) | must be a manager |
| created_at | timestamp | |
| previous_hash | string | hash of the last record in the global audit chain (see §6) |
| record_hash | string | hash of this record, computed after previous_hash is set |

### `shifts`
| field | type | notes |
|---|---|---|
| id | string | |
| user_id | string | |
| clock_in | timestamp | |
| clock_out | timestamp \| null | |

### `sales`
| field | type | notes |
|---|---|---|
| id | string | generated client-side at creation (works offline) |
| shift_id | string | links sale to who was on duty |
| items | array of `{product_id, name, qty, sell_price_at_sale, cost_price_at_sale}` | **prices are snapshotted at time of sale** — critical for accurate profit calc even if product prices change later |
| payment_method | 'cash' \| 'transfer' \| 'pos' | |
| discount_amount | number, default 0 | manager-applied discounts |
| discount_reason | string \| null | |
| status | 'active' \| 'returned' \| 'edited' | |
| created_by | string (user id) | |
| created_at | timestamp | |
| previous_hash / record_hash | string | same chain mechanism as stock_transactions |

### `sale_edits` (append-only log, never overwrite a sale record directly)
| field | type | notes |
|---|---|---|
| id | string | |
| sale_id | string | |
| edited_by | string (user id) | |
| edited_at | timestamp | |
| change_type | 'return' \| 'price_adjustment' \| 'quantity_change' \| 'other' | |
| old_value | JSON snapshot | |
| new_value | JSON snapshot | |
| reason | string | free text, required |
| manager_acknowledged | boolean, default false | manager dashboard shows unacknowledged edits until reviewed |

> **Rule:** sales staff can create a `sale_edits` entry and update the sale's derived state, but the original sale record's core fields are never silently overwritten — the edit is always visible in the trail. This is what makes "staff can edit, but manager should know" work without complexity.

---

## 4. Roles & Permissions

| Action | Manager | Sales staff |
|---|---|---|
| View inventory & stock levels | ✅ | ✅ (read-only) |
| View cost price / profit margins | ✅ | ❌ |
| Add / remove stock | ✅ | ❌ |
| Edit product price | ✅ | ❌ |
| Record a sale | ✅ | ✅ |
| Edit/return a sale | ✅ | ✅ (creates a `sale_edits` entry) |
| Apply a discount | ✅ | ❌ (only manager can apply, per your answer) |
| View own sales history | ✅ | ✅ |
| View all staff's sales history | ✅ | ❌ |
| Add/deactivate staff accounts | ✅ | ❌ |
| View daily/weekly summary & profit/loss | ✅ | ❌ (staff sees their own totals only, not margins) |
| Clock in/out (shift) | ✅ | ✅ |

---

## 5. Offline Sync Rules

1. **Every write happens locally first** (IndexedDB), and the UI updates instantly. Nothing waits on network.
2. A background sync process pushes local records to Firestore whenever a connection is available, and pulls remote changes down.
3. **Stock quantity is never synced as an overwrite** — it's always recalculated from the sum of `stock_transactions` minus sold quantities. This means two offline sales of the same product on two different devices simply both subtract correctly when synced, instead of one silently overwriting the other.
4. Each `sale` and `stock_transaction` gets a client-generated unique ID (UUID) at creation, so a record created offline is never duplicated or lost when it syncs later.
5. A small "pending sync" indicator shows staff/manager how many records haven't synced yet — useful trust signal on a spotty connection.

---

## 6. The Hash Chain (tamper-evidence, explained simply)

**Goal:** make it obvious if any past sale or stock record was altered after the fact — without blockchain, gas fees, or external services.

**How it works:**
- Keep one running chain across all `stock_transactions` and `sales` combined (ordered by creation).
- Before saving a new record, take the `record_hash` of the immediately preceding record and store it as this record's `previous_hash`.
- Compute this record's own `record_hash` = hash of (its own data + `previous_hash`).
- To verify the whole history is intact: walk through every record in order, recompute each hash, and confirm it matches what's stored. If anything was edited after the fact, the chain breaks visibly at that point.

This is pure JavaScript (a standard hashing function like SHA-256, built into the browser's `crypto.subtle` API — no library needed) and requires no ongoing cost or external dependency. It's genuinely simple to implement: one helper function called on every write.

**Not in v1, but easy to bolt on later if you want external proof:** periodically publish just the *latest chain hash* (not any actual data) to a free service like OpenTimestamps, which anchors it to the Bitcoin blockchain for permanent, verifiable proof of when that state existed. Zero cost, no wallet needed. This is a nice-to-have for credibility (e.g. showing it in the scholarship pitch or to a skeptical business partner), not a requirement for the app to function.

---

## 7. MVP Screens

1. **Login** — PIN-based, role-aware
2. **Dashboard** (role-aware)
   - Manager: today's sales total, profit/loss, low stock alerts, unacknowledged sale edits
   - Sales staff: today's sales total (their own), quick "New Sale" button
3. **Inventory list** — search/filter, stock levels; manager sees cost price & add/remove stock buttons
4. **Add/Remove Stock** (manager only) — product, quantity, note
5. **New Sale** — product picker (manual selection), quantity, payment method, submit
6. **Sale detail / Edit / Return** — with reason field, feeds `sale_edits`
7. **Shift clock in/out**
8. **Daily/Weekly Summary** (manager only) — total sales, cash/transfer/POS breakdown, profit/loss (sell price − cost price − discounts, summed across sales), best-selling items

---

## 8. MVP Feature Checklist (v1 — build this, nothing more)

- [ ] PIN login with manager/sales roles
- [ ] Inventory list (view + manager add/edit product)
- [ ] Manager add/remove stock
- [ ] Record a sale (offline-capable)
- [ ] Edit/return a sale with reason (visible to manager)
- [ ] Manager-only discount application
- [ ] Shift clock in/out
- [ ] Daily summary with profit/loss calculation
- [ ] Offline-first sync (Firestore)
- [ ] Hash-chain on sales & stock_transactions

## 9. Explicitly Out of Scope for v1 (Phase 2 backlog)

- Barcode scanning (structure product-select UI to allow dropping this in later)
- Multi-branch/multi-shop support
- OpenTimestamps external anchoring
- Staff performance analytics/leaderboards
- Multi-currency
- Native app store builds (PWA covers this need for now)

---

## 10. Suggested Build Order (for Claude Code sessions)

1. Scaffold React + Vite PWA shell, Firebase project setup, auth + roles
2. Product & inventory CRUD (manager) + read-only view (staff)
3. Sale recording flow, offline-first with Dexie, sync logic to Firestore
4. Hash-chain helper + wire into sale/stock writes
5. Sale edit/return flow + `sale_edits` log + manager acknowledgment UI
6. Shift tracking
7. Daily summary & profit/loss dashboard
8. Polish: low-stock alerts, pending-sync indicator, PWA install prompt
