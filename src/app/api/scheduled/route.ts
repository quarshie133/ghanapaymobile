import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { createScheduledPayment, listScheduledPayments } from "@/lib/scheduled-payments";

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const payments = await listScheduledPayments(uid);
    return NextResponse.json({ success: true, data: payments });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();

    const payment = await createScheduledPayment(uid, {
      type: body?.type === "bill" || body?.type === "airtime" ? body.type : "transfer",
      recipientName: String(body?.recipientName || ""),
      recipientPhone: String(body?.recipientPhone || ""),
      amount: Number(body?.amount),
      frequency: ["daily", "weekly", "monthly", "annually"].includes(body?.frequency) ? body.frequency : "monthly",
      nextRunAt: String(body?.nextRunAt || ""),
      note: typeof body?.note === "string" ? body.note : undefined,
    });

    return NextResponse.json({ success: true, message: "Scheduled payment created", data: payment }, { status: 201 });
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
