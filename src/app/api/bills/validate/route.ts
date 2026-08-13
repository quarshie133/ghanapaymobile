import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/server-auth";

/**
 * POST /api/bills/validate — SANDBOX account/meter verification.
 *
 * There is no real biller API integration (ECG, GWCL, DStv, etc. don't
 * have public sandbox APIs this project can call). This deterministically
 * derives a plausible-looking account name from the account number so the
 * demo flow feels real, and always returns a zero outstanding balance.
 * Never present this as a real biller lookup in documentation.
 */
export async function POST(request: Request) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const accountNumber = String(body?.accountNumber || "").trim();

    if (!accountNumber || accountNumber.length < 4) {
      return NextResponse.json(
        { success: false, message: "Enter a valid account/meter number." },
        { status: 400 }
      );
    }

    // Deterministic (not random) so the same account number always verifies
    // to the same name within a session — avoids the confusing feel of a
    // random name changing between attempts.
    const names = [
      "Kwame Owusu", "Abena Mansa", "Kofi Boateng", "Ama Serwaa",
      "Yaw Darko", "Efua Adjei", "Kwabena Asare", "Akosua Frimpong",
    ];
    let hash = 0;
    for (const ch of accountNumber) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const accountName = names[hash % names.length];

    return NextResponse.json({
      success: true,
      data: { accountName, outstandingBalance: 0 },
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
