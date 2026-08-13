import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { payForSandboxService } from "@/lib/wallet-ledger";
import { isValidGhanaPhone, normalizeGhanaPhone } from "@/lib/phone";

/**
 * POST /api/airtime — debits the wallet for an airtime purchase,
 * atomically. Delivering airtime to the phone itself is simulated (no
 * telco API integration) — only the wallet debit is real.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();

    const amount = Number(body?.amount);
    const phone = String(body?.phone || "");
    const network = String(body?.network || "").toUpperCase();
    const recipientName = typeof body?.recipientName === "string" ? body.recipientName : null;
    const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined;

    if (!isValidGhanaPhone(phone)) {
      return NextResponse.json({ success: false, message: "Enter a valid Ghanaian phone number." }, { status: 400 });
    }

    const note = `${network || "Airtime"} top-up for ${normalizeGhanaPhone(phone)}${recipientName ? ` (${recipientName})` : ""}`;
    const { wallet, transaction } = await payForSandboxService(uid, amount, "airtime", note, idempotencyKey);

    return NextResponse.json(
      {
        success: true,
        message: `₵${amount} airtime sent to ${normalizeGhanaPhone(phone)}`,
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
