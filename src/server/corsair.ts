import "server-only";
import { getPool, ready, isUserConnected, markUserConnected } from "./db";

/**
 * Corsair client. Shares the app's Postgres pool — Corsair's tables
 * (corsair_integrations, corsair_accounts, …) are created by db.ts and
 * the SDK stores envelope-encrypted Google tokens in them.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let corsairInstance: any = null;
let provisioned = false;

export function resetCorsair() {
  corsairInstance = null;
  provisioned = false;
}

/** Server has everything needed to run the Google OAuth flow. */
export function oauthConfigured(): boolean {
  return Boolean(
    process.env.CORSAIR_KEK &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET,
  );
}

/** This user has completed the connect flow → operate on their real data. */
export async function isConnected(userId: string | null): Promise<boolean> {
  if (!userId || !oauthConfigured()) return false;
  return isUserConnected(userId);
}

export async function markConnected(userId: string): Promise<void> {
  await markUserConnected(userId);
}

/**
 * Tenant-scoped Corsair client. Every Gmail/Calendar API call and token read
 * MUST go through this — withTenant(userId) isolates one user's credentials
 * and data from every other user's.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTenant(userId: string): Promise<any> {
  const corsair = await getCorsair();
  return corsair.withTenant(userId);
}

export async function getCorsair() {
  if (!process.env.CORSAIR_KEK) {
    throw new Error("Corsair is not configured (CORSAIR_KEK missing)");
  }
  await ready(); // corsair tables exist

  if (!corsairInstance) {
    const [{ createCorsair }, { gmail }, { googlecalendar }] =
      await Promise.all([
        import("corsair"),
        import("@corsair-dev/gmail"),
        import("@corsair-dev/googlecalendar"),
      ]);
    corsairInstance = createCorsair({
      plugins: [gmail(), googlecalendar()],
      database: getPool(),
      kek: process.env.CORSAIR_KEK!,
      multiTenancy: true,
    });
  }

  // One-time provisioning per process: integration-level only (shared OAuth
  // client_id/secret, stored encrypted, idempotent). Per-tenant account rows
  // are created on demand during the OAuth callback (processOAuthCallback).
  if (!provisioned && oauthConfigured()) {
    const { setupCorsair } = await import("corsair/setup");
    await setupCorsair(corsairInstance);
    for (const plugin of ["gmail", "googlecalendar"] as const) {
      await corsairInstance.keys[plugin].set_client_id(
        process.env.GOOGLE_CLIENT_ID!,
      );
      await corsairInstance.keys[plugin].set_client_secret(
        process.env.GOOGLE_CLIENT_SECRET!,
      );
    }
    provisioned = true;
  }

  return corsairInstance;
}

export function redirectUri(): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/api/auth/callback`;
}
