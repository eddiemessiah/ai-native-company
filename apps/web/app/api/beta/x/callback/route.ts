import { finishXConnect } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { betaCtx, notConfigured, sessionUser } from "@/lib/beta";

export const runtime = "nodejs";

/** X sends the founder back here with a code; only the workspace's owner can finish the connection. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const fail = NextResponse.redirect(new URL("/beta/desk?error=x", req.url), 303);
  if (notConfigured()) return fail;
  const state = params.get("state");
  const code = params.get("code");
  if (!state || !code) return fail; // the founder cancelled on X, or the link is broken
  const user = await sessionUser();
  if (!user) return NextResponse.redirect(new URL("/beta", req.url), 303);
  try {
    const ws = await finishXConnect(betaCtx(), state, code, user.id);
    return NextResponse.redirect(new URL(`/beta/desk?ws=${encodeURIComponent(ws.id)}&connected=x`, req.url), 303);
  } catch (error) {
    console.error("[beta] x callback failed:", error instanceof Error ? error.message : error);
    return fail;
  }
}
