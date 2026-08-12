# Deploying the hashed-PIN Cloud Functions

Three functions live here: `verifyCashierPin` (the PIN pad calls this to log
a cashier in), `setCashierPin` (the Manager panel calls this to add/edit a
cashier), and `migrateCashierPin` (a one-time bridge for cashiers that still
only exist in the old Apps Script sheet). None of this touches your live
site until you deploy it — until then, login keeps working exactly as it
does today, through the existing Firestore/Apps-Script path.

## 0. This needs the Blaze (pay-as-you-go) plan

Cloud Functions don't run on Firebase's free Spark plan at all — the
project needs to be on Blaze first. This is the one step in this whole
change that has to happen in the Firebase Console, not from a terminal:

1. https://console.firebase.google.com/project/mevish-eatery/usage/details
2. "Modify plan" → Blaze.

Blaze still has a genuinely free monthly allowance (2M function calls,
generous compute time) — for a single restaurant's cashier logins, this is
very unlikely to ever cost anything, but it does require a card on file.

## 1. Install the Firebase CLI (once, if you haven't already)

```bash
npm install -g firebase-tools
firebase login
```

## 2. Install the function dependencies

```bash
cd functions
npm install
cd ..
```

## 3. Deploy

```bash
firebase deploy --only functions
```

Expected output ends with three function URLs and `✔ Deploy complete!`.

## 4. Re-add your cashiers through the (now-hashing) Cashiers panel

`staff` was cleared along with the rest of the test data this round, and
the 5 real cashiers (Jamila, Amina, Hauwa, Taj, Muhammad Tajudeen) still
only exist in the old Apps Script sheet — which is, worth being direct
about, currently serving their real PINs in plaintext to anyone who sends
it a plain unauthenticated request. Re-adding each one through Manager →
Cashiers now writes a bcrypt hash instead of a plaintext PIN, and there's
no extra step: the panel already calls `setCashierPin` first automatically
once it detects the function is live.

## 5. Confirm it's actually being used

Open dashboard.html, open the browser console, and log in with a real PIN.
You should NOT see the line `verifyCashierPin Cloud Function unavailable,
falling back` — if you do, the function isn't reachable yet (check step 3
succeeded, and that the project is really on Blaze).

## 6. Only after step 5 passes: tighten `staff` read access

`firestore.rules` still has `allow read: if true;` on `staff` — that was
required for the PIN pad to look itself up directly in Firestore, but once
verification happens inside `verifyCashierPin` instead, the client never
needs to read `staff` at all. Deliberately **not** changed as part of this
round, because tightening it before functions are confirmed live would
break cashier login outright (the fallback path still needs that read).

Once step 5 is confirmed working, change the `staff` rule in
`firestore.rules` to:

```
match /staff/{member} {
  allow read: if isManager();
  allow write: if isManager();
}
```

then `firebase deploy --only firestore:rules`.

## Rollback

Nothing to roll back on the client — every call site here already falls
back to the pre-existing path automatically if the function errors or
isn't deployed. If something's wrong after deploying, `firebase functions:
delete verifyCashierPin setCashierPin migrateCashierPin` removes them and
login goes back to working exactly as before, no code changes needed.
