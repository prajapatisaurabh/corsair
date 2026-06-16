import { NextResponse } from "next/server";
import { isConnected, getTenant } from "@/server/corsair";
import { getUserProfile, setUserProfile } from "@/server/db";
import { getUserId } from "@/server/session";

export async function GET() {
  const userId = await getUserId();
  const connected = await isConnected(userId);
  if (!userId || !connected) {
    return NextResponse.json({ connected: false, email: null, name: null, picture: null });
  }

  const cached = await getUserProfile(userId);
  if (cached.email) {
    return NextResponse.json({
      connected: true,
      email: cached.email,
      name: cached.name ?? deriveName(cached.email),
      picture: cached.picture,
    });
  }

  try {
    const corsair = await getTenant(userId);
    const accessToken = await corsair.gmail.keys.get_access_token();
    if (!accessToken) {
      return NextResponse.json({ connected: true, email: null, name: null, picture: null });
    }
    const headers = { Authorization: `Bearer ${accessToken}` };

    let email: string | null = null;
    let name: string | null = null;
    let picture: string | null = null;

    // Best effort: userinfo gives name + picture, but only if the token carries
    // the openid/email/profile scope (not guaranteed with Gmail-only scopes).
    try {
      const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers });
      if (r.ok) {
        const info = await r.json();
        email = info.email ?? null;
        name = info.name ?? null;
        picture = info.picture ?? null;
      }
    } catch {
      // ignore — fall back to Gmail profile below
    }

    // Reliable with the gmail.* scopes we actually request: the mailbox's own
    // email address.
    if (!email) {
      try {
        const r = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/profile",
          { headers }
        );
        if (r.ok) {
          const p = await r.json();
          email = p.emailAddress ?? null;
        }
      } catch {
        // ignore
      }
    }

    if (!name && email) name = deriveName(email);
    if (email) await setUserProfile(userId, email, picture, name);

    return NextResponse.json({ connected: true, email, name, picture });
  } catch {
    return NextResponse.json({ connected: true, email: null, name: null, picture: null });
  }
}

/** Fallback display name from an email local-part, e.g. "jane.doe" → "Jane Doe". */
function deriveName(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
