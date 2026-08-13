import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { isValidGhanaPhone, normalizeGhanaPhone } from "@/lib/phone";

/**
 * POST /api/users/update — updates the caller's OWN Firestore profile
 * (name, phone only). This route did not exist at all before — the
 * Settings page has been calling it since Phase 4 and silently failing
 * every time; found during a security-audit pass over every API route.
 *
 * Email is intentionally NOT updatable here. Changing a Firebase Auth
 * email requires the client to call updateEmail() after a recent
 * re-authentication (Firebase's own security requirement) — that's a
 * separate flow this route doesn't attempt to shortcut. The Settings page
 * disables the email field rather than silently ignoring a value the
 * user thinks they changed.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (typeof body?.name === "string" && body.name.trim().length > 0) {
      updates.name = body.name.trim();
    }
    if (typeof body?.phone === "string" && body.phone.trim().length > 0) {
      if (!isValidGhanaPhone(body.phone)) {
        return NextResponse.json({ success: false, message: "Enter a valid Ghanaian phone number." }, { status: 400 });
      }
      updates.phone = body.phone.trim();
      updates.phoneNormalized = normalizeGhanaPhone(body.phone);
    }

    await adminDb().collection("users").doc(uid).update(updates);
    const updated = await adminDb().collection("users").doc(uid).get();

    return NextResponse.json({ success: true, message: "Profile updated", data: updated.data() });
  } catch (err) {
    return authErrorResponse(err);
  }
}
