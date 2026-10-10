"use client";

import { CHANNEL_LABELS, CHANNELS, STAGE_LABELS, STAGES, type Channel, type Stage } from "@repo/gtm-harness/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { post } from "@/lib/beta-client";
import { Arrow } from "../bits";

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
}

const EMPTY: Form = { product: "", pitch: "", url: "", audience: "", stage: "building", goal: "", channels: ["x"], regions: "", onchain: false };

const STEPS = [
  { color: "var(--write)", text: "Writing your plan and scorecard" },
  { color: "var(--write)", text: "Drafting your first three messages" },
  { color: "var(--decide)", text: "Reviewing each draft" },
  { color: "var(--code)", text: "Checking them and packing your workspace" },
];

export function BetaOnboarding() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pending) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000);
    return () => clearInterval(t);
  }, [pending]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (c: Channel) =>
    setForm((f) => {
      const channels = f.channels.includes(c) ? f.channels.filter((x) => x !== c) : [...f.channels, c];
      return { ...f, channels: channels.length ? channels : f.channels };
    });

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const { workspaceId } = await post<{ workspaceId: string; note?: string }>("/api/beta/workspaces", form);
      router.push(`/beta/desk?ws=${encodeURIComponent(workspaceId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPending(false);
    }
  }

  if (pending) {
    return (
      <div className="card p-6 md:p-8" role="status" aria-live="polite">
        <p className="text-[clamp(22px,3vw,30px)] font-medium tracking-[-0.02em]">Writing your plan… about a minute.</p>
        <ol className="mt-6 space-y-4 font-mono text-[14px]">
          {STEPS.map((s, i) => (
            <li key={s.text} className={`flex items-center gap-3 transition-opacity ${i <= step ? "opacity-100" : "opacity-30"}`}>
              <span className={`dot h-2.5 w-2.5 ${i === step ? "live-dot" : ""}`} style={{ background: s.color }} />
              {s.text}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-base text-dim">Keep this tab open. Your Desk opens when it&apos;s done.</p>
      </div>
    );
  }

  return (
    <form
      className="card grid gap-6 p-6 md:grid-cols-2 md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Field label="Product name" id="product">
        <input id="product" className="field h-12 text-base" required minLength={2} maxLength={80} value={form.product} onChange={(e) => set("product", e.target.value)} />
      </Field>
      <Field label="Website (optional)" id="url">
        <input id="url" type="url" inputMode="url" className="field h-12 text-base" placeholder="https://" maxLength={300} value={form.url} onChange={(e) => set("url", e.target.value)} />
      </Field>
      <Field label="What it does, in a sentence or two" id="pitch" wide>
        <textarea id="pitch" className="field min-h-28 resize-y text-base" required minLength={10} maxLength={600} value={form.pitch} onChange={(e) => set("pitch", e.target.value)} />
      </Field>
      <Field label="Who it's for" id="audience" wide>
        <input
          id="audience"
          className="field h-12 text-base"
          required
          minLength={5}
          maxLength={400}
          placeholder="e.g. Market traders and savings-group leaders in Lagos"
          value={form.audience}
          onChange={(e) => set("audience", e.target.value)}
        />
      </Field>
      <Field label="Your goal for the next 30 days" id="goal">
        <input id="goal" className="field h-12 text-base" required minLength={5} maxLength={200} placeholder="e.g. 100 active users" value={form.goal} onChange={(e) => set("goal", e.target.value)} />
      </Field>
      <Field label="Regions (optional)" id="regions">
        <input id="regions" className="field h-12 text-base" maxLength={120} placeholder="e.g. Nigeria, Kenya, online" value={form.regions} onChange={(e) => set("regions", e.target.value)} />
      </Field>
      <fieldset className="md:col-span-2">
        <legend className="mb-2 font-mono text-xs text-dim">Stage</legend>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button key={s} type="button" aria-pressed={form.stage === s} onClick={() => set("stage", s)} className={`chip h-11 cursor-pointer px-4 text-[13px] ${form.stage === s ? "!border-fg !text-fg" : ""}`}>
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="md:col-span-2">
        <legend className="mb-2 font-mono text-xs text-dim">Channels you can use</legend>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={form.channels.includes(c)}
              onClick={() => toggle(c)}
              className={`chip h-11 cursor-pointer px-4 text-[13px] ${form.channels.includes(c) ? "!border-fg !text-fg" : ""}`}
            >
              {CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center gap-3 text-base text-dim md:col-span-2">
        <input type="checkbox" className="h-5 w-5 accent-[var(--fg)]" checked={form.onchain} onChange={(e) => set("onchain", e.target.checked)} />
        Built on Celo, MiniPay or another chain
      </label>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button type="submit" className="btn btn-solid h-12 w-full justify-center px-6 sm:w-auto">
          Write my plan <Arrow />
        </button>
        <p className="font-mono text-[12px] text-faint">About a minute. Nothing is sent anywhere.</p>
      </div>
      {error ? (
        <p role="alert" className="text-base text-human md:col-span-2">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function Field({ label, id, wide, children }: { label: string; id: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label htmlFor={id} className="mb-2 block font-mono text-xs text-dim">
        {label}
      </label>
      {children}
    </div>
  );
}
