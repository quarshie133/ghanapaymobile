import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { listNotifications, countUnreadNotifications } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const [notifications, unreadCount] = await Promise.all([
      listNotifications(uid),
      countUnreadNotifications(uid),
    ]);
    return NextResponse.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    return authErrorResponse(err);
  }
}
