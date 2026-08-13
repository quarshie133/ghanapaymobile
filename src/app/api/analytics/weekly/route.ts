import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getWeeklySpending } from "@/lib/analytics";

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const weekly = await getWeeklySpending(uid);
    return NextResponse.json({ success: true, data: weekly });
  } catch (err) {
    return authErrorResponse(err);
  }
}
