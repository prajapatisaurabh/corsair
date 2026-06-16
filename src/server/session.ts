import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

/**
 * Per-user session. A random, httpOnly cookie identifies the browser/user and
 * doubles as the Corsair tenant id — every Google token, synced email/event,
 * and API call is scoped to this value so users never see each other's data.
 */
export const SESSION_COOKIE = "tempo_uid";
const COOKIE = SESSION_COOKIE;
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/** Current user id, or null if the visitor has no session yet. */
export async function getUserId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

/** Returns the current user id, minting (and setting) one if absent. */
export async function getOrCreateUserId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax (not Strict) so the cookie is sent on the top-level GET redirect
    // back from Google to /api/auth/callback.
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}

/** Drops the session cookie (logout). */
export async function clearUserId(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
