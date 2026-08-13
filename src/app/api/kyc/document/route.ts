import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { submitKycDocument, type KycStepId } from "@/lib/kyc-record";

const VALID_STEPS: KycStepId[] = ["ghanaCard", "selfie", "addressProof"];

/**
 * POST /api/kyc/document — records that a document was uploaded to Storage.
 * Body: { stepId, storagePath } — storagePath comes from
 * uploadKycDocument() on the client (src/lib/kyc-upload.ts), which already
 * uploaded the file under kyc/{uid}/ per Storage rules. This route just
 * updates the Firestore record so the status/progress UI reflects it.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();

    const stepId = body?.stepId as KycStepId;
    const storagePath = String(body?.storagePath || "");

    if (!VALID_STEPS.includes(stepId)) {
      return NextResponse.json({ success: false, message: "Invalid KYC step." }, { status: 400 });
    }
    // Sanity check: the storage path must actually belong to this uid —
    // never trust a client-supplied path pointing at someone else's folder.
    if (!storagePath.startsWith(`kyc/${uid}/`)) {
      return NextResponse.json({ success: false, message: "Invalid storage path." }, { status: 400 });
    }

    const record = await submitKycDocument(uid, stepId, storagePath);

    return NextResponse.json(
      { success: true, message: "Document submitted for review", data: record },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
