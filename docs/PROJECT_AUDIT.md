# PROJECT_AUDIT.md — GhanaPay Mobile

## 1. Baseline state (as uploaded)

- **Framework**: Next.js 16.2.10 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 3.
- **Route structure already scaffolded** via route groups:
  - `(auth)`: login, callback
  - `(dashboard)`: dashboard, wallet, send-money, airtime, bill-payments, scheduled,
    kyc, history, statements, analytics, bulk-payments, settings, assistant
  - `(admin)`: admin, admin/users, admin/transactions, admin/kyc, admin/fraud, admin/reports
- **Authentication was fake**: `AuthContext.tsx` implemented a custom JWT
  scheme against `localStorage` and a nonexistent external API
  (`NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:3001`). No backend
  existed behind it — login could not actually authenticate anyone.
- **All API routes under `src/app/api/*` were stubs** returning hardcoded
  JSON with explicit `// TODO` markers and no database access:
  `wallet/route.ts`, `transactions/route.ts`, `users/route.ts`,
  `bills/route.ts`, `kyc/route.ts`.
- **All dashboard data was static**, sourced from `src/lib/mock-data.ts`
  (hardcoded transaction list, spending chart data, categories, KYC queue).
- **No Firebase integration** — package not installed, no config file.
- **No persistence layer of any kind.**
- `admin` route group (`src/app/(admin)/layout.tsx`) had **no access
  control at all** — any authenticated (fake-authenticated) user could
  reach admin screens by URL.
- `stitch-screens/` contains 10 standalone HTML mockups (dashboard, KYC,
  send-money, statements, etc.) — design references, not wired into the
  Next.js app.
- No `register` or `forgot-password` pages existed; the login page linked to
  a dead `#` anchor labeled "Sign up for Enterprise."

## 2. Work completed this phase (Phase 4: Firebase Authentication + Firestore foundation)

| Area | Status |
|---|---|
| Firebase SDK installed (`firebase` package) | ✅ |
| `src/lib/firebase.ts` — client init from env vars | ✅ |
| `.env.local` / `.env.example` | ✅ (`.env*` already in `.gitignore`) |
| `AuthContext.tsx` rewritten to real Firebase Auth (email/password, Google popup, `onAuthStateChanged`, password reset, logout) | ✅ |
| `src/lib/user-profile.ts` — Firestore `users/{uid}` profile, defaults every new account to `role: "customer"` | ✅ |
| `/login` page rewired to real auth (was phone+fake-JWT, now email+Firebase) | ✅ |
| `/register` page — did not exist, created | ✅ |
| `/forgot-password` page — did not exist, created | ✅ |
| `AdminProtectedRoute` — admin route group had zero guarding before; now redirects non-admins client-side | ✅ (client-side only — see caveat below) |
| `firestore.rules` (draft) — covers `users` collection, default-deny everything else | ✅ |
| `storage.rules` (draft) — private per-user KYC path, default-deny everything else | ✅ |
| `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` | ✅ |
| `npx tsc --noEmit` | ✅ passes, 0 errors |
| `npm run build` | ✅ succeeds, all 35 routes compile |
| Firebase config: hardcoded working defaults in `src/lib/firebase.ts`, env vars optional override | ✅ verified build succeeds with zero `.env.local` present |
| `/assistant` page: was calling a nonexistent backend (`/analytics/assistant/chat` against `NEXT_PUBLIC_API_URL`), threw `Failed to fetch` on every message | ✅ fixed — see below |

### AI Assistant: mock provider (Phase 4 addendum)

- **`src/lib/assistant/mock-assistant.ts`** — a rule-based keyword matcher,
  **not a real language model**. It scores the user's message against 14
  intents (balance, budget, spending summary, savings, utilities, transfer,
  airtime, bills, KYC, fees/limits, scheduled payments, help, greeting,
  thanks) and returns one of several pre-written responses per intent,
  templated with the user's first name where relevant. Unmatched messages
  fall back to a generic "I don't have an answer for that" response rather
  than a fabricated one.
- Verified by actually executing the matcher (not just reading the code)
  against 15 realistic phrasings — all 14 intents matched correctly, and
  the gibberish test case correctly fell through to the fallback.
- Implements an `AssistantProvider` interface so a real LLM integration
  (e.g. a genuine Claude/GPT API call) can be swapped in later without
  touching the chat UI — same pattern as the brief's
  `SandboxPaymentProvider` / `FutureMTNProvider` abstraction.
- **This must stay honestly documented as a mock in any submission
  materials.** Do not describe the Assistant feature as "AI-powered" in a
  way that implies a real model call — it's a scripted response engine, and
  CSCD602's academic-integrity requirement (§34 of the brief) applies here:
  don't fabricate what the system actually does.

### Explicit scope cut / honesty notes

- **`AdminProtectedRoute` is client-side only.** Per the brief's own
  requirement ("Authorization MUST be enforced server-side/security-rule-side
  and not merely by hiding frontend buttons"), this is **not sufficient on
  its own** — it's a UX redirect, not a security boundary. Real enforcement
  needs Firestore rules on every admin-only collection (auditLogs,
  adminActions, kycRecords review fields), which don't exist yet because
  those collections don't exist yet. Do not treat admin access as "secured"
  until that's built.
- **Wallets, transactions, bills, airtime, scheduled payments, KYC, and
  notifications are still exactly the mock stubs described in section 1.**
  Nothing in this phase touched them. The login/dashboard shell now sits on
  top of real auth, but the financial screens still read `mock-data.ts`.
- **Role promotion (customer → merchant/administrator) has no in-app UI.**
  This is intentional (see setup guide §9) — it's a manual Firestore Console
  edit until an audited admin-action mechanism is designed. Don't build a
  "make me admin" button.
- **App Check is not wired into the code.** Flagged in the setup guide as an
  open item, not silently marked done.
- **No automated tests were added this phase.** Verification here was
  `tsc --noEmit` + `next build` succeeding, which confirms the code compiles
  and type-checks — it does **not** confirm the auth flows work end-to-end
  in a real browser against your live Firebase project. That needs manual
  QA against the steps in `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` §10, or
  integration tests once a testing phase is scheduled.

## 4. Work completed this phase (Phase 5: Wallet ledger backend + avatar fix)

| Area | Status |
|---|---|
| `src/lib/firebase-admin.ts` — server-only Admin SDK init from env vars (never bundled client-side) | ✅ |
| `src/lib/server-auth.ts` — verifies Firebase ID token on every API request, never trusts a client-supplied uid | ✅ |
| `src/lib/wallet-ledger.ts` — atomic Firestore transactions for wallet balance; idempotency-key deduping | ✅ |
| `GET /api/wallet` — real Firestore-backed balance (was hardcoded JSON) | ✅ |
| `POST /api/wallet` (top-up) — real atomic ledger write (was a `// TODO` stub) | ✅ sandbox top-up only, clearly labeled as simulated, no real payment provider |
| `GET /api/wallet/transactions` — real ledger history (new route, didn't exist before) | ✅ |
| `src/lib/api.ts` rewritten — calls same-origin `/api/*` routes with a real Firebase ID token, replacing the old external-API + localStorage-JWT scheme | ✅ |
| `firestore.rules` extended — `wallets`/`walletTransactions`: client can read own docs, all writes denied (server-only via Admin SDK) | ✅ |
| `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` — service account key generation steps added (§10), composite index note added (§5a) | ✅ |
| `src/components/ui/Avatar.tsx` — shows Google profile photo when available (`user.avatarUrl`, populated by Firebase Auth on Google sign-in), falls back to a name-derived initials avatar otherwise | ✅ |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ succeeds, 36 routes compile, including new `/api/wallet/transactions` |

### Explicit scope cut / honesty notes

- **Withdrawal and transfer are NOT implemented this phase.** `wallet-ledger.ts` only exports `topupWallet` — `WalletTxType` is typed as `"topup"` only, deliberately, so it's obvious in the type system what's real. The wallet page's withdraw/transfer/link-account modals still call routes that don't exist and will fail — the page's existing `.catch()` handlers show an error rather than crashing, which is the honest behavior until those are built.
- **Wallet limits (`/wallet/limits`) and summary (`/wallet/summary`) endpoints don't exist yet.** Limits are stored on the wallet document (`TIER_1_LIMITS`) but not enforced against actual spend — a user could top up past their stated daily limit right now. Flagging this explicitly rather than letting it look enforced.
- **This was not tested end-to-end against a live Firestore project** — I don't have your service account credentials, by design (see §10 of the setup guide — that's a real secret I deliberately didn't ask you to paste into chat). Verification here is `tsc --noEmit` + `npm run build` succeeding, which confirms the code compiles/type-checks and that `firebase-admin.ts` doesn't throw at build time (it's lazy-initialized). It does **not** confirm the Firestore transaction logic behaves correctly against real data — that needs you to test it per §11 of the setup guide once your service account key is in `.env.local`.
- **Composite index required.** First real call to `GET /api/wallet/transactions` will fail until you click through the auto-generated "create index" link Firestore gives you — documented in the setup guide, not a bug.
- **Avatar component** only affects the logged-in user's own photo (`TopNav.tsx`). Mock recipient avatars in `send-money` and the dashboard's mock transaction feed were left untouched — those represent other people in demo data, not the current user.

## 6. Work completed this phase (Phase 6: peer-to-peer transfers, withdrawal, phone lookup)

| Area | Status |
|---|---|
| `src/lib/phone.ts` — Ghanaian phone normalization, tested against 7 real-world formats (spaced, dashed, +233, bare 233, missing leading 0) — all correctly normalize to the same value; garbage input correctly rejected | ✅ |
| `user-profile.ts` — stores `phoneNormalized` on every new profile; `register()` in AuthContext now actually saves the phone number it collects (previously silently discarded it — found and fixed as a pre-existing bug) | ✅ |
| `src/lib/server-user-lookup.ts` — server-side recipient lookup by phone, returns only `{uid, name, role}`, never email/wallet/other PII | ✅ |
| `wallet-ledger.ts`: `withdrawFromWallet` — atomic debit, insufficient-funds check | ✅ |
| `wallet-ledger.ts`: `transferBetweenWallets` — atomic sender-debit + recipient-credit in ONE transaction (never partially applies), self-transfer blocked, **server-side daily limit enforcement** (not just the UI check that already existed) | ✅ |
| `POST /api/wallet/withdraw` | ✅ |
| `POST /api/transactions/transfers` — real peer-to-peer transfer, recipient resolved server-side by phone (client can't forge a transfer to an arbitrary uid) | ✅ |
| `GET /api/user/lookup?phone=` — recipient verification for send-money's UI, auth-gated, minimal data exposure | ✅ |
| `GET /api/user/me` — combined profile+wallet+limits+dailySent, shaped for what `send-money/page.tsx` already expected | ✅ |
| Wallet page top-up/withdraw buttons — **found and fixed a pre-existing bug**: both silently did nothing because they required selecting a "linked account" that can never exist (no linked-accounts subsystem was ever built). No longer blocked on that. | ✅ |
| `npx tsc --noEmit` / `npm run build` | ✅ 0 errors, 40 routes compile |

### Explicit scope cut / honesty notes

- **Linked accounts subsystem still doesn't exist.** The wallet page's "Transfer" modal (internal transfer between your *own* linked accounts, conceptually different from peer-to-peer send-money) still posts to a route that was never built (`/api/wallet/transfer`) and will fail. So will "Link new account." These are separate from the real transfer feature built this phase (`/api/transactions/transfers`, used by the send-money page) — don't conflate the two when testing.
- **`GET /api/wallet`'s response shape is intentionally minimal** (`uid, balance, currency, tier, limits, timestamps`) and does not match every field the original `WalletData` type declared (`linkedAccounts`, `dailySent`, `weeklySent`, etc. aren't populated). Code that reads those specific fields will see `undefined`/empty-array fallbacks, not a crash — but don't assume the wallet page's every stat is real yet.
- **Daily limit enforcement only covers transfers so far**, not top-up or withdrawal (top-up/withdrawal have a flat sandbox cap instead — see `wallet-ledger.ts`). Weekly/monthly limits are stored but still not checked anywhere.
- **None of this was tested against a live Firestore project** — same caveat as Phase 5: verification is `tsc --noEmit` + `npm run build` succeeding, plus the phone-normalization logic actually executed and verified against 7 real formats (that part doesn't need Firestore, so it could be run for real). The transfer/withdraw Firestore transaction logic itself has NOT been executed against real data — that needs your service account key in place.

## 8. Work completed this phase (Phase 7: bills + airtime, real wallet debits)

| Area | Status |
|---|---|
| `wallet-ledger.ts`: `payForSandboxService()` — shared atomic-debit function for both bills and airtime, insufficient-funds check, idempotency support | ✅ |
| `POST /api/bills/validate` — sandbox account verification (deterministic name from account number, not random — verified same input always returns same output) | ✅ labeled sandbox, no real biller API exists to integrate with |
| `POST /api/bills/pay` — real atomic wallet debit | ✅ |
| `GET /api/bills/history` — real Firestore query (was reading from `mock-data.ts` before) | ✅ |
| `POST /api/airtime` — real atomic wallet debit, phone validated via `src/lib/phone.ts` | ✅ |
| `npx tsc --noEmit` / `npm run build` | ✅ 0 errors, 44 routes compile |

### Explicit scope cut / honesty notes

- **No real biller or telco integration exists or is claimed.** `/api/bills/validate` fabricates a plausible account name deterministically from the account number — it is not looking up a real ECG/GWCL/DStv account. `/api/bills/pay` and `/api/airtime` only make the *wallet debit* real; "delivering" the bill payment or airtime to the provider is not simulated beyond that. This must stay explicitly labeled as sandbox in any submission materials — do not describe bill/airtime payments as verified against real providers.
- **All four wallet-debiting flows now share one code path** (`payForSandboxService` for bills/airtime, plus the separate `withdrawFromWallet` and `transferBetweenWallets` for those cases) — same insufficient-funds guard, same idempotency pattern, same ledger shape. This consistency matters for the eventual `SECURITY_TEST_REPORT.md`: one set of tests against the shared logic covers all four flows' core money-safety guarantees.
- **Not tested against a live Firestore project** — same standing caveat as every phase since Phase 5. Verified: `tsc --noEmit`, `npm run build`, and the deterministic-hash logic actually executed with repeated inputs confirming it's stable.

## 10. Work completed this phase (Phase 8: real KYC document upload + review)

| Area | Status |
|---|---|
| `src/lib/kyc-upload.ts` — client uploads directly to Firebase Storage (`kyc/{uid}/{step}.{ext}`), enforced by `storage.rules` | ✅ |
| **Privacy-critical design choice**: never calls `getDownloadURL()` — that generates a token-based link that bypasses Storage rules for anyone holding it, which would violate "KYC documents MUST NOT be publicly accessible." Only the storage *path* is stored. | ✅ |
| `src/lib/kyc-record.ts` — Firestore record per user, 3 required document steps (`ghanaCard`, `selfie`, `addressProof`); overall status auto-computed; approve/reject only via admin-role-gated server code | ✅ |
| `GET /api/kyc/status` — real record (was hardcoded `tier: 2, status: "verified"` fake data before, for every single user regardless of who they were) | ✅ |
| `POST /api/kyc/document` — records a real submission after real upload; validates the storage path actually belongs to the caller's own uid | ✅ |
| `GET /api/kyc?admin=true` — real Firestore queue of pending reviews (was `KYC_QUEUE` from `mock-data.ts` before) | ✅ |
| `PATCH /api/kyc` — real admin approve/reject; approval bumps the user's Firestore `tier` to 3 | ✅ |
| `GET /api/kyc/document-url` — admin-only, generates a 5-minute signed URL to view one document; never a permanent link | ✅ |
| KYC page (`/kyc`) rewired with a real `<input type="file">` and upload flow, replacing a button that previously called `api.post('/kyc/document', { url: 'mock-url' })` — i.e. it wasn't uploading anything at all before | ✅ |
| `firestore.rules` extended for `kycRecords` — read own or admin, all writes denied (server-only, same pattern as `wallets`) | ✅ |
| Removed a fabricated claim from the KYC page UI ("reviewed securely by our compliance team" — no such team exists, it's the admin approve/reject flow) | ✅ |
| `npx tsc --noEmit` / `npm run build` | ✅ 0 errors, 47 routes compile |

### Explicit scope cut / honesty notes

- **The admin KYC page (`/admin/kyc`) is still NOT wired to any of this.** It's pure local React state over `mock-data.ts`'s `KYC_QUEUE` — approve/reject buttons there don't call `PATCH /api/kyc` yet, don't persist anything, and reset on refresh. The backend for it is real and ready (this phase built it); the admin UI itself needs to be rewired next to actually call it. Don't assume the admin review flow works end-to-end yet — only the user-facing upload side does.
- **"Bank Verification" (the 4th step shown in the KYC page UI) is not wired and is explicitly excluded from what's required for approval.** It needs the linked-accounts subsystem, which doesn't exist (flagged since Phase 6). The button for that step is disabled with a "Coming soon" label rather than silently doing nothing.
- **No real document verification (OCR, face match, liveness detection, etc.) exists or is claimed.** Approval is a manual admin decision. If the original brief's mention of "AI verification" comes up in grading, that was never real even in the original mock (`// TODO: Process document upload, run AI verification`) — it's not something this phase removed, just never claimed as done.
- **Re-uploading a document after rejection correctly resets status to `pending_review`**, not back to `approved`/`rejected` — verified by reading the logic in `kyc-record.ts`, not run against live data (same standing caveat as every Firestore-dependent phase — needs your service account key in place to actually test).

## 12. Work completed this phase (Phase 9: admin KYC page rewired to real backend)

| Area | Status |
|---|---|
| `src/lib/kyc-record.ts` — `KycRecord` now denormalizes `name`/`phone` from the user profile at creation, so the admin queue doesn't need per-row lookups | ✅ |
| `listKycRecords(status?)` replaces the old `listPendingKycRecords()` — admin page can now filter by any status, not just pending | ✅ |
| `GET /api/kyc?admin=true&status=` — supports the status filter | ✅ |
| `src/lib/api.ts` — added a `patch()` method (was missing entirely; the admin page's approve/reject needed it and there was no clean way to call a PATCH route before) | ✅ |
| `/admin/kyc` page — **fully rewritten**, real data from Firestore, real approve/reject via `PATCH /api/kyc`, real document viewing via signed URLs (`GET /api/kyc/document-url`) | ✅ |
| **Removed fabricated "AI verification" UI**: the old page showed a `docScore`/`faceScore`/"Liveness Detection: PASS"/"AI RECOMMENDATION: APPROVE" panel — none of this was ever real (the original mock API had `// TODO: run AI verification`). Replaced with an honest per-document "submitted / not submitted" view and a manual approve/reject decision, which is what actually happens. | ✅ |
| `npx tsc --noEmit` / `npm run build` | ✅ 0 errors, 47 routes compile (same route count as Phase 8 — this phase only touched existing routes/UI, no new endpoints) |

### Explicit scope cut / honesty notes

- **This closes the loop flagged at the end of Phase 8** — the admin KYC review flow is now real end-to-end: upload (Phase 8) → admin queue → view document via signed URL → approve/reject → tier bump, all backed by Firestore.
- **Still no real document-authenticity or face-match verification exists anywhere in the system.** This phase removed the fabricated UI that implied it existed; it did not add real verification. If asked in grading whether AI verification is implemented, the honest answer is no — review is manual.
- **Not tested against a live Firestore project or live Storage bucket** — same standing caveat as every phase since Phase 5.

## 14. Work completed this phase (Phase 10: linked accounts, notifications, scheduled payments — closing out the feature list)

### Linked accounts
| Area | Status |
|---|---|
| `src/lib/linked-accounts.ts` — sandbox linking (no real bank/MoMo verification exists — clearly documented as sandbox, same framing as the payment provider abstraction) | ✅ |
| `POST /api/wallet/link-account`, `DELETE /api/wallet/linked-accounts/[id]`, `PUT .../set-default` | ✅ atomic default-account handling (only one account can be default at a time) |
| `GET /api/wallet` now returns real `linkedAccounts` (was always an empty array before) | ✅ |
| `POST /api/wallet/transfer` — wallet page's "Transfer" modal, now real. **Honesty note**: this is bookkeeping-equivalent to a withdrawal — there's no real linked-account credit or second GhanaPay wallet involved, so it reuses `withdrawFromWallet` under the hood with a note identifying the destination. Documented as such in the code, not disguised as a distinct money movement. | ✅ |

### Notifications
| Area | Status |
|---|---|
| `src/lib/notifications.ts` — create/list/count-unread/mark-read/mark-all-read | ✅ |
| `GET /api/notifications`, `PATCH /api/notifications/[id]/read`, `POST /api/notifications/read-all` | ✅ |
| Real notifications fire on: top-up, withdrawal, transfer (both sender and recipient get one), bill payment, airtime purchase, KYC approval/rejection | ✅ fired **after** the triggering Firestore transaction commits, never inside it — transactions retry on contention, so notifying from inside one would risk duplicates |
| `NotificationBell.tsx` — real dropdown in TopNav, replacing a static bell icon with a hardcoded red dot that meant nothing | ✅ polls every 30s (no real-time channel exists — documented as polling, not disguised as push) |

### Scheduled payments
| Area | Status |
|---|---|
| `src/lib/scheduled-payments.ts` — full CRUD + `runDueScheduledPayments()` execution engine | ✅ |
| `POST/GET /api/scheduled`, `PUT/DELETE /api/scheduled/[id]` | ✅ |
| `POST /api/scheduled/run` — the execution endpoint, protected by a shared secret (`SCHEDULED_PAYMENTS_CRON_SECRET`) rather than per-user auth, since it processes many users' payments in one call | ✅ |
| `netlify/functions/run-scheduled-payments.mts` — the actual cron trigger. **This is the piece that makes "browser doesn't need to stay open" true** — a route existing isn't enough; something has to call it on a timer independent of any open tab. | ✅ |
| `docs/16_NETLIFY_DEPLOYMENT_GUIDE.md` — created (didn't exist before, despite being referenced). Includes a pricing-accuracy correction I made after searching current Netlify docs rather than asserting stale info: Netlify moved to credit-based pricing in 2025/2026, so Scheduled Functions run on the free tier but consume credits — my first draft incorrectly claimed a paid-plan requirement, caught and fixed before shipping. | ✅ |
| **Found and fixed a real date-arithmetic bug** during testing: naive `Date.setMonth(+1)` overflows for month-end dates (Jan 31 + 1 month silently became March 3rd, skipping into a wrong month, because February doesn't have 31 days). Fixed to clamp to the last valid day of the target month; verified against 5 edge cases including leap-day and year-rollover, not just the happy path. | ✅ |

### Explicit scope cut / honesty notes (read before assuming any of this "just works")

- **None of this was tested against a live Firestore project or a live Netlify deployment** — same standing caveat as every backend phase since Phase 5. What I could verify without your credentials, I did: the date-arithmetic logic was actually executed and checked against edge cases (not just read), and the Netlify pricing claim was checked against a live search rather than asserted from memory.
- **Scheduled payments only support `transfer`, `bill`, and `airtime` types** — matches what `payForSandboxService`/`transferBetweenWallets` already support. A scheduled transfer to a phone number that isn't a registered GhanaPay user will fail at execution time (recorded as `lastRunStatus: "failed"`, not silently dropped).
- **A failed scheduled payment still advances to its next occurrence** rather than retrying immediately — this avoids a cron hammering a wallet with repeated failed attempts every 15 minutes, but it does mean a payment that fails once (e.g., temporary insufficient balance) won't retry until its next natural interval (could be a day, a week, etc.). This is a deliberate simplicity trade-off, not an oversight — flagged here so it's a known behavior, not a surprise.
- **The Netlify Scheduled Function requires deployment-side setup you have to actually do** — env vars set in Netlify's dashboard, and (per the corrected pricing note) awareness of credit consumption. This code being present in the repo does not mean scheduled payments are running anywhere yet.
- **Linked account "verification" is entirely fake** (`isVerified: true` is set immediately, unconditionally) — there's no real bank/MoMo API to check against. This matches the same sandbox framing used everywhere else in the project.

## 15. What's now fully wired vs. what remains

**Fully real, backend-verified-by-typecheck-and-build, end-to-end from UI through Firestore**: authentication (email/password + Google), wallet balance, top-up, withdrawal, peer-to-peer transfer, bill payment, airtime purchase, linked accounts, KYC document upload + admin review, notifications, scheduled payment CRUD.

**Still genuinely mock, clearly labeled as such throughout**: the AI Assistant chat (rule-based, not a real model), bill/biller verification (deterministic fake name, no real biller API), payment "delivery" beyond the wallet debit itself (no real telco/bank rails exist to integrate with — this is explicitly the sandbox pattern the original brief specified).

**Never built, not claimed as built**: real document-authenticity/face-match verification for KYC (manual admin review only), real bank/MoMo account verification for linked accounts, fraud detection (the `/admin/fraud` page still needs auditing — not touched in any phase so far), analytics beyond what's already in `mock-data.ts` (the `/analytics` and `/admin/reports` pages haven't been touched either).

## 17. Work completed this phase (Phase 11: admin users + admin transactions — real data)

| Area | Status |
|---|---|
| `src/lib/admin-users.ts` — real user directory: Firestore profiles + real Firebase Auth account status (`disabled`) + batch-fetched wallet balances | ✅ |
| `src/lib/admin-transactions.ts` — real cross-user transaction ledger, enriched with owner names | ✅ |
| `GET /api/admin/users`, `PATCH /api/admin/users/[id]/disable` — real suspend/reactivate, actually calls Firebase Auth's `updateUser({disabled})`, which genuinely blocks sign-in (not a cosmetic flag) | ✅ |
| `GET /api/admin/transactions?type=` | ✅ |
| `/admin/users` page — **fully rewritten**. Was 8 hardcoded fake people plus fabricated headline stats ("48,291 total users", "39,814 active" — numbers with zero connection to anything). Now real data, real counts. Dropped `location` and `txCount` fields (never tracked anywhere real) and the "Pending" status filter (no real concept behind it — account status is just enabled/disabled via Firebase Auth). | ✅ |
| `/admin/transactions` page — **fully rewritten**. Was reading `TRANSACTIONS` from `mock-data.ts`. Now real ledger data across all users. Dropped the `method` column ("Mobile Money", "Bank Transfer" — never tracked), replaced with the transaction's real `note` field. | ✅ |
| `npx tsc --noEmit` / `npm run build` | ✅ 0 errors, 56 routes compile |

### Explicit scope cut / honesty notes

- **`/admin/fraud` was deliberately left untouched.** It's still the original fabricated fraud-alert mock. This is consistent with your brief, not a gap — §26 of your own brief lists "fraud detection, anomaly detection" explicitly under *future enhancements*, to be "clearly marked as future work unless actually implemented." Building real fraud detection is a genuinely different, much larger project (pattern analysis, risk scoring models) — flagging it as intentionally out of scope rather than pretending it's a quick add.
- **`/admin/reports`, `/analytics`, `/statements`, `/bulk-payments` are still untouched mock/stub pages.** Not audited in this phase either — don't assume anything about their state without checking.
- **CSV export on both admin pages is real** (exports whatever's currently filtered/loaded, not hardcoded rows) — this was already functional in the original code structure, just needed the underlying data source swapped.
- **Not tested against a live Firestore/Firebase Auth project** — same standing caveat as every backend phase. The `adminAuth().getUsers()` batch call and `updateUser({disabled})` are correct per the Admin SDK's documented API, but unexecuted against real data.

## 19. Work completed this phase (Phase 12: dashboard/detail-page consistency)

You reported the main `/admin` dashboard's numbers not matching what you saw clicking through to the detail pages. Root cause traced and fixed:

| Area | Status |
|---|---|
| **Root cause found**: `/admin` called `GET /api/admin/overview`, which never existed. It failed silently (`.catch(() => setLoading(false))`), so every KPI showed `"..."` forever while `/admin/kyc` and `/admin/transactions` (real, since Phase 9/11) showed actual data — hence the mismatch you saw. | ✅ diagnosed |
| `src/lib/admin-overview.ts` + `GET /api/admin/overview` — real aggregation from the SAME collections `/admin/users`, `/admin/transactions`, `/admin/kyc` already query. Numbers can't drift from the detail pages because they're computed from the same source, not a separately maintained figure. | ✅ |
| **Found and fixed a real bug** in the aggregation logic itself while building it: the pending-KYC preview query was capped at 5 for display purposes, but the same capped result was almost reused as the "total pending" KPI count — meaning the dashboard would have silently shown "5" even if there were actually 40 pending reviews. Fixed with a separate `count()` aggregate query for the true total. | ✅ |
| **Fraud data**: there's no real detection (confirmed again — future work per brief §26), so instead of a fake API response, both `/admin` and `/admin/fraud` now import the exact same static array (`src/lib/demo-fraud-data.ts`) directly. This is the "matching dummy data" you asked for — one shared source, so the High/Medium-Risk counts on the dashboard and the full list on `/admin/fraud` can never disagree with each other, even though neither reflects live detection. Added a visible on-page disclaimer to both, not just a code comment. | ✅ |
| **Removed dead code**: a WebSocket connection attempt to `ws://localhost:3001/ws` using a `ghana_pay_access` localStorage token from the auth scheme removed back in Phase 4 — never connected to anything, pure leftover. | ✅ |
| **Fixed the dashboard's inline KYC approve/reject buttons** — were calling `/admin/kyc/{id}/approve` and `/admin/kyc/{id}/reject`, routes that never existed (different from the real `PATCH /api/kyc` built in Phase 9). Now call the real endpoint with the correct body shape. | ✅ |
| **Removed fabricated `docScore`/`faceScore` from the dashboard's KYC preview table** — same fake "AI verification" pattern already removed from the full `/admin/kyc` page in Phase 9, but this smaller preview table on the main dashboard had its own separate copy that got missed at the time. Replaced with a real "X / 3 submitted" count. | ✅ |
| **Replaced the fabricated "System Health" panel** (99.98% API Uptime, 12ms DB Latency, "SMS Gateway: OK — Hubtel", "MoMo Webhook: OK — MTN & Vodafone live", "Fraud Engine ACTIVE v2.4" — all entirely invented, no real monitoring exists) with a "Platform Snapshot" panel showing real derived numbers instead. | ✅ |
| **Found and fixed another bug** while touching this file: the fraud alert list called `new Date(alert.time).toLocaleTimeString()`, but `alert.time` is a relative string like `"14 mins ago"` — `new Date("14 mins ago")` is `Invalid Date`. Now renders the string directly. | ✅ |
| `npx tsc --noEmit` / `npm run build` | ✅ 0 errors, 57 routes compile |

### Explicit scope cut / honesty notes

- **The 7-day volume trend chart reads up to 500 recent transactions** to build its daily buckets — a reasonable cap for a sandbox app, but if the platform ever has meaningfully more than 500 transactions in a week, the oldest ones in that window would be excluded from the trend. Flagged as a known limitation of the current aggregation approach, not something to assume scales indefinitely.
- **"Active Accounts" on the dashboard just means "not disabled" in Firebase Auth** — there's no real login-activity or engagement tracking behind it.
- **Not tested against a live Firestore project** — same standing caveat as every backend phase. The aggregation queries are structurally correct per Firestore's documented API (including the `count()` aggregate, which needed correcting once already during this same phase), but unexecuted against real data.

## 21. Work completed this phase (Phase 13: real statements + sidebar badge consistency)

You reported the sidebar's "47" KYC badge not matching the actual (empty) KYC queue, plus asked to continue building.

| Area | Status |
|---|---|
| `src/components/layout/Sidebar.tsx` — KYC Queue badge was a hardcoded `"47"` with zero connection to real data. Now fetches the same `/api/kyc?admin=true&status=pending_review` count the KYC Queue page itself shows, and simply doesn't render if the count is 0 (matches what you saw). Fraud Alerts badge now computed from the same shared `demo-fraud-data.ts` array the dashboard and fraud page already use, instead of a separate hardcoded `"3"`. | ✅ |
| `src/lib/server-auth.ts` — **fixed a real debugging gap**: `requireAuth()`'s token-verification catch block was silently swallowing the actual error, so "Invalid or expired token" gave zero diagnostic information. Now logs the real underlying reason server-side (project-ID mismatch, malformed private key, actually-expired token, etc.) while still only showing the generic message to the client. | ✅ |
| `src/lib/statements.ts` + `GET /api/statements` — real monthly statements, reconstructed by replaying a user's full transaction history in order and tracking a running balance. **Verified the running-balance math against a hand-computed 2-month scenario before trusting it** — matched exactly (opening carries forward correctly month to month, fees factored into debits). | ✅ |
| `/statements` page — **fully rewritten**. Was 6 hardcoded months (Jan–Jun 2026) with fabricated opening/closing balances that had zero connection to any real data, plus a transaction list that showed the SAME global mock array regardless of which month was "selected" (never actually filtered). Now real, per-month, computed from the actual ledger. | ✅ |
| **Removed a false claim**: the original page stated "PDF statements are bank-certified" — there is no certification of any kind anywhere in this project. Removed entirely, along with a fabricated fixed account number (`GHP-2026-00182`) that didn't correspond to anything, replaced with one derived from the real user's uid. | ✅ |
| **PDF button now does something real**: wired to `window.print()` with print-specific CSS (`print:hidden` on non-statement UI chrome) — a genuine "save as PDF" mechanism via the browser's native print dialog, not a fabricated download. Explicitly not claimed as an official or certified document. | ✅ |
| **CSV export is real** — same pattern as the admin transactions page, exports the actual displayed month's real transactions. | ✅ |
| **"Email Statement" button** — no email-sending capability exists anywhere in this project (never has). Rather than leave it as a decorative no-op button (misleading) or silently remove it, made it visibly disabled with a "coming soon" label and tooltip explaining why. | ✅ |
| `npx tsc --noEmit` / `npm run build` | ✅ 0 errors, 62 routes compile |

### Explicit scope cut / honesty notes

- **Statement history is capped at 2000 transactions** (a generous limit for a sandbox account) when reconstructing the running balance — flagged the same way the 7-day volume trend's 500-transaction cap was flagged in Phase 12, for the same reason.
- **The running-balance math was verified against a hand-built scenario, not against live Firestore data** — same standing caveat as every backend phase since Phase 5.
- **"Print / Save as PDF" produces whatever the browser's print dialog produces** — it is not a custom-designed PDF template, and definitely not a "bank-certified" document. If a polished branded PDF is wanted later, that would need real server-side PDF generation (a library like `pdfkit`, or the project's own PDF skill if generating one-off documents outside the live app), which hasn't been built.

## 23. Work completed this phase (Phase 14: analytics, admin reports, bulk-payments audit)

Completed auditing every page flagged as "unverified" since Phase 8. Nothing left unaudited now.

### Analytics — real data, honest scope
| Area | Status |
|---|---|
| **Found and fixed a real bug**: merchant detection used `user.phone.length <= 6` — a nonsensical heuristic with no relationship to anything. Replaced with the real `user.role === 'merchant'` field, which has existed since Phase 4 but was never actually used for this. | ✅ |
| `src/lib/analytics.ts` + 8 new routes (`summary`, `weekly`, `categories`, `payment-methods`, `savings-goals`, and 3 merchant equivalents) — real aggregation from actual wallet transactions, current calendar month | ✅ |
| **"Categories" are honestly the real transaction types** (Bills, Airtime, Transfers Sent, etc.) — this project never tracks what a bill was actually FOR, so granular categories like "Food/Shopping/Entertainment" would have been invented. Didn't fabricate them. | ✅ |
| **"Payment methods" honestly reports the one real funding source** (GhanaPay Wallet balance) instead of a fabricated breakdown across card/bank/momo — none of that is tracked per-transaction anywhere. | ✅ |
| **Savings goals: no such feature exists anywhere in the project** (no collection, no create/contribute flow). Returns empty rather than fake goal data; UI shows an honest "not implemented" banner; the "Create New Goal" button — previously a fully decorative dead click target — is now visibly disabled. | ✅ |
| Merchant "sales" honestly mapped to real `transfer_in` transactions received — not fabricated, a direct real mapping (a merchant's sale IS a transfer they receive in this system). | ✅ |

### Admin Reports — the most serious fabrication found in the whole audit
| Area | Status |
|---|---|
| **Found real integrity issues, not just missing features**: invented named admins ("Esi Amankwah," "Kofi Admin," "System Auto") credited with generating specific reports at specific times — none of it ever happened. Fake file sizes ("2.4 MB," "890 KB"). A "Generate" button that spun for 2 seconds via `setTimeout` and produced nothing. | ✅ found and removed |
| **Transaction Summary is now a real, working report** — generates an actual CSV from real `/api/admin/transactions` data, filtered by the admin's selected date range. Verified via typecheck + build. | ✅ |
| The other 5 report types (User Growth, KYC Compliance, Fraud & Risk, Revenue & Fees, Regulatory Filing) are clearly labeled "Not implemented" with disabled Generate buttons — shown to illustrate the intended catalog, not faked as functional. | ✅ |
| The fabricated "Recent Generation Activity" log (with the invented admin names) was removed entirely, not just visually softened — there's no real report-generation history tracked anywhere in this project to show instead. | ✅ |
| **Self-caught bug during this fix**: a `str_replace` edit left orphaned duplicate code behind mid-file (old report definitions and old `handleGenerate` still present alongside the new versions). Caught by re-reading the file before moving on, not left for you to discover via a broken build. | ✅ |

### Bulk Payments — honestly flagged, not built
| Area | Status |
|---|---|
| **Deliberately NOT built this phase.** A real bulk-payment engine needs CSV parsing, per-row recipient phone validation, and batch atomic transfers with partial-failure handling (what happens when row 47 of 200 fails?) — that's substantial new engineering, not a quick wire-up like the other pages this session. | Scoped out, documented |
| Added a clear on-page banner explaining exactly what's missing; disabled the "Confirm & Send" button (previously enabled after a fake "upload" that never read a real file); the drag-and-drop zone still shows the same hardcoded 5-person sample list regardless of what's "dropped" — that's now explicitly labeled as illustration only. | ✅ |
| `npx tsc --noEmit` / `npm run build` | ✅ 0 errors, 66 routes compile |

### Explicit scope cut / honesty notes
- **Every page flagged as "unverified" since Phase 8 has now been audited.** `/analytics`, `/admin/reports`, `/bulk-payments` — done. `/admin/fraud` remains intentionally mock (documented since Phase 9, matches brief §26). Nothing in the app should have any remaining undiscovered fabricated data at this point — though genuine bugs in the real implementations are still possible and haven't been tested live.
- **Not tested against a live Firestore project** — same standing caveat as every backend phase since Phase 5.

## 24. What's now fully real vs. what remains honestly unbuilt

**Fully real**: auth, wallet (topup/withdraw/transfer/bills/airtime), linked accounts, KYC (upload + admin review), notifications, scheduled payments, admin users/transactions/overview, statements, analytics.

**Honestly labeled as not implemented, nothing hidden**: AI Assistant (rule-based, not a real model), bill/biller verification (no real biller API exists), fraud detection (explicitly future work per brief §26), bulk payments (flagged this phase), the 5 non-Transaction-Summary admin reports, savings goals, linked-account "verification" (sandbox only), email statement delivery.

## 26. Work completed this phase (Phase 15: real automated test suite)

Your brief's §18 explicitly requires unit testing of "validation, transaction calculations, fee calculations, utility functions" — this was the largest structural gap flagged since Phase 8. Addressed with a genuine, runnable test suite rather than a claim of "tests passed" without evidence.

| Area | Status |
|---|---|
| Jest + ts-jest installed and configured (`jest.config.js`) | ✅ |
| **Refactored `statements.ts` and `scheduled-payments.ts`** to separate pure computation from Firestore I/O — `statements-core.ts` and `schedule-dates.ts` now contain zero Firebase imports, which is what makes them unit-testable at all without mocking the Admin SDK | ✅ |
| `src/lib/phone.test.ts` — 12 tests, phone normalization/validation | ✅ |
| `src/lib/schedule-dates.test.ts` — 9 tests, including a **named regression test** for the real Jan-31-overflow bug found and fixed during Phase 10's manual verification, plus a 12-month repeated-advancement stress test | ✅ |
| `src/lib/statements-core.test.ts` — 8 tests, including a floating-point-drift check (`10.1 + 10.2` in raw JS is `20.299999999999997`, not `20.3` — verified the rounding logic actually prevents that from leaking into a balance) | ✅ |
| `npm test` — **actually run**: 3 suites, 29 tests, all passing | ✅ |
| `npm run build` re-verified after the refactor — confirms the extraction didn't change any real behavior | ✅ |
| `docs/09_Testing_Report.md` — honest accounting of coverage | ✅ |

### Explicit scope cut / honesty notes — read this before citing "tests" anywhere

- **This suite covers pure computation only.** Nothing here touches a live Firestore project. The wallet ledger's atomicity, idempotency deduplication, Firestore Security Rules, Firebase Auth flows, and every API route's actual HTTP behavior remain UNTESTED by any automated, repeatable suite. `docs/09_Testing_Report.md` lists this explicitly — don't describe this project as having "integration test coverage" or "security test coverage" anywhere, including in submission documentation. It doesn't yet.
- **The honest next step for real integration testing is the Firebase Local Emulator Suite** (`firebase emulators:start`) — not set up in this project. That would allow testing the wallet ledger's atomicity and Firestore rules for real, locally, without touching production data or a live project.
- Test coverage exists specifically for logic that had **already shown itself capable of hiding a real bug** (the date-overflow issue) — this is a deliberate choice: test the code that's actually complex/error-prone, not just whatever's easiest to test.

## 27. Suggested next phases

1. **Firebase Local Emulator Suite setup** — the highest-value next testing step, would unlock real integration tests for the wallet ledger.
2. **Manual end-to-end testing against your live Firebase project** — still not done, still the biggest overall gap after all 15 phases of backend work.
3. **Security documentation** — `SECURITY_ARCHITECTURE.md` and `SECURITY_TEST_REPORT.md` still don't exist; the latter especially would benefit from the emulator setup above.

## 28. Work completed this phase (Phase 16: security audit + documentation)

Set out to enable the Firebase Local Emulator Suite for real integration/rules testing. Confirmed it's genuinely blocked in this sandbox (network allowlist rejects `storage.googleapis.com` — verified with an actual failed download, not assumed), so pivoted to what could be done here: a systematic security audit of every API route, which surfaced real bugs beyond what documentation alone would have found.

| Area | Status |
|---|---|
| `firebase.json` + `npm run emulators` / `npm run test:rules` scripts — ready for you to run locally where the network isn't sandboxed | ✅ |
| `tests/rules/firestore-rules.test.ts` — real Firestore Security Rules tests using `@firebase/rules-unit-testing`, type-checks correctly against the real library, **written but not executed here** (honestly labeled as such in the file itself and in the test report) | ✅ |
| **Full audit of every API route for `requireAuth()` presence** — first time this was done systematically rather than per-feature | ✅ |
| **Found: `GET /api/transactions` had NO authentication**, returned hardcoded mock data to any caller, and `/history`/`/dashboard` were still actually using it | ✅ fixed |
| **Found: `POST /api/users/update` never existed** — Settings has been calling it since Phase 4; every profile save has silently failed this whole time | ✅ built for real |
| **Found: the History page's transaction mapping expected a third, entirely fictional data shape** (`t.sender.user`, `t.recipientWallet.user`, `t.metadata.note`) that never matched anything real or even the old mock data — always showed "Unknown User," always labeled everything "Sent"/"Received" regardless of actual type, silently fell back to fake data on any fetch error | ✅ fixed, real fields, honest error state instead of silent fake fallback |
| **Found: the `phone.length <= 6` merchant-detection bug had a second independent copy** on the Dashboard page (fixed once already on Analytics in Phase 14) | ✅ fixed |
| **Deleted 5 dead/orphaned routes**: `/api/auth/login`, `/session`, `/logout` (pre-Phase-4 leftovers referencing a nonexistent backend) and unauthenticated root `/api/bills`, `/api/users` (superseded duplicates still serving fabricated data to anyone) | ✅ |
| Dashboard's recent-transaction widgets (both merchant and customer views) — fixed to use real field names and correct credit/debit sign logic instead of assuming everything is a positive credit | ✅ |
| History page — real CSV export added (was decorative, no handler) | ✅ |
| Settings page — email field honestly disabled (Firebase email changes need re-authentication, a separate flow not built) instead of silently accepting a value that was never saved | ✅ |
| `npm audit` run for real: **15 → 12 vulnerabilities** via the non-breaking `npm audit fix` (deliberately did NOT run `--force`, which would bump Next.js outside its stated range and firebase-tools to a breaking major version, without your sign-off) | ✅ |
| `docs/12_Security_Architecture.md` — real architecture description, includes this phase's findings | ✅ |
| `docs/SECURITY_TEST_REPORT.md` — honest accounting distinguishing automated-and-executed vs. written-but-unexecuted vs. manual-code-review-only vs. never-tested-at-all | ✅ |
| `npx tsc --noEmit` / `npm run build` / `npm test` all re-verified after every change in this phase | ✅ 0 errors, 63 routes, 29/29 tests passing |

### Explicit scope cut / honesty notes

- **12 dependency vulnerabilities remain unresolved**, mostly in `firebase-tools`'s own dependency chain (a dev-only addition this phase, not shipped in the deployed app). No decision has been made about `npm audit fix --force` — that's a real risk/breaking-change trade-off that needs your call, not mine.
- **The rules tests are unexecuted.** Type-checking correctly against the real library is not the same as passing. Run `npm run test:rules` yourself on a machine with normal network access before trusting the security properties they claim to verify.
- **This audit pass is not automated or repeatable.** A new API route added later without `requireAuth()` would not be automatically caught — `docs/SECURITY_TEST_REPORT.md` §3 explicitly flags this as worth turning into a real lint rule or test rather than relying on another manual pass.
- **The kind of bugs found this phase** (a route Settings depended on that never existed; a page reading fields that were never real) are the sort that accumulate silently across many incremental feature phases without a dedicated audit — this is worth repeating periodically, not treated as a one-time fix.

## 30. Work completed this phase (Phase 17: required documentation package)

Produced 8 new documents from the original brief's 26-document list, prioritizing the highest-value/most commonly graded ones, all grounded in what's actually built rather than aspirational.

| Doc | Content |
|---|---|
| `01_Project_Documentation.md` | Overview, stakeholder analysis, document index (honestly lists what's NOT produced too) |
| `02_SRS.md` | 40+ functional requirements (FR-xxx) and 9 non-functional requirements, each tagged ✅/⚠️/🔲 by real status |
| `05_Architecture.md` | 5 real Mermaid diagrams (high-level architecture, auth flow, transfer sequence, KYC workflow, deployment) reflecting actual implementation |
| `06_Database_Design.md` | ER diagram, all 7 real Firestore collections documented with actual fields/access patterns/index requirements |
| `10_User_Manual.md` | Non-technical end-user guide, upfront about sandbox limitations |
| `17_API_Documentation.md` | All 37 real API routes documented, plus the 5 deliberately-deleted dead routes noted |
| `19_Requirements_Traceability_Matrix.md` | Every FR/NFR linked to design/implementation/test/status |
| `21_Defect_Log.md` | **12 real defects** with reproduction steps, root cause, and verification — pulled from the actual development history across all 16 prior phases, not invented for this document |
| `22_Risk_Register.md` | 12 real, project-specific risks (not a generic template) with actual probability/impact scoring |
| `24_Individual_Contribution_Report.md` | Template with explicit `TO BE COMPLETED BY STUDENT` placeholders — per the brief's own instruction not to fabricate personal contribution |
| `25_References.md` | Real technical documentation sources actually used |
| `26_README.md` | Examiner-friendly overview, explicit "Known Limitations" section |

### Explicit scope cut / honesty notes

- **10 documents from the original 26-item list are still not produced**: `03_System_Analysis.md`, `04_System_Design.md`, `07_UI_UX_Design.md`, `08_Implementation_Report.md`, `11_System_Administration_Guide.md`, `13_Maintenance_and_Future_Evolution.md`, `18_Database_Security_Rules.md` (content exists inline elsewhere but not as a standalone doc), `20_Test_Cases.md`, `23_Change_Log.md`. This is listed explicitly in `01_Project_Documentation.md` §5 rather than silently left out.
- **The Defect Log is the standout document this phase** — every one of its 12 entries is a real bug from this project's actual development history (cross-referenced against `PROJECT_AUDIT.md`'s phase-by-phase record), not invented to fill out a template. Two are marked "Critical (academic integrity)" — the fabricated KYC AI scores and the fabricated admin report activity log — treated with the same severity as the security bugs, consistent with how they were actually handled when found.
- **The Individual Contribution Report and README's test-account fields are deliberately left as placeholders** — filling these with real names/credentials would be fabrication, not documentation.
- `npx tsc --noEmit`, `npm run build`, and `npm test` all re-verified after adding this documentation batch (docs are markdown-only, but worth confirming nothing else regressed).

## 32. Work completed this phase (Phase 18: remaining 10 documents — full 26-document package complete)

| Doc | Content |
|---|---|
| `03_System_Analysis.md` | AS-IS/TO-BE gap analysis grounded in the real Phase 1 audit; feasibility analysis honest about what's unproven (operational feasibility — never run live) |
| `04_System_Design.md` | Real design patterns actually used (server-authoritative writes, atomic transactions, idempotency, pure-logic/I/O separation, single-source-of-truth), with a real class diagram of the wallet ledger |
| `07_UI_UX_Design.md` | Design system as actually built; documents the "visibly disable, never silently fail" UI pattern that emerged directly from repeatedly finding the opposite (Defect Log DEF-004, DEF-011) |
| `08_Implementation_Report.md` | Real code statistics (37 routes, 2,531 lines of lib logic, 29 tests) and condensed 17-phase narrative |
| `11_System_Administration_Guide.md` | Real admin operations: promotion, suspension, KYC review, troubleshooting table drawn from actual issues found (composite index errors, token verification failures) |
| `13_Maintenance_and_Future_Evolution.md` | Maintenance types mapped to real examples from the Defect Log; version roadmap explicitly separating "near-term" from the brief's own §26 future-work list (not conflated as promises) |
| `14_Deployment_Guide.md` | Overview tying together the Firebase and Netlify guides; explicit pre/post-deployment checklists; honest that none of it has been executed yet |
| `18_Database_Security_Rules.md` | Full current `firestore.rules`/`storage.rules` content reproduced with rule-by-rule reasoning |
| `20_Test_Cases.md` | 20 real, executable manual test cases — explicitly marked `NOT YET RUN` rather than claiming results that don't exist; kept clearly distinct from the 29 already-automated tests |
| `23_Change_Log.md` | Real version history reconstructed from the actual 17-phase development record, not invented |

This completes all 26 documents from the original project brief's list,
plus `PROJECT_AUDIT.md` and `SECURITY_TEST_REPORT.md` (28 total in `docs/`).

### Explicit scope cut / honesty notes

- **`20_Test_Cases.md`'s 20 cases are genuinely unexecuted** — every row says `NOT YET RUN`, not a fabricated "PASS." This was a real temptation to avoid: it would have been easy to write these as if already run, and that's exactly the kind of fabrication this project's own Defect Log treats as critical-severity when found elsewhere (DEF-005, DEF-008). Consistency mattered here.
- **`23_Change_Log.md`'s version numbers (0.1.0–0.11.0) are a development-milestone convention invented for this document**, not a versioning scheme that existed during actual development — noted as such in the document's closing line, not presented as if it were.
- **`npx tsc --noEmit`, `npm run build`, and `npm test`** re-verified clean after this documentation batch (docs are markdown-only and don't affect the app, but confirming nothing else regressed is good practice, not skipped as "just docs").

## 33. Where this project actually stands now

The application is functionally real across every core feature (auth,
wallet, transfers, KYC, admin console, notifications, scheduled payments,
analytics, statements). The documentation package is complete against the
original 26-item brief. The two things that remain genuinely undone,
repeated one more time because they matter most: **this has never been
tested against a live Firebase project**, and **the Firestore Security
Rules tests are written but unexecuted**. Everything else is either done,
or explicitly and honestly labeled as not done, at every layer of this
project's documentation.
