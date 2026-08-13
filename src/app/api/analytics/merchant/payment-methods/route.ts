import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getMerchantSummary } from "@/lib/analytics";

/** Same reasoning as /api/analytics/payment-methods — only one real funding/receiving source exists. */
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const summary = await getMerchantSummary(uid);
    const data =
      summary.totalSales > 0
        ? [{ label: "GhanaPay Wallet", pct: 100, amount: summary.totalSales, bgClass: "bg-primary" }]
        : [];
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return authErrorResponse(err);
  }
}
