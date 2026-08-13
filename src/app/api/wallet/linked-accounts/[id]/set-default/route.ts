import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { setDefaultAccount } from "@/lib/linked-accounts";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await requireAuth(request);
    const { id } = await params;
    const account = await setDefaultAccount(uid, id);
    return NextResponse.json({ success: true, message: "Default account updated", data: account });
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
