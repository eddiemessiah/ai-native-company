"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Arrow } from "./bits";

interface Placement {
  track: string;
  band: string;
  format: "self_paced" | "pod" | "cohort";
  pod: string;
  needsHuman: boolean;
  notes: string[];
}

const TRACK: Record<string, string> = {
  t1: "T1 · Agentic AI engineer roadmap",
  t2: "T2 · Ethical AI in Africa",
  t3: "T3 · Inference engineering basics",
  t4: "T4 · Onchain agents on Celo",
  unsure: "A short call to pick your track",
};

const FORMAT: Record<Placement["format"], string> = {
  self_paced: "Self-paced, free",
  pod: "A weekly study pod of 5–8",
  cohort: "The next live cohort",
};

export function StudyApply({ academyUrl }: { academyUrl: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement | null | undefined>(undefined);
  const [tz, setTz] = useState("Africa/Lagos");

  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos");
    } catch {
      // keep the default
    }
  }, []);

  async function submit(form: HTMLFormElement) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/study/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setPlacement(body.placement as Placement | null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  if (placement !== undefined) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
        <p className="label flex items-center gap-2">
          <span className="dot live-dot" /> You&apos;re in
        </p>
        {placement ? (
          <>
            <h3 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">{TRACK[placement.track] ?? placement.track}</h3>
            <dl className="mt-6 grid gap-4 font-mono text-[13px] sm:grid-cols-3">
              <div>
                <dt className="text-faint">LEVEL</dt>
                <dd className="mt-1 capitalize">{placement.band}</dd>
              </div>
              <div>
                <dt className="text-faint">FORMAT</dt>
                <dd className="mt-1">{FORMAT[placement.format]}</dd>
              </div>
              <div>
                <dt className="text-faint">POD</dt>
                <dd className="mt-1">{placement.pod}</dd>
              </div>
            </dl>
          </>
        ) : (
          <h3 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">A mentor will place you personally.</h3>
        )}
        <p className="mt-6 text-dim">We&apos;ll message you within two days with your pod and first session. Start the first lessons now:</p>
        <a href={academyUrl} target="_blank" rel="noreferrer" className="btn btn-solid mt-6">
          Open the academy <Arrow />
        </a>
      </motion.div>
    );
  }

  return (
    <form
      className="card grid gap-5 p-6 md:grid-cols-2 md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(e.currentTarget);
      }}
    >
      <Input name="name" label="Name" required />
      <Input name="contact" label="Email, WhatsApp or Telegram" required />
      <Input name="city" label="City" placeholder="Lagos, Accra, London…" />
      <div>
        <label htmlFor="timezone" className="mb-2 block font-mono text-[12px] text-dim">
          Timezone
        </label>
        <input id="timezone" name="timezone" className="field" value={tz} onChange={(e) => setTz(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="background" className="mb-2 block font-mono text-[12px] text-dim">
          Where are you now? What have you built?
        </label>
        <textarea id="background" name="background" required minLength={10} rows={3} className="field resize-y" placeholder="e.g. Final-year CS student, built two Next.js apps, used ChatGPT but never an API" />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="goal" className="mb-2 block font-mono text-[12px] text-dim">
          What do you want to be able to do in 3 months?
        </label>
        <textarea id="goal" name="goal" required minLength={5} rows={3} className="field resize-y" placeholder="e.g. Ship an agent that takes WhatsApp orders, and get paid for agent work" />
      </div>
      <div>
        <label htmlFor="hours" className="mb-2 block font-mono text-[12px] text-dim">
          Hours per week
        </label>
        <select id="hours" name="hours" className="field" defaultValue="">
          <option value="">Choose one</option>
          <option>Under 2 hours a week</option>
          <option>2 to 5 hours a week</option>
          <option>5 to 10 hours a week</option>
          <option>More than 10 hours a week</option>
        </select>
      </div>
      <label className="flex items-center gap-3 self-end pb-3 text-[15px] text-dim">
        <input type="checkbox" name="live" className="h-4 w-4 accent-[var(--decide)]" />I want live sessions or a study pod
      </label>
      <div className="hidden" aria-hidden="true">
        <input name="company_url" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
        <p className="max-w-md font-mono text-[11.5px] leading-relaxed text-faint">
          The brain places you in a track, level and pod in one typed decision. A mentor checks every placement.
        </p>
        <button type="submit" disabled={pending} className="btn btn-solid h-12 justify-center px-6 disabled:opacity-50">
          {pending ? "Placing you…" : "Apply"} <Arrow />
        </button>
      </div>
      {error ? <p className="font-mono text-sm text-human md:col-span-2">{error}</p> : null}
    </form>
  );
}

function Input({ name, label, required, placeholder }: { name: string; label: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block font-mono text-[12px] text-dim">
        {label}
      </label>
      <input id={name} name={name} required={required} placeholder={placeholder} className="field" />
    </div>
  );
}
