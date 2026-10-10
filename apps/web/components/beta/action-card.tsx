"use client";

import { useState } from "react";
import type { ActionView, PublicWorkspace } from "@/lib/beta";
import { channelLabel, runsOnApproval, safeSendLink } from "@/lib/beta-client";
import { btn, btnApprove, MEANING, when } from "./ui";

export type Op = "edit" | "request" | "approve" | "reject" | "retry" | "retry_not_posted" | "confirm_posted" | "sent";
export type OpExtra = { text?: string; hash?: string; ref?: string };

const LIMIT: Partial<Record<ActionView["channel"], number>> = { x: 280, telegram_post: 4096, telegram_dm: 4096, slack: 3000, whatsapp: 4000 };

function target(a: ActionView, ws: PublicWorkspace): string | undefined {
  if (a.channel === "telegram_post") return ws.telegramTargets.find((t) => String(t.chatId) === a.to)?.title ?? a.to;
  if (a.channel === "x") return ws.x ? `@${ws.x.username}` : undefined;
  if (a.channel === "slack") return ws.slack?.label;
  return a.to;
}

/** Whether the founder's own channel is ready to take this post. */
function notConnected(a: ActionView, ws: PublicWorkspace): string | null {
  if (a.channel === "x" && !ws.x) return "Connect X first, or approving will fail.";
  if (a.channel === "slack" && !ws.slack) return "Connect Slack first, or approving will fail.";
  if (a.channel === "telegram_post" && !ws.telegramTargets.some((t) => String(t.chatId) === a.to)) return "The bot isn't an admin of that chat, so approving will fail.";
  return null;
}

function byline(a: ActionView): { text: string; llm: boolean } {
  if (a.source === "plan") return { text: `From your plan · ${a.author}`, llm: true };
  if (a.source === "agent") return { text: "Drafted by your agent", llm: true };
  if (a.source === "telegram") return { text: "Drafted from Telegram", llm: true };
  if (a.author === "drafter") return { text: "Drafted from your request", llm: true };
  return { text: `Written by ${a.author}`, llm: false };
}

export function ActionCard({ action: a, ws, telegramLinked, runs, onOp }: { action: ActionView; ws: PublicWorkspace; telegramLinked: boolean; runs: boolean; onOp: (id: string, op: Op, extra?: OpExtra) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(a.text);
  const [busy, setBusy] = useState<Op | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async (op: Op, extra?: OpExtra) => {
    setBusy(op);
    const ok = await onOp(a.id, op, extra);
    setBusy(null);
    if (ok && op === "edit") setEditing(false);
  };

  const errors = a.findings.filter((f) => f.level === "error");
  const warnings = a.findings.filter((f) => f.level !== "error");
  const where = target(a, ws);
  const by = byline(a);
  const own = runsOnApproval(a.channel);
  const limit = LIMIT[a.channel];
  const count = [...text].length;
  const missing = own && runs && (a.status === "draft" || a.status === "pending") ? notConnected(a, ws) : null;

  const copy = async () => {
    await navigator.clipboard?.writeText(a.text).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article id={a.id} className="card scroll-mt-24 p-5 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="font-mono text-[13px] text-fg">
            {channelLabel(a.channel)}
            {where ? <span className="text-dim"> → {where}</span> : null}
          </p>
          <p className="mt-1 flex items-center gap-2 font-mono text-[12px] text-faint">
            {by.llm ? <span className="dot" style={{ background: MEANING.write }} aria-hidden="true" /> : null}
            {by.text}
          </p>
        </div>
        {a.review ? (
          <span className="chip h-8 shrink-0 text-[12px]" style={{ borderColor: "color-mix(in srgb, var(--decide) 55%, transparent)" }}>
            <span className="dot" style={{ background: MEANING.decide }} aria-hidden="true" />
            Reviewer: {a.review.verdict}
          </span>
        ) : (
          <span className="chip h-8 shrink-0 text-[12px] text-faint">Not reviewed</span>
        )}
      </header>

      {editing ? (
        <div className="mt-4">
          <label htmlFor={`edit-${a.id}`} className="sr-only">
            Edit the text
          </label>
          <textarea id={`edit-${a.id}`} className="field min-h-40 resize-y text-base leading-relaxed" value={text} maxLength={4000} onChange={(e) => setText(e.target.value)} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className={`font-mono text-[12px] ${limit && count > limit ? "text-human" : "text-faint"}`}>
              {count}
              {limit ? ` / ${limit}` : ""} characters · saving voids any approval
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={btn}
                onClick={() => {
                  setEditing(false);
                  setText(a.text);
                }}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-solid h-11 px-5 disabled:opacity-50" disabled={busy !== null || !text.trim()} onClick={() => void run("edit", { text })}>
                {busy === "edit" ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap break-words text-base leading-relaxed">{a.text}</p>
      )}

      {a.subject ? <p className="mt-2 font-mono text-[12px] text-faint">Subject: {a.subject}</p> : null}

      {errors.length ? (
        <ul className="mt-4 space-y-2 border-t border-line pt-4" aria-label="What the checks found">
          {errors.map((f, i) => (
            <li key={`${f.rule}-${i}`} className="grid grid-cols-[14px_1fr] gap-2 text-[15px]">
              <span className="dot mt-2" style={{ background: MEANING.code }} aria-hidden="true" />
              <span>
                <span className="text-fg">{f.problem}</span>
                <span className="text-dim"> · {f.fix}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {warnings.length && !errors.length ? (
        <p className="mt-3 font-mono text-[12px] text-faint">
          Checks passed with {warnings.length} note{warnings.length === 1 ? "" : "s"}: {warnings.map((w) => w.problem).join("; ")}
        </p>
      ) : null}

      {a.cost ? (
        <p className="mt-3 font-mono text-[12px] text-faint">
          X charges about ${a.cost.usd} for this post ({a.cost.reason}).
        </p>
      ) : null}
      {missing ? <p className="mt-2 font-mono text-[12px] text-dim">{missing}</p> : null}

      {!editing ? <Footer a={a} own={own} posts={own && runs} busy={busy} telegramLinked={telegramLinked} copied={copied} onCopy={copy} onEdit={() => {
            setText(a.text);
            setEditing(true);
          }} run={run} /> : null}
    </article>
  );
}

function Footer({
  a,
  own,
  posts,
  busy,
  telegramLinked,
  copied,
  onCopy,
  onEdit,
  run,
}: {
  a: ActionView;
  own: boolean;
  posts: boolean;
  busy: Op | null;
  telegramLinked: boolean;
  copied: boolean;
  onCopy: () => void;
  onEdit: () => void;
  run: (op: Op, extra?: OpExtra) => Promise<void>;
}) {
  const [postedRef, setPostedRef] = useState("");
  const link = a.link && safeSendLink(a.link.url) ? a.link : null;
  const edit = (
    <button type="button" className={btn} disabled={busy !== null} onClick={onEdit}>
      Edit
    </button>
  );
  const decideButtons = (
    <>
      <button type="button" className={btnApprove} disabled={busy !== null} onClick={() => void run("approve", { hash: a.hash })}>
        {busy === "approve" ? (posts ? "Posting…" : "Approving…") : posts ? "Approve and post" : "Approve"}
      </button>
      <button type="button" className={btn} disabled={busy !== null} onClick={() => void run("reject", { hash: a.hash })}>
        {busy === "reject" ? "Rejecting…" : "Reject"}
      </button>
    </>
  );
  const note = (text: string) => <p className="mt-4 font-mono text-[12px] leading-relaxed text-faint">{text}</p>;

  switch (a.status) {
    case "held":
      return (
        <>
          {note("Checks are holding this one. Edit it to fix what they found.")}
          <div className="mt-3 flex flex-wrap gap-2">{edit}</div>
        </>
      );
    case "draft":
      return (
        <>
          {note(posts ? "Approving posts it now, on your own channel." : own ? "Posting is switched off on this deployment: approving gives you a link to post it yourself." : "Approving gives you a one-tap link; your tap sends it.")}
          <div className="mt-3 flex flex-wrap gap-2">
            {decideButtons}
            <button type="button" className={btn} disabled={busy !== null} onClick={() => void run("request")}>
              {busy === "request" ? "Asking…" : telegramLinked ? "Ask for approval in Telegram" : "Ask for approval"}
            </button>
            {edit}
          </div>
        </>
      );
    case "pending":
      return (
        <>
          {note(`Waiting for your yes${telegramLinked ? ", here or in Telegram" : ""}. ${posts ? "Approving posts it now." : "Approving gives you a one-tap link."}`)}
          <div className="mt-3 flex flex-wrap gap-2">
            {decideButtons}
            {edit}
          </div>
        </>
      );
    case "running":
      return note("Approved. Posting it now; this updates in a moment.");
    case "approved":
      if (own && link)
        return (
          <>
            {note("Approved. Posting is switched off on this deployment, so post it yourself: the link opens with the text filled in.")}
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className={btnApprove}>
                {link.label}
              </a>
            </div>
          </>
        );
      if (own) return note(a.channel === "slack" ? "Approved. Posting is switched off on this deployment; copy the text into Slack." : "Approved. It's posting; this updates in a moment.");
      return (
        <>
          {note(link ? "Approved. Tap to open it with the text filled in, send it yourself, then mark it sent." : "Approved. Copy the text, send it yourself, then mark it sent.")}
          <div className="mt-3 flex flex-wrap gap-2">
            {link ? (
              <a href={link.url} target="_blank" rel="noopener noreferrer" className={btnApprove}>
                {link.label}
              </a>
            ) : (
              <button type="button" className={btnApprove} onClick={onCopy}>
                {copied ? "Copied" : "Copy the text"}
              </button>
            )}
            <button type="button" className={btn} disabled={busy !== null} onClick={() => void run("sent")}>
              {busy === "sent" ? "Saving…" : "I sent it"}
            </button>
            {edit}
          </div>
        </>
      );
    case "failed":
      return (
        <>
          <p role="alert" className="mt-4 text-[15px] text-human">
            Couldn&apos;t post it: {a.error ?? "unknown error"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={btn} disabled={busy !== null} onClick={() => void run("retry")}>
              {busy === "retry" ? "Retrying…" : "Retry"}
            </button>
            {edit}
          </div>
        </>
      );
    case "unknown":
      return (
        <>
          <p role="alert" className="mt-4 text-[15px] text-human">
            {a.error ?? "We couldn't tell whether it posted."}
          </p>
          <p className="mt-2 font-mono text-[12px] leading-relaxed text-faint">Check the channel first. Running it again when it did post would post it twice.</p>
          <div className="mt-3">
            <label htmlFor={`ref-${a.id}`} className="mb-2 block font-mono text-xs text-dim">
              Link to the post (optional)
            </label>
            <input
              id={`ref-${a.id}`}
              className="field h-11 text-base"
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={300}
              value={postedRef}
              onChange={(e) => setPostedRef(e.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={btn} disabled={busy !== null} onClick={() => void run("confirm_posted", postedRef.trim() ? { ref: postedRef.trim() } : {})}>
              {busy === "confirm_posted" ? "Saving…" : "It posted"}
            </button>
            <button type="button" className={btn} disabled={busy !== null} onClick={() => void run("retry_not_posted")}>
              {busy === "retry_not_posted" ? "Running…" : "It didn't post, run again"}
            </button>
          </div>
        </>
      );
    case "done": {
      const r = a.receipt;
      return (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 font-mono text-[12px] text-faint">
          <span className="flex items-center gap-2">
            <span className="dot" style={{ background: MEANING.code }} aria-hidden="true" />
            Signed receipt{r ? ` · ${when(r.at)}` : ""}
          </span>
          {r ? <span>{r.result === "posted" ? "Posted" : "You sent it"}</span> : null}
          {r?.ref?.startsWith("https://") ? (
            <a href={r.ref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-fg underline decoration-line-2 underline-offset-4">
              Open the post
            </a>
          ) : null}
          {a.approval ? <span>Approved by {a.approval.by} via {a.approval.via}</span> : null}
        </div>
      );
    }
    case "rejected":
      return (
        <>
          {note(`Rejected${a.approval ? ` by ${a.approval.by}, ${when(a.approval.at)}` : ""}. Edit it to bring it back as a draft.`)}
          <div className="mt-3 flex flex-wrap gap-2">{edit}</div>
        </>
      );
  }
}
