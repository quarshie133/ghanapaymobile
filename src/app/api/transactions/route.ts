import { NextResponse } from "next/server";
import { TRANSACTIONS } from "@/lib/mock-data";

/** GET /api/transactions — list all transactions */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type   = searchParams.get("type");
  const status = searchParams.get("status");
  const limit  = parseInt(searchParams.get("limit") ?? "50", 10);

  let data = [...TRANSACTIONS];
  if (type)   data = data.filter((t) => t.type === type);
  if (status) data = data.filter((t) => t.status === status);
  data = data.slice(0, limit);

  return NextResponse.json({ success: true, data, total: data.length });
}

/** POST /api/transactions — create a new transaction */
export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Validate, persist to DB, trigger notification
  const newTx = {
    id: `GHP-${Date.now()}`,
    date: new Date().toLocaleDateString("en-GB"),
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    status: "pending",
    fee: 0,
    ...body,
  };
  return NextResponse.json({ success: true, data: newTx }, { status: 201 });
}
