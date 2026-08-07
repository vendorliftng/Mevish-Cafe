/**
 * ============================================================
 *  MEVISH CAFE — UPGRADED APPSCRIPT BACKEND v2.0
 *  Google Sheets + AppScript Restaurant Management System
 *  Designed for multi-restaurant replication
 * ============================================================
 */

// ─── CONFIGURATION ─────────────────────────────────────────────
var CONFIG_SHEET = "Settings";
var MENU_SHEET = "Menu";
var ORDERS_SHEET = "Orders";
var INVENTORY_SHEET = "Inventory";
var RECIPES_SHEET = "Recipes";
var CASHIERS_SHEET = "Cashiers";
var TABLES_SHEET = "Tables";
var EXPENSES_SHEET = "Expenses";
var AUDIT_SHEET = "Audit Log";
var BLOG_SHEET = "Blog";
var CUSTOMERS_SHEET = "Customers";
var REVIEWS_SHEET = "Reviews";

// Column indexes for Orders sheet (0-based)
var ORD = {
  TIMESTAMP: 0, ORDER_ID: 1, NAME: 2, TYPE: 3, LOCATION: 4,
  ITEMS: 5, TOTAL_REVENUE: 6, TOTAL_COST: 7, PROFIT: 8, STATUS: 9,
  PAYMENT_METHOD: 10, CASHIER: 11, PREP_STARTED: 12, READY_AT: 13,
  SERVED_AT: 14, PAID_AT: 15, PREP_TIME: 16, ACTUAL_TIME: 17, NOTES: 18,
  PHONE: 19
};

// Column indexes for Menu sheet
var MNU = {
  ID: 0, CATEGORY: 1, NAME: 2, PRICE: 3, COST: 4,
  PREP_TIME: 5, AVAILABLE: 6, IMAGE: 7, DESCRIPTION: 8, EMOJI: 9
};

// Column indexes for Inventory sheet
var INV = {
  NAME: 0, CATEGORY: 1, STOCK: 2, ALERT_THRESHOLD: 3,
  UNIT: 4, COST_PER_UNIT: 5, SUPPLIER: 6, LAST_RESTOCKED: 7, MIN_ORDER_QTY: 8
};

// Column indexes for Recipes sheet
var RCP = { MENU_ITEM: 0, INGREDIENT: 1, QTY_NEEDED: 2, UNIT: 3 };

// Column indexes for Customers sheet
var CUST = {
  PHONE: 0, NAME: 1, TOTAL_ORDERS: 2, TOTAL_SPENT: 3,
  LOYALTY_POINTS: 4, LAST_VISIT: 5, CREATED_AT: 6
};

// Column indexes for Reviews sheet
var REV = {
  TIMESTAMP: 0, ORDER_ID: 1, PHONE: 2, RATING: 3,
  COMMENT: 4, CUSTOMER_NAME: 5, STATUS: 6
};

// Column indexes for Cashiers sheet
var CSH = { NAME: 0, PHONE: 1, ROLE: 2, ACTIVE: 3, PIN: 4 };

// ─── HELPERS ───────────────────────────────────────────────────

function getSetting(key) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function jsonResponse(data, statusCode) {
  var code = statusCode || 200;
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return jsonResponse({ status: "error", message: message });
}

function logAudit(action, orderId, details, performedBy) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AUDIT_SHEET);
  if (!sheet) return;
  sheet.appendRow([new Date(), action, orderId || "", details || "", performedBy || "System", ""]);
}

function getNow() {
  return new Date();
}

function isValidOrderId(id) {
  return id && /^ORD-\d{8}-\d{4}$/.test(id);
}

/**
 * Cached Menu lookup — rebuilt only when menu changes
 * (invalidated on add/update/delete via invalidateMenuCache).
 * Keyed by item name -> {cost, price, prepTime, emoji, category, available}.
 */
function getMenuLookup() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("menu_lookup_v1");
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* rebuild below */ }
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MENU_SHEET);
  var lookup = {};
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][MNU.NAME]) {
        lookup[data[i][MNU.NAME]] = {
          cost: parseFloat(data[i][MNU.COST]) || 0,
          price: parseFloat(data[i][MNU.PRICE]) || 0,
          prepTime: parseInt(data[i][MNU.PREP_TIME]) || 10,
          emoji: data[i][MNU.EMOJI] || "",
          category: data[i][MNU.CATEGORY] || "",
          available: data[i][MNU.AVAILABLE] || "Yes"
        };
      }
    }
  }
  cache.put("menu_lookup_v1", JSON.stringify(lookup), 600); // 10 min TTL
  return lookup;
}

/**
 * Call this from addMenuItem, updateMenuItem, deleteMenuItem
 * (and toggleMenuAvailability) to invalidate the menu cache.
 */
function invalidateMenuCache() {
  CacheService.getScriptCache().remove("menu_lookup_v1");
}

/**
 * Generic cached GET-response helper.
 * Returns jsonResponse(computeFn()) the first time, then serves the
 * cached JSON for ttlSeconds. Cache writes are wrapped so an oversized
 * payload never breaks the request.
 */
function cachedJsonResponse(cacheKey, ttlSeconds, computeFn) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheKey);
  if (cached) return jsonResponse(JSON.parse(cached));
  var result = computeFn();
  try { cache.put(cacheKey, JSON.stringify(result), ttlSeconds); } catch (e) { /* cache full or too large */ }
  return jsonResponse(result);
}

/**
 * Flush a batch of single-row column updates with ONE setValues call.
 * `updates` is a map of 0-based column index -> value. Columns inside the
 * updated span but not present in `updates` keep their existing value from
 * `existingRow`. No-op when `updates` is empty.
 */
function flushRowUpdates(sheet, row, updates, existingRow) {
  var keys = Object.keys(updates);
  if (keys.length === 0) return;
  var cols = keys.map(Number);
  var minCol = Math.min.apply(null, cols);
  var maxCol = Math.max.apply(null, cols);
  var rangeLength = maxCol - minCol + 1;
  var rowValues = [];
  for (var c = minCol; c <= maxCol; c++) {
    rowValues.push(updates.hasOwnProperty(c) ? updates[c] : existingRow[c]);
  }
  sheet.getRange(row, minCol + 1, 1, rangeLength).setValues([rowValues]);
}

/**
 * Parse the pipe-separated items string and calculate total cost from the menu.
 * Items format: "2x Jollof Rice | 1x Chicken (Notes: extra spicy)"
 * Uses the shared cached menu lookup (see getMenuLookup).
 */
function calculateOrderCost(itemsString) {
  var lookup = getMenuLookup();

  itemsString = itemsString ? String(itemsString) : "";
  var cleanStr = itemsString.split(" (Notes:")[0];
  var itemsList = cleanStr.split(" | ");
  var totalCost = 0;

  itemsList.forEach(function(item) {
    var parts = item.trim().split("x ");
    if (parts.length === 2) {
      var qty = parseInt(parts[0]);
      var itemName = parts[1].trim();
      var entry = lookup[itemName];
      if (entry) {
        totalCost += (entry.cost || 0) * qty;
      }
    }
  });

  return totalCost;
}

/**
 * Deduct inventory when order is paid
 */
function deductInventory(itemsString) {
  var invSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET);
  var recipeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RECIPES_SHEET);
  if (!invSheet || !recipeSheet) return [];

  var invData = invSheet.getDataRange().getValues();
  var recipeData = recipeSheet.getDataRange().getValues();
  var alerts = [];

  itemsString = itemsString ? String(itemsString) : "";
  var cleanStr = itemsString.split(" (Notes:")[0];
  var itemsList = cleanStr.split(" | ");

  itemsList.forEach(function(item) {
    var parts = item.trim().split("x ");
    if (parts.length === 2) {
      var orderQty = parseInt(parts[0]);
      var menuItemName = parts[1].trim();
      var isRecipeFound = false;

      for (var r = 1; r < recipeData.length; r++) {
        if (recipeData[r][RCP.MENU_ITEM] === menuItemName) {
          isRecipeFound = true;
          var rawIngredientName = recipeData[r][RCP.INGREDIENT];
          var qtyPerMeal = parseFloat(recipeData[r][RCP.QTY_NEEDED]);
          var result = deductFromSheet(invSheet, invData, rawIngredientName, orderQty * qtyPerMeal);
          if (result.alert) alerts.push(result.alert);
        }
      }

      // If no recipe, try deducting directly from inventory
      if (!isRecipeFound) {
        var result = deductFromSheet(invSheet, invData, menuItemName, orderQty);
        if (result.alert) alerts.push(result.alert);
      }
    }
  });

  return alerts;
}

/**
 * Deduct stock from inventory sheet and check threshold
 */
function deductFromSheet(invSheet, invData, itemName, qtyToDeduct) {
  var result = { alert: null };
  for (var i = 1; i < invData.length; i++) {
    if (invData[i][INV.NAME] === itemName) {
      var currentStock = parseFloat(invData[i][INV.STOCK]);
      var threshold = parseFloat(invData[i][INV.ALERT_THRESHOLD]) || 5;
      if (!isNaN(currentStock)) {
        var newStock = currentStock - qtyToDeduct;
        if (newStock < 0) newStock = 0;
        invSheet.getRange(i + 1, INV.STOCK + 1).setValue(parseFloat(newStock.toFixed(2)));

        // Check if below threshold
        if (newStock <= threshold) {
          result.alert = itemName + " is LOW (" + newStock.toFixed(1) + " " + (invData[i][INV.UNIT] || "") + " remaining)";
          logAudit("INVENTORY_ALERT", "", result.alert, "System");
        }
      }
      break;
    }
  }
  return result;
}

/**
 * Check if any inventory items are below threshold (for dashboard alerts)
 */
function getInventoryAlerts() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var alerts = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][INV.NAME] === "") continue;
    var stock = parseFloat(data[i][INV.STOCK]) || 0;
    var threshold = parseFloat(data[i][INV.ALERT_THRESHOLD]) || 5;
    if (stock <= threshold) {
      alerts.push({
        name: data[i][INV.NAME],
        currentStock: stock,
        alertThreshold: threshold,
        unit: data[i][INV.UNIT] || "",
        minOrderQty: data[i][INV.MIN_ORDER_QTY] || "",
        supplier: data[i][INV.SUPPLIER] || ""
      });
    }
  }
  return alerts;
}


// ═══════════════════════════════════════════════════════════════
//  GET HANDLER — All read operations
// ═══════════════════════════════════════════════════════════════

function doGet(e) {
  var type = e.parameter.type;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // ── MENU (default / no type param) ──────────────────────
    if (!type || type === "menu") {
      var sheet = ss.getSheetByName(MENU_SHEET);
      if (!sheet) return errorResponse("Menu sheet not found");
      return cachedJsonResponse("get_menu", 300, function() {
        var data = sheet.getDataRange().getValues();
        var items = [];
        for (var i = 1; i < data.length; i++) {
          if (data[i][MNU.NAME] === "") continue;
          // Only return available items
          if (data[i][MNU.AVAILABLE] === "No") continue;
          items.push({
            id: data[i][MNU.ID],
            category: data[i][MNU.CATEGORY],
            name: data[i][MNU.NAME],
            price: parseFloat(data[i][MNU.PRICE]) || 0,
            cost: parseFloat(data[i][MNU.COST]) || 0,
            prepTime: parseInt(data[i][MNU.PREP_TIME]) || 10,
            available: data[i][MNU.AVAILABLE] || "Yes",
            image: data[i][MNU.IMAGE] || "",
            description: data[i][MNU.DESCRIPTION] || "",
            emoji: data[i][MNU.EMOJI] || ""
          });
        }
        return { status: "success", data: items };
      });
    }

    // ── ORDERS ──────────────────────────────────────────────
    if (type === "orders") {
      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return errorResponse("Orders sheet not found");
      var data = sheet.getDataRange().getValues();
      var orders = [];
      // Return newest first
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][ORD.ORDER_ID] === "") continue;
        orders.push({
          timestamp: data[i][ORD.TIMESTAMP],
          orderId: data[i][ORD.ORDER_ID],
          name: data[i][ORD.NAME],
          type: data[i][ORD.TYPE],
          location: data[i][ORD.LOCATION],
          items: data[i][ORD.ITEMS],
          total: parseFloat(data[i][ORD.TOTAL_REVENUE]) || 0,
          totalCost: parseFloat(data[i][ORD.TOTAL_COST]) || 0,
          profit: parseFloat(data[i][ORD.PROFIT]) || 0,
          status: data[i][ORD.STATUS],
          paymentMethod: data[i][ORD.PAYMENT_METHOD] || "",
          cashier: data[i][ORD.CASHIER] || "",
          prepStarted: data[i][ORD.PREP_STARTED] || "",
          readyAt: data[i][ORD.READY_AT] || "",
          servedAt: data[i][ORD.SERVED_AT] || "",
          paidAt: data[i][ORD.PAID_AT] || "",
          prepTime: data[i][ORD.PREP_TIME] || "",
          actualTime: data[i][ORD.ACTUAL_TIME] || "",
          phone: data[i][ORD.PHONE] || ""
        });
      }
      return jsonResponse({ status: "success", data: orders });
    }

    // ── TRACK SINGLE ORDER ──────────────────────────────────
    if (type === "track") {
      var orderIdToFind = e.parameter.orderId;
      if (!orderIdToFind) return errorResponse("Order ID required");

      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return errorResponse("Orders sheet not found");

      // Read only the Order ID column to locate the row (avoids reading
      // the entire Orders sheet on every 15s poll).
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return jsonResponse({ status: "not_found" });

      var orderIds = sheet.getRange(2, ORD.ORDER_ID + 1, lastRow - 1, 1).getValues();
      var rowIndex = -1;
      for (var i = orderIds.length - 1; i >= 0; i--) {
        if (orderIds[i][0] === orderIdToFind) { rowIndex = i + 2; break; } // +2: 1-based + header
      }
      if (rowIndex === -1) return jsonResponse({ status: "not_found" });

      // Read only that single matching row
      var row = sheet.getRange(rowIndex, 1, 1, 20).getValues()[0];

      // Parse items string into array for tracker
      var itemsArray = parseItemsForTracker(row[ORD.ITEMS]);
      return jsonResponse({
        status: "success",
        data: {
          orderId: row[ORD.ORDER_ID],
          name: row[ORD.NAME],
          location: row[ORD.LOCATION],
          status: row[ORD.STATUS],
          items: itemsArray,
          total: parseFloat(row[ORD.TOTAL_REVENUE]) || 0,
          timestamp: row[ORD.TIMESTAMP],
          prepStarted: row[ORD.PREP_STARTED] || "",
          readyAt: row[ORD.READY_AT] || "",
          servedAt: row[ORD.SERVED_AT] || "",
          paidAt: row[ORD.PAID_AT] || "",
          prepTime: row[ORD.PREP_TIME] || "",
          phone: row[ORD.PHONE] || ""
        }
      });
    }

    // ── CASHIERS ────────────────────────────────────────────
    if (type === "cashiers") {
      var sheet = ss.getSheetByName(CASHIERS_SHEET);
      if (!sheet) return errorResponse("Cashiers sheet not found");
      return cachedJsonResponse("get_cashiers", 300, function() {
        var data = sheet.getDataRange().getValues();
        var cashiers = [];
        for (var i = 1; i < data.length; i++) {
          if (data[i][CSH.NAME] !== "") {
            cashiers.push({
              name: data[i][CSH.NAME] || "",
              phone: data[i][CSH.PHONE] || "",
              role: data[i][CSH.ROLE] || "Cashier",
              active: data[i][CSH.ACTIVE] || "Yes",
              pin: data[i][CSH.PIN] || ""
            });
          }
        }
        return { status: "success", data: cashiers };
      });
    }

    // ── LOGIN CASHIER (by PIN) ─────────────────────────────
    if (type === "loginCashier") {
      var pin = e.parameter.pin;
      if (!pin) return errorResponse("PIN required");
      var sheet = ss.getSheetByName(CASHIERS_SHEET);
      if (!sheet) return errorResponse("Cashiers sheet not found");
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][CSH.PIN]) === String(pin) && data[i][CSH.ACTIVE] !== "No") {
          return jsonResponse({
            status: "success",
            data: {
              name: data[i][CSH.NAME] || "",
              role: data[i][CSH.ROLE] || "Cashier",
              phone: data[i][CSH.PHONE] || ""
            }
          });
        }
      }
      return jsonResponse({ status: "not_found" });
    }

    // ── INVENTORY ───────────────────────────────────────────
    if (type === "inventory") {
      var sheet = ss.getSheetByName(INVENTORY_SHEET);
      if (!sheet) return errorResponse("Inventory sheet not found");
      var data = sheet.getDataRange().getValues();
      var items = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][INV.NAME] === "") continue;
        items.push({
          name: data[i][INV.NAME],
          category: data[i][INV.CATEGORY] || "",
          currentStock: parseFloat(data[i][INV.STOCK]) || 0,
          alertThreshold: parseFloat(data[i][INV.ALERT_THRESHOLD]) || 5,
          unit: data[i][INV.UNIT] || "",
          costPerUnit: parseFloat(data[i][INV.COST_PER_UNIT]) || 0,
          supplier: data[i][INV.SUPPLIER] || "",
          lastRestocked: data[i][INV.LAST_RESTOCKED] || "",
          minOrderQty: data[i][INV.MIN_ORDER_QTY] || ""
        });
      }
      return jsonResponse({ status: "success", data: items });
    }

    // ── INVENTORY ALERTS ────────────────────────────────────
    if (type === "inventoryAlerts") {
      var alerts = getInventoryAlerts();
      return jsonResponse({ status: "success", data: alerts });
    }

    // ── TABLES ──────────────────────────────────────────────
    if (type === "tables") {
      var sheet = ss.getSheetByName(TABLES_SHEET);
      if (!sheet) return errorResponse("Tables sheet not found");
      return cachedJsonResponse("get_tables", 600, function() {
        var data = sheet.getDataRange().getValues();
        var tables = [];
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === "") continue;
          tables.push({
            id: data[i][0],
            seats: parseInt(data[i][1]) || 0,
            status: data[i][2] || "Available",
            qrUrl: data[i][3] || "",
            notes: data[i][4] || ""
          });
        }
        return { status: "success", data: tables };
      });
    }

    // ── SETTINGS ────────────────────────────────────────────
    if (type === "settings") {
      var sheet = ss.getSheetByName(CONFIG_SHEET);
      if (!sheet) return errorResponse("Settings sheet not found");
      var data = sheet.getDataRange().getValues();
      var settings = {};
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] !== "") settings[data[i][0]] = data[i][1];
      }
      // Never expose PINs in the API
      delete settings["Manager PIN"];
      delete settings["Blog Admin PIN"];
      return jsonResponse({ status: "success", data: settings });
    }

    // ── DASHBOARD STATS ─────────────────────────────────────
    if (type === "stats") {
      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return errorResponse("Orders sheet not found");
      var data = sheet.getDataRange().getValues();

      var dateFilter = e.parameter.date;
      var today = dateFilter ? new Date(dateFilter) : new Date();
      today.setHours(0, 0, 0, 0);
      var tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      var totalRevenue = 0, totalCost = 0, totalOrders = 0;
      var cashRevenue = 0, posRevenue = 0, creditTotal = 0;
      var activeOrders = 0, readyOrders = 0;
      var voidCount = 0;
      var cashierStats = {};
      var categorySales = {};

      for (var i = 1; i < data.length; i++) {
        var rowDate = new Date(data[i][ORD.TIMESTAMP]);
        rowDate.setHours(0, 0, 0, 0);

        // If no date filter, sum everything; otherwise filter by day
        if (dateFilter && (rowDate < today || rowDate >= tomorrow)) continue;

        var status = data[i][ORD.STATUS] || "";
        var total = parseFloat(data[i][ORD.TOTAL_REVENUE]) || 0;
        var cost = parseFloat(data[i][ORD.TOTAL_COST]) || 0;
        var cashier = data[i][ORD.CASHIER] || "Unknown";

        // Count all non-void orders
        if (status.indexOf("Void") === -1) {
          totalOrders++;
          totalRevenue += total;
          totalCost += cost;
        }

        // Void count
        if (status.indexOf("Void") !== -1) {
          voidCount++;
          continue;
        }

        // Active/Ready counts
        if (status === "Active") activeOrders++;
        if (status === "Ready") readyOrders++;

        // Revenue by payment method
        if (status.indexOf("Paid") !== -1) {
          if (status.indexOf("Cash") !== -1) {
            cashRevenue += total;
          } else if (status.indexOf("POS") !== -1) {
            posRevenue += total;
          }
          // Cashier stats
          if (!cashierStats[cashier]) {
            cashierStats[cashier] = { cash: 0, pos: 0, orders: 0 };
          }
          cashierStats[cashier].orders++;
          if (status.indexOf("Cash") !== -1) cashierStats[cashier].cash += total;
          if (status.indexOf("POS") !== -1) cashierStats[cashier].pos += total;
        }

        // Credit tracking
        if (status.indexOf("Credit") !== -1) {
          creditTotal += total;
        }
      }

      var avgOrder = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
      var grossProfit = totalRevenue - totalCost;
      var profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

      return jsonResponse({
        status: "success",
        data: {
          totalRevenue: totalRevenue,
          totalCost: totalCost,
          grossProfit: grossProfit,
          profitMargin: Math.round(profitMargin * 100) / 100,
          totalOrders: totalOrders,
          averageOrderValue: Math.round(avgOrder),
          cashRevenue: cashRevenue,
          posRevenue: posRevenue,
          creditOutstanding: creditTotal,
          activeOrders: activeOrders,
          readyOrders: readyOrders,
          voidCount: voidCount,
          cashierStats: cashierStats
        }
      });
    }

    // ── DAILY REVENUE (for charts — last N days) ────────────
    if (type === "dailyRevenue") {
      var days = parseInt(e.parameter.days) || 7;
      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return errorResponse("Orders sheet not found");
      var data = sheet.getDataRange().getValues();

      var dailyMap = {};
      for (var d = 0; d < days; d++) {
        var date = new Date();
        date.setDate(date.getDate() - d);
        var key = date.toISOString().split("T")[0];
        dailyMap[key] = { revenue: 0, cost: 0, orders: 0 };
      }

      for (var i = 1; i < data.length; i++) {
        var status = data[i][ORD.STATUS] || "";
        if (status.indexOf("Void") !== -1) continue;
        if (status.indexOf("Paid") === -1 && status.indexOf("Credit") === -1) continue;

        var rowDate = new Date(data[i][ORD.TIMESTAMP]);
        var key = rowDate.toISOString().split("T")[0];
        if (dailyMap[key]) {
          dailyMap[key].revenue += parseFloat(data[i][ORD.TOTAL_REVENUE]) || 0;
          dailyMap[key].cost += parseFloat(data[i][ORD.TOTAL_COST]) || 0;
          dailyMap[key].orders++;
        }
      }

      var daily = [];
      for (var d = days - 1; d >= 0; d--) {
        var date = new Date();
        date.setDate(date.getDate() - d);
        var key = date.toISOString().split("T")[0];
        daily.push({
          date: key,
          revenue: dailyMap[key].revenue,
          cost: dailyMap[key].cost,
          orders: dailyMap[key].orders
        });
      }
      return jsonResponse({ status: "success", data: daily });
    }

    // ── EXPENSES ────────────────────────────────────────────
    if (type === "expenses") {
      var sheet = ss.getSheetByName(EXPENSES_SHEET);
      if (!sheet) return jsonResponse({ status: "success", data: [] });
      var data = sheet.getDataRange().getValues();
      var expenses = [];
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][0] === "") continue;
        expenses.push({
          date: data[i][0],
          category: data[i][1],
          description: data[i][2],
          amount: parseFloat(data[i][3]) || 0,
          paymentMethod: data[i][4] || "",
          recordedBy: data[i][5] || ""
        });
      }
      return jsonResponse({ status: "success", data: expenses });
    }

    // ── AUDIT LOG ──────────────────────────────────────────
    if (type === "auditLog") {
      var sheet = ss.getSheetByName(AUDIT_SHEET);
      if (!sheet) return jsonResponse({ status: "success", data: [] });
      var data = sheet.getDataRange().getValues();
      var logs = [];
      for (var i = data.length - 1; i >= 1; i--) {  // newest first
        if (data[i][0] === "") continue;
        logs.push({
          timestamp: data[i][0],
          action: data[i][1] || "",
          orderId: data[i][2] || "",
          details: data[i][3] || "",
          performedBy: data[i][4] || "",
          notes: data[i][5] || ""
        });
      }
      return jsonResponse({ status: "success", data: logs });
    }

    // ── POPULAR ITEMS (best sellers) ────────────────────────
    if (type === "popularItems") {
      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return errorResponse("Orders sheet not found");
      var data = sheet.getDataRange().getValues();
      var itemCounts = {};
      var days = parseInt(e.parameter.days) || 30;
      var cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      for (var i = 1; i < data.length; i++) {
        var status = data[i][ORD.STATUS] || "";
        if (status.indexOf("Void") !== -1) continue;
        var rowDate = new Date(data[i][ORD.TIMESTAMP]);
        if (rowDate < cutoff) continue;

        var itemsStr = data[i][ORD.ITEMS];
        itemsStr = itemsStr ? String(itemsStr) : "";
        var cleanStr = itemsStr.split(" (Notes:")[0];
        var itemsList = cleanStr.split(" | ");
        itemsList.forEach(function(item) {
          var parts = item.trim().split("x ");
          if (parts.length === 2) {
            var qty = parseInt(parts[0]);
            var name = parts[1].trim();
            if (!itemCounts[name]) itemCounts[name] = 0;
            itemCounts[name] += qty;
          }
        });
      }

      var sorted = Object.keys(itemCounts).map(function(name) {
        return { name: name, quantity: itemCounts[name] };
      });
      sorted.sort(function(a, b) { return b.quantity - a.quantity; });
      return jsonResponse({ status: "success", data: sorted.slice(0, 20) });
    }

    // ── BLOG POSTS ──────────────────────────────────────────
    if (type === "blogs") {
      var sheet = ss.getSheetByName(BLOG_SHEET);
      if (!sheet) return jsonResponse({ status: "success", data: [] });
      var data = sheet.getDataRange().getValues();
      var posts = [];
      var showAll = e.parameter.all === "true";
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === "") continue;
        if (!showAll && data[i][7] !== "Published") continue;
        posts.push({
          id: data[i][0], title: data[i][1], category: data[i][2],
          slug: data[i][3], content: data[i][4], author: data[i][5],
          date: data[i][6], status: data[i][7], imageUrl: data[i][8],
          metaDescription: data[i][9]
        });
      }
      posts.reverse();
      return jsonResponse({ status: "success", data: posts });
    }

    // ── SINGLE BLOG POST ────────────────────────────────────
    if (type === "blog") {
      var sheet = ss.getSheetByName(BLOG_SHEET);
      if (!sheet) return jsonResponse({ status: "not_found" });
      var slugToFind = e.parameter.slug;
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][3] === slugToFind) {
          return jsonResponse({
            status: "success",
            data: {
              id: data[i][0], title: data[i][1], category: data[i][2],
              slug: data[i][3], content: data[i][4], author: data[i][5],
              date: data[i][6], status: data[i][7], imageUrl: data[i][8],
              metaDescription: data[i][9]
            }
          });
        }
      }
      return jsonResponse({ status: "not_found" });
    }

    // ── ACTIVE TABLES (which tables have orders) ────────────
    if (type === "activeTables") {
      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return jsonResponse({ status: "success", data: [] });
      var data = sheet.getDataRange().getValues();
      var occupied = {};
      for (var i = data.length - 1; i >= 1; i--) {
        var status = data[i][ORD.STATUS] || "";
        if (status === "Active" || status === "Ready") {
          var loc = data[i][ORD.LOCATION];
          if (loc && loc !== "Counter") {
            if (!occupied[loc]) occupied[loc] = [];
            occupied[loc].push(data[i][ORD.ORDER_ID]);
          }
        }
      }
      return jsonResponse({ status: "success", data: occupied });
    }

    // ── CASHIER SHIFT SUMMARY ───────────────────────────────
    if (type === "cashierShift") {
      var cashierName = e.parameter.cashier;
      if (!cashierName) return errorResponse("Cashier name required");
      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return errorResponse("Orders sheet not found");
      var data = sheet.getDataRange().getValues();

      var today = new Date();
      today.setHours(0, 0, 0, 0);

      var totalCash = 0, totalPOS = 0, orderCount = 0, voidCount = 0;
      for (var i = data.length - 1; i >= 1; i--) {
        var rowDate = new Date(data[i][ORD.TIMESTAMP]);
        rowDate.setHours(0, 0, 0, 0);
        if (rowDate < today) break; // Assumes sorted by date

        if (data[i][ORD.CASHIER] !== cashierName) continue;
        var status = data[i][ORD.STATUS] || "";
        var total = parseFloat(data[i][ORD.TOTAL_REVENUE]) || 0;

        if (status.indexOf("Void") !== -1) { voidCount++; continue; }
        if (status.indexOf("Cash") !== -1) totalCash += total;
        if (status.indexOf("POS") !== -1) totalPOS += total;
        orderCount++;
      }

      return jsonResponse({
        status: "success",
        data: {
          cashier: cashierName,
          date: today.toISOString().split("T")[0],
          totalCash: totalCash,
          totalPOS: totalPOS,
          totalCollected: totalCash + totalPOS,
          orderCount: orderCount,
          voidCount: voidCount
        }
      });
    }

    // ── SINGLE CUSTOMER (by phone) ─────────────────────────
    if (type === "customer") {
      var phoneToFind = e.parameter.phone;
      if (!phoneToFind) return errorResponse("Phone required");
      var sheet = ss.getSheetByName(CUSTOMERS_SHEET);
      if (!sheet) return jsonResponse({ status: "not_found" });
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][CUST.PHONE]) === String(phoneToFind)) {
          return jsonResponse({
            status: "success",
            data: {
              phone: data[i][CUST.PHONE],
              name: data[i][CUST.NAME],
              totalOrders: parseInt(data[i][CUST.TOTAL_ORDERS]) || 0,
              totalSpent: parseFloat(data[i][CUST.TOTAL_SPENT]) || 0,
              loyaltyPoints: parseInt(data[i][CUST.LOYALTY_POINTS]) || 0,
              lastVisit: data[i][CUST.LAST_VISIT],
              createdAt: data[i][CUST.CREATED_AT]
            }
          });
        }
      }
      return jsonResponse({ status: "not_found" });
    }

    // ── ALL CUSTOMERS (newest by last visit) ───────────────
    if (type === "customers") {
      var sheet = ss.getSheetByName(CUSTOMERS_SHEET);
      if (!sheet) return jsonResponse({ status: "success", data: [] });
      var data = sheet.getDataRange().getValues();
      var customers = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][CUST.PHONE] === "") continue;
        customers.push({
          phone: data[i][CUST.PHONE],
          name: data[i][CUST.NAME],
          totalOrders: parseInt(data[i][CUST.TOTAL_ORDERS]) || 0,
          totalSpent: parseFloat(data[i][CUST.TOTAL_SPENT]) || 0,
          loyaltyPoints: parseInt(data[i][CUST.LOYALTY_POINTS]) || 0,
          lastVisit: data[i][CUST.LAST_VISIT],
          createdAt: data[i][CUST.CREATED_AT]
        });
      }
      // Newest first by LAST_VISIT
      customers.sort(function(a, b) {
        var da = new Date(a.lastVisit).getTime();
        var db = new Date(b.lastVisit).getTime();
        if (isNaN(da)) da = 0;
        if (isNaN(db)) db = 0;
        return db - da;
      });
      return jsonResponse({ status: "success", data: customers });
    }

    // ── LOYALTY REWARD CHECK ───────────────────────────────
    if (type === "loyaltyReward") {
      var phoneToFind = e.parameter.phone;
      if (!phoneToFind) return errorResponse("Phone required");
      var sheet = ss.getSheetByName(CUSTOMERS_SHEET);
      var threshold = 10;
      var points = 0;
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][CUST.PHONE]) === String(phoneToFind)) {
            points = parseInt(data[i][CUST.LOYALTY_POINTS]) || 0;
            break;
          }
        }
      }
      return jsonResponse({
        status: "success",
        data: {
          qualifies: points >= threshold,
          points: points,
          threshold: threshold,
          rewardsAvailable: Math.floor(points / threshold)
        }
      });
    }

    // ── POPULAR TODAY (best sellers today) ─────────────────
    if (type === "popularToday") {
      var orderSheet = ss.getSheetByName(ORDERS_SHEET);
      if (!orderSheet) return jsonResponse({ status: "success", data: [] });
      var orderData = orderSheet.getDataRange().getValues();
      var todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      var todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Build menu lookup map once
      var menuLookup = buildMenuLookup(ss);

      var qtyByName = {};
      for (var i = 1; i < orderData.length; i++) {
        var status = orderData[i][ORD.STATUS] || "";
        if (status.indexOf("Void") !== -1) continue;
        var rowDate = new Date(orderData[i][ORD.TIMESTAMP]);
        if (isNaN(rowDate.getTime())) continue;
        if (rowDate < todayStart || rowDate > todayEnd) continue;
        var parsed = parseItemNames(orderData[i][ORD.ITEMS]);
        parsed.forEach(function(it) {
          if (!qtyByName[it.name]) qtyByName[it.name] = 0;
          qtyByName[it.name] += it.qty;
        });
      }

      var aggregated = Object.keys(qtyByName).map(function(name) {
        return { name: name, qty: qtyByName[name] };
      });
      aggregated.sort(function(a, b) { return b.qty - a.qty; });
      var top5 = aggregated.slice(0, 5).map(function(item) {
        var meta = menuLookup[item.name] || {};
        return {
          name: item.name,
          qty: item.qty,
          price: meta.price || 0,
          emoji: meta.emoji || "",
          category: meta.category || ""
        };
      });
      return jsonResponse({ status: "success", data: top5 });
    }

    // ── SUGGESTIONS (frequently bought together) ───────────
    if (type === "suggestions") {
      var cartParam = e.parameter.cart || "";
      var cartItems = decodeURIComponent(cartParam).split(",").map(function(s) {
        return s.trim();
      }).filter(function(s) { return s !== ""; });
      if (cartItems.length === 0) return jsonResponse({ status: "success", data: [] });

      var orderSheet = ss.getSheetByName(ORDERS_SHEET);
      var coOccurrence = {};
      if (orderSheet) {
        var orderData = orderSheet.getDataRange().getValues();
        for (var i = 1; i < orderData.length; i++) {
          var parsed = parseItemNames(orderData[i][ORD.ITEMS]);
          var orderNames = parsed.map(function(it) { return it.name; });
          // Does this order contain ANY cart item?
          var containsCart = false;
          for (var c = 0; c < cartItems.length; c++) {
            if (orderNames.indexOf(cartItems[c]) !== -1) { containsCart = true; break; }
          }
          if (!containsCart) continue;
          // Tally the OTHER items
          orderNames.forEach(function(nm) {
            if (cartItems.indexOf(nm) === -1) {
              if (!coOccurrence[nm]) coOccurrence[nm] = 0;
              coOccurrence[nm]++;
            }
          });
        }
      }

      var menuLookup = buildMenuLookup(ss);
      var ranked = Object.keys(coOccurrence).map(function(name) {
        return { name: name, freq: coOccurrence[name] };
      });
      ranked.sort(function(a, b) { return b.freq - a.freq; });
      var top5sug = ranked.slice(0, 5).map(function(item) {
        var meta = menuLookup[item.name] || {};
        return {
          name: item.name,
          freq: item.freq,
          price: meta.price || 0,
          emoji: meta.emoji || "",
          category: meta.category || ""
        };
      });
      return jsonResponse({ status: "success", data: top5sug });
    }

    // ── REVIEWS (by status) ────────────────────────────────
    if (type === "reviews") {
      var statusFilter = e.parameter.status || "approved";
      var statusMatch = statusFilter === "pending" ? "Pending" : "Approved";
      var sheet = ss.getSheetByName(REVIEWS_SHEET);
      if (!sheet) return jsonResponse({ status: "success", data: [] });
      var data = sheet.getDataRange().getValues();
      var reviews = [];
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][REV.STATUS]) !== statusMatch) continue;
        reviews.push({
          timestamp: data[i][REV.TIMESTAMP],
          orderId: data[i][REV.ORDER_ID],
          phone: data[i][REV.PHONE],
          rating: parseInt(data[i][REV.RATING]) || 0,
          comment: data[i][REV.COMMENT] || "",
          customerName: data[i][REV.CUSTOMER_NAME] || "",
          status: data[i][REV.STATUS]
        });
      }
      // Newest first
      reviews.sort(function(a, b) {
        var da = new Date(a.timestamp).getTime();
        var db = new Date(b.timestamp).getTime();
        if (isNaN(da)) da = 0;
        if (isNaN(db)) db = 0;
        return db - da;
      });
      return jsonResponse({ status: "success", data: reviews });
    }

    // ── AVERAGE RATING ─────────────────────────────────────
    if (type === "averageRating") {
      var sheet = ss.getSheetByName(REVIEWS_SHEET);
      if (!sheet) return jsonResponse({ status: "success", data: { average: 0, count: 0 } });
      var data = sheet.getDataRange().getValues();
      var sum = 0, count = 0;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][REV.STATUS]) !== "Approved") continue;
        var r = parseFloat(data[i][REV.RATING]);
        if (!isNaN(r)) { sum += r; count++; }
      }
      var average = count > 0 ? (sum / count) : 0;
      return jsonResponse({
        status: "success",
        data: { average: Math.round(average * 100) / 100, count: count }
      });
    }

    // ── PEAK HOURS (hour & day-of-week distribution) ───────
    if (type === "peakHours") {
      var days = parseInt(e.parameter.days) || 30;
      var cutoff = new Date(new Date().getTime() - days * 86400000);
      var orderSheet = ss.getSheetByName(ORDERS_SHEET);
      var hours = [];
      for (var h = 0; h < 24; h++) hours.push(0);
      var byDay = [];
      for (var d = 0; d < 7; d++) {
        var dayArr = [];
        for (var hh = 0; hh < 24; hh++) dayArr.push(0);
        byDay.push(dayArr);
      }
      if (orderSheet) {
        var orderData = orderSheet.getDataRange().getValues();
        for (var i = 1; i < orderData.length; i++) {
          var rowDate = new Date(orderData[i][ORD.TIMESTAMP]);
          if (isNaN(rowDate.getTime())) continue;
          if (rowDate < cutoff) continue;
          var hr = rowDate.getHours();
          var dy = rowDate.getDay();
          hours[hr]++;
          byDay[dy][hr]++;
        }
      }
      return jsonResponse({
        status: "success",
        data: { hours: hours, byDay: byDay }
      });
    }

    // ── CATEGORY BREAKDOWN (revenue by category) ───────────
    if (type === "categoryBreakdown") {
      var days = parseInt(e.parameter.days) || 30;
      var cutoff = new Date(new Date().getTime() - days * 86400000);
      var orderSheet = ss.getSheetByName(ORDERS_SHEET);
      var categoryAgg = {};
      if (orderSheet) {
        var orderData = orderSheet.getDataRange().getValues();
        var menuLookup = buildMenuLookup(ss);
        for (var i = 1; i < orderData.length; i++) {
          var status = orderData[i][ORD.STATUS] || "";
          if (status.indexOf("Paid") === -1) continue;
          var rowDate = new Date(orderData[i][ORD.TIMESTAMP]);
          if (isNaN(rowDate.getTime())) continue;
          if (rowDate < cutoff) continue;
          var total = parseFloat(orderData[i][ORD.TOTAL_REVENUE]) || 0;
          var parsed = parseItemNames(orderData[i][ORD.ITEMS]);
          // Distribute order total across items proportionally by unit-price
          var unitTotal = 0;
          var itemCats = [];
          parsed.forEach(function(it) {
            var meta = menuLookup[it.name] || {};
            var unitPrice = meta.price || 0;
            var lineValue = unitPrice * it.qty;
            unitTotal += lineValue;
            itemCats.push({ cat: meta.category || "Other", lineValue: lineValue });
          });
          for (var k = 0; k < itemCats.length; k++) {
            var share = unitTotal > 0 ? (itemCats[k].lineValue / unitTotal) * total : 0;
            var cat = itemCats[k].cat;
            if (!categoryAgg[cat]) categoryAgg[cat] = { revenue: 0, orderCount: 0 };
            categoryAgg[cat].revenue += share;
            categoryAgg[cat].orderCount += (k === 0 ? 1 : 0); // count order once
          }
          // If no items parsed, attribute to "Other" so revenue isn't lost
          if (itemCats.length === 0) {
            if (!categoryAgg["Other"]) categoryAgg["Other"] = { revenue: 0, orderCount: 0 };
            categoryAgg["Other"].revenue += total;
            categoryAgg["Other"].orderCount++;
          }
        }
      }
      var catList = Object.keys(categoryAgg).map(function(cat) {
        return {
          category: cat,
          revenue: Math.round(categoryAgg[cat].revenue * 100) / 100,
          orderCount: categoryAgg[cat].orderCount
        };
      });
      catList.sort(function(a, b) { return b.revenue - a.revenue; });
      return jsonResponse({ status: "success", data: catList });
    }

    // ── TOP CUSTOMERS (by phone) ───────────────────────────
    if (type === "topCustomers") {
      var days = parseInt(e.parameter.days) || 30;
      var cutoff = new Date(new Date().getTime() - days * 86400000);
      var orderSheet = ss.getSheetByName(ORDERS_SHEET);
      var custAgg = {};
      if (orderSheet) {
        var orderData = orderSheet.getDataRange().getValues();
        for (var i = 1; i < orderData.length; i++) {
          var status = orderData[i][ORD.STATUS] || "";
          if (status.indexOf("Void") !== -1) continue;
          var phone = orderData[i][ORD.PHONE] || "";
          if (phone === "") continue; // skip rows missing phone
          var rowDate = new Date(orderData[i][ORD.TIMESTAMP]);
          if (isNaN(rowDate.getTime())) continue;
          if (rowDate < cutoff) continue;
          var total = parseFloat(orderData[i][ORD.TOTAL_REVENUE]) || 0;
          if (!custAgg[phone]) custAgg[phone] = { totalSpent: 0, orderCount: 0 };
          custAgg[phone].totalSpent += total;
          custAgg[phone].orderCount++;
        }
      }
      // Pull customer names from Customers sheet if present
      var customerNames = {};
      var custSheet = ss.getSheetByName(CUSTOMERS_SHEET);
      if (custSheet) {
        var custData = custSheet.getDataRange().getValues();
        for (var r = 1; r < custData.length; r++) {
          customerNames[String(custData[r][CUST.PHONE])] = custData[r][CUST.NAME] || "";
        }
      }
      var topList = Object.keys(custAgg).map(function(phone) {
        return {
          phone: phone,
          name: customerNames[phone] || "",
          totalSpent: Math.round(custAgg[phone].totalSpent * 100) / 100,
          orderCount: custAgg[phone].orderCount
        };
      });
      topList.sort(function(a, b) { return b.totalSpent - a.totalSpent; });
      return jsonResponse({ status: "success", data: topList.slice(0, 10) });
    }

    // ── FALLTHROUGH ─────────────────────────────────────────
    return errorResponse("Unknown type: " + type);

  } catch (error) {
    return errorResponse(error.toString());
  }
}


// ═══════════════════════════════════════════════════════════════
//  POST HANDLER — All write operations
// ═══════════════════════════════════════════════════════════════

function doPost(e) {
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return errorResponse("Invalid JSON payload");
  }

  var action = payload.action;
  if (!action) return errorResponse("Action required");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // ── NEW ORDER ───────────────────────────────────────────
    if (action === "newOrder") {
      var orderId = payload.orderId;
      if (!orderId) return errorResponse("Order ID required");
      if (!isValidOrderId(orderId)) return errorResponse("Invalid order ID format");

      var totalRevenue = parseFloat(payload.totalPrice) || 0;
      var itemsString = payload.cartItems || "";
      var totalCost = calculateOrderCost(itemsString);
      var profit = totalRevenue - totalCost;
      var customerPhone = payload.customerPhone || "";

      // Handle backdating
      var transactionDate = new Date();
      if (itemsString.indexOf("⚠️ BACKDATED TO:") !== -1) {
        try {
          var dateStr = itemsString.split("⚠️ BACKDATED TO: ")[1].split(" ")[0];
          transactionDate = new Date(dateStr);
        } catch (err) { /* keep current date */ }
      }

      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return errorResponse("Orders sheet not found");

      sheet.appendRow([
        transactionDate,          // A: Timestamp
        orderId,                  // B: Order ID
        payload.customerName || "", // C: Customer Name
        payload.orderType || "",    // D: Order Type
        payload.location || "",     // E: Table/Location
        itemsString,               // F: Items
        totalRevenue,              // G: Total Revenue
        totalCost,                 // H: Total Cost
        profit,                    // I: Profit
        payload.status || "Active", // J: Status
        "",                        // K: Payment Method (filled on pay)
        "",                        // L: Cashier (filled on pay)
        "",                        // M: Prep Started
        "",                        // N: Ready At
        "",                        // O: Served At
        "",                        // P: Paid At
        "",                        // Q: Prep Time
        "",                        // R: Actual Time
        payload.notes || "",       // S: Notes
        customerPhone              // T: Customer Phone
      ]);

      // Loyalty: create or update the customer record if a phone was provided
      var loyaltyInfo = null;
      if (customerPhone) {
        loyaltyInfo = upsertCustomer(customerPhone, payload.customerName || "", totalRevenue);
      }

      logAudit("ORDER_CREATED", orderId,
        (payload.location || "") + ", " + totalRevenue,
        payload.customerName || "Customer");

      return jsonResponse({
        status: "success",
        orderId: orderId,
        cost: totalCost,
        profit: profit,
        loyaltyPoints: loyaltyInfo ? loyaltyInfo.loyaltyPoints : 0,
        nextRewardAt: 10
      });
    }

    // ── UPDATE STATUS ───────────────────────────────────────
    if (action === "updateStatus") {
      var orderId = payload.orderId;
      var newStatus = payload.newStatus;
      if (!orderId || !newStatus) return errorResponse("Order ID and new status required");

      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return errorResponse("Orders sheet not found");
      var data = sheet.getDataRange().getValues();

      for (var i = 1; i < data.length; i++) {
        if (data[i][ORD.ORDER_ID] === orderId) {
          var oldStatus = data[i][ORD.STATUS];
          var itemsString = data[i][ORD.ITEMS];
          var row = i + 1; // 1-based row

          // Prevent re-processing already paid/voided orders
          if (oldStatus.indexOf("Paid") !== -1 && newStatus.indexOf("Paid") !== -1) {
            return errorResponse("Order already paid");
          }
          if (oldStatus.indexOf("Void") !== -1) {
            return errorResponse("Order already voided");
          }

          // Update status column
          sheet.getRange(row, ORD.STATUS + 1).setValue(newStatus);

          // Handle PREP STARTED
          if (newStatus === "Preparing" && !data[i][ORD.PREP_STARTED]) {
            sheet.getRange(row, ORD.PREP_STARTED + 1).setValue(new Date());
            // Set expected prep time from menu
            var prepMin = estimatePrepTime(itemsString);
            sheet.getRange(row, ORD.PREP_TIME + 1).setValue(prepMin);
            logAudit("PREP_STARTED", orderId, "Est. " + prepMin + " min", payload.cashier || "Kitchen");
          }

          // Handle READY
          if (newStatus === "Ready" && !data[i][ORD.READY_AT]) {
            sheet.getRange(row, ORD.READY_AT + 1).setValue(new Date());
            // Calculate actual prep time
            if (data[i][ORD.PREP_STARTED]) {
              var prepStart = new Date(data[i][ORD.PREP_STARTED]);
              var readyTime = new Date();
              var actualMin = Math.round((readyTime - prepStart) / 60000);
              sheet.getRange(row, ORD.ACTUAL_TIME + 1).setValue(actualMin);
            }
            logAudit("ORDER_READY", orderId, data[i][ORD.LOCATION], payload.cashier || "Kitchen");
          }

          // Handle SERVED
          if (newStatus === "Served" && !data[i][ORD.SERVED_AT]) {
            sheet.getRange(row, ORD.SERVED_AT + 1).setValue(new Date());
            logAudit("ORDER_SERVED", orderId, data[i][ORD.LOCATION], payload.cashier || "Waiter");
          }

          // Handle PAYMENT — extract method and cashier from status string
          if (newStatus.indexOf("Paid") !== -1) {
            var method = "Unknown";
            var cashier = payload.cashier || "";
            if (newStatus.indexOf("Cash") !== -1) method = "Cash";
            if (newStatus.indexOf("POS") !== -1) method = "POS";

            sheet.getRange(row, ORD.PAYMENT_METHOD + 1).setValue(method);
            sheet.getRange(row, ORD.CASHIER + 1).setValue(cashier);
            sheet.getRange(row, ORD.PAID_AT + 1).setValue(new Date());

            // Deduct inventory on first payment
            if (oldStatus.indexOf("Paid") === -1) {
              var alerts = deductInventory(itemsString);
              logAudit("PAYMENT_RECEIVED", orderId,
                method + ", ₦" + (data[i][ORD.TOTAL_REVENUE] || 0), cashier);
            }

            return jsonResponse({
              status: "success",
              inventoryAlerts: alerts || []
            });
          }

          // Handle VOID
          if (newStatus.indexOf("Void") !== -1) {
            var voidReason = payload.voidReason || "No reason provided";
            sheet.getRange(row, ORD.NOTES + 1).setValue(
              (data[i][ORD.NOTES] ? data[i][ORD.NOTES] + " | " : "") +
              "VOID: " + voidReason
            );
            logAudit("ORDER_VOIDED", orderId, voidReason, payload.cashier || "Unknown");
          }

          // Handle CREDIT
          if (newStatus.indexOf("Credit") !== -1) {
            sheet.getRange(row, ORD.CASHIER + 1).setValue(payload.cashier || "");
            logAudit("CREDIT_ISSUED", orderId,
              "₦" + (data[i][ORD.TOTAL_REVENUE] || 0),
              payload.cashier || "Unknown");
          }

          logAudit("STATUS_UPDATED", orderId, oldStatus + " → " + newStatus, payload.cashier || "System");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Order not found: " + orderId);
    }

    // ── ADD EXPENSE ─────────────────────────────────────────
    if (action === "addExpense") {
      var sheet = ss.getSheetByName(EXPENSES_SHEET);
      if (!sheet) {
        sheet = ss.insertSheet(EXPENSES_SHEET);
        sheet.appendRow(["Date", "Category", "Description", "Amount", "Payment Method", "Recorded By"]);
      }
      sheet.appendRow([
        payload.date || new Date(),
        payload.category || "",
        payload.description || "",
        parseFloat(payload.amount) || 0,
        payload.paymentMethod || "",
        payload.recordedBy || "Manager"
      ]);
      logAudit("EXPENSE_ADDED", "",
        payload.category + ": ₦" + (payload.amount || 0),
        payload.recordedBy || "Manager");
      return jsonResponse({ status: "success" });
    }

    // ── RESTOCK INVENTORY ───────────────────────────────────
    if (action === "restockInventory") {
      var sheet = ss.getSheetByName(INVENTORY_SHEET);
      if (!sheet) return errorResponse("Inventory sheet not found");
      var data = sheet.getDataRange().getValues();

      var itemName = payload.itemName;
      var addQty = parseFloat(payload.quantity);
      if (!itemName || isNaN(addQty)) return errorResponse("Item name and quantity required");

      for (var i = 1; i < data.length; i++) {
        if (data[i][INV.NAME] === itemName) {
          var current = parseFloat(data[i][INV.STOCK]) || 0;
          var newStock = current + addQty;
          sheet.getRange(i + 1, INV.STOCK + 1).setValue(parseFloat(newStock.toFixed(2)));
          sheet.getRange(i + 1, INV.LAST_RESTOCKED + 1).setValue(new Date());
          logAudit("INVENTORY_RESTOCKED", "",
            itemName + ": +" + addQty + " (now " + newStock + ")",
            payload.performedBy || "Manager");
          return jsonResponse({ status: "success", newStock: newStock });
        }
      }
      return errorResponse("Item not found in inventory: " + itemName);
    }

    // ── ADD CASHIER ─────────────────────────────────────────
    if (action === "addCashier") {
      var sheet = ss.getSheetByName(CASHIERS_SHEET);
      if (!sheet) return errorResponse("Cashiers sheet not found");
      if (!payload.name) return errorResponse("Cashier name required");
      // Add header row if sheet is empty
      if (sheet.getLastRow() < 2) {
        sheet.appendRow(["Name", "Phone", "Role", "Active", "PIN"]);
      }
      sheet.appendRow([payload.name, payload.phone || "", payload.role || "Cashier", payload.active || "Yes", payload.pin || ""]);
      CacheService.getScriptCache().remove("get_cashiers");
      logAudit("CASHIER_ADDED", "", payload.name, payload.performedBy || "Manager");
      return jsonResponse({ status: "success" });
    }

    // ── REMOVE CASHIER ──────────────────────────────────────
    if (action === "removeCashier") {
      var sheet = ss.getSheetByName(CASHIERS_SHEET);
      if (!sheet) return errorResponse("Cashiers sheet not found");
      if (!payload.name) return errorResponse("Cashier name required");
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === payload.name) {
          sheet.deleteRow(i + 1);
          CacheService.getScriptCache().remove("get_cashiers");
          logAudit("CASHIER_REMOVED", "", payload.name, payload.performedBy || "Manager");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Cashier not found");
    }

    // ── UPDATE CASHIER ─────────────────────────────────────
    if (action === "updateCashier") {
      var sheet = ss.getSheetByName(CASHIERS_SHEET);
      if (!sheet) return errorResponse("Cashiers sheet not found");
      if (!payload.oldName) return errorResponse("Original cashier name required");
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][CSH.NAME] === payload.oldName) {
          if (payload.name !== undefined)   sheet.getRange(i + 1, CSH.NAME + 1).setValue(payload.name);
          if (payload.phone !== undefined)  sheet.getRange(i + 1, CSH.PHONE + 1).setValue(payload.phone);
          if (payload.role !== undefined)   sheet.getRange(i + 1, CSH.ROLE + 1).setValue(payload.role);
          if (payload.active !== undefined) sheet.getRange(i + 1, CSH.ACTIVE + 1).setValue(payload.active);
          if (payload.pin !== undefined)    sheet.getRange(i + 1, CSH.PIN + 1).setValue(payload.pin);
          logAudit("CASHIER_UPDATED", "", payload.oldName + " -> " + (payload.name || payload.oldName), payload.performedBy || "Manager");
          CacheService.getScriptCache().remove("get_cashiers");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Cashier not found: " + payload.oldName);
    }

    // ── TOGGLE MENU ITEM AVAILABILITY ───────────────────────
    if (action === "toggleMenuAvailability") {
      var sheet = ss.getSheetByName(MENU_SHEET);
      if (!sheet) return errorResponse("Menu sheet not found");
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][MNU.ID]) === String(payload.id)) {
          var current = data[i][MNU.AVAILABLE];
          var newVal = (current === "Yes") ? "No" : "Yes";
          sheet.getRange(i + 1, MNU.AVAILABLE + 1).setValue(newVal);
          invalidateMenuCache();
          CacheService.getScriptCache().remove("get_menu");
          logAudit("MENU_TOGGLED", "",
            data[i][MNU.NAME] + ": " + current + " → " + newVal,
            payload.performedBy || "Manager");
          return jsonResponse({ status: "success", available: newVal });
        }
      }
      return errorResponse("Menu item not found");
    }

    // ── SAVE BLOG POST ──────────────────────────────────────
    if (action === "saveBlogPost") {
      var sheet = ss.getSheetByName(BLOG_SHEET);
      if (!sheet) {
        sheet = ss.insertSheet(BLOG_SHEET);
        sheet.appendRow(["ID", "Title", "Category", "Slug", "Content", "Author", "Date", "Status", "Image URL", "Meta Description"]);
      }
      if (payload.id) {
        var rows = sheet.getDataRange().getValues();
        for (var i = 1; i < rows.length; i++) {
          if (String(rows[i][0]) === String(payload.id)) {
            sheet.getRange(i + 1, 2, 1, 9).setValues([[
              payload.title, payload.category, payload.slug, payload.content,
              payload.author || "Mevish Eatery",
              payload.date || new Date().toISOString().split("T")[0],
              payload.status || "Published",
              payload.imageUrl || "", payload.metaDescription || ""
            ]]);
            break;
          }
        }
      } else {
        var newId = new Date().getTime();
        sheet.appendRow([newId, payload.title, payload.category, payload.slug,
          payload.content, payload.author || "Mevish Eatery",
          payload.date || new Date().toISOString().split("T")[0],
          payload.status || "Published", payload.imageUrl || "",
          payload.metaDescription || ""
        ]);
      }
      return jsonResponse({ status: "success" });
    }

    // ── DELETE BLOG POST ────────────────────────────────────
    if (action === "deleteBlogPost") {
      var sheet = ss.getSheetByName(BLOG_SHEET);
      if (sheet) {
        var rows = sheet.getDataRange().getValues();
        for (var i = 1; i < rows.length; i++) {
          if (String(rows[i][0]) === String(payload.id)) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }
      return jsonResponse({ status: "success" });
    }

    // ── UPDATE SETTINGS ──────────────────────────────────────
    if (action === "updateSettings") {
      var sheet = ss.getSheetByName(CONFIG_SHEET);
      if (!sheet) return errorResponse("Settings sheet not found");
      var data = sheet.getDataRange().getValues();

      var settings = payload.settings; // object: { "Restaurant Name": "New Name", "Theme": "dark", ... }
      if (typeof settings !== "object") return errorResponse("settings object required");
      var keys = Object.keys(settings);
      var updated = 0;

      keys.forEach(function(key) {
        var found = false;
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === key) {
            sheet.getRange(i + 1, 2).setValue(String(settings[key]));
            found = true;
            updated++;
            break;
          }
        }
        if (!found) {
          // Add new setting row if it doesn't exist
          sheet.appendRow([key, String(settings[key])]);
          updated++;
        }
      });

      logAudit("SETTINGS_UPDATED", "", keys.join(", "), payload.performedBy || "Manager");
      return jsonResponse({ status: "success", updated: updated });
    }

    // ── ADD MENU ITEM ────────────────────────────────────────
    if (action === "addMenuItem") {
      var sheet = ss.getSheetByName(MENU_SHEET);
      if (!sheet) return errorResponse("Menu sheet not found");

      var id = payload.id || (new Date().getTime());
      sheet.appendRow([
        id,
        payload.category || "",
        payload.name || "",
        parseFloat(payload.price) || 0,
        parseFloat(payload.cost) || 0,
        parseInt(payload.prepTime) || 10,
        payload.available !== false ? "Yes" : "No",
        payload.imageUrl || "",
        payload.description || "",
        payload.emoji || ""
      ]);
      invalidateMenuCache();
      CacheService.getScriptCache().remove("get_menu");
      logAudit("MENU_ITEM_ADDED", "", payload.name || "Unknown", payload.performedBy || "Manager");
      return jsonResponse({ status: "success", id: id });
    }

    // ── UPDATE MENU ITEM ──────────────────────────────────────
    if (action === "updateMenuItem") {
      var sheet = ss.getSheetByName(MENU_SHEET);
      if (!sheet) return errorResponse("Menu sheet not found");
      var data = sheet.getDataRange().getValues();
      var itemId = String(payload.id);

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][MNU.ID]) === itemId) {
          // Update only provided fields
          if (payload.category !== undefined)    sheet.getRange(i + 1, MNU.CATEGORY + 1).setValue(payload.category);
          if (payload.name !== undefined)          sheet.getRange(i + 1, MNU.NAME + 1).setValue(payload.name);
          if (payload.price !== undefined)         sheet.getRange(i + 1, MNU.PRICE + 1).setValue(parseFloat(payload.price) || 0);
          if (payload.cost !== undefined)          sheet.getRange(i + 1, MNU.COST + 1).setValue(parseFloat(payload.cost) || 0);
          if (payload.prepTime !== undefined)      sheet.getRange(i + 1, MNU.PREP_TIME + 1).setValue(parseInt(payload.prepTime) || 10);
          if (payload.available !== undefined)     sheet.getRange(i + 1, MNU.AVAILABLE + 1).setValue(payload.available ? "Yes" : "No");
          if (payload.imageUrl !== undefined)       sheet.getRange(i + 1, MNU.IMAGE + 1).setValue(payload.imageUrl);
          if (payload.description !== undefined)   sheet.getRange(i + 1, MNU.DESCRIPTION + 1).setValue(payload.description);
          if (payload.emoji !== undefined)          sheet.getRange(i + 1, MNU.EMOJI + 1).setValue(payload.emoji);

          invalidateMenuCache();
          CacheService.getScriptCache().remove("get_menu");
          logAudit("MENU_ITEM_UPDATED", itemId, payload.name || "", payload.performedBy || "Manager");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Menu item not found: " + itemId);
    }

    // ── DELETE MENU ITEM ──────────────────────────────────────
    if (action === "deleteMenuItem") {
      var sheet = ss.getSheetByName(MENU_SHEET);
      if (!sheet) return errorResponse("Menu sheet not found");
      var data = sheet.getDataRange().getValues();
      var itemId = String(payload.id);

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][MNU.ID]) === itemId) {
          var name = data[i][MNU.NAME];
          sheet.deleteRow(i + 1);
          invalidateMenuCache();
          CacheService.getScriptCache().remove("get_menu");
          logAudit("MENU_ITEM_DELETED", itemId, name, payload.performedBy || "Manager");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Menu item not found: " + itemId);
    }

    // ── ADD TABLE ──────────────────────────────────────────────
    if (action === "addTable") {
      var sheet = ss.getSheetByName(TABLES_SHEET);
      if (!sheet) {
        sheet = ss.insertSheet(TABLES_SHEET);
        sheet.appendRow(["Table ID", "Seats", "Status", "QR Code URL", "Notes"]);
      }
      var tableId = payload.tableId || ("T" + (sheet.getLastRow()));
      var seats = parseInt(payload.seats) || 4;
      var existing = sheet.getDataRange().getValues();
      for (var i = 1; i < existing.length; i++) {
        if (existing[i][0] === tableId) return errorResponse("Table already exists: " + tableId);
      }
      sheet.appendRow([
        tableId,
        seats,
        "Available",
        payload.qrUrl || "",
        payload.notes || ""
      ]);
      CacheService.getScriptCache().remove("get_tables");
      logAudit("TABLE_ADDED", "", tableId + " (" + seats + " seats)", payload.performedBy || "Manager");
      return jsonResponse({ status: "success", tableId: tableId });
    }

    // ── UPDATE TABLE ───────────────────────────────────────────
    if (action === "updateTable") {
      var sheet = ss.getSheetByName(TABLES_SHEET);
      if (!sheet) return errorResponse("Tables sheet not found");
      var data = sheet.getDataRange().getValues();
      var tableId = payload.tableId;

      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === tableId) {
          // Columns: 0=ID, 1=Seats, 2=Status, 3=QR URL, 4=Notes
          if (payload.seats !== undefined)   sheet.getRange(i + 1, 2).setValue(parseInt(payload.seats) || 4);
          if (payload.status !== undefined)  sheet.getRange(i + 1, 3).setValue(payload.status);
          if (payload.qrUrl !== undefined)    sheet.getRange(i + 1, 4).setValue(payload.qrUrl);
          if (payload.notes !== undefined)    sheet.getRange(i + 1, 5).setValue(payload.notes);
          logAudit("TABLE_UPDATED", "", tableId, payload.performedBy || "Manager");
          CacheService.getScriptCache().remove("get_tables");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Table not found: " + tableId);
    }

    // ── REMOVE TABLE ──────────────────────────────────────────
    if (action === "removeTable") {
      var sheet = ss.getSheetByName(TABLES_SHEET);
      if (!sheet) return errorResponse("Tables sheet not found");
      var data = sheet.getDataRange().getValues();
      var tableId = payload.tableId;

      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === tableId) {
          sheet.deleteRow(i + 1);
          CacheService.getScriptCache().remove("get_tables");
          logAudit("TABLE_REMOVED", "", tableId, payload.performedBy || "Manager");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Table not found: " + tableId);
    }

    // ── ADD INVENTORY ITEM ────────────────────────────────────
    if (action === "addInventoryItem") {
      var sheet = ss.getSheetByName(INVENTORY_SHEET);
      if (!sheet) return errorResponse("Inventory sheet not found");

      sheet.appendRow([
        payload.name || "",
        payload.category || "",
        parseFloat(payload.stock) || 0,
        parseFloat(payload.alertThreshold) || 5,
        payload.unit || "pcs",
        parseFloat(payload.costPerUnit) || 0,
        payload.supplier || "",
        new Date(),
        parseInt(payload.minOrderQty) || 0
      ]);
      logAudit("INVENTORY_ITEM_ADDED", "", payload.name || "Unknown", payload.performedBy || "Manager");
      return jsonResponse({ status: "success" });
    }

    // ── UPDATE INVENTORY ITEM ─────────────────────────────────
    if (action === "updateInventoryItem") {
      var sheet = ss.getSheetByName(INVENTORY_SHEET);
      if (!sheet) return errorResponse("Inventory sheet not found");
      var data = sheet.getDataRange().getValues();
      var itemName = payload.name;
      var newName = payload.newName; // allow renaming

      for (var i = 1; i < data.length; i++) {
        if (data[i][INV.NAME] === itemName) {
          if (newName !== undefined)                  sheet.getRange(i + 1, INV.NAME + 1).setValue(newName);
          if (payload.category !== undefined)          sheet.getRange(i + 1, INV.CATEGORY + 1).setValue(payload.category);
          if (payload.stock !== undefined)            sheet.getRange(i + 1, INV.STOCK + 1).setValue(parseFloat(payload.stock) || 0);
          if (payload.alertThreshold !== undefined)    sheet.getRange(i + 1, INV.ALERT_THRESHOLD + 1).setValue(parseFloat(payload.alertThreshold) || 5);
          if (payload.unit !== undefined)              sheet.getRange(i + 1, INV.UNIT + 1).setValue(payload.unit);
          if (payload.costPerUnit !== undefined)       sheet.getRange(i + 1, INV.COST_PER_UNIT + 1).setValue(parseFloat(payload.costPerUnit) || 0);
          if (payload.supplier !== undefined)          sheet.getRange(i + 1, INV.SUPPLIER + 1).setValue(payload.supplier);
          if (payload.minOrderQty !== undefined)       sheet.getRange(i + 1, INV.MIN_ORDER_QTY + 1).setValue(parseInt(payload.minOrderQty) || 0);
          logAudit("INVENTORY_ITEM_UPDATED", "", itemName, payload.performedBy || "Manager");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Inventory item not found: " + itemName);
    }

    // ── DELETE INVENTORY ITEM ─────────────────────────────────
    if (action === "deleteInventoryItem") {
      var sheet = ss.getSheetByName(INVENTORY_SHEET);
      if (!sheet) return errorResponse("Inventory sheet not found");
      var data = sheet.getDataRange().getValues();
      var itemName = payload.name;

      for (var i = 1; i < data.length; i++) {
        if (data[i][INV.NAME] === itemName) {
          sheet.deleteRow(i + 1);
          logAudit("INVENTORY_ITEM_DELETED", "", itemName, payload.performedBy || "Manager");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Inventory item not found: " + itemName);
    }

    // ── SETTLE CREDIT ───────────────────────────────────────
    if (action === "settleCredit") {
      var sheet = ss.getSheetByName(ORDERS_SHEET);
      if (!sheet) return errorResponse("Orders sheet not found");
      var data = sheet.getDataRange().getValues();

      for (var i = 1; i < data.length; i++) {
        if (data[i][ORD.ORDER_ID] === payload.orderId) {
          var oldStatus = data[i][ORD.STATUS];
          if (oldStatus.indexOf("Credit") === -1) {
            return errorResponse("Order is not a credit order");
          }
          var method = payload.method || "Cash";
          var newStatus = "Paid - " + method + " (" + (payload.cashier || "") + ")";
          sheet.getRange(i + 1, ORD.STATUS + 1).setValue(newStatus);
          sheet.getRange(i + 1, ORD.PAYMENT_METHOD + 1).setValue(method);
          sheet.getRange(i + 1, ORD.CASHIER + 1).setValue(payload.cashier || "");
          sheet.getRange(i + 1, ORD.PAID_AT + 1).setValue(new Date());
          logAudit("CREDIT_SETTLED", payload.orderId, method, payload.cashier || "Unknown");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Order not found");
    }

    // ── SAVE REVIEW ────────────────────────────────────────
    if (action === "saveReview") {
      var rating = parseInt(payload.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return errorResponse("Rating must be between 1 and 5");
      }
      if (!payload.orderId) return errorResponse("Order ID required");

      var sheet = ss.getSheetByName(REVIEWS_SHEET);
      if (!sheet) {
        sheet = ss.insertSheet(REVIEWS_SHEET);
        sheet.appendRow(["Timestamp", "Order ID", "Phone", "Rating", "Comment", "Customer Name", "Status"]);
      }
      sheet.appendRow([
        new Date(),
        payload.orderId,
        payload.phone || "",
        rating,
        payload.comment || "",
        payload.customerName || "",
        "Pending"
      ]);
      logAudit("REVIEW_SUBMITTED", payload.orderId,
        rating + " stars", payload.customerName || "Customer");
      return jsonResponse({ status: "success" });
    }

    // ── APPROVE / REJECT REVIEW ────────────────────────────
    if (action === "approveReview") {
      var sheet = ss.getSheetByName(REVIEWS_SHEET);
      if (!sheet) return errorResponse("Reviews sheet not found");
      var data = sheet.getDataRange().getValues();
      var decision = payload.decision || "approve";
      var newStatus = (decision === "reject") ? "Rejected" : "Approved";

      for (var i = 1; i < data.length; i++) {
        var match = false;
        // Match by orderId (preferred) or by row index
        if (payload.orderId && String(data[i][REV.ORDER_ID]) === String(payload.orderId)) {
          match = true;
        } else if (payload.rowIndex && (parseInt(payload.rowIndex) === i)) {
          match = true;
        }
        if (match) {
          sheet.getRange(i + 1, REV.STATUS + 1).setValue(newStatus);
          logAudit("REVIEW_" + newStatus.toUpperCase(),
            data[i][REV.ORDER_ID], "", payload.performedBy || "Manager");
          return jsonResponse({ status: "success" });
        }
      }
      return errorResponse("Review not found");
    }

    // ── FALLTHROUGH ─────────────────────────────────────────
    return errorResponse("Unknown action: " + action);

  } catch (error) {
    return errorResponse(error.toString());
  }
}


// ═══════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Parse items string into array for the order tracker
 * Input: "2x Jollof Rice | 1x Chicken (Notes: extra spicy)"
 * Output: [{qty: 2, name: "Jollof Rice"}, {qty: 1, name: "Chicken"}]
 */
function parseItemsForTracker(itemsString) {
  if (!itemsString) return [];
  itemsString = String(itemsString);
  var cleanStr = itemsString.split(" (Notes:")[0];
  var itemsList = cleanStr.split(" | ");
  var result = [];
  itemsList.forEach(function(item) {
    var parts = item.trim().split("x ");
    if (parts.length === 2) {
      result.push({
        qty: parseInt(parts[0]),
        name: parts[1].trim()
      });
    }
  });
  return result;
}

/**
 * Estimate prep time from menu items
 * Returns the maximum prep time of any item in the order.
 * Uses the shared cached menu lookup (see getMenuLookup).
 */
function estimatePrepTime(itemsString) {
  var lookup = getMenuLookup();

  var cleanStr = itemsString.split(" (Notes:")[0];
  var itemsList = cleanStr.split(" | ");
  var maxTime = 0;
  itemsList.forEach(function(item) {
    var parts = item.trim().split("x ");
    if (parts.length === 2) {
      var name = parts[1].trim();
      var entry = lookup[name];
      var t = entry ? (entry.prepTime || 10) : 10;
      if (t > maxTime) maxTime = t;
    }
  });
  return maxTime || 10;
}

/**
 * Parse a pipe-separated items string into [{qty, name}] pairs.
 * Strips any "(Notes:" suffix. Shared by tracker, recommendations & analytics.
 * Input:  "2x Jollof Rice | 1x Chicken (Notes: extra spicy)"
 * Output: [{qty: 2, name: "Jollof Rice"}, {qty: 1, name: "Chicken"}]
 */
function parseItemNames(itemsString) {
  if (!itemsString) return [];
  var cleanStr = String(itemsString).split(" (Notes:")[0];
  var itemsList = cleanStr.split(" | ");
  var result = [];
  itemsList.forEach(function(item) {
    var parts = item.trim().split("x ");
    if (parts.length === 2) {
      var qty = parseInt(parts[0]);
      if (!isNaN(qty)) {
        result.push({ qty: qty, name: parts[1].trim() });
      }
    }
  });
  return result;
}

/**
 * Build a menu lookup map keyed by item name -> {price, emoji, category}.
 * Returns an empty object if the Menu sheet is missing.
 * Delegates to the shared cached lookup (see getMenuLookup) so repeated
 * reads of the Menu sheet are avoided across requests.
 */
function buildMenuLookup(ss) {
  var cached = getMenuLookup();
  var lookup = {};
  for (var name in cached) {
    if (!cached.hasOwnProperty(name)) continue;
    var entry = cached[name];
    lookup[name] = {
      price: entry.price || 0,
      emoji: entry.emoji || "",
      category: entry.category || ""
    };
  }
  return lookup;
}

/**
 * Create or update a customer record for loyalty tracking.
 * Auto-creates the Customers sheet if missing. Never throws —
 * returns zeros on failure so order creation is never blocked.
 * Returns: {loyaltyPoints, totalOrders}
 */
function upsertCustomer(phone, name, totalSpent) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(CUSTOMERS_SHEET);
      sheet.appendRow(["Phone", "Name", "Total Orders", "Total Spent", "Loyalty Points", "Last Visit", "Created At"]);
    }

    var data = sheet.getDataRange().getValues();
    var addSpent = parseFloat(totalSpent) || 0;
    var now = new Date();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][CUST.PHONE]) === String(phone)) {
        var newOrders = (parseInt(data[i][CUST.TOTAL_ORDERS]) || 0) + 1;
        var newSpent = (parseFloat(data[i][CUST.TOTAL_SPENT]) || 0) + addSpent;
        var newPoints = (parseInt(data[i][CUST.LOYALTY_POINTS]) || 0) + 1;
        var row = i + 1;
        sheet.getRange(row, CUST.TOTAL_ORDERS + 1).setValue(newOrders);
        sheet.getRange(row, CUST.TOTAL_SPENT + 1).setValue(Math.round(newSpent * 100) / 100);
        sheet.getRange(row, CUST.LOYALTY_POINTS + 1).setValue(newPoints);
        sheet.getRange(row, CUST.LAST_VISIT + 1).setValue(now);
        if (name && name !== "") {
          sheet.getRange(row, CUST.NAME + 1).setValue(name);
        }
        return { loyaltyPoints: newPoints, totalOrders: newOrders };
      }
    }

    // No match — append a new customer
    sheet.appendRow([phone, name || "Customer", 1, addSpent, 1, now, now]);
    return { loyaltyPoints: 1, totalOrders: 1 };
  } catch (err) {
    return { loyaltyPoints: 0, totalOrders: 0 };
  }
}


// ═══════════════════════════════════════════════════════════════
//  SCHEDULED TRIGGERS (set up in AppScript Triggers menu)
// ═══════════════════════════════════════════════════════════════

/**
 * Auto-void stale Active orders after X minutes
 * Set up as a time-driven trigger (every 10 minutes)
 */
function autoVoidStaleOrders() {
  var maxMinutes = parseInt(getSetting("Auto Void Minutes")) || 120;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var now = new Date();
  var voided = 0;

  for (var i = 1; i < data.length; i++) {
    var status = data[i][ORD.STATUS];
    if (status !== "Active") continue;

    var orderTime = new Date(data[i][ORD.TIMESTAMP]);
    var diffMinutes = (now - orderTime) / 60000;

    if (diffMinutes > maxMinutes) {
      sheet.getRange(i + 1, ORD.STATUS + 1).setValue("Void (Auto)");
      sheet.getRange(i + 1, ORD.NOTES + 1).setValue(
        (data[i][ORD.NOTES] ? data[i][ORD.NOTES] + " | " : "") +
        "AUTO-VOIDED after " + Math.round(diffMinutes) + " minutes"
      );
      logAudit("AUTO_VOID", data[i][ORD.ORDER_ID],
        "Stale for " + Math.round(diffMinutes) + " min", "System");
      voided++;
    }
  }

  if (voided > 0) {
    Logger.log("Auto-voided " + voided + " stale orders");
  }
}

/**
 * Send low-stock alert email to manager
 * Set up as a time-driven trigger (hourly)
 */
function sendLowStockAlert() {
  var shouldAlert = getSetting("Low Stock Alert");
  if (shouldAlert !== "true") return;

  var alerts = getInventoryAlerts();
  if (alerts.length === 0) return;

  var managerEmail = getSetting("Email");
  if (!managerEmail) return;

  var restaurantName = getSetting("Restaurant Name") || "Restaurant";
  var body = "⚠️ LOW STOCK ALERT for " + restaurantName + "\n\n";
  alerts.forEach(function(item) {
    body += "• " + item.name + ": " + item.currentStock + " " + item.unit +
      " (threshold: " + item.alertThreshold + ")" +
      (item.supplier ? " — Supplier: " + item.supplier : "") +
      (item.minOrderQty ? " — Min reorder: " + item.minOrderQty + " " + item.unit : "") +
      "\n";
  });
  body += "\nPlease restock as soon as possible.";

  MailApp.sendEmail({
    to: managerEmail,
    subject: "⚠️ Low Stock Alert — " + restaurantName,
    body: body
  });
}

/**
 * BACKUP FIRESTORE TO GOOGLE SHEETS
 * Set this up on a Time-Driven Trigger to run daily at 2:00 AM.
 */
function backupFirestoreToSheet() {
  var projectId = 'mevish-eatery';
  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/orders';
  
  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) {
      var json = JSON.parse(response.getContentText());
      var docs = json.documents || [];
      
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Orders (Backup)');
      if (!sheet) {
        sheet = ss.insertSheet('Orders (Backup)');
        sheet.appendRow(['Timestamp', 'Order ID', 'Customer', 'Phone', 'Location', 'Items', 'Total', 'Status', 'Payment Method', 'Cashier', 'Order Type']);
      }
      
      // Clear existing data (except header) and re-sync
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }
      
      var rows = [];
      docs.forEach(function(doc) {
        var fields = doc.fields || {};
        var getVal = function(f) { return fields[f] ? (fields[f].stringValue || fields[f].integerValue || fields[f].doubleValue || '') : ''; };
        
        rows.push([
          getVal('timestamp'),
          getVal('orderId'),
          getVal('customerName'),
          getVal('customerPhone'),
          getVal('location'),
          getVal('cartItems'),
          getVal('totalPrice'),
          getVal('status'),
          getVal('paymentMethod'),
          getVal('cashier'),
          getVal('orderType')
        ]);
      });
      
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      Logger.log('Backed up ' + rows.length + ' orders from Firestore.');
    }
  } catch (e) {
    Logger.log('Firestore Backup Error: ' + e.toString());
  }
}

