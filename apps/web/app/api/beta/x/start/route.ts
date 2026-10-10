import { startXConnect } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { betaCtx, notConfigured, requireOwner, sessionUser } from "@/lib/beta";

export const runtime = "nodejs";

/** Sends the founder to X to connect their account (OAuth 2.0 with PKCE). */
export async function GET(req: Request) {
  const wsId = new URL(req.url).searchParams.get("ws") ?? "";
  const back = (query: string) => NextResponse.redirect(new URL(`/beta/desk?${wsId ? `ws=${encodeURIComponent(wsId)}&` : ""}${query}`, req.url), 303);
  if (notConfigured()) return back("error=x");
  const user = await sessionUser();
  if (!user) return NextResponse.redirect(new URL("/beta", req.url), 303);
  try {
    const ws = await requireOwner(user.id, wsId);
    if (!betaCtx().cfg.x) return back("error=x");
    return NextResponse.redirect(await startXConnect(betaCtx(), ws), 303);
  } catch (error) {
    console.error("[beta] x start failed:", error instanceof Error ? error.message : error);
    return back("error=x");
  }
}
