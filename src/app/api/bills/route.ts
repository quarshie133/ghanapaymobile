import { NextResponse } from "next/server";

const BILLERS = [
  { id: "ecg",   name: "ECG Electricity",   category: "Electricity", fields: ["meterNumber", "amount"] },
  { id: "gwcl",  name: "GWCL Water",         category: "Water",       fields: ["accountNumber", "amount"] },
  { id: "dstv",  name: "DStv",               category: "TV",          fields: ["smartcardNumber", "package"] },
  { id: "mtn",   name: "MTN Airtime",         category: "Airtime",     fields: ["phone", "amount"] },
  { id: "vodafone", name: "Vodafone Cash",    category: "Airtime",     fields: ["phone", "amount"] },
];

/** GET /api/bills — list available billers */
export async function GET() {
  return NextResponse.json({ success: true, data: BILLERS });
}

/** POST /api/bills/pay — pay a bill */
export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Integrate with biller API gateway
  return NextResponse.json({
    success: true,
    message: `Bill payment to ${body.billerId} of ₵${body.amount} submitted`,
    ref: `GHP-BILL-${Date.now()}`,
  }, { status: 201 });
}
