import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { listKycRecords, reviewKycRecord, type KycOverallStatus } from "@/lib/kyc-record";

const VALID_STATUSES: KycOverallStatus[] = ["not_started", "in_progress", "pending_review", "approved", "rejected"];

/**
 * GET /api/kyc?admin=true&status=pending_review — real Firestore queue of
 * KYC submissions (was hardcoded mock data before). Admin-role gated.
 * `status` is optional — omit it to get everything.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

    if (admin) {
      await requireAuth(request, "administrator");
      const statusParam = searchParams.get("status");
      const status = statusParam && VALID_STATUSES.includes(statusParam as KycOverallStatus)
        ? (statusParam as KycOverallStatus)
        : undefined;
      const records = await listKycRecords(status);
      return NextResponse.json({ success: true, data: records, pending: records.filter((r) => r.status === "pending_review").length });
    }

    // Non-admin callers should use /api/kyc/status instead — redirect the
    // shape here rather than duplicating logic.
    return NextResponse.json(
      { success: false, message: "Use /api/kyc/status for your own KYC status." },
      { status: 400 }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}

/**
 * PATCH /api/kyc — admin approve/reject. Body: { uid, action, note? }
 * `action` is "approve" | "reject". On approval, bumps the user's tier to 3
 * (see src/lib/kyc-record.ts). Admin-role gated by requireAuth.
 */
export async function PATCH(request: Request) {
  try {
    const { uid: reviewerUid } = await requireAuth(request, "administrator");
    const body = await request.json();

    const targetUid = String(body?.uid || "");
    const action = body?.action as "approve" | "reject";
    const note = typeof body?.note === "string" ? body.note : undefined;

    if (!targetUid || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ success: false, message: "uid and a valid action are required" }, { status: 400 });
    }

    const record = await reviewKycRecord(targetUid, action, reviewerUid, note);

    return NextResponse.json({ success: true, message: `KYC ${action}d for ${targetUid}`, data: record });
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
