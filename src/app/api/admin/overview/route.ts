import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getAdminOverview } from "@/lib/admin-overview";

export async function GET(request: Request) {
  try {
    await requireAuth(request, "administrator");
    const overview = await getAdminOverview();
    return NextResponse.json({ success: true, data: overview });
  } catch (err) {
    return authErrorResponse(err);
  }
}
