/** Slack through an incoming webhook: the founder pastes the URL Slack gives them for one channel. */

export function isSlackWebhook(url: string): boolean {
  return /^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+$/.test(url.trim());
}

export async function postToSlack(webhook: string, text: string, fetcher: typeof fetch = fetch): Promise<void> {
  if (!isSlackWebhook(webhook)) throw new Error("That isn't a Slack incoming webhook URL.");
  const res = await fetcher(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }), signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Slack answered ${res.status}: ${(await res.text().catch(() => "")).slice(0, 120)}`);
}
