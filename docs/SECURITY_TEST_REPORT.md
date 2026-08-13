# Security Test Report — GhanaPay Mobile

Companion to `docs/12_Security_Architecture.md`. That document describes
what's built; this one is about what's actually been verified, and how.

## 1. Automated tests (executed, real output)

`npm test` — 29 unit tests, all passing (see `docs/09_Testing_Report.md`
for the full breakdown). None of these are security tests specifically,
but `phone.test.ts` does cover input validation rejecting malformed data.

`npm run test:rules` — Firestore Security Rules tests written against the
real `@firebase/rules-unit-testing` library
(`tests/rules/firestore-rules.test.ts`), covering:
- A user cannot create their own profile with `role: "administrator"`
- A user cannot read another user's profile, wallet, transactions, or KYC
  record
- A user cannot directly write their own wallet balance (the core
  anti-pattern the original project brief calls out)
- A user cannot approve their own KYC record
- Unauthenticated requests are rejected

**These tests were written but NOT executed in this development
environment** — the sandbox's network configuration blocks
`storage.googleapis.com`, which is where the Firebase emulator's Java
binary is hosted. Verified with an actual failed download attempt:

```
Error: download failed, status 403: Host not in allowlist: storage.googleapis.com.
```

The test file does type-check correctly against the real
`@firebase/rules-unit-testing` and `firebase/firestore` APIs (confirmed
via `tsc --noEmit`), which gives some confidence the code is syntactically
sound, but **type-checking is not the same as passing** — run
`npm run test:rules` yourself to get a real pass/fail result.

## 2. Dependency vulnerability scan (real `npm audit` output)

Before any fix:
```
15 vulnerabilities (9 moderate, 6 high)
```

Notable high-severity findings included several in `next` itself
(SSRF via rewrites, unauthenticated disclosure of internal Server Function
endpoints, cache confusion, DoS vectors) — genuinely concerning for a
production deployment, not dismissed here.

Ran `npm audit fix` (the non-breaking variant — did NOT run `--force`,
which would have bumped Next.js to 16.3.0, outside this project's stated
dependency range, and firebase-tools to a breaking major version, without
your explicit sign-off on a version bump of that scope). Result:
```
12 vulnerabilities (9 moderate, 3 high)
```

Verified `npx tsc --noEmit`, `npm run build`, and `npm test` all still
pass cleanly after this fix — the safe fix didn't break anything.

**12 vulnerabilities remain, unresolved.** Most trace back to
`firebase-tools`'s own dependency chain (`@google-cloud/pubsub`,
`gaxios`, `uuid`, `js-yaml`) — a dev-only dependency added this phase
specifically to enable local emulator testing, not something that ships
in the deployed app. The Next.js advisories from the original 15 appear
to have been resolved by the safe fix; verify this yourself with a fresh
`npm audit` before relying on that claim for anything you submit, since
dependency advisories change over time and this snapshot is from one
point in development.

**Not done**: a full triage of the remaining 12 (which are actually
reachable in the deployed app vs. only present in dev tooling), and no
decision has been made about whether to run `npm audit fix --force` — that
risks breaking changes and needs your explicit call, not mine.

## 3. Manual code review (not automated, no test artifact)

The following were verified by reading the code, not by running a test —
listed here so the distinction from §1-2 is clear:

- Every API route was checked for `requireAuth()` presence during this
  phase's audit (see `docs/12_Security_Architecture.md` §6) — this
  process itself is not repeatable/automated; a route added later without
  `requireAuth()` would not be caught automatically. Worth turning into a
  lint rule or a real automated test (e.g., asserting every file under
  `src/app/api/**/route.ts` imports `requireAuth`) rather than relying on
  a human doing this again.
- Firestore rules were read and reasoned about; §1 above notes the
  corresponding automated tests exist but are unexecuted.
- The KYC signed-URL mechanism and the deliberate avoidance of
  `getDownloadURL()` was verified by reading `src/lib/kyc-upload.ts` and
  `src/app/api/kyc/document-url/route.ts` — not tested with a real upload
  against live Storage.

## 4. What has NEVER been tested, automated or manual

- Penetration testing of any kind (SQL/NoSQL injection attempts, auth
  bypass attempts, session fixation, etc.)
- Load/stress testing (what happens to the wallet ledger under concurrent
  requests at scale — the atomicity guarantees are believed correct based
  on Firestore's documented transaction semantics, but never exercised
  under real concurrent load)
- Any live penetration of the deployed Netlify site or live Firebase
  project, because neither has been deployed/tested against in this
  development process at all

## 5. Summary — what you can honestly claim

✅ **Can claim**: "29 unit tests pass, covering input validation and
computation logic." "Dependency vulnerabilities were checked with `npm
audit` and reduced from 15 to 12 via a non-breaking fix." "Firestore
Security Rules tests exist and are ready to run against the emulator."

❌ **Cannot honestly claim**: "Security rules were tested and verified."
"The application has undergone security testing." "Penetration testing
was performed." None of these are true yet — the rules tests are written
but unexecuted, and nothing here constitutes a security test in the sense
your original brief's §18 (security testing: unauthorized access, role
escalation, invalid input) actually means. Running `npm run test:rules` on
a machine with normal network access is the single highest-value action
to close this gap.
