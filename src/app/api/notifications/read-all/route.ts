import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    await markAllNotificationsRead(uid);
    return NextResponse.json({ success: true });
  } catch (err) {
    return authErrorResponse(err);
  }
}
