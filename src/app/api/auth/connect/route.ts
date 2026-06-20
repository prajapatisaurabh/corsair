import { NextResponse } from "next/server";
import {
  getCorsair,
  oauthConfigured,
  redirectUri,
  combinedGoogleScopes,
} from "@/server/corsair";
import { getOrCreateUserId } from "@/server/session";
import { errorResponse } from "@/server/http";

/**
 * POST /api/auth/connect → { url } Google consent screen via Corsair.
 *
 * ONE consent screen covers both plugins: we run Corsair's gmail OAuth flow but
 * widen its scope to the Gmail + Calendar union, so Google asks once. The
 * callback then links the resulting token to googlecalendar — no second screen.
 */
export async function POST() {
  if (!oauthConfigured()) {
    return errorResponse(
      "Google OAuth isn't configured on this server yet.",
      503,
    );
  }

  try {
    // Mint (or reuse) this browser's user id — it becomes the Corsair tenant.
    const userId = await getOrCreateUserId();
    const corsair = await getCorsair();
    const { generateOAuthUrl } = await import("corsair/oauth");
    const { url } = await generateOAuthUrl(corsair, "gmail", {
      tenantId: userId,
      redirectUri: redirectUri(),
    });
    // Corsair's gmail URL only carries gmail scopes; widen it to also include
    // the Calendar scope so a single consent grants both. State is unchanged
    // (still Corsair-signed for the gmail plugin), so the callback round-trips.
    const consentUrl = new URL(url);
    consentUrl.searchParams.set(
      "scope",
      (await combinedGoogleScopes()).join(" "),
    );
    return NextResponse.json({ url: consentUrl.toString() });
  } catch (err) {
    console.error("connect link generation failed", err);
    // Return the full error detail (message, name, status, stack) so the
    // failure is debuggable straight from the client/network response.
    return errorResponse(err, 500);
  }
}
