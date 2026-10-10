import { randomBytes } from "node:crypto";
import { randomId, safeEqual, seal, sha256, unseal } from "./crypto";
import { getJson, setJson } from "./store";
import { getUser, keys, nowIso, saveUser, type Ctx } from "./repo";
import type { User } from "./types";

/**
 * Who's signed in. The beta has no passwords and no email sending: a session cookie is the
 * account on this device, and Telegram is how it comes back on another device (the bot sends a
 * one-time sign-in link to the chat linked to the account). The gate is open or invite-only.
 */

export const SESSION_COOKIE = "shonin_beta";
const SESSION_DAYS = 30;

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status = 401,
  ) {
    super(message);
  }
}

export function inviteAccepted(ctx: Ctx, code: string | undefined): boolean {
  if (ctx.cfg.gate === "open") return true;
  const given = (code ?? "").trim();
  return Boolean(given) && ctx.cfg.inviteCodes.some((c) => safeEqual(c, given));
}

export async function signUp(ctx: Ctx, input: { name: string; email?: string; invite?: string }): Promise<{ user: User; cookie: string }> {
  if (!inviteAccepted(ctx, input.invite)) throw new AuthError("That invite code doesn't work. Ask Edidiong for one.", 403);
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) throw new AuthError("Tell us your name.", 400);
  const email = input.email?.trim().toLowerCase().slice(0, 200);
  const user: User = { id: randomId("usr"), name, ...(email ? { email } : {}), createdAt: nowIso(ctx), workspaceIds: [] };
  await saveUser(ctx, user);
  return { user, cookie: sessionCookie(ctx, user.id) };
}

export function sessionCookie(ctx: Ctx, userId: string): string {
  return seal(ctx.cfg.sessionSecret, { uid: userId, exp: (ctx.now?.() ?? new Date()).getTime() + SESSION_DAYS * 86_400_000 });
}

export async function currentUser(ctx: Ctx, cookie: string | undefined): Promise<User | null> {
  const session = unseal<{ uid: string; exp: number }>(ctx.cfg.sessionSecret, cookie, (ctx.now?.() ?? new Date()).getTime());
  return session ? getUser(ctx, session.uid) : null;
}

/** A one-time sign-in code, valid for ten minutes, sent by the bot to the founder's linked chat. */
export async function createLoginCode(ctx: Ctx, userId: string): Promise<string> {
  const code = randomBytes(18).toString("base64url");
  await setJson(ctx.store, keys.loginCode(sha256(code)), { userId }, { ex: 600 });
  return code;
}

export async function redeemLoginCode(ctx: Ctx, code: string): Promise<{ user: User; cookie: string }> {
  const key = keys.loginCode(sha256(code));
  const entry = await getJson<{ userId: string }>(ctx.store, key);
  await ctx.store.del(key); // one use, even when it fails below
  const user = entry ? await getUser(ctx, entry.userId) : null;
  if (!user) throw new AuthError("That sign-in link has expired or was used. Send /login to the bot for a new one.");
  return { user, cookie: sessionCookie(ctx, user.id) };
}
