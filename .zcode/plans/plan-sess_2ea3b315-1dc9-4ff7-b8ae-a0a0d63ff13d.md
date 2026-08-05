# Implementation Plan: Role-Based Access + Cashier/User Management + Backdate Cleanup

Your choices: **Per-cashier PIN login**, **hide Void + Manager Panel link** from cashiers, **move backdate to dashboard**, and **cashiers are managed as users** with full CRUD (add/edit/delete/change PIN/change role/activate).

---

## Part A: Backend — Code.gs (Cashier as full User system)

**Cashiers sheet schema becomes (5 columns):**
`Name [0] | Phone [1] | Role [2] | Active [3] | PIN [4]`

**New column-index constant (after line ~15):**
```js
var CSH = { NAME: 0, PHONE: 1, ROLE: 2, ACTIVE: 3, PIN: 4 };
```

**Changes:**

1. **`cashiers` GET endpoint** — add `pin: data[i][4] || ""` to returned objects (so the manager panel can display PINs)

2. **`addCashier` action** — update header creation to include PIN column, accept `payload.pin`, write 5 columns:
   - Header: `["Name", "Phone", "Role", "Active", "PIN"]`
   - Row: `[payload.name, payload.phone, payload.role, payload.pin, "Yes"]`

3. **NEW `updateCashier` action** — finds row by `payload.oldName` (the original name, in case they renamed), then updates any provided fields (name, phone, role, active, pin). Mirrors the `updateMenuItem` pattern:
   ```js
   if (action === "updateCashier") {
     // find row where data[i][0] === payload.oldName
     // update only provided fields: name→col0, phone→col1, role→col2, active→col3, pin→col4
     // logAudit("CASHIER_UPDATED", ...)
   }
   ```

4. **NEW `loginCashier` GET endpoint** — `type=loginCashier&pin=XXXX`:
   - Scans Cashiers sheet for a row where `PIN === pin` AND `Active !== "No"`
   - Returns `{status:"success", data:{name, role, phone}}` on match
   - Returns `{status:"not_found"}` if no match
   - Role drives dashboard permissions

5. **`removeCashier`** — no changes needed (already works by name)

---

## Part B: Manager Panel — Full Cashier/User Management (manager.html)

Mirror the **menu item add+edit pattern** for cashiers:

**`renderCashiersTable()` rewrite:**
- Columns: **Name | Phone | Role | PIN | Status | Actions**
- PIN column shows the PIN (this panel is already PIN-gated for managers)
- Actions column: **Edit** button + **Remove** button (Edit is new)
- Status shows Active/Inactive badge
- Add an **Activate/Deactivate** toggle in the Edit modal (simplest) or as a quick button

**`openCashierModal(editName)` rewrite (add + edit in one modal):**
- When called with no arg → "Add Cashier" (empty form)
- When called with a name → finds the cashier in `cashiersData`, pre-fills the form, title = "Edit Cashier"
- Form fields: **Full Name, Phone, Role** (dropdown: Cashier / Senior Cashier / Manager), **PIN** (4-digit input), **Active** (Yes/No dropdown)
- Save button label changes: "Add" vs "Update"

**`saveCashier(editName)` rewrite:**
- If `editName` provided → call `CONFIG.apiPost('updateCashier', {oldName, name, phone, role, active, pin, performedBy})`
- If no `editName` → call `CONFIG.apiPost('addCashier', {...})` (existing)
- On success: toast, close modal, reload data, re-render

**Header button** already says "+ Add Cashier" — keep it. Add Edit buttons per row.

---

## Part C: Dashboard — Per-Cashier Login + Role Permissions (dashboard.html)

**PIN gate rewrite (replaces single MANAGER_PIN check):**

On PIN entry (4 digits), check in this order:
1. **Offline check:** PIN === `CONFIG.MANAGER_PIN`? → log in as Manager `{name:'Manager', role:'Manager'}`. Works even if API is down.
2. **API check:** call `CONFIG.apiGet('loginCashier', {pin})` → on success, log in as `{name, role}` from the response.
3. Neither → "Incorrect PIN" error (keep existing shake animation).

Store in a session-scoped variable: `currentUser = {name, role, isManager}`.

**Replace cashier dropdown with logged-in user display:**
- Remove the `<select id="cashierSelect">` and related `loadCashiers()`/`isPaymentLocked()`/`onCashierChange()` code
- Replace controls-left with: **"👤 {Name}"** + **({Role})** badge + a **Logout** button (reloads page)
- `getSelectedCashier()` → returns `currentUser.name`
- `isPaymentLocked()` → returns `false` (they're authenticated; payments always work)

**Role-based UI (driven by `currentUser.role`):**

| Feature | Manager | Senior Cashier | Cashier |
|---------|---------|----------------|---------|
| Start Preparing | ✅ | ✅ | ✅ |
| Mark Ready | ✅ | ✅ | ✅ |
| Mark Served | ✅ | ✅ | ✅ |
| Pay POS / Cash | ✅ | ✅ | ✅ |
| WhatsApp Share | ✅ | ✅ | ✅ |
| Prep timers | ✅ | ✅ | ✅ |
| **Void order** | ✅ | ❌ | ❌ |
| **Manager Panel link** | ✅ | ❌ | ❌ |
| **Manual Order (backdate)** | ✅ | ❌ | ❌ |

Implementation: `currentUser.isManager` boolean (true if role === 'Manager'). In `buildOrderCard` and the detail modal, gate the Void button and Manager Panel link behind `if (currentUser.isManager)`.

**New "Manual Order" modal (Manager only):**
- Button in the header (visible only to Managers): **"+ Manual Order"**
- Modal form:
  - Customer Name (optional, defaults to "Walk-in")
  - Phone (optional)
  - Location (dropdown: Counter + all tables)
  - Items (free-text: "2x Jollof Rice | 1x Chicken")
  - Total amount (manual number entry)
  - **Backdate** (optional: date + time pickers, defaults to now)
- Submits via existing `CONFIG.apiPost('newOrder', {...})`
- On success: toast + refresh orders grid

---

## Part D: Customer Page — Remove All Backdate (index.html)

Complete removal of backdate from the customer-facing ordering page:

1. **CSS:** Delete the `.backdate-section` rules (lines ~313-374, ~480-481)
2. **HTML:** Delete the backdate section block (lines ~979-998)
3. **JS:** Delete:
   - The backdate show/hide logic in the modal-open function (lines ~1640-1656)
   - The `isBackdated` check and backdate-string construction in `submitOrder` (~line 1799)
4. **Keep:** name, phone, table, notes fields — clean customer order form
5. **`table=Counter`** still works for walk-in orders, just without backdate

---

## Part E: Google Sheet — One-Time Manual Update

You'll add a **PIN** column to your existing Cashiers sheet:
- Go to **Cashiers** tab → cell **E1** → type: `PIN`
- For each existing cashier row, enter a 4-digit PIN in column E
- Make sure you have at least one row with `Role = Manager` and a PIN you know (for full access)

---

## Files Changed

| File | Changes |
|------|---------|
| **Code.gs** | New `CSH` map, `loginCashier` + `updateCashier` endpoints, update `addCashier` (PIN column), update `cashiers` GET (return PIN) |
| **manager.html** | Cashier table: add PIN + Status + Edit columns; `openCashierModal(editName)` add+edit; `saveCashier(editName)` update logic; activate/deactivate |
| **dashboard.html** | PIN gate rewrite (per-cashier login), remove cashier dropdown, role-based UI (hide Void/Manager link for non-managers), Manual Order modal, logout button |
| **index.html** | Remove all backdate code (CSS, HTML, JS) |

**Not changed:** config.js (MANAGER_PIN stays as offline manager fallback), all other files.

---

## Testing Plan (after implementation)

1. **Manager login:** Enter MANAGER_PIN → full access, see Manual Order + Manager Panel + Void
2. **Cashier login:** Enter a cashier's PIN → limited access, no Void/Manager link/Manual Order
3. **Wrong PIN:** Error shown
4. **Customer page:** No backdate anywhere — clean form
5. **Manual Order:** Manager places a backdated walk-in order → appears in grid with past timestamp
6. **Manager → Cashiers tab:** Add a cashier with PIN, edit their role/PIN, deactivate, re-activate, delete — all work
7. **End-to-end sweep:** Order → dashboard (cashier processes) → track → review → manager analytics