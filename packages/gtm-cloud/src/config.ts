import { createHash } from "node:crypto";

type Env = Record<string, string | undefined>;

export interface BetaConfig {
  /** open: anyone can start; invite: a code from BETA_INVITE_CODES is needed. */
  readonly gate: "open" | "invite";
  readonly inviteCodes: readonly string[];
  readonly sessionSecret: Buffer;
  readonly signingKey: Buffer;
  readonly encryptionKey: Buffer;
  readonly siteUrl: string;
  readonly telegram?: { readonly token: string; readonly username: string; readonly webhookSecret: string };
  readonly x?: { readonly clientId: string; readonly clientSecret?: string };
  /** Approval cards a workspace can get in a day: approvals at volume turn into rubber stamps. */
  readonly maxCardsPerDay: number;
  /** Keys that production needs and doesn't have. Routes answer 503 until it's empty. */
  readonly missing: readonly string[];
  /** True when the keys are the local-development ones. */
  readonly devKeys: boolean;
}

function key(env: Env, name: string, production: boolean, missing: string[]): Buffer {
  const hex = env[name]?.trim();
  if (hex && /^[0-9a-f]{64,}$/i.test(hex)) return Buffer.from(hex.slice(0, 64), "hex");
  if (production) missing.push(name);
  // Local development only: a fixed key per name, so sessions survive a restart. Never used in production.
  return createHash("sha256").update(`shonin-beta-dev-only:${name}`).digest();
}

export function betaConfig(env: Env = process.env): BetaConfig {
  const production = env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview" || env.NODE_ENV === "production";
  const missing: string[] = [];
  const sessionSecret = key(env, "BETA_SESSION_SECRET", production, missing);
  const signingKey = key(env, "BETA_SIGNING_KEY", production, missing);
  const encryptionKey = key(env, "BETA_ENCRYPTION_KEY", production, missing);
  const telegram =
    env.TELEGRAM_BETA_BOT_TOKEN && env.TELEGRAM_BETA_BOT_USERNAME && env.TELEGRAM_BETA_WEBHOOK_SECRET
      ? { token: env.TELEGRAM_BETA_BOT_TOKEN, username: env.TELEGRAM_BETA_BOT_USERNAME.replace(/^@/, ""), webhookSecret: env.TELEGRAM_BETA_WEBHOOK_SECRET }
      : undefined;
  const cap = Number(env.GTM_MAX_CARDS_PER_DAY);
  return {
    gate: env.BETA_GATE === "invite" ? "invite" : "open",
    inviteCodes: (env.BETA_INVITE_CODES ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    sessionSecret,
    signingKey,
    encryptionKey,
    siteUrl: (env.BETA_SITE_URL || env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
    ...(telegram ? { telegram } : {}),
    ...(env.X_CLIENT_ID ? { x: { clientId: env.X_CLIENT_ID, ...(env.X_CLIENT_SECRET ? { clientSecret: env.X_CLIENT_SECRET } : {}) } } : {}),
    maxCardsPerDay: Number.isInteger(cap) && cap > 0 ? cap : 15,
    missing,
    devKeys: !production,
  };
}
