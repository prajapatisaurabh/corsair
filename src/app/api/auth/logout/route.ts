import { NextResponse } from "next/server";
import { getPool, ready } from "@/server/db";
import { resetCorsair } from "@/server/corsair";

export async function POST() {
  await ready();
  const pool = getPool();

  // Clear user session data. Keep corsair_integrations (OAuth app config) so
  // re-login doesn't need to re-provision. Only delete account rows (user tokens).
  await pool.query(
    "DELETE FROM app_settings WHERE key IN ('google_connected', 'user_email', 'user_picture')",
  );
  await pool.query("DELETE FROM corsair_accounts");

  // Reset the in-memory singleton so getCorsair() re-provisions cleanly on next login.
  resetCorsair();

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/login`, { status: 303 });
}
