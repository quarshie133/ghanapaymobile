import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { withdrawFromWallet } from "@/lib/wallet-ledger";

/**
 * POST /api/wallet/withdraw — sandbox withdrawal (see wallet-ledger.ts for
 * why this is a sandbox simulation, not a real payout). Rejects if the
 * server-side balance is insufficient, regardless of what the client thinks
 * the balance is.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const amount = Number(body?.amount);
    const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined;

    const { wallet, transaction } = await withdrawFromWallet(uid, amount, idempotencyKey);

    return NextResponse.json(
      { success: true, message: `Withdrawal of ₵${amount} successful`, data: { wallet, transaction } },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
