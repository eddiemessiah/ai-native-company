"use client";

import { useState } from "react";
import type { DeskData } from "@/lib/beta";
import { post } from "@/lib/beta-client";
import { btn, btnSolid, Field, fieldBase, MEANING, when } from "./ui";

type Tool = "slack" | "x" | "telegram";

export function Connections({ data, onChange, onError }: { data: DeskData; onChange: () => Promise<void>; onError: (message: string) => void }) {
  const ws = data.workspace;
  const c = data.connections;
  const [busy, setBusy] = useState<string | null>(null);
  const [tgUrl, setTgUrl] = useState<string | null>(null);
  const [slack, setSlack] = useState({ webhook: "", label: "" });
  const [agent, setAgent] = useState<{ token: string; mcpUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function step<T>(name: string, fn: () => Promise<T>): Promise<T | null> {
    setBusy(name);
    try {
      const out = await fn();
      await onChange();
      return out;
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  const disconnect = (tool: Tool, what: string) => {
    if (!window.confirm(`Disconnect ${what}? Nothing will post there until you connect it again.`)) return;
    void step(`off-${tool}`, () => post("/api/beta/connect/disconnect", { workspaceId: ws.id, tool }));
  };

  const command = agent ? `claude mcp add --transport http shonin ${agent.mcpUrl} --header "Authorization: Bearer ${agent.token}"` : "";

  return (
    <div className="card divide-y divide-line">
      {/* Telegram: the remote control */}
      <Block title="Telegram" status={ws.telegram ? `Linked${ws.telegram.username ? ` · @${ws.telegram.username}` : ""}` : null}>
        {!c.telegramBot ? (
          <p className="text-base text-dim">The Telegram bot isn&apos;t configured on this deployment yet.</p>
        ) : ws.telegram ? (
          <>
            <p className="text-base text-dim">Approval cards come to your Telegram. Write to the bot to ask for a draft; /login signs you in on another device.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={btn} disabled={busy !== null} onClick={() => disconnect("telegram", "Telegram")}>
                {busy === "off-telegram" ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-base text-dim">Approve from your phone, and ask for drafts in chat.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tgUrl ? (
                <a href={tgUrl} target="_blank" rel="noopener noreferrer" className={btnSolid}>
                  Open @{c.botUsername} and press Start
                </a>
              ) : (
                <button
                  type="button"
                  className={btnSolid}
                  disabled={busy !== null}
                  onClick={() =>
                    void step("tg", async () => {
                      const { url } = await post<{ url: string }>("/api/beta/connect/telegram", { workspaceId: ws.id });
                      setTgUrl(url);
                    })
                  }
                >
                  {busy === "tg" ? "Making your link…" : "Connect Telegram"}
                </button>
              )}
            </div>
            {tgUrl ? <p className="mt-2 font-mono text-[12px] text-faint">The link works once, for 15 minutes. This page updates when you&apos;re linked.</p> : null}
          </>
        )}
        {c.telegramBot ? (
          <div className="mt-4">
            <p className="font-mono text-xs text-dim">Groups and channels it can post to</p>
            {ws.telegramTargets.length ? (
              <ul className="mt-2 space-y-1 text-base">
                {ws.telegramTargets.map((t) => (
                  <li key={t.chatId}>
                    {t.title} <span className="font-mono text-[12px] text-faint">· {t.type}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-base text-faint">None yet.</p>
            )}
            <p className="mt-2 font-mono text-[12px] leading-relaxed text-faint">
              Add @{c.botUsername} to your group or channel as an admin{ws.telegram ? "" : " (after linking)"}. It shows up here, and approved posts can go there.
            </p>
          </div>
        ) : null}
      </Block>

      {/* Slack */}
      <Block title="Slack" status={ws.slack ? `Posting to ${ws.slack.label}` : null}>
        {ws.slack ? (
          <>
            <p className="text-base text-dim">Approved Slack updates post to {ws.slack.label}.</p>
            <div className="mt-3">
              <button type="button" className={btn} disabled={busy !== null} onClick={() => disconnect("slack", "Slack")}>
                {busy === "off-slack" ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void step("slack", async () => {
                await post("/api/beta/connect/slack", { workspaceId: ws.id, ...slack });
                setSlack({ webhook: "", label: "" });
              });
            }}
          >
            <p className="text-base text-dim">In Slack, add an Incoming Webhook to a channel, then paste its URL. We send one test message.</p>
            <Field label="Channel name" id="slack-label">
              <input id="slack-label" className={`${fieldBase} h-12`} placeholder="#launches" maxLength={60} value={slack.label} onChange={(e) => setSlack((s) => ({ ...s, label: e.target.value }))} />
            </Field>
            <Field label="Webhook URL" id="slack-webhook">
              <input
                id="slack-webhook"
                className={`${fieldBase} h-12`}
                type="url"
                inputMode="url"
                required
                placeholder="https://hooks.slack.com/services/…"
                value={slack.webhook}
                onChange={(e) => setSlack((s) => ({ ...s, webhook: e.target.value }))}
              />
            </Field>
            <button type="submit" className={btnSolid} disabled={busy !== null}>
              {busy === "slack" ? "Testing…" : "Connect Slack"}
            </button>
          </form>
        )}
      </Block>

      {/* X */}
      <Block title="X" status={ws.x ? `@${ws.x.username}` : null}>
        {!c.xApp ? (
          <p className="text-base text-dim">X isn&apos;t configured on this deployment yet.</p>
        ) : ws.x ? (
          <>
            <p className="text-base text-dim">Approved X posts run on @{ws.x.username}.</p>
            <div className="mt-3">
              <button type="button" className={btn} disabled={busy !== null} onClick={() => disconnect("x", "X")}>
                {busy === "off-x" ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-base text-dim">Approved posts run on your account. Nothing posts without your yes.</p>
            <div className="mt-3">
              <a href={`/api/beta/x/start?ws=${encodeURIComponent(ws.id)}`} className={btnSolid}>
                Connect X
              </a>
            </div>
          </>
        )}
        <p className="mt-2 font-mono text-[12px] text-faint">X charges $0.015 a post, or $0.20 with a link.</p>
      </Block>

      {/* Agents */}
      <Block title="Your agents" status={ws.agent ? `Token …${ws.agent.hint}` : null}>
        <p className="text-base text-dim">
          Claude Code, Codex, Cursor or your own bot reach this workspace through one URL. Subagents share it. Agents can read, draft and ask for approval;
          none of them can send or approve.
        </p>
        {agent ? (
          <div className="mt-4">
            <p className="font-mono text-xs text-dim">Run this once. The token is shown only now.</p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-line bg-bg-2 p-4 font-mono text-[13px] leading-relaxed">
              <code>{command}</code>
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={btnSolid}
                onClick={() => {
                  void navigator.clipboard?.writeText(command).catch(() => undefined);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Copied" : "Copy the command"}
              </button>
              <button type="button" className={btn} onClick={() => setAgent(null)}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={ws.agent ? btn : btnSolid}
              disabled={busy !== null}
              onClick={() => {
                if (ws.agent && !window.confirm("Make a new token? The old one stops working at once.")) return;
                void step("agent", async () => setAgent(await post<{ token: string; mcpUrl: string }>("/api/beta/agent-token", { workspaceId: ws.id })));
              }}
            >
              {busy === "agent" ? "Making a token…" : ws.agent ? "Replace the token" : "Create a token"}
            </button>
            {ws.agent ? <span className="font-mono text-[12px] text-faint">Made {when(ws.agent.createdAt)}</span> : null}
          </div>
        )}
      </Block>
    </div>
  );
}

function Block({ title, status, children }: { title: string; status: string | null; children: React.ReactNode }) {
  return (
    <div className="p-5 md:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h3>
        {status ? (
          <span className="chip h-8 text-[12px] text-fg">
            <span className="dot" style={{ background: MEANING.code }} aria-hidden="true" />
            {status}
          </span>
        ) : (
          <span className="font-mono text-[12px] text-faint">Not connected</span>
        )}
      </div>
      {children}
    </div>
  );
}
