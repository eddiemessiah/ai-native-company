import { setWebhook } from "@repo/gtm-cloud";
import { NextResponse } from "next/server";
import { beta, betaCtx, BetaError, sameSecret } from "@/lib/beta";

export const runtime = "nodejs";

/**
 * Points the bot's webhook at this deployment. Run once after a deploy:
 *   curl -X POST $SITE/api/beta/telegram/setup -H "authorization: Bearer $BETA_ADMIN_TOKEN"
 */
export async function POST(req: Request) {
  return beta(async () => {
    const admin = process.env.BETA_ADMIN_TOKEN;
    if (!admin) throw new BetaError("Set BETA_ADMIN_TOKEN on this deployment first.", 503);
    const auth = req.headers.get("authorization") ?? "";
    const given = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
    if (!sameSecret(given, admin)) throw new BetaError("Unauthorized", 401);
    const { cfg } = betaCtx();
    if (!cfg.telegram) throw new BetaError("The Telegram bot isn't configured (TELEGRAM_BETA_BOT_TOKEN, _USERNAME, _WEBHOOK_SECRET).", 503);
    const url = `${cfg.siteUrl}/api/beta/telegram/webhook`;
    try {
      await setWebhook({ token: cfg.telegram.token }, url, cfg.telegram.webhookSecret);
    } catch (error) {
      throw new BetaError(`Telegram refused the webhook: ${error instanceof Error ? error.message : "unknown error"}`, 502);
    }
    return NextResponse.json({ ok: true, url });
  });
}
