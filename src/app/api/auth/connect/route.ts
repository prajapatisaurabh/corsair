import { NextResponse } from "next/server";
import { getCorsair, oauthConfigured, redirectUri } from "@/server/corsair";

/**
 * POST /api/auth/connect → { url } Google consent screen via Corsair.
 *
 * The flow covers both plugins: gmail first, the callback then chains to
 * googlecalendar (same Google account, second consent is instant).
 */
export async function POST() {
  if (!oauthConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth isn't configured on this server yet." },
      { status: 503 }
    );
  }

  try {
    const corsair = await getCorsair();
    const { generateOAuthUrl } = await import("corsair/oauth");
    const { url } = await generateOAuthUrl(corsair, "gmail", {
      tenantId: "default",
      redirectUri: redirectUri(),
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("connect link generation failed", err);
    return NextResponse.json({ error: "Could not start the Google flow." }, { status: 500 });
  }
}
