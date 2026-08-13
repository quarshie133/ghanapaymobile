# Firebase GUI Setup Guide — GhanaPay Mobile

Everything here is done by clicking through **console.firebase.google.com** — no
Firebase CLI required. Your project (`ghanapaymobile`) already exists, so most
"create" steps below are really "verify" steps for you.

---

## 1. Confirm the project and web app

1. Go to https://console.firebase.google.com and open the **ghanapaymobile** project.
2. Left sidebar → ⚙️ **Project settings** → **General** tab.
3. Under "Your apps," confirm there's a Web app registered. Its config should match:
   - Project ID: `ghanapaymobile`
   - Auth domain: `ghanapaymobile.firebaseapp.com`
   - Storage bucket: `ghanapaymobile.firebasestorage.app`
4. These values are already hardcoded as working defaults in
   `src/lib/firebase.ts` — **no `.env.local` file is required** to run the
   app. You only need a `.env.local` (see `.env.example`) if you want to
   point the app at a *different* Firebase project later (e.g. Netlify
   environment-specific config, or a personal/staging project).

## 2. Enable Authentication providers

1. Left sidebar → **Build → Authentication**.
2. Click **Get started** if you haven't already.
3. Go to the **Sign-in method** tab.
4. Enable **Email/Password**:
   - Click it → toggle **Enable** → **Save**.
5. Enable **Google**:
   - Click it → toggle **Enable**.
   - Set a "Project support email" (required) → **Save**.
6. (Optional, later) Leave Phone, Facebook, etc. disabled for now — the app
   only uses Email/Password + Google today.

## 3. Add authorized domains (needed before Netlify deploy works)

1. Still in **Authentication → Settings → Authorized domains**.
2. `localhost` is there by default (for local dev).
3. Once you deploy to Netlify, add your Netlify domain here too, e.g.
   `ghanapaymobile.netlify.app` (or your custom domain). **Google sign-in will
   fail on Netlify until you do this step.**

## 4. Create the Firestore database

1. Left sidebar → **Build → Firestore Database**.
2. If it says "Create database":
   - Click **Create database**.
   - Choose a location close to your users — since `databaseURL` in your
     config is `europe-west1`, pick **eur3 (europe-west)** for consistency.
   - Start in **Production mode** (not Test mode). Production mode denies all
     reads/writes by default until you publish rules — which is what we want,
     since we're about to publish real rules.
3. If Firestore already exists, just confirm you can see the **Data** tab.

## 5. Publish Firestore Security Rules

1. In Firestore Database, click the **Rules** tab.
2. Open `firestore.rules` from the repo root, copy its full contents.
3. Paste it into the console editor, replacing what's there.
4. Click **Publish**.
5. **Re-do this step every time `firestore.rules` changes in the repo** — the
   file in git is the source of truth, but Firestore only enforces whatever
   was last pasted into the console.

Current rules cover `users`, `wallets`, and `walletTransactions`.

### 5a. Expect an index prompt the first time you view transaction history

`GET /api/wallet/transactions` queries `walletTransactions` filtered by
`uid` and sorted by `createdAt` — Firestore requires a **composite index**
for that combination (equality filter + orderBy on a different field). The
first time this query actually runs, it will fail with an error like:

```
FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

That URL in the error message takes you straight to a pre-filled "Create
index" screen in the console — click **Create index**, wait a minute or two
for it to build, then retry. This is normal, expected Firestore behavior
the first time a new composite query runs, not a bug in the code.

## 6. Configure Storage (for KYC documents — not wired up in the app yet)

1. Left sidebar → **Build → Storage**.
2. Click **Get started**, same region as Firestore, production mode.
3. **Rules** tab → paste in `storage.rules` from the repo root → **Publish**.
4. This is set up ahead of the KYC upload feature so the security boundary
   (private per-user documents, never public) exists before any real
   documents are ever written.

## 7. Enable App Check (recommended before going further into build-out)

1. Left sidebar → **Build → App Check**.
2. Register the web app, choose **reCAPTCHA v3** (or v3 Enterprise) as the
   provider, and follow the on-screen instructions to get a site key.
3. This step is **not yet wired into the app's code** — flagging it here so
   it isn't forgotten, but it should be added when we get to the Security
   phase, not silently claimed as done.

## 8. Create a test user (optional, for manual QA)

1. **Authentication → Users** tab → **Add user**.
2. Enter a test email + password.
3. This creates the Firebase Auth account only — the matching Firestore
   `users/{uid}` profile document gets created automatically the first time
   that account signs into the app (see `src/lib/user-profile.ts`).

## 9. Promoting a user to administrator or merchant

There is currently **no in-app way to do this**, by design — a client should
never be able to grant itself elevated privileges. Until an admin-management
Cloud Function or a properly audited admin action is built:

1. **Firestore Database → Data** tab.
2. Navigate to `users/{uid}` for the account you want to promote.
3. Manually edit the `role` field from `customer` to `administrator` or
   `merchant`.

This works today because the security rule for `update` only blocks the
*client SDK* from changing `role` — direct edits from the Firebase Console
(which uses the Admin SDK under the hood) bypass Firestore rules entirely.
That's expected Firebase behavior, not a hole in the rules.

## 10. Generate a service account key (needed for the wallet backend)

The wallet ledger (`src/lib/wallet-ledger.ts`) runs server-side using the
Firebase **Admin SDK**, which needs its own credential — separate from the
public web config in step 1. This one **is** a real secret.

1. **Project settings → Service accounts** tab.
2. Click **Generate new private key** → confirm. A JSON file downloads.
3. Open that JSON file. You need three values from it: `project_id`,
   `client_email`, and `private_key`.
4. In your `.env.local` (create it from `.env.example` if you haven't),
   add:
   ```
   FIREBASE_ADMIN_PROJECT_ID=<project_id from the JSON>
   FIREBASE_ADMIN_CLIENT_EMAIL=<client_email from the JSON>
   FIREBASE_ADMIN_PRIVATE_KEY="<private_key from the JSON, keep the \n as literal \n>"
   ```
   The private key in the JSON file has real newlines; when pasting it into
   a `.env` file, either keep it wrapped in quotes with `\n` escape
   sequences (as the JSON already has them) or your editor's paste may
   preserve them automatically — either way, `src/lib/firebase-admin.ts`
   converts `\n` back to real newlines before using it.
5. **Delete the downloaded JSON file once you've copied the three values**,
   or move it somewhere outside the project folder — it should never sit in
   a git-tracked directory even temporarily.
6. When you deploy to Netlify, set these same three variables in Netlify's
   **Site settings → Environment variables** — never commit them, and never
   put them in a file that gets zipped/shared casually (unlike the public
   web config from step 1, this one grants real admin access to your
   Firestore data if it leaks).

## 11. Verify connectivity

1. Run the app locally: `npm run dev`.
2. Go to `/register`, create an account.
3. In Firebase Console → Authentication → Users, confirm the new user appears.
4. In Firestore → Data → `users` collection, confirm a matching document
   exists with `role: "customer"`, `tier: 1`.

---

### What's *not* covered by this guide yet

Wallets, transactions, KYC, scheduled payments, and their collections/rules
don't exist yet — this guide will be extended as each phase is implemented,
rather than documenting infrastructure that isn't there.
