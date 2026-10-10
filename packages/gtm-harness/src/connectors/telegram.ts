import type { Decision, Draft, SendLink } from "../outbox";

/**
 * Telegram as the approval console. Each draft arrives in the founder's chat with Approve
 * and Reject buttons; once approved, the button row becomes the one-tap send link. The bot
 * only posts to the founder's own chat: it never messages a prospect.
 *
 * Decisions count only from the configured chat, and from GTM_APPROVER_IDS when it's set,
 * so a group member can't approve a message on the founder's behalf.
 */

export interface TelegramConfig {
  readonly token: string;
  readonly chatId: string;
  /** Telegram user ids allowed to approve. Empty: anyone in the configured chat. */
  readonly approverIds?: readonly string[];
  readonly fetch?: typeof fetch;
}

export interface TelegramDecision {
  readonly id: string;
  readonly decision: Extract<Decision, "approved" | "rejected">;
  readonly by: string;
  readonly at: string;
}

export function telegramFromEnv(env: Record<string, string | undefined> = process.env): TelegramConfig | null {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return null;
  const approverIds = (env.GTM_APPROVER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID, ...(approverIds.length ? { approverIds } : {}) };
}

async function call<T>(cfg: TelegramConfig, method: string, body: Record<string, unknown>): Promise<T> {
  const res = await (cfg.fetch ?? fetch)(`https://api.telegram.org/bot${cfg.token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
  if (!res.ok || !json?.ok) throw new Error(`Telegram ${method} failed: ${json?.description ?? res.status}`);
  return json.result as T;
}

const VERDICT_LINE: Readonly<Record<string, string>> = {
  ready: "Reviewer: ready",
  revise: "Reviewer: revise first",
  blocked: "Reviewer: blocked",
};

/** Posts one draft for review. Returns the Telegram message id. */
export async function sendReviewCard(cfg: TelegramConfig, draft: Draft, id: string): Promise<number> {
  const text = [
    `Review: ${draft.channel}${draft.to ? ` → ${draft.to}` : ""}`,
    draft.file,
    draft.verdict ? VERDICT_LINE[draft.verdict] : "Reviewer: not reviewed",
    "",
    draft.text.slice(0, 3500),
  ].join("\n");
  const result = await call<{ message_id: number }>(cfg, "sendMessage", {
    chat_id: cfg.chatId,
    text,
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Approve", callback_data: `a:${id}` },
          { text: "Reject", callback_data: `r:${id}` },
        ],
      ],
    },
  });
  return result.message_id;
}

interface Update {
  update_id: number;
  callback_query?: {
    id: string;
    data?: string;
    from: { id: number; username?: string };
    message?: { message_id: number; chat: { id: number } };
  };
}

/**
 * Reads button presses since `offset`. Approved cards keep only the send link; rejected
 * cards lose their buttons. Unknown ids and presses from outside the chat are refused.
 */
export async function pollDecisions(
  cfg: TelegramConfig,
  opts: { offset?: number; waitSeconds?: number; known: ReadonlyMap<string, SendLink | null>; now?: () => Date },
): Promise<{ decisions: TelegramDecision[]; nextOffset: number }> {
  const updates = await call<Update[]>(cfg, "getUpdates", {
    ...(opts.offset !== undefined ? { offset: opts.offset } : {}),
    timeout: opts.waitSeconds ?? 0,
    allowed_updates: ["callback_query"],
  });
  const decisions: TelegramDecision[] = [];
  let nextOffset = opts.offset ?? 0;
  for (const u of updates) {
    nextOffset = Math.max(nextOffset, u.update_id + 1);
    const q = u.callback_query;
    if (!q?.data || !q.message) continue;
    const [kind, id] = q.data.split(":");
    const fromChat = String(q.message.chat.id) === String(cfg.chatId);
    const allowed = !cfg.approverIds?.length || cfg.approverIds.includes(String(q.from.id));
    if (!id || !opts.known.has(id) || !fromChat || !allowed || (kind !== "a" && kind !== "r")) {
      await call(cfg, "answerCallbackQuery", { callback_query_id: q.id, text: "Not accepted here" }).catch(() => undefined);
      continue;
    }
    const decision = kind === "a" ? "approved" : "rejected";
    const link = opts.known.get(id) ?? null;
    decisions.push({ id, decision, by: q.from.username ? `@${q.from.username}` : String(q.from.id), at: (opts.now?.() ?? new Date()).toISOString() });
    await call(cfg, "answerCallbackQuery", { callback_query_id: q.id, text: decision === "approved" ? "Approved" : "Rejected" }).catch(() => undefined);
    await call(cfg, "editMessageReplyMarkup", {
      chat_id: cfg.chatId,
      message_id: q.message.message_id,
      reply_markup: { inline_keyboard: decision === "approved" && link ? [[{ text: link.label, url: link.url }]] : [] },
    }).catch(() => undefined);
  }
  return { decisions, nextOffset };
}
