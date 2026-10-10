import { NextResponse } from "next/server";
import { beta, deskData, requireOwner, requireUser } from "@/lib/beta";

export const runtime = "nodejs";

/** The Desk's data: the workspace without its secrets, the actions with their links, the last 30 events. */
export async function GET(_req: Request, ctx: RouteContext<"/api/beta/workspaces/[id]">) {
  return beta(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const ws = await requireOwner(user.id, id);
    return NextResponse.json(await deskData(ws), { headers: { "cache-control": "no-store" } });
  });
}
