import { NextResponse } from "next/server";
import { isConnected, getCorsair } from "@/server/corsair";
import { getSetting, setSetting } from "@/server/db";

export async function GET() {
  const connected = await isConnected();
  if (!connected) {
    return NextResponse.json({ connected: false, email: null, picture: null });
  }

  const cachedEmail = await getSetting("user_email");
  const cachedPicture = await getSetting("user_picture");
  if (cachedEmail) {
    return NextResponse.json({ connected: true, email: cachedEmail, picture: cachedPicture });
  }

  try {
    const corsair = await getCorsair();
    const accessToken = await corsair.gmail.keys.get_access_token();
    if (!accessToken) {
      return NextResponse.json({ connected: true, email: null, picture: null });
    }

    // userinfo works with any valid Google OAuth token regardless of Gmail API being enabled
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (userinfoRes.ok) {
      const info = await userinfoRes.json();
      const email: string = info.email ?? null;
      const picture: string = info.picture ?? null;
      if (email) await setSetting("user_email", email);
      if (picture) await setSetting("user_picture", picture);
      return NextResponse.json({ connected: true, email, picture });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({ connected: true, email: null, picture: null });
}
