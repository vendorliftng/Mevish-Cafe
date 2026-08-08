# Mevish Restaurant Management System — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Mevish RMS (Restaurant Management System) |
| **Version** | 2.0 — Firebase Rebuild |
| **Status** | Draft for build |
| **Governing UX principle** | *"A child who has never seen a computer must be able to operate it."* |
| **Companion document** | `USER-JOURNEY.md` |

---

## Table of Contents

1. [Overview](#1-overview)
2. [UX Philosophy — The Child-Simple Standard](#2-ux-philosophy--the-child-simple-standard)
3. [Personas & Roles](#3-personas--roles)
4. [System Architecture (Target: Firebase)](#4-system-architecture-target-firebase)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Model (Firestore)](#7-data-model-firestore)
8. [Migration Plan](#8-migration-plan)
9. [Out of Scope / Future](#9-out-of-scope--future)
10. [Appendix A — Current-State API Inventory (Apps Script)](#appendix-a--current-state-api-inventory-apps-script)
11. [Appendix B — Glossary](#appendix-b--glossary)

---

## 1. Overview

### 1.1 Vision
A restaurant owner's **Command Center**: one system that takes orders, tells the kitchen what to cook, tracks every naira, watches the pantry, and reports the health of the business — operable by completely non-technical staff.

### 1.2 Problem Statement
Small restaurants run on paper notebooks, memory, and guesswork: orders get lost, cash doesn't reconcile, stock runs out mid-service, and the owner has no idea which dishes actually make money. Existing POS software assumes computer literacy that real-world cashiers often don't have. Mevish solves this with a system so simple that **training is the interface itself**.

### 1.3 Product History / Why This PRD
Mevish v1 exists as static HTML pages backed by Google Apps Script + Google Sheets (`Code.gs`). It works, and a Firebase migration is **underway but incomplete** (order writes go to Firestore; status updates, tracking, reviews, loyalty, and cashier login still depend on Apps Script). This PRD specifies the **complete target system on Firebase**, so the rebuild finishes coherently rather than patch by patch.

### 1.4 Goals
- G1 — Super Admin, Manager, and Cashier workflows fully functional on Firebase (**Phase 1 — priority**).
- G2 — Zero training time for cashiers: the screen teaches itself through color, one-button cards, and sound.
- G3 — Offline-tolerant: service never stops because the internet did.
- G4 — Real money accountability: every payment attributed to a named person; every void preserved and audited.
- G5 — Customer ordering, tracking, loyalty, and reviews fully migrated (**Phase 2**).

### 1.5 Non-Goals (for this version)
- Multi-branch / franchise management.
- Online payment gateway integration (payments are *recorded*, not *processed*).
- Accounting/payroll export beyond print/PDF reports.
- Native mobile apps (the web app must work beautifully on phones/tablets instead).

### 1.6 Success Metrics
| Metric | Target |
|---|---|
| Time to train a new cashier to take an order | < 10 minutes |
| Taps to complete a walk-in order | ≤ 6 |
| Order visible on all staff screens after placement | < 2 seconds |
| Cashier cash total vs Manager audit total mismatch | 0 (every payment attributed) |
| Orders lost due to connectivity failure | 0 |
| Voided orders preserved in audit trail | 100% |

---

## 2. UX Philosophy — The Child-Simple Standard

This is not a slogan. It decomposes into **testable design rules**. Every feature in Section 5 must satisfy all of them.

| # | Rule | Test |
|---|------|------|
| UX-1 | **One button, one job.** Each card/screen has one obvious primary action. | A new user can name the next action without being told. |
| UX-2 | **Touch targets ≥ 48px** (menu tiles ≥ 120px). | Usable on a cheap tablet with dry hands, one-handed. |
| UX-3 | **Color + icon + word — never color alone.** | A colorblind user and a fast reader both parse every status. |
| UX-4 | **Sound confirms events.** New order = ding; action success = soft tone. | A user facing away from the screen knows a new order arrived. |
| UX-5 | **Destructive actions require explicit confirmation** (modal or two-tap), and everything dangerous is recoverable or attributable. | No single accidental tap can lose money or data. |
| UX-6 | **Zero typing when avoidable.** Number pads, dropdowns, tap-to-add tiles, search-as-you-type. | A full order can be placed without touching a keyboard except for the customer's name. |
| UX-7 | **The system does all math.** Totals, tax, stock, profit, change-worthy figures. | No calculator, ever. |
| UX-8 | **Plain language, large type (≥16px body).** Button labels are verbs: "Mark Ready", "Collect Cash". | No jargon ("KDS", "reconcile", "void" explained or iconed). |
| UX-9 | **Every action acknowledges itself** (toast ~3.5s + visual state change). | The user never wonders "did that work?" |
| UX-10 | **Empty and error states are friendly and instructive** ("All orders are paid — great job!"). | No blank screens, no raw error codes. |
| UX-11 | **The screen is always honest about freshness**: live indicator + last-updated time + offline banner. | Staff trust the screen instead of reloading. |
| UX-12 | **Fewer buttons per role.** People see only what their job needs. | A cashier cannot find the settings page even by exploring. |

---

## 3. Personas & Roles

### 3.1 Personas

**Ada — Cashier (primary persona).** 19, first job, has a smartphone but has never used a computer. Works the counter. Needs: take orders fast, collect money, print receipts, go home with a clean drawer. Must never be able to break anything.

**Musa — Manager.** 34, runs daily operations. Comfortable with phones. Needs: prepare the day (stock, sold-outs), watch service, close the day (money, reports, shopping list).

**Mrs. O — Super Admin / Owner.** 48, owns the restaurant. Checks in a few times a week. Needs: the truth about money and staff, control over who has access, zero dependence on "the IT person".

**Chidi — Customer (Phase 2).** Guest with a phone. No login, no app, no patience.

### 3.2 Roles & Permission Matrix

| Capability | Cashier | Manager | Super Admin |
|---|:--:|:--:|:--:|
| Log in | 4-digit PIN | Email + password | Email + password |
| Create order (walk-in) | ✅ | ✅ | ✅ |
| Advance order status (Preparing → Ready → Served) | ✅ | ✅ | ✅ |
| Collect payment (Cash / POS) | ✅ | ✅ | ✅ |
| Issue & settle credit | ✅ | ✅ | ✅ |
| Print receipt | ✅ | ✅ | ✅ |
| **Void an order** | ❌ | ✅ (two-tap confirm) | ✅ |
| View today's sales (own) | ✅ | ✅ | ✅ |
| View full analytics & reports | ❌ | ✅ | ✅ |
| Manage menu (add/edit/price/sold-out) | ❌ | ✅ | ✅ |
| Manage inventory & restock | ❌ | ✅ | ✅ |
| Record expenses | ❌ | ✅ | ✅ |
| Manage cashiers (add/edit/PIN/deactivate) | ❌ | ✅ | ✅ |
| Manage tables & QR codes | ❌ | ✅ | ✅ |
| Moderate reviews | ❌ | ✅ | ✅ |
| View audit log | ❌ | ✅ | ✅ |
| **Approve/revoke admin & manager accounts** | ❌ | ❌ | ✅ |
| **Assign roles (Admin/Manager/SuperAdmin/Revoked)** | ❌ | ❌ | ✅ |
| System settings (name, tax, tables, categories) | ❌ | ❌ | ✅ |
| Choose theme | ❌ | ✅ | ✅ |

### 3.3 Authentication Model
- **Admins/Managers:** Firebase Authentication (email + password). First registered user becomes `SuperAdmin` automatically; all subsequent registrations are created as `Pending` and signed out until a Super Admin assigns a role.
- **Cashiers:** 4-digit PIN verified **server-side** against the `staff` collection (hashed), with rate limiting on attempts. Login returns a scoped session token usable only for cashier endpoints.
- **Blog admin** (if retained): separate static PIN, unchanged from v1.

---

## 4. System Architecture (Target: Firebase)

### 4.1 High-Level

```
┌─────────────────────────────────────────────────────────────┐
│  Static frontend (GitHub Pages or Firebase Hosting)          │
│  dashboard.html · manager.html · index.html · track.html …  │
└──────────────┬──────────────────────────────────────────────┘
               │  Firebase compat/modular SDK
┌──────────────▼──────────────────────────────────────────────┐
│  Firebase project: mevish-eatery                            │
│  ┌────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Firebase    │  │ Cloud Firestore  │  │ Cloud Functions │  │
│  │ Auth        │  │ (offline persist │  │ (server logic,  │  │
│  │ (admins/    │  │  + multi-tab     │  │  PIN verify,    │  │
│  │  managers)  │  │  sync, realtime) │  │  analytics)     │  │
│  └────────────┘  └──────────────────┘  └─────────────────┘  │
│  Firestore Security Rules enforce all permissions            │
└──────────────────────────────────────────────────────────────┘
        (optional, temporary) daily export → Google Sheet backup
```

### 4.2 Architectural Decisions
- **AD-1 — Firestore is the single source of truth.** The Apps Script backend is retired after migration (optional daily backup export to Sheets may be kept temporarily, like the existing `backupFirestoreToSheet()`).
- **AD-2 — Realtime by default.** Staff screens use `onSnapshot` listeners (already proven in dashboard.html), not polling. Customer tracking uses listeners too.
- **AD-3 — Offline-first.** `enablePersistence({synchronizeTabs:true})` everywhere (already in `config.js`); UI must surface offline state and queue writes.
- **AD-4 — Security lives in Firestore Rules + Cloud Functions, never in the client.** v1's gaps (open API, plaintext PIN endpoint, self-reported `performedBy`) are closed at the platform level.
- **AD-5 — Structured data, not strings.** v1's pipe-delimited items string (`"2x Jollof Rice | 1x Coke (Notes: …)"`) is replaced by a real `items[]` array on order documents. Payment method becomes a **field**, not a substring of the status string. (See §7.)
- **AD-6 — Status vocabulary is unified.** v1 has a `Pending` vs `Active` mismatch between modules. Target: one canonical state machine (§5, FR-2).
- **AD-7 — Config-driven branding.** `config.js` remains the single branding file (name, currency, categories, themes) so the system stays multi-restaurant replicable; runtime-editable settings live in `system_config/global`.

---

## 5. Functional Requirements

Each requirement has an ID, a description, and acceptance criteria (AC). Priorities: **P0** = Phase 1 must-have, **P1** = Phase 1 should-have, **P2** = Phase 2.

### FR-1 — Authentication & Roles (P0)

**FR-1.1 Super Admin bootstrap.**
The first account ever registered becomes `SuperAdmin` automatically.
- AC: with an empty `users` collection, registration succeeds and grants SuperAdmin; with ≥1 user, registration yields `Pending` + immediate sign-out.

**FR-1.2 Admin approval flow.**
Super Admin sees pending accounts in the Admins panel and assigns Admin / Manager / SuperAdmin, or rejects.
- AC: a `Pending` user cannot reach any panel; after role assignment, next login works.

**FR-1.3 Revocation is enforced.**
Setting a user's role to `Revoked` (or cashier `active=false`) blocks login immediately.
- AC: a revoked user is signed out and cannot sign back in. *(Fixes v1 gap: `Revoked` assignable but not enforced.)*

**FR-1.4 Cashier PIN login.**
Cashiers log in on the dashboard PIN pad; PIN is verified server-side (Cloud Function) against a **hashed** PIN in `staff`; 5 failed attempts = 5-minute lockout.
- AC: wrong PIN shakes and counts attempts; correct PIN logs in < 1.5s; any-PIN-works stub removed. *(Fixes v1 gap: Firestore `loginCashier` accepts every PIN.)*

**FR-1.5 Sessions.**
Admin sessions persist across reloads (Firebase Auth local persistence). Cashier sessions persist for the browser session; explicit logout returns to the PIN pad.
- AC: reload does not re-prompt a manager; cashier logout is one tap.

**FR-1.6 Role-based UI.**
`applyRolePermissions` hides/denies everything outside the role's matrix (§3.2), enforced again by Firestore Rules.
- AC: a cashier's UI contains no void button, no settings link, no analytics; direct URL access to manager.html by a cashier session fails.

### FR-2 — Order Management & Kitchen Display (P0)

**FR-2.1 Canonical order state machine.**
`New → Preparing → Ready → Served → Closed`, with `Closed` reason ∈ {`Paid`, `Credit`}, plus `Voided` terminal. Payment method (`Cash`/`POS`) is a **field**, never part of the status string.
- AC: no module uses `Pending`/`Active` inconsistently; migration converts legacy statuses. *(Fixes v1 Pending/Active mismatch.)*

**FR-2.2 Realtime order board.**
All staff screens show today's orders via Firestore listeners, newest on top, grouped by status tabs (All / New / Preparing / Ready / Served) with a search box (order ID, customer, item) and a separate "Cleared" area for closed/voided.
- AC: an order placed anywhere appears on all screens < 2s with a ding; no manual refresh needed; live indicator shows connection state.

**FR-2.3 One-button order cards.**
Each card shows: items, customer, table/location, elapsed time, status color, and exactly one primary action — the next lifecycle step.
- AC: status transitions write `preparedAt`/`readyAt`/`servedAt` timestamps automatically; a card's button label always matches §6 of USER-JOURNEY.md.

**FR-2.4 Walk-in POS (manual order).**
Full-screen POS: a **"🔥 Most Ordered" hero section** (top 8 items by real order history, large emoji tiles), everything else **compiled into collapsible category sections**; search flattens results. Cart with big **− / +** qty steppers (min 44px), qty badges on tiles, optional customer-details disclosure (name/phone/backdate), table/location dropdown, live total, and a single giant **Confirm Order · ₦total** button that stays disabled until the cart is non-empty. Sold-out tiles are greyed and untappable.
- AC: complete order in ≤ 6 taps + optional name; total computed automatically; order type `Counter` or `Dine-In`; popularity computed from Firestore order history (`parsedItems` preferred, legacy string fallback).

**FR-2.5 Prep timers.**
Per-card quick timers (5/10/15/30 min from `CONFIG.PREP_TIMERS`), red under 60s, green "Time is up!" at 0.
- AC: timers run client-side without blocking other actions.

**FR-2.6 Void with history.**
Manager-only, two-tap confirm, requires optional reason. The order document is **kept** with `status: Voided`, `voidedBy`, `voidReason`, `voidedAt`.
- AC: voided orders appear greyed in Cleared, excluded from all revenue analytics, present in audit log. *(Fixes v1 gap: Firestore path deletes voided orders.)*

**FR-2.7 New-order sound.**
WebAudio ding on every new order arriving via listener, unlocked at login.
- AC: audible with screen unfocused (as browser permits); no sound on screen reload for existing orders.

**FR-2.8 Order detail & WhatsApp share.**
Tapping a card opens full details + contextual actions; a share button opens `wa.me` with a formatted order summary.
- AC: share works for any status; detail modal actions match the card's permissions.

### FR-3 — Payments & Receipts (P0)

**FR-3.1 Collect payment.**
Served (or any open) order offers big **Cash** / **POS** buttons. Payment writes `paymentMethod`, `paidAt`, `cashierId/Name`, `status: Closed/Paid` in one transaction.
- AC: cashier name attribution on every payment; double-payment impossible (already-paid guard, client + rules).

**FR-3.2 Receipt.**
After payment, a receipt preview modal (restaurant header, order ID, customer, table, cashier, itemized lines, total, method, `CONFIG.RECEIPT_FOOTER`) with **Print** (`window.print()` thermal layout) or **Skip**.
- AC: print layout fits 80mm thermal width; skipping does not un-pay.

**FR-3.3 Credit sales.**
Cashier can close an order as **Credit** (pay-later). Credit orders appear in a dedicated list; settling converts to Paid with method + timestamp.
- AC: outstanding credit total + count visible on Manager analytics; settled credit keeps original order ID and history.

**FR-3.4 Shift totals.**
Dashboard shows "My Sales Today" (per logged-in cashier) and "Today's Total Sales" (owner figure) computed live.
- AC: cashier's figure equals sum of their attributed payments; manager's Cashier Audit equals the same sums per cashier.

**FR-3.5 Inventory deduction on payment.**
First payment triggers recipe-based stock deduction in a Firestore transaction (see FR-5.2). Re-payments and credit-issue do **not** deduct; settlement does.
- AC: stock floors at 0; deduction is idempotent per order.

### FR-4 — Menu Management (P0)

**FR-4.1 Menu CRUD.**
Managers add/edit/delete items: name, category, price, cost, prep time, emoji/image, description, availability, recipe link (`linkedInventoryId` + `deductionQty`).
- AC: changes propagate to all screens (POS tiles, customer menu, menu board) < 5s; delete has confirm.

**FR-4.2 One-tap sold-out.**
Tapping an item in the Menu panel toggles Available ↔ Sold Out; sold-out items cannot be ordered anywhere.
- AC: toggle < 1 tap + instant visual badge; POS tile for sold-out item is visibly disabled.

**FR-4.3 Categories.**
Categories are editable in Settings (`system_config/global.categories`) and drive tabs/pills everywhere.
- AC: adding a category makes it available on all menu forms without code changes.

### FR-5 — Inventory & Recipes (P0)

**FR-5.1 Inventory CRUD + restock.**
Managers manage stock items: name, category, currentStock, alertThreshold, unit, costPerUnit, supplier, minOrderQty. **Restock** adds quantity and stamps `lastRestocked`.
- AC: LOW badge when `currentStock ≤ alertThreshold`; critical when ≤ 50% of threshold.

**FR-5.2 Automatic deduction.**
On first payment (FR-3.5): for each sold item with a recipe, deduct `qty × deductionQty` from the linked inventory item, transactionally, floor 0. Items without a recipe may deduct their own name as a retail fallback (v1 behavior — optional per item).
- AC: two simultaneous sales of the last unit never drive stock negative (transaction retry).

**FR-5.3 Low-stock alerts.**
Alerts surface in three places: cashier toast at payment time, Manager Analytics alert cards (sorted by severity, with supplier + minOrderQty), optional email digest (Cloud Function schedule).
- AC: every low item appears on the manager's alert list until restocked above threshold.

### FR-6 — Expenses (P1)

**FR-6.1** Managers record expenses: category, description, amount, payment method (Cash/Transfer/POS), auto-timestamp + recordedBy.
- AC: expenses list newest-first; totals visible in analytics; delete/edit restricted to Manager+ with confirm + audit entry.

### FR-7 — Analytics & Reports (P0 for basics, P1 for advanced)

**FR-7.1 KPI cards (P0).** Date-range selectable: Total Revenue, Total Cost, Gross Profit, Margin %, Total Orders, Average Order Value, Outstanding Credit, Active/Ready counts. Voided orders excluded everywhere.
- AC: changing the date range recomputes all cards; count-up animation retained.

**FR-7.2 Charts (P0).** Cash-vs-POS doughnut; Daily Revenue bars (≤31 days).
**FR-7.3 Cashier audit (P0).** Per-cashier cash/POS/total/orders table with grand total — the reconciliation tool.
**FR-7.4 Advanced (P1).** Popular items (30d + today), Peak Hours 7×24 heatmap, Category Performance doughnut, Top Customers.
- AC (all): numbers equal those derivable from raw orders; export = print/PDF via `window.print()`.

> **Implementation note:** v1 computes analytics by full-sheet scans at request time. Target: Cloud Function aggregations (on-write counters or scheduled rollups into `analytics/daily-YYYY-MM-DD` docs) so reports stay instant as order volume grows.

### FR-8 — Staff & Admin Management (P0)

**FR-8.1 Cashier management.** Add/edit/deactivate cashiers: name, phone, role (Cashier/Senior Cashier/Manager), 4-digit PIN (validated, **stored hashed**, **never displayed** after entry — reset instead of reveal).
- AC: PINs never rendered in any UI or API response. *(Fixes v1 gaps: `cashiers` GET returns plaintext PINs; manager panel shows them.)*

**FR-8.2 Admin management (Super Admin only).** View `users` (email, role, created date), edit roles, approve pending, revoke.
- AC: panel hidden and server-denied for non-SuperAdmin.

### FR-9 — Tables & QR (P1)

**FR-9.1** Manage tables (ID auto `T<n>`, seats, status, notes) and generate per-table QR codes encoding `BASE_URL + index.html?table=<id>`, with per-table PNG download + "Generate All".
- AC: scanning a QR opens the customer menu with the table pre-filled (Phase 2 dependency).

### FR-10 — Audit Log (P0)

**FR-10.1 Firestore-native audit.**
Every sensitive action appends an `audit_log` entry: timestamp, action, orderId/doc ref, details, performedBy (from the **verified session**, never client-supplied).
- Covered actions: order created/updated/voided, payment received, credit issued/settled, menu CRUD, inventory CRUD/restock, expense added, staff changes, role changes, settings changes, login failures.
- AC: log viewable in Manager panel, newest-first, searchable; entries immutable (rules: create-only). *(Fixes v1 gap: audit depends on GAS; `performedBy` self-reported.)*

### FR-11 — Customer-Facing (P2 — build only after Phase 1 is stable)

**FR-11.1 QR ordering portal.** `index.html`: table from QR param, cached instant menu render, category tabs, search, tap-to-add cart, upsell strips (Popular Today, Complete Your Meal), checkout (name/phone/notes), place order → Firestore `orders` with structured `items[]`.
- AC: order appears on staff screens < 2s; no login ever required.

**FR-11.2 Live tracking.** `track.html`: order ID entry or URL param, step tracker (Received → Cooking → Ready → Served) via Firestore listener, prep countdown, WhatsApp contact.
- AC: tracking works for Firestore-native orders. *(Fixes v1 gap: `track` only reads Sheets.)*

**FR-11.3 Loyalty.** 1 point per order per phone (configurable), free item at 10 (configurable), persisted in `customers` on the Firestore path.
- AC: points visible at checkout and on success screen. *(Fixes v1 gap: loyalty not persisted in Firestore.)*

**FR-11.4 Reviews.** Post-payment 1–5 star + comment on tracking page → `reviews` as Pending; Manager approves/rejects; average rating displayed.
- AC: only Approved reviews are public. *(Fixes v1 gap: reviews GAS-only.)*

**FR-11.5 Menu board.** `menu-board.html` TV display: category rotation, live clock, Firestore-backed menu refresh.
**FR-11.6 WhatsApp notification.** Success screen offers a pre-filled `wa.me` message to the kitchen number (no server dependency).

---

## 6. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-1 | **Offline-first** | Firestore persistence + multi-tab sync on all pages; order queue writes queue locally; clear offline banner; payments disabled-and-explained while offline (real enforcement — v1 advertises but `isPaymentLocked()` returns false). |
| NFR-2 | **Performance** | Order board realtime latency < 2s; menu render instant from cache; analytics via pre-aggregated docs, not full scans. |
| NFR-3 | **Security** | Firestore Security Rules as the enforcement layer: role claims via custom claims or verified `users`/`staff` lookups; PINs hashed; no sensitive config in client bundles beyond what's public by design; order/void/payment writes validated server-side. |
| NFR-4 | **Reliability** | No data loss on refresh/offline; idempotent payment & deduction transactions; daily automated export of `orders` to a Google Sheet backup during transition period. |
| NFR-5 | **Scalability** | Single-restaurant load first; data model must not preclude a future `restaurantId` field per collection (multi-restaurant replication is a design intent, as in v1). |
| NFR-6 | **Usability** | All UX rules §2 enforced; Lighthouse accessibility basics (contrast, focus states); works on 7"+ touchscreens. |
| NFR-7 | **Maintainability** | Config-driven branding (`config.js` + `system_config/global`); no customer-facing string hardcoded outside config where v1 already centralized it. |
| NFR-8 | **Auditability** | Immutable audit log (FR-10); voids/credit never deleted. |

---

## 7. Data Model (Firestore)

> Conventions: `id` = document ID; timestamps are Firestore `Timestamp`; money is a plain number in the restaurant's currency (`₦` default). Legacy Sheets column mapping in §7.11.

### 7.1 `orders` — doc ID: `ORD-YYYYMMDD-####` (existing contract)
```js
{
  orderId: "ORD-20260807-0042",
  createdAt: Timestamp,
  customerName: "Ada O.", customerPhone: "0803…",       // optional
  orderType: "Counter" | "Dine-In",
  location: "T4" | "Counter",
  items: [ { name: "Meat Pie", qty: 2, unitPrice: 1500, unitCost: 700,
             emoji: "🥧", notes: "extra spicy" } ],       // structured — replaces the pipe string
  notes: "",
  totalRevenue: 4500, totalCost: 2100, profit: 2400,
  status: "New" | "Preparing" | "Ready" | "Served" | "Closed" | "Voided",
  closedReason: "Paid" | "Credit" | null,
  paymentMethod: "Cash" | "POS" | null,                  // a field, not a status substring
  cashierId: "stf_…", cashierName: "Ada",
  prepStartedAt: Timestamp|null, readyAt: Timestamp|null,
  servedAt: Timestamp|null, paidAt: Timestamp|null,
  estimatedPrepMin: 15, actualPrepMin: 12|null,
  creditSettledAt: Timestamp|null,
  voidedBy: "Musa", voidReason: "wrong item", voidedAt: Timestamp|null,
  inventoryDeducted: false                                 // idempotency guard
}
```

### 7.2 `menu_items`
```js
{ name, category, price, cost, prepTime, available: true,
  emoji, image: "", description: "",
  linkedInventoryId: "inv_…"|null, deductionQty: 0.25|null }
```

### 7.3 `inventory`
```js
{ name, category, currentStock: 12.5, alertThreshold: 5, unit: "kg",
  costPerUnit: 800, supplier: "Musa Foods", minOrderQty: 10,
  lastRestocked: Timestamp }
```

### 7.4 `recipes` *(optional — only if multi-ingredient recipes are kept; otherwise the per-item link in 7.2 suffices)*
```js
{ menuItemId: "…", ingredientId: "inv_…", qtyNeeded: 0.3, unit: "kg" }
```

### 7.5 `staff` (cashiers — replaces the Cashiers sheet incl. PIN)
```js
{ name: "Ada", phone: "…", role: "Cashier"|"Senior Cashier"|"Manager",
  active: true, pinHash: "<bcrypt/sha256+salt>", failedAttempts: 0, lockedUntil: null }
```

### 7.6 `users` (Firebase Auth UIDs — admin/manager accounts)
```js
{ email: "…", role: "SuperAdmin"|"Admin"|"Manager"|"Pending"|"Revoked",
  createdAt: Timestamp, approvedBy: "uid…"|null }
```

### 7.7 `tables`
```js
{ label: "T4", seats: 4, status: "Free"|"Occupied", notes: "", qrUrl: "…?table=T4" }
```

### 7.8 `expenses` — doc ID: `EXP-<timestamp>`
```js
{ date: Timestamp, category: "Supplies", description: "Tomatoes",
  amount: 15000, paymentMethod: "Cash"|"Transfer"|"POS", recordedBy: "Musa" }
```

### 7.9 `customers`, `reviews`, `audit_log`, `system_config`
```js
// customers — doc ID: phone
{ name, totalOrders, totalSpent, loyaltyPoints, lastVisit, createdAt }

// reviews
{ orderId, phone, rating: 1-5, comment, customerName,
  status: "Pending"|"Approved"|"Rejected", createdAt }

// audit_log — create-only
{ timestamp, action: "PAYMENT_RECEIVED"|"ORDER_VOIDED"|…,
  refId: "ORD-…", details: "…", performedBy: "<verified identity>" }

// system_config/global
{ restaurantName, tables: [...], taxRate: 0, categories: [...],
  loyaltyPointsPerOrder: 1, loyaltyRewardThreshold: 10, theme: "default" }

// analytics/daily-YYYY-MM-DD (rollup docs, written by Cloud Functions)
{ revenue, cost, orders, cashRevenue, posRevenue, voidCount,
  byCashier: { Ada: {cash, pos, orders} }, topItems: [...] }
```

### 7.10 Legacy → Firestore mapping

| Google Sheet (v1) | Firestore collection | Notes |
|---|---|---|
| Orders (20 cols) | `orders` | Items string → `items[]`; status strings parsed into `status`+`closedReason`+`paymentMethod` |
| Menu | `menu_items` | + recipe link fields |
| Inventory | `inventory` | direct |
| Recipes | `recipes` or item link | decide per FR-5.2 |
| Cashiers (with PIN) | `staff` | PIN re-issued + hashed on migration |
| Tables | `tables` | direct |
| Expenses | `expenses` | direct |
| Audit Log | `audit_log` | import as history |
| Blog | (out of scope, stays or drops) | see §9 |
| Customers | `customers` | doc ID = phone |
| Reviews | `reviews` | direct |
| Settings (key/value) | `system_config/global` | PINs **excluded** — moved to Auth/staff |
| Orders (Backup) | — | reversed: Sheet becomes the backup of Firestore |

---

## 8. Migration Plan

### Phase 1 — Staff side on Firebase (this PRD's priority)
1. **Auth & roles:** Firebase Auth + `users` bootstrap/approval; cashier PIN Cloud Function + `staff` hashing; enforcement of `Revoked`. *(Closes gaps: any-PIN login, unenforced Revoked.)*
2. **Orders:** route **all** order writes through Firestore — status transitions, payments, voids (as status, never delete), credit settle; unify the status vocabulary (`Pending`/`Active` → `New`). *(Closes the biggest gap: dashboard status updates currently fall through to GAS.)*
3. **Structured items:** switch `cartItems` string → `items[]` array everywhere (POS, customer portal, receipts, analytics, deduction). Keep a parser for legacy rows during transition.
4. **Inventory & expenses:** finish Firestore handlers (`restockInventory`, `deleteInventoryItem`, transactional deduction on payment).
5. **Analytics:** pre-aggregated rollups via Cloud Functions; keep client-side computation as fallback during transition.
6. **Audit log:** Firestore-native, verified-identity writes.
7. **Security Rules:** write and test rules per §3.2 matrix before cutover.
8. **Data migration:** one-time script — Sheets → Firestore per §7.10 (orders parsed; cashier PINs re-issued; Settings → `system_config/global`).
9. **Cutover & rollback:** feature-flag in `config.js` (`USE_FIREBASE`) already effectively exists via dual-mode `apiGet/apiPost`; keep the daily Firestore→Sheet backup (`backupFirestoreToSheet`, Code.gs:2094) running as a safety net for 30 days, then retire GAS.

### Phase 2 — Customer side
10. Migrate `track`, `reviews`/`averageRating`, `popularToday`, `suggestions`, loyalty persistence, tables → Firestore. *(Closes remaining gaps.)*
11. Polish customer UX to the same §2 standard; then enable QR ordering in production.

### Known gaps carried from v1 (checklist — all must be closed)
- [x] Dashboard status updates go to GAS, not Firestore — **closed (Phase 1 slice): `updateStatus`/`settleCredit` now handled in Firestore**
- [ ] `loginCashier` Firestore stub accepts any PIN *(next slice: server-side PIN verification)*
- [x] `Pending` vs `Active` status mismatch — **closed: `newOrder` normalizes `Pending` → `Active`** (full rename to canonical `New` still pending)
- [x] Void deletes the Firestore order document (no history) — **closed: voids preserved with `voidedAt`/`voidedBy`**
- [ ] Plaintext cashier PINs in API response and manager UI *(next slice)*
- [x] `Revoked` role not enforced at login — **closed: revoked users are signed out in manager.html**
- [ ] `track.html`, reviews, suggestions, popularToday, loyalty, tables: GAS-only *(Phase 2)*
- [~] `cartItems` string never triggers inventory deduction (no structured items) — **partial: `parsedItems[]` now stored on every new order; deduction-on-payment still pending**
- [ ] Offline "payments locked" banner not actually enforced
- [x] Audit log GAS-backed — **closed: Firestore-native `audit_log` + `CONFIG.writeAudit()`** (`performedBy` still client-reported until cashier auth exists)

---

## 9. Out of Scope / Future

- **Blog CMS** (`blog.html`, `blog-admin.html`, article pages) — exists in v1 via GAS; keep running on GAS or rebuild later; not part of the RMS core.
- Multi-branch management, franchise dashboards.
- Real payment processing (Paystack/Stripe) — v2 records payments, doesn't process them.
- Supplier purchase orders, payroll, accounting exports.
- Native iOS/Android apps (PWA treatment instead).
- Kitchen printer auto-printing (receipts print on demand only).

---

## Appendix A — Current-State API Inventory (Apps Script, v1 reference)

**27 GET endpoints** (`?type=`): `menu`, `orders`, `track`, `cashiers`, `loginCashier`, `inventory`, `inventoryAlerts`, `tables`, `activeTables`, `settings` (PINs stripped), `stats`, `dailyRevenue`, `popularItems`, `popularToday`, `peakHours`, `categoryBreakdown`, `topCustomers`, `suggestions`, `cashierShift`, `expenses`, `auditLog`, `blogs`, `blog`, `customer`, `customers`, `loyaltyReward`, `reviews`, `averageRating`.

**23 POST actions**: `newOrder`, `updateStatus`, `settleCredit`, `addMenuItem`, `updateMenuItem`, `deleteMenuItem`, `toggleMenuAvailability`, `addInventoryItem`, `updateInventoryItem`, `deleteInventoryItem`, `restockInventory`, `addCashier`, `removeCashier`, `updateCashier`, `addTable`, `updateTable`, `removeTable`, `addExpense`, `updateSettings`, `saveBlogPost`, `deleteBlogPost`, `saveReview`, `approveReview`.

**Sheets**: Settings, Menu, Orders, Inventory, Recipes, Cashiers, Tables, Expenses, Audit Log, Blog, Customers, Reviews (+ `Orders (Backup)` written by the Firestore backup job).

**Existing Firestore collections (mid-migration)**: `orders`, `menu_items`, `inventory`, `expenses`, `system_config/global`, `users`.

**v1 behaviors to preserve verbatim** (they're good): order ID format `ORD-YYYYMMDD-####`; auto-void of stale orders (time trigger, "Auto Void Minutes" default 120); low-stock alert threshold logic; backdated order support (re-implement as a proper `createdAt` override with audit note, not a string sentinel); menu response caching; theme presets.

## Appendix B — Glossary

| Term | Meaning |
|---|---|
| **KDS** | Kitchen Display System — the live order board (dashboard.html). |
| **POS** | Point of Sale — here meaning card-terminal payment (not cash). |
| **Void** | Cancel an order. Preserved in history; Manager-only. |
| **Credit** | Customer takes food now, pays later; settled via `settleCredit`. |
| **KPI** | Key Performance Indicator — the big number cards in Analytics. |
| **Firestore** | Google's realtime cloud database (Firebase). |
| **GAS** | Google Apps Script — the v1 backend being retired. |
| **Phase 1** | Staff side: Super Admin, Manager, Cashier on Firebase. |
| **Phase 2** | Customer side: QR ordering, tracking, loyalty, reviews. |
