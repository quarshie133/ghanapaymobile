# Deployment Guide — GhanaPay Mobile

This is the overview; the two detailed, step-by-step guides are:
- `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` — Firebase Console setup, no CLI
- `docs/16_NETLIFY_DEPLOYMENT_GUIDE.md` — Netlify deployment, GUI-first

Read this document first for the overall order and checklist, then follow
the two detailed guides for the actual clicks.

## 1. Deployment order (matters — don't skip ahead)

1. **Firebase project setup first** (`15_FIREBASE_GUI_SETUP_GUIDE.md`)
   — you need real Firebase config values before Netlify deployment makes
   sense.
2. **Netlify deployment** (`16_NETLIFY_DEPLOYMENT_GUIDE.md`) — connects
   your repo, sets environment variables, deploys.
3. **Come back to Firebase Console** to add your live Netlify domain to
   Authentication's authorized domains — Google sign-in will fail on the
   live site until this step is done (§3 of the Firebase guide).
4. **Verify the Scheduled Function is registered** in Netlify's Functions
   tab, if you want scheduled payments to actually fire.

## 2. Pre-deployment checklist

- [ ] Firebase project created, Authentication providers enabled (Email/Password + Google)
- [ ] Firestore database created, `firestore.rules` published via Console
- [ ] Storage enabled, `storage.rules` published via Console
- [ ] Service account key generated (Admin SDK — a real secret, see setup guide §10)
- [ ] `SCHEDULED_PAYMENTS_CRON_SECRET` generated (any long random string you choose)
- [ ] Repository pushed to GitHub
- [ ] `npm run build` succeeds locally (confirms nothing is broken before deploying)
- [ ] `npm test` passes locally (29 unit tests)

## 3. Environment variables summary

Required in Netlify's dashboard (Site settings → Environment variables):

| Variable | Secret? | Source |
|---|---|---|
| `FIREBASE_ADMIN_PROJECT_ID` | No (but pair with the key below, which is) | Service account JSON |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | No | Service account JSON |
| `FIREBASE_ADMIN_PRIVATE_KEY` | **Yes — real secret** | Service account JSON |
| `SCHEDULED_PAYMENTS_CRON_SECRET` | **Yes — real secret** | You generate this yourself |
| `NEXT_PUBLIC_FIREBASE_*` (7 values) | No — public by design | Firebase Console → Project Settings |

The `NEXT_PUBLIC_FIREBASE_*` values are optional in Netlify because
`src/lib/firebase.ts` has working hardcoded defaults — only set them if
you want production pointed at a *different* Firebase project than local
dev.

## 4. Post-deployment verification

1. Visit your live Netlify URL, register a test account.
2. Confirm it appears in Firebase Console → Authentication → Users, and a
   matching document in Firestore → `users` collection.
3. Test Google sign-in specifically — this is the step most likely to
   fail if the authorized-domains step (§1.3 above) was skipped.
4. Top up the test account, confirm the balance updates and a
   `walletTransactions` document appears.
5. Check Netlify → Functions → confirm `run-scheduled-payments` is listed.

None of this has been performed by the development process that produced
this codebase — see `docs/22_Risk_Register.md` R-01. This checklist is
what real deployment verification would look like; it hasn't been
executed yet.

## 5. Rollback

Netlify keeps every previous deploy — "Deploys" tab → select an older
deploy → "Publish deploy" to roll back instantly. No database rollback
mechanism exists (see `docs/11_System_Administration_Guide.md` §11 on
backups — not built).

## 6. Debugging failed deployments

See `docs/16_NETLIFY_DEPLOYMENT_GUIDE.md` §7 for specific error patterns
and their fixes.
