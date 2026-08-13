# System Analysis — GhanaPay Mobile

## 1. Analysis of the starting point (AS-IS)

Before any development work began, the existing repository was audited
(see `docs/PROJECT_AUDIT.md` §1 for the full record). Key findings:

- A Next.js 16 App Router frontend with a complete route skeleton
  (customer dashboard, wallet, KYC, admin sections) already scaffolded —
  the UI structure was more complete than "just a login page."
- **No real backend existed.** Authentication was a custom JWT scheme
  writing to `localStorage`, pointed at an external API URL
  (`NEXT_PUBLIC_API_URL`) that was never actually running.
- **Every API route was a stub** returning hardcoded JSON with `// TODO`
  comments — wallet, transactions, users, bills, KYC.
- **All screen data came from `mock-data.ts`** — static arrays with no
  connection to anything a user actually did.
- No Firebase integration existed at all.

This AS-IS analysis directly shaped the build order: authentication
first (nothing else can be real without it), then the wallet ledger (the
financial core), then the surrounding features.

## 2. Requirements analysis

Requirements were derived from the original project brief (see
`docs/02_SRS.md` for the formalized FR/NFR list) and refined iteratively
as gaps were discovered. Two categories of requirement emerged during
development that weren't obvious from the brief alone:

- **"Make it actually work" requirements** discovered by testing existing
  UI against real data — e.g., the wallet page's top-up button required a
  `selectedAccountId` that could never be set because no linked-accounts
  feature existed yet (Defect Log DEF-004). These weren't in the original
  brief; they emerged from analyzing why existing code didn't function.
- **"Stop pretending this is real" requirements** — several screens
  displayed fabricated data as if genuine (fake KYC AI verification
  scores, invented admin activity logs). Analyzing these required judging
  not just "is this built" but "does this dishonestly claim to be built."

## 3. Feasibility analysis

### Technical feasibility
**Proven, not assumed** — the system was actually built and compiles/runs
(verified via `tsc --noEmit` and `npm run build` after every phase; see
`docs/PROJECT_AUDIT.md`). Firebase Authentication + Firestore + Storage,
combined with Next.js API routes as a server-side layer, proved
sufficient for every real feature attempted.

### Economic feasibility
Not applicable in the traditional sense — this is an academic project
with no budget constraints beyond Firebase's free tier and Netlify's
free/low-cost tiers (see `docs/22_Risk_Register.md` R-08 for a real
constraint around Netlify's credit-based pricing for Scheduled
Functions).

### Operational feasibility
The resulting system requires: a configured Firebase project (GUI setup
documented in `docs/15_FIREBASE_GUI_SETUP_GUIDE.md`), a Netlify account,
and — critically, and NOT yet done — end-to-end testing against a live
deployment. Operational feasibility for actual use (versus academic
demonstration) is unproven, since the system has never run against live
infrastructure (see `docs/22_Risk_Register.md` R-01).

## 4. Gap analysis — original scaffold vs. delivered system

| Area | AS-IS (original scaffold) | TO-BE (delivered) |
|---|---|---|
| Auth | Fake JWT, localStorage, no real backend | Real Firebase Authentication |
| Wallet | Hardcoded JSON, `// TODO` comments | Real atomic Firestore ledger |
| KYC | "Upload" sent `url: 'mock-url'`, status always fake "Tier 2 verified" for every user | Real Storage upload, real per-user status, real admin review |
| Admin dashboard | Hardcoded fake stats, fabricated AI verification scores | Real aggregated data, single source of truth with detail pages |
| Transaction history | Public unauthenticated endpoint, hardcoded data (found in later audit — Defect Log DEF-010) | Authenticated, real per-user data |

## 5. Constraints identified during analysis

See `docs/02_SRS.md` §5 for the formal list. The most consequential one
discovered during analysis rather than assumed upfront: **no real
third-party API access exists** for any Ghanaian bank, mobile money
provider, or telecom — this shaped the entire sandbox-provider pattern
used throughout (top-up, bill payment, airtime, linked accounts) rather
than being a late compromise.
