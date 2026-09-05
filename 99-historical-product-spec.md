> **STATUS: SUPERSEDED — HISTORICAL REFERENCE**
> Retained for historical context only. It is not an active Sabi Shop V1 specification and must not override the current B/C/D/PHASE package.

# Shop Manager — Design Spec (v1 / MVP)

A mobile-first offline-capable PWA for daily sales, inventory, and staff management for a single shop, built from a market woman's perspective, in Nigerian Pidgin with an English toggle.

---

## 1. Vision

Simple, fast, works with no data. A sales girl should be able to record a sale in under 10 seconds, in Pidgin, even with zero internet. The manager should be able to see exactly what happened each day, trust the numbers, and know instantly if something was edited.

---

## 2. Roles

| Role | Count | Can do |
|---|---|---|
| **Manager** | 1 | Everything: add/remove stock, edit product prices, view cost price & profit, approve/view edited sales, give discounts, view all reports, manage staff accounts, view audit trail |
| **Sales staff** | up to 2 | Record sales, edit their own recorded sales (with reason — creates a flagged correction), record returns, view stock (read-only, no cost price), clock in/out of shift |

Max 3 user accounts total for now, but don't hardcode the limit — just don't build multi-branch logic yet.

---

## 3. Core entities (data model)

**users**
- id, name, role (`manager` / `sales`), pin_or_password, active

**products**
- id, name, category, unit (piece, kg, pack, etc.), cost_price, selling_price, quantity_in_stock, low_stock_threshold, barcode (nullable, for future), created_by, created_at

**stock_movements** (append-only — never edited or deleted)
- id, product_id, type (`addition` / `removal` / `correction`), quantity, reason (nullable), performed_by (manager only), created_at, prev_hash, hash

**sales**
- id, shift_id, sold_by, created_at, payment_method (`cash` / `transfer` / `pos`), discount_amount (nullable), discount_reason (nullable, manager only), status (`active` / `edited` / `returned`), prev_hash, hash

**sale_items**
- id, sale_id, product_id, quantity, unit_price_at_sale, subtotal

**sale_edits** (append-only log — every edit/return creates a new row here, original sale is never overwritten)
- id, sale_id, edited_by, edit_type (`quantity_change` / `return` / `discount_added` / `payment_method_change`), old_value, new_value, reason, created_at, seen_by_manager (boolean)

**shifts**
- id, user_id, clock_in, clock_out (nullable), device_id

---

## 4. The hash-chain (tamper-evidence, no blockchain needed)

Every append-only table (`stock_movements`, `sales`, `sale_edits`) gets two extra columns: `prev_hash` and `hash`.

```
hash = SHA256( record_data + prev_hash_of_last_record_in_this_table )
```

- First record in a table uses a fixed genesis string as `prev_hash`.
- On app load (or on demand), a "Verify Records" function walks the chain and recomputes hashes — if anything doesn't match, it flags exactly where the chain broke.
- This runs 100% locally, works offline, costs nothing, and needs no crypto wallet.
- **v2 idea, not MVP:** periodically send just the *latest hash* (not the data) to a free timestamping service like OpenTimestamps, as an external, independent "this existed by this date" proof. Skip this for v1 — get the local chain working first.

---

## 5. Key workflows

### Recording a sale (sales staff)
1. Pick product(s) + quantity (manual selection; barcode scan is a v2 toggle on the same screen so it drops in later without a redesign)
2. Price auto-fills from product's selling_price, editable only if a discount is applied
3. Choose payment method
4. Submit → saved locally instantly, syncs when online, stock quantity decremented locally (delta-based, not overwrite — safe for multiple offline devices)

### Editing/returning a sale (sales staff)
1. Find sale in "Today's Sales"
2. Choose: change quantity / mark as returned / note issue
3. Must give a short reason (dropdown + optional free text: "customer returned," "wrong item," "typo," etc.)
4. Original sale record is untouched — a new `sale_edits` row is created, sale status flips to `edited` or `returned`, stock is adjusted
5. Manager's dashboard shows a badge/count of unseen edits — tapping marks them seen

### Giving a discount (manager only)
- On any sale, manager can apply a discount amount + optional reason
- Logged in `sale_edits` as `discount_added` regardless of "without much thought" — the log doesn't need to be strict, just present, so the manager can see patterns later if needed

### Adding/removing stock (manager only)
- Manual entry, appended to `stock_movements`, never edits existing product history — just adds a new movement row and recalculates current quantity

### Shifts
- Sales staff clock in/out; sales are tagged with the active shift
- Manager's daily summary can be filtered by staff/shift

---

## 6. Reports (manager view)

- **Daily summary:** total sales, cash vs transfer vs POS split, total discounts given, total returns, low-stock items
- **Profit/loss (income calculation):** for each sale_item, profit = (unit_price_at_sale − cost_price at time of sale) × quantity, summed daily/weekly/monthly. Store cost_price snapshot on the sale_item at sale time (not looked up live) so historical profit stays accurate even if cost_price changes later.
- **Per-staff performance:** sales count/value per shift
- **Audit view:** list of all edits/returns/discounts, flagged unseen ones highlighted

---

## 7. Offline-first architecture

- **Local DB:** IndexedDB via Dexie.js — all reads/writes hit this first, instantly
- **Sync:** background sync to Supabase (Postgres) whenever online; each local record has a UUID generated at creation so it never collides or duplicates across devices
- **Conflict rule:** stock quantities sync as *deltas* (add/subtract), never as overwrites — two offline sales on different devices both still deduct correctly once synced
- **Any device:** manager or staff can log in (PIN or simple password) from any phone, tablet, or shop PC — session isn't tied to a device

---

## 8. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + PWA (service worker, installable) | One codebase, mobile-first, works as web app too |
| Local storage | IndexedDB (Dexie.js) | Offline-first, simple API |
| Backend/DB | Supabase (Postgres) | Free tier, easy auth, realtime sync support |
| Hosting | Vercel or Supabase (free tier) | ₦0 budget |
| i18n | Pidgin (default) + English toggle, simple key-based translation file | Matches market-woman-first vision |
| Hashing | Native Web Crypto API (`crypto.subtle.digest`) | No library needed, built into browsers |

---

## 9. MVP scope (v1 — build this first)

1. Login (manager/sales, PIN-based)
2. Product list + manager add/remove stock
3. Record a sale (manual product selection)
4. Edit/return a sale with reason (flagged for manager)
5. Manager discount on a sale
6. Shift clock in/out
7. Daily summary + profit/loss calculation
8. Hash-chain on stock_movements, sales, sale_edits + a "Verify Records" check
9. Offline-first sync
10. Pidgin/English toggle

**Explicitly v2 (do not build yet):**
- Barcode scanning (design product screen to make this a drop-in later)
- Multi-branch/location support
- OpenTimestamps external anchoring
- Customer accounts/loyalty
- Multi-currency

---

## 10. Screens list

1. Login (PIN)
2. Home / Dashboard (role-based: manager sees full summary, staff sees "record a sale" front and center)
3. Record Sale
4. Product List (manager: full detail + edit; staff: read-only stock view)
5. Add/Remove Stock (manager only)
6. Today's Sales (with edit/return action)
7. Shift clock in/out
8. Daily/Weekly Summary + Profit-Loss (manager)
9. Audit Trail / Edits Log (manager)
10. Settings (language toggle, staff management — manager only)
