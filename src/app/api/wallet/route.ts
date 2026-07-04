import { NextResponse } from "next/server";

/** GET /api/wallet — get wallet info for authenticated user */
export async function GET() {
  // TODO: Authenticate request, fetch from DB
  return NextResponse.json({
    success: true,
    data: {
      walletId: "GHP-WLT-2026-00182",
      balance: 4250.00,
      currency: "GHS",
      tier: 2,
      linkedAccounts: [
        { provider: "MTN Mobile Money", balance: 1200.00, icon: "📱" },
        { provider: "Ecobank",          balance: 8500.00, icon: "🏦" },
      ],
      limits: { daily: 5000, weekly: 20000, monthly: 80000 },
    },
  });
}

/** POST /api/wallet/topup — add money to wallet */
export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Process top-up via payment gateway
  return NextResponse.json({
    success: true,
    message: `Top-up of ₵${body.amount} initiated`,
    transactionId: `GHP-TU-${Date.now()}`,
  }, { status: 201 });
}
