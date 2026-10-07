import { createHash } from "node:crypto";

/**
 * The outbox: every message the harness prepares, and the founder's decision on it.
 *
 * Drafts are markdown files (agents write them; people read them). Decisions are an
 * append-only approvals.jsonl at the workspace root (code reads it). An approval is bound
 * to the exact text it approved through a hash, so a draft edited after approval needs a
 * new approval. Code refuses to stage anything that isn't approved for its current text.
 *
 * Sending stays with the founder: for channels that support it, the harness builds a
 * one-tap link (WhatsApp click-to-chat, an email draft, an X post) that opens the app with
 * the message filled in. The founder's tap is the send.
 *
 * Node only (node:crypto): the CLI and server code import it, never the browser.
 */

export type Verdict = "ready" | "revise" | "blocked";

export interface Draft {
  /** Path inside the workspace, e.g. drafts/01-whatsapp.md. */
  readonly file: string;
  /** From the heading: "# WhatsApp · market traders" → "WhatsApp". */
  readonly channel: string;
  /** "**To:**" line: a phone number, an @handle or an email address. */
  readonly to?: string;
  /** "**Subject:**" line, for email. */
  readonly subject?: string;
  /** The reviewer's verdict, when the draft has been reviewed. */
  readonly verdict?: Verdict;
  /** The message itself: everything after the last line that is exactly ---. */
  readonly text: string;
}

export type Decision = "approved" | "rejected" | "sent";

export interface ApprovalRecord {
  readonly file: string;
  readonly hash: string;
  readonly decision: Decision;
  /** Who decided: a Telegram username or id, or "cli:<user>", or "manual". */
  readonly by: string;
  readonly at: string;
  readonly via: "cli" | "telegram" | "manual";
  readonly note?: string;
}

export type DraftStatus = "unreviewed" | "blocked" | "pending" | "approved" | "rejected" | "stale" | "sent";

/** A short, stable fingerprint of the exact text. Whitespace at the ends doesn't count. */
export function textHash(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex").slice(0, 16);
}

/** A draft's id for buttons and logs: its file plus the text hash, short enough for Telegram's 64-byte callback data. */
export function draftId(draft: Draft): string {
  return textHash(`${draft.file}\n${draft.text}`);
}

const VERDICTS: Readonly<Record<string, Verdict>> = { READY: "ready", REVISE: "revise", BLOCKED: "blocked" };

export function parseDraft(file: string, content: string): Draft | null {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const heading = lines.find((l) => l.startsWith("# "));
  const sep = lines.lastIndexOf("---");
  if (!heading || sep < 0) return null;
  const text = lines
    .slice(sep + 1)
    .join("\n")
    .trim();
  if (!text) return null;
  const head = lines.slice(0, sep);
  const field = (name: string) => {
    const line = head.find((l) => l.startsWith(`**${name}:**`));
    return line ? line.slice(name.length + 5).trim() : undefined;
  };
  const reviewer = field("Reviewer");
  const verdict = reviewer ? VERDICTS[reviewer.split(/[:\s]/)[0]?.toUpperCase() ?? ""] : undefined;
  const to = field("To");
  const subject = field("Subject");
  return {
    file,
    channel: heading.slice(2).split(" · ")[0]!.trim(),
    ...(to ? { to } : {}),
    ...(subject ? { subject } : {}),
    ...(verdict ? { verdict } : {}),
    text,
  };
}

export function parseApprovals(jsonl: string): ApprovalRecord[] {
  const out: ApprovalRecord[] = [];
  for (const line of jsonl.split("\n")) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line) as Partial<ApprovalRecord>;
      if (r.file && r.hash && (r.decision === "approved" || r.decision === "rejected" || r.decision === "sent") && r.by && r.at && r.via) {
        out.push(r as ApprovalRecord);
      }
    } catch {
      // A torn last line from a crash is skipped, never guessed at.
    }
  }
  return out;
}

export function approvalLine(record: ApprovalRecord): string {
  return `${JSON.stringify(record)}\n`;
}

/** Where a draft stands. Only the latest decision for its current text counts. */
export function statusOf(draft: Draft, approvals: readonly ApprovalRecord[]): DraftStatus {
  if (draft.verdict === "blocked") return "blocked";
  const hash = textHash(draft.text);
  const mine = approvals.filter((a) => a.file === draft.file);
  const current = mine.filter((a) => a.hash === hash);
  const latest = current[current.length - 1];
  if (latest) return latest.decision;
  if (mine.some((a) => a.decision === "approved")) return "stale";
  return draft.verdict ? "pending" : "unreviewed";
}

/** The gate: true only for a draft approved for exactly this text and not blocked or already sent. */
export function canSend(draft: Draft, approvals: readonly ApprovalRecord[]): boolean {
  return statusOf(draft, approvals) === "approved";
}

export interface SendLink {
  readonly label: string;
  readonly url: string;
}

/**
 * A link that opens the right app with the message filled in, so the founder sends it with
 * one tap. Channels with no such link (LinkedIn messages, Discord) return null: copy the text.
 */
export function sendLink(draft: Draft): SendLink | null {
  const channel = draft.channel.toLowerCase();
  const text = encodeURIComponent(draft.text);
  if (channel.includes("whatsapp")) {
    const digits = (draft.to ?? "").replace(/[^\d]/g, "");
    return { label: "Open in WhatsApp", url: digits.length >= 8 ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}` };
  }
  const looksLikeEmail = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(draft.to ?? "");
  if (channel.includes("email") || looksLikeEmail) {
    const to = looksLikeEmail ? draft.to : "";
    const subject = draft.subject ? `subject=${encodeURIComponent(draft.subject)}&` : "";
    return { label: "Open the email", url: `mailto:${to}?${subject}body=${text}` };
  }
  if (channel === "x" || channel.includes("twitter")) {
    return { label: "Open the post on X", url: `https://x.com/intent/post?text=${text}` };
  }
  if (channel.includes("telegram")) {
    return { label: "Share on Telegram", url: `https://t.me/share/url?url=&text=${text}` };
  }
  return null;
}
