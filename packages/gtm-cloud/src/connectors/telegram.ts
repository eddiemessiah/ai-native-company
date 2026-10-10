/**
 * The Telegram Bot API, with fetch passed in so tests never touch the network. The bot is the
 * founder's remote control: cards with Approve and Reject, requests in chat, posts to the groups
 * and channels where the founder made it an admin. It never logs in as the founder.
 */

export interface Bot {
  readonly token: string;
  readonly fetch?: typeof fetch;
}

export type InlineButton = { text: string; callback_data: string } | { text: string; url: string };

export async function botCall<T>(bot: Bot, method: string, body: Record<string, unknown>): Promise<T> {
  const res = await (bot.fetch ?? fetch)(`https://api.telegram.org/bot${bot.token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
  if (!res.ok || !json?.ok) throw new Error(`Telegram ${method} failed: ${json?.description ?? res.status}`);
  return json.result as T;
}

export async function sendMessage(bot: Bot, chatId: number | string, text: string, buttons?: InlineButton[][]): Promise<{ message_id: number; chat: { id: number; username?: string } }> {
  return botCall(bot, "sendMessage", {
    chat_id: chatId,
    text: text.slice(0, 4096),
    link_preview_options: { is_disabled: true },
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });
}

export async function editButtons(bot: Bot, chatId: number, messageId: number, buttons: InlineButton[][]): Promise<void> {
  await botCall(bot, "editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: buttons } });
}

export async function answerCallback(bot: Bot, callbackId: string, text: string): Promise<void> {
  await botCall(bot, "answerCallbackQuery", { callback_query_id: callbackId, text: text.slice(0, 190) });
}

/** Points Telegram at our webhook. Telegram sends the secret back in X-Telegram-Bot-Api-Secret-Token. */
export async function setWebhook(bot: Bot, url: string, secret: string): Promise<void> {
  await botCall(bot, "setWebhook", { url, secret_token: secret, allowed_updates: ["message", "callback_query", "my_chat_member"], drop_pending_updates: true });
}

/** The public link to a channel post, when the channel has a username. */
export function postUrl(chat: { id: number; username?: string }, messageId: number): string | undefined {
  if (chat.username) return `https://t.me/${chat.username}/${messageId}`;
  const internal = String(chat.id).replace(/^-100/, "");
  return String(chat.id).startsWith("-100") ? `https://t.me/c/${internal}/${messageId}` : undefined;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; username?: string; first_name?: string; is_bot?: boolean };
    chat: { id: number; type: string; title?: string; username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    from: { id: number; username?: string; first_name?: string };
    message?: { message_id: number; chat: { id: number } };
  };
  my_chat_member?: {
    chat: { id: number; type: string; title?: string; username?: string };
    from: { id: number; username?: string };
    new_chat_member: { status: string; user: { id: number } };
  };
}
