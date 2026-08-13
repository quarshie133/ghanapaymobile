import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Public web config for the ghanapaymobile Firebase project. These are
// PUBLIC client identifiers, not secrets — Firebase's own docs are explicit
// that this object is meant to ship in the browser bundle. Real security
// comes from Firebase Authentication + Firestore/Storage Security Rules +
// App Check, never from hiding these values. See
// docs/15_FIREBASE_GUI_SETUP_GUIDE.md.
//
// Hardcoded here as a working default so the app runs immediately with no
// setup step. NEXT_PUBLIC_FIREBASE_* env vars (e.g. set in Netlify's
// dashboard) override these defaults when present — useful if the project
// ever needs to point at a different Firebase project (a staging project,
// a teammate's own project, etc.) without touching this file.
const FIREBASE_DEFAULTS = {
  apiKey: "AIzaSyDk6oeb0Mut7vxAwGKirIzRGWFssYUt5Aw",
  authDomain: "ghanapaymobile.firebaseapp.com",
  databaseURL: "https://ghanapaymobile-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ghanapaymobile",
  storageBucket: "ghanapaymobile.firebasestorage.app",
  messagingSenderId: "1021996844104",
  appId: "1:1021996844104:web:76e71d5c807aa56c0b847d",
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FIREBASE_DEFAULTS.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FIREBASE_DEFAULTS.authDomain,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || FIREBASE_DEFAULTS.databaseURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FIREBASE_DEFAULTS.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FIREBASE_DEFAULTS.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_DEFAULTS.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FIREBASE_DEFAULTS.appId,
};

// Next.js can re-evaluate this module across hot reloads / server + client
// renders, so guard against re-initializing the app.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
