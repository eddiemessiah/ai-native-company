import { connectSlack, isSlackWebhook } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { z } from "zod";
import { beta, betaCtx, BetaError, publicWorkspace, readJson, requireOwner, requireUser } from "@/lib/beta";

export const runtime = "nodejs";

const body = z.object({
  workspaceId: z.string().min(1).max(100),
  webhook: z.string().trim().max(500),
  label: z.string().max(60).optional(),
});

/** A Slack incoming webhook, tested with one message, then stored encrypted. */
export async function POST(req: Request) {
  return beta(async () => {
    const user = await requireUser();
    const parsed = body.safeParse(await readJson(req));
    if (!parsed.success) throw new BetaError("Paste the webhook URL.");
    const ws = await requireOwner(user.id, parsed.data.workspaceId);
    const { webhook, label } = parsed.data;
    if (!isSlackWebhook(webhook)) throw new BetaError("Paste the incoming webhook URL Slack gave you (https://hooks.slack.com/services/…).");
    let next;
    try {
      next = await connectSlack(betaCtx(), ws, webhook, label ?? "");
    } catch (error) {
      console.error("[beta] slack connect failed:", error instanceof Error ? error.message : error);
      throw new BetaError("Slack didn't accept the test message. Check the webhook is still active, then try again.", 502);
    }
    return NextResponse.json({ workspace: publicWorkspace(next) });
  }, req);
}
