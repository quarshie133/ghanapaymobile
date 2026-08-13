import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { getStorage } from "firebase-admin/storage";

/**
 * GET /api/kyc/document-url?uid=...&stepId=... — admin-only. Generates a
 * signed URL valid for 5 minutes so an admin can view one specific KYC
 * document without it ever being a permanent, guessable, or publicly
 * shareable link. This is the ONLY sanctioned way to view a KYC document —
 * never store or return a getDownloadURL()-style permanent link (see
 * src/lib/kyc-upload.ts for why).
 */
export async function GET(request: Request) {
  try {
    await requireAuth(request, "administrator");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const stepId = searchParams.get("stepId");
    if (!uid || !stepId) {
      return NextResponse.json({ success: false, message: "uid and stepId are required" }, { status: 400 });
    }

    // We don't know the file extension without reading the KYC record, but
    // Storage list lets us find the actual object under the expected prefix.
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: `kyc/${uid}/${stepId}.` });
    if (files.length === 0) {
      return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });
    }

    const [signedUrl] = await files[0].getSignedUrl({
      action: "read",
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    return NextResponse.json({ success: true, data: { url: signedUrl, expiresInSeconds: 300 } });
  } catch (err) {
    return authErrorResponse(err);
  }
}
