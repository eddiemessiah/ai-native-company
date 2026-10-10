import { signUp } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { z } from "zod";
import { beta, betaCtx, BetaError, readJson, setSession } from "@/lib/beta";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const body = z.object({
  name: z.string().max(200),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  invite: z.string().max(200).optional(),
});

/** No password: the session cookie is the account on this device; Telegram signs it in elsewhere. */
export async function POST(req: Request) {
  return beta(async () => {
    const limit = rateLimit(`beta-signup:${clientKey(req)}`, 10, 60 * 60_000);
    if (!limit.ok) throw new BetaError("Too many sign-ups from your network. Try again later.", 429);
    const parsed = body.safeParse(await readJson(req));
    if (!parsed.success) throw new BetaError("Check your name and email.");
    const { name, email, invite } = parsed.data;
    const { cookie } = await signUp(betaCtx(), { name, ...(email ? { email } : {}), ...(invite ? { invite } : {}) });
    await setSession(cookie);
    return NextResponse.json({ ok: true });
  }, req);
}
