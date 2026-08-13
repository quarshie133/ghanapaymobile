import { adminDb } from "./firebase-admin";

/**
 * SERVER-ONLY. Aggregates the SAME underlying Firestore data that
 * /admin/users, /admin/transactions, and /admin/kyc already query
 * individually — so the dashboard's summary numbers can never drift from
 * what you see when you click through, because they're computed from the
 * same source, not a separately-maintained mock dataset.
 *
 * Fraud data is NOT included here — there's no real fraud detection to
 * aggregate. The dashboard imports DEMO_FRAUD_ALERTS directly (same shared
 * static array /admin/fraud uses), so both views agree by construction
 * without needing a server round-trip for static demo data.
 */

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number; // not disabled
  totalVolume: number; // sum of all wallet transaction amounts, all time
  pendingKyc: number;
  volumeTrend: { day: string; volume: number }[]; // last 7 days
  kycQueue: { uid: string; name: string; phone: string | null; submittedCount: number }[]; // preview, up to 5
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = adminDb();

  const [usersSnap, kycPendingCountSnap, kycPendingPreviewSnap, txSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("kycRecords").where("status", "==", "pending_review").count().get(),
    db.collection("kycRecords").where("status", "==", "pending_review").orderBy("updatedAt", "desc").limit(5).get(),
    // 7 days is enough history for the trend chart; cap the read at a
    // generous limit so this doesn't scan the entire ledger on every load.
    db.collection("walletTransactions").orderBy("createdAt", "desc").limit(500).get(),
  ]);

  const totalUsers = usersSnap.size;
  // "Active" here just means "not disabled" — there's no separate
  // activity-tracking concept in this project yet.
  const activeUsers = usersSnap.docs.filter((d) => d.data().disabled !== true).length;

  let totalVolume = 0;
  const volumeByDay = new Map<string, number>();
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6); // inclusive of today = 7 days

  for (const doc of txSnap.docs) {
    const data = doc.data();
    const amount = Number(data.amount) || 0;
    totalVolume += amount;

    const seconds = data.createdAt?._seconds ?? data.createdAt?.seconds;
    if (typeof seconds === "number") {
      const txDate = new Date(seconds * 1000);
      if (txDate >= sevenDaysAgo) {
        const dayKey = txDate.toLocaleDateString("en-US", { weekday: "short" });
        volumeByDay.set(dayKey, (volumeByDay.get(dayKey) || 0) + amount);
      }
    }
  }

  // Build a fixed 7-day sequence (oldest to newest) so the chart doesn't
  // reorder day-to-day or skip days with zero volume.
  const volumeTrend: { day: string; volume: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayKey = d.toLocaleDateString("en-US", { weekday: "short" });
    volumeTrend.push({ day: dayKey, volume: Math.round((volumeByDay.get(dayKey) || 0) * 100) / 100 });
  }

  // Enrich the KYC preview with names (kycRecords already denormalizes
  // name/phone — see kyc-record.ts — so no extra join needed here).
  const kycQueue = kycPendingPreviewSnap.docs.map((d) => {
    const data = d.data();
    const submittedCount = Object.values(data.steps || {}).filter((s: any) => s?.status === "submitted").length;
    return { uid: d.id, name: data.name || "Unknown", phone: data.phone || null, submittedCount };
  });

  return {
    totalUsers,
    activeUsers,
    totalVolume: Math.round(totalVolume * 100) / 100,
    pendingKyc: kycPendingCountSnap.data().count,
    volumeTrend,
    kycQueue,
  };
}
