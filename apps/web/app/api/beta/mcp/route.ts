import { handleBridgeRequest } from "@repo/gtm-cloud/bridge";
import { betaCtx, notConfigured, review } from "@/lib/beta";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The agent bridge: Streamable HTTP MCP, a bearer token per workspace. Agents read, add leads,
 * draft and ask for approval. No tool sends, posts or approves.
 */
async function handle(req: Request): Promise<Response> {
  const blocked = notConfigured();
  if (blocked) return blocked;
  try {
    return await handleBridgeRequest(betaCtx(), req, review);
  } catch (error) {
    console.error("[beta] mcp failed:", error);
    return Response.json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
