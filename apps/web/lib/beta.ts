import { timingSafeEqual, createHash } from "node:crypto";
import {
  ActionError,
  AuthError,
  betaConfig,
  CHANNEL_LABELS,
  currentUser,
  drafterFromEnv,
  linkFor,
  listActions,
  listEvents,
  MemoryStore,
  ownedWorkspace,
  SESSION_COOKIE,
  storeFromEnv,
  xPostCost,
  type Action,
  type ActivityEvent,
  type BetaConfig,
  type BotDeps,
  type Channel,
  type Ctx,
  type Drafter,
  type Store,
  type User,
  type Workspace,
} from "@repo/gtm-cloud";
import { reviewOutreach } from "@repo/gtm-harness";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicBrain } from "./brain";

/**
 * The beta's server side in one place: the store and config, who's signed in, what a workspace
 * looks like to the browser (never its secrets), and how errors become responses.
 */

export interface BetaCtx extends Ctx {
  readonly store: Store;
  readonly cfg: BetaConfig;
  readonly storeKind: "upstash" | "memory";
}

/**
 * One context per server process. Next bundles route handlers and pages separately, so a
 * module-level singleton exists once per bundle; the memory store (local dev) must live on
 * globalThis or a page and an API route would see different data.
 */
const shared = globalThis as typeof globalThis & { __shoninBeta?: BetaCtx };

export function betaCtx(): BetaCtx {
  if (!shared.__shoninBeta) {
    const { store, kind } = storeFromEnv();
    shared.__shoninBeta = { store: kind === "memory" ? new MemoryStore() : store, cfg: betaConfig(), storeKind: kind };
  }
  return shared.__shoninBeta;
}

/** Production without its keys: every beta API route answers 503 until they're set. */
export function notConfigured(): NextResponse | null {
  const { cfg } = betaCtx();
  if (!cfg.missing.length) return null;
  return NextResponse.json({ error: `The beta isn't configured: set ${cfg.missing.join(", ")}.` }, { status: 503 });
}

export async function sessionUser(): Promise<User | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  return currentUser(betaCtx(), value);
}

export async function requireUser(): Promise<User> {
  const user = await sessionUser();
  if (!user) throw new AuthError("Sign in first.", 401);
  return user;
}

export async function requireOwner(userId: string, wsId: unknown): Promise<Workspace> {
  const ws = typeof wsId === "string" && wsId ? await ownedWorkspace(betaCtx(), userId, wsId) : null;
  if (!ws) throw new ActionError("No such workspace.", 404);
  return ws;
}

/** Secure on Vercel and on any https site; plain http on a local `next start`. */
export function sessionCookieOptions() {
  const secure = Boolean(process.env.VERCEL_ENV) || betaCtx().cfg.siteUrl.startsWith("https://");
  return { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: 30 * 86_400 };
}

export async function setSession(cookie: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, cookie, sessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
}

/** What the browser may see of a workspace: the connector secrets and the token hash stay on the server. */
export function publicWorkspace(ws: Workspace) {
  const { slack, x, agent, ...rest } = ws;
  return {
    ...rest,
    ...(slack ? { slack: { label: slack.label } } : {}),
    ...(x ? { x: { username: x.username, expiresAt: x.expiresAt } } : {}),
    ...(agent ? { agent: { hint: agent.hint, createdAt: agent.createdAt } } : {}),
  };
}
export type PublicWorkspace = ReturnType<typeof publicWorkspace>;

/** The only places a one-tap link may point: anything else is dropped rather than rendered as an href. */
const SAFE_LINK = /^(https:\/\/wa\.me\/|mailto:|https:\/\/x\.com\/intent\/|https:\/\/t\.me\/share\/)/;

/** An action as the Desk shows it: with its one-tap link when approved, and X's price for an X post. */
export function actionView(a: Action) {
  const link = linkFor(a, betaCtx().cfg.runs);
  return { ...a, link: link && SAFE_LINK.test(link.url) ? link : null, ...(a.channel === "x" ? { cost: xPostCost(a.text) } : {}) };
}
export type ActionView = ReturnType<typeof actionView>;

export interface DeskData {
  workspace: PublicWorkspace;
  actions: ActionView[];
  events: ActivityEvent[];
  connections: { telegramBot: boolean; botUsername?: string; xApp: boolean; drafter: boolean; runs: boolean };
}

export async function deskData(ws: Workspace): Promise<DeskData> {
  const c = betaCtx();
  const [actions, events] = await Promise.all([listActions(c, ws.id, 100), listEvents(c, ws.id, 30)]);
  return {
    workspace: publicWorkspace(ws),
    actions: actions.map(actionView),
    events,
    connections: {
      telegramBot: Boolean(c.cfg.telegram),
      ...(c.cfg.telegram ? { botUsername: c.cfg.telegram.username } : {}),
      xApp: Boolean(c.cfg.x),
      drafter: Boolean(drafter()),
      runs: c.cfg.runs,
    },
  };
}

/** The user's workspaces, for the switcher. */
export async function workspaceList(user: User): Promise<{ id: string; name: string }[]> {
  const c = betaCtx();
  const all = await Promise.all(user.workspaceIds.map((id) => ownedWorkspace(c, user.id, id)));
  return all.filter((w): w is Workspace => w !== null).map((w) => ({ id: w.id, name: w.name }));
}

let cachedDrafter: Drafter | null | undefined;

/** The LLM that writes a draft from a request; null when no model is configured. */
export function drafter(): Drafter | null {
  if (cachedDrafter === undefined) cachedDrafter = drafterFromEnv();
  return cachedDrafter;
}

/** The reviewer: System One judges each draft ready, revise or blocked. A failure means "not reviewed", never a guess. */
export const review: NonNullable<BotDeps["review"]> = async (ws, channel, text) => {
  try {
    const label = (CHANNEL_LABELS as Record<string, string>)[channel] ?? channel;
    const r = await reviewOutreach(getPublicBrain(), { channel: label, audience: ws.input.audience, text });
    return { verdict: r.verdict, provider: r.provider };
  } catch (error) {
    console.error("[beta] review failed:", error instanceof Error ? error.message : error);
    return null;
  }
};

export function botDeps(): BotDeps {
  return { drafter: drafter(), review };
}

/** Maps a thrown error to a JSON response. Known errors keep their message; anything else is logged and kept vague. */
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ActionError || e instanceof AuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  if (e instanceof BetaError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error("[beta]", e);
  return NextResponse.json({ error: "Something went wrong on our side. Try again in a moment." }, { status: 500 });
}

/** A failure with a message the user should see. */
export class BetaError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/**
 * A browser POST must come from our own site (a cross-site form or fetch can't act with the
 * founder's cookie). A missing Origin is allowed only on a dev box, for curl.
 */
export function originAllowed(req: Request): boolean {
  const { cfg } = betaCtx();
  const origin = req.headers.get("origin");
  if (!origin) return cfg.devKeys;
  return origin === new URL(cfg.siteUrl).origin;
}

/**
 * Runs a beta API handler: the config guard first, then (for a POST, when `req` is given) the
 * Origin check, then every throw becomes a JSON error.
 */
export async function beta(handler: () => Promise<Response>, req?: Request): Promise<Response> {
  const blocked = notConfigured();
  if (blocked) return blocked;
  if (req && req.method !== "GET" && !originAllowed(req)) {
    return NextResponse.json({ error: "Requests must come from the beta's own site." }, { status: 403 });
  }
  try {
    return await handler();
  } catch (e) {
    return errorResponse(e);
  }
}

export async function readJson(req: Request): Promise<unknown> {
  return req.json().catch(() => {
    throw new BetaError("Send a JSON body.");
  });
}

/** Compares two secrets without leaking where they differ. */
export function sameSecret(given: string | null | undefined, expected: string): boolean {
  if (!given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export const PERSON_CHANNELS: ReadonlySet<Channel> = new Set(["whatsapp", "email", "telegram_dm", "linkedin", "other"]);
