import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { markNotificationRead } from "@/lib/notifications";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await requireAuth(request);
    const { id } = await params;
    await markNotificationRead(uid, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
