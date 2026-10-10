import { createAction, decide, requestApproval, ActionError } from "./actions";
import { createLoginCode } from "./auth";
import { answerCallback, sendMessage, type Bot, type TelegramUpdate } from "./connectors/telegram";
import type { Drafter } from "./drafter";
import { getAction, getWorkspace, keys, listActions, logEvent, nowIso, saveWorkspace, type Ctx } from "./repo";
import { CHANNEL_LABELS, type Workspace } from "./types";
import { redeemTelegramCode } from "./workspaces";

/**
 * Telegram as the founder's remote control, through the official Bot API:
 *   /start <code>   links this chat to a workspace (the code comes from the Desk)
 *   Approve/Reject  decides a card; only the linked founder's taps count
 *   any text        becomes a draft: the LLM writes, code checks, the card comes back for approval
 *   /queue /digest /login /help
 * Adding the bot as an admin to a group or channel makes it a place approved posts can go.
 * The bot never logs in as the founder and never messages anyone but the founder and those chats.
 */

export interface BotDeps {
  readonly drafter?: Drafter | null;
  /** Reviews a fresh draft; the verdict travels with it. */
  readonly review?: (ws: Workspace, channel: string, text: string) => Promise<{ verdict: "ready" | "revise" | "blocked"; provider?: string } | null>;
}

const HELP = [
  "Shonin GTM, your go-to-market remote.",
  "",
  "Write what you need, like \"a post about Friday's demo\" or \"a WhatsApp to Ada about the pilot\", and I'll draft it for your approval.",
  "/queue: what's waiting for you",
  "/digest: today in one message",
  "/login: a sign-in link for the Desk on another device",
  "",
  "Add me as an admin to your Telegram channel or group, and approved posts can go there.",
  "I never send anything you haven't approved, and messages to people stay one tap by you.",
].join("\n");

export async function handleTelegramUpdate(ctx: Ctx, update: TelegramUpdate, deps: BotDeps = {}): Promise<void> {
  if (!ctx.cfg.telegram) return;
  const bot: Bot = { token: ctx.cfg.telegram.token, ...(ctx.fetch ? { fetch: ctx.fetch } : {}) };
  // Group chatter never reaches the store: only private messages, button presses and membership changes count.
  if (update.message && (update.message.chat.type !== "private" || !update.message.text || update.message.from?.is_bot)) return;
  if (!update.message && !update.callback_query && !update.my_chat_member) return;
  // Telegram retries a webhook it thinks failed; each update is handled once.
  if (!(await ctx.store.set(`tg-update:${update.update_id}`, "1", { ex: 86_400, nx: true }))) return;

  // The bot was added to (or removed from) a group or channel.
  if (update.my_chat_member) {
    const m = update.my_chat_member;
    const wsId = await ctx.store.get(keys.telegramUser(m.from.id));
    const ws = wsId ? await getWorkspace(ctx, wsId) : null;
    if (!ws || (m.chat.type !== "group" && m.chat.type !== "supergroup" && m.chat.type !== "channel")) return;
    const isAdmin = m.new_chat_member.status === "administrator";
    const others = ws.telegramTargets.filter((t) => t.chatId !== m.chat.id);
    ws.telegramTargets = isAdmin ? [...others, { chatId: m.chat.id, title: m.chat.title ?? m.chat.username ?? String(m.chat.id), type: m.chat.type, addedAt: nowIso(ctx) }] : others;
    await saveWorkspace(ctx, ws);
    if (isAdmin) await ctx.store.set(keys.telegramTarget(m.chat.id), ws.id);
    else await ctx.store.del(keys.telegramTarget(m.chat.id));
    await logEvent(ctx, ws.id, { actor: "telegram", what: isAdmin ? `Bot added to ${m.chat.title ?? m.chat.id}` : `Bot removed from ${m.chat.title ?? m.chat.id}` });
    if (ws.telegram) {
      await sendMessage(bot, ws.telegram.chatId, isAdmin ? `I'm an admin in "${m.chat.title}". Approved posts can go there now: pick it on the Desk, or ask me for "a post for ${m.chat.title}".` : `I'm no longer an admin in "${m.chat.title}", so nothing will post there.`).catch(() => undefined);
    }
    return;
  }

  // A tap on Approve or Reject.
  if (update.callback_query) {
    const q = update.callback_query;
    const [kind, actionId, seen] = (q.data ?? "").split(":");
    const action = actionId ? await getAction(ctx, actionId) : null;
    const ws = action ? await getWorkspace(ctx, action.workspaceId) : null;
    const fromFounder = ws?.telegram && ws.telegram.userId === q.from.id && q.message?.chat.id === ws.telegram.chatId;
    if (!action || !ws || !fromFounder || (kind !== "a" && kind !== "r")) {
      await answerCallback(bot, q.id, "Not accepted here").catch(() => undefined);
      return;
    }
    try {
      // The card carries the first 12 characters of the hash of the text it showed; an edited text won't match.
      const after = await decide(ctx, ws, action.id, kind === "a" ? "approved" : "rejected", q.from.username ? `@${q.from.username}` : `telegram:${q.from.id}`, "telegram", seen ?? "");
      const note = after.status === "done" ? "Approved and posted" : after.status === "failed" ? "Approved, but posting failed" : after.status === "unknown" ? "Approved; not sure it posted, see the Desk" : after.status === "approved" ? "Approved: tap the link to send" : after.status === "rejected" ? "Rejected" : `Already ${after.status}`;
      await answerCallback(bot, q.id, note).catch(() => undefined);
    } catch (error) {
      await answerCallback(bot, q.id, error instanceof ActionError ? error.message : "Something went wrong; decide on the Desk").catch(() => undefined);
    }
    return;
  }

  const msg = update.message;
  if (!msg?.text || !msg.from || msg.from.is_bot || msg.chat.type !== "private") return;
  const text = msg.text.trim();

  // Linking: /start <code> from the Desk's link.
  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1];
    if (!code) {
      await sendMessage(bot, msg.chat.id, `${HELP}\n\nTo link a workspace, open the Desk and tap "Connect Telegram".`);
      return;
    }
    const ws = await redeemTelegramCode(ctx, code);
    if (!ws) {
      await sendMessage(bot, msg.chat.id, "That link has expired or was used. Open the Desk and tap \"Connect Telegram\" again.");
      return;
    }
    const previous = await ctx.store.get(keys.telegramUser(msg.from.id));
    if (previous && previous !== ws.id) {
      const old = await getWorkspace(ctx, previous);
      if (old?.telegram?.userId === msg.from.id) {
        delete old.telegram;
        await saveWorkspace(ctx, old);
      }
    }
    ws.telegram = { userId: msg.from.id, chatId: msg.chat.id, ...(msg.from.username ? { username: msg.from.username } : {}), linkedAt: nowIso(ctx) };
    await saveWorkspace(ctx, ws);
    await ctx.store.set(keys.telegramUser(msg.from.id), ws.id);
    await logEvent(ctx, ws.id, { actor: "telegram", what: `Telegram linked${msg.from.username ? ` (@${msg.from.username})` : ""}` });
    await sendMessage(bot, msg.chat.id, `Linked to ${ws.name}. Approvals come here from now on.\n\n${HELP}`);
    return;
  }

  const wsId = await ctx.store.get(keys.telegramUser(msg.from.id));
  const ws = wsId ? await getWorkspace(ctx, wsId) : null;
  if (!ws || ws.telegram?.chatId !== msg.chat.id) {
    await sendMessage(bot, msg.chat.id, "This chat isn't linked to a workspace yet. Open the Desk and tap \"Connect Telegram\".");
    return;
  }

  if (text === "/help") return void (await sendMessage(bot, msg.chat.id, HELP));

  if (text === "/login") {
    const code = await createLoginCode(ctx, ws.ownerId);
    await sendMessage(bot, msg.chat.id, "Your sign-in link, for ten minutes and one use:", [[{ text: "Open the Desk", url: `${ctx.cfg.siteUrl}/beta/login?code=${code}` }]]);
    return;
  }

  if (text === "/queue" || text === "/digest") {
    const actions = await listActions(ctx, ws.id, 100);
    const today = nowIso(ctx).slice(0, 10);
    const waiting = actions.filter((a) => a.status === "pending" || a.status === "draft");
    const held = actions.filter((a) => a.status === "held").length;
    const doneToday = actions.filter((a) => a.status === "done" && a.updatedAt.startsWith(today)).length;
    const failed = actions.filter((a) => a.status === "failed").length;
    const lines = [
      `${ws.name}, ${today}`,
      `Waiting for you: ${waiting.length}`,
      `Held by checks: ${held}`,
      `Done today: ${doneToday}`,
      ...(failed ? [`Failed, needs a retry: ${failed}`] : []),
      "",
      ...waiting.slice(0, 5).map((a, i) => `${i + 1}. ${CHANNEL_LABELS[a.channel]}: ${a.text.slice(0, 80)}${a.text.length > 80 ? "…" : ""}`),
    ];
    await sendMessage(bot, msg.chat.id, lines.join("\n"), [[{ text: "Open the Desk", url: `${ctx.cfg.siteUrl}/beta/desk` }]]);
    return;
  }

  if (text.startsWith("/")) return void (await sendMessage(bot, msg.chat.id, HELP));

  // Anything else is a request for a draft.
  if (!deps.drafter) {
    await sendMessage(bot, msg.chat.id, "Drafting needs a model on this deployment. Write the draft on the Desk for now.");
    return;
  }
  await sendMessage(bot, msg.chat.id, "Drafting…").catch(() => undefined);
  try {
    const target = ws.telegramTargets.find((t) => text.toLowerCase().includes(t.title.toLowerCase()));
    const draft = await deps.drafter(ws, text, target ? { channel: "telegram_post" } : {});
    const to = draft.channel === "telegram_post" ? String((target ?? ws.telegramTargets[0])?.chatId ?? "") : draft.to;
    if (draft.channel === "telegram_post" && !to) {
      await sendMessage(bot, msg.chat.id, "That reads like a post for your Telegram channel, but I'm not an admin in any yet. Add me to the channel, then ask again.");
      return;
    }
    const review = deps.review ? await deps.review(ws, draft.channel, draft.text).catch(() => null) : null;
    const action = await createAction(ctx, ws, { channel: draft.channel, text: draft.text, ...(to ? { to } : {}), source: "telegram", author: "drafter", ...(review ? { review } : {}) });
    if (action.status === "held") {
      const fixes = action.findings.filter((f) => f.level === "error").map((f) => `• ${f.problem}: ${f.fix}`);
      await sendMessage(bot, msg.chat.id, `Drafted, but checks are holding it:\n${fixes.join("\n")}\n\n${action.text}`, [[{ text: "Fix it on the Desk", url: `${ctx.cfg.siteUrl}/beta/desk#${action.id}` }]]);
      return;
    }
    await requestApproval(ctx, ws, action.id);
  } catch (error) {
    await sendMessage(bot, msg.chat.id, `I couldn't draft that: ${error instanceof ActionError ? error.message : "the model didn't answer"}. Try again, or write it on the Desk.`).catch(() => undefined);
  }
}
