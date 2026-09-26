/**
 * Every lead lands on the founder's phone. Telegram first (works everywhere,
 * free, no approval process), plus an optional webhook for Slack, Sheets,
 * n8n or a CRM. Failures never block the visitor's confirmation.
 */
export interface LeadAlert {
  readonly title: string;
  readonly lines: readonly [string, string][];
  readonly body: string;
  readonly payload: Record<string, unknown>;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function notify(alert: LeadAlert): Promise<{ telegram: boolean; webhook: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const webhook = process.env.LEADS_WEBHOOK_URL;
  const tasks: Promise<boolean>[] = [];

  if (token && chatId) {
    const text = [
      `<b>${escapeHtml(alert.title)}</b>`,
      ...alert.lines.map(([k, v]) => `<b>${escapeHtml(k)}:</b> ${escapeHtml(v)}`),
      "",
      escapeHtml(alert.body.slice(0, 3000)),
    ].join("\n");
    tasks.push(
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
        signal: AbortSignal.timeout(5_000),
      }).then((r) => r.ok),
    );
  } else {
    tasks.push(Promise.resolve(false));
  }

  if (webhook) {
    tasks.push(
      fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(alert.payload),
        signal: AbortSignal.timeout(5_000),
      }).then((r) => r.ok),
    );
  } else {
    tasks.push(Promise.resolve(false));
  }

  const [tg, wh] = await Promise.allSettled(tasks);
  const sent = { telegram: tg?.status === "fulfilled" && tg.value, webhook: wh?.status === "fulfilled" && wh.value };
  if (!sent.telegram && !sent.webhook) {
    // No channel configured (or both failed): keep the lead in the server log rather than losing it.
    console.info("[lead]", JSON.stringify(alert.payload));
  }
  return sent;
}
