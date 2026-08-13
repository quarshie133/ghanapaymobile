import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";
import { listAdminUsers } from "@/lib/admin-users";

export async function GET(request: Request) {
  try {
    await requireAuth(request, "administrator");
    const users = await listAdminUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    return authErrorResponse(err);
  }
}
