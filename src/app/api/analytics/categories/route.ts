import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getCategoryBreakdown } from "@/lib/analytics";

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const categories = await getCategoryBreakdown(uid);
    return NextResponse.json({ success: true, data: categories });
  } catch (err) {
    return authErrorResponse(err);
  }
}
