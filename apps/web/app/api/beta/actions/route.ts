import { CHANNELS, createAction } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { z } from "zod";
import { actionView, beta, betaCtx, BetaError, readJson, requireOwner, requireUser, review } from "@/lib/beta";

export const runtime = "nodejs";

const body = z.object({
  workspaceId: z.string().min(1).max(100),
  channel: z.enum(CHANNELS),
  text: z.string().min(1).max(4000),
  to: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
});

/** A draft written by hand on the Desk. Code checks it, the reviewer judges it, the founder approves it. */
export async function POST(req: Request) {
  return beta(async () => {
    const user = await requireUser();
    const parsed = body.safeParse(await readJson(req));
    if (!parsed.success) throw new BetaError("Pick a channel and write the message (4,000 characters at most).");
    const { workspaceId, channel, text } = parsed.data;
    const to = parsed.data.to?.trim();
    const subject = parsed.data.subject?.trim();
    const ws = await requireOwner(user.id, workspaceId);
    if (channel === "telegram_post" && !to) throw new BetaError("Pick the Telegram group or channel it goes to.");
    const verdict = channel === "other" ? null : await review(ws, channel, text);
    const action = await createAction(betaCtx(), ws, {
      channel,
      text,
      ...(to ? { to } : {}),
      ...(subject && channel === "email" ? { subject } : {}),
      source: "web",
      author: user.name,
      ...(verdict ? { review: verdict } : {}),
    });
    return NextResponse.json({ action: actionView(action) });
  }, req);
}
