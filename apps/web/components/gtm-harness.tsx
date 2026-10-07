// SPDX-License-Identifier: MIT
// GTM Harness. Copyright (c) 2026 Edidiong Umana; licence text in packages/gtm-harness/LICENSE.

"use client";

import { CHANNEL_LABELS, CHANNELS, STAGE_LABELS, STAGES, type Channel, type Stage } from "@repo/gtm-harness/input";
import { zipHarness } from "@repo/gtm-harness/zip";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./bits";

type Verdict = "ready" | "revise" | "blocked";
interface Review {
  verdict: Verdict;
  fixes: string[];
  provider: string;
  calibrated: boolean;
}
interface Plan {
  positioning: { oneLiner: string; forWho: string; problem: string; whyNow: string; proofToShow: string[] };
  icp: { summary: string; criteria: { name: string; weight: number; lookFor: string }[]; disqualifiers: string[] };
  sources: { channel: string; where: string; howToFind: string; firstStep: string }[];
  drafts: { channel: string; audience: string; text: string }[];
  sprint: { day: number; focus: string; tasks: string[] }[];
  metrics: { name: string; target: string; why: string }[];
  risks: string[];
}
interface RunResult {
  plan: Plan;
  generatedBy: { kind: "model" | "template"; model?: string };
  reviews: (Review | null)[];
  files: Record<string, string>;
  note?: string;
}

interface Form {
  product: string;
  pitch: string;
  url: string;
  audience: string;
  stage: Stage;
  goal: string;
  channels: Channel[];
  regions: string;
  onchain: boolean;
  email: string;
}

const EMPTY: Form = { product: "", pitch: "", url: "", audience: "", stage: "building", goal: "", channels: ["x"], regions: "", onchain: false, email: "" };

const EXAMPLE: Form = {
  product: "Ajo Circle",
  pitch: "Rotating savings groups on MiniPay, with automatic payouts in stablecoins.",
  url: "",
  audience: "Market traders and savings-group leaders in Lagos",
  stage: "live",
  goal: "100 active savers by the end of October",
  channels: ["whatsapp", "x", "communities"],
  regions: "Nigeria",
  onchain: true,
  email: "",
};

const STEPS: readonly { kind: keyof typeof COLOR; text: string }[] = [
  { kind: "write", text: "Reading your product" },
  { kind: "write", text: "Writing your ideal-customer scorecard" },
  { kind: "write", text: "Finding where they already gather" },
  { kind: "write", text: "Drafting three first messages" },
  { kind: "decide", text: "Reviewing every draft: it can block, never send" },
  { kind: "code", text: "Packing your harness folder" },
];

const COLOR = { write: "var(--write)", decide: "var(--decide)", code: "var(--code)", human: "var(--human)" } as const;

const VERDICT: Record<Verdict, { label: string; tone: string }> = {
  ready: { label: "Ready to send", tone: "!border-live/40 !text-live" },
  revise: { label: "Revise first", tone: "!border-write/40 !text-write" },
  blocked: { label: "Blocked", tone: "!border-human/40 !text-human" },
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";

export function GtmHarness() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2600);
    return () => clearInterval(t);
  }, [pending]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleChannel = (c: Channel) =>
    setForm((f) => {
      const on = f.channels.includes(c);
      const channels = on ? f.channels.filter((x) => x !== c) : [...f.channels, c];
      return { ...f, channels: channels.length ? channels : f.channels };
    });

  async function run() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/gtm/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setResult(body as RunResult);
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  function download() {
    if (!result) return;
    const bytes = zipHarness(result.files);
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `gtm-harness-${slugify(form.product)}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-16">
      <form
        className="card grid gap-6 p-6 md:grid-cols-2 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
          <p className="label">Your product</p>
          <button type="button" className="chip h-8 cursor-pointer hover:border-fg hover:text-fg" onClick={() => setForm(EXAMPLE)}>
            Fill an example
          </button>
        </div>
        <Field label="Product name" htmlFor="product">
          <input id="product" className="field" required minLength={2} maxLength={80} value={form.product} onChange={(e) => set("product", e.target.value)} />
        </Field>
        <Field label="Website (optional)" htmlFor="url">
          <input id="url" className="field" type="url" placeholder="https://" value={form.url} onChange={(e) => set("url", e.target.value)} />
        </Field>
        <Field label="What it does, in a sentence or two" htmlFor="pitch" wide>
          <textarea id="pitch" className="field min-h-24 resize-y" required minLength={10} maxLength={600} value={form.pitch} onChange={(e) => set("pitch", e.target.value)} />
        </Field>
        <Field label="Who it's for" htmlFor="audience" wide>
          <input
            id="audience"
            className="field"
            required
            minLength={5}
            maxLength={400}
            placeholder="e.g. Market traders and savings-group leaders in Lagos"
            value={form.audience}
            onChange={(e) => set("audience", e.target.value)}
          />
        </Field>
        <Field label="Your goal for the next 30 days" htmlFor="goal">
          <input id="goal" className="field" required minLength={5} maxLength={200} placeholder="e.g. 100 active users" value={form.goal} onChange={(e) => set("goal", e.target.value)} />
        </Field>
        <Field label="Regions (optional)" htmlFor="regions">
          <input id="regions" className="field" maxLength={120} placeholder="e.g. Nigeria, Kenya, online" value={form.regions} onChange={(e) => set("regions", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <p className="mb-2 font-mono text-xs text-dim">Stage</p>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <button key={s} type="button" onClick={() => set("stage", s)} className={`chip h-9 cursor-pointer ${form.stage === s ? "!border-fg !text-fg" : ""}`}>
                {STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="mb-2 font-mono text-xs text-dim">Channels you can use</p>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={form.channels.includes(c)}
                onClick={() => toggleChannel(c)}
                className={`chip h-9 cursor-pointer ${form.channels.includes(c) ? "!border-decide !text-fg" : ""}`}
              >
                {CHANNEL_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm text-dim md:col-span-2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--decide)]" checked={form.onchain} onChange={(e) => set("onchain", e.target.checked)} />
          Built on Celo or MiniPay (adds ecosystem channels)
        </label>
        <Field label="Email (optional): harness updates only, no sales emails" htmlFor="email" wide>
          <input id="email" type="email" className="field" maxLength={200} value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <button type="submit" disabled={pending} className="btn btn-solid h-12 px-6 disabled:opacity-60">
            {pending ? "Building your harness…" : "Build my harness"} <Arrow />
          </button>
          <p className="font-mono text-[12px] text-faint">About a minute. Nothing is sent anywhere on your behalf.</p>
        </div>
        {error ? <p className="text-sm text-human md:col-span-2">{error}</p> : null}
      </form>

      <AnimatePresence>
        {pending ? (
          <motion.ol initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card space-y-3 p-6 font-mono text-[13px]">
            {STEPS.map((s, i) => (
              <li key={s.text} className={`flex items-center gap-3 transition-opacity ${i <= step ? "opacity-100" : "opacity-30"}`}>
                <span className={`dot h-2.5 w-2.5 ${i === step ? "live-dot" : ""}`} style={{ background: COLOR[s.kind] }} />
                {s.text}
                {i < step ? <span className="text-faint">done</span> : null}
              </li>
            ))}
          </motion.ol>
        ) : null}
      </AnimatePresence>

      {result ? <Results result={result} product={form.product} onDownload={download} innerRef={resultsRef} /> : null}
    </div>
  );
}

function Results({ result, product, onDownload, innerRef }: { result: RunResult; product: string; onDownload: () => void; innerRef: React.RefObject<HTMLDivElement | null> }) {
  const { plan, reviews } = result;
  const total = plan.icp.criteria.reduce((s, c) => s + c.weight, 0);
  return (
    <motion.div ref={innerRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="scroll-mt-24 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label">Your harness</p>
          <h2 className="mt-3 text-[clamp(32px,4vw,56px)] font-semibold leading-none tracking-[-0.04em]">{product}</h2>
          <p className="mt-3 font-mono text-[12px] text-faint">
            {result.generatedBy.kind === "model" ? `Plan written by ${result.generatedBy.model}` : "Template plan"} · drafts reviewed by{" "}
            {reviews.find(Boolean)?.provider ?? "no reviewer"}
          </p>
          {result.note ? <p className="mt-2 max-w-xl text-sm text-dim">{result.note}</p> : null}
        </div>
        <button type="button" onClick={onDownload} className="btn btn-solid h-12 px-6">
          Download the harness (.zip) <Arrow />
        </button>
      </div>

      <section className="card p-7">
        <p className="label">Positioning</p>
        <p className="mt-4 text-[clamp(20px,2vw,26px)] font-medium leading-snug tracking-[-0.02em]">{plan.positioning.oneLiner}</p>
        <dl className="mt-6 grid gap-5 text-[15px] md:grid-cols-3">
          <Def k="For" v={plan.positioning.forWho} />
          <Def k="The problem" v={plan.positioning.problem} />
          <Def k="Why now" v={plan.positioning.whyNow} />
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-7">
          <p className="label">Ideal-customer scorecard</p>
          <p className="mt-3 text-sm text-dim">{plan.icp.summary}</p>
          <table className="mt-5 w-full text-left text-sm">
            <thead className="font-mono text-[11px] text-faint">
              <tr>
                <th className="pb-2 font-normal">CRITERION</th>
                <th className="pb-2 font-normal">WEIGHT</th>
                <th className="pb-2 font-normal">LOOK FOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {plan.icp.criteria.map((c) => (
                <tr key={c.name}>
                  <td className="py-2.5 pr-3 font-medium">{c.name}</td>
                  <td className="py-2.5 pr-3 font-mono text-decide">{c.weight}</td>
                  <td className="py-2.5 text-dim">{c.lookFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 font-mono text-[11.5px] text-faint">Score = weights met / {total}. 80%+ reach out · 60–80% nurture · under 60% skip.</p>
        </section>

        <section className="card p-7">
          <p className="label">Where they already are</p>
          <ol className="mt-5 space-y-4">
            {plan.sources.map((s, i) => (
              <li key={`${s.channel}-${i}`} className="grid grid-cols-[28px_1fr] gap-2 text-sm">
                <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium">
                    {s.channel} <span className="text-dim">· {s.where}</span>
                  </p>
                  <p className="mt-1 text-dim">{s.howToFind}</p>
                  <p className="mt-1 text-write">First step: {s.firstStep}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section>
        <p className="label">First messages · the reviewer can block, never send</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {plan.drafts.map((d, i) => {
            const r = reviews[i];
            return (
              <article key={`${d.channel}-${i}`} className="card flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-xs text-faint">
                    {d.channel.toUpperCase()} · {d.audience}
                  </p>
                  {r ? <span className={`chip h-7 shrink-0 font-mono text-[11px] ${VERDICT[r.verdict].tone}`}>{VERDICT[r.verdict].label}</span> : null}
                </div>
                <p className="mt-4 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed">{d.text}</p>
                {r?.fixes.length ? (
                  <ul className="mt-4 space-y-1 border-t border-line pt-3 text-[13px] text-dim">
                    {r.fixes.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                ) : null}
                <button type="button" className="mt-4 self-start font-mono text-[12px] text-dim hover:text-fg" onClick={() => void navigator.clipboard?.writeText(d.text)}>
                  Copy
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <p className="label">Your 7-day sprint</p>
        <ol className="mt-5 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-7">
          {plan.sprint.map((d) => (
            <li key={d.day} className="bg-bg p-5">
              <p className="font-mono text-xs text-faint">DAY {d.day}</p>
              <p className="mt-3 font-medium">{d.focus}</p>
              <ul className="mt-3 space-y-2 text-[13px] text-dim">
                {d.tasks.map((t) => (
                  <li key={t}>□ {t}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="card p-7 lg:col-span-7">
          <p className="label">Monday dashboard</p>
          <ul className="mt-5 divide-y divide-line text-sm">
            {plan.metrics.map((m) => (
              <li key={m.name} className="grid grid-cols-[1fr_auto] gap-4 py-3">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="mt-0.5 text-dim">{m.why}</p>
                </div>
                <p className="font-mono text-decide">{m.target}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-7 lg:col-span-5">
          <p className="label">Keep it running with your agent</p>
          <pre className="mt-5 overflow-x-auto rounded-2xl border border-line bg-bg-2 p-5 font-mono text-[12.5px] leading-relaxed text-dim">
            <code>
              {`unzip gtm-harness-${slugify(product)}.zip
cd gtm-harness
claude    # or any agent that reads AGENTS.md
> Read AGENTS.md and run today's tasks in sprint.md`}
            </code>
          </pre>
          <p className="mt-4 text-sm text-dim">
            Your agents research, source, score, draft and review. You approve and send, and log every edit in corrections-log.md. Each Monday, repeated edits become rules.
          </p>
        </section>
      </div>
    </motion.div>
  );
}

function Field({ label, htmlFor, wide, children }: { label: string; htmlFor: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label htmlFor={htmlFor} className="mb-2 block font-mono text-xs text-dim">
        {label}
      </label>
      {children}
    </div>
  );
}

function Def({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="font-mono text-xs text-faint">{k.toUpperCase()}</dt>
      <dd className="mt-1.5 text-dim">{v}</dd>
    </div>
  );
}
