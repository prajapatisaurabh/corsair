import { NextResponse } from "next/server";
import { isConnected, getTenant } from "@/server/corsair";
import { getUserProfile, setUserProfile } from "@/server/db";
import { getUserId } from "@/server/session";

export async function GET() {
  const userId = await getUserId();
  const connected = await isConnected(userId);
  if (!userId || !connected) {
    return NextResponse.json({ connected: false, email: null, picture: null });
  }

  const cached = await getUserProfile(userId);
  if (cached.email) {
    return NextResponse.json({
      connected: true,
      email: cached.email,
      picture: cached.picture,
    });
  }

  try {
    const corsair = await getTenant(userId);
    const accessToken = await corsair.gmail.keys.get_access_token();
    if (!accessToken) {
      return NextResponse.json({ connected: true, email: null, picture: null });
    }

    // userinfo works with any valid Google OAuth token regardless of Gmail API being enabled
    const userinfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (userinfoRes.ok) {
      const info = await userinfoRes.json();
      const email: string | null = info.email ?? null;
      const picture: string | null = info.picture ?? null;
      if (email) await setUserProfile(userId, email, picture);
      return NextResponse.json({ connected: true, email, picture });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({ connected: true, email: null, picture: null });
}
