import { telegramLinkUrl } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { z } from "zod";
import { beta, betaCtx, BetaError, readJson, requireOwner, requireUser } from "@/lib/beta";

export const runtime = "nodejs";

const body = z.object({ workspaceId: z.string().min(1).max(100) });

/** The one-tap link that binds this workspace to the founder's Telegram (valid 15 minutes). */
export async function POST(req: Request) {
  return beta(async () => {
    const user = await requireUser();
    const parsed = body.safeParse(await readJson(req));
    if (!parsed.success) throw new BetaError("Which workspace?");
    const ws = await requireOwner(user.id, parsed.data.workspaceId);
    const url = await telegramLinkUrl(betaCtx(), ws);
    if (!url) throw new BetaError("The Telegram bot isn't configured on this deployment.", 503);
    return NextResponse.json({ url });
  }, req);
}
