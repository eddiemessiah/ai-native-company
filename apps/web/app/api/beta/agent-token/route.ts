import { rotateAgentToken } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { z } from "zod";
import { beta, betaCtx, BetaError, readJson, requireOwner, requireUser } from "@/lib/beta";

export const runtime = "nodejs";

const body = z.object({ workspaceId: z.string().min(1).max(100) });

/** A new agent token for the MCP bridge. Shown once; the old one stops working. */
export async function POST(req: Request) {
  return beta(async () => {
    const user = await requireUser();
    const parsed = body.safeParse(await readJson(req));
    if (!parsed.success) throw new BetaError("Which workspace?");
    const ws = await requireOwner(user.id, parsed.data.workspaceId);
    const c = betaCtx();
    const { token } = await rotateAgentToken(c, ws);
    return NextResponse.json({ token, mcpUrl: `${c.cfg.siteUrl}/api/beta/mcp` }, { headers: { "cache-control": "no-store" } });
  }, req);
}
