import { redeemLoginCode, SESSION_COOKIE } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { betaCtx, notConfigured, sessionCookieOptions } from "@/lib/beta";

export const runtime = "nodejs";

/** The one-time sign-in link the Telegram bot sends (/login): ten minutes, one use. */
export async function GET(req: Request) {
  const fail = NextResponse.redirect(new URL("/beta?error=login", req.url), 303);
  if (notConfigured()) return fail;
  const code = new URL(req.url).searchParams.get("code");
  if (!code || code.length > 100) return fail;
  try {
    const { cookie } = await redeemLoginCode(betaCtx(), code);
    const res = NextResponse.redirect(new URL("/beta/desk", req.url), 303);
    res.cookies.set(SESSION_COOKIE, cookie, sessionCookieOptions());
    return res;
  } catch {
    return fail;
  }
}
