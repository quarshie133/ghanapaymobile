import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { withdrawFromWallet } from "@/lib/wallet-ledger";
import { listLinkedAccounts } from "@/lib/linked-accounts";

/**
 * POST /api/wallet/transfer — "Transfer" in the wallet page's Transfer
 * modal means moving money from your GhanaPay wallet to one of your OWN
 * linked (external) bank/MoMo accounts. Since there's no real bank/MoMo
 * integration to actually deposit funds into, and no second GhanaPay
 * wallet on the receiving end, this is bookkeeping-equivalent to a
 * withdrawal: the wallet is debited, nothing else is credited. The ledger
 * note records which linked account it was "sent to" for the receipt UI.
 * Don't conflate this with the real peer-to-peer transfer in
 * /api/transactions/transfers, which moves money between two actual
 * GhanaPay wallets.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const amount = Number(body?.amount);
    const destinationAccountId = String(body?.destinationAccountId || "");
    const note = typeof body?.note === "string" ? body.note : undefined;

    if (!destinationAccountId) {
      return NextResponse.json({ success: false, message: "destinationAccountId is required" }, { status: 400 });
    }

    const accounts = await listLinkedAccounts(uid);
    const destination = accounts.find((a) => a.id === destinationAccountId);
    if (!destination) {
      return NextResponse.json({ success: false, message: "Linked account not found" }, { status: 404 });
    }

    const label = `Transfer to ${destination.provider} ${destination.maskedNumber}${note ? ` — ${note}` : ""}`;
    // Reuses the exact same atomic debit + insufficient-funds guard as
    // withdrawal — see wallet-ledger.ts. No separate "transfer_to_linked"
    // type exists in the ledger; it's tagged as a withdrawal, which is
    // what it actually is from the wallet's perspective.
    const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined;
    const { wallet, transaction } = await withdrawFromWallet(uid, amount, idempotencyKey, label);

    return NextResponse.json(
      { success: true, message: `Transfer of ₵${amount} to ${destination.provider} successful`, data: { wallet, transaction, destination } },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
