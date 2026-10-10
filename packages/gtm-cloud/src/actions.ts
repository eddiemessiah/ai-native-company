import { checkDraft, draftContext, type Finding } from "@repo/gtm-harness/check";
import { sendLink, type Draft } from "@repo/gtm-harness/outbox";
import { decrypt, encrypt, randomId, sha256, sign, verify } from "./crypto";
import { botCall, editButtons, postUrl, sendMessage, type Bot, type InlineButton } from "./connectors/telegram";
import { postToSlack } from "./connectors/slack";
import { postTweet, refreshTokens, xPostCost } from "./connectors/x";
import { getAction, getFiles, getWorkspace, keys, logEvent, nowIso, saveAction, saveWorkspace, type Ctx } from "./repo";
import { withLock } from "./store";
import { CHANNEL_LABELS, RUNS_ON_APPROVAL, type Action, type ApprovalRecord, type Channel, type ReceiptRecord, type Review, type Workspace } from "./types";

/**
 * The loop every action goes through: drafted → checked by code → reviewed → approved by the founder,
 * bound to the hash of its exact text → run on the founder's own channel, or turned into a one-tap
 * link when it reaches a person → a signed receipt. Only the server writes approvals and receipts.
 */

export class ActionError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/** Platform limits, checked by code before anyone is asked to approve. */
const MAX_LENGTH: Partial<Record<Channel, number>> = { x: 280, telegram_post: 4096, telegram_dm: 4096, slack: 3000, whatsapp: 4000 };

const asDraft = (a: Pick<Action, "id" | "channel" | "to" | "subject" | "text">): Draft => ({
  file: `actions/${a.id}`,
  channel: CHANNEL_LABELS[a.channel],
  ...(a.to ? { to: a.to } : {}),
  ...(a.subject ? { subject: a.subject } : {}),
  text: a.text,
});

/** The workspace's own rules as code (claims, slots, phrases, opt-outs), plus the platform's length limit. */
export function findingsFor(files: Readonly<Record<string, string>>, a: Pick<Action, "id" | "channel" | "to" | "subject" | "text">): Finding[] {
  let findings = checkDraft(asDraft(a), draftContext(files));
  // The outreach rules (word limit, no links in a first message) are for messages to people, not the founder's own posts.
  if (RUNS_ON_APPROVAL.has(a.channel)) findings = findings.filter((f) => !f.rule.startsWith("rules/outreach.md"));
  // The harness speaks in workspace-file terms; on the Desk, say it plainly.
  findings = findings.map((f) => (f.fix.includes("**To:**") ? { ...f, problem: "no recipient", fix: "Add who it's for, or the link opens without one." } : f));
  const max = MAX_LENGTH[a.channel];
  if (max && [...a.text].length > max) {
    findings.push({ level: "error", path: `actions/${a.id}`, rule: `${CHANNEL_LABELS[a.channel]}: at most ${max} characters`, problem: `${[...a.text].length} characters`, fix: `Cut it to ${max} characters or fewer.` });
  }
  if (!a.text.trim()) findings.push({ level: "error", path: `actions/${a.id}`, rule: "An action needs text", problem: "empty", fix: "Write the message." });
  return findings;
}

const hasErrors = (findings: readonly Finding[]) => findings.some((f) => f.level === "error");

export interface NewAction {
  readonly channel: Channel;
  readonly text: string;
  readonly to?: string;
  readonly subject?: string;
  readonly source: Action["source"];
  readonly author: string;
  readonly review?: Review;
}

export const MAX_DRAFTS_PER_DAY = 100;

export async function createAction(ctx: Ctx, ws: Workspace, input: NewAction): Promise<Action> {
  if (input.channel === "telegram_post" && (!input.to || !ws.telegramTargets.some((t) => String(t.chatId) === input.to))) {
    throw new ActionError("Pick one of this workspace's Telegram groups or channels. Add the bot there as an admin first.");
  }
  if ((await ctx.store.incr(`cap:drafts:${ws.id}:${today(ctx)}`, 2 * 86_400)) > MAX_DRAFTS_PER_DAY) {
    throw new ActionError(`That's today's ${MAX_DRAFTS_PER_DAY} drafts for this workspace.`, 429);
  }
  const id = randomId("act");
  const at = nowIso(ctx);
  const text = input.text.replace(/\r\n/g, "\n").trim();
  const base = { id, channel: input.channel, ...(input.to ? { to: input.to.trim() } : {}), ...(input.subject ? { subject: input.subject.trim() } : {}), text };
  const findings = findingsFor(await getFiles(ctx, ws.id), base);
  const action: Action = {
    ...base,
    workspaceId: ws.id,
    hash: sha256(text),
    source: input.source,
    author: input.author,
    createdAt: at,
    updatedAt: at,
    ...(input.review ? { review: input.review } : {}),
    findings,
    status: hasErrors(findings) || input.review?.verdict === "blocked" ? "held" : "draft",
  };
  await saveAction(ctx, action);
  await ctx.store.lpush(keys.actions(ws.id), id);
  await logEvent(ctx, ws.id, { actor: input.source === "agent" ? "agent" : input.source === "telegram" ? "telegram" : "founder", what: `Drafted ${CHANNEL_LABELS[action.channel]}${action.status === "held" ? " (held by checks)" : ""}`, actionId: id });
  return action;
}

/** A run that has said "running" for over two minutes crashed somewhere: we can't know whether it posted. */
const STALE_RUN_MS = 120_000;

async function load(ctx: Ctx, ws: Workspace, id: string): Promise<Action> {
  const action = await getAction(ctx, id);
  if (!action || action.workspaceId !== ws.id) throw new ActionError("No such action in this workspace.", 404);
  if (action.status === "running" && (ctx.now?.() ?? new Date()).getTime() - Date.parse(action.updatedAt) > STALE_RUN_MS) {
    const unknown: Action = { ...action, status: "unknown", error: "The run stopped before we heard back. Check the channel, then say whether it posted.", updatedAt: nowIso(ctx) };
    await saveAction(ctx, unknown);
    return unknown;
  }
  return action;
}

/** A new text voids the approval: the hash changes, so the founder approves again. */
export async function editAction(ctx: Ctx, ws: Workspace, id: string, text: string, by: string): Promise<Action> {
  const action = await load(ctx, ws, id);
  if (action.status === "done" || action.status === "running" || action.status === "unknown") throw new ActionError("It ran, or may have. Draft a new one instead.");
  const clean = text.replace(/\r\n/g, "\n").trim();
  const findings = findingsFor(await getFiles(ctx, ws.id), { ...action, text: clean });
  const next: Action = { ...action, text: clean, hash: sha256(clean), findings, status: hasErrors(findings) ? "held" : "draft", updatedAt: nowIso(ctx) };
  delete next.approval;
  delete next.error;
  delete next.review; // the verdict covered the old text
  if (action.card && ctx.cfg.telegram) {
    // The old card's buttons would approve text the founder never saw: take them off.
    await editButtons(bot(ctx), action.card.chatId, action.card.messageId, []).catch((e: Error) => logEvent(ctx, ws.id, { actor: "system", what: `Couldn't clear an old Telegram card: ${e.message}`, actionId: id }));
    delete next.card;
  }
  await saveAction(ctx, next);
  await logEvent(ctx, ws.id, { actor: "founder", what: `Edited ${CHANNEL_LABELS[action.channel]} (${by}); approval needed again`, actionId: id });
  return next;
}

const today = (ctx: Ctx) => nowIso(ctx).slice(0, 10);

/** Puts the action in front of the founder: on the Desk, and as a Telegram card when Telegram is linked. */
export async function requestApproval(ctx: Ctx, ws: Workspace, id: string): Promise<Action> {
  const action = await load(ctx, ws, id);
  if (action.status === "held") throw new ActionError("Checks are holding this one back. Fix what they found first.");
  if (action.status !== "draft") return action; // already asked, decided or run: asking twice changes nothing
  const count = await ctx.store.incr(keys.cardsToday(ws.id, today(ctx)), 2 * 86_400);
  if (count > ctx.cfg.maxCardsPerDay) throw new ActionError(`That's today's ${ctx.cfg.maxCardsPerDay} approval requests. Approvals at volume turn into rubber stamps; the rest wait until tomorrow.`, 429);
  const next: Action = { ...action, status: "pending", updatedAt: nowIso(ctx) };
  if (ws.telegram && ctx.cfg.telegram) {
    try {
      const sent = await sendMessage(bot(ctx), ws.telegram.chatId, cardText(next, ws), [
        [
          { text: "Approve", callback_data: `a:${id}:${next.hash.slice(0, 12)}` },
          { text: "Reject", callback_data: `r:${id}:${next.hash.slice(0, 12)}` },
        ],
      ]);
      next.card = { chatId: ws.telegram.chatId, messageId: sent.message_id };
    } catch (error) {
      // The Desk still shows it; Telegram is a second way to decide, not the only one.
      await logEvent(ctx, ws.id, { actor: "system", what: `Telegram card failed: ${(error as Error).message}`, actionId: id });
    }
  }
  await saveAction(ctx, next);
  await logEvent(ctx, ws.id, { actor: "system", what: `Asked for approval: ${CHANNEL_LABELS[action.channel]}`, actionId: id });
  return next;
}

export function cardText(a: Action, ws: Workspace): string {
  const where =
    a.channel === "telegram_post" ? ` → ${ws.telegramTargets.find((t) => String(t.chatId) === a.to)?.title ?? a.to}` : a.to ? ` → ${a.to}` : a.channel === "x" && ws.x ? ` → @${ws.x.username}` : "";
  const runs = RUNS_ON_APPROVAL.has(a.channel) ? "Approve posts it." : "Approve gives you a one-tap link; your tap sends it.";
  const cost = a.channel === "x" ? ` X charges about $${xPostCost(a.text).usd} for this post (${xPostCost(a.text).reason}).` : "";
  return [`${CHANNEL_LABELS[a.channel]}${where}`, a.review ? `Reviewer: ${a.review.verdict}` : "Reviewer: not reviewed", "", a.text, "", `${runs}${cost}`, `${ws.name} · ${a.id}`].join("\n");
}

const bot = (ctx: Ctx): Bot => ({ token: ctx.cfg.telegram!.token, ...(ctx.fetch ? { fetch: ctx.fetch } : {}) });

/**
 * The founder's decision, signed and bound to the text's hash. `seenHash` is the hash of the text the
 * founder was shown (the Desk posts it; a Telegram card carries its first 12 characters): if the text
 * changed since, the decision is refused. One decision per text, however many taps arrive at once.
 * An approval on an own channel runs it, unless the kill switch is on.
 */
export async function decide(ctx: Ctx, ws: Workspace, id: string, decision: "approved" | "rejected", by: string, via: "web" | "telegram", seenHash?: string): Promise<Action> {
  const action = await load(ctx, ws, id);
  if (action.status === "held") throw new ActionError("Checks are holding this one back; it can't be approved until they pass.");
  if (action.status !== "draft" && action.status !== "pending") return action; // decided already: a second tap changes nothing
  if (seenHash !== undefined) {
    if (!/^[0-9a-f]{12,64}$/.test(seenHash)) throw new ActionError("Missing the text's fingerprint; refresh and decide again.", 400);
    if (!action.hash.startsWith(seenHash)) throw new ActionError("The text changed after you saw it. Look at the new version and decide again.", 409);
  }
  if (sha256(action.text) !== action.hash) throw new ActionError("This action's text doesn't match its hash. It was changed outside the Desk; draft it again.", 409);
  if (!(await ctx.store.set(`decision:${id}:${action.hash}`, decision, { nx: true }))) return (await getAction(ctx, id)) ?? action;
  if (action.status === "draft") {
    // Approving straight from a draft still counts toward the day's approvals.
    const count = await ctx.store.incr(keys.cardsToday(ws.id, today(ctx)), 2 * 86_400);
    if (count > ctx.cfg.maxCardsPerDay) {
      await ctx.store.del(`decision:${id}:${action.hash}`);
      throw new ActionError(`That's today's ${ctx.cfg.maxCardsPerDay} approvals. The rest wait until tomorrow.`, 429);
    }
  }
  const record: ApprovalRecord = { kind: "approval", actionId: id, workspaceId: ws.id, hash: action.hash, decision, by, via, at: nowIso(ctx) };
  const next: Action = { ...action, approval: sign(ctx.cfg.signingKey, record), status: decision === "approved" ? "approved" : "rejected", updatedAt: record.at };
  await saveAction(ctx, next);
  await logEvent(ctx, ws.id, { actor: via === "telegram" ? "telegram" : "founder", what: `${decision === "approved" ? "Approved" : "Rejected"} ${CHANNEL_LABELS[action.channel]} (${by})`, actionId: id });
  const result = decision === "approved" && RUNS_ON_APPROVAL.has(action.channel) && ctx.cfg.runs ? await execute(ctx, ws, next) : next;
  await updateCard(ctx, result, ws);
  return result;
}

/** Whether a stored approval really covers this exact text. Checked again right before anything runs. */
export function approvalCovers(ctx: Ctx, action: Action): boolean {
  const a = action.approval;
  return Boolean(a && a.decision === "approved" && verify(ctx.cfg.signingKey, a) && a.hash === action.hash && sha256(action.text) === action.hash && a.actionId === action.id && a.workspaceId === action.workspaceId);
}

/** A fetch that never reached an answer (network error, timeout): the post may or may not exist. */
const uncertain = (error: unknown) => error instanceof TypeError || (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError"));

/**
 * Runs an approved action on the founder's own channel, at most once per approved text:
 *   1. a short lock, then the action is read again (a double tap or a retried webhook finds it done);
 *   2. a permanent run marker for this text is set before the external call, and only a definite
 *      refusal from the channel removes it, so nothing can post the same approval twice;
 *   3. a timeout or crash leaves "unknown": the founder checks the channel before any retry.
 */
export async function execute(ctx: Ctx, ws: Workspace, action: Action): Promise<Action> {
  if (!RUNS_ON_APPROVAL.has(action.channel)) throw new ActionError("This channel reaches a person: it gets a one-tap link, never an automatic send.");
  if (!ctx.cfg.runs) throw new ActionError("Posting is switched off on this deployment (BETA_RUNS=off). Use the link instead.", 503);
  return withLock(ctx.store, `run:${action.id}`, async () => {
    const current = (await getAction(ctx, action.id)) ?? action;
    if (current.status === "done" || current.status === "running" || current.status === "unknown") return current;
    if (!approvalCovers(ctx, current)) throw new ActionError("No approval covers this exact text.", 409);
    const runs = await ctx.store.incr(`cap:runs:${ws.id}:${today(ctx)}`, 2 * 86_400);
    const xRuns = current.channel === "x" ? await ctx.store.incr(`cap:x:${ws.id}:${today(ctx)}`, 2 * 86_400) : 0;
    if (runs > ctx.cfg.maxRunsPerDay || xRuns > ctx.cfg.maxXPostsPerDay) {
      const failed: Action = { ...current, status: "failed", error: `Today's posting limit is reached (${current.channel === "x" ? `${ctx.cfg.maxXPostsPerDay} on X` : `${ctx.cfg.maxRunsPerDay} in all`}). Retry tomorrow.`, updatedAt: nowIso(ctx) };
      await saveAction(ctx, failed);
      return failed;
    }
    const marker = `ran:${current.id}:${current.hash}`;
    if (!(await ctx.store.set(marker, nowIso(ctx), { nx: true }))) {
      const unknown: Action = { ...current, status: "unknown", error: "A run for this text already started. Check the channel, then say whether it posted.", updatedAt: nowIso(ctx) };
      await saveAction(ctx, unknown);
      return unknown;
    }
    await saveAction(ctx, { ...current, status: "running", updatedAt: nowIso(ctx) });
    try {
      const ref = await post(ctx, ws, current);
      const receipt: ReceiptRecord = { kind: "receipt", actionId: current.id, workspaceId: ws.id, hash: current.hash, channel: current.channel, result: "posted", ...(ref ? { ref } : {}), at: nowIso(ctx) };
      const done: Action = { ...current, status: "done", receipt: sign(ctx.cfg.signingKey, receipt), updatedAt: receipt.at };
      delete done.error;
      await saveAction(ctx, done);
      await logEvent(ctx, ws.id, { actor: "system", what: `Posted ${CHANNEL_LABELS[current.channel]}${ref?.startsWith("http") ? `: ${ref}` : ""}`, actionId: current.id });
      return done;
    } catch (error) {
      const maybe = uncertain(error);
      if (!maybe) await ctx.store.del(marker); // the channel said no: nothing posted, a retry is safe
      const next: Action = {
        ...current,
        status: maybe ? "unknown" : "failed",
        error: maybe ? "We didn't hear back from the channel. Check whether it posted, then say so." : (error as Error).message,
        updatedAt: nowIso(ctx),
      };
      await saveAction(ctx, next);
      await logEvent(ctx, ws.id, { actor: "system", what: `${maybe ? "Unknown outcome" : "Failed"} posting ${CHANNEL_LABELS[current.channel]}: ${next.error}`, actionId: current.id });
      return next;
    }
  }, { ttl: 60, waitMs: 500 });
}

async function post(ctx: Ctx, ws: Workspace, action: Action): Promise<string | undefined> {
  if (action.channel === "x") {
    if (!ws.x) throw new Error("Connect X first.");
    const access = await xAccess(ctx, ws);
    const { id } = await postTweet(access, action.text, ctx.fetch);
    return `https://x.com/${ws.x.username}/status/${id}`;
  }
  if (action.channel === "telegram_post") {
    if (!ctx.cfg.telegram) throw new Error("The Telegram bot isn't configured on this deployment.");
    const target = ws.telegramTargets.find((t) => String(t.chatId) === action.to);
    if (!target) throw new Error("The bot isn't an admin of that group or channel any more.");
    const sent = await sendMessage(bot(ctx), target.chatId, action.text);
    return postUrl(sent.chat, sent.message_id) ?? `telegram:${target.chatId}:${sent.message_id}`;
  }
  if (action.channel === "slack") {
    if (!ws.slack) throw new Error("Connect Slack first.");
    await postToSlack(decrypt(ctx.cfg.encryptionKey, ws.slack.webhook), action.text, ctx.fetch);
    return `slack:${ws.slack.label}`;
  }
  return undefined;
}

/**
 * Runs a failed action again. For "unknown", the founder must have checked the channel and say it
 * didn't post (`confirmedNotPosted`), or say it did (`postedRef`), which records it as done.
 */
export async function retry(ctx: Ctx, ws: Workspace, id: string, opts: { confirmedNotPosted?: boolean; postedRef?: string } = {}): Promise<Action> {
  const action = await load(ctx, ws, id);
  if (action.status === "unknown") {
    if (opts.postedRef !== undefined) {
      const receipt: ReceiptRecord = { kind: "receipt", actionId: id, workspaceId: ws.id, hash: action.hash, channel: action.channel, result: "posted", ...(opts.postedRef ? { ref: opts.postedRef.slice(0, 300) } : {}), at: nowIso(ctx) };
      const done: Action = { ...action, status: "done", receipt: sign(ctx.cfg.signingKey, receipt), updatedAt: receipt.at };
      delete done.error;
      await saveAction(ctx, done);
      await logEvent(ctx, ws.id, { actor: "founder", what: `Confirmed it posted: ${CHANNEL_LABELS[action.channel]}`, actionId: id });
      return done;
    }
    if (!opts.confirmedNotPosted) throw new ActionError("Check the channel first: say whether it posted.", 409);
    await ctx.store.del(`ran:${action.id}:${action.hash}`);
    const reset: Action = { ...action, status: "approved", updatedAt: nowIso(ctx) };
    await saveAction(ctx, reset);
    await logEvent(ctx, ws.id, { actor: "founder", what: `Confirmed it didn't post; running again`, actionId: id });
    return execute(ctx, ws, reset);
  }
  if (action.status !== "failed") throw new ActionError("Only a failed action can be retried.");
  return execute(ctx, ws, { ...action, status: "approved" });
}

/** A fresh X access token. Refresh tokens work once, so the refresh happens under a lock, on a freshly read workspace. */
async function xAccess(ctx: Ctx, ws: Workspace): Promise<string> {
  const now = (ctx.now?.() ?? new Date()).getTime();
  if (ws.x && ws.x.expiresAt - 60_000 > now) return decrypt(ctx.cfg.encryptionKey, ws.x.access);
  return withLock(ctx.store, `x-refresh:${ws.id}`, async () => {
    const fresh = (await getWorkspace(ctx, ws.id)) ?? ws;
    const x = fresh.x;
    if (!x) throw new Error("Connect X first.");
    if (x.expiresAt - 60_000 > now) return decrypt(ctx.cfg.encryptionKey, x.access);
    if (!x.refresh || !ctx.cfg.x) throw new Error("The X connection expired. Connect X again.");
    const tokens = await refreshTokens({ clientId: ctx.cfg.x.clientId, ...(ctx.cfg.x.clientSecret ? { clientSecret: ctx.cfg.x.clientSecret } : {}), redirectUri: `${ctx.cfg.siteUrl}/api/beta/x/callback`, ...(ctx.fetch ? { fetch: ctx.fetch } : {}) }, decrypt(ctx.cfg.encryptionKey, x.refresh), now);
    fresh.x = { username: x.username, access: encrypt(ctx.cfg.encryptionKey, tokens.access), ...(tokens.refresh ? { refresh: encrypt(ctx.cfg.encryptionKey, tokens.refresh) } : x.refresh ? { refresh: x.refresh } : {}), expiresAt: tokens.expiresAt };
    await saveWorkspace(ctx, fresh);
    ws.x = fresh.x;
    return tokens.access;
  }, { ttl: 30, waitMs: 5000 });
}

/** The one-tap link for an approved action that reaches a person. Null for LinkedIn: the founder copies the text. */
export function linkFor(action: Action, runs = true) {
  if (action.status !== "approved") return null;
  if (RUNS_ON_APPROVAL.has(action.channel)) {
    if (runs) return null;
    // Kill switch on: the founder posts it themselves. X and Telegram have share links; Slack doesn't.
    return action.channel === "slack" ? null : sendLink({ ...asDraft(action), channel: action.channel === "x" ? "x" : "telegram" });
  }
  return sendLink(asDraft(action));
}

/** The founder tapped the link and sent it; recorded with a receipt. */
export async function markSent(ctx: Ctx, ws: Workspace, id: string, by: string): Promise<Action> {
  const action = await load(ctx, ws, id);
  if (action.status === "done") return action;
  // With the kill switch on, the founder posts their own channels by link too, so those can be marked sent.
  const byLink = !RUNS_ON_APPROVAL.has(action.channel) || !ctx.cfg.runs;
  if (action.status !== "approved" || !byLink || !approvalCovers(ctx, action)) throw new ActionError("Only an approved action you send yourself can be marked sent.");
  const link = linkFor(action, ctx.cfg.runs);
  const receipt: ReceiptRecord = { kind: "receipt", actionId: id, workspaceId: ws.id, hash: action.hash, channel: action.channel, result: "marked_sent", ...(link ? { ref: link.url.slice(0, 60) } : {}), at: nowIso(ctx) };
  const done: Action = { ...action, status: "done", receipt: sign(ctx.cfg.signingKey, receipt), updatedAt: receipt.at };
  await saveAction(ctx, done);
  await logEvent(ctx, ws.id, { actor: "founder", what: `Sent ${CHANNEL_LABELS[action.channel]} (${by})`, actionId: id });
  return done;
}

/** After a decision, the Telegram card shows the outcome instead of the buttons. */
async function updateCard(ctx: Ctx, action: Action, ws: Workspace): Promise<void> {
  if (!action.card || !ctx.cfg.telegram) return;
  const link = linkFor(action, ctx.cfg.runs);
  const buttons: InlineButton[][] =
    action.status === "approved" && link
      ? [[{ text: link.label, url: link.url }]]
      : action.status === "done" && action.receipt?.ref?.startsWith("http")
        ? [[{ text: "Posted: open it", url: action.receipt.ref }]]
        : [];
  const log = (e: Error) => logEvent(ctx, ws.id, { actor: "system", what: `Telegram card update failed: ${e.message}`, actionId: action.id });
  await editButtons(bot(ctx), action.card.chatId, action.card.messageId, buttons).catch(log);
  if (action.status === "failed" || action.status === "unknown") {
    await botCall(bot(ctx), "sendMessage", { chat_id: action.card.chatId, text: `${action.status === "failed" ? "Couldn't post it" : "Not sure it posted"}: ${action.error}\nSee the Desk.`, reply_parameters: { message_id: action.card.messageId } }).catch(log);
  }
}
