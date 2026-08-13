import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase-admin";
import { transferBetweenWallets } from "@/lib/wallet-ledger";
import { lookupUserByPhone } from "@/lib/server-user-lookup";

/**
 * POST /api/transactions/transfers — peer-to-peer GhanaPay wallet transfer.
 * Body: { amount, recipientPhone, note? }
 *
 * The recipient is resolved server-side by phone number (never trust a
 * client-supplied recipient uid) — this also means a client can't forge a
 * transfer to an arbitrary uid it doesn't actually have the phone number
 * for.
 */
export async function POST(request: Request) {
  try {
    const { uid: senderUid } = await requireAuth(request);
    const body = await request.json();

    const amount = Number(body?.amount);
    const recipientPhone = typeof body?.recipientPhone === "string" ? body.recipientPhone : "";
    const note = typeof body?.note === "string" ? body.note : null;
    const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined;

    if (!recipientPhone) {
      return NextResponse.json({ success: false, message: "recipientPhone is required" }, { status: 400 });
    }

    const recipient = await lookupUserByPhone(recipientPhone);
    if (!recipient) {
      return NextResponse.json(
        { success: false, message: "Recipient not found on GhanaPay." },
        { status: 404 }
      );
    }

    const senderSnap = await adminDb().collection("users").doc(senderUid).get();
    const senderName = senderSnap.exists ? (senderSnap.data()?.name as string) : null;

    const { wallet, transaction } = await transferBetweenWallets(
      senderUid,
      recipient.uid,
      amount,
      note,
      recipient.name,
      senderName,
      idempotencyKey
    );

    return NextResponse.json(
      {
        success: true,
        message: `Sent ₵${amount} to ${recipient.name}`,
        data: { ...transaction, wallet }, // flattened so txResult.ref works as the send-money page expects
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
