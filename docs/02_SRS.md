# Software Requirements Specification (SRS) — GhanaPay Mobile

CSCD602 Advanced Software Engineering Capstone Project

**Status key used throughout this document:**
✅ Implemented and verified (typecheck + build + logic tests)
⚠️ Partially implemented — see note
🔲 Not implemented — explicitly future work or out of scope

This SRS describes the system as it actually exists at the time of
writing (see `docs/PROJECT_AUDIT.md` for the full phase-by-phase build
history). It does not describe an aspirational future system — where
something isn't built, it's marked 🔲, not silently assumed.

## 1. Introduction

### 1.1 Purpose
GhanaPay Mobile is an academic mobile-money wallet application built for
the CSCD602 capstone. It demonstrates a full-stack Next.js + Firebase
architecture with real (not simulated) authentication, atomic wallet
ledger transactions, KYC document handling, and role-based administration
— while being explicit about which pieces (payment provider integration,
fraud detection, bulk payments) are sandboxed or not yet built, per the
project's own academic-integrity requirements.

### 1.2 Scope
In scope: customer wallet operations (top-up, withdrawal, peer transfer,
bill payment, airtime purchase), KYC verification workflow, linked
(sandbox) external accounts, scheduled recurring payments, notifications,
and an administrator console (user management, transaction monitoring,
KYC review, reporting).

Out of scope (see §1.4): real integration with any bank, mobile money
provider, or telecom network; real fraud/anomaly detection; bulk payment
processing.

### 1.3 Intended audience
Course instructors/graders, the project team, and any future maintainer
of this codebase.

### 1.4 Explicit non-goals
This is a sandbox academic project, not a production financial system.
Specifically NOT implemented, by design:
- Real payment rails (MTN MoMo, Telecel Cash, bank transfer APIs)
- Real biller integration (ECG, GWCL, DStv account verification)
- AI-based document/face verification for KYC (review is a manual admin decision)
- Fraud/anomaly detection (flagged in the original project brief as future work)
- Bulk payment CSV processing
- Rate limiting or Firebase App Check (flagged as unimplemented in `docs/12_Security_Architecture.md`)

## 2. Overall description

### 2.1 Product perspective
A Next.js 16 (App Router) web application, deployed to Netlify, backed by
Firebase (Authentication, Firestore, Storage). Server-side logic runs as
Netlify serverless functions via Next.js API routes, using the Firebase
Admin SDK for privileged operations. See `docs/05_Architecture.md`.

### 2.2 User classes
| Role | Description | Status |
|---|---|---|
| Customer | Default role for every new account | ✅ |
| Merchant | Same account system, `role: "merchant"`; sees sales-oriented analytics (real transfers received) | ✅ |
| Administrator | Manually promoted via Firebase Console (never self-assignable); full admin console access | ✅ |

### 2.3 Operating environment
Browser-based (any modern browser). Server: Node.js via Netlify's Next.js
Runtime. Database: Cloud Firestore. File storage: Firebase Storage.

### 2.4 Assumptions and dependencies
- Assumes a configured Firebase project (see `docs/15_FIREBASE_GUI_SETUP_GUIDE.md`)
- Assumes a Netlify account for deployment (see `docs/16_NETLIFY_DEPLOYMENT_GUIDE.md`)
- Assumes Ghanaian phone number formats for all phone-based features

## 3. Functional Requirements

### 3.1 Authentication
| ID | Requirement | Status |
|---|---|---|
| FR-001 | Users can register with email + password | ✅ |
| FR-002 | Users can sign in with email + password | ✅ |
| FR-003 | Users can sign in with Google | ✅ |
| FR-004 | Users can reset their password via email | ✅ |
| FR-005 | Users can log out | ✅ |
| FR-006 | Every new account defaults to role "customer"; a client can never self-assign "administrator" or "merchant" | ✅ enforced by Firestore Security Rules |
| FR-007 | Non-admin routes reject unauthenticated requests | ✅ |
| FR-008 | Admin routes reject non-administrator accounts | ✅ |

### 3.2 Wallet
| ID | Requirement | Status |
|---|---|---|
| FR-010 | A user has a wallet with a real-time balance | ✅ |
| FR-011 | A user can top up their wallet (sandbox — no real funding source) | ✅ |
| FR-012 | A user can withdraw from their wallet (sandbox) | ✅ |
| FR-013 | Wallet balance changes happen atomically, server-side; the client never computes its own balance | ✅ |
| FR-014 | Duplicate/double-submitted requests don't double-apply (idempotency keys) | ✅ |
| FR-015 | A user can view their transaction history | ✅ |

### 3.3 Transfers
| ID | Requirement | Status |
|---|---|---|
| FR-020 | A user can send money to another GhanaPay user by phone number | ✅ |
| FR-021 | Recipient is resolved server-side; a client cannot forge a transfer to an arbitrary account | ✅ |
| FR-022 | Sender and recipient balances update atomically — both or neither | ✅ |
| FR-023 | A daily transfer limit is enforced server-side, not just in the UI | ✅ |
| FR-024 | A user cannot transfer to themselves | ✅ |

### 3.4 Bills & Airtime
| ID | Requirement | Status |
|---|---|---|
| FR-030 | A user can pay a bill (sandbox biller verification — no real biller API exists) | ✅ |
| FR-031 | A user can buy airtime for a Ghanaian phone number | ✅ |
| FR-032 | Both debit the wallet atomically with an insufficient-funds check | ✅ |

### 3.5 Linked Accounts
| ID | Requirement | Status |
|---|---|---|
| FR-040 | A user can link an external (sandbox) bank/mobile-money account | ✅ |
| FR-041 | A user can unlink an account, set a default | ✅ |
| FR-042 | "Verification" of a linked account is a sandbox stub — no real bank/MoMo API is called | ✅ (honestly labeled) |

### 3.6 KYC
| ID | Requirement | Status |
|---|---|---|
| FR-050 | A user can upload identity documents (Ghana Card, selfie, address proof) | ✅ |
| FR-051 | Documents are stored privately — never a public/permanent link | ✅ |
| FR-052 | An administrator can review and approve/reject a submission | ✅ |
| FR-053 | Approval upgrades the user's tier | ✅ |
| FR-054 | An administrator views a document via a short-lived (5-minute) signed URL | ✅ |
| FR-055 | Document authenticity/face-match verification | 🔲 not implemented — manual review only |

### 3.7 Scheduled Payments
| ID | Requirement | Status |
|---|---|---|
| FR-060 | A user can schedule a recurring transfer, bill, or airtime payment | ✅ |
| FR-061 | Scheduled payments execute without the user's browser open | ✅ — requires a Netlify Scheduled Function to actually be deployed and firing; see `docs/16_NETLIFY_DEPLOYMENT_GUIDE.md` §6 |
| FR-062 | A failed scheduled payment is recorded, not silently dropped | ✅ |

### 3.8 Notifications
| ID | Requirement | Status |
|---|---|---|
| FR-070 | A user receives an in-app notification for wallet transactions and KYC decisions | ✅ |
| FR-071 | A user can mark notifications as read | ✅ |
| FR-072 | Notifications are server-created only — a client cannot forge one | ✅ |

### 3.9 Admin console
| ID | Requirement | Status |
|---|---|---|
| FR-080 | An administrator can view all registered users | ✅ |
| FR-081 | An administrator can suspend/reactivate a user's account (real, via Firebase Auth) | ✅ |
| FR-082 | An administrator can view all transactions across all users | ✅ |
| FR-083 | An administrator can view an aggregated overview dashboard | ✅ real data, consistent with detail pages |
| FR-084 | An administrator can generate a transaction report | ✅ Transaction Summary only; 5 other report types shown but explicitly disabled |
| FR-085 | Fraud detection / alerting | 🔲 explicitly future work per original project brief |
| FR-086 | Bulk payment processing | 🔲 explicitly flagged not implemented |

### 3.10 Analytics
| ID | Requirement | Status |
|---|---|---|
| FR-090 | A user can view monthly spending/income summary | ✅ |
| FR-091 | Spending is broken down by category | ✅ — categories are the real transaction types (Bills, Airtime, etc.), not fabricated granular categories |
| FR-092 | Savings goals | 🔲 not implemented — no such feature exists |

## 4. Non-Functional Requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-001 | **Security**: financial writes never trusted from the client | ✅ — see `docs/12_Security_Architecture.md` |
| NFR-002 | **Security**: Firestore Security Rules deny all client writes to financial collections | ✅ |
| NFR-003 | **Security**: KYC documents never publicly accessible | ✅ |
| NFR-004 | **Availability**: dependent on Firebase's and Netlify's uptime SLAs | ⚠️ not independently measured |
| NFR-005 | **Usability**: responsive design across mobile/desktop | ✅ (inherited from original UI scaffold) |
| NFR-006 | **Maintainability**: TypeScript strict typing throughout | ✅ |
| NFR-007 | **Testability**: pure business logic separated from I/O for unit testing | ✅ — see `docs/09_Testing_Report.md` |
| NFR-008 | **Scalability**: designed for sandbox/demo scale, not evaluated at production load | ⚠️ several queries capped at 300–2000 documents; see `docs/PROJECT_AUDIT.md` for specifics |
| NFR-009 | **Compatibility**: modern evergreen browsers | ✅ assumed, not cross-browser tested |

## 5. Constraints

- **Academic project constraints**: built within a single extended development session; no dedicated QA team, no live user testing.
- **Firebase constraints**: Firestore query limitations (composite indexes required for combined equality + orderBy queries — documented in `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` §5a); no native full-text search.
- **Netlify constraints**: Scheduled Functions consume credits from a shared monthly pool (see `docs/16_NETLIFY_DEPLOYMENT_GUIDE.md` §6); free-tier limits apply.
- **No real third-party API access**: no sandbox credentials exist for any real Ghanaian payment/telecom/banking provider, hence the sandbox-provider pattern throughout.
- **Sandbox network restriction during development**: the Firebase Local Emulator Suite could not be run in the development sandbox (blocked from `storage.googleapis.com`); rules tests were written but not executed — see `docs/SECURITY_TEST_REPORT.md`.

## 6. Assumptions

- The project team will supply their own Firebase project and Netlify account for deployment.
- End users are assumed to have valid Ghanaian phone numbers for phone-based features.
- "This month" / "today" calculations use UTC in several places (see `docs/PROJECT_AUDIT.md` Phase 12) rather than West Africa Time — a known simplification, not corrected.

## 7. Appendix: Real API surface (for traceability)

37 API routes exist under `src/app/api/`, covering authentication-gated
wallet operations, transfers, bills, airtime, linked accounts, KYC,
scheduled payments, notifications, analytics, and admin functions. Full
endpoint-by-endpoint documentation is in `docs/17_API_Documentation.md`.
