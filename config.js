// ============================================================
// Restaurant QR Ordering System — Central Configuration
// Edit ONLY this file to reconfigure the entire system.
// Every restaurant gets their own copy of the codebase.
// ============================================================

const CONFIG = {

  // ─── API ────────────────────────────────────────────────
  // Paste your deployed Google Apps Script Web App URL here.
  // Deploy → Manage Deployments → Copy Web App URL
  API_URL: "https://script.google.com/macros/s/AKfycby-Ght4h30xNFsu8jjGaEsb9wkmCUVaSECJ9j0Gzn6CXqZJ-4SERFyMh5wuwOE9Xy4Zig/exec",

  // ─── Restaurant Identity ─────────────────────────────────
  RESTAURANT: {
    name:          "Mevish Eatery",
    shortName:     "Mevish",            // First word — used in greetings
    tagline:       "Where Every Bite Tells a Story",
    slogan:        "Premium Food. Fast Service. Real Flavour.",
    city:          "Yola",
    state:         "Adamawa",
    country:       "Nigeria",
    fullAddress:   "Modibbo Aliyu Way, Karewa, Jimeta",
    address:       "Yola, Adamawa State, Nigeria",
    phone:         "+234 9036648535",
    email:         "vendorliftng@gmail.com",
    whatsapp:      "+234 9036648535",
    kitchenWhatsapp: "+234 9036648535",  // WhatsApp for kitchen orders (can differ from main)
    instagram:     "@mevisheatery",
    facebook:      "mevisheatery",
    hours:         "Monday – Sunday: 8:00 AM – 09:00 PM",
    year:          "2026",

    // ─── Locale & Formatting ────────────────────────────────
    locale:        "en-NG",             // Used by toLocaleDateString / toLocaleTimeString

    // ─── Google Place ID (for reviews embed) ──────────────────
    // Hex CID extracted from https://maps.app.goo.gl/83dYVqV9tGSDxYS58
    GOOGLE_PLACE_ID: "0x10fc6bed79158337:0xfe937db2e8e91aca",

    // ─── Google Maps Embed ──────────────────────────────────
    // Full embed URL for the restaurant location iframe
    mapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3920.5!2d12.5!3d9.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMevish+Eatery!5e0!3m2!1sen!2sng",

    // ─── Replication ────────────────────────────────────────
    slug:          "mevish",            // Used for localStorage keys, CSS prefixes

    // ─── Cuisine & Capacity ──────────────────────────────────
    cuisineTypes:  ["African", "Continental", "Pastries", "Drinks"],
    seatCount:     60,

    // ─── Featured Items (shown on homepage) ───────────────────
    // List up to 6 item names that match items in your Menu sheet
    featuredItems: [
      "Jollof/Fried Rice Chicken",
      "Mevish Pizza (Pineapple/Sausage/Chicken)",
      "Shawarma Double Sausage",
      "Swallow & Soup with Chicken",
      "Burger with Cheese & Fries",
      "Ice Cream Cone"
    ],

    // ─── Loyalty Program ────────────────────────────────────
    loyaltyPointsPerOrder: 1,   // Points earned per order
    loyaltyRewardThreshold: 10, // Points needed for a free item
  },

  // ─── Currency ────────────────────────────────────────────
  CURRENCY: "₦",

  formatCurrency(amount) {
    const n = Number(amount) || 0;
    return CONFIG.CURRENCY + n.toLocaleString(CONFIG.RESTAURANT.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

  // ─── Storage Prefix (prevents collisions between restaurants) ──
  STORAGE_PREFIX: "mevish_",

  // ─── Base URL (your custom domain or GitHub Pages) ──────
  BASE_URL: "https://mevish.com.ng/",

  // ─── Tables (loaded from API; fallback below) ────────────
  TABLES: [],

  // Fallback tables used if API is unreachable
  FALLBACK_TABLES: [
    "T1","T2","T3","T4","T5",
    "T6","T7","T8","T9","T10",
    "T11","T12","T13","T14","T15",
    "Counter"
  ],

  // ─── Theme System ────────────────────────────────────────
  // Preset themes the manager can choose from.
  // Each theme defines CSS custom properties.
  THEMES: {
    "default": {
      label: "Classic Teal",
      primary:      "#0d9488",
      primaryDark:  "#0f766e",
      primaryLight: "#ccfbf1",
      accent:       "#f59e0b",
      accentDark:   "#d97706",
      bg:           "#f8fafc",
      bgCard:       "#ffffff",
      bgSidebar:    "#0f172a",
      text:         "#1e293b",
      textLight:    "#64748b",
      textOnPrimary:"#ffffff",
      border:       "#e2e8f0",
      success:      "#16a34a",
      danger:       "#dc2626",
      warning:      "#ea580c",
      info:         "#2563eb",
      shadow:       "0 1px 3px rgba(0,0,0,0.08)",
      radius:       "12px",
    },
    "midnight": {
      label: "Midnight Gold",
      primary:      "#b8860b",
      primaryDark:  "#996f09",
      primaryLight: "#fef3c7",
      accent:       "#e11d48",
      accentDark:   "#be123c",
      bg:           "#0f172a",
      bgCard:       "#1e293b",
      bgSidebar:    "#020617",
      text:         "#f1f5f9",
      textLight:    "#94a3b8",
      textOnPrimary:"#0f172a",
      border:       "#334155",
      success:      "#22c55e",
      danger:       "#ef4444",
      warning:      "#f97316",
      info:         "#3b82f6",
      shadow:       "0 1px 3px rgba(0,0,0,0.3)",
      radius:       "12px",
    },
    "sunset": {
      label: "Sunset Warm",
      primary:      "#ea580c",
      primaryDark:  "#c2410c",
      primaryLight: "#ffedd5",
      accent:       "#7c3aed",
      accentDark:   "#6d28d9",
      bg:           "#fffbeb",
      bgCard:       "#ffffff",
      bgSidebar:    "#451a03",
      text:         "#1c1917",
      textLight:    "#78716c",
      textOnPrimary:"#ffffff",
      border:       "#e7e5e4",
      success:      "#16a34a",
      danger:       "#dc2626",
      warning:      "#ea580c",
      info:         "#2563eb",
      shadow:       "0 1px 3px rgba(0,0,0,0.06)",
      radius:       "16px",
    },
    "forest": {
      label: "Forest Green",
      primary:      "#15803d",
      primaryDark:  "#166534",
      primaryLight: "#dcfce7",
      accent:       "#ca8a04",
      accentDark:   "#a16207",
      bg:           "#f0fdf4",
      bgCard:       "#ffffff",
      bgSidebar:    "#14532d",
      text:         "#1e293b",
      textLight:    "#64748b",
      textOnPrimary:"#ffffff",
      border:       "#bbf7d0",
      success:      "#16a34a",
      danger:       "#dc2626",
      warning:      "#ea580c",
      info:         "#2563eb",
      shadow:       "0 1px 3px rgba(0,0,0,0.06)",
      radius:       "12px",
    },
    "royal": {
      label: "Royal Purple",
      primary:      "#7c3aed",
      primaryDark:  "#6d28d9",
      primaryLight: "#ede9fe",
      accent:       "#f43f5e",
      accentDark:   "#e11d48",
      bg:           "#faf5ff",
      bgCard:       "#ffffff",
      bgSidebar:    "#3b0764",
      text:         "#1e1b4b",
      textLight:    "#6b7280",
      textOnPrimary:"#ffffff",
      border:       "#e9d5ff",
      success:      "#16a34a",
      danger:       "#dc2626",
      warning:      "#ea580c",
      info:         "#2563eb",
      shadow:       "0 1px 3px rgba(0,0,0,0.06)",
      radius:       "14px",
    },
  },

  // Apply a theme by name (id string like "default", "midnight", etc.)
  // Falls back to "default" if theme not found.
  applyTheme(themeId) {
    const theme = this.THEMES[themeId] || this.THEMES["default"];
    const root = document.documentElement;
    root.style.setProperty("--c-primary",      theme.primary);
    root.style.setProperty("--c-primary-dark",  theme.primaryDark);
    root.style.setProperty("--c-primary-light", theme.primaryLight);
    root.style.setProperty("--c-accent",        theme.accent);
    root.style.setProperty("--c-accent-dark",   theme.accentDark);
    root.style.setProperty("--c-bg",            theme.bg);
    root.style.setProperty("--c-bg-card",       theme.bgCard);
    root.style.setProperty("--c-bg-sidebar",    theme.bgSidebar);
    root.style.setProperty("--c-text",          theme.text);
    root.style.setProperty("--c-text-light",    theme.textLight);
    root.style.setProperty("--c-text-on-primary",theme.textOnPrimary);
    root.style.setProperty("--c-border",        theme.border);
    root.style.setProperty("--c-success",       theme.success);
    root.style.setProperty("--c-danger",        theme.danger);
    root.style.setProperty("--c-warning",       theme.warning);
    root.style.setProperty("--c-info",          theme.info);
    root.style.setProperty("--c-shadow",        theme.shadow);
    root.style.setProperty("--c-radius",        theme.radius);

    // ─── Drive the style.css variable family too ─────────────
    // style.css (dashboard, manager, POS, modals) is built on the
    // --gold / --bg-* / --text-* family. Without this mapping,
    // switching themes only recolored --c-* components and looked
    // like "the theme is not working".
    root.style.setProperty("--gold",            theme.primary);
    root.style.setProperty("--gold-dark",       theme.primaryDark);
    root.style.setProperty("--gold-light",      theme.primaryLight);
    root.style.setProperty("--orange",          theme.accent);
    root.style.setProperty("--bg-deep",         theme.bg);
    root.style.setProperty("--bg-primary",      theme.bg);
    root.style.setProperty("--bg-secondary",    theme.bgCard);
    root.style.setProperty("--bg-card",         theme.bgCard);
    root.style.setProperty("--bg-surface",      theme.bgCard);
    root.style.setProperty("--bg-hover",        theme.bgCard);
    root.style.setProperty("--text-primary",    theme.text);
    root.style.setProperty("--text-secondary",  theme.textLight);
    root.style.setProperty("--text-muted",      theme.textLight);
    root.style.setProperty("--border",          theme.border);
    root.style.setProperty("--border-light",    theme.border);
    root.style.setProperty("--success",         theme.success);
    root.style.setProperty("--danger",          theme.danger);
    root.style.setProperty("--warning",         theme.warning);
    root.style.setProperty("--info",            theme.info);
    root.style.setProperty("--r-md",            theme.radius);
    localStorage.setItem(CONFIG.STORAGE_PREFIX + "theme", themeId);
  },

  // Load theme: try localStorage first, then fall back to "default"
  loadSavedTheme() {
    const saved = localStorage.getItem(CONFIG.STORAGE_PREFIX + "theme");
    if (saved && this.THEMES[saved]) {
      this.applyTheme(saved);
      return saved;
    }
    this.applyTheme("default");
    return "default";
  },

  // Fetch tables from API, fall back to FALLBACK_TABLES
  async fetchTables() {
    try {
      const res = await fetch(CONFIG.API_URL + "?type=tables");
      const json = await res.json();
      if (json.status === "success" && json.data.length > 0) {
        CONFIG.TABLES = json.data.map(t => t.id);
        return CONFIG.TABLES;
      }
    } catch (e) { /* ignore */ }
    CONFIG.TABLES = [...CONFIG.FALLBACK_TABLES];
    return CONFIG.TABLES;
  },

  // ─── Security PINs ───────────────────────────────────────
  MANAGER_PIN:    "1234",   // ← CHANGE before go-live
  BLOG_ADMIN_PIN: "5678",   // ← CHANGE before go-live

  // ─── Auto-Refresh Intervals (ms) ────────────────────────
  REFRESH_INTERVAL: 30000,  // Dashboard order list refresh
  TRACKER_INTERVAL: 15000,  // Order tracker status refresh

  // ─── Menu Categories ─────────────────────────────────────
  CATEGORIES: ["All", "Foods", "Swallows", "Pastries", "Drinks"],

  // Category emoji icons used on the ordering portal
  CATEGORY_ICONS: {
    "Foods":    "🍽️",
    "Swallows": "🥘",
    "Pastries": "🥐",
    "Drinks":   "🥤",
    "All":      "🍴",
  },

  // ─── Prep Timer Options (minutes) ────────────────────────
  PREP_TIMERS: [5, 10, 15, 30],

  // ─── Order Status Strings ────────────────────────────────
  STATUS: {
    ACTIVE:  "Active",
    READY:   "Ready",
    VOID:    "Void",
    CREDIT:  "Unpaid (Credit)",

    paidCash: (cashier) => `Paid - Cash (${cashier})`,
    paidPOS:  (cashier) => `Paid - POS (${cashier})`,

    isPaid:   (s) => !!(s && s.includes("Paid")),
    isCredit: (s) => !!(s && s.includes("Credit")),
    isVoid:   (s) => !!(s && s.includes("Void")),
    isActive: (s) => !!(s && (s === "Active" || s === "Ready")),

    getBadgeClass(s) {
      if (!s) return "badge-active";
      if (s.includes("Paid"))   return "badge-paid";
      if (s.includes("Credit")) return "badge-credit";
      if (s.includes("Void"))   return "badge-void";
      if (s === "Ready")        return "badge-ready";
      return "badge-active";
    },

    getLabel(s) {
      if (!s) return "Active";
      if (s.includes("Paid - Cash")) return "Paid · Cash";
      if (s.includes("Paid - POS"))  return "Paid · POS";
      if (s.includes("Credit"))      return "Credit";
      if (s.includes("Void"))        return "Void";
      if (s === "Ready")             return "Ready";
      return "Active";
    },

    getCashier(s) {
      if (!s) return null;
      const m = s.match(/\(([^)]+)\)/);
      return m ? m[1] : null;
    },

    getMethod(s) {
      if (!s) return null;
      if (s.includes("Cash")) return "Cash";
      if (s.includes("POS"))  return "POS";
      return null;
    }
  },

  // ─── Blog Categories ─────────────────────────────────────
  BLOG_CATEGORIES: [
    "Food & Culture",
    "Menu Spotlight",
    "News & Events",
    "Recipes & Tips",
    "Behind the Scenes"
  ],

  // ─── Receipt ─────────────────────────────────────────────
  get RECEIPT_FOOTER() {
    return "Thank you for dining at " + CONFIG.RESTAURANT.name + "!\nFollow us " + CONFIG.RESTAURANT.instagram;
  },

  // ─── WhatsApp Helper ─────────────────────────────────────
  // Build a wa.me link to send a pre-filled message to the restaurant
  buildWhatsAppUrl(message) {
    const phone = (CONFIG.RESTAURANT.kitchenWhatsapp || CONFIG.RESTAURANT.whatsapp).replace(/[^0-9]/g, "");
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  },

  // Build order message for WhatsApp
  buildOrderMessage(orderId, customerName, customerPhone, itemsText, totalPrice, location) {
    return "🛎️ New Order!\n\n" +
      "Order: " + orderId + "\n" +
      "Customer: " + customerName + (customerPhone ? " (" + customerPhone + ")" : "") + "\n" +
      "Items: " + itemsText + "\n" +
      "Total: " + CONFIG.formatCurrency(totalPrice) + "\n" +
      "Table: " + (location || "N/A");
  },

  // ─── API Helpers ───────────────────────────────────────
  // Standard GET wrapper
  async apiGet(type, params) {
    if (typeof db !== 'undefined' && db) {
      try {
        if (type === 'orders') {
          const snapshot = await db.collection('orders').orderBy('timestamp', 'desc').limit(100).get();
          return { status: 'success', data: snapshot.docs.map(doc => doc.data()) };
        }
        if (type === 'menu') {
          const snapshot = await db.collection('menu_items').get();
          if (!snapshot.empty) {
            return { status: 'success', data: snapshot.docs.map(doc => {
              let item = doc.data();
              item.id = doc.id;
              return item;
            }) };
          }
          return { status: 'success', data: CONFIG.FALLBACK_MENU };
        }
        if (type === 'reviews') {
          return { status: 'success', data: [] }; // reviews not yet migrated
        }
        if (type === 'inventory') {
          const snapshot = await db.collection('inventory').get();
          return { status: 'success', data: snapshot.docs.map(doc => {
            let item = doc.data();
            item.id = doc.id;
            return item;
          }) };
        }
        if (type === 'expenses') {
          const snapshot = await db.collection('expenses').orderBy('date', 'desc').get();
          return { status: 'success', data: snapshot.docs.map(doc => {
            let item = doc.data();
            item.id = doc.id;
            return item;
          }) };
        }
        if (type === 'auditLog') {
          const snapshot = await db.collection('audit_log').orderBy('timestamp', 'desc').limit(200).get();
          return { status: 'success', data: snapshot.docs.map(doc => doc.data()) };
        }
        // NOTE: 'loginCashier' is deliberately NOT handled here. Cashiers still
        // live in the Sheets-backed `Cashiers` list (Code.gs), which already does
        // a real PIN + active-status check server-side. Do not add a Firestore
        // stub here that accepts every PIN — that was a real security hole
        // (any 4-digit PIN logged a "cashier" in with a fabricated name). Let
        // this fall through to the real GAS call below. Proper fix (FR-1.4,
        // PRD): move `staff` into Firestore with a hashed PIN verified by a
        // Cloud Function.
      } catch (err) {
        console.error("Firestore apiGet error:", err);
      }
    }
    // Fallback to GAS API
    let url = CONFIG.API_URL + "?type=" + type;
    if (params) {
      Object.keys(params).forEach(k => { url += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); });
    }
    const res = await fetch(url);
    return await res.json();
  },

  // Standard POST wrapper with CORS workaround for Google Apps Script
  async apiPost(action, payload) {
    if (typeof db !== 'undefined' && db) {
      try {
        if (action === 'newOrder') {
          payload.timestamp = Date.now();
          // Normalize legacy 'Pending' to the canonical 'Active' status
          payload.status = (payload.status && payload.status !== 'Pending') ? payload.status : 'Active';

          if (payload.items && Array.isArray(payload.items) && payload.items.length) {
            // Structured items (AD-5) are the source of truth when supplied.
            // Derive parsedItems (used for "Most Ordered" popularity counts)
            // and revenue/cost/profit from it as a safety net, in case a
            // caller sent items[] without also computing these (UX-7: the
            // system does the math, callers shouldn't have to duplicate it).
            payload.parsedItems = payload.items.map(i => ({ qty: i.qty || i.quantity || 1, name: i.name || '' }));
            if (payload.totalRevenue === undefined) {
              payload.totalRevenue = payload.items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (i.qty || i.quantity || 1), 0);
            }
            if (payload.totalCost === undefined) {
              payload.totalCost = payload.items.reduce((s, i) => s + (Number(i.unitCost) || 0) * (i.qty || i.quantity || 1), 0);
            }
            if (payload.profit === undefined) {
              payload.profit = payload.totalRevenue - payload.totalCost;
            }
          } else if (payload.cartItems && typeof payload.cartItems === 'string') {
            // Legacy path: no structured items supplied, only the pipe string.
            const clean = payload.cartItems.split(' (Notes:')[0];
            payload.parsedItems = clean.split(' | ').map(part => {
              const m = part.trim().match(/^(\d+)x\s+(.+)$/);
              return m ? { qty: parseInt(m[1], 10), name: m[2].trim() } : null;
            }).filter(Boolean);
          }

          await db.collection('orders').doc(payload.orderId).set(payload);
          CONFIG.writeAudit('ORDER_CREATED', payload.orderId,
            'Total: ' + (payload.totalPrice || payload.total || 0), payload.cashier || payload.customerName || 'System');
          // NOTE: inventory is deducted on first PAYMENT (see deductInventoryForOrder,
          // called from 'updateStatus' and 'settleCredit'), not here at order creation.
          // Deducting at creation meant a voided or never-paid order still consumed real
          // stock — see FR-3.5/FR-5.2 in the PRD.
          return { status: 'success', data: payload };
        }
        if (action === 'updateOrder') {
          if (payload.status === 'Void') {
            // Never delete orders — preserve voids for history and audit
            await db.collection('orders').doc(payload.orderId).update({ status: 'Void', voidedAt: Date.now() });
            CONFIG.writeAudit('ORDER_VOIDED', payload.orderId, '', payload.cashier || 'Manager');
          } else {
            await db.collection('orders').doc(payload.orderId).update({ status: payload.status });
            CONFIG.writeAudit('STATUS_UPDATED', payload.orderId, 'Status -> ' + payload.status, payload.cashier || 'System');
          }
          return { status: 'success', data: payload };
        }
        if (action === 'updateStatus') {
          const orderId = payload.orderId;
          const newStatus = payload.newStatus || payload.status || '';
          const cashier = payload.cashier || '';
          const updates = { status: newStatus };
          let auditAction = 'STATUS_UPDATED';
          let auditDetails = 'Status -> ' + newStatus;
          if (newStatus.indexOf('Preparing') === 0) {
            updates.prepStartedAt = Date.now();
            auditAction = 'PREP_STARTED';
          } else if (newStatus === 'Ready') {
            updates.readyAt = Date.now();
            auditAction = 'ORDER_READY';
          } else if (newStatus === 'Served') {
            updates.servedAt = Date.now();
            auditAction = 'ORDER_SERVED';
          } else if (newStatus.indexOf('Paid') === 0) {
            updates.paidAt = Date.now();
            updates.paymentMethod = (newStatus.indexOf('POS') >= 0) ? 'POS' : 'Cash';
            updates.cashierName = cashier;
            auditAction = 'PAYMENT_RECEIVED';
            auditDetails = updates.paymentMethod + ' payment received' + (cashier ? ' by ' + cashier : '');
            // First payment triggers stock deduction (FR-3.5). Idempotency is
            // enforced inside deductInventoryForOrder itself via a claim
            // transaction, so a double-tap or retry here can never double-deduct.
            await CONFIG.deductInventoryForOrder(orderId);
          } else if (newStatus.indexOf('Void') === 0) {
            updates.voidedAt = Date.now();
            updates.voidedBy = cashier || 'Manager';
            auditAction = 'ORDER_VOIDED';
            auditDetails = 'Order voided' + (cashier ? ' by ' + cashier : '');
          } else if (newStatus.indexOf('Credit') >= 0) {
            updates.cashierName = cashier;
            auditAction = 'CREDIT_ISSUED';
            auditDetails = 'Credit issued' + (cashier ? ' by ' + cashier : '');
          }
          await db.collection('orders').doc(orderId).update(updates);
          CONFIG.writeAudit(auditAction, orderId, auditDetails, cashier || 'System');
          return { status: 'success', data: { orderId: orderId, status: newStatus } };
        }
        if (action === 'settleCredit') {
          const cashier = payload.cashier || '';
          const method = payload.method || payload.paymentMethod || 'Cash';
          const newStatus = 'Paid - ' + method + ' (' + cashier + ')';
          await db.collection('orders').doc(payload.orderId).update({
            status: newStatus,
            paymentMethod: method,
            cashierName: cashier,
            paidAt: Date.now(),
            creditSettledAt: Date.now()
          });
          // Credit orders were never deducted at issue time (FR-3.5) — settlement
          // is their first real payment, so it's deducted now.
          await CONFIG.deductInventoryForOrder(payload.orderId);
          CONFIG.writeAudit('CREDIT_SETTLED', payload.orderId, 'Credit settled via ' + method + (cashier ? ' by ' + cashier : ''), cashier || 'System');
          return { status: 'success', data: { orderId: payload.orderId, status: newStatus } };
        }
        if (action === 'addMenuItem') {
          // payload.id is already generated via Date.now() in manager.html
          await db.collection('menu_items').doc(String(payload.id)).set(payload);
          CONFIG.writeAudit('MENU_ITEM_ADDED', '', payload.name || '', payload.cashier || 'Manager');
          return { status: 'success', data: payload };
        }
        if (action === 'updateMenuItem') {
          await db.collection('menu_items').doc(String(payload.id)).update(payload);
          CONFIG.writeAudit('MENU_ITEM_UPDATED', '', payload.name || ('ID ' + payload.id), payload.cashier || 'Manager');
          return { status: 'success', data: payload };
        }
        if (action === 'deleteMenuItem') {
          await db.collection('menu_items').doc(String(payload.id)).delete();
          CONFIG.writeAudit('MENU_ITEM_DELETED', '', 'ID ' + payload.id, payload.cashier || 'Manager');
          return { status: 'success' };
        }
        if (action === 'addExpense') {
          payload.id = 'EXP-' + Date.now();
          await db.collection('expenses').doc(payload.id).set(payload);
          CONFIG.writeAudit('EXPENSE_ADDED', '', (payload.category || '') + ': ' + (payload.amount || 0), payload.recordedBy || payload.cashier || 'Manager');
          return { status: 'success', data: payload };
        }
        if (action === 'updateExpense') {
          await db.collection('expenses').doc(String(payload.id)).update(payload);
          CONFIG.writeAudit('EXPENSE_UPDATED', '', (payload.category || '') + ': ' + (payload.amount || 0), payload.recordedBy || payload.cashier || 'Manager');
          return { status: 'success', data: payload };
        }
        if (action === 'deleteExpense') {
          await db.collection('expenses').doc(String(payload.id)).delete();
          CONFIG.writeAudit('EXPENSE_DELETED', '', 'ID ' + payload.id, payload.cashier || 'Manager');
          return { status: 'success' };
        }
        if (action === 'addInventoryItem') {
          await db.collection('inventory').doc(String(payload.id)).set(payload);
          CONFIG.writeAudit('INVENTORY_ITEM_ADDED', '', payload.name || '', payload.cashier || 'Manager');
          return { status: 'success', data: payload };
        }
        if (action === 'updateInventoryItem') {
          await db.collection('inventory').doc(String(payload.id)).update(payload);
          CONFIG.writeAudit('INVENTORY_ITEM_UPDATED', '', payload.name || ('ID ' + payload.id), payload.cashier || 'Manager');
          return { status: 'success', data: payload };
        }
      } catch (err) {
        console.error("Firestore apiPost error:", err);
      }
    }
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, ...payload }),
      redirect: "follow",
    });
    return await res.json();
  },

  // ─── Inventory deduction on first payment (FR-3.5 / FR-5.2) ──────────
  // Deducting at order-creation time meant voided or never-paid orders still
  // consumed real stock. Deduction now happens on first payment / credit
  // settlement instead, guarded so it can only ever fire once per order.
  //
  // The guard is a small transaction on the ORDER doc itself: read
  // `inventoryDeducted`, and if it's not already true, claim it (set true)
  // in that same transaction before doing anything else. Two simultaneous
  // "first payment" calls for the same order race on that one transaction;
  // Firestore guarantees only one of them sees `inventoryDeducted: false`
  // and proceeds — the other sees `true` and backs off. This is the same
  // pattern the PRD asks for at FR-5.2's AC ("two simultaneous sales of the
  // last unit never drive stock negative").
  async claimInventoryDeduction(orderId) {
    const orderRef = db.collection('orders').doc(orderId);
    return await db.runTransaction(async (tx) => {
      const doc = await tx.get(orderRef);
      if (!doc.exists) return null;
      const data = doc.data();
      if (data.inventoryDeducted) return null; // already claimed by an earlier call
      tx.update(orderRef, { inventoryDeducted: true });
      return data;
    });
  },

  async deductInventoryForOrder(orderId) {
    if (!orderId) return;
    let orderData;
    try {
      orderData = await CONFIG.claimInventoryDeduction(orderId);
    } catch (e) {
      console.error("Inventory deduction claim failed for " + orderId, e);
      return;
    }
    if (!orderData) return; // nothing to do — already deducted, or order missing
    const items = orderData.items;
    if (!items || !Array.isArray(items)) return;
    for (const item of items) {
      if (item.linkedInventoryId && item.deductionQty) {
        const deduction = parseFloat(item.deductionQty) * (item.quantity || item.qty || 1);
        if (deduction > 0) {
          const invRef = db.collection('inventory').doc(item.linkedInventoryId);
          try {
            await db.runTransaction(async (transaction) => {
              const doc = await transaction.get(invRef);
              if (doc.exists) {
                const newStock = Math.max(0, (doc.data().currentStock || 0) - deduction);
                transaction.update(invRef, { currentStock: newStock });
              }
            });
          } catch (e) {
            console.error("Auto-deduct error for " + item.name, e);
          }
        }
      }
    }
  },

  // ─── Audit Log (Firestore-native) ──────────────────────
  // Append-only audit entry. Fire-and-forget: never blocks the main action.
  writeAudit(action, orderId, details, performedBy) {
    try {
      if (typeof db !== 'undefined' && db) {
        db.collection('audit_log').add({
          timestamp: Date.now(),
          action: action || 'UNKNOWN',
          orderId: orderId || '',
          details: details || '',
          performedBy: performedBy || 'System'
        }).catch(e => console.warn('Audit write failed:', e));
      }
    } catch (e) { /* audit must never break the app */ }
  },

  // ─── Client-Side Caching (localStorage) ──────────────────
  // Cache a GET response in localStorage with a TTL (in minutes).
  // Returns cached data instantly if fresh; otherwise fetches from API.
  async cachedGet(type, params, ttlMinutes) {
    const key = CONFIG.STORAGE_PREFIX + "cache_" + type;
    let cachedRaw = null;
    try { cachedRaw = localStorage.getItem(key); } catch (e) {}
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        const ageMin = (Date.now() - cached.t) / 60000;
        if (ageMin < ttlMinutes && cached.data) {
          return cached.data; // Return cached instantly
        }
      } catch (e) {}
    }
    // Fetch fresh
    const fresh = await CONFIG.apiGet(type, params);
    try {
      localStorage.setItem(key, JSON.stringify({ t: Date.now(), data: fresh }));
    } catch (e) { /* storage full or blocked */ }
    return fresh;
  },

  // Get cached data synchronously (for instant UI render), then fetch fresh in background.
  // Returns { cached: dataOrNull, refresh: promiseOfFreshData }
  instantGet(type, params, ttlMinutes) {
    const key = CONFIG.STORAGE_PREFIX + "cache_" + type;
    let cachedData = null;
    try {
      const cachedRaw = localStorage.getItem(key);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const ageMin = (Date.now() - cached.t) / 60000;
        if (ageMin < ttlMinutes) cachedData = cached.data;
      }
    } catch (e) {}

    const refreshPromise = CONFIG.apiGet(type, params).then(function(fresh) {
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), data: fresh })); } catch (e) {}
      return fresh;
    }).catch(function() { return cachedData; }); // fail silently to cache

    return { cached: cachedData, refresh: refreshPromise };
  },

  // Clear a specific cache
  clearCache(type) {
    try { localStorage.removeItem(CONFIG.STORAGE_PREFIX + "cache_" + type); } catch (e) {}
  },

  // ─── Order ID Generator ──────────────────────────────────
  generateOrderId() {
    const now  = new Date();
    const y    = now.getFullYear();
    const mo   = String(now.getMonth() + 1).padStart(2, "0");
    const d    = String(now.getDate()).padStart(2, "0");
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `ORD-${y}${mo}${d}-${rand}`;
  },

  // ─── Guest Name Generator ────────────────────────────────
  generateGuestName() {
    return `Guest-${String(Math.floor(100 + Math.random() * 900))}`;
  },

  // ─── Fallback Menu (used if API is unavailable) ──────────
  // Keep empty to force API load; restaurants should always use their Google Sheet.
  // If API fails, the UI will show a retry button.
  FALLBACK_MENU: [
    { name: "Jollof/Fried Rice Chicken", category: "Foods", price: 3500, available: true, emoji: "🍗", desc: "Delicious local rice with spiced chicken.", prepTime: 15 },
    { name: "Mevish Pizza (Pineapple/Sausage/Chicken)", category: "Pastries", price: 5000, available: true, emoji: "🍕", desc: "Our signature pizza with all the toppings.", prepTime: 25 },
    { name: "Shawarma Double Sausage", category: "Pastries", price: 2500, available: true, emoji: "🌯", desc: "Juicy shawarma loaded with double sausage.", prepTime: 10 },
    { name: "Swallow & Soup with Chicken", category: "Swallows", price: 4000, available: true, emoji: "🍲", desc: "Traditional swallow with rich soup and chicken.", prepTime: 20 },
    { name: "Burger with Cheese & Fries", category: "Pastries", price: 3000, available: true, emoji: "🍔", desc: "Cheeseburger served with crispy fries.", prepTime: 15 },
    { name: "Ice Cream Cone", category: "Drinks", price: 1000, available: true, emoji: "🍦", desc: "Sweet and creamy vanilla ice cream.", prepTime: 2 },
    { name: "Coke / Fanta / Sprite", category: "Drinks", price: 500, available: true, emoji: "🥤", desc: "Chilled soft drinks.", prepTime: 1 },
    { name: "Bottled Water", category: "Drinks", price: 300, available: true, emoji: "💧", desc: "Cold refreshing water.", prepTime: 1 }
  ],

  // ─── Initialize Storage Prefix from Slug ─────────────────
  // Called once at startup in each page's init function
  initStoragePrefix() {
    if (CONFIG.RESTAURANT.slug && CONFIG.STORAGE_PREFIX === "mevish_") {
      CONFIG.STORAGE_PREFIX = CONFIG.RESTAURANT.slug + "_";
    }
  },

  // ─── Dynamic Settings ──────────────────────────────────────
  async initGlobalSettings() {
    if (typeof db !== 'undefined' && db) {
      try {
        const docRef = db.collection('system_config').doc('global');
        const doc = await docRef.get();
        if (!doc.exists) {
          // Create default document if it doesn't exist
          await docRef.set({
            restaurantName: CONFIG.RESTAURANT.name,
            tables: CONFIG.FALLBACK_TABLES,
            taxRate: 0,
            categories: ["Foods", "Swallows", "Pastries", "Drinks"]
          });
          CONFIG.TABLES = CONFIG.FALLBACK_TABLES;
          CONFIG.CATEGORIES = ["Foods", "Swallows", "Pastries", "Drinks"];
        } else {
          // Document exists, update CONFIG locally
          const data = doc.data();
          if (data.restaurantName) CONFIG.RESTAURANT.name = data.restaurantName;
          if (data.tagline) CONFIG.RESTAURANT.tagline = data.tagline;
          if (data.phone) CONFIG.RESTAURANT.phone = data.phone;
          if (data.whatsapp) { CONFIG.RESTAURANT.whatsapp = data.whatsapp; CONFIG.RESTAURANT.kitchenWhatsapp = data.whatsapp; }
          if (data.email) CONFIG.RESTAURANT.email = data.email;
          if (data.address) { CONFIG.RESTAURANT.fullAddress = data.address; CONFIG.RESTAURANT.address = data.address; }
          if (data.hours) CONFIG.RESTAURANT.hours = data.hours;
          if (data.currency) CONFIG.CURRENCY = data.currency;
          if (data.tables && Array.isArray(data.tables)) CONFIG.TABLES = data.tables;
          if (data.taxRate !== undefined && data.taxRate !== null) CONFIG.TAX_RATE = data.taxRate;
          if (data.categories && Array.isArray(data.categories)) CONFIG.CATEGORIES = data.categories;
        }

        // --- Auto-Migrate Menu Items ---
        const menuSnap = await db.collection('menu_items').limit(1).get();
        if (menuSnap.empty) {
          console.log("Migrating fallback menu to Firestore...");
          const batch = db.batch();
          CONFIG.FALLBACK_MENU.forEach(item => {
            const newRef = db.collection('menu_items').doc();
            batch.set(newRef, item);
          });
          await batch.commit();
          console.log("Migration complete!");
        }
      } catch (err) {
        console.error("Failed to load global settings from Firestore:", err);
      }
    }
  }
};


// ─── FIREBASE CONFIGURATION ──────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAjJ-A8jMW6picivMFxImHM_zsKAOe2WSo",
  authDomain: "mevish-eatery.firebaseapp.com",
  projectId: "mevish-eatery",
  storageBucket: "mevish-eatery.firebasestorage.app",
  messagingSenderId: "135587898458",
  appId: "1:135587898458:web:e0f4a6625e7758523ee463",
  measurementId: "G-B9YC2FHQEM"
};

// Initialize Firebase if the SDK is loaded (compat version)
let db = null;
let settingsLoadedPromise = Promise.resolve();
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    console.warn("Firebase persistence error: ", err);
  });
  console.log("🔥 Firebase Firestore initialized with offline support.");
  settingsLoadedPromise = CONFIG.initGlobalSettings();
} else {
  console.warn("⚠️ Firebase SDK not found. Make sure to include firebase-app-compat.js");
}

