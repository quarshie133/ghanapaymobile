import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getOrCreateKycRecord } from "@/lib/kyc-record";

/** GET /api/kyc/status — real Firestore KYC record for the authenticated user (was hardcoded JSON before). */
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const record = await getOrCreateKycRecord(uid);
    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    return authErrorResponse(err);
  }
}
