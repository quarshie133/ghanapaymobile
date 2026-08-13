# Risk Register — GhanaPay Mobile

Scored: Probability (1-5) × Impact (1-5) = Risk Score. Risks specific to
this project's actual state — not a generic template.

| ID | Risk | Prob | Impact | Score | Mitigation | Contingency |
|---|---|---|---|---|---|---|
| R-01 | **Never tested against a live Firebase project** — all backend logic verified only via typecheck/build/standalone scripts, not real Firestore | 5 | 4 | 20 | Manual end-to-end testing is the top recommended next step in every phase of `docs/PROJECT_AUDIT.md` | If a real bug surfaces post-deployment, the Defect Log process (§21) is already established — use it |
| R-02 | **Firestore Security Rules unverified live** — tests exist (`tests/rules/`) but couldn't execute in the dev sandbox | 4 | 5 | 20 | Run `npm run test:rules` on a machine with normal network access before considering rules production-ready | Rules follow a consistent, auditable deny-by-default pattern even if unverified — reduces (doesn't eliminate) risk of a rules bug |
| R-03 | **Firebase service account key (Admin SDK credential) leaks** — grants full read/write to all Firestore data if exposed | 2 | 5 | 10 | Never committed to git (`.gitignore`); documented as a real secret distinct from the public web config in the setup guide; deliberately never requested in chat during development | Rotate the key immediately via Firebase Console if leaked; revoking is fast |
| R-04 | **Netlify Scheduled Function doesn't actually fire** — scheduled payments silently never execute if deployment setup is skipped | 3 | 3 | 9 | Documented explicitly in `docs/16_NETLIFY_DEPLOYMENT_GUIDE.md` §6 that the code alone doesn't create the trigger — real deployment steps required | Manual trigger via `curl` with the cron secret as a stopgap (documented, though it defeats "browser doesn't need to stay open") |
| R-05 | **Composite Firestore index missing on first deploy** — several queries fail until the index is created | 4 | 2 | 8 | Documented expected error text and fix in setup guide §5a; Firestore's own error message includes a one-click creation link | Low actual impact — the error is self-diagnosing and quick to fix |
| R-06 | **Dependency vulnerabilities** — 12 remain after the safe `npm audit fix`; some in Next.js's own advisory history before the fix (SSRF, auth-bypass-adjacent issues) | 3 | 4 | 12 | Ran `npm audit fix` (safe subset); documented remaining count and source in `docs/SECURITY_TEST_REPORT.md` | `npm audit fix --force` available but deliberately not run without an explicit decision — breaking-change risk needs owner sign-off |
| R-07 | **Data fabrication drift** — new mock/placeholder UI added later without the same scrutiny this project applied | 2 | 5 | 10 | Established pattern (documented in Defect Log DEF-005, DEF-008) of treating fabricated data as a critical-severity defect, not cosmetic | Periodic audit passes (as done in Phase 16) rather than one-time review |
| R-08 | **Netlify Scheduled Functions consume shared monthly credits** — could exhaust free-tier quota, pausing the whole site | 2 | 4 | 8 | Documented in deployment guide §6 with real 2026 pricing model (credit-based, not flat free/paid) | Monitor via Netlify's usage dashboard; reduce cron frequency if needed |
| R-09 | **KYC document exposure via a future code change** that reintroduces `getDownloadURL()` | 1 | 5 | 5 | Explicit code comments in `kyc-upload.ts` and `storage.rules` explaining why this must never be used | Storage Rules still deny public read even if the client code regresses — defense in depth |
| R-10 | **Firestore query caps hit at real scale** — several aggregations cap reads at 300–2000 documents | 2 | 3 | 6 | Documented per-instance in `docs/PROJECT_AUDIT.md` wherever it applies | Not a concern at demo/academic scale; would need pagination or Cloud Functions aggregation for real production volume |
| R-11 | **Email change flow incomplete** — Settings page disables email editing rather than supporting it, since Firebase requires re-authentication for this | 5 (already true) | 1 | 5 | Honestly disabled in the UI with an explanation, rather than silently failing (see Defect Log DEF-011 for what silent failure looked like elsewhere) | Build the real re-auth flow as a future enhancement if needed |
| R-12 | **Bulk payments and 5 of 6 admin report types are unbuilt** but visible in the UI as illustration | 5 (already true) | 2 | 10 | Explicit on-page banners state "not implemented" and disable the relevant buttons | None needed — the honest labeling IS the mitigation |

## Risk score interpretation
- **15-25**: High — needs attention before any real deployment (R-01, R-02)
- **9-14**: Medium — should be addressed, not urgent (R-03, R-04, R-06, R-07, R-12)
- **1-8**: Low — monitor, low cost to accept (R-05, R-08, R-09, R-10, R-11)

The two highest-scored risks (R-01, R-02) share a common cause: this
project was built without ever connecting to a live Firebase project or
running the local emulator. That's the single biggest lever for reducing
overall project risk — not a new feature, a testing gap.
