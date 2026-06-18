# Tempo as an MCP server

Tempo exposes your connected **Gmail + Google Calendar** (through Corsair) as
[Model Context Protocol](https://modelcontextprotocol.io) tools. Point any MCP
client — Claude Desktop, the Claude Agent SDK, etc. — at it and an agent can
read, triage, draft, and schedule on your real account:

> _"Archive every newsletter in my inbox, then book a 30-min slot with
> alex@acme.com next Tuesday afternoon."_

Corsair sits on **both** sides: it powers Tempo's own UI **and** the agent's
tools. Same encrypted tokens, same Postgres, no extra OAuth.

## Prerequisites

1. You've connected Google in the Tempo web app at least once (this stores the
   encrypted tokens in Postgres).
2. Postgres is running and `.env` has `DATABASE_URL`, `CORSAIR_KEK`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## 1. Find your tenant id

With the app running, open <http://localhost:3456/api/me> (while signed in) and
copy `userId`. That's the tenant whose Gmail/Calendar the MCP server will drive.

## 2. Run it standalone (quick check)

```bash
MCP_TENANT_ID=<your-userId> npm run mcp
```

It speaks MCP over stdio. Ctrl-C to stop.

## 3. Wire it into Claude Desktop

Edit `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`) and
add — use **absolute paths**:

```json
{
  "mcpServers": {
    "tempo": {
      "command": "node",
      "args": [
        "--env-file=/ABSOLUTE/PATH/TO/corsair/.env",
        "/ABSOLUTE/PATH/TO/corsair/scripts/mcp-server.mjs"
      ],
      "env": {
        "MCP_TENANT_ID": "your-userId-from-step-1"
      }
    }
  }
}
```

Restart Claude Desktop. "tempo" appears in the tools menu (🔌), exposing the
Corsair Gmail + Calendar operations. Try: _"What's on my calendar tomorrow, and
which unread emails look urgent?"_

## How it works

`scripts/mcp-server.mjs` builds a Corsair instance against the **same** Postgres
the web app uses, then calls `runStdioMcpServer({ corsair, tenantId })` from
`@corsair-dev/mcp`. Corsair turns every registered Gmail/Calendar endpoint into
an MCP tool and scopes all calls to your tenant.
