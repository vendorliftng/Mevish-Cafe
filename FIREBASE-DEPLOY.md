# Deploying the Firebase Phase-1 Slice

This guide deploys the Firestore security rules for the `mevish-eatery` project.
You only need to do the install/login steps once.

---

## 1. Install the Firebase CLI (once)

```bash
npm install -g firebase-tools
```

## 2. Log in (once)

```bash
firebase login
```

This opens a browser — sign in with the Google account that owns the
`mevish-eatery` Firebase project.

## 3. Deploy the rules

From this folder (`Mevish/`):

```bash
firebase deploy --only firestore:rules
```

Expected output: `✔ Deploy complete!`

> The project is already pinned in `.firebaserc` (`mevish-eatery`), so no
> `firebase use` step is needed. If you ever see "No project active", run
> `firebase use mevish-eatery`.

## 4. Verify in the Firebase Console

1. Open https://console.firebase.google.com/project/mevish-eatery/firestore/rules
2. Confirm the rules shown there match `firestore.rules` in this repo.
3. Optional: use the **Rules Playground** to confirm that deleting a document
   in `orders` is denied.

---

## What this slice changed (for your reference)

**`config.js`**
- `apiPost('updateStatus')` now handled in Firestore — order status transitions
  (Preparing → Ready → Served → Paid/Void/Credit) **no longer fall through to
  Google Apps Script**. Timestamps (`prepStartedAt`, `readyAt`, `servedAt`,
  `paidAt`) and `paymentMethod`/`cashierName` are written as real fields.
- `apiPost('settleCredit')` handled in Firestore (credit → paid conversion).
- **Voids are preserved**: `updateOrder`/`updateStatus` with `Void` now marks the
  order `Void` + `voidedAt`/`voidedBy` instead of deleting the document.
- `newOrder` no longer forces status `Pending` — legacy `Pending` is normalized
  to `Active` (fixes the Pending/Active mismatch between portal and tracker).
- `newOrder` also stores `parsedItems` (structured `[{qty, name}]` array parsed
  from the `cartItems` string) — first step toward the structured items model.
- New `CONFIG.writeAudit()` writes to a Firestore `audit_log` collection for:
  order created, status changes, payments, voids, credit issued/settled,
  menu add/update/delete, inventory add/update, expenses.
- `apiGet('auditLog')` now reads from Firestore (newest 200 entries).

**`manager.html`**
- **Revoked accounts are now blocked at login** (previously assignable but not
  enforced).
- Fixed a real syntax bug: a dangling `async` keyword and a non-async
  `loadAuditLog()` using `await` were making the entire manager page script
  fail to parse. The Audit Log panel now works and reads from Firestore.

**New files**
- `firestore.rules` — security rules (see header comments for what's enforced).
- `firebase.json` / `.firebaserc` — deploy configuration for the CLI.

---

## What the rules enforce vs. what is still open

| Area | Enforced now |
|---|---|
| Role changes | SuperAdmin only ✅ |
| Self role-escalation | Blocked ✅ |
| Order deletion | Blocked (voids preserved) ✅ |
| Audit log tampering | Blocked (create-only) ✅ |
| Inventory edits | Managers only; unauthenticated clients can only change `currentStock` ✅ |
| Order create/update | **Open** ⚠️ — cashier PIN pad devices are not Firebase-authenticated yet |
| Staff/cashier records | Managers only (PIN hardening is the next slice) |

The open order write access is the same exposure the system already had with the
public Apps Script URL — closing it properly requires server-side cashier
sessions (Cloud Functions), which is the next slice.

---

## Smoke test after deploying (5 minutes)

1. Open `dashboard.html`, log in with a real cashier PIN (the `1234` manager
   PIN in `config.js` only works when the device is genuinely **offline** now
   — see the next section).
2. Create a manual order → it should appear with status **Active** (not Pending).
3. Tap **Start Preparing → Mark Ready → Mark Served → Cash** — each step should
   complete without touching the old Apps Script backend (check the browser
   Network tab: no calls to `script.google.com` for these).
4. As a manager, **Void** a test order → confirm in the Firebase Console that
   the order document still exists with `status: "Void"`.
5. Open `manager.html` → **Audit Log** panel → you should see entries for all
   the actions above (ORDER_CREATED, PREP_STARTED, PAYMENT_RECEIVED,
   ORDER_VOIDED).

---

## Rollback

If anything misbehaves, the old rules can be restored in the Firebase Console
(Firestore → Rules → history), and the code still falls back to the Apps Script
backend automatically for anything not handled in Firestore.

---

## Update — everything moved off Apps Script (this slice)

**You must redeploy `firestore.rules`** (step 3 above) for this slice to work —
without it, Cashiers/Tables/Reviews/Customers will fail with "Missing or
insufficient permissions" because the *currently live* rules don't know about
those collections yet.

**What moved to Firestore:**

- **Cashier login** (`loginCashier`) — now checks the `staff` collection
  first instead of going straight to the Apps Script Sheet. `staff` read is
  now public (needed by the unauthenticated PIN pad) — this is the same
  exposure the old `cashiers` GAS endpoint already had (plaintext PINs), not
  a new one. Writes stay Manager-only. **Your 5 existing cashiers only exist
  in the old Sheet right now** — login still falls back to GAS for any PIN
  Firestore doesn't recognize, so nobody is locked out, but open the
  **Cashiers panel and re-save each one once** (Edit → Update, no changes
  needed) so they exist in Firestore too and stop depending on GAS.
- **Cashiers CRUD** (add/edit/remove) — `staff` collection, addressed by name
  (same as before).
- **Tables CRUD** (add/edit/remove) — new `tables` collection, doc ID = table
  ID (e.g. `T4`).
- **Inventory add/edit/delete/restock** — fixed two real bugs in the process:
  `addInventoryItem`/`updateInventoryItem` required an `id` the manager panel
  never sent (every new item was silently overwriting the same
  `inventory/undefined` doc); and the client's `stock` field was never mapped
  to the `currentStock` field everything else reads. Both are now name-addressed
  and correctly mapped, matching how Delete/Restock already worked.
- **Reviews** — `saveReview` (customer submits), `approveReview` (manager
  approves/rejects), and the `reviews`/`averageRating` reads are all
  Firestore-native now (the `reviews` read used to be hardcoded to always
  return empty, regardless of backend).
- **Settings** — the main Settings form (`saveSettings`) was already
  Firestore-native; only the **Theme picker** was still calling a dead GAS
  action. It now writes `system_config/global.theme`, and new devices default
  to that instead of always starting on Classic Teal.
- **Popular Today / Complete Your Meal suggestions** (`index.html`) — now
  computed from real order history (last 100 orders) instead of calling
  GAS endpoints that read stale/empty Sheets data. Suggestions are genuine
  "customers who ordered this also ordered…" co-occurrence, not random picks.

**Two Menu panel bugs also fixed** (unrelated to GAS, pure client bugs):
Edit/Delete/Sold-out-toggle used `${item.id}` **unquoted** inside `onclick`
handlers — harmless for numeric IDs, but silently broken (invalid JS) for the
alphanumeric IDs Firestore's auto-migration gave your original menu. Also,
`available` is a real boolean in Firestore but was being compared against the
string `'Yes'`, so every item displayed as Sold Out and the toggle button could
never actually mark one sold out.

**Still on Apps Script, deliberately:** `blog`/`article` pages — the PRD scopes
the Blog CMS out of the RMS core rebuild.

**Known debris to check for:** if the Inventory panel was ever used to add an
item before this fix, it likely overwrote a single doc at `inventory/undefined`
each time. Check the Firebase Console (Firestore → `inventory` collection) for
a doc literally named `undefined` and delete it if present.
