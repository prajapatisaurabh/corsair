import "server-only";
import { getPool, ready, getSetting, setSetting } from "./db";

/**
 * Corsair client. Shares the app's Postgres pool — Corsair's tables
 * (corsair_integrations, corsair_accounts, …) are created by db.ts and
 * the SDK stores envelope-encrypted Google tokens in them.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let corsairInstance: any = null;
let provisioned = false;

/** Server has everything needed to run the Google OAuth flow. */
export function oauthConfigured(): boolean {
  return Boolean(
    process.env.CORSAIR_KEK && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

/** A Google account has completed the connect flow → operate on real data. */
export async function isConnected(): Promise<boolean> {
  if (!oauthConfigured()) return false;
  return (await getSetting("google_connected")) === "true";
}

export async function markConnected(): Promise<void> {
  await setSetting("google_connected", "true");
}

export async function getCorsair() {
  if (!process.env.CORSAIR_KEK) {
    throw new Error("Corsair is not configured (CORSAIR_KEK missing)");
  }
  await ready(); // corsair tables exist

  if (!corsairInstance) {
    const [{ createCorsair }, { gmail }, { googlecalendar }] = await Promise.all([
      import("corsair"),
      import("@corsair-dev/gmail"),
      import("@corsair-dev/googlecalendar"),
    ]);
    corsairInstance = createCorsair({
      plugins: [gmail(), googlecalendar()],
      database: getPool(),
      kek: process.env.CORSAIR_KEK!,
      multiTenancy: false,
    });
  }

  // One-time provisioning per process: integration/account rows + DEKs,
  // then register the Google OAuth client (stored encrypted, idempotent).
  if (!provisioned && oauthConfigured()) {
    const { setupCorsair } = await import("corsair/setup");
    await setupCorsair(corsairInstance);
    for (const plugin of ["gmail", "googlecalendar"] as const) {
      await corsairInstance.keys[plugin].set_client_id(process.env.GOOGLE_CLIENT_ID!);
      await corsairInstance.keys[plugin].set_client_secret(process.env.GOOGLE_CLIENT_SECRET!);
    }
    provisioned = true;
  }

  return corsairInstance;
}

export function redirectUri(): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/api/auth/callback`;
}
