import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { payForSandboxService } from "@/lib/wallet-ledger";

/**
 * POST /api/bills/pay — debits the wallet for a bill payment, atomically,
 * with a real insufficient-funds check. The "payment to the biller" itself
 * is simulated (see /api/bills/validate) — only the wallet debit is real.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();

    const amount = Number(body?.amount);
    const category = String(body?.category || "bill");
    const provider = String(body?.provider || "");
    const accountNumber = String(body?.accountNumber || "");
    const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined;

    const note = `${provider || category} bill payment${accountNumber ? ` (acct ${accountNumber})` : ""}`;
    const { wallet, transaction } = await payForSandboxService(uid, amount, "bill", note, idempotencyKey);

    return NextResponse.json(
      {
        success: true,
        message: `Bill payment of ₵${amount} to ${provider || category} successful`,
        id: transaction.id,
        transactionId: transaction.ref,
        data: { wallet, transaction },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
