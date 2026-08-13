/**
 * Netlify Scheduled Function — calls POST /api/scheduled/run on a timer.
 *
 * This is the piece that makes "scheduled payments execute without the
 * browser staying open" actually true. The API route
 * (src/app/api/scheduled/run/route.ts) has the real execution logic, but
 * something has to actually invoke it on a schedule — that's this file.
 *
 * Netlify auto-detects any file under netlify/functions/ that exports a
 * `config` with a `schedule` field and runs it on that cron schedule once
 * deployed — no manual dashboard setup needed for the trigger itself, only
 * the environment variables below (see docs/16_NETLIFY_DEPLOYMENT_GUIDE.md).
 *
 * Runs every 15 minutes. Ghanaian time zone doesn't matter for the cron
 * expression itself (Netlify Scheduled Functions run in UTC), but it does
 * matter for what "daily" means to a user setting up a schedule — that's a
 * known simplification, not handled with timezone precision here.
 */

export default async () => {
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const secret = process.env.SCHEDULED_PAYMENTS_CRON_SECRET;

  if (!siteUrl || !secret) {
    console.error(
      "[run-scheduled-payments] Missing URL or SCHEDULED_PAYMENTS_CRON_SECRET env var — skipping this run."
    );
    return new Response("Missing configuration", { status: 500 });
  }

  try {
    const res = await fetch(`${siteUrl}/api/scheduled/run`, {
      method: "POST",
      headers: { "x-cron-secret": secret },
    });
    const body = await res.json();
    console.log("[run-scheduled-payments] Result:", body);
    return new Response(JSON.stringify(body), { status: res.status });
  } catch (err) {
    console.error("[run-scheduled-payments] Failed to call /api/scheduled/run:", err);
    return new Response("Failed", { status: 500 });
  }
};

export const config = {
  schedule: "*/15 * * * *", // every 15 minutes
};
