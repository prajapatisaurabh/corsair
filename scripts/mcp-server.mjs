// Tempo MCP server — exposes your connected Gmail + Google Calendar (via
// Corsair) as Model Context Protocol tools over stdio, so any MCP client
// (Claude Desktop, etc.) can read/triage mail and manage your calendar.
//
//   node --env-file=.env scripts/mcp-server.mjs
//
// Requires that you've already connected Google in the Tempo web app at least
// once (that's what stores the encrypted tokens). Set MCP_TENANT_ID to your
// Tempo session id — grab it from GET http://localhost:3456/api/me.
//
// NOTE: stdout is the MCP protocol channel — all logging here goes to stderr.

import { Pool } from "pg";
import { createCorsair } from "corsair";
import { setupCorsair } from "corsair/setup";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { runStdioMcpServer } from "@corsair-dev/mcp";

const log = (...a) => console.error("[tempo-mcp]", ...a);

const { DATABASE_URL, CORSAIR_KEK, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } =
  process.env;
const tenantId = process.env.MCP_TENANT_ID;

if (
  !DATABASE_URL ||
  !CORSAIR_KEK ||
  !GOOGLE_CLIENT_ID ||
  !GOOGLE_CLIENT_SECRET
) {
  log(
    "Missing env. Need DATABASE_URL, CORSAIR_KEK, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.",
  );
  process.exit(1);
}
if (!tenantId) {
  log(
    "Set MCP_TENANT_ID to your Tempo session id (GET /api/me in the running app).",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 4 });

const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: pool, // same Postgres the web app uses — tokens already stored here
  kek: CORSAIR_KEK,
  multiTenancy: true,
});

// Idempotent: ensures the integration rows + encrypted client credentials exist.
await setupCorsair(corsair);
for (const plugin of ["gmail", "googlecalendar"]) {
  await corsair.keys[plugin].set_client_id(GOOGLE_CLIENT_ID);
  await corsair.keys[plugin].set_client_secret(GOOGLE_CLIENT_SECRET);
}

log(`starting stdio MCP server for tenant ${tenantId.slice(0, 8)}…`);
await runStdioMcpServer({ corsair, tenantId });
