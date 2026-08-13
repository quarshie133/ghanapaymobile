import { adminDb } from "./firebase-admin";
import type { WalletTransactionDoc, WalletTxType } from "./wallet-ledger";

/**
 * SERVER-ONLY. Real analytics derived from a user's actual transaction
 * history for the current calendar month. Deliberately does NOT fabricate
 * granular spending categories (Food, Transport, Shopping, etc.) — this
 * project never tracks WHAT a bill/transfer was actually for beyond the
 * transaction type itself, so categories here are the real transaction
 * TYPES (Bills, Airtime, Transfers Sent, Withdrawals), not invented
 * sub-categories. Similarly, "payment methods" isn't a real tracked
 * concept — there's only one funding source (the GhanaPay wallet itself)
 * in this sandbox, so that's reported honestly rather than fabricating a
 * breakdown across methods that don't exist here.
 */

const CREDIT_TYPES = new Set<WalletTxType>(["topup", "transfer_in"]);
const CATEGORY_LABELS: Record<WalletTxType, string> = {
  topup: "Top-ups", withdrawal: "Withdrawals", transfer_out: "Transfers Sent",
  transfer_in: "Transfers Received", bill: "Bill Payments", airtime: "Airtime",
};
const CATEGORY_COLORS: Record<WalletTxType, string> = {
  topup: "#2E8B57", withdrawal: "#8E44AD", transfer_out: "#C0392B",
  transfer_in: "#1E7B9E", bill: "#cea62c", airtime: "#020259",
};

async function getCurrentMonthTransactions(uid: string): Promise<WalletTransactionDoc[]> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Firestore can't filter on a computed "this month" range without a
  // Timestamp bound, so fetch a reasonably-capped recent window and filter
  // in memory — simpler and avoids a composite index for a date-range +
  // uid query.
  const snap = await adminDb()
    .collection("walletTransactions")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(300)
    .get();

  return snap.docs
    .map((d) => d.data() as WalletTransactionDoc)
    .filter((tx) => {
      const seconds = tx.createdAt?.seconds;
      if (typeof seconds !== "number") return false;
      return new Date(seconds * 1000) >= monthStart;
    });
}

export interface AnalyticsSummary {
  monthlySpent: number;
  monthlyReceived: number;
  largestExpense: number;
  transactionCount: number;
  avgTransactionValue: number;
}

export async function getAnalyticsSummary(uid: string): Promise<AnalyticsSummary> {
  const txs = await getCurrentMonthTransactions(uid);

  let monthlySpent = 0;
  let monthlyReceived = 0;
  let largestExpense = 0;

  for (const tx of txs) {
    if (CREDIT_TYPES.has(tx.type)) {
      monthlyReceived += tx.amount;
    } else {
      const total = tx.amount + (tx.fee || 0);
      monthlySpent += total;
      if (total > largestExpense) largestExpense = total;
    }
  }

  return {
    monthlySpent: Math.round(monthlySpent * 100) / 100,
    monthlyReceived: Math.round(monthlyReceived * 100) / 100,
    largestExpense: Math.round(largestExpense * 100) / 100,
    transactionCount: txs.length,
    avgTransactionValue: txs.length > 0 ? Math.round(((monthlySpent + monthlyReceived) / txs.length) * 100) / 100 : 0,
  };
}

export async function getWeeklySpending(uid: string): Promise<{ week: string; amount: number }[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);

  const snap = await adminDb()
    .collection("walletTransactions")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(300)
    .get();

  const byDay = new Map<string, number>();
  for (const doc of snap.docs) {
    const tx = doc.data() as WalletTransactionDoc;
    const seconds = tx.createdAt?.seconds;
    if (typeof seconds !== "number" || CREDIT_TYPES.has(tx.type)) continue; // spending trend = debits only
    const date = new Date(seconds * 1000);
    if (date < sevenDaysAgo) continue;
    const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
    byDay.set(dayKey, (byDay.get(dayKey) || 0) + tx.amount + (tx.fee || 0));
  }

  const result: { week: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayKey = d.toLocaleDateString("en-US", { weekday: "short" });
    result.push({ week: dayKey, amount: Math.round((byDay.get(dayKey) || 0) * 100) / 100 });
  }
  return result;
}

export interface CategoryBreakdown {
  name: string;
  pct: number;
  amount: number;
  color: string;
}

export async function getCategoryBreakdown(uid: string): Promise<CategoryBreakdown[]> {
  const txs = await getCurrentMonthTransactions(uid);
  const debitTxs = txs.filter((tx) => !CREDIT_TYPES.has(tx.type));

  const totalsByType = new Map<WalletTxType, number>();
  for (const tx of debitTxs) {
    totalsByType.set(tx.type, (totalsByType.get(tx.type) || 0) + tx.amount + (tx.fee || 0));
  }

  const total = Array.from(totalsByType.values()).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  return Array.from(totalsByType.entries())
    .map(([type, amount]) => ({
      name: CATEGORY_LABELS[type],
      amount: Math.round(amount * 100) / 100,
      pct: Math.round((amount / total) * 100),
      color: CATEGORY_COLORS[type],
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface MerchantSummary {
  totalSales: number;
  salesToday: number;
  transactionCount: number;
  avgTransactionValue: number;
}

/**
 * "Merchant sales" honestly means money received via transfer_in — this
 * project has no separate invoicing/checkout concept distinct from a
 * regular peer-to-peer transfer, so a merchant's "sale" IS a transfer they
 * received. Not fabricated, just a direct real mapping.
 */
export async function getMerchantSummary(uid: string): Promise<MerchantSummary> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const snap = await adminDb()
    .collection("walletTransactions")
    .where("uid", "==", uid)
    .where("type", "==", "transfer_in")
    .orderBy("createdAt", "desc")
    .limit(300)
    .get();

  let totalSales = 0;
  let salesToday = 0;
  let count = 0;

  for (const doc of snap.docs) {
    const tx = doc.data() as WalletTransactionDoc;
    const seconds = tx.createdAt?.seconds;
    if (typeof seconds !== "number") continue;
    const date = new Date(seconds * 1000);
    if (date < monthStart) continue;
    totalSales += tx.amount;
    count++;
    if (date >= todayStart) salesToday += tx.amount;
  }

  return {
    totalSales: Math.round(totalSales * 100) / 100,
    salesToday: Math.round(salesToday * 100) / 100,
    transactionCount: count,
    avgTransactionValue: count > 0 ? Math.round((totalSales / count) * 100) / 100 : 0,
  };
}

export async function getMerchantWeekly(uid: string): Promise<{ week: string; amount: number }[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);

  const snap = await adminDb()
    .collection("walletTransactions")
    .where("uid", "==", uid)
    .where("type", "==", "transfer_in")
    .orderBy("createdAt", "desc")
    .limit(300)
    .get();

  const byDay = new Map<string, number>();
  for (const doc of snap.docs) {
    const tx = doc.data() as WalletTransactionDoc;
    const seconds = tx.createdAt?.seconds;
    if (typeof seconds !== "number") continue;
    const date = new Date(seconds * 1000);
    if (date < sevenDaysAgo) continue;
    const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
    byDay.set(dayKey, (byDay.get(dayKey) || 0) + tx.amount);
  }

  const result: { week: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayKey = d.toLocaleDateString("en-US", { weekday: "short" });
    result.push({ week: dayKey, amount: Math.round((byDay.get(dayKey) || 0) * 100) / 100 });
  }
  return result;
}
