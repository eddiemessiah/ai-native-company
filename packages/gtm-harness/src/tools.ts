/** One line per tool in workflows/tools.md: what it does, whether it's connected, what it needs. */
export interface ToolStatus {
  readonly name: string;
  readonly connected: boolean;
  readonly does: string;
  readonly needs?: string;
}

/** What every workspace has without setup, plus what can be connected. Used when a caller doesn't pass live status. */
export const DEFAULT_TOOLS: readonly ToolStatus[] = [
  { name: "One-tap send links", connected: true, does: "WhatsApp click-to-chat, email, X posts and Telegram share links, filled in for the founder to send" },
  { name: "Telegram approvals", connected: false, does: "Approve drafts from your phone; approved cards turn into the send link", needs: "The Shonin GTM CLI with TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID" },
  { name: "Slack review copies", connected: false, does: "Show drafts to your team in Slack", needs: "The Shonin GTM CLI with GTM_SLACK_WEBHOOK_URL" },
  { name: "Gmail drafts", connected: false, does: "Approved emails land in Gmail as drafts", needs: "Planned" },
  { name: "Google Sheets pipeline", connected: false, does: "pipeline.csv kept in a sheet the harness creates", needs: "Planned" },
  { name: "WhatsApp Business", connected: false, does: "Approved template messages to people who opted in, through the official Cloud API", needs: "Planned" },
];
