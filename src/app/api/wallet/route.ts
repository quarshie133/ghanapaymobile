import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getOrCreateWallet, topupWallet } from "@/lib/wallet-ledger";
import { listLinkedAccounts } from "@/lib/linked-accounts";

/** GET /api/wallet — real wallet balance for the authenticated user, from Firestore. */
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const [wallet, linkedAccounts] = await Promise.all([getOrCreateWallet(uid), listLinkedAccounts(uid)]);
    return NextResponse.json({ success: true, data: { ...wallet, linkedAccounts } });
  } catch (err) {
    return authErrorResponse(err);
  }
}

/**
 * POST /api/wallet — sandbox top-up. Amount comes from the client, but the
 * resulting balance is always computed server-side inside an atomic
 * Firestore transaction (see src/lib/wallet-ledger.ts) — the client never
 * gets to say what the new balance is.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const amount = Number(body?.amount);
    const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined;

    const { wallet, transaction } = await topupWallet(uid, amount, idempotencyKey);

    return NextResponse.json(
      { success: true, message: `Top-up of ₵${amount} successful`, data: { wallet, transaction } },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.message && !err.status) {
      // Validation errors from wallet-ledger.ts (bad amount, over cap, etc.)
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
