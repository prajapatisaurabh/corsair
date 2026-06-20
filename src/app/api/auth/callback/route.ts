import { NextRequest, NextResponse } from "next/server";
import {
  getCorsair,
  markConnected,
  redirectUri,
  linkGoogleTokenToCalendar,
} from "@/server/corsair";
import { initialSync } from "@/server/sync";

/**
 * GET /api/auth/callback — Google redirects here with ?code&state.
 *
 * Corsair exchanges the code and stores tokens encrypted in Postgres. The
 * single combined consent already granted Calendar, so we link that token to
 * googlecalendar (no second screen) and backfill. If linking ever fails we
 * fall back to the original second Google consent so connect still completes.
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
    const { processOAuthCallback, generateOAuthUrl } =
      await import("corsair/oauth");
    // tenantId is recovered from the signed OAuth state — the authoritative
    // user the tokens were just stored under.
    const { plugin, tenantId } = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: redirectUri(),
    });

    if (plugin === "gmail") {
      // Combined consent already granted Calendar — link the token onto the
      // googlecalendar plugin instead of asking for a second consent.
      try {
        await linkGoogleTokenToCalendar(tenantId);
      } catch (err) {
        // Safety net: if linking fails, fall back to the original second Google
        // consent (same account, instant approve) so connect still finishes.
        console.error(
          "combined-consent link failed; falling back to calendar consent",
          err,
        );
        const { url } = await generateOAuthUrl(corsair, "googlecalendar", {
          tenantId,
          redirectUri: redirectUri(),
        });
        return NextResponse.redirect(url);
      }
    }

    // Both plugins connected → backfill this user's real inbox/calendar.
    await markConnected(tenantId);
    try {
      const counts = await initialSync(tenantId);
      console.log(
        `initial sync: ${counts.emails} emails, ${counts.events} events`,
      );
    } catch (err) {
      console.error("initial sync failed (app still usable)", err);
    }
    return NextResponse.redirect(`${appUrl}/app?connected=1`);
  } catch (err) {
    console.error("oauth callback failed", err);
    return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
  }
}
