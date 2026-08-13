# Defect Log — GhanaPay Mobile

Every defect below is real — found during actual development of this
project, not invented for this document. Each includes root cause and
verification of the fix. This is the kind of evidence your original
project brief's §19 specifically asks for.

---

### DEF-001: Firestore composite index requirement not initially documented
**Severity**: Low | **Priority**: Medium | **Status**: Fixed (documented)
**Found**: Phase 5, while building wallet transaction history.
**Reproduction**: Query `walletTransactions.where("uid","==",X).orderBy("createdAt","desc")` on first run.
**Expected**: Query returns results.
**Actual**: `FAILED_PRECONDITION: The query requires an index` — Firestore
requires a composite index for equality-filter + orderBy-on-different-field
combinations; this isn't automatic.
**Root cause**: Not a code bug — a genuine Firestore platform requirement
that wasn't anticipated before first use.
**Fix**: Documented in `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` §5a with the
exact expected error text and instructions to use the auto-generated
console link.
**Verification**: N/A — behavioral documentation, not a code change.

---

### DEF-002: `.env.local` required for the app to run at all
**Severity**: Medium | **Priority**: High | **Status**: Fixed
**Found**: Phase 4, first local test by the project owner.
**Reproduction**: Fresh clone/unzip, `npm run dev`, visit `/register`.
**Expected**: App loads normally.
**Actual**: Console error: `[firebase] Missing environment variables`.
**Root cause**: `src/lib/firebase.ts` originally required all Firebase
config values via environment variables with no fallback.
**Fix**: Hardcoded the public web config (safe — it's meant to be public
per Firebase's own architecture) as a working default in `firebase.ts`,
with env vars as an optional override for pointing at a different project.
**Verification**: Rebuilt and ran `npm run build` with zero `.env.local`
file present — confirmed it still works.

---

### DEF-003: Scheduled payment date advancement silently skips days at month boundaries
**Severity**: High | **Priority**: High | **Status**: Fixed
**Found**: Phase 10, during manual logic verification (not caught by initial code review).
**Reproduction**: Call the date-advancement function with a schedule dated
Jan 31, frequency "monthly".
**Expected**: Next occurrence lands in February.
**Actual**: `Date.setMonth(currentMonth + 1)` on Jan 31 overflows —
February only has 28/29 days, so JavaScript rolls the date forward into
March 3rd, silently skipping February's occurrence entirely.
**Root cause**: Naive use of `Date.setMonth()` without checking whether
the target month actually has that many days.
**Fix**: Clamp the resulting day to the last valid day of the target
month (`src/lib/schedule-dates.ts`).
**Verification**: Manually verified against 5 hand-computed edge cases
(Jan 31, Mar 31, Dec 31 year rollover, Feb 29 leap day, a 12-month
repeated-advancement stress test) before AND after the fix, showing the
bug and then the correction. Later formalized as an automated regression
test (`schedule-dates.test.ts`, test named `REGRESSION: Jan 31 + monthly
clamps into February, not March`) so it can never silently reappear.

---

### DEF-004: Wallet top-up/withdraw buttons silently did nothing
**Severity**: High | **Priority**: High | **Status**: Fixed
**Found**: Phase 6, while wiring the real wallet backend.
**Reproduction**: Click "Top Up" or "Withdraw" on the wallet page with no
linked account selected.
**Expected**: The action proceeds (sandbox top-up doesn't need a real
funding source).
**Actual**: The handler's guard clause (`if (!validateAmount(amount) ||
!selectedAccountId) return;`) silently exited — no error shown, nothing
happened — because no linked-accounts feature existed yet, so
`selectedAccountId` could never be set.
**Root cause**: UI logic assumed a subsystem (linked accounts) that
didn't exist yet at the time this button was originally built.
**Fix**: Removed the `selectedAccountId` requirement for sandbox top-up/withdraw.
**Verification**: `tsc --noEmit` + `npm run build` after the fix; logic
confirmed by tracing the guard clause change.

---

### DEF-005: KYC "AI verification" was entirely fabricated
**Severity**: Critical (academic integrity) | **Priority**: High | **Status**: Fixed
**Found**: Phase 9, while wiring the real admin KYC review page.
**Reproduction**: Open the original admin KYC review screen for any pending applicant.
**Expected**: Real review information.
**Actual**: A panel showing `docScore`/`faceScore` percentages and an
"AI RECOMMENDATION: APPROVE" verdict — none of which came from any real
computation. The original mock API even had a `// TODO: run AI
verification` comment confirming it was never real.
**Root cause**: Original scaffold UI implied automated verification that
was never implemented.
**Fix**: Removed the fabricated scoring UI entirely. Replaced with a
real per-document submitted/not-submitted view and a genuine manual
admin approve/reject decision.
**Verification**: Confirmed via code review that no scoring logic exists
anywhere in `kyc-record.ts` or the review routes.

---

### DEF-006: Admin dashboard KPIs showed "..." forever
**Severity**: High | **Priority**: High | **Status**: Fixed
**Found**: Reported by the project owner, Phase 12 (screenshot evidence).
**Reproduction**: Load `/admin` as an administrator.
**Expected**: Real KPI numbers.
**Actual**: Every stat showed `"..."` indefinitely; `/admin/kyc` and
`/admin/transactions` showed real, populated data — an inconsistency
directly visible to the user.
**Root cause**: `/admin` called `GET /api/admin/overview`, which did not
exist anywhere in the codebase. The fetch failed silently
(`.catch(() => setLoading(false))`), masking the 404.
**Fix**: Built the real endpoint, aggregating from the same collections
the detail pages already query (see architectural principle in
`docs/05_Architecture.md` §7).
**Verification**: `tsc --noEmit`, `npm run build`; manual trace confirming
the aggregation queries the same collections as `/admin/kyc` and
`/admin/transactions`.

---

### DEF-007: Pending-KYC count capped at 5 due to reused query
**Severity**: Medium | **Priority**: Medium | **Status**: Fixed
**Found**: Self-caught while building DEF-006's fix, before shipping.
**Reproduction**: Have more than 5 pending KYC submissions; load the
admin overview.
**Expected**: True total count shown.
**Actual**: Would have shown exactly 5, because the same Firestore query
used for the small "preview list" (deliberately `.limit(5)`) was almost
reused for the "total pending" KPI number.
**Root cause**: Conflating a display-limited query with a count query.
**Fix**: Added a separate `count()` aggregate query for the true total,
independent of the preview list's limit.
**Verification**: Code review of `src/lib/admin-overview.ts` confirms two
distinct queries; caught before this ever shipped to the user.

---

### DEF-008: Admin Reports page attributed fabricated actions to named people
**Severity**: Critical (academic integrity / defamation-adjacent) | **Priority**: High | **Status**: Fixed
**Found**: Phase 14, during the "unaudited pages" review pass.
**Reproduction**: Open the original admin Reports page.
**Expected**: Real report generation history, or none shown.
**Actual**: A "Recent Generation Activity" log crediting specific named
admins ("Esi Amankwah," "Kofi Admin") with generating specific reports at
specific times — events that never happened. Also fake file sizes and a
"Generate" button that spun for 2 seconds via `setTimeout` with no real
output.
**Root cause**: Scaffold UI mock data left in place and never replaced
with real functionality or removed.
**Fix**: Removed the fabricated activity log entirely (no real
report-generation history is tracked, so nothing honest could replace
it). Made Transaction Summary a real, working CSV export. Explicitly
disabled and labeled the other 5 report types as "Not implemented."
**Verification**: `tsc --noEmit`, `npm run build`; visual confirmation no
fabricated names remain anywhere in the file.

---

### DEF-009: Merchant detection based on phone number length
**Severity**: Medium | **Priority**: Medium | **Status**: Fixed (found twice, independently)
**Found**: Phase 14 (Analytics page), then again independently in Phase 16 (Dashboard page).
**Reproduction**: Sign in as any user; check `isMerchant` logic.
**Expected**: Merchant status derived from the real `role` field.
**Actual**: `const isMerchant = user?.phone && user.phone.length <= 6;` —
a Ghanaian phone number is never 6 digits or fewer, so this condition
could essentially never be true for a real phone number, and had no
logical relationship to merchant status at all.
**Root cause**: Placeholder/guess logic left in from the original
scaffold, apparently copy-pasted into a second file without ever being
questioned.
**Fix**: Replaced both instances with `user?.role === 'merchant'`, using
the real role field that had existed since Phase 4 but was never
actually used for this purpose.
**Verification**: `grep` confirms no remaining `phone.length` merchant
checks anywhere in the codebase.

---

### DEF-010: `GET /api/transactions` was public and returned fake data
**Severity**: Critical (security) | **Priority**: High | **Status**: Fixed
**Found**: Phase 16, systematic API route audit.
**Reproduction**: `curl` the endpoint with no Authorization header.
**Expected**: 401 Unauthorized.
**Actual**: 200 OK with hardcoded mock transaction data — no
authentication check existed on this route at all. Worse: `/history` and
`/dashboard` were still actively calling it.
**Root cause**: A route left over from before the real wallet ledger was
built, never removed or secured once real endpoints existed.
**Fix**: Rewrote to require authentication and return the caller's own
real transactions from Firestore.
**Verification**: `tsc --noEmit`, `npm run build`; confirmed route now
imports and calls `requireAuth()`.

---

### DEF-011: `POST /api/users/update` never existed
**Severity**: High | **Priority**: High | **Status**: Fixed
**Found**: Phase 16, systematic API route audit.
**Reproduction**: Sign in, go to Settings, edit name/phone, click "Save Changes."
**Expected**: Profile updates.
**Actual**: 404 — the route simply did not exist. The Settings page had
been calling it since Phase 4 with no visible error to the user (the
`catch` block showed a generic alert but nothing indicated *why* it kept
failing).
**Root cause**: The Settings page was apparently built against an
intended API contract that was never actually implemented.
**Fix**: Built the real route (name/phone updates to Firestore; email
intentionally excluded and the field disabled in the UI, since Firebase
email changes require a re-authentication flow not built here).
**Verification**: `tsc --noEmit`, `npm run build`.

---

### DEF-012: History page transaction mapping used a fictional data shape
**Severity**: High | **Priority**: High | **Status**: Fixed
**Found**: Phase 16, systematic API route audit (discovered while fixing DEF-010).
**Reproduction**: Load `/history` with any real transaction data present.
**Expected**: Real names, correct Sent/Received/Bill/Airtime categorization.
**Actual**: The mapping code read `t.sender.user.name`,
`t.recipientWallet.user.name`, `t.metadata.note` — fields that never
existed in the real data model, the original mock data, or any API
response this project ever produced. Every transaction rendered as
"Unknown User," and everything was miscategorized as only "Sent" or
"Received" regardless of actual type (bills and airtime purchases were
never distinguishable). On any fetch error, the page silently substituted
entirely different fake data with no indication to the user.
**Root cause**: Appears to have been written against a hypothetical
backend contract that was never built, and never verified against actual
data.
**Fix**: Rewrote the mapping to use the real `WalletTransactionDoc`
fields (`type`, `counterpartyName`, `note`, `createdAt.seconds`, etc.);
replaced the silent fake-data fallback with a visible error message.
**Verification**: `tsc --noEmit`, `npm run build`.

---

## Summary

| Severity | Count |
|---|---|
| Critical | 2 (DEF-005, DEF-008) |
| High | 6 (DEF-003, DEF-004, DEF-006, DEF-010, DEF-011, DEF-012) |
| Medium | 3 (DEF-002, DEF-007, DEF-009) |
| Low | 1 (DEF-001) |

**Pattern worth noting**: several of the most serious defects
(DEF-005, DEF-008) were not "missing features" but *fabricated data
presented as real* — automated scores, named individuals credited with
actions that never happened. These were treated with the same severity as
security bugs, not as cosmetic issues, consistent with this project's
academic-integrity requirements.
