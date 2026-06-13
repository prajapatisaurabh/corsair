import { NextResponse } from "next/server";
import { isConnected, getCorsair } from "@/server/corsair";
import { getSetting, setSetting } from "@/server/db";

export async function GET() {
  if (!(await isConnected())) {
    return NextResponse.json({ email: null });
  }

  // Return cached value if available.
  const cached = await getSetting("user_email");
  if (cached) return NextResponse.json({ email: cached });

  try {
    const corsair = await getCorsair();
    const accessToken = await corsair.gmail.keys.get_access_token();
    if (!accessToken) return NextResponse.json({ email: null });

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return NextResponse.json({ email: null });

    const data = await res.json();
    const email: string = data.emailAddress ?? null;
    if (email) await setSetting("user_email", email);
    return NextResponse.json({ email });
  } catch {
    return NextResponse.json({ email: null });
  }
}
