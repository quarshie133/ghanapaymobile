import { NextResponse } from "next/server";
import { runDueScheduledPayments } from "@/lib/scheduled-payments";

/**
 * POST /api/scheduled/run — executes every due scheduled payment. This is
 * NOT user-authenticated (requireAuth doesn't fit here — it processes many
 * users' payments in one call, not one caller's own data). Instead it's
 * protected by a shared secret header, checked against
 * SCHEDULED_PAYMENTS_CRON_SECRET, which only your Netlify Scheduled
 * Function should know.
 *
 * This route existing does NOT mean scheduled payments run automatically —
 * something has to actually call it on a timer. See
 * docs/16_NETLIFY_DEPLOYMENT_GUIDE.md for wiring up a Netlify Scheduled
 * Function that calls this endpoint every 15 minutes. Without that step,
 * this route just sits here unused and no scheduled payment will ever
 * execute on its own.
 */
export async function POST(request: Request) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.SCHEDULED_PAYMENTS_CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { success: false, message: "SCHEDULED_PAYMENTS_CRON_SECRET is not configured on the server." },
      { status: 500 }
    );
  }
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDueScheduledPayments();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[api/scheduled/run] Failed:", err);
    return NextResponse.json({ success: false, message: "Failed to run scheduled payments" }, { status: 500 });
  }
}
