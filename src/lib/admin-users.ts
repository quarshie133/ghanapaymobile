import { adminDb, adminAuth } from "./firebase-admin";

/**
 * SERVER-ONLY, admin-only. Lists real registered users with their real
 * account status (Firebase Auth's `disabled` flag — not a fabricated
 * status field) and real wallet balance. Deliberately does NOT include a
 * "pending" status bucket the original mock UI had — there was never a
 * real concept behind it, so it's dropped rather than faked.
 */

export interface AdminUserRow {
  uid: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  tier: number;
  balance: number | null; // null if the user has never touched the wallet system yet
  disabled: boolean; // real Firebase Auth account status
  createdAt: FirebaseFirestore.Timestamp | null;
}

export async function listAdminUsers(limit = 100): Promise<AdminUserRow[]> {
  const usersSnap = await adminDb().collection("users").orderBy("createdAt", "desc").limit(limit).get();
  const uids = usersSnap.docs.map((d) => d.id);
  if (uids.length === 0) return [];

  // Batch-fetch wallets and Auth records for all listed users rather than
  // N+1 individual lookups per row.
  const walletRefs = uids.map((uid) => adminDb().collection("wallets").doc(uid));
  const [walletSnaps, authResult] = await Promise.all([
    adminDb().getAll(...walletRefs),
    adminAuth().getUsers(uids.map((uid) => ({ uid }))).catch(() => ({ users: [], notFound: [] })),
  ]);

  const walletByUid = new Map(walletSnaps.map((s) => [s.id, s.exists ? (s.data()?.balance as number) : null]));
  const disabledByUid = new Map(authResult.users.map((u) => [u.uid, u.disabled]));

  return usersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      name: data.name || "Unknown",
      email: data.email || null,
      phone: data.phone || null,
      role: data.role || "customer",
      tier: data.tier ?? 1,
      balance: walletByUid.get(doc.id) ?? null,
      disabled: disabledByUid.get(doc.id) ?? false,
      createdAt: data.createdAt || null,
    };
  });
}

/** Admin-only: enable or disable a user's Firebase Auth account (real — actually blocks sign-in when disabled). */
export async function setUserDisabled(uid: string, disabled: boolean): Promise<void> {
  await adminAuth().updateUser(uid, { disabled });
}
