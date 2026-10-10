"use client";

import type { ActionStatus, Channel } from "@repo/gtm-cloud";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActionView, DeskData } from "@/lib/beta";
import { CHANNEL_OPTIONS, channelLabel, post } from "@/lib/beta-client";
import { ActionCard, type Op, type OpExtra } from "./action-card";
import { Connections } from "./connections";
import { btnSolid, Field, fieldBase, MEANING, Section, when } from "./ui";

type Tab = "waiting" | "held" | "approved" | "done" | "failed";

const TABS: readonly { key: Tab; label: string; statuses: readonly ActionStatus[]; empty: string }[] = [
  { key: "waiting", label: "Waiting", statuses: ["draft", "pending"], empty: "Nothing waiting on you. Ask the desk for a draft, or write one below." },
  { key: "held", label: "Held", statuses: ["held"], empty: "Nothing held. Drafts that fail a check wait here with their fix." },
  { key: "approved", label: "Approved", statuses: ["approved", "running"], empty: "No messages waiting for your tap." },
  { key: "done", label: "Done", statuses: ["done", "rejected"], empty: "Nothing has run yet." },
  { key: "failed", label: "Failed", statuses: ["failed", "unknown"], empty: "Nothing failed, and nothing needs checking." },
];

/** Vermilion only for the founder's decisions; saffron for what an LLM or agent wrote; bone for everything code did. */
function dotFor(e: { actor: string; what: string }): string {
  if (/^(Approved|Rejected|Sent|Confirmed)/.test(e.what)) return MEANING.human;
  if (e.actor === "agent" || e.what.startsWith("Drafted")) return MEANING.write;
  return MEANING.code;
}

const tabOf = (status: ActionStatus): Tab => TABS.find((t) => t.statuses.includes(status))?.key ?? "waiting";

interface Props {
  initial: DeskData;
  workspaces: { id: string; name: string }[];
  canCreate: boolean;
  flash: { tone: "ok" | "error"; text: string } | null;
}

export function BetaDesk({ initial, workspaces, canCreate, flash: initialFlash }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [flash, setFlash] = useState(initialFlash);
  const ws = data.workspace;

  const groups = useMemo(() => {
    const g: Record<Tab, ActionView[]> = { waiting: [], held: [], approved: [], done: [], failed: [] };
    for (const a of data.actions) g[tabOf(a.status)].push(a);
    return g;
  }, [data.actions]);

  const [tab, setTab] = useState<Tab>(() => (["waiting", "approved", "failed", "held"] as const).find((t) => groups[t].length) ?? "waiting");

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/beta/workspaces/${encodeURIComponent(ws.id)}`, { cache: "no-store" }).catch(() => null);
    if (!res) return;
    if (res.status === 401) {
      router.push("/beta");
      return;
    }
    if (res.ok) setData((await res.json()) as DeskData);
  }, [ws.id, router]);

  // Telegram decisions and agent drafts arrive from elsewhere: poll while the tab is visible.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const t = setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  // A link like /beta/desk#act_… (from Telegram) opens the right tab.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    const a = id ? initial.actions.find((x) => x.id === id) : undefined;
    if (!a) return;
    setTab(tabOf(a.status));
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  }, [initial.actions]);

  const showError = (text: string) => setFlash({ tone: "error", text });

  const onOp = async (id: string, op: Op, extra: OpExtra = {}): Promise<boolean> => {
    try {
      const { action } = await post<{ action: ActionView }>(`/api/beta/actions/${encodeURIComponent(id)}`, { op, ...extra });
      setData((d) => ({ ...d, actions: d.actions.map((a) => (a.id === id ? action : a)) }));
      setFlash(null);
      void refresh();
      return true;
    } catch (e) {
      // A 409 means the text changed since it was shown (an agent edit, another device): show the new version.
      showError(e instanceof Error ? e.message : "Something went wrong.");
      void refresh();
      return false;
    }
  };

  const added = (action: ActionView, how: string) => {
    setData((d) => ({ ...d, actions: [action, ...d.actions] }));
    const where = tabOf(action.status);
    setTab(where);
    setFlash({ tone: "ok", text: `${how}: ${channelLabel(action.channel)}. ${where === "held" ? "Checks are holding it; see the fix." : "It's in Waiting."}` });
    void refresh();
  };

  async function signOut() {
    await post("/api/beta/signout").catch(() => undefined);
    router.push("/beta");
    router.refresh();
  }

  const template = ws.generatedBy === "template";

  return (
    <div className="wrap pb-24 pt-24 md:pt-28">
      {/* 1. Header */}
      <header>
        <div className="flex items-center justify-between gap-3">
          <p className="label flex items-center gap-3">
            <span className="dot" style={{ background: MEANING.human }} aria-hidden="true" />
            Private beta · Desk
          </p>
          <button type="button" onClick={() => void signOut()} className="inline-flex min-h-11 items-center font-mono text-[12.5px] text-dim underline decoration-line-2 underline-offset-4 hover:text-fg">
            Sign out
          </button>
        </div>
        <h1 className="mt-1 break-words text-[clamp(34px,5.5vw,64px)] font-semibold leading-[0.95] tracking-[-0.045em]">{ws.name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[12.5px] text-faint">
          <span className="flex items-center gap-2">
            <span className="dot" style={{ background: MEANING.write }} aria-hidden="true" />
            Plan by {template ? "our templates" : ws.generatedBy}
          </span>
          {workspaces.length > 1 ? (
            <label className="flex items-center gap-2">
              <span>Workspace</span>
              <select className="field h-11 w-auto py-0 text-[14px]" value={ws.id} onChange={(e) => router.push(`/beta/desk?ws=${encodeURIComponent(e.target.value)}`)}>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {canCreate ? (
            <Link href="/beta/new" className="inline-flex min-h-11 items-center text-dim underline decoration-line-2 underline-offset-4 hover:text-fg">
              New workspace
            </Link>
          ) : null}
        </div>
        {template ? (
          <p className="mt-2 max-w-2xl text-base text-dim">This plan uses our templates. With a model on this deployment, plans and drafts are written for your product.</p>
        ) : null}
      </header>

      {flash ? (
        <div
          role={flash.tone === "error" ? "alert" : "status"}
          className={`mt-6 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-base ${flash.tone === "error" ? "border-human/50" : "border-line-2"}`}
        >
          <p>{flash.text}</p>
          <button type="button" className="-my-2 inline-flex min-h-11 min-w-11 items-center justify-center font-mono text-[12px] text-dim hover:text-fg" onClick={() => setFlash(null)} aria-label="Dismiss">
            Close
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-10 lg:col-span-7">
          {/* 2. Ask the desk */}
          <AskDesk wsId={ws.id} enabled={data.connections.drafter} onAdded={(a) => added(a, "Drafted")} onError={showError} />

          {/* 3. The queue */}
          <Section id="queue" label="The queue" title="Waiting on you">
            <div role="tablist" aria-label="Queue" className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  aria-controls="queue-panel"
                  onClick={() => setTab(t.key)}
                  className={`chip h-11 cursor-pointer px-4 text-[13px] ${tab === t.key ? "!border-fg !text-fg" : ""}`}
                >
                  {t.label}
                  <span className={groups[t.key].length && t.key !== "done" ? "text-fg" : "text-faint"}>{groups[t.key].length}</span>
                </button>
              ))}
            </div>
            <div id="queue-panel" role="tabpanel" className="mt-4 space-y-4">
              {groups[tab].length ? (
                groups[tab].map((a) => <ActionCard key={a.id} action={a} ws={ws} telegramLinked={Boolean(ws.telegram)} runs={data.connections.runs} onOp={onOp} />)
              ) : (
                <p className="rounded-2xl border border-dashed border-line-2 px-5 py-6 text-base text-dim">{TABS.find((t) => t.key === tab)?.empty}</p>
              )}
            </div>
          </Section>

          <Composer data={data} onAdded={(a) => added(a, "Added")} onError={showError} />
        </div>

        <aside className="space-y-10 lg:col-span-5">
          {/* 4. Connections */}
          <Section id="connections" label="Connections" title="Where approved work goes">
            <Connections data={data} onChange={refresh} onError={showError} />
          </Section>

          {/* 5. The plan */}
          <Section id="plan" label="The plan" title="Positioning">
            <div className="card p-5 md:p-6">
              <p className="text-[19px] font-medium leading-snug tracking-[-0.01em]">{ws.plan.positioning.oneLiner}</p>
              <p className="mt-4 font-mono text-xs text-faint">WHO TO SELL TO</p>
              <p className="mt-1 text-base leading-relaxed text-dim">{ws.plan.icp.summary}</p>
              <details className="group mt-5 border-t border-line pt-2">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-mono text-[13px] text-fg">
                  The 7-day sprint
                  <span className="text-faint group-open:hidden">Show</span>
                  <span className="hidden text-faint group-open:inline">Hide</span>
                </summary>
                <ol className="mt-2 space-y-4">
                  {ws.plan.sprint.map((d) => (
                    <li key={d.day} className="grid grid-cols-[52px_1fr] gap-2">
                      <span className="font-mono text-[12px] text-faint">DAY {d.day}</span>
                      <div>
                        <p className="text-base font-medium">{d.focus}</p>
                        <ul className="mt-1 space-y-1 text-[15px] text-dim">
                          {d.tasks.map((t) => (
                            <li key={t}>· {t}</li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          </Section>

          {/* 6. Activity */}
          <Section id="activity" label="Activity" title="What happened">
            {data.events.length ? (
              <ol className="card divide-y divide-line">
                {data.events.map((e, i) => (
                  <li key={`${e.at}-${i}`} className="grid grid-cols-[14px_1fr] gap-3 px-5 py-3">
                    <span className="dot mt-2" style={{ background: dotFor(e) }} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="break-words text-[15px]">{e.what}</p>
                      <p className="mt-0.5 font-mono text-[11.5px] text-faint">
                        {when(e.at)} · {e.actor === "founder" ? "you" : e.actor}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-base text-dim">Nothing yet.</p>
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}

function AskDesk({ wsId, enabled, onAdded, onError }: { wsId: string; enabled: boolean; onAdded: (a: ActionView) => void; onError: (m: string) => void }) {
  const [request, setRequest] = useState("");
  const [channel, setChannel] = useState<Channel | "">("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      const { action } = await post<{ action: ActionView }>("/api/beta/draft", { workspaceId: wsId, request, ...(channel ? { channel } : {}) });
      setRequest("");
      onAdded(action);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Section id="ask" label="Ask the desk">
      <form
        className="card space-y-3 p-5 md:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor="ask-input" className="block text-[17px] font-medium">
          What do you need drafted?
        </label>
        <input
          id="ask-input"
          className={`${fieldBase} h-12`}
          placeholder="A post about Friday's demo"
          maxLength={1000}
          minLength={3}
          required
          disabled={!enabled}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
        />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-48">
            <label htmlFor="ask-channel" className="mb-2 block font-mono text-xs text-dim">
              Channel
            </label>
            <select id="ask-channel" className={`${fieldBase} h-12`} disabled={!enabled} value={channel} onChange={(e) => setChannel(e.target.value as Channel | "")}>
              <option value="">Let the desk pick</option>
              {CHANNEL_OPTIONS.filter((o) => o.value !== "other").map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={`${btnSolid} h-12 w-full sm:w-auto`} disabled={!enabled || pending}>
            {pending ? "Drafting…" : "Draft it"}
          </button>
        </div>
        <p className="font-mono text-[12px] leading-relaxed text-faint">
          {enabled ? 'Or "a WhatsApp to Ada about the pilot". The LLM writes it, code checks it, the reviewer reads it; you approve it.' : "Drafting by request needs a model on this deployment. Write one by hand below."}
        </p>
      </form>
    </Section>
  );
}

function Composer({ data, onAdded, onError }: { data: DeskData; onAdded: (a: ActionView) => void; onError: (m: string) => void }) {
  const ws = data.workspace;
  const [channel, setChannel] = useState<Channel>("x");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const option = CHANNEL_OPTIONS.find((o) => o.value === channel)!;
  const targets = ws.telegramTargets;
  const count = [...text].length;

  async function submit() {
    setPending(true);
    try {
      const { action } = await post<{ action: ActionView }>("/api/beta/actions", {
        workspaceId: ws.id,
        channel,
        text,
        ...(to.trim() ? { to: to.trim() } : {}),
        ...(channel === "email" && subject.trim() ? { subject: subject.trim() } : {}),
      });
      setText("");
      setTo(channel === "telegram_post" ? to : "");
      setSubject("");
      onAdded(action);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Section id="compose" label="Write one yourself">
      <form
        className="card space-y-4 p-5 md:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Channel" id="compose-channel">
          <select
            id="compose-channel"
            className={`${fieldBase} h-12`}
            value={channel}
            onChange={(e) => {
              const next = e.target.value as Channel;
              setChannel(next);
              setTo(next === "telegram_post" ? String(targets[0]?.chatId ?? "") : "");
            }}
          >
            {CHANNEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
                {o.person ? " (you send it)" : " (posts on approval)"}
              </option>
            ))}
          </select>
        </Field>
        {channel === "telegram_post" ? (
          targets.length ? (
            <Field label="Group or channel" id="compose-target">
              <select id="compose-target" className={`${fieldBase} h-12`} value={to} onChange={(e) => setTo(e.target.value)}>
                {targets.map((t) => (
                  <option key={t.chatId} value={String(t.chatId)}>
                    {t.title}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <p className="text-base text-dim">Add the bot to a Telegram group or channel as an admin first (see Connections).</p>
          )
        ) : null}
        {option.person ? (
          <Field label={channel === "email" ? "To (email)" : channel === "whatsapp" ? "To (phone number with country code)" : "To (optional: @handle or name)"} id="compose-to">
            <input
              id="compose-to"
              className={`${fieldBase} h-12`}
              maxLength={200}
              inputMode={channel === "whatsapp" ? "tel" : channel === "email" ? "email" : "text"}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        ) : null}
        {channel === "email" ? (
          <Field label="Subject" id="compose-subject">
            <input id="compose-subject" className={`${fieldBase} h-12`} maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
        ) : null}
        <Field label="Message" id="compose-text">
          <textarea id="compose-text" className={`${fieldBase} min-h-36 resize-y leading-relaxed`} required maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`font-mono text-[12px] ${channel === "x" && count > 280 ? "text-human" : "text-faint"}`}>
            {count}
            {channel === "x" ? " / 280" : ""} characters · code checks it when you add it
          </p>
          <button type="submit" className={`${btnSolid} w-full sm:w-auto`} disabled={pending || !text.trim() || (channel === "telegram_post" && !to)}>
            {pending ? "Adding…" : "Add to the queue"}
          </button>
        </div>
      </form>
    </Section>
  );
}
