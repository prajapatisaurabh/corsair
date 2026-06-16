import { NextRequest, NextResponse } from "next/server";
import { deleteUserData } from "@/server/db";
import { getUserId, SESSION_COOKIE } from "@/server/session";

export async function POST(req: NextRequest) {
  // Clean up the current user's data (emails, events, Corsair account tokens,
  // profile) — never touch other tenants. Wrapped in try/catch so logout still
  // succeeds even if cleanup fails (e.g. transient DB error).
  try {
    const userId = await getUserId();
    if (userId) await deleteUserData(userId);
  } catch (err) {
    console.error("logout cleanup failed (clearing session anyway)", err);
  }

  // Redirect relative to the request origin so it always lands on the same
  // host the user is on (avoids any APP_URL misconfiguration), and clear the
  // session cookie directly on this response.
  const res = NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
