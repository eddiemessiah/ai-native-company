import { createHash, randomBytes } from "node:crypto";

/**
 * X through OAuth 2.0 with PKCE, user context: the founder connects their own account and each
 * post runs only after they approve its exact text. X charges per post (more with a link), so
 * the Desk shows the cost on the card.
 */

export const X_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];
const AUTHORIZE = "https://x.com/i/oauth2/authorize";
const TOKEN = "https://api.x.com/2/oauth2/token";

export interface XApp {
  readonly clientId: string;
  readonly clientSecret?: string;
  readonly redirectUri: string;
  readonly fetch?: typeof fetch;
}

export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}

export function authorizeUrl(app: XApp, state: string, challenge: string): string {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: app.clientId,
    redirect_uri: app.redirectUri,
    scope: X_SCOPES.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${AUTHORIZE}?${q}`;
}

export interface XTokens {
  readonly access: string;
  readonly refresh?: string;
  readonly expiresAt: number;
}

async function tokenCall(app: XApp, form: Record<string, string>, now: number): Promise<XTokens> {
  const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
  // Confidential clients authenticate with Basic; public clients send client_id in the form.
  if (app.clientSecret) headers.authorization = `Basic ${Buffer.from(`${app.clientId}:${app.clientSecret}`).toString("base64")}`;
  const res = await (app.fetch ?? fetch)(TOKEN, { method: "POST", headers, body: new URLSearchParams({ ...form, client_id: app.clientId }) });
  const json = (await res.json().catch(() => null)) as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string; error?: string } | null;
  if (!res.ok || !json?.access_token) throw new Error(`X token exchange failed: ${json?.error_description ?? json?.error ?? res.status}`);
  return { access: json.access_token, ...(json.refresh_token ? { refresh: json.refresh_token } : {}), expiresAt: now + (json.expires_in ?? 7200) * 1000 };
}

export function exchangeCode(app: XApp, code: string, verifier: string, now = Date.now()): Promise<XTokens> {
  return tokenCall(app, { grant_type: "authorization_code", code, redirect_uri: app.redirectUri, code_verifier: verifier }, now);
}

export function refreshTokens(app: XApp, refresh: string, now = Date.now()): Promise<XTokens> {
  return tokenCall(app, { grant_type: "refresh_token", refresh_token: refresh }, now);
}

export async function whoAmI(access: string, fetcher: typeof fetch = fetch): Promise<string> {
  const res = await fetcher("https://api.x.com/2/users/me", { headers: { authorization: `Bearer ${access}` } });
  const json = (await res.json().catch(() => null)) as { data?: { username?: string } } | null;
  if (!res.ok || !json?.data?.username) throw new Error(`X users/me failed: ${res.status}`);
  return json.data.username;
}

export async function postTweet(access: string, text: string, fetcher: typeof fetch = fetch): Promise<{ id: string }> {
  const res = await fetcher("https://api.x.com/2/tweets", {
    method: "POST",
    headers: { authorization: `Bearer ${access}`, "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const json = (await res.json().catch(() => null)) as { data?: { id?: string }; detail?: string; title?: string } | null;
  if (!res.ok || !json?.data?.id) throw new Error(`X post failed: ${json?.detail ?? json?.title ?? res.status}`);
  return { id: json.data.id };
}

/** X's per-post price as of Oct 2026 (research/gtm-harnesses.md): more when the post carries a link. */
export function xPostCost(text: string): { usd: number; reason: string } {
  return /https?:\/\/|www\./i.test(text) ? { usd: 0.2, reason: "contains a link" } : { usd: 0.015, reason: "text only" };
}
