import { NextResponse } from "next/server";

/** POST /api/auth/logout */
export async function POST() {
  // TODO: Invalidate session token in DB/Redis
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
