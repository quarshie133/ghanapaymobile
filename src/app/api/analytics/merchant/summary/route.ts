import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getMerchantSummary } from "@/lib/analytics";

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const summary = await getMerchantSummary(uid);
    return NextResponse.json({ success: true, data: summary });
  } catch (err) {
    return authErrorResponse(err);
  }
}
