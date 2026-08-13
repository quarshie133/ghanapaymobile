import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { lookupUserByPhone } from "@/lib/server-user-lookup";

/**
 * GET /api/user/lookup?phone=... — used by the send-money "verify
 * recipient" step. Requires the caller to be signed in (prevents anonymous
 * enumeration of registered phone numbers), and only returns a name — not
 * email, uid-adjacent PII, or wallet info.
 */
export async function GET(request: Request) {
  try {
    await requireAuth(request); // must be signed in; result itself isn't used
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ success: false, message: "phone query param is required" }, { status: 400 });
    }

    const result = await lookupUserByPhone(phone);
    if (!result) {
      return NextResponse.json({ success: false, message: "Recipient not found on GhanaPay." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { name: result.name } });
  } catch (err) {
    return authErrorResponse(err);
  }
}
