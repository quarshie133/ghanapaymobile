# Netlify Deployment Guide — GhanaPay Mobile

GUI-first, via app.netlify.com. Netlify CLI isn't required for any of this.

## 1. Connect the repository

1. Push this project to a GitHub repository (if you haven't already).
2. In Netlify: **Add new site → Import an existing project → Deploy with GitHub**.
3. Authorize Netlify to access your GitHub account, select the repo.

## 2. Build settings

Netlify's Next.js Runtime auto-detects most of this, but verify:
- **Build command**: `npm run build`
- **Publish directory**: leave as Netlify's Next.js Runtime default (don't hand-set this to `.next` — the Next.js Runtime plugin handles it differently than a static export).

## 3. Environment variables

**Site settings → Environment variables → Add a variable**, one at a time. Set all of these (values from your Firebase Console — see `docs/15_FIREBASE_GUI_SETUP_GUIDE.md`):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY

SCHEDULED_PAYMENTS_CRON_SECRET
```

The `NEXT_PUBLIC_FIREBASE_*` ones already have working hardcoded defaults in `src/lib/firebase.ts`, so they're optional here unless you want Netlify pointed at a different Firebase project than your local dev. The `FIREBASE_ADMIN_*` and `SCHEDULED_PAYMENTS_CRON_SECRET` ones are **required** — without them, every API route that touches the wallet/KYC/scheduled payments will fail in production, and scheduled payments will never execute.

For `SCHEDULED_PAYMENTS_CRON_SECRET`, generate any long random string yourself (a password generator works fine) — it just needs to match between this env var and what the scheduled function sends.

## 4. Deploy

Click **Deploy site**. Netlify builds and deploys automatically on every push to your default branch after this.

## 5. Add the Netlify domain to Firebase's authorized domains

Once deployed, copy your Netlify URL (e.g. `your-site-name.netlify.app`) and add it in **Firebase Console → Authentication → Settings → Authorized domains** — see `docs/15_FIREBASE_GUI_SETUP_GUIDE.md` §3. Google sign-in will fail on the live site until you do this.

## 6. Scheduled payments — the cron trigger

`netlify/functions/run-scheduled-payments.mts` is a **Netlify Scheduled Function**. Netlify detects it automatically from the file living under `netlify/functions/` with an exported `config.schedule` — there's no separate dashboard toggle to find for this specific mechanism, but two things determine whether it actually works:

1. **The env vars in step 3 must be set** (`SCHEDULED_PAYMENTS_CRON_SECRET` specifically) — the function reads it via `process.env` at runtime, same as any other Netlify Function.
2. **Netlify's current pricing is credit-based** (as of 2026) rather than a flat free/paid split — the free plan includes 300 credits/month shared across bandwidth, deploys, and function compute, and Scheduled Functions run fine on the free tier but consume credits from that same pool every time they fire. Running every 15 minutes is ~2,880 invocations/month; check **Site settings → Billing → Usage** to see actual credit consumption once it's live, since exact costs depend on your function's execution time. If credits run out mid-month, the free plan doesn't auto-recharge — everything on the site pauses until the next cycle, not just the scheduled function. Pricing details change over time — verify current numbers at Netlify's own pricing page before relying on this for a production deployment.

You can verify the function is registered: **Netlify dashboard → your site → Functions tab** — `run-scheduled-payments` should be listed with a schedule.

## 7. Debugging failed deployments

- **Build fails on `firebase-admin` import errors**: almost always means `FIREBASE_ADMIN_PRIVATE_KEY` isn't set correctly — check for missing quotes or literal `\n` vs real newlines (see setup guide §10).
- **Site builds but API routes 500**: check **Functions → [route name] → real-time logs** in the Netlify dashboard for the actual error — `firebase-admin.ts` throws a descriptive error naming which env var is missing.
- **Google sign-in fails only in production**: almost always the authorized-domains step (§5 above).
