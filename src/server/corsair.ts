import "server-only";
import { randomUUID } from "node:crypto";
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

/** Plugins whose Google scopes we bundle into a single consent. */
const GOOGLE_PLUGINS = ["gmail", "googlecalendar"] as const;

/**
 * Union of the OAuth scopes across the Gmail + Calendar plugins, read straight
 * off the plugin definitions so it stays in sync with the SDK. We request all
 * of these in ONE consent screen (see /api/auth/connect) instead of one
 * consent per plugin.
 */
export async function combinedGoogleScopes(): Promise<string[]> {
  const corsair = await getCorsair();
  const scopes = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const plugin of (corsair.plugins ?? []) as any[]) {
    if ((GOOGLE_PLUGINS as readonly string[]).includes(plugin.id)) {
      for (const s of plugin.oauthConfig?.scopes ?? []) scopes.add(s);
    }
  }
  if (!scopes.size) throw new Error("no Google plugin scopes found");
  return [...scopes];
}

/**
 * Combined-consent linker. After the single Google consent (run as the gmail
 * flow, but with calendar scope included), the resulting token already grants
 * Calendar too — so we copy it onto the googlecalendar plugin instead of asking
 * the user to approve a second screen. Same Google account + refresh token, so
 * the calendar plugin can refresh on its own from here.
 *
 * Provisions the googlecalendar account row + its DEK the same way Corsair's
 * OAuth callback would, using Corsair's own exported crypto helpers. Idempotent.
 */
export async function linkGoogleTokenToCalendar(userId: string): Promise<void> {
  await getCorsair(); // ensure integrations are provisioned before we query them
  const pool = getPool();

  const { rows } = await pool.query(
    "SELECT id FROM corsair_integrations WHERE name = $1",
    ["googlecalendar"],
  );
  const integrationId = rows[0]?.id;
  if (!integrationId) {
    throw new Error("googlecalendar integration not provisioned");
  }

  // Ensure the tenant has a googlecalendar account with its own DEK to encrypt
  // the token under (the token setters require an existing account + DEK).
  const existing = await pool.query(
    "SELECT 1 FROM corsair_accounts WHERE tenant_id = $1 AND integration_id = $2",
    [userId, integrationId],
  );
  if (!existing.rows.length) {
    const { generateDEK, encryptDEK } = await import("corsair/core");
    const encryptedDek = await encryptDEK(generateDEK(), process.env.CORSAIR_KEK!);
    await pool.query(
      `INSERT INTO corsair_accounts (id, tenant_id, integration_id, config, dek)
       VALUES ($1, $2, $3, '{}'::jsonb, $4)`,
      [randomUUID(), userId, integrationId, encryptedDek],
    );
  }

  // Copy the token from gmail (where the callback stored it) to googlecalendar.
  const tenant = await getTenant(userId);
  const accessToken = await tenant.gmail.keys.get_access_token();
  if (!accessToken) throw new Error("no access token to link to calendar");
  const refreshToken = await tenant.gmail.keys.get_refresh_token();
  const expiresAt = await tenant.gmail.keys.get_expires_at();

  await tenant.googlecalendar.keys.set_access_token(accessToken);
  if (refreshToken) await tenant.googlecalendar.keys.set_refresh_token(refreshToken);
  if (expiresAt) await tenant.googlecalendar.keys.set_expires_at(expiresAt);
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
