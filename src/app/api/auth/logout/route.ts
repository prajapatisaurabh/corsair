import { NextResponse } from "next/server";
import { deleteUserData } from "@/server/db";
import { getUserId, clearUserId } from "@/server/session";

export async function POST() {
  // Remove only the current user's data (emails, events, Corsair account
  // tokens, profile) — never touch other tenants. Integration-level OAuth
  // config (corsair_integrations) stays so the next login skips re-provisioning.
  const userId = await getUserId();
  if (userId) {
    await deleteUserData(userId);
  }
  await clearUserId();

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/login`, { status: 303 });
}
