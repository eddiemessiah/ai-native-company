# nova-mcp

Nova's agent products as MCP tools, for Claude, Cursor or any MCP client. The server runs on the operator's machine and pays Nova per call over x402 with the operator's agent wallet, so the MCP client needs no payment support.

| Tool | What it answers | Price |
|---|---|---|
| `nova_check` | Should my agent pay this x402 request? Pay, confirm or block, with reasons | $0.01 |
| `nova_gate` | Execute, confirm or escalate this action, by risk tier | $0.01 |
| `nova_receipt` | Did this payment settle? A normalized, signed receipt | $0.01 |
| `nova_catalog` | Every Nova offer and endpoint | free |

## Configure

| Env var | Meaning |
|---|---|
| `NOVA_API_URL` | Nova's origin, e.g. `https://<nova-domain>` (default `http://localhost:3000`) |
| `NOVA_AGENT_PRIVATE_KEY` | `0x…` key of a wallet holding USDC on Celo (or Base). Use a dedicated, low-balance wallet. Without it, only free tools work. |
| `NOVA_MAX_PER_CALL` | Hard cap per payment, default `$0.05` |

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nova": {
      "command": "npx",
      "args": ["-y", "<published package name>"],
      "env": {
        "NOVA_API_URL": "https://<nova-domain>",
        "NOVA_AGENT_PRIVATE_KEY": "0x…",
        "NOVA_MAX_PER_CALL": "$0.05"
      }
    }
  }
}
```

**Claude Code:** `claude mcp add nova -e NOVA_API_URL=https://<nova-domain> -e NOVA_AGENT_PRIVATE_KEY=0x… -- npx -y <published package name>`

**Cursor:** the same `command`, `args` and `env` in `.cursor/mcp.json`.

From this repo, without publishing: `pnpm --filter @repo/mcp build`, then point the client at `node packages/mcp/dist/cli.js`.

## Publish

The workspace package is private so it can't be published by accident. To ship it: pick a name under your npm scope, remove `"private": true`, run `pnpm --filter @repo/mcp build`, then `npm publish --access public` from `packages/mcp`. Then list it in the MCP registries.

## Develop

`pnpm --filter @repo/mcp test` runs the tools against an in-memory MCP client and a fake Nova, with no network.
