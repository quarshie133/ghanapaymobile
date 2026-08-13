import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase-admin";
import { getOrCreateWallet } from "@/lib/wallet-ledger";

/**
 * GET /api/user/me — combined user profile + wallet snapshot, shaped for
 * what the send-money page expects: res.wallet.balance, res.wallet.dailySent,
 * res.limits.dailyLimit.
 *
 * `dailySent` resets automatically when the stored date doesn't match
 * today's date (UTC) — a simple daily-window reset. Not a real distributed
 * rate limiter, but enough to demonstrate limit enforcement in an academic
 * sandbox context.
 */
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);

    const [profileSnap, wallet] = await Promise.all([
      adminDb().collection("users").doc(uid).get(),
      getOrCreateWallet(uid),
    ]);

    const profile = profileSnap.exists ? profileSnap.data() : null;

    const today = new Date().toISOString().slice(0, 10);
    const dailyState = await getDailySentState(uid, today);

    return NextResponse.json({
      success: true,
      data: {
        id: uid,
        name: profile?.name || "GhanaPay User",
        email: profile?.email || null,
        phone: profile?.phone || null,
        role: profile?.role || "customer",
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency,
          dailySent: dailyState.dailySent,
        },
        limits: {
          dailyLimit: wallet.limits.daily,
          weeklyLimit: wallet.limits.weekly,
          monthlyLimit: wallet.limits.monthly,
        },
      },
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}

async function getDailySentState(uid: string, today: string): Promise<{ dailySent: number }> {
  const ref = adminDb().collection("walletDailyUsage").doc(`${uid}_${today}`);
  const snap = await ref.get();
  if (!snap.exists) return { dailySent: 0 };
  return { dailySent: (snap.data()?.sent as number) || 0 };
}
