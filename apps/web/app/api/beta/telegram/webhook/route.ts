import { handleTelegramUpdate, type TelegramUpdate } from "@repo/gtm-cloud";
import { after, NextResponse } from "next/server";
import { betaCtx, botDeps, notConfigured, sameSecret } from "@/lib/beta";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Telegram's webhook: button presses, chat requests, and the bot joining groups and channels.
 * Telegram sends our secret back in a header; anything without it is refused. We answer at once
 * and do the work after the response, so Telegram doesn't retry a slow draft.
 */
export async function POST(req: Request) {
  const blocked = notConfigured();
  if (blocked) return blocked;
  const ctx = betaCtx();
  if (!ctx.cfg.telegram) return NextResponse.json({ error: "The Telegram bot isn't configured on this deployment." }, { status: 503 });
  if (!sameSecret(req.headers.get("x-telegram-bot-api-secret-token"), ctx.cfg.telegram.webhookSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  if (!update || typeof update.update_id !== "number") return NextResponse.json({ error: "Not a Telegram update." }, { status: 400 });
  after(async () => {
    try {
      await handleTelegramUpdate(ctx, update, botDeps());
    } catch (error) {
      console.error("[beta] telegram update failed:", error instanceof Error ? error.message : error);
    }
  });
  return NextResponse.json({ ok: true });
}
