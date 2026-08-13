# Maintenance and Future Evolution — GhanaPay Mobile

## 1. Maintenance types, with real examples from this project

### Corrective maintenance (fixing defects)
Already extensively demonstrated — see `docs/21_Defect_Log.md`'s 12 real
entries. Examples: DEF-003 (date overflow bug), DEF-010 (unauthenticated
endpoint), DEF-012 (fictional data shape in History page mapping).

### Adaptive maintenance (adapting to environment changes)
Not yet needed in this project's short history, but anticipated: Firebase
SDK version upgrades, Next.js version upgrades (12 `npm audit`
vulnerabilities remain partly because a full major-version bump wasn't
performed — see `docs/SECURITY_TEST_REPORT.md`).

### Perfective maintenance (improving without changing behavior)
Example already done: the pure-logic/I/O separation refactor in Phase 15
(`statements-core.ts`, `schedule-dates.ts`) didn't change any user-facing
behavior — it made the code testable. Another example: replacing
`localStorage`-based auth with Firebase Authentication was corrective +
perfective combined (fixed a non-functional feature AND improved the
architecture).

### Preventive maintenance (reducing future defect risk)
Example: the "single source of truth" pattern adopted after DEF-006
prevents a whole class of future dashboard-drift bugs from being
possible, not just fixing the one instance. Example: the systematic
API-route-authentication audit in Phase 16 is explicitly recommended in
`docs/SECURITY_TEST_REPORT.md` §3 to become a repeatable/automated check
rather than a one-time manual pass.

## 2. Version control and dependency strategy

- Git-based version control assumed (see `docs/23_Change_Log.md` for the
  real development history as it would map to versions).
- Dependency updates: `npm audit fix` (safe subset) was run once
  (Phase 16); `npm audit fix --force` was deliberately NOT run without an
  explicit decision, since it risks breaking changes (Next.js version
  bump outside the stated range). This remains an open maintenance task.

## 3. Version roadmap

```
Version 1.0 (current)
  Real auth, wallet ledger, KYC, admin console, notifications,
  scheduled payments, analytics, statements. Sandboxed payment/biller
  integration. 29 automated tests. Documentation package.
     │
     ▼
Version 1.1 (near-term)
  - Run npm run test:rules against a live emulator; fix anything it finds
  - Manual end-to-end testing against live Firebase (docs/22_Risk_Register.md R-01)
  - Triage and resolve remaining npm audit findings
  - Real bulk payment processing (CSV parsing, batch transfers, partial-failure handling)
     │
     ▼
Version 2.0 (medium-term)
  - Real payment provider integration (MTN MoMo, Telecel Cash APIs)
  - Real biller verification (ECG, GWCL, DStv account lookup)
  - Firebase App Check (flagged as unimplemented since Phase 4)
  - Rate limiting on API routes
  - Real branded PDF statement generation (vs. current print-to-PDF)
  - Remaining 5 admin report types
     │
     ▼
Version 3.0 (long-term / future work, explicitly per original project brief §26)
  - Fraud/anomaly detection
  - AI-based KYC document/face verification
  - Savings goals feature (full CRUD, contribution tracking)
  - Multilingual support
  - Biometric authentication
  - Personalized financial insights / spending predictions
```

## 4. Explicitly-flagged future enhancements (per original brief, not fabricated as "planned")

The original project brief itself (§26) names these as future work, not
promises of what this codebase will become: real payment-provider
integrations, fraud detection, anomaly detection, an AI financial
assistant, spending prediction, personalized insights, multilingual
support, biometric authentication, advanced merchant tools. None of these
have implementation timelines — listed here for completeness, not as a
commitment.

## 5. Technology migration considerations

- **Firestore → a relational database**: would require redesigning the
  data model (Firestore's document/collection shape doesn't map 1:1 to
  tables) — not a drop-in swap. Would gain real `JOIN`/`SUM()` at the
  cost of Firebase's real-time sync and simpler security rules.
- **Netlify → another hosting platform**: the Next.js API routes are
  fairly portable (standard Next.js), but the Netlify Scheduled Function
  (`netlify/functions/run-scheduled-payments.mts`) is Netlify-specific
  and would need reimplementing (e.g., as a Vercel Cron Job or a separate
  always-on cron service) on another platform.

## 6. Preventive practice going forward

The single most valuable process established during this project's
development — worth continuing, not treated as a one-time event — is
periodic, systematic auditing (Phase 16's API-route pass, Phase 14's
"unaudited pages" pass) rather than assuming each feature phase stays
correct forever. Several of the most serious defects found (DEF-008,
DEF-010, DEF-011, DEF-012) were not caught by the phase that introduced
them — they were caught by a later, deliberate audit. Future maintainers
should schedule these audits regularly, not only when something visibly
breaks.
