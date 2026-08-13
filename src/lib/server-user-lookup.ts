import { adminDb } from "./firebase-admin";
import { normalizeGhanaPhone } from "./phone";
import type { UserRole } from "./user-profile";

export interface PublicUserLookup {
  uid: string;
  name: string;
  role: UserRole;
}

/**
 * SERVER-ONLY. Looks up a user by phone number for recipient resolution
 * (send-money "verify recipient" step, and the transfer route itself).
 * Only returns non-sensitive fields (uid, name, role) — never email, full
 * phone, wallet balance, etc. This is deliberately a narrow, low-exposure
 * lookup, not a general "get any user's profile" endpoint.
 */
export async function lookupUserByPhone(rawPhone: string): Promise<PublicUserLookup | null> {
  const normalized = normalizeGhanaPhone(rawPhone);
  const snap = await adminDb().collection("users").where("phoneNormalized", "==", normalized).limit(1).get();
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return { uid: data.uid, name: data.name, role: data.role };
}
