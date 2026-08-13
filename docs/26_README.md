# GhanaPay Mobile

Academic mobile-money wallet application — CSCD602 Advanced Software
Engineering Capstone Project, University of Ghana.

## What this is

A Next.js + Firebase mobile wallet application demonstrating: real
authentication, an atomic server-side wallet ledger, KYC document
verification, peer-to-peer transfers, scheduled payments, and a
role-based admin console. Built as an academic sandbox — payment provider
integration, biller verification, and fraud detection are explicitly
simulated where no real third-party API access exists, and are labeled as
such throughout the codebase and documentation rather than presented as
real.

**AI-assisted development**: substantial parts of this codebase were
built with AI assistance (Claude). Documentation honestly reflects the
actual development process — see `docs/PROJECT_AUDIT.md` for a
phase-by-phase build history, including real defects found and fixed
(`docs/21_Defect_Log.md`).

## Tech stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (serverless via Netlify), Firebase Admin SDK
- **Database**: Cloud Firestore
- **Auth**: Firebase Authentication (email/password + Google)
- **Storage**: Firebase Storage (KYC documents, private)
- **Hosting**: Netlify
- **Testing**: Jest (unit), `@firebase/rules-unit-testing` (Security Rules — written but not yet executed, see Known Limitations)

## Main features

| Feature | Status |
|---|---|
| Authentication (email/password, Google, password reset) | ✅ Fully working |
| Wallet (balance, top-up, withdrawal) | ✅ Real, atomic, sandboxed funding source |
| Peer-to-peer transfers | ✅ Real, server-side recipient resolution |
| Bill payments & airtime | ✅ Real wallet debit; sandbox biller verification |
| Linked (external) accounts | ✅ Sandbox — no real bank/MoMo API |
| KYC verification | ✅ Real document upload + admin review; no automated AI verification |
| Scheduled payments | ✅ Real engine; needs Netlify Scheduled Function deployed to actually fire |
| Notifications | ✅ Real, server-created |
| Admin: users, transactions, overview | ✅ Real data |
| Admin: reports | ⚠️ 1 of 6 report types implemented; rest clearly labeled "not implemented" |
| Fraud detection | 🔲 Explicitly future work — demo data only |
| Bulk payments | 🔲 Explicitly flagged not implemented |
| Analytics | ✅ Real; savings goals not implemented |

## Live application

`TO BE COMPLETED BY PROJECT TEAM` (fill in your Netlify URL once deployed)

## Admin URL

`/admin-login` — separate admin sign-in page. Uses the same account
system as customers; rejects any account without `role: "administrator"`.

## Test accounts

`TO BE COMPLETED BY PROJECT TEAM` — do not commit real credentials here or
to GitHub. Use a private examiner document instead, per the original
project brief's own instruction.

## Local setup

```bash
git clone <your-repo-url>
cd ghanapaymobile
npm install
npm run dev
```

The app runs immediately with working Firebase config defaults hardcoded
for the `ghanapaymobile` project. For your own Firebase project, see
`docs/15_FIREBASE_GUI_SETUP_GUIDE.md`.

## Testing instructions

```bash
npm test              # 29 unit tests — pure logic, no live Firebase needed
npm run test:coverage # same, with coverage report
npm run test:rules    # Firestore Security Rules tests — needs the Firebase
                       # emulator; requires normal network access (this was
                       # blocked in the original AI-assisted dev sandbox —
                       # see docs/SECURITY_TEST_REPORT.md)
```

## Deployment

See `docs/16_NETLIFY_DEPLOYMENT_GUIDE.md` for the full GUI-based walkthrough.

## Known limitations (read before grading/demo)

Being upfront about these matters more than hiding them:

1. **Never tested against a live Firebase project or live deployment.**
   Every route/function was verified via `tsc --noEmit`, `npm run build`,
   and targeted logic scripts — not against real Firestore. See
   `docs/22_Risk_Register.md` R-01/R-02.
2. **Firestore Security Rules tests are written but unexecuted** — the
   development sandbox couldn't reach the Firebase emulator's download
   host. Run `npm run test:rules` yourself to get a real result.
3. **12 dependency vulnerabilities remain** after a safe (non-breaking)
   `npm audit fix` — see `docs/SECURITY_TEST_REPORT.md` §2.
4. **Several features are honestly labeled as unimplemented** rather than
   faked: fraud detection, bulk payments, 5 of 6 admin report types,
   savings goals, real biller/telecom/bank integration.
5. **This README itself has placeholder fields** (`TO BE COMPLETED BY
   PROJECT TEAM`) for information only the actual project team has
   (deployed URL, test credentials, group member names) — filling these
   in with real values is the project team's task, not something that
   should be fabricated.

## Special instructions for examiners

If reviewing the codebase directly: `docs/PROJECT_AUDIT.md` is the most
complete single record of what was built, in what order, and what was
found broken along the way — including issues the team found and fixed
themselves rather than issues found by review. `docs/21_Defect_Log.md`
specifically documents cases where fabricated or placeholder data was
found and removed, which may be of particular interest for an
academic-integrity review.
