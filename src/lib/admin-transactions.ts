import { adminDb } from "./firebase-admin";
import type { WalletTransactionDoc } from "./wallet-ledger";

/**
 * SERVER-ONLY, admin-only. Lists real wallet transactions across ALL
 * users (was TRANSACTIONS from mock-data.ts before — fabricated rows with
 * no connection to anything that actually happened). Enriches each row
 * with the owning user's name, since walletTransactions only stores uid.
 */

export interface AdminTransactionRow extends WalletTransactionDoc {
  userName: string;
}

export async function listAdminTransactions(limit = 100, type?: string): Promise<AdminTransactionRow[]> {
  let query = adminDb().collection("walletTransactions").orderBy("createdAt", "desc").limit(limit) as FirebaseFirestore.Query;
  if (type) {
    query = adminDb()
      .collection("walletTransactions")
      .where("type", "==", type)
      .orderBy("createdAt", "desc")
      .limit(limit);
  }

  const snap = await query.get();
  const rows = snap.docs.map((d) => d.data() as WalletTransactionDoc);
  if (rows.length === 0) return [];

  // Batch-fetch the owning user's name for each unique uid, rather than
  // N+1 lookups per transaction row.
  const uniqueUids = Array.from(new Set(rows.map((r) => r.uid)));
  const userRefs = uniqueUids.map((uid) => adminDb().collection("users").doc(uid));
  const userSnaps = await adminDb().getAll(...userRefs);
  const nameByUid = new Map(userSnaps.map((s) => [s.id, s.exists ? (s.data()?.name as string) : "Unknown"]));

  return rows.map((r) => ({ ...r, userName: nameByUid.get(r.uid) || "Unknown" }));
}
