import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { db } from "./firebase";
import { normalizeGhanaPhone } from "./phone";

export type UserRole = "customer" | "merchant" | "administrator";

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  phone: string | null;
  phoneNormalized: string | null;
  role: UserRole;
  tier: number;
  photoURL: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

const USERS_COLLECTION = "users";

/**
 * Reads a user's Firestore profile document. Returns null if it does not
 * exist yet (e.g. first-ever sign-in via Google before we've created it).
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

/**
 * Creates the Firestore profile document for a brand-new user.
 * IMPORTANT: role always defaults to "customer" here — a client can never
 * grant itself "administrator" or "merchant". Role elevation must happen
 * out-of-band (Firebase Console / an authenticated admin action / Cloud
 * Function), and Firestore Security Rules must reject any client write that
 * changes `role` on an existing document (see firestore.rules).
 */
export async function createUserProfile(
  user: FirebaseUser,
  extra?: { name?: string; phone?: string }
): Promise<UserProfile> {
  const phone = extra?.phone || user.phoneNumber || null;
  const profile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
    uid: user.uid,
    name: extra?.name || user.displayName || "GhanaPay User",
    email: user.email,
    phone,
    phoneNormalized: phone ? normalizeGhanaPhone(phone) : null,
    role: "customer",
    tier: 1,
    photoURL: user.photoURL,
  };

  await setDoc(doc(db, USERS_COLLECTION, user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const saved = await getDoc(doc(db, USERS_COLLECTION, user.uid));
  return saved.data() as UserProfile;
}

/**
 * Fetches an existing profile, or creates one if this is the user's first
 * sign-in (relevant for Google sign-in, which skips our register form).
 */
export async function getOrCreateUserProfile(
  user: FirebaseUser,
  extra?: { name?: string; phone?: string }
): Promise<UserProfile> {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;
  return createUserProfile(user, extra);
}
