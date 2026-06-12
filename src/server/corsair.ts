import "server-only";

/**
 * Live Corsair wiring. Activates when CORSAIR_KEK is set.
 *
 * Demo mode (no env) never touches this module's heavy imports because
 * everything is lazy — the in-memory provider is used instead.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let corsairInstance: any = null;

export function isLive(): boolean {
  return Boolean(process.env.CORSAIR_KEK);
}

export async function getCorsair() {
  if (!isLive()) throw new Error("Corsair live mode is not configured (CORSAIR_KEK missing)");
  if (corsairInstance) return corsairInstance;

  const [{ createCorsair }, { gmail }, { googlecalendar }, { default: Database }] =
    await Promise.all([
      import("corsair"),
      import("@corsair-dev/gmail"),
      import("@corsair-dev/googlecalendar"),
      import("better-sqlite3"),
    ]);

  const db = new Database(process.env.CORSAIR_DB_PATH ?? "corsair.db");

  corsairInstance = createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: db,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: false,
  });
  return corsairInstance;
}
