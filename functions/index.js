/**
 * Mevish RMS — Cloud Functions
 * ============================
 * Cashier PIN verification, done server-side.
 *
 * Why this exists: every PIN check used to happen in the browser — the
 * client read the whole `staff` collection (or, before that collection
 * was populated, the legacy Apps Script sheet) and compared a plaintext
 * PIN field itself. That means anyone who found the API URL could read
 * every cashier's real PIN with a single unauthenticated GET request —
 * confirmed live during this round, not theoretical. These two functions
 * move both the check and the write behind a trusted server boundary:
 * the client sends a PIN in, and gets back only a name/role on success —
 * never anything it could compare against other PINs itself.
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

admin.initializeApp();
const db = admin.firestore();

// Lagos is UTC+1 and there's no reason to run this anywhere else —
// keeping it close to the data also keeps latency down for a 4-digit
// PIN check that already costs bcrypt's deliberate ~100ms per compare.
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const BCRYPT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ─── Rate limiting ──────────────────────────────────────────────────
// A 4-digit PIN is only 10,000 possible values — with no throttling,
// a script could brute-force one in minutes. This isn't about blocking
// a real cashier who fat-fingers a digit twice; it's about making an
// unattended guessing script impractical. Keyed by request IP (2nd-gen
// callable functions expose this on the raw request) rather than
// anything the caller sends, so it can't be spoofed by the client.
async function checkRateLimit(ip) {
  const ref = db.collection("pin_rate_limit").doc(ip || "unknown");
  const doc = await ref.get();
  if (!doc.exists) return { blocked: false, ref };
  const data = doc.data();
  const windowStart = Date.now() - LOCKOUT_WINDOW_MS;
  if ((data.lastFailAt || 0) < windowStart) {
    // Window has expired — treat as a clean slate.
    return { blocked: false, ref };
  }
  return { blocked: (data.failCount || 0) >= MAX_FAILED_ATTEMPTS, ref };
}
async function recordFailure(ref) {
  await ref.set({ failCount: admin.firestore.FieldValue.increment(1), lastFailAt: Date.now() }, { merge: true });
}
async function clearFailures(ref) {
  await ref.delete().catch(() => {});
}

// ─── verifyCashierPin ───────────────────────────────────────────────
// Called from the dashboard.html PIN pad. No Firebase Auth session is
// expected here on purpose — that's the whole point of a shared-device
// PIN pad — so the only gate is the rate limiter above.
exports.verifyCashierPin = onCall(async (request) => {
  const pin = String((request.data && request.data.pin) || "").trim();
  if (!/^\d{4}$/.test(pin)) {
    throw new HttpsError("invalid-argument", "PIN must be 4 digits.");
  }

  const ip = (request.rawRequest && request.rawRequest.ip) || "unknown";
  const { blocked, ref } = await checkRateLimit(ip);
  if (blocked) {
    throw new HttpsError("resource-exhausted", "Too many attempts. Wait a few minutes and try again.");
  }

  const snap = await db.collection("staff").where("active", "!=", "No").get();
  for (const doc of snap.docs) {
    const staff = doc.data();
    if (!staff.pinHash) continue; // not migrated to hashed storage yet — see migrateCashierPin below
    const match = await bcrypt.compare(pin, staff.pinHash);
    if (match) {
      await clearFailures(ref);
      return { success: true, name: staff.name, role: staff.role || "Cashier" };
    }
  }

  await recordFailure(ref);
  return { success: false };
});

// ─── Auth helper shared by the two management functions below ───────
async function requireManager(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in as a Manager to do this.");
  }
  const userDoc = await db.collection("users").doc(request.auth.uid).get();
  const role = userDoc.exists ? userDoc.data().role : null;
  if (!["Manager", "Admin", "SuperAdmin"].includes(role)) {
    throw new HttpsError("permission-denied", "Only a Manager can do this.");
  }
  return role;
}

// ─── setCashierPin ──────────────────────────────────────────────────
// Called from manager.html's Cashiers panel on add/edit. Hashes the PIN
// server-side so a plaintext PIN is never the thing written to
// Firestore — manager.html never has to know how the hashing works,
// it just sends the plaintext PIN once, over an authenticated call.
exports.setCashierPin = onCall(async (request) => {
  await requireManager(request);

  const { docId, name, phone, role, pin, active } = request.data || {};
  if (!name || !String(name).trim()) {
    throw new HttpsError("invalid-argument", "Name is required.");
  }
  if (pin && !/^\d{4}$/.test(String(pin))) {
    throw new HttpsError("invalid-argument", "PIN must be 4 digits.");
  }

  const payload = {
    name: String(name).trim(),
    phone: phone || "",
    role: role || "Cashier",
    active: active || "Yes",
    updatedAt: Date.now(),
  };
  if (pin) {
    payload.pinHash = await bcrypt.hash(String(pin), BCRYPT_ROUNDS);
  }

  if (docId) {
    await db.collection("staff").doc(docId).set(payload, { merge: true });
    return { success: true, docId };
  }
  if (!pin) {
    throw new HttpsError("invalid-argument", "PIN is required for a new cashier.");
  }
  payload.createdAt = Date.now();
  const ref = await db.collection("staff").add(payload);
  return { success: true, docId: ref.id };
});

// ─── migrateCashierPin ──────────────────────────────────────────────
// One-time bridge for the 5 cashiers that only ever existed in the old
// Apps Script sheet (plaintext PINs, confirmed still live and publicly
// readable). Lets a Manager re-enter each real name + PIN once through
// this hashing path instead of hand-editing Firestore. Safe to remove
// once every real cashier has been re-added through the Cashiers panel.
exports.migrateCashierPin = onCall(async (request) => {
  await requireManager(request);
  const { name, phone, role, pin } = request.data || {};
  if (!name || !pin || !/^\d{4}$/.test(String(pin))) {
    throw new HttpsError("invalid-argument", "Name and a 4-digit PIN are required.");
  }
  const pinHash = await bcrypt.hash(String(pin), BCRYPT_ROUNDS);
  const ref = await db.collection("staff").add({
    name: String(name).trim(),
    phone: phone || "",
    role: role || "Cashier",
    active: "Yes",
    pinHash,
    createdAt: Date.now(),
    migratedFrom: "apps-script",
  });
  logger.info(`Migrated cashier "${name}" from Apps Script to hashed Firestore storage.`);
  return { success: true, docId: ref.id };
});
