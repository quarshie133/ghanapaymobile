# Change Log — GhanaPay Mobile

Derived from the real, phase-by-phase development history in
`docs/PROJECT_AUDIT.md`. Dates reflect the actual development session,
not backdated.

## [0.1.0] — Baseline (pre-existing scaffold)
Initial repository: Next.js UI scaffold, no real backend. Custom
JWT/localStorage auth pointed at a nonexistent external API. All API
routes were stubs returning hardcoded JSON. See `PROJECT_AUDIT.md` §1
(PROJECT_AUDIT.md) for the full audit.

## [0.2.0] — Phase 4: Real Authentication
### Added
- Firebase Authentication (email/password, Google sign-in, password reset)
- `/register`, `/forgot-password` pages (did not exist before)
- `firestore.rules` covering the `users` collection
### Fixed
- Removed non-functional custom JWT/localStorage auth scheme
### Changed
- `/login` rewired from phone-based fake auth to real email-based Firebase auth

## [0.3.0] — Phases 5–7: Wallet Ledger
### Added
- Real atomic wallet ledger: top-up, withdrawal, peer transfer, bill payment, airtime
- Firebase Admin SDK server-side integration
- Idempotency key support, daily transfer limit enforcement
- Avatar component (Google photo or initials fallback)
- Mock AI assistant (rule-based, honestly labeled as not a real model)
### Fixed
- Wallet top-up/withdraw buttons that silently did nothing (missing linked-accounts dependency)

## [0.4.0] — Phases 8–9: KYC
### Added
- Real KYC document upload to Firebase Storage
- Admin KYC review queue, approve/reject, tier upgrade on approval
- Signed-URL document viewing (5-minute expiry, never a permanent link)
### Fixed
- KYC status previously returned identical fake data for every user
### Removed
- Fabricated "AI verification" scoring UI on the admin KYC page

## [0.5.0] — Phase 10: Linked Accounts, Notifications, Scheduled Payments
### Added
- Sandbox linked-account CRUD
- Real in-app notification system
- Scheduled payment engine + Netlify Scheduled Function for background execution
### Fixed
- **Critical**: date-overflow bug in monthly/annual schedule advancement (Jan 31 + 1 month → March 3rd)

## [0.6.0] — Phases 11–12: Admin Console + Dashboard Consistency
### Added
- Real admin user directory, suspend/reactivate (via Firebase Auth)
- Real admin transaction monitoring
- Real admin overview dashboard
### Fixed
- Admin dashboard KPIs showing "..." indefinitely (missing `/api/admin/overview` endpoint)
- Pending-KYC count capped at 5 due to a reused limited query
- Sidebar KYC badge hardcoded to "47" regardless of real data
- Fraud-alert timestamp rendering as "Invalid Date"

## [0.7.0] — Phase 13: Real Statements
### Added
- Real monthly statement generation via running-balance reconstruction
- CSV export, print-to-PDF
### Removed
- False claim that PDF statements are "bank-certified"
- Fabricated fixed account number

## [0.8.0] — Phase 14: Analytics, Reports, Bulk Payments Audit
### Fixed
- Merchant detection based on `phone.length <= 6` (nonsensical), replaced with real `role` field
### Removed
- Fabricated named-admin activity log on the Reports page (invented people credited with actions that never happened)
### Changed
- 5 of 6 admin report types explicitly disabled and labeled "not implemented" rather than faked
- Bulk Payments page explicitly labeled "not implemented"

## [0.9.0] — Phase 15: Automated Testing
### Added
- Jest unit test suite — 29 tests, 3 suites
- Pure-logic/I/O separation refactor (`statements-core.ts`, `schedule-dates.ts`)
- Regression test for the Phase 10 date-overflow bug

## [0.10.0] — Phase 16: Security Audit
### Added
- Firebase Local Emulator Suite configuration (`firebase.json`)
- Firestore Security Rules tests (`tests/rules/`) — written, unexecuted (environment-blocked)
- `docs/12_Security_Architecture.md`, `docs/SECURITY_TEST_REPORT.md`
### Fixed
- **Critical**: `GET /api/transactions` had no authentication, served fake data publicly
- **Critical**: `POST /api/users/update` never existed — Settings page silently failed since v0.2.0
- History page transaction mapping used a fictional data shape, always showed "Unknown User"
- Second independent copy of the `phone.length <= 6` merchant-detection bug (Dashboard page)
### Removed
- 5 dead/orphaned API routes (`/api/auth/*` ×3, root `/api/bills`, root `/api/users`)
### Security
- `npm audit`: 15 → 12 vulnerabilities via non-breaking fix

## [0.11.0] — Phase 17: Documentation Package
### Added
- 18 documentation files covering SRS, architecture, database design, security, testing, user/admin guides, defect log, risk register, and this change log

---

**Versioning note**: this project has not reached a "1.0" release in the
sense of a tested, deployed, production-ready system — see
`docs/22_Risk_Register.md` R-01. Version numbers above track development
milestones within this AI-assisted build process, not a formal semantic
versioning commitment.
