# Test Cases — GhanaPay Mobile

**Two categories, kept distinct:**
- **Automated & executed** (29 cases) — see `docs/09_Testing_Report.md`. Not repeated here.
- **Manual, planned, NOT yet executed** — the cases below. These are
  ready to run against a live deployment but have not been run as part of
  this project's development (see `docs/22_Risk_Register.md` R-01).
  Marking these "planned" rather than "passed" is deliberate — running
  them and recording real results is real future work, not something to
  claim in advance.

## Format
Each case: ID, Preconditions, Steps, Expected Result, Actual Result
(blank — to be filled in when actually run).

---

### TC-001: Register a new account
**Preconditions**: Firebase project configured, app deployed or running locally.
**Steps**: Go to `/register`. Enter name, email, phone, password (6+ chars). Submit.
**Expected**: Redirected to `/dashboard`. New user appears in Firebase Console → Authentication and Firestore → `users`.
**Actual**: `NOT YET RUN`

### TC-002: Register with a duplicate email
**Steps**: Repeat TC-001 with the same email.
**Expected**: Error message "An account already exists with this email."
**Actual**: `NOT YET RUN`

### TC-003: Login with correct credentials
**Steps**: Go to `/login`, enter valid email/password.
**Expected**: Redirected to `/dashboard`.
**Actual**: `NOT YET RUN`

### TC-004: Login with incorrect password
**Steps**: Enter valid email, wrong password.
**Expected**: "Incorrect email or password." No redirect.
**Actual**: `NOT YET RUN`

### TC-005: Admin login rejects a non-admin account
**Steps**: Go to `/admin-login`, sign in with a valid customer account's real credentials.
**Expected**: Rejected with "This account does not have administrator access." — account is signed back out, not left in a half-logged-in state.
**Actual**: `NOT YET RUN`

### TC-006: Top up wallet
**Steps**: As a logged-in user, go to Wallet, top up ₵50.
**Expected**: Balance increases by exactly ₵50. A new `walletTransactions` document appears with `type: "topup"`, `status: "successful"`.
**Actual**: `NOT YET RUN`

### TC-007: Withdraw more than available balance
**Steps**: Attempt to withdraw an amount greater than the current balance.
**Expected**: Rejected with "Insufficient wallet balance." Balance unchanged.
**Actual**: `NOT YET RUN`

### TC-008: Double-submit a top-up (idempotency)
**Steps**: Rapidly click "Top Up" twice with the same amount before the first request completes (or manually replay the same request with the same idempotency key).
**Expected**: Balance increases only once, not twice.
**Actual**: `NOT YET RUN`

### TC-009: Peer-to-peer transfer between two real accounts
**Preconditions**: Two registered accounts (A, B) with different phone numbers; A has sufficient balance.
**Steps**: As A, send ₵20 to B's phone number.
**Expected**: A's balance decreases by ₵20; B's balance increases by ₵20. Two `walletTransactions` documents created (`transfer_out` for A, `transfer_in` for B) sharing the same `ref`. Both A and B receive a notification.
**Actual**: `NOT YET RUN`

### TC-010: Transfer to a non-existent phone number
**Steps**: Attempt to send money to a phone number not registered on GhanaPay.
**Expected**: "Recipient not found on GhanaPay." No balance change.
**Actual**: `NOT YET RUN`

### TC-011: Transfer to yourself
**Steps**: Attempt to send money to your own phone number.
**Expected**: Rejected — "Cannot transfer to your own account."
**Actual**: `NOT YET RUN`

### TC-012: Exceed daily transfer limit
**Preconditions**: Account with default Tier 1 daily limit (₵5,000).
**Steps**: Attempt transfers totaling more than ₵5,000 in one day.
**Expected**: The transfer that would exceed the limit is rejected, showing the remaining allowance.
**Actual**: `NOT YET RUN`

### TC-013: KYC document upload and admin approval, full loop
**Steps**: As a customer, upload all 3 KYC documents. As an admin, view the application in `/admin/kyc`, view each document via signed URL, approve.
**Expected**: Status becomes `pending_review` after all 3 uploads, then `approved` after admin action. Customer's tier becomes 3. Customer receives a notification.
**Actual**: `NOT YET RUN`

### TC-014: KYC rejection and resubmission
**Steps**: As admin, reject a pending application with a note. As the customer, re-upload a document.
**Expected**: Status becomes `rejected` with the note visible; after resubmission, status returns to `pending_review` (not silently staying `rejected` or jumping to `approved`).
**Actual**: `NOT YET RUN`

### TC-015: Suspend a user account
**Steps**: As admin, suspend a test user's account via `/admin/users`. Attempt to log in as that user.
**Expected**: Login fails — the account is genuinely disabled in Firebase Auth, not just cosmetically flagged.
**Actual**: `NOT YET RUN`

### TC-016: Non-admin attempts to access an admin route directly
**Steps**: As a signed-in customer, navigate directly to `/admin/users` (bypassing the UI).
**Expected**: Redirected to `/dashboard` (client-side guard) AND the underlying `GET /api/admin/users` call returns 403 if attempted directly (server-side guard — the real boundary).
**Actual**: `NOT YET RUN`

### TC-017: Scheduled payment executes without the browser open
**Preconditions**: Netlify Scheduled Function deployed and confirmed running (see Admin Guide §10).
**Steps**: Create a scheduled transfer with `nextRunAt` a few minutes in the future. Close the browser entirely. Wait for the scheduled function to fire.
**Expected**: The transfer executes and appears in transaction history, with the browser having been closed the whole time.
**Actual**: `NOT YET RUN`

### TC-018: Scheduled payment with insufficient balance
**Steps**: Create a scheduled payment for more than the account will have available at execution time.
**Expected**: Recorded as `lastRunStatus: "failed"` with an error message, not silently skipped; `nextRunAt` still advances to the next occurrence rather than retrying immediately.
**Actual**: `NOT YET RUN`

### TC-019: Statement opening/closing balance consistency
**Steps**: After several months of transaction history, view `/statements` for two consecutive months.
**Expected**: The later month's opening balance exactly equals the earlier month's closing balance (this specific logic IS covered by automated tests — see `statements-core.test.ts` — but this case verifies it end-to-end against real data, not just the pure function in isolation).
**Actual**: `NOT YET RUN`

### TC-020: Firestore Security Rules reject a direct client write attempt
**Preconditions**: Firebase emulator running (or a test project), Firebase console access.
**Steps**: Using the Firestore console's Rules Playground (or a raw client SDK call), attempt to write directly to `wallets/{someUid}` as an authenticated non-admin user.
**Expected**: Denied. (This specific case IS covered by `tests/rules/firestore-rules.test.ts`, written but unexecuted — see Testing Report. Running it live via `npm run test:rules` supersedes doing this manually.)
**Actual**: `NOT YET RUN`

---

## Summary

| Category | Count | Executed |
|---|---|---|
| Automated unit tests (see Testing Report) | 29 | ✅ Yes |
| Firestore Security Rules tests (written) | 12 | ❌ No — needs emulator |
| Manual test cases (this document) | 20 | ❌ No — needs live deployment |

**Total planned coverage**: 61 test cases across all categories. **Total
actually executed with recorded results**: 29. This gap is the same one
flagged throughout this project's documentation — closing it means
running against a live Firebase project, which hasn't happened yet.
