import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getMonthlyStatements } from "@/lib/statements";

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const months = await getMonthlyStatements(uid);
    return NextResponse.json({ success: true, data: months });
  } catch (err) {
    return authErrorResponse(err);
  }
}
