import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getAnalyticsSummary } from "@/lib/analytics";

/**
 * There is only ONE real funding source in this sandbox — the GhanaPay
 * wallet balance itself. No card/bank/momo-specific payment method is
 * tracked per transaction anywhere in the system. Rather than fabricate a
 * breakdown across methods that don't exist, this honestly returns a
 * single real entry.
 */
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const summary = await getAnalyticsSummary(uid);
    const data =
      summary.monthlySpent > 0
        ? [{ label: "GhanaPay Wallet", pct: 100, amount: summary.monthlySpent, bgClass: "bg-primary" }]
        : [];
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return authErrorResponse(err);
  }
}
