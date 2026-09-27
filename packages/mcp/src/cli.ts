#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";
import { createNovaServer } from "./server.js";

/**
 * nova-mcp: Nova's tools over stdio for Claude, Cursor or any MCP client.
 *
 *   NOVA_API_URL            Nova's origin (default http://localhost:3000)
 *   NOVA_AGENT_PRIVATE_KEY  0x… key of a wallet holding USDC on Celo or Base; without it only free tools work
 *   NOVA_MAX_PER_CALL       hard cap per payment (default $0.05)
 */

const baseUrl = process.env.NOVA_API_URL || "http://localhost:3000";
const key = process.env.NOVA_AGENT_PRIVATE_KEY;
const cap = process.env.NOVA_MAX_PER_CALL || "$0.05";

let paidFetch: typeof fetch = fetch;
if (key && /^0x[0-9a-fA-F]{64}$/.test(key)) {
  const client = new x402Client().register("eip155:*", new ExactEvmScheme(privateKeyToAccount(key as `0x${string}`)));
  client.setSpendControls({ maxAmountPerPayment: cap });
  paidFetch = wrapFetchWithPayment(fetch, client);
} else if (key) {
  console.error("nova-mcp: NOVA_AGENT_PRIVATE_KEY must be 0x followed by 64 hex characters; paid tools are off.");
}

const server = createNovaServer({ baseUrl, fetch: paidFetch });
await server.connect(new StdioServerTransport());
console.error(`nova-mcp: connected to ${baseUrl}${paidFetch === fetch ? " (free tools only)" : `, paying up to ${cap} per call`}`);
