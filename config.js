// ============================================================
// Mevish Eatery ERP — Central Configuration
// Edit this file to reconfigure the entire system.
// ============================================================

const CONFIG = {

  // ─── API ────────────────────────────────────────────────
  // Paste your deployed Google Apps Script Web App URL here.
  // Deploy → Manage Deployments → Copy Web App URL
  API_URL: "https://script.google.com/macros/s/AKfycby-Ght4h30xNFsu8jjGaEsb9wkmCUVaSECJ9j0Gzn6CXqZJ-4SERFyMh5wuwOE9Xy4Zig/exec",

  // ─── Restaurant Identity ─────────────────────────────────
  RESTAURANT: {
    name:     "Mevish Eatery",
    tagline:  "Where Every Bite Tells a Story",
    slogan:   "Premium Food. Fast Service. Real Flavour.",
    city:     "Yola",
    state:    "Adamawa",
    country:  "Nigeria",
    address:  "Yola, Adamawa State, Nigeria",
    phone:    "+234 9036648535",
    email:    "vendorliftng@gmail.com",
    whatsapp: "+234 9036648535",
    instagram:"@mevisheatery",
    facebook: "mevisheatery",
    hours:    "Monday – Sunday: 8:00 AM – 09:00 PM",
    year:     "2026",
  },

  // ─── Currency ────────────────────────────────────────────
  CURRENCY: "₦",

  formatCurrency(amount) {
    const n = Number(amount) || 0;
    return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

  // ─── GitHub Pages Base URL ──────────────────────────────
  BASE_URL: "https://vendorliftng.github.io/Mevish-Cafe/",

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
    localStorage.setItem("mevish_theme", themeId);
  },

  // Load theme: try localStorage first, then fall back to "default"
  loadSavedTheme() {
    const saved = localStorage.getItem("mevish_theme");
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
  RECEIPT_FOOTER: "Thank you for dining at Mevish Eatery!\nFollow us @mevisheatery",

  // ─── API Helpers ───────────────────────────────────────
  // Standard GET wrapper
  async apiGet(type, params) {
    let url = CONFIG.API_URL + "?type=" + type;
    if (params) {
      Object.keys(params).forEach(k => { url += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); });
    }
    const res = await fetch(url);
    return await res.json();
  },

  // Standard POST wrapper with CORS workaround for Google Apps Script
  async apiPost(action, payload) {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, ...payload }),
      redirect: "follow",
    });
    return await res.json();
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
  FALLBACK_MENU: [
    {id:1,  category:"Foods",    name:"Jollof/Fried Rice only",           price:2000},
    {id:3,  category:"Foods",    name:"Jollof/Fried Rice Chicken",        price:6000},
    {id:6,  category:"Foods",    name:"Jollof/Fried Rice Beef",           price:3500},
    {id:5,  category:"Foods",    name:"Jollof/Fried Rice Fish",           price:5000},
    {id:9,  category:"Foods",    name:"Spaghetti Fish",                   price:5000},
    {id:10, category:"Foods",    name:"Spaghetti Chicken",                price:6000},
    {id:11, category:"Foods",    name:"Spaghetti Beef",                   price:3500},
    {id:12, category:"Foods",    name:"Peppered Chicken",                 price:4000},
    {id:19, category:"Foods",    name:"Peppered Beef",                    price:1500},
    {id:20, category:"Foods",    name:"Peppered Fish",                    price:3000},
    {id:21, category:"Foods",    name:"Mandi Rice",                       price:3000},
    {id:22, category:"Foods",    name:"Briyani",                          price:3000},
    {id:16, category:"Foods",    name:"Mandi Rice & Chicken",             price:7000},
    {id:17, category:"Foods",    name:"Mandi Rice & Fish",                price:6000},
    {id:18, category:"Foods",    name:"Mandi Rice & Beef",                price:4500},
    {id:13, category:"Foods",    name:"Briyani Rice & Chicken",           price:7000},
    {id:14, category:"Foods",    name:"Briyani Rice & Fish",              price:6000},
    {id:15, category:"Foods",    name:"Briyani Rice & Beef",              price:4500},
    {id:23, category:"Swallows", name:"Swallow & Soup with Chicken",      price:5500},
    {id:24, category:"Swallows", name:"Swallow & Soup with Fish",         price:5000},
    {id:25, category:"Swallows", name:"Swallow & Soup with Beef",         price:3000},
    {id:26, category:"Pastries", name:"Shawarma Single Sausage",          price:4000},
    {id:27, category:"Pastries", name:"Shawarma Double Sausage",          price:4500},
    {id:28, category:"Pastries", name:"Shawarma without Sausage",         price:3500},
    {id:29, category:"Pastries", name:"Chicken Pizza",                    price:6000},
    {id:30, category:"Pastries", name:"Beef Pizza",                       price:12000},
    {id:31, category:"Pastries", name:"Margarita (Tomato & Cheese)",      price:8000},
    {id:32, category:"Pastries", name:"Mevish Pizza (Pineapple/Sausage/Chicken)", price:15000},
    {id:33, category:"Pastries", name:"Burger",                           price:2500},
    {id:34, category:"Pastries", name:"Burger with Cheese",               price:3000},
    {id:35, category:"Pastries", name:"Burger with Cheese & Fries",       price:4500},
    {id:36, category:"Pastries", name:"Burger with Fries",                price:3500},
    {id:37, category:"Pastries", name:"Milky Doughnut",                   price:1500},
    {id:38, category:"Pastries", name:"Bread",                            price:1500},
    {id:39, category:"Pastries", name:"Fruit Bread",                      price:1700},
    {id:40, category:"Pastries", name:"Samosa",                           price:400},
    {id:41, category:"Pastries", name:"Spring Rolls",                     price:400},
    {id:61, category:"Pastries", name:"Banana Bread",                     price:3000},
    {id:62, category:"Pastries", name:"Block Chocolate Cake",             price:2000},
    {id:63, category:"Pastries", name:"Block Red Velvet Cake",            price:2000},
    {id:64, category:"Pastries", name:"Cake Parfait",                     price:2500},
    {id:65, category:"Pastries", name:"Ice Cream per Scoop",              price:1000},
    {id:66, category:"Pastries", name:"Ice Cream Cone",                   price:1200},
    {id:67, category:"Pastries", name:"Popcorn",                          price:800},
    {id:68, category:"Pastries", name:"Caramel Popcorn",                  price:250},
    {id:42, category:"Drinks",   name:"Chivita",                          price:2500},
    {id:43, category:"Drinks",   name:"Fura",                             price:1200},
    {id:44, category:"Drinks",   name:"Coconut Fura",                     price:1400},
    {id:45, category:"Drinks",   name:"Yogo Fura",                        price:1500},
    {id:46, category:"Drinks",   name:"5 Alive",                          price:1700},
    {id:47, category:"Drinks",   name:"5 Alive Blast",                    price:2000},
    {id:48, category:"Drinks",   name:"Coke",                             price:700},
    {id:49, category:"Drinks",   name:"Mirinda",                          price:700},
    {id:50, category:"Drinks",   name:"Malt",                             price:700},
    {id:51, category:"Drinks",   name:"Pepsi",                            price:700},
    {id:52, category:"Drinks",   name:"Sprite",                           price:700},
    {id:53, category:"Drinks",   name:"Fanta",                            price:700},
    {id:54, category:"Drinks",   name:"Smoov",                            price:700},
    {id:55, category:"Drinks",   name:"Zobo",                             price:500},
    {id:56, category:"Drinks",   name:"Tamarind",                         price:500},
    {id:57, category:"Drinks",   name:"Water",                            price:500},
    {id:58, category:"Drinks",   name:"Yoghurt Parfait",                  price:3000},
    {id:59, category:"Drinks",   name:"Greek Yoghurt",                    price:2000},
    {id:60, category:"Drinks",   name:"Kunan Aya",                        price:1000},
  ],
};
