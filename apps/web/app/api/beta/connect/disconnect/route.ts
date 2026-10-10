import { disconnect } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { z } from "zod";
import { beta, betaCtx, BetaError, publicWorkspace, readJson, requireOwner, requireUser } from "@/lib/beta";

export const runtime = "nodejs";

const body = z.object({ workspaceId: z.string().min(1).max(100), tool: z.enum(["slack", "x", "telegram"]) });

export async function POST(req: Request) {
  return beta(async () => {
    const user = await requireUser();
    const parsed = body.safeParse(await readJson(req));
    if (!parsed.success) throw new BetaError("Which connection?");
    const ws = await requireOwner(user.id, parsed.data.workspaceId);
    const next = await disconnect(betaCtx(), ws, parsed.data.tool);
    return NextResponse.json({ workspace: publicWorkspace(next) });
  }, req);
}
