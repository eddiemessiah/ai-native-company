/**
 * Browser-safe pieces of the beta. @repo/gtm-cloud pulls in node:crypto, so client components
 * import its types only (erased at build) and these few constants, kept in step with its types.ts.
 */

import type { Channel } from "@repo/gtm-cloud";

export const CHANNEL_OPTIONS: readonly { value: Channel; label: string; person: boolean }[] = [
  { value: "x", label: "X post", person: false },
  { value: "telegram_post", label: "Telegram channel or group", person: false },
  { value: "slack", label: "Slack", person: false },
  { value: "whatsapp", label: "WhatsApp message", person: true },
  { value: "email", label: "Email", person: true },
  { value: "telegram_dm", label: "Telegram message", person: true },
  { value: "linkedin", label: "LinkedIn", person: true },
  { value: "other", label: "Other", person: true },
];

export const channelLabel = (c: Channel) => CHANNEL_OPTIONS.find((o) => o.value === c)?.label ?? c;
/** One-tap links may only open these apps; the server filters too. */
export const safeSendLink = (url: string) => /^(https:\/\/wa\.me\/|mailto:|https:\/\/x\.com\/intent\/|https:\/\/t\.me\/share\/)/.test(url);

export const runsOnApproval = (c: Channel) => c === "x" || c === "telegram_post" || c === "slack";

/** POSTs JSON and returns the body, or throws with the server's message. */
export async function post<T>(path: string, body: unknown = {}): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !json) throw Object.assign(new Error(json?.error ?? `Something went wrong (${res.status}).`), { status: res.status });
  return json;
}
