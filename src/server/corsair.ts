import "server-only";
import { getPool } from "./db";

/**
 * Live Corsair wiring. Activates when CORSAIR_KEK is set.
 * Corsair shares the app's Postgres pool — its tables
 * (corsair_integrations, corsair_accounts, …) live alongside ours.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let corsairInstance: any = null;

export function isLive(): boolean {
  return Boolean(process.env.CORSAIR_KEK);
}

export async function getCorsair() {
  if (!isLive()) throw new Error("Corsair live mode is not configured (CORSAIR_KEK missing)");
  if (corsairInstance) return corsairInstance;

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
  return corsairInstance;
}
