import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Nova as MCP tools. The server only speaks HTTP to Nova's API; whoever builds
 * it passes a fetch that pays x402 402s (the CLI wraps fetch with the
 * operator's wallet), so any MCP client can use paid tools without knowing
 * about x402.
 */

export interface NovaServerOptions {
  /** Nova's API origin, e.g. https://nova.example. */
  readonly baseUrl: string;
  /** A fetch that pays x402 402s, or plain fetch (then only free tools work). */
  readonly fetch: typeof fetch;
  readonly version?: string;
}

interface ToolResult {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

const text = (t: string, isError = false): ToolResult => ({ content: [{ type: "text", text: t }], ...(isError ? { isError } : {}) });

export const NO_PAYMENT =
  "Nova asked for payment and none was made. Set NOVA_AGENT_PRIVATE_KEY to a wallet holding USDC on Celo or Base, and NOVA_MAX_PER_CALL at or above the tool's price.";

async function call(opts: NovaServerOptions, path: string, init?: RequestInit): Promise<ToolResult> {
  let res: Response;
  try {
    res = await opts.fetch(new URL(path, opts.baseUrl), init);
  } catch (error) {
    return text(`Could not reach Nova at ${opts.baseUrl}: ${error instanceof Error ? error.message : String(error)}`, true);
  }
  const body = await res.text();
  if (res.status === 402) return text(NO_PAYMENT, true);
  if (!res.ok) return text(`Nova answered ${res.status}: ${body.slice(0, 2000)}`, true);
  return text(body);
}

const post = (opts: NovaServerOptions, path: string, body: unknown) =>
  call(opts, path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const risk = z.enum(["read", "write", "external", "money", "irreversible"]);

export function createNovaServer(opts: NovaServerOptions): McpServer {
  const server = new McpServer({ name: "nova", version: opts.version ?? "0.1.0" });

  server.registerTool(
    "nova_check",
    {
      title: "Nova Check: should my agent pay this?",
      description:
        "Call before paying any x402 API. Send its PAYMENT-REQUIRED header and get pay, confirm or block, with the reasons: known stablecoin, amount against budget, a real payee, the signing domain, the host you called, and (with task) whether the purchase serves the user's task. Costs $0.01.",
      inputSchema: {
        paymentRequired: z.string().describe("The PAYMENT-REQUIRED header value (base64 JSON), or the JSON itself"),
        url: z.string().url().optional().describe("The URL your agent called"),
        task: z.string().optional().describe("What the user asked for; enables the intent check"),
        budgetUsd: z.number().nonnegative().optional().describe("The most your agent may spend on this call"),
        autoApproveUsd: z.number().nonnegative().optional().describe("Above this the verdict is at most confirm; default 0.10"),
      },
    },
    (args) => post(opts, "/api/v1/check", args),
  );

  server.registerTool(
    "nova_gate",
    {
      title: "Nova Gate: execute, confirm or escalate?",
      description:
        "Call before an agent sends, deletes, books or pays. Judges the action against the user's request with one confidence bar per risk tier; money and irreversible actions are at most prepared for a person. Costs $0.01.",
      inputSchema: {
        action: z.string().describe("What the agent is about to do"),
        request: z.string().describe("What the user asked for"),
        risk: risk.describe("read | write | external | money | irreversible"),
        context: z.string().optional().describe("Relevant conversation or state"),
      },
    },
    (args) => post(opts, "/api/v1/gate", args),
  );

  server.registerTool(
    "nova_receipt",
    {
      title: "Nova Receipt: proof of a payment",
      description:
        "Call after an x402 payment. Send the PAYMENT-RESPONSE header, or the network and transaction hash, and get a normalized, signed receipt checked against what you expected. Costs $0.01.",
      inputSchema: {
        paymentResponse: z.string().optional().describe("The PAYMENT-RESPONSE header value"),
        network: z.string().optional().describe("CAIP-2 network, e.g. eip155:42220"),
        transaction: z.string().optional().describe("The settlement transaction hash"),
        expected: z
          .object({ payTo: z.string().optional(), amount: z.string().optional(), payer: z.string().optional() })
          .optional()
          .describe("What you expected: payee, amount in atomic units, payer"),
      },
    },
    (args) => post(opts, "/api/v1/receipt", args),
  );

  server.registerTool(
    "nova_catalog",
    {
      title: "Nova catalog",
      description: "Every Nova offer and paid endpoint, with prices. Free.",
      inputSchema: {},
    },
    () => call(opts, "/api/v1/catalog"),
  );

  return server;
}
