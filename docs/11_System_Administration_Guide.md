# System Administration Guide — GhanaPay Mobile

For administrators operating a deployed instance of this application.

## 1. Admin login

Go to `/admin-login` — a URL separate from the customer `/login`, though
it uses the same underlying account system. Only accounts with
`role: "administrator"` in Firestore can sign in here; anything else is
rejected with an explicit message, not silently let through.

## 2. Promoting a user to administrator

There is **no in-app way to do this**, by design — a client should never
be able to grant itself elevated privileges.

1. Firebase Console → Firestore Database → Data tab.
2. Navigate to `users/{their uid}`.
3. Manually change the `role` field from `"customer"` to `"administrator"`.
4. **Have that person log out and log back in** — their browser session
   won't pick up the new role until the next sign-in (the client only
   fetches the profile once, on login).

Full steps: `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` §9.

## 3. User management

`/admin/users` shows every registered user with real account status
(Firebase Auth `disabled` flag — not a cosmetic label) and real wallet
balance.

- **Suspend**: click Suspend on any row. This calls Firebase Auth's
  `updateUser({disabled: true})` — the account genuinely cannot sign in
  afterward, immediately.
- **Restore**: reverses it.
- You cannot suspend your own admin account (blocked server-side).

## 4. KYC review

`/admin/kyc` shows the real review queue, filterable by status.

1. Click a row (or use Approve/Reject directly from the table for
   pending items).
2. To view a submitted document, click it in the detail panel — this
   generates a 5-minute signed URL and opens it in a new tab. The link
   expires; if you need to look again, click it again.
3. Approve bumps the user to Tier 3 automatically. Reject leaves a note
   field the applicant sees, and lets them resubmit (which returns the
   record to `pending_review`).

## 5. Transaction monitoring

`/admin/transactions` — real, cross-user ledger view. Filterable by type,
searchable, exportable to CSV. This is a read-only view; there is no
admin action to reverse or modify a transaction (not built — a real
system would need a reversal/refund flow with its own audit trail, which
doesn't exist here).

## 6. Reports

`/admin/reports` — only **Transaction Summary** actually generates a
report (a real CSV of transactions in a selected date range). The other 5
report types are shown for illustration and are explicitly disabled.

## 7. Fraud alerts

`/admin/fraud` — **this is demo data, not live detection.** A banner on
the page says so directly. Do not treat anything shown here as evidence
of actual suspicious activity.

## 8. System monitoring

There is no built-in monitoring/alerting system. To check system health:
- **Firebase Console → Firestore → Usage tab**: read/write volume, storage size.
- **Firebase Console → Authentication → Users**: registration count, recent sign-ins.
- **Netlify dashboard → Functions tab**: invocation counts, error logs per API route.
- **Netlify dashboard → Functions → run-scheduled-payments**: confirms the
  scheduled-payments cron is actually firing (see §10).

## 9. Common problems

| Symptom | Likely cause | Fix |
|---|---|---|
| "Invalid or expired token" errors | Firebase Admin SDK misconfigured, or project ID mismatch between client config and service account | Check server logs (now logged — see `server-auth.ts`) for the real underlying error |
| Dashboard/sidebar numbers don't match detail pages | Should no longer happen (fixed in Phase 12/16 — both now query the same source) | If it recurs, check whether a new aggregate was added that doesn't follow the "single source of truth" pattern (`docs/04_System_Design.md` §2) |
| Transaction history query fails on first use | Missing Firestore composite index | Click the auto-generated link in the error message to create it — see `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` §5a |
| Scheduled payments never execute | Netlify Scheduled Function not deployed/configured, or `SCHEDULED_PAYMENTS_CRON_SECRET` not set | See `docs/16_NETLIFY_DEPLOYMENT_GUIDE.md` §6 |

## 10. Verifying scheduled payments are actually running

The code existing is not the same as it running. Check:
1. Netlify dashboard → Functions → confirm `run-scheduled-payments` is
   listed with a schedule.
2. Check its logs for regular successful invocations.
3. As a manual test, call the endpoint yourself with the secret header:
   `curl -X POST https://your-site.netlify.app/api/scheduled/run -H "x-cron-secret: YOUR_SECRET"`

## 11. Backup and recovery

**No custom backup strategy has been built.** Firestore has its own
built-in redundancy (Google-managed), but this project doesn't implement
point-in-time backups, export scheduling, or a tested recovery procedure.
For anything beyond an academic demo, this would need to be built — see
`docs/13_Maintenance_and_Future_Evolution.md`.

## 12. Security procedures

See `docs/12_Security_Architecture.md` for the full architecture. Day-to-day:
- Never share the Firebase Admin SDK service account key or the
  `SCHEDULED_PAYMENTS_CRON_SECRET` — both are real secrets.
- Rotate the service account key via Firebase Console immediately if it's
  ever exposed (e.g., accidentally committed).
- Review `npm audit` output periodically — 12 known vulnerabilities were
  unresolved as of `docs/SECURITY_TEST_REPORT.md`; check whether that's
  changed.
