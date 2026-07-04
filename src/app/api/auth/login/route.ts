import { NextResponse } from "next/server";

/** POST /api/auth/login */
export async function POST(request: Request) {
  const body = await request.json();
  const { phone, password } = body;

  // TODO: Replace with real authentication logic (DB lookup + bcrypt)
  if (phone && password) {
    return NextResponse.json({
      success: true,
      token: "mock-jwt-token-ghanapayweb",
      user: { id: "GHP-USR-001", name: "Abena Owusu", phone, tier: 2 },
    });
  }

  return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
}
