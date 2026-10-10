import type { BetaConfig } from "./config";
import { getJson, setJson, type Store } from "./store";
import type { Action, ActivityEvent, User, Workspace } from "./types";

/** Everything a hosted operation needs. fetch and now are passed in so tests control them. */
export interface Ctx {
  readonly store: Store;
  readonly cfg: BetaConfig;
  readonly fetch?: typeof fetch;
  readonly now?: () => Date;
}

export const nowIso = (ctx: Ctx) => (ctx.now?.() ?? new Date()).toISOString();

export const keys = {
  user: (id: string) => `user:${id}`,
  workspace: (id: string) => `ws:${id}`,
  files: (id: string) => `ws:${id}:files`,
  actions: (id: string) => `ws:${id}:actions`,
  events: (id: string) => `ws:${id}:events`,
  action: (id: string) => `action:${id}`,
  agentToken: (hash: string) => `agent-token:${hash}`,
  telegramLinkCode: (code: string) => `tg-link:${code}`,
  telegramUser: (userId: number) => `tg-user:${userId}`,
  telegramTarget: (chatId: number) => `tg-target:${chatId}`,
  cardsToday: (wsId: string, day: string) => `cap:${wsId}:${day}`,
  xOauth: (state: string) => `x-oauth:${state}`,
  loginCode: (code: string) => `login:${code}`,
};

export const getUser = (ctx: Ctx, id: string) => getJson<User>(ctx.store, keys.user(id));
export const saveUser = (ctx: Ctx, user: User) => setJson(ctx.store, keys.user(user.id), user);
export const getWorkspace = (ctx: Ctx, id: string) => getJson<Workspace>(ctx.store, keys.workspace(id));
export const saveWorkspace = (ctx: Ctx, ws: Workspace) => setJson(ctx.store, keys.workspace(ws.id), ws);
export const getFiles = async (ctx: Ctx, wsId: string) => (await getJson<Record<string, string>>(ctx.store, keys.files(wsId))) ?? {};
export const saveFiles = (ctx: Ctx, wsId: string, files: Record<string, string>) => setJson(ctx.store, keys.files(wsId), files);
export const getAction = (ctx: Ctx, id: string) => getJson<Action>(ctx.store, keys.action(id));
export const saveAction = (ctx: Ctx, action: Action) => setJson(ctx.store, keys.action(action.id), action);

export async function listActions(ctx: Ctx, wsId: string, limit = 200): Promise<Action[]> {
  const ids = await ctx.store.lrange(keys.actions(wsId), 0, limit - 1);
  const actions = await Promise.all(ids.map((id) => getAction(ctx, id)));
  return actions.filter((a): a is Action => a !== null);
}

export async function logEvent(ctx: Ctx, wsId: string, event: Omit<ActivityEvent, "at">): Promise<void> {
  await ctx.store.lpush(keys.events(wsId), JSON.stringify({ at: nowIso(ctx), ...event }));
  await ctx.store.ltrim(keys.events(wsId), 500);
}

export async function listEvents(ctx: Ctx, wsId: string, limit = 100): Promise<ActivityEvent[]> {
  return (await ctx.store.lrange(keys.events(wsId), 0, limit - 1)).map((raw) => JSON.parse(raw) as ActivityEvent);
}

/** The workspace, only if this user owns it. */
export async function ownedWorkspace(ctx: Ctx, userId: string, wsId: string): Promise<Workspace | null> {
  const ws = await getWorkspace(ctx, wsId);
  return ws && ws.ownerId === userId ? ws : null;
}
