import { NextResponse } from "next/server";
import { KYC_QUEUE } from "@/lib/mock-data";

/** GET /api/kyc — get KYC queue (admin) or user KYC status */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get("admin") === "true";

  if (admin) {
    return NextResponse.json({ success: true, data: KYC_QUEUE, pending: 47 });
  }

  // User's own KYC status
  return NextResponse.json({
    success: true,
    data: {
      tier: 2,
      status: "verified",
      verifiedAt: "2026-01-15",
      steps: {
        ghanaCard: "completed",
        selfie:    "completed",
        address:   "pending",
        bank:      "not_started",
      },
    },
  });
}

/** POST /api/kyc — submit KYC documents */
export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Process document upload, run AI verification
  return NextResponse.json({
    success: true,
    message: "KYC documents submitted for review",
    submissionId: `KYC-${Date.now()}`,
    estimatedReview: "24-48 hours",
  }, { status: 201 });
}

/** PATCH /api/kyc — admin approve/reject KYC (admin only) */
export async function PATCH(request: Request) {
  const body = await request.json();
  const { submissionId, action } = body; // action: "approve" | "reject"
  // TODO: Update DB, send notification to user
  return NextResponse.json({
    success: true,
    message: `KYC submission ${submissionId} ${action}d`,
  });
}
