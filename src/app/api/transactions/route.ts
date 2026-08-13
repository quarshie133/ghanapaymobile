import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { listWalletTransactions } from "@/lib/wallet-ledger";

/**
 * GET /api/transactions — real recent transactions for the authenticated
 * user, from Firestore. This route was previously PUBLIC (no auth check
 * at all) and returned hardcoded mock data from mock-data.ts — found
 * during a security-audit pass; still called by /history and /dashboard,
 * which is why it's being fixed rather than deleted.
 *
 * The old POST handler here (which faked creating a transaction with no
 * real ledger effect and no auth) has been removed entirely — nothing in
 * the app called it, and real transaction creation happens through the
 * proper routes: /api/wallet, /api/transactions/transfers, /api/bills/pay,
 * /api/airtime.
 */
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 100);

    const transactions = await listWalletTransactions(uid, { limit, type });

    return NextResponse.json({ success: true, data: transactions, total: transactions.length });
  } catch (err) {
    return authErrorResponse(err);
  }
}
