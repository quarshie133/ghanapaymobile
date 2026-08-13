import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { unlinkAccount } from "@/lib/linked-accounts";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await requireAuth(request);
    const { id } = await params;
    await unlinkAccount(uid, id);
    return NextResponse.json({ success: true, message: "Account unlinked" });
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
