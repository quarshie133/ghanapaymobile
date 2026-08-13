# Testing Report — GhanaPay Mobile

## What's actually covered

This is a genuine automated unit test suite, run with Jest, covering the
**pure business logic** that doesn't require a live Firebase connection.
Run it yourself:

```
npm test
```

As of this report: **3 test suites, 29 tests, all passing.**

```
PASS src/lib/statements-core.test.ts
PASS src/lib/schedule-dates.test.ts
PASS src/lib/phone.test.ts

Test Suites: 3 passed, 3 total
Tests:       29 passed, 29 total
```

### `src/lib/phone.test.ts` (12 tests)
Ghanaian phone number normalization and validation — the function that
makes recipient lookup work regardless of how someone typed a phone number
(spaced, dashed, `+233`, bare `233`, missing leading `0`). Covers all six
real-world formats converging to the same canonical value, plus rejection
of invalid input (too short, too long, non-numeric).

### `src/lib/schedule-dates.test.ts` (9 tests)
Scheduled-payment date advancement — daily/weekly/monthly/annually. This
suite specifically locks in a **regression test for a real bug** found
during manual verification in Phase 10: naive `Date.setMonth(+1)` silently
overflows for month-end dates (Jan 31 + 1 month became March 3rd, skipping
February). Also covers leap-day handling and a 12-month simulated
repeated-advancement stress test to catch any date drift accumulating over
a full year of monthly payments.

### `src/lib/statements-core.test.ts` (8 tests)
The running-balance reconstruction that powers `/statements` — verifies
that opening balance always equals the previous month's closing balance,
that fees are correctly folded into debit totals, that credit vs. debit
transaction types are classified correctly, and that floating-point
amounts don't silently drift (JavaScript's `10.1 + 10.2` is
`20.299999999999997`, not `20.3` — this asserts the rounding logic
actually prevents that from leaking into a real balance).

## What refactoring made this possible

`statements.ts` and `scheduled-payments.ts` originally mixed Firestore I/O
with the actual computation in the same functions — that's untestable
without mocking the Firebase Admin SDK. Both were split so the pure
calculation lives in a separate file with zero Firebase imports
(`statements-core.ts`, `schedule-dates.ts`), and the original files now
just fetch data and delegate to the pure function. This is the same
pattern the brief's §18 implies ("Unit testing: validation, transaction
calculations, fee calculations") — logic that can be tested in isolation.

## What is NOT covered, and why

**Nothing here tests against a live Firestore project.** Every function
that touches `adminDb()`, `adminAuth()`, or Firebase Storage — which is
most of this project's actual business logic (the wallet ledger's atomic
transactions, KYC review, admin user management, the API routes
themselves) — is untested by this suite. Testing those honestly requires
one of:

1. **The Firebase Local Emulator Suite** (`firebase emulators:start`) — a
   real local Firestore/Auth/Storage emulator that tests could run
   against without touching production data. This has NOT been set up in
   this project. Setting it up would be the natural next step for
   integration testing.
2. **A real Firebase project with test credentials** — slower, costs
   quota, and risks polluting real data if not carefully isolated.

Neither exists yet. Concretely, **not covered by any automated test**:
- Wallet ledger atomicity (does a failed transfer really leave both
  balances untouched?)
- Idempotency key deduplication (does a double-submitted top-up really
  only apply once?)
- Firestore Security Rules (does a non-owner really get denied read
  access to someone else's wallet?)
- Firebase Authentication flows (register, login, Google sign-in,
  password reset)
- Every API route's actual HTTP behavior (status codes, auth rejection,
  role-gating)
- KYC document upload and the signed-URL generation for admin review

These were verified individually via `tsc --noEmit`, `npm run build`
succeeding, and in several cases a standalone Node script run against the
extracted logic during development (documented in `docs/PROJECT_AUDIT.md`
phase-by-phase) — but none of that is a repeatable, CI-runnable test suite
the way the 29 tests above are. Don't describe this project as having
"integration test coverage" or "security test coverage" — it doesn't yet.

## Suggested next steps for testing

1. **Set up the Firebase Local Emulator Suite** and write integration
   tests against it for the wallet ledger's atomicity and idempotency
   guarantees — this is the single highest-value testing gap.
2. **API route tests** using the emulator + a test HTTP client, covering
   auth rejection (no token, wrong role) for every admin-gated route.
3. **Security rules tests** using `@firebase/rules-unit-testing` against
   the emulator — this can directly verify `firestore.rules` and
   `storage.rules` behave as documented, rather than relying on manual
   inspection.
4. **E2E tests** (Playwright or Cypress) for the critical user journeys:
   register → verify KYC → top up → transfer → check ledger.

None of the above exist yet. This report will be updated honestly as they
do, not marked complete in advance.
