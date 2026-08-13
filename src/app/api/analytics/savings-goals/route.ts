import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";

/**
 * There is no savings-goals feature anywhere in this project — no
 * Firestore collection, no create/contribute flow, nothing. Rather than
 * fabricate goal data, this returns an empty list honestly. The UI shows
 * a "not implemented yet" state instead of fake progress bars.
 */
export async function GET(request: Request) {
  try {
    await requireAuth(request);
    return NextResponse.json({ success: true, data: [] });
  } catch (err) {
    return authErrorResponse(err);
  }
}
