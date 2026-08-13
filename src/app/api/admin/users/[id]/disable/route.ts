import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { setUserDisabled } from "@/lib/admin-users";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid: adminUid } = await requireAuth(request, "administrator");
    const { id } = await params;
    const body = await request.json();
    const disabled = Boolean(body?.disabled);

    if (id === adminUid && disabled) {
      return NextResponse.json({ success: false, message: "You can't disable your own admin account." }, { status: 400 });
    }

    await setUserDisabled(id, disabled);
    return NextResponse.json({ success: true, message: disabled ? "Account suspended" : "Account reactivated" });
  } catch (err) {
    return authErrorResponse(err);
  }
}
