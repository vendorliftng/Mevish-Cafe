# Mevish Restaurant Management System — User Journeys

> **Who this document is for:** everyone building, testing, or using Mevish.
> **How to read it:** each journey is a story of a real day, told step by step. Every step says **what you see**, **what you tap**, and **what happens next**.
>
> **The Golden Rule of Mevish UX:**
> *A child who has never seen a computer should be able to operate this system.*
> That means: big buttons, one job per button, colors and pictures instead of words wherever possible, sounds that tell you something happened, and the system always asks "Are you sure?" before anything dangerous.

---

## Table of Contents

1. [The Roles — Who Uses Mevish](#1-the-roles--who-uses-mevish)
2. [Journey 1 — The Super Admin (The Owner of the Whole System)](#2-journey-1--the-super-admin)
3. [Journey 2 — The Manager (Runs the Restaurant Day to Day)](#3-journey-2--the-manager)
4. [Journey 3 — The Cashier (Takes Orders and Money)](#4-journey-3--the-cashier)
5. [Journey 4 — The Customer (Phase 2 — Brief)](#5-journey-4--the-customer-phase-2)
6. [The Shared Language — Colors, Sounds & Statuses](#6-the-shared-language--colors-sounds--statuses)
7. [Safety Nets — How Mevish Protects You From Mistakes](#7-safety-nets--how-mevish-protects-you-from-mistakes)

---

## 1. The Roles — Who Uses Mevish

Think of the restaurant as a house. Different people hold different keys.

| Role | Who they are | Their key opens | How they log in |
|------|--------------|-----------------|-----------------|
| **Super Admin** | The owner. The boss of the whole system. There is only one first Super Admin. | Everything: settings, staff accounts, roles, money reports, audit log. | Email + password (Firebase Auth) |
| **Manager** | Runs the restaurant daily. Trusted senior staff. | Menu, inventory, expenses, reports, reviews, tables, cashiers. | Email + password (approved by Super Admin) |
| **Cashier** | Front-desk staff who take orders and collect money. | The order screen only: take orders, mark food ready, collect payment, print receipts. | 4-digit PIN on a big number pad |
| **Customer** *(Phase 2)* | The guest who eats the food. | The public menu on their own phone (no login at all). | No login — scans a table QR code |

**Why two kinds of login?**
Typing an email and password is hard for staff who use the system 200 times a day. So managers (who do powerful things) get a secure email login, while cashiers (who do simple things, fast) get a big friendly number pad.

---

## 2. Journey 1 — The Super Admin

### 2A. The Very First Day (Setting Up the System)

1. **Open the Manager Panel.** The Super Admin opens the manager page on a laptop or tablet. They see a calm login card asking for an email and password.
2. **Register the first account.** They tap *"(First Time Setup Only) Register Admin"*, type their email and a strong password, and tap **Register**.
   - *What happens behind the scenes:* the system sees that **no users exist yet**, so this very first account automatically becomes **SuperAdmin**. No one else can ever claim this by accident.
3. **Land on the dashboard.** They are in. The left side shows a simple menu of panels: Analytics, Orders, Menu, Inventory, Cashiers, Customers, Reviews, Tables & QR, Expenses, Admins, Settings, Themes, Audit Log.
4. **Set up the restaurant.** They open **Settings** and fill in:
   - Restaurant name
   - Tax rate (if any)
   - The list of tables (e.g. `T1, T2, T3 … Counter`)
   - Menu categories (e.g. `Foods, Swallows, Pastries, Drinks`)
   One **Save** button stores everything.
5. **Build the menu.** They open **Menu Items** and tap **Add Item** for each dish: name, category, price, cost, preparation time, and a friendly emoji/picture. If a dish should reduce raw stock when sold, they link it to an inventory item and set how much to deduct.
6. **Stock the pantry.** They open **Inventory**, tap **Add Item**, and record each raw material: name (Flour, Rice, Chicken…), how much is in stock, the "warn me when it drops below this" number, the unit (kg, bottles, packs), cost per unit, and supplier.
7. **Hire the team.**
   - **Cashiers:** open **Cashiers** → **Add Cashier** → name, phone, role, and a 4-digit PIN. From now on that cashier can log into the order screen with just those 4 digits.
   - **Managers/Admins:** a new manager opens the manager page and registers with their own email. The system marks them **Pending** and signs them out immediately — they *cannot* get in on their own.
8. **Approve the new manager.** Back in the **Admins** panel (visible only to Super Admin), the Super Admin sees the new pending account, taps **Edit Role**, chooses **Manager**, and saves. The next time that person logs in, they get in.
9. **Pick a look.** In **Themes** they tap one of five beautiful color themes (Classic Teal, Midnight Gold, Sunset Warm, Forest Green, Royal Purple). The whole system repaints itself instantly.
10. **Print the table QR codes.** In **Tables & QR**, they add the restaurant's tables, tap **Generate All QR Codes**, and download one QR per table. Each printed QR goes on its table. *(Customer ordering with these QRs switches on in Phase 2.)*

**The first day is done.** The restaurant now lives inside Mevish.

### 2B. A Normal Week (Oversight & Control)

The Super Admin does not need to touch the system every day. When they do, it looks like this:

**Every few days — the money check (5 minutes):**
1. Log in → **Analytics**.
2. Pick a date range (the default is "this month so far").
3. Read the big number cards: **Total Revenue**, **Total Orders**, **Average Order Value**, **Outstanding Credit**.
4. Glance at the charts: the **Cash vs POS** doughnut and the **Daily Revenue** bars.
5. Scroll to the **Cashier Audit** table: exactly how much cash and POS money each cashier collected. Compare with what is actually in the drawer.

**When something feels wrong:**
1. Open the **Audit Log** — a diary the system keeps of every important action: who created an order, who voided one, who changed a price, who restocked inventory, and when.
2. Search or scroll to the suspicious moment. Every entry has a time, an action, and **who did it**.

**When staff change:**
- Someone leaves → **Admins** panel → set their role to **Revoked** (their login stops working) or **Cashiers** panel → toggle them inactive (their PIN stops working).
- Someone is promoted → change their role. No new accounts needed.

**Golden rule for the Super Admin journey:** everything powerful lives in exactly two places — the **Admins** panel (people) and the **Settings** panel (the restaurant). If you can remember those two, you can run the whole system.

---

## 3. Journey 2 — The Manager

### 3A. Morning — Getting Ready for the Day

1. **Log in** with email and password on the manager page. (If their browser remembers the session, they may already be logged in — the system keeps them signed in safely.)
2. **Check the pantry warnings.** On **Analytics**, the **Inventory Alerts** section shows red and orange cards for anything running low. "Flour is LOW — 2 kg left (alert at 5 kg)."
3. **Mark what is sold out.** A delivery of fish did not arrive. The Manager opens **Menu Items**, finds "Grilled Fish", and taps it once — it flips to **Sold Out**. From this moment, no cashier or customer can order it. One tap, done.
4. **Record a market run.** They paid ₦15,000 for tomatoes this morning. Open **Expenses** → **Add Expense** → category "Supplies", type the amount, pick how it was paid (Cash/Transfer/POS) → **Save**.
5. **Restock.** The tomatoes go into the store: open **Inventory**, find "Tomatoes", tap **Restock**, type the quantity bought → **Save**. The stock number grows, and the "last restocked" date stamps itself.

### 3B. During Service — Eyes on the Floor

1. **Watch the orders come in.** The Manager keeps the order screen open (or walks over to the cashier's screen). Every new order appears as a colored card with a gentle **ding** sound.
2. **Fix mistakes the right way.** A cashier punched in the wrong dish. Only a Manager can void: they tap **Void** on the order card, the button changes to **Confirm Void** (tap again within 4 seconds), and the order is cancelled — **but never deleted**. It stays in the records, clearly marked Void, with the manager's name and reason in the audit log.
3. **Change a price on the fly.** Beef prices went up. **Menu Items** → find the dish → **Edit** → type the new price → **Save**. Every screen updates.
4. **Handle an angry or happy guest.** In **Reviews**, the Manager sees new customer ratings waiting for approval. Tap **Approve** to publish a kind review, **Reject** for spam or abuse.

### 3C. Evening — Closing the Day

1. **Open Analytics.** Set the date range to today.
2. **Read the story of the day:**
   - How much did we make? (**Total Revenue**, and the profit margin behind it.)
   - What did people love? (**Popular items** and the **Category Performance** doughnut — "Swallows outsold Pastries 3 to 1".)
   - When were we busiest? (**Peak Hours** heatmap — tomorrow, roster one more hand at 1 PM.)
   - Who are our best guests? (**Top Customers** — maybe surprise them with a free drink next visit.)
3. **Reconcile the cashiers.** The **Cashier Audit** table says Cashier Ada collected ₦42,500 cash and ₦18,000 POS. Ada counts her drawer: it matches. If it ever doesn't, the audit log shows every payment with her name on it.
4. **Chase the credit.** **Outstanding Credit** shows 3 unpaid orders worth ₦9,000. When a customer comes back to pay, any cashier can settle the order — tap it, choose how they paid, done.
5. **Write the shopping list.** The **Inventory Alerts** cards say what is low, who supplies it, and the minimum order quantity. Tomorrow's market list writes itself.

**Golden rule for the Manager journey:** the day has three beats — *prepare* (morning), *watch* (service), *count* (evening). Every beat has exactly one home: prepare in Menu/Inventory/Expenses, watch on the order screen, count in Analytics.

---

## 4. Journey 3 — The Cashier

The cashier's whole world is **one screen**: the order dashboard. No menus to learn, no settings to break. Big buttons, bright colors, and sounds.

### 4A. Starting the Shift

1. **See the number pad.** The screen shows a big friendly PIN pad — four empty dots at the top, chunky number keys below.
2. **Tap your 4 digits.** As they tap, the dots fill in. After the 4th digit, the system checks automatically — no "Enter" button needed.
3. **They're in.** A welcome, a soft sound, and the order screen appears. Their name is now attached to everything they do today — the system remembers who collected which money.

### 4B. Taking a Walk-In Order (The Most Important 30 Seconds)

A customer walks up: *"One meat pie and a Coke, please."*

1. **Tap the big "+ Manual Order" button** (top of the screen, always visible).
2. **Tap the food pictures.** A grid of large tiles appears — every dish with its emoji/picture and price. The cashier taps **Meat Pie** once, **Coke** once. Each tap adds the item to the order list at the side, with a satisfying press animation. Best sellers sit at the top with a 🔥 badge, so the most-tapped tiles are always nearest.
   - Want two pies? Tap it twice — the counter shows "× 2".
   - Wrong tap? Tap the little ✕ next to the item in the list. Gone.
3. **Pick where the customer sits.** A simple dropdown: "Counter" (takeaway) or a table number.
4. **Type the customer's name or phone** *(optional — only if they want loyalty points)*.
5. **Check the total** — the screen adds everything up automatically. No math, ever.
6. **Tap the big "Confirm Order" button.** Done.
   - *What happens:* the order flies into the system, appears instantly on every screen as a new **yellow card**, plays a **ding** for the kitchen, and quietly reserves the ingredients from inventory.

### 4C. When a Phone Order Arrives

The cashier does *nothing* to receive it. A **ding** sounds, and a new yellow card pops onto the screen with the customer's name, table, and items already filled in. The system timestamps it automatically. The cashier just keeps serving.

### 4D. Moving the Food Through the Kitchen

Every order card is a sticky note with **one big obvious button** — always the next thing to do:

1. **Yellow card — new order.** Button says **"Start Preparing"**. Tap it when the kitchen begins. The card turns **orange**. The system stamps the start time and estimates how long the dish takes.
2. **Watching the clock.** The cashier can tap a prep timer on the card (5 / 10 / 15 / 30 minutes). The countdown shows on the card; under 60 seconds it turns **red**; when time is up it glows green and says **"Time is up!"**
3. **Orange card — cooking.** Button says **"Mark Ready"**. The chef finished — tap it. Card turns **green**.
4. **Green card — ready.** Button says **"Mark Served"**. The waiter delivered the food — tap it. Card turns **blue**.

The cashier never needs to remember what stage anything is in. The color tells them. The button tells them what comes next.

### 4E. Collecting the Money

The customer finishes and comes to pay.

1. **Find the card** (or search the customer's name in the search box).
2. **Tap how they paid** — two big buttons: **"Cash"** or **"POS"**.
3. *What happens:* the order stamps itself **"Paid – Cash (Ada)"** with Ada's name and the exact time, the card slides gracefully into the **Cleared Orders** area below, and the day's sales counters tick up.
4. **The receipt appears automatically.** A preview pops up: restaurant name, the items, the total, the payment method, a thank-you line. Two choices: **"Print Receipt"** (hands a paper receipt to the customer) or **"Skip"**. That's the whole payment.

**If the customer says "I'll pay tomorrow":**
Tap **Credit** instead. The card turns a special color and waits in the system. When the customer returns and pays, any cashier taps the card, chooses Cash or POS, and it closes properly. The Manager can always see every unpaid credit order on one list.

### 4F. When Something Goes Wrong

- **"I punched the wrong order!"** → Call the Manager. Voiding is deliberately *not* on the cashier's screen — it takes a manager's two-tap confirmation. This one rule protects the till from both mistakes and theft.
- **"The internet died!"** → A banner appears: the screen keeps working from memory (offline mode). Orders already on screen stay visible; payments wait until the connection returns. Nothing is lost.
- **"I can't find the order!"** → Type any part of the name, order number, or dish into the search box. The list filters as they type.
- **"A customer wants the order sent to their WhatsApp."** → Every card has a **WhatsApp Share** button — tap it and the customer's phone gets a neat order summary.

### 4G. Ending the Shift

1. **Look at "My Sales Today"** — the card at the top shows exactly how much *they personally* collected in cash and POS.
2. **Count the drawer.** It should match the cash number. Hand both numbers to the Manager, who sees the same figure on their Cashier Audit table. Two matching numbers = a clean shift.
3. **Tap logout.** The screen returns to the big number pad, ready for the next cashier.

**Golden rule for the Cashier journey:** *see card → tap the one big button → card changes color.* If a cashier only ever remembers the colors and the single big button on each card, they can run a full shift flawlessly.

---

## 5. Journey 4 — The Customer (Phase 2)

> ⚠️ **Phase 2 scope.** This journey is documented briefly on purpose. We build and polish the Super Admin, Manager, and Cashier journeys **first**. Only when staff operations run smoothly do we switch the customer-facing side on fully. The pieces below already exist in prototype form.

1. **Scan.** The guest points their phone camera at the QR code on the table. The menu opens in their browser — no app, no login, no typing an address. The table number is already filled in.
2. **Tap.** They browse big food pictures by category (Foods / Swallows / Pastries / Drinks), or search by name. Tap "+" to add to the basket. Suggestions appear: "People who bought this also loved…" and "Popular today".
3. **Order.** They review the basket, type their name and phone (phone earns loyalty points — 1 point per order, a free item at 10), tap **Place Order**. A success screen shows their order number and a countdown.
4. **Track.** A link (or `track.html` with their order number) shows a live step tracker: Received → Cooking → Ready → Served, auto-refreshing every 15 seconds.
5. **Pay.** They pay the cashier by cash or card (staff close the order), or settle later via credit.
6. **Review.** After paying, the tracking page offers a simple 1–5 star rating. It goes to the Manager for approval before appearing publicly.

---

## 6. The Shared Language — Colors, Sounds & Statuses

Everyone — Super Admin, Manager, Cashier, kitchen — reads the same visual language. No training manual needed; the colors *are* the manual.

| What you see | What it means | The one big button says |
|--------------|---------------|-------------------------|
| 🟡 **Yellow card** + a **ding** | New order, nobody started it | **Start Preparing** |
| 🟠 **Orange card** | Kitchen is cooking | **Mark Ready** |
| 🟢 **Green card** | Food is cooked and waiting | **Mark Served** |
| 🔵 **Blue card** | Guest has the food, money not yet taken | **Cash** / **POS** |
| ⚪ **Card slides down to "Cleared"** | Paid and finished | — (done) |
| 🟣 **Purple/Credit card** | Guest pays later | **Settle** (Cash/POS) |
| ⬛ **Grey, crossed out** | Voided by a Manager | — (frozen forever) |
| 🔴 **Red dot / red card** | Inventory running low | **Restock** |
| 🔴 **Timer under 60 seconds** | Food should be done *now* | — |

**Sounds:**
- **Ding** — a new order arrived (everyone hears it, nobody misses it).
- **Soft confirm tone** — your tap worked.
- **Toasts** — every action floats a small message ("Order confirmed", "Payment recorded") for ~3.5 seconds, then tidies itself away.

**The rule behind it all:** *color + icon + word, never color alone* — so the system works for the colorblind, the tired, and the brand-new.

---

## 7. Safety Nets — How Mevish Protects You From Mistakes

1. **"Are you sure?" before anything dangerous.** Deleting a menu item, removing a cashier, dropping a table — a small box pops up and waits for a deliberate yes. **Cancel** is always the easiest escape.
2. **Two-tap Void.** The most dangerous button in the building needs two deliberate taps, 4 seconds apart, and a Manager's login. A voided order is never erased — it is preserved, marked, and attributed.
3. **Nothing is ever truly deleted.** Voids, edits, payments, restocks — all leave footprints in the **Audit Log**: what happened, when, and who did it.
4. **The system does the math.** Totals, tax, change-worthy figures, profit, stock levels — all computed by the machine. Humans only tap and count physical cash.
5. **Sold-out is one tap.** Marking an item unavailable instantly stops anyone ordering food you can't cook.
6. **Offline doesn't mean helpless.** The screens keep working from memory when the internet drops, show a clear warning banner, and sync back when the connection returns.
7. **Everyone only sees what they need.** Cashiers can't void or see settings. Managers can't edit admin roles. The Super Admin sees everything. Fewer buttons = fewer mistakes.
8. **Auto-refresh you can trust.** A small spinning "live" indicator and a last-updated timestamp show the screen is current — no need to keep reloading "just in case".

---

*End of User Journeys. Next step: once the three staff journeys run smoothly on Firebase, we return to Journey 4 and give the customer side the same child-simple treatment.*
