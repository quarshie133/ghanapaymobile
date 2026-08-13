import { getApps, getApp, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * SERVER-ONLY. This file must never be imported from a Client Component —
 * it reads a private service account key from environment variables that
 * are NOT prefixed with NEXT_PUBLIC_, so Next.js never bundles them into
 * client JS. Only import this from route handlers (src/app/api/**) or
 * other server-only code.
 *
 * Credential source: Firebase Console → Project Settings → Service Accounts
 * → "Generate new private key" (downloads a JSON file). See
 * docs/15_FIREBASE_GUI_SETUP_GUIDE.md §11 for the exact GUI steps.
 *
 * Required env vars (set in .env.local for dev, and in Netlify's dashboard
 * for production — NEVER commit these):
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY   (keep the \n escapes — see setup guide)
 */

function getAdminApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // .env files store literal "\n" — convert back to real newlines.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "[firebase-admin] Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / " +
        "FIREBASE_ADMIN_PRIVATE_KEY. Generate a service account key in Firebase Console " +
        "(Project Settings → Service Accounts) and set these in .env.local. " +
        "See docs/15_FIREBASE_GUI_SETUP_GUIDE.md §11."
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

let _auth: Auth | null = null;
let _db: Firestore | null = null;

/** Lazily-initialized so a missing credential only throws when a route actually needs it. */
export function adminAuth(): Auth {
  if (!_auth) _auth = getAuth(getAdminApp());
  return _auth;
}

export function adminDb(): Firestore {
  if (!_db) _db = getFirestore(getAdminApp());
  return _db;
}
