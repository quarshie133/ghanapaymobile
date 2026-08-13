import { adminDb } from "./firebase-admin";
import type { WalletTransactionDoc } from "./wallet-ledger";
import { computeMonthlyStatements, type StatementTransaction } from "./statements-core";

/**
 * SERVER-ONLY. Fetches a user's full transaction history and delegates the
 * actual running-balance computation to the pure, unit-tested function in
 * statements-core.ts (see statements-core.test.ts) — this file only
 * handles Firestore I/O and re-attaches the real transaction docs to each
 * month's bucket for display.
 */

export interface MonthlyStatement {
  monthKey: string;
  label: string;
  opening: number;
  closing: number;
  totalDebits: number;
  totalCredits: number;
  transactions: WalletTransactionDoc[];
}

export async function getMonthlyStatements(uid: string): Promise<MonthlyStatement[]> {
  // Full history, oldest first — needed to replay the running balance
  // correctly. Capped at a generous limit; a sandbox account realistically
  // won't exceed this, but it's not unbounded.
  const snap = await adminDb()
    .collection("walletTransactions")
    .where("uid", "==", uid)
    .orderBy("createdAt", "asc")
    .limit(2000)
    .get();

  const allTx = snap.docs
    .map((d) => d.data() as WalletTransactionDoc)
    .filter((tx) => typeof tx.createdAt?.seconds === "number"); // skip malformed/pending-serverTimestamp rows

  const pureInput: StatementTransaction[] = allTx.map((tx) => ({
    type: tx.type,
    amount: tx.amount,
    fee: tx.fee || 0,
    createdAtSeconds: tx.createdAt!.seconds,
  }));

  const results = computeMonthlyStatements(pureInput);

  // Re-attach real transaction docs per month bucket (the pure function
  // only returns aggregated numbers, not the original docs).
  const txByMonth = new Map<string, WalletTransactionDoc[]>();
  for (const tx of allTx) {
    const date = new Date(tx.createdAt!.seconds * 1000);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!txByMonth.has(monthKey)) txByMonth.set(monthKey, []);
    txByMonth.get(monthKey)!.push(tx);
  }

  return results.map((r) => ({ ...r, transactions: txByMonth.get(r.monthKey) || [] }));
}
