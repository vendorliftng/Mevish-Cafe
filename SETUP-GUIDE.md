# 🍽️ Restaurant QR Ordering System — Setup Guide

This guide takes you from zero to a fully working, branded restaurant ordering
system in about **30 minutes**. The entire system is **config-driven** — you only
edit **one file** (`config.js`) to make it yours.

---

## What You Get

| Page | Purpose | URL |
|------|---------|-----|
| `index.html` | Customer ordering portal (scanned via table QR) | `/` |
| `home.html` | Public landing / marketing page | `/home.html` |
| `track.html` | Real-time order tracking for customers | `/track.html` |
| `menu-board.html` | Full-screen TV menu display | `/menu-board.html` |
| `dashboard.html` | Kitchen Display + Cashier terminal (PIN-locked) | `/dashboard.html` |
| `manager.html` | Manager analytics panel (PIN-locked) | `/manager.html` |
| `blog.html` / `article.html` | Blog for SEO & content marketing | `/blog.html` |
| `blog-admin.html` | Blog post editor (PIN-locked) | `/blog-admin.html` |

---

## Prerequisites

- A **Google account** (for the free backend spreadsheet + Apps Script)
- A **GitHub account** (for free hosting via GitHub Pages)
- Optional: a **WhatsApp number** for order notifications (uses free `wa.me` links)

No coding experience required — just copy, paste, and edit values.

---

## Step 1 — Copy This Codebase

1. Download/clone this repository to your computer.
2. Create a **new GitHub repository** for your restaurant (e.g. `MyRestaurant-Cafe`).
3. Upload all the files to your new repo.

---

## Step 2 — Create the Google Sheet (Backend)

1. Go to [sheets.new](https://sheets.new) to create a new Google Sheet.
2. Name it something like **"MyRestaurant Orders"**.
3. Create these tabs (sheet names, case-sensitive) with these exact column headers in **row 1**:

### `Menu` tab
| name | category | price | cost | prepTime | available | description | emoji |
|------|----------|-------|------|----------|-----------|-------------|-------|

### `Orders` tab
| timestamp | orderId | name | phone | items | total | status | tableNo | location |
|-----------|---------|------|-------|-------|-------|--------|---------|----------|

### `Inventory` tab
| name | category | currentStock | alertThreshold | unit | costPerUnit | supplier | minOrderQty |
|------|----------|--------------|----------------|------|-------------|----------|-------------|

### `Cashiers` tab
| name | active |
|------|--------|

### `Tables` tab
| id | label | seats |
|----|-------|-------|

### `Expenses` tab
| timestamp | category | description | amount | paidBy |
|-----------|----------|-------------|--------|--------|

### `Audit` tab
| timestamp | action | performedBy | details |
|-----------|--------|-------------|---------|

> Add at least one menu item to the `Menu` tab so the ordering portal has something to show.

---

## Step 3 — Deploy the Backend (Google Apps Script)

1. In your Google Sheet, click **Extensions → Apps Script**.
2. Delete any code in the editor, then **paste the entire contents of `Code.gs`** from this repo.
3. Click the **Deploy → New deployment** button (top right).
4. Click the gear icon ⚙️ → choose **Web app**.
5. Fill in:
   - **Description:** `Restaurant API v1`
   - **Execute as:** `Me (your-email@gmail.com)`
   - **Who has access:** `Anyone`
6. Click **Deploy**. Authorize the permissions when prompted.
7. **Copy the Web App URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`
8. Paste this URL into `config.js` as the `API_URL` value (Step 5 below).

> ⚠️ Whenever you edit `Code.gs` later, you must create a **new deployment** (or
> update the existing one under Deploy → Manage deployments → ✏️ Edit → Version: New version)
> for changes to take effect.

---

## Step 4 — Edit `config.js` (The Only File You Need to Touch)

Open `config.js` and update these values for your restaurant:

```js
const CONFIG = {

  // Paste your Apps Script Web App URL from Step 3
  API_URL: "https://script.google.com/macros/s/YOUR_ID/exec",

  RESTAURANT: {
    name:          "Your Restaurant Name",      // Full name
    shortName:     "YourRestaurant",            // First word — used in greetings
    tagline:       "Your Tagline Here",         // Used on homepage hero
    slogan:        "Your Slogan Here",          // Used on menu board
    city:          "YourCity",
    state:         "YourState",
    country:       "YourCountry",
    fullAddress:   "123 Main Street, Downtown",
    address:       "YourCity, YourState",
    phone:         "+1 555 0100",
    email:         "hello@yourrestaurant.com",
    whatsapp:      "+15550100",                 // International format, digits only
    kitchenWhatsapp: "+15550100",               // Can be a separate kitchen number
    instagram:     "@yourhandle",
    facebook:      "yourpage",
    hours:         "Mon–Sun: 8:00 AM – 10:00 PM",
    year:          "2026",

    locale:        "en-US",                     // en-NG, en-GB, en-US, etc.

    GOOGLE_PLACE_ID: "",                        // From your Google Maps listing URL
    mapsEmbedUrl:   "",                         // Google Maps → Share → Embed a map → copy src URL

    slug:          "yourrestaurant",            // Lowercase, no spaces — for localStorage keys

    cuisineTypes:  ["African", "Continental"],
    seatCount:     40,

    featuredItems: [                            // Up to 6 item NAMES that exist in your Menu sheet
      "Your Best Seller",
      "Second Popular Item",
      "Third Item",
    ],
  },

  CURRENCY: "$",                                // ₦, $, £, €, etc.

  BASE_URL: "https://yourusername.github.io/YourRestaurant-Cafe/",

  MANAGER_PIN:    "1234",                       // ← CHANGE before go-live
  BLOG_ADMIN_PIN: "5678",                       // ← CHANGE before go-live
};
```

### Locale & Currency
- `locale` controls date/time formatting and number grouping.
- `CURRENCY` is the symbol prefixed to all prices (`$`, `₦`, `£`, `€`).
- Prices in your Menu sheet are plain numbers (no symbol) — e.g. `6000` for ₦6,000.

### Categories
Edit `CONFIG.CATEGORIES` to match how your Menu sheet groups items:
```js
CATEGORIES: ["All", "Mains", "Sides", "Desserts", "Drinks"],
```
And matching emoji in `CONFIG.CATEGORY_ICONS`.

---

## Step 5 — Publish to GitHub Pages (Free Hosting)

1. In your GitHub repo, go to **Settings → Pages**.
2. Under **Source**, select your `main` branch and `/ (root)` folder.
3. Click **Save**.
4. Wait 1–2 minutes. Your site will be live at:
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
5. Paste this URL back into `config.js` as `BASE_URL` and re-commit.

---

## Step 6 — Generate Table QR Codes

1. Open your live site: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/manager.html`
2. Enter your `MANAGER_PIN`.
3. Go to **Tables & QR** tab.
4. Add your tables (or use the defaults).
5. Click **Generate All QR Codes** → download/print each QR.
6. Each QR encodes a URL like `…/index.html?table=T1`. Place the printed QR on each table.

Customers scan → the menu opens with their table number pre-filled → they order.

---

## Step 7 — Test the Full Flow

1. **Order:** Scan a QR (or open `index.html?table=T1`) → add items → place order.
2. **Kitchen:** Open `dashboard.html` → enter PIN → see the order appear → mark Preparing → Ready → Served → Pay (Cash/POS) → print receipt.
3. **Track:** Customer opens `track.html` → enters Order ID → sees live status.
4. **Analytics:** Open `manager.html` → see revenue, charts, inventory alerts.

---

## Customizing the Look (Themes)

In `manager.html` → **Themes** tab, pick from preset color schemes (Classic Teal, Midnight Gold, Sunset Warm, Forest Green, Royal Purple). The theme is saved per-device.

To add your own theme, add an entry to `CONFIG.THEMES` in `config.js`.

---

## Security Checklist Before Go-Live

- [ ] Changed `MANAGER_PIN` from `1234` to a strong PIN
- [ ] Changed `BLOG_ADMIN_PIN` from `5678`
- [ ] Verified `API_URL` points to your own Apps Script deployment
- [ ] Verified the Apps Script is deployed as **"Anyone"** access
- [ ] Removed any test orders from the Google Sheet
- [ ] Confirmed all menu items have correct prices

---

## Troubleshooting

**Menu doesn't load on the ordering portal?**
→ Check `API_URL` is correct and the Apps Script is deployed as "Anyone".
→ Open the Apps Script → Executions tab to see errors.
→ Confirm your `Menu` sheet tab name and column headers exactly match Step 2.

**Orders aren't appearing in the dashboard?**
→ Same as above — it's an API/sheet issue. Check column headers in `Orders`.

**Prices show the wrong currency symbol?**
→ Set `CONFIG.CURRENCY` in `config.js`.

**QR codes link to the wrong URL?**
→ Set `CONFIG.BASE_URL` to your GitHub Pages URL.

**Theme resets on refresh?**
→ localStorage may be blocked (private browsing). Use a normal browser tab.

---

## Optional Enhancements (Already Built In)

- **WhatsApp notifications** — customers can tap "Send Order to Kitchen via WhatsApp" on the success screen (uses free `wa.me` links; set `kitchenWhatsapp` in config).
- **Loyalty points** — repeat customers earn points toward a free item.
- **Smart upselling** — "Popular Today" and "Complete Your Meal" suggestions.
- **Customer reviews** — star ratings collected after order completion; moderated in the manager panel.
- **Blog** — `blog.html` + `blog-admin.html` for SEO content (posts stored in the Google Sheet).

---

## Need Help?

Check the code comments in `config.js` — every field is documented. The system is
designed so that **you never need to edit the HTML files**; everything customer-facing
is driven by `config.js` and your Google Sheet data.
