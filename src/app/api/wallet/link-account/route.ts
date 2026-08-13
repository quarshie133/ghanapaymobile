import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { linkAccount } from "@/lib/linked-accounts";

export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const account = await linkAccount(uid, {
      type: body?.type === "bank" ? "bank" : "momo",
      provider: String(body?.provider || ""),
      accountNumber: String(body?.accountNumber || ""),
      accountName: String(body?.accountName || ""),
    });
    return NextResponse.json({ success: true, message: "Account linked", data: account }, { status: 201 });
  } catch (err: any) {
    if (err?.message && !err.status) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    return authErrorResponse(err);
  }
}
