import type { GtmInput, GtmPlan } from "@repo/gtm-harness";
import type { Finding } from "@repo/gtm-harness/check";
import type { Signed } from "./crypto";

/**
 * Where an action goes. The first three are the founder's own channels: an approved action there
 * runs. The rest reach a person, so approval gives the founder a one-tap link and their tap sends.
 */
export const CHANNELS = ["x", "telegram_post", "slack", "whatsapp", "email", "telegram_dm", "linkedin", "other"] as const;
export type Channel = (typeof CHANNELS)[number];
export const RUNS_ON_APPROVAL: ReadonlySet<Channel> = new Set(["x", "telegram_post", "slack"]);

export const CHANNEL_LABELS: Readonly<Record<Channel, string>> = {
  x: "X post",
  telegram_post: "Telegram channel or group",
  slack: "Slack",
  whatsapp: "WhatsApp message",
  email: "Email",
  telegram_dm: "Telegram message",
  linkedin: "LinkedIn",
  other: "Other",
};

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly createdAt: string;
  readonly workspaceIds: string[];
}

export interface TelegramLink {
  readonly userId: number;
  readonly chatId: number;
  readonly username?: string;
  readonly linkedAt: string;
}

/** A group or channel where the founder made the bot an admin. */
export interface TelegramTarget {
  readonly chatId: number;
  readonly title: string;
  readonly type: "group" | "supergroup" | "channel";
  readonly addedAt: string;
}

export interface Workspace {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly input: GtmInput;
  readonly plan: GtmPlan;
  readonly generatedBy: string;
  readonly createdAt: string;
  telegram?: TelegramLink;
  telegramTargets: TelegramTarget[];
  /** The Slack incoming webhook, encrypted. */
  slack?: { readonly webhook: string; readonly label: string };
  /** X OAuth tokens, encrypted. */
  x?: { readonly username: string; readonly access: string; readonly refresh?: string; readonly expiresAt: number };
  /** The agent bridge token, stored only as a hash; the hint is its last four characters. */
  agent?: { readonly tokenHash: string; readonly hint: string; readonly createdAt: string };
}

export type ActionStatus = "held" | "draft" | "pending" | "approved" | "done" | "failed" | "rejected";

export interface Review {
  readonly verdict: "ready" | "revise" | "blocked";
  readonly provider?: string;
}

export interface ApprovalRecord extends Record<string, unknown> {
  readonly kind: "approval";
  readonly actionId: string;
  readonly workspaceId: string;
  /** sha256 of the exact text. Change one character and this approval no longer covers it. */
  readonly hash: string;
  readonly decision: "approved" | "rejected";
  readonly by: string;
  readonly via: "web" | "telegram";
  readonly at: string;
}

export interface ReceiptRecord extends Record<string, unknown> {
  readonly kind: "receipt";
  readonly actionId: string;
  readonly workspaceId: string;
  readonly hash: string;
  readonly channel: Channel;
  readonly result: "posted" | "link" | "marked_sent";
  /** The post's URL or id, or the link the founder tapped. */
  readonly ref?: string;
  readonly at: string;
}

export interface Action {
  readonly id: string;
  readonly workspaceId: string;
  readonly channel: Channel;
  /** A phone number, an email, an @handle; for telegram_post, the target chat id. */
  readonly to?: string;
  readonly subject?: string;
  readonly text: string;
  readonly hash: string;
  readonly source: "plan" | "agent" | "telegram" | "web";
  readonly author: string;
  readonly createdAt: string;
  updatedAt: string;
  review?: Review;
  findings: Finding[];
  status: ActionStatus;
  approval?: Signed<ApprovalRecord>;
  receipt?: Signed<ReceiptRecord>;
  error?: string;
  card?: { readonly chatId: number; readonly messageId: number };
}

export interface ActivityEvent {
  readonly at: string;
  readonly actor: "founder" | "agent" | "system" | "telegram";
  readonly what: string;
  readonly actionId?: string;
}
