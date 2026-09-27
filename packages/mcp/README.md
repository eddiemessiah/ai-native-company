# shonin-mcp

Shonin's agent products as MCP tools, for Claude, Cursor or any MCP client. The server runs on the operator's machine and pays Shonin per call over x402 with the operator's agent wallet, so the MCP client needs no payment support.

| Tool | What it answers | Price |
|---|---|---|
| `shonin_check` | Should my agent pay this x402 request? Pay, confirm or block, with reasons | $0.01 |
| `shonin_gate` | Execute, confirm or escalate this action, by risk tier | $0.01 |
| `shonin_receipt` | Did this payment settle? A normalized, signed receipt | $0.01 |
| `shonin_catalog` | Every Shonin offer and endpoint | free |

## Configure

| Env var | Meaning |
|---|---|
| `SHONIN_API_URL` | Shonin's origin, e.g. `https://<shonin-domain>` (default `http://localhost:3000`) |
| `SHONIN_AGENT_PRIVATE_KEY` | `0x…` key of a wallet holding USDC on Celo (or Base). Use a dedicated, low-balance wallet. Without it, only free tools work. |
| `SHONIN_MAX_PER_CALL` | Hard cap per payment, default `$0.05` |

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "shonin": {
      "command": "npx",
      "args": ["-y", "<published package name>"],
      "env": {
        "SHONIN_API_URL": "https://<shonin-domain>",
        "SHONIN_AGENT_PRIVATE_KEY": "0x…",
        "SHONIN_MAX_PER_CALL": "$0.05"
      }
    }
  }
}
```

**Claude Code:** `claude mcp add shonin -e SHONIN_API_URL=https://<shonin-domain> -e SHONIN_AGENT_PRIVATE_KEY=0x… -- npx -y <published package name>`

**Cursor:** the same `command`, `args` and `env` in `.cursor/mcp.json`.

From this repo, without publishing: `pnpm --filter @repo/mcp build`, then point the client at `node packages/mcp/dist/cli.js`.

## Publish

The workspace package is private so it can't be published by accident. To ship it: pick a name under your npm scope, remove `"private": true`, run `pnpm --filter @repo/mcp build`, then `npm publish --access public` from `packages/mcp`. Then list it in the MCP registries.

## Develop

`pnpm --filter @repo/mcp test` runs the tools against an in-memory MCP client and a fake Shonin, with no network.
