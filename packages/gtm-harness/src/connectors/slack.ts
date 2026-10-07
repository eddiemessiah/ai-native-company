import type { Draft } from "../outbox";

/**
 * Slack, through an incoming webhook: a review copy of each draft in a channel the team
 * reads. Webhooks can't take button presses, so approvals happen in Telegram or the CLI.
 */
export async function postForReview(webhookUrl: string, draft: Draft, opts: { fetch?: typeof fetch } = {}): Promise<void> {
  const verdict = draft.verdict ? `Reviewer: ${draft.verdict}` : "Reviewer: not reviewed";
  const text = [`*Review: ${draft.channel}${draft.to ? ` → ${draft.to}` : ""}*  (${draft.file})`, verdict, "```", draft.text.slice(0, 2800), "```", "Approve in Telegram or with `gtm review --local`."].join("\n");
  const res = await (opts.fetch ?? fetch)(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Slack webhook answered ${res.status}`);
}
