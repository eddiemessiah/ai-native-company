import { randomBytes } from "node:crypto";
import type { GtmInput, GtmPlan, HarnessFiles, OutreachReview } from "@repo/gtm-harness";
import { ActionError, createAction } from "./actions";
import { encrypt, randomId, sha256 } from "./crypto";
import { isSlackWebhook, postToSlack } from "./connectors/slack";
import { authorizeUrl, exchangeCode, pkcePair, whoAmI } from "./connectors/x";
import { getJson, setJson } from "./store";
import { getWorkspace, keys, logEvent, nowIso, saveFiles, saveUser, saveWorkspace, type Ctx } from "./repo";
import type { Action, Channel, User, Workspace } from "./types";

/** Maps a plan draft's channel ("WhatsApp", "X", "Email"…) to an action channel. */
export function channelFor(planChannel: string): Channel {
  const c = planChannel.toLowerCase();
  if (c === "x" || c.includes("twitter")) return "x";
  if (c.includes("whatsapp")) return "whatsapp";
  if (c.includes("email")) return "email";
  if (c.includes("telegram")) return "telegram_dm";
  if (c.includes("linkedin")) return "linkedin";
  return "other";
}

/** A new workspace from a plan: the harness's files, and the plan's drafts as the first actions on the Desk. */
export async function createWorkspace(
  ctx: Ctx,
  user: User,
  input: GtmInput,
  generated: { plan: GtmPlan; generatedBy: string; files: HarnessFiles; reviews: readonly (OutreachReview | null)[] },
): Promise<{ workspace: Workspace; actions: Action[] }> {
  if (user.workspaceIds.length >= 3) throw new ActionError("The beta allows three workspaces per person.", 409);
  const workspace: Workspace = {
    id: randomId("ws"),
    ownerId: user.id,
    name: input.product,
    input,
    plan: generated.plan,
    generatedBy: generated.generatedBy,
    createdAt: nowIso(ctx),
    telegramTargets: [],
  };
  await saveWorkspace(ctx, workspace);
  await saveFiles(ctx, workspace.id, generated.files);
  await saveUser(ctx, { ...user, workspaceIds: [...user.workspaceIds, workspace.id] });
  await logEvent(ctx, workspace.id, { actor: "system", what: `Workspace created; plan by ${generated.generatedBy}` });
  const actions: Action[] = [];
  for (const [i, draft] of generated.plan.drafts.entries()) {
    const review = generated.reviews[i];
    actions.push(await createAction(ctx, workspace, { channel: channelFor(draft.channel), text: draft.text, source: "plan", author: generated.generatedBy, ...(review ? { review: { verdict: review.verdict, provider: review.provider } } : {}) }));
  }
  return { workspace, actions };
}

// ── Telegram: link the founder's chat with a one-time start code ──────────────────────────────

/** The deep link that binds this workspace to the founder's Telegram. Valid for 15 minutes. */
export async function telegramLinkUrl(ctx: Ctx, ws: Workspace): Promise<string | null> {
  if (!ctx.cfg.telegram) return null;
  const code = randomBytes(18).toString("base64url"); // 24 characters, inside Telegram's 64
  await setJson(ctx.store, keys.telegramLinkCode(code), { workspaceId: ws.id }, { ex: 900 });
  return `https://t.me/${ctx.cfg.telegram.username}?start=${code}`;
}

export async function redeemTelegramCode(ctx: Ctx, code: string): Promise<Workspace | null> {
  const key = keys.telegramLinkCode(code);
  const entry = await getJson<{ workspaceId: string }>(ctx.store, key);
  if (!entry) return null;
  await ctx.store.del(key);
  return getWorkspace(ctx, entry.workspaceId);
}

// ── Slack ───────────────────────────────────────────────────────────────────────────────────

export async function connectSlack(ctx: Ctx, ws: Workspace, webhook: string, label: string): Promise<Workspace> {
  if (!isSlackWebhook(webhook)) throw new ActionError("Paste the incoming webhook URL Slack gave you (https://hooks.slack.com/services/…).");
  await postToSlack(webhook, `Shonin GTM is connected. Approved updates for ${ws.name} will post here.`, ctx.fetch).catch((e: Error) => {
    throw new ActionError(`Slack didn't take the test message: ${e.message}`, 502);
  });
  const next: Workspace = { ...ws, slack: { webhook: encrypt(ctx.cfg.encryptionKey, webhook.trim()), label: label.trim().slice(0, 60) || "Slack" } };
  await saveWorkspace(ctx, next);
  await logEvent(ctx, ws.id, { actor: "founder", what: `Connected Slack (${next.slack!.label})` });
  return next;
}

export async function disconnect(ctx: Ctx, ws: Workspace, tool: "slack" | "x" | "telegram"): Promise<Workspace> {
  const next: Workspace = { ...ws };
  if (tool === "slack") delete next.slack;
  if (tool === "x") delete next.x;
  if (tool === "telegram") {
    if (next.telegram) await ctx.store.del(keys.telegramUser(next.telegram.userId));
    delete next.telegram;
  }
  await saveWorkspace(ctx, next);
  await logEvent(ctx, ws.id, { actor: "founder", what: `Disconnected ${tool}` });
  return next;
}

// ── The agent bridge token ───────────────────────────────────────────────────────────────────

/** A new token for the agent bridge. Shown once; only its hash is kept. Replaces any earlier token. */
export async function rotateAgentToken(ctx: Ctx, ws: Workspace): Promise<{ token: string; workspace: Workspace }> {
  if (ws.agent) await ctx.store.del(keys.agentToken(ws.agent.tokenHash));
  const token = `shn_${randomBytes(24).toString("base64url")}`;
  const tokenHash = sha256(token);
  await ctx.store.set(keys.agentToken(tokenHash), ws.id);
  const next: Workspace = { ...ws, agent: { tokenHash, hint: token.slice(-4), createdAt: nowIso(ctx) } };
  await saveWorkspace(ctx, next);
  await logEvent(ctx, ws.id, { actor: "founder", what: "Created a new agent token (the old one stops working)" });
  return { token, workspace: next };
}

export async function workspaceForAgentToken(ctx: Ctx, token: string | undefined): Promise<Workspace | null> {
  if (!token || !token.startsWith("shn_")) return null;
  const wsId = await ctx.store.get(keys.agentToken(sha256(token)));
  return wsId ? getWorkspace(ctx, wsId) : null;
}

// ── X: OAuth 2.0 with PKCE ───────────────────────────────────────────────────────────────────

const xApp = (ctx: Ctx) => {
  if (!ctx.cfg.x) throw new ActionError("X isn't configured on this deployment (X_CLIENT_ID).", 503);
  return { clientId: ctx.cfg.x.clientId, ...(ctx.cfg.x.clientSecret ? { clientSecret: ctx.cfg.x.clientSecret } : {}), redirectUri: `${ctx.cfg.siteUrl}/api/beta/x/callback`, ...(ctx.fetch ? { fetch: ctx.fetch } : {}) };
};

/** Where to send the founder to connect X. The state ties the callback to this workspace for ten minutes. */
export async function startXConnect(ctx: Ctx, ws: Workspace): Promise<string> {
  const app = xApp(ctx);
  const { verifier, challenge } = pkcePair();
  const state = randomBytes(18).toString("base64url");
  await setJson(ctx.store, keys.xOauth(state), { workspaceId: ws.id, ownerId: ws.ownerId, verifier }, { ex: 600 });
  return authorizeUrl(app, state, challenge);
}

/** The callback: swaps the code for tokens, encrypts them, and records the account. Only the workspace's owner can finish it. */
export async function finishXConnect(ctx: Ctx, state: string, code: string, userId: string): Promise<Workspace> {
  const key = keys.xOauth(state);
  const entry = await getJson<{ workspaceId: string; ownerId: string; verifier: string }>(ctx.store, key);
  await ctx.store.del(key);
  if (!entry || entry.ownerId !== userId) throw new ActionError("That X connection expired or belongs to another account. Start again from the Desk.", 403);
  const ws = await getWorkspace(ctx, entry.workspaceId);
  if (!ws) throw new ActionError("The workspace is gone.", 404);
  const now = (ctx.now?.() ?? new Date()).getTime();
  const tokens = await exchangeCode(xApp(ctx), code, entry.verifier, now);
  const username = await whoAmI(tokens.access, ctx.fetch);
  const next: Workspace = {
    ...ws,
    x: { username, access: encrypt(ctx.cfg.encryptionKey, tokens.access), ...(tokens.refresh ? { refresh: encrypt(ctx.cfg.encryptionKey, tokens.refresh) } : {}), expiresAt: tokens.expiresAt },
  };
  await saveWorkspace(ctx, next);
  await logEvent(ctx, ws.id, { actor: "founder", what: `Connected X (@${username})` });
  return next;
}
