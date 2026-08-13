import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { updateScheduledPayment, deleteScheduledPayment } from "@/lib/scheduled-payments";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const updates: any = {};
    if (body?.status && ["active", "paused", "cancelled"].includes(body.status)) updates.status = body.status;
    if (typeof body?.amount === "number") updates.amount = body.amount;
    if (["daily", "weekly", "monthly", "annually"].includes(body?.frequency)) updates.frequency = body.frequency;
    if (typeof body?.note === "string") updates.note = body.note;

    const payment = await updateScheduledPayment(uid, id, updates);
    return NextResponse.json({ success: true, message: "Schedule updated", data: payment });
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await requireAuth(request);
    const { id } = await params;
    await deleteScheduledPayment(uid, id);
    return NextResponse.json({ success: true, message: "Schedule deleted" });
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
