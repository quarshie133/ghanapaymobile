import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { listWalletTransactions } from "@/lib/wallet-ledger";

/** GET /api/bills/history — real ledger entries of type "bill" for the authenticated user. */
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const transactions = await listWalletTransactions(uid, { limit: 50, type: "bill" });
    return NextResponse.json({ success: true, data: transactions });
  } catch (err) {
    return authErrorResponse(err);
  }
}
