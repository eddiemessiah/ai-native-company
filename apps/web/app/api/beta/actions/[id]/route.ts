import { decide, editAction, getAction, markSent, requestApproval, retry, type Action } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { z } from "zod";
import { actionView, beta, betaCtx, BetaError, readJson, requireOwner, requireUser } from "@/lib/beta";

export const runtime = "nodejs";
export const maxDuration = 60;

const body = z.object({
  op: z.enum(["edit", "request", "approve", "reject", "retry", "retry_not_posted", "confirm_posted", "sent"]),
  text: z.string().max(4000).optional(),
  /** The hash of the text the founder was shown: a decision on changed text is refused (409). */
  hash: z.string().max(64).optional(),
  /** For confirm_posted: where it posted, if the founder pastes the link. */
  ref: z.string().trim().max(300).optional(),
});

/**
 * One step in an action's life, by its workspace's owner: edit, ask, approve, reject, retry,
 * say whether an unknown run posted, or "I sent it".
 */
export async function POST(req: Request, ctx: RouteContext<"/api/beta/actions/[id]">) {
  return beta(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const parsed = body.safeParse(await readJson(req));
    if (!parsed.success) throw new BetaError("Unknown step.");
    const c = betaCtx();
    const found = await getAction(c, id);
    if (!found) throw new BetaError("No such action.", 404);
    const ws = await requireOwner(user.id, found.workspaceId);
    const { op, text, hash, ref } = parsed.data;
    let action: Action;
    switch (op) {
      case "edit":
        if (!text?.trim()) throw new BetaError("Write the new text.");
        action = await editAction(c, ws, id, text, user.name);
        break;
      case "request":
        action = await requestApproval(c, ws, id);
        break;
      case "approve":
      case "reject":
        if (!hash) throw new BetaError("Missing the text's fingerprint; refresh and decide again.");
        action = await decide(c, ws, id, op === "approve" ? "approved" : "rejected", user.name, "web", hash);
        break;
      case "retry":
        action = await retry(c, ws, id);
        break;
      case "retry_not_posted":
        action = await retry(c, ws, id, { confirmedNotPosted: true });
        break;
      case "confirm_posted":
        if (ref && !ref.startsWith("https://")) throw new BetaError("Paste the post's https:// link, or leave it empty.");
        action = await retry(c, ws, id, { postedRef: ref ?? "" });
        break;
      case "sent":
        action = await markSent(c, ws, id, user.name);
        break;
    }
    return NextResponse.json({ action: actionView(action) });
  }, req);
}
