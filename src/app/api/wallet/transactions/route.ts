import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { listWalletTransactions } from "@/lib/wallet-ledger";

/** GET /api/wallet/transactions — real ledger history for the authenticated user. */
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 100);
    const type = searchParams.get("type") || undefined;

    const transactions = await listWalletTransactions(uid, { limit, type });

    // Shape matches PaginatedTransactions in src/types/wallet.ts, though
    // real pagination (cursor-based, since Firestore doesn't do offset
    // pagination well) isn't implemented yet — this is page 1 only.
    return NextResponse.json({
      success: true,
      data: { data: transactions, total: transactions.length, page: 1, limit, pages: 1 },
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
