import { NextResponse } from "next/server";
import { getPool, ready } from "@/server/db";

export async function POST() {
  await ready();
  const pool = getPool();

  // Clear the connected flag and wipe all stored OAuth tokens / Corsair account rows.
  await pool.query("DELETE FROM app_settings WHERE key IN ('google_connected', 'user_email')");
  await pool.query("DELETE FROM corsair_accounts");
  await pool.query("DELETE FROM corsair_integrations");

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/login`, { status: 303 });
}
