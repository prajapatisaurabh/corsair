import { NextRequest, NextResponse } from "next/server";
import { getCorsair, markConnected, redirectUri } from "@/server/corsair";
import { initialSync } from "@/server/sync";

/**
 * GET /api/auth/callback — Google redirects here with ?code&state.
 *
 * Corsair exchanges the code and stores tokens encrypted in Postgres.
 * gmail consent chains straight into googlecalendar consent; after the
 * second one we backfill real data and land in the app.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/login?error=missing_code`);
  }

  try {
    const corsair = await getCorsair();
    const { processOAuthCallback, generateOAuthUrl } = await import("corsair/oauth");
    const { plugin } = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: redirectUri(),
    });

    if (plugin === "gmail") {
      // Same account, second scope set — Google auto-approves in one click.
      const { url } = await generateOAuthUrl(corsair, "googlecalendar", {
        tenantId: "default",
        redirectUri: redirectUri(),
      });
      return NextResponse.redirect(url);
    }

    // Both plugins connected → swap demo data for the real inbox/calendar.
    await markConnected();
    try {
      const counts = await initialSync();
      console.log(`initial sync: ${counts.emails} emails, ${counts.events} events`);
    } catch (err) {
      console.error("initial sync failed (app still usable)", err);
    }
    return NextResponse.redirect(`${appUrl}/app?connected=1`);
  } catch (err) {
    console.error("oauth callback failed", err);
    return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
  }
}
