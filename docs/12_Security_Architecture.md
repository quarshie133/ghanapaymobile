# Security Architecture — GhanaPay Mobile

This document describes security measures that actually exist in the
codebase, verified by reading the code (and in several cases, by writing
tests against it). It does not describe aspirational or planned security
work — see `docs/PROJECT_AUDIT.md` for what's explicitly still missing.

## 1. Authentication

- **Firebase Authentication** (email/password + Google) is the sole
  identity provider. No custom password storage, no custom JWT scheme —
  an earlier custom-JWT/localStorage approach was fully removed in Phase 4.
- Every account, however created, defaults to `role: "customer"` in
  Firestore. There is no code path — client or server — that lets an
  account set its own role to `administrator` or `merchant`. Promotion is
  a manual Firebase Console edit (see `docs/15_FIREBASE_GUI_SETUP_GUIDE.md`
  §9), which only works because the Console uses the Admin SDK and
  therefore bypasses Firestore Security Rules — not a controlled app
  feature.
- Passwords are never touched by application code — Firebase Authentication
  handles hashing, storage, and verification entirely.

## 2. Authorization — server-side, not just hidden buttons

Every API route that returns or modifies user data calls `requireAuth()`
(`src/lib/server-auth.ts`), which:

1. Extracts the `Authorization: Bearer <token>` header.
2. Verifies it with `adminAuth().verifyIdToken()` — a real cryptographic
   verification against Firebase's servers, not a client-supplied claim.
3. For admin-only routes, additionally checks the caller's `role` field in
   Firestore (fetched server-side, not trusted from the request).

**Client-side route guards** (`DashboardProtectedRoute`, `AdminProtectedRoute`)
exist too, but are explicitly documented in their own source comments as
UX conveniences only — hiding screens from users who shouldn't see them,
not the actual security boundary. The real boundary is `requireAuth()` on
every route, which was audited end-to-end in this phase (see §6).

## 3. Money movement — server-side only, atomic

- All wallet balance changes (`src/lib/wallet-ledger.ts`) happen inside
  Firestore transactions run via the Admin SDK from server-only API
  routes. The browser never computes or sends a new balance — it sends an
  intent ("top up ₵50", "transfer ₵20 to X"), and the server decides the
  result.
- **Idempotency keys** prevent duplicate processing of a double-submitted
  request (checked inside the same atomic transaction as the balance
  write, so a race between two near-simultaneous duplicate requests can't
  both slip through).
- **Peer-to-peer transfers debit and credit both wallets in one atomic
  transaction** — either both happen or neither does.
- **Recipient resolution for transfers happens server-side by phone
  number** (`src/lib/server-user-lookup.ts`) — a client cannot forge a
  transfer to an arbitrary uid it doesn't have the phone number for.

## 4. Firestore Security Rules

`firestore.rules` follows one consistent pattern across every collection:
a user can **read** their own documents (and admins can read broadly where
their role requires it — e.g. KYC review, transaction monitoring); **all
writes to financial/sensitive collections are denied to the client SDK
entirely** (`allow write: if false`), because every real write already
happens server-side via the Admin SDK, which bypasses these rules by
design. This is deliberate: the rules exist to block the *client* SDK from
ever writing a balance or approving its own KYC directly, not to describe
what the server does.

Collections covered: `users`, `wallets`, `walletTransactions`,
`kycRecords`, `linkedAccounts`, `notifications`, `scheduledPayments`.
Everything else is default-denied.

## 5. KYC document privacy

- Documents upload directly from the client to Firebase Storage under
  `kyc/{uid}/`, restricted by `storage.rules` to the owning user only.
- **Deliberately never uses `getDownloadURL()`** — that Firebase Storage
  API generates a token-based link that bypasses Security Rules for
  anyone holding it, which would make documents effectively public. Only
  the Storage *path* is stored in Firestore.
- Admin viewing goes through `GET /api/kyc/document-url`, which generates
  a **5-minute signed URL** server-side via the Admin SDK — never a
  permanent link.

## 6. This phase's audit findings (fixed, not just documented)

A full pass over every API route for authentication enforcement — the
first time this was done systematically rather than per-feature — found:

- **`GET /api/transactions` had no authentication at all** and returned
  hardcoded mock data to any caller. Fixed: now requires auth, returns
  only the caller's own real transactions.
- **`POST /api/users/update` didn't exist**, despite the Settings page
  calling it since Phase 4 — profile updates silently failed with no
  error shown to the user. Built for real.
- **Five dead/orphaned routes removed entirely**: `/api/auth/login`,
  `/api/auth/session`, `/api/auth/logout` (leftover from the pre-Phase-4
  custom auth scheme, referencing a backend that no longer exists), and
  unauthenticated root-level `/api/bills` and `/api/users` routes that
  returned fabricated data and were superseded by real, authenticated
  equivalents (`/api/bills/pay`, `/api/admin/users`) but never deleted.

This is exactly the kind of drift that happens across many incremental
phases without a dedicated audit pass — worth repeating periodically
rather than assuming past phases stay correct forever.

## 7. What's explicitly NOT covered here

- **No rate limiting** on any API route. A malicious or buggy client could
  hammer `/api/wallet` (top-up) repeatedly; only the idempotency key and
  sandbox amount cap limit damage, not a request-rate limit.
- **No Firebase App Check** — flagged as a setup step in
  `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` §7 but never wired into the
  application code.
- **No CSRF protection beyond what Firebase ID tokens inherently provide**
  (a token isn't automatically sent by the browser the way a cookie is,
  which mitigates classic CSRF, but this hasn't been formally reviewed).
- **No input sanitization library** — relies on Firestore's typed writes
  and the narrow validation each route does inline (e.g. amount must be a
  positive finite number). Not reviewed against XSS/injection systematically.
- **No dependency vulnerability audit performed** — `npm audit` reports
  several vulnerabilities (see terminal output from any `npm install` in
  this project); none have been triaged or fixed as part of this work.

See `docs/SECURITY_TEST_REPORT.md` for what's been verified by an actual
test versus what's asserted here by code review only.
