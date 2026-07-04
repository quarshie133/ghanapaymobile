import { NextResponse } from "next/server";

/** GET /api/users — admin: list all users */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit  = parseInt(searchParams.get("limit") ?? "50", 10);

  // TODO: Query DB with filters
  const mockUsers = [
    { id: "GHP-USR-001", name: "Abena Owusu",   phone: "+233 24 567 8901", tier: 2, status: "active",    balance: 4250.00, joined: "Jan 2026" },
    { id: "GHP-USR-002", name: "Kwame Mensah",  phone: "+233 24 111 0001", tier: 1, status: "active",    balance: 820.00,  joined: "Feb 2026" },
    { id: "GHP-USR-003", name: "Ama Atta",      phone: "+233 20 123 4567", tier: 2, status: "active",    balance: 1100.00, joined: "Mar 2026" },
    { id: "GHP-USR-004", name: "Yaw Darko",     phone: "+233 27 789 0123", tier: 1, status: "suspended", balance: 0.00,    joined: "Mar 2026" },
    { id: "GHP-USR-005", name: "Efua Asante",   phone: "+233 24 888 9090", tier: 3, status: "active",    balance: 15200.00,joined: "Apr 2026" },
  ];

  const filtered = status ? mockUsers.filter((u) => u.status === status) : mockUsers;
  return NextResponse.json({ success: true, data: filtered.slice(0, limit), total: filtered.length });
}

/** POST /api/users — create a new user */
export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Hash password, persist to DB, send welcome SMS
  return NextResponse.json({
    success: true,
    data: { id: `GHP-USR-${Date.now()}`, ...body, tier: 1, status: "pending", balance: 0 },
  }, { status: 201 });
}
