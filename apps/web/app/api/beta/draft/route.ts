import { CHANNELS, createAction } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { z } from "zod";
import { actionView, beta, betaCtx, BetaError, drafter, readJson, requireOwner, requireUser, review } from "@/lib/beta";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const body = z.object({
  workspaceId: z.string().min(1).max(100),
  request: z.string().trim().min(3).max(1000),
  channel: z.enum(CHANNELS).optional(),
});

/** "Ask the desk": the LLM writes one draft from a line, code checks it, the reviewer judges it. */
export async function POST(req: Request) {
  return beta(async () => {
    const user = await requireUser();
    const parsed = body.safeParse(await readJson(req));
    if (!parsed.success) throw new BetaError("Say what you need, like \"a post about Friday's demo\".");
    const ws = await requireOwner(user.id, parsed.data.workspaceId);
    const write = drafter();
    if (!write) throw new BetaError("Drafting by request needs a model on this deployment. Write the draft by hand for now.", 503);
    const limit = rateLimit(`beta-draft:${user.id}`, 30, 60 * 60_000);
    if (!limit.ok) throw new BetaError("That's 30 drafts this hour. Try again in a bit.", 429);

    const { request } = parsed.data;
    const channel = parsed.data.channel === "other" ? undefined : parsed.data.channel;
    const target = ws.telegramTargets.find((t) => request.toLowerCase().includes(t.title.toLowerCase()));
    const wanted = channel ?? (target ? "telegram_post" : undefined);
    let draft;
    try {
      draft = await write(ws, request, wanted ? { channel: wanted } : {});
    } catch (error) {
      console.error("[beta] draft failed:", error instanceof Error ? error.message : error);
      throw new BetaError("The model didn't answer. Try again, or write it by hand.", 502);
    }
    const to = draft.channel === "telegram_post" ? String((target ?? ws.telegramTargets[0])?.chatId ?? "") : draft.to;
    if (draft.channel === "telegram_post" && !to) {
      throw new BetaError("That reads like a post for your Telegram channel or group, but the bot isn't an admin in one yet. Add it there first.");
    }
    const verdict = await review(ws, draft.channel, draft.text);
    const action = await createAction(betaCtx(), ws, {
      channel: draft.channel,
      text: draft.text,
      ...(to ? { to } : {}),
      source: "web",
      author: "drafter",
      ...(verdict ? { review: verdict } : {}),
    });
    return NextResponse.json({ action: actionView(action) });
  }, req);
}
