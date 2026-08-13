import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { listAdminTransactions } from "@/lib/admin-transactions";

export async function GET(request: Request) {
  try {
    await requireAuth(request, "administrator");
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const transactions = await listAdminTransactions(100, type);
    return NextResponse.json({ success: true, data: transactions });
  } catch (err) {
    return authErrorResponse(err);
  }
}
