# Requirements Traceability Matrix — GhanaPay Mobile

Links each functional requirement (see `docs/02_SRS.md`) to its design
reference, implementation file, test coverage, and real status.

| Req ID | Requirement | Design Ref | Implementation | Test | Status |
|---|---|---|---|---|---|
| FR-001 | Register (email/password) | §2 Auth flow | `src/lib/AuthContext.tsx`, `src/app/(auth)/register/` | Manual (untested automated) | ✅ |
| FR-002 | Login (email/password) | §2 Auth flow | `AuthContext.tsx`, `(auth)/login/` | Manual | ✅ |
| FR-003 | Google sign-in | §2 Auth flow | `AuthContext.tsx` (`loginWithGoogle`) | Manual | ✅ |
| FR-004 | Password reset | §2 Auth flow | `(auth)/forgot-password/` | Manual | ✅ |
| FR-006 | Role defaults to customer, client can't self-elevate | §4 Security | `user-profile.ts`, `firestore.rules` | `tests/rules/firestore-rules.test.ts` (written, unexecuted — see Testing Report) | ✅ |
| FR-007/008 | Route auth/role gating | §2 Auth flow | `server-auth.ts` (`requireAuth`) | Manual audit (Phase 16, see Defect Log DEF-010) | ✅ |
| FR-010–015 | Wallet balance, top-up, withdraw, atomicity, idempotency, history | §3 Transfer sequence | `wallet-ledger.ts` | Logic verified via standalone scripts during dev; no automated integration test | ✅ |
| FR-020–024 | Peer transfer, server-side recipient resolution, atomicity, daily limit, self-transfer block | §3 Transfer sequence | `wallet-ledger.ts` (`transferBetweenWallets`), `server-user-lookup.ts` | Same as above | ✅ |
| FR-030–032 | Bill payment, airtime, atomic debit | §3 (same pattern) | `wallet-ledger.ts` (`payForSandboxService`) | Same as above | ✅ |
| FR-040–042 | Linked accounts (sandbox) | — | `linked-accounts.ts` | Manual | ✅ (sandbox only) |
| FR-050–054 | KYC upload, private storage, admin review, tier upgrade, signed URL | §4 KYC workflow | `kyc-upload.ts`, `kyc-record.ts` | Manual | ✅ |
| FR-055 | KYC automated verification | — | — | — | 🔲 not implemented |
| FR-060–062 | Scheduled payments, background execution, failure handling | — | `scheduled-payments.ts`, `schedule-dates.ts`, `netlify/functions/run-scheduled-payments.mts` | `schedule-dates.test.ts` (9 automated tests, executed, passing) | ✅ code / ⚠️ requires Netlify Scheduled Function actually deployed |
| FR-070–072 | Notifications | — | `notifications.ts` | Manual | ✅ |
| FR-080–084 | Admin: view users, suspend, view transactions, overview dashboard, transaction report | §7 Single source of truth | `admin-users.ts`, `admin-transactions.ts`, `admin-overview.ts` | Manual; dashboard-consistency bug found and fixed (Defect Log DEF-006, DEF-007) | ✅ |
| FR-085 | Fraud detection | — | `demo-fraud-data.ts` (static demo only) | — | 🔲 explicitly future work |
| FR-086 | Bulk payments | — | — | — | 🔲 explicitly flagged not implemented |
| FR-090–091 | Analytics summary, category breakdown | — | `analytics.ts` | Manual | ✅ |
| FR-092 | Savings goals | — | — | — | 🔲 not implemented |
| NFR-001–002 | Server-side-only financial writes, Security Rules deny client writes | §1 High-level architecture | `firestore.rules`, all `/api/wallet/*` routes | `tests/rules/firestore-rules.test.ts` (written, unexecuted) | ✅ code / ⚠️ rules untested live |
| NFR-003 | KYC documents never public | §4 KYC workflow | `kyc-upload.ts` (no `getDownloadURL`), `storage.rules` | Manual code review | ✅ |
| NFR-007 | Pure logic separated from I/O for testability | §6 Component map | `statements-core.ts`, `schedule-dates.ts` | `statements-core.test.ts`, `schedule-dates.test.ts` (17 tests, executed, passing) | ✅ |

## Coverage summary

- **37 API routes** exist; all were audited for authentication enforcement in Phase 16 (2 real gaps found and fixed — see Defect Log DEF-010, DEF-011).
- **29 automated unit tests** exist and pass, covering pure computation logic (phone normalization, date math, statement balance reconstruction).
- **Firestore Security Rules tests are written but not executed** in this development environment (network-blocked from the emulator) — see `docs/SECURITY_TEST_REPORT.md`.
- **No end-to-end or live-integration tests exist** — every "✅" status above reflects code that compiles, type-checks, and was logic-verified during development, not a test that ran against a live Firebase project. This distinction is maintained deliberately throughout this project's documentation rather than blurred.
