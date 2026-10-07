import { describeRoute, routeModel } from "../models";
import type { ToolStatus } from "../tools";
import { telegramFromEnv } from "./telegram";

export { pollDecisions, sendReviewCard, telegramFromEnv, type TelegramConfig, type TelegramDecision } from "./telegram";
export { postForReview } from "./slack";
export type { ToolStatus } from "../tools";

type Env = Record<string, string | undefined>;

/** The tools the harness can use today, honestly: connected or not, and the planned ones marked as such. */
export function toolStatus(env: Env = process.env): ToolStatus[] {
  const route = routeModel(env);
  return [
    route
      ? { name: "Model", connected: true, does: `Writes plans and drafts with ${describeRoute(route)}` }
      : {
          name: "Model",
          connected: false,
          does: "Writes plans and drafts with any model: Claude, GPT, Grok, Gemini or a local one",
          needs: "ANTHROPIC_API_KEY; or GTM_MODEL=provider/model with AI_GATEWAY_API_KEY or OPENROUTER_API_KEY; or GTM_BASE_URL + GTM_MODEL",
        },
    telegramFromEnv(env)
      ? { name: "Telegram approvals", connected: true, does: "Sends each draft to the founder's chat with Approve and Reject; approved cards turn into the send link" }
      : { name: "Telegram approvals", connected: false, does: "Approve drafts from your phone", needs: "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (optional GTM_APPROVER_IDS)" },
    env.GTM_SLACK_WEBHOOK_URL
      ? { name: "Slack review copies", connected: true, does: "Posts a copy of each draft for the team to read" }
      : { name: "Slack review copies", connected: false, does: "Show drafts to your team in Slack", needs: "GTM_SLACK_WEBHOOK_URL (an incoming webhook)" },
    { name: "One-tap send links", connected: true, does: "WhatsApp click-to-chat, email, X posts and Telegram share links, filled in for the founder to send" },
    { name: "Gmail drafts", connected: false, does: "Approved emails land in Gmail as drafts", needs: "Planned: Google OAuth (gmail.compose)" },
    { name: "Google Sheets pipeline", connected: false, does: "pipeline.csv kept in a sheet the harness creates", needs: "Planned: Google OAuth (drive.file, which reaches only that sheet)" },
    {
      name: "WhatsApp Business",
      connected: false,
      does: "Approved template messages to people who opted in, through the official Cloud API",
      needs: "Planned: a verified Meta business and WhatsApp Cloud API access",
    },
  ];
}
