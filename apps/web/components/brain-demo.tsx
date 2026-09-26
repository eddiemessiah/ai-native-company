"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DEMO_EXAMPLES } from "@/lib/demo-examples";
import { Arrow } from "./bits";

type Choice = { type: "choice"; choice: string; probabilities: Record<string, number>; confidence: number };
type Score = { type: "score"; score: number; confidence: number };
type Noul = { type: "noul"; noul: number };

interface DemoResponse {
  route: { offer: string; offerConfidence: number; priority: string; next: string; reasons: string[] };
  decision: {
    provider: string;
    model: string;
    calibrated: boolean;
    latencyMs: number;
    costUsd: number;
    answers: { offer: Choice; urgency: Score; budget: Score; decision_maker: Noul; spam: Noul };
    diagnostics: { code: string; message: string }[];
  };
}

const NEXT_LABEL: Record<string, string> = {
  book_call: "Book a call today",
  send_intake: "Send the intake form",
  nurture: "Add to the newsletter",
  human_review: "A person reads it",
  discard: "Discard",
};

export function BrainDemo({ names }: { names: Record<string, string> }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(message: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/route", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Request failed");
      setResult(body as DemoResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const top = result
    ? Object.entries(result.decision.answers.offer.probabilities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
    : [];

  return (
    <div className="card overflow-hidden !bg-bg shadow-[0_40px_120px_-40px_rgb(0_0_0/0.6)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="label flex items-center gap-2 !text-dim">
          <span className="dot live-dot" /> The brain, live
        </p>
        <p className="hidden font-mono text-[11px] text-faint sm:block">lead.route · 5 typed questions · 1 call</p>
      </div>
      <form
        className="p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim().length >= 8) void run(text);
        }}
      >
        <label htmlFor="demo-input" className="sr-only">
          Describe what you need
        </label>
        <textarea
          id="demo-input"
          className="field min-h-[92px] resize-none leading-relaxed"
          placeholder="Tell us what you need done. Watch the brain route it."
          value={text}
          maxLength={1200}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_EXAMPLES.slice(0, 3).map(({ message: ex }) => (
            <button
              key={ex}
              type="button"
              className="chip cursor-pointer transition-colors hover:border-fg hover:text-fg"
              onClick={() => {
                setText(ex);
                void run(ex);
              }}
            >
              {ex.slice(0, 34)}…
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading || text.trim().length < 8}
          className="btn btn-solid mt-4 w-full justify-center disabled:cursor-not-allowed disabled:!border-line-2 disabled:!bg-transparent disabled:!text-faint"
        >
          {loading ? "Deciding…" : "Route it"}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-line px-5 py-4 font-mono text-sm text-human">
            {error}
          </motion.p>
        ) : result ? (
          <motion.div
            key={result.decision.latencyMs + result.route.offer}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-line px-5 py-5"
          >
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-faint">
              <span className="chip h-6 text-[11px]" style={{ borderColor: "var(--decide)", color: "var(--decide)" }}>
                {result.decision.provider}
              </span>
              <span>{result.decision.model}</span>
              <span>· {result.decision.latencyMs}ms</span>
              <span>· ${result.decision.costUsd.toFixed(6)}</span>
              {!result.decision.calibrated && <span>· uncalibrated</span>}
            </div>

            <p className="label mt-5">choice · which offer fits</p>
            <ul className="mt-3 space-y-2.5">
              {top.map(([slug, p]) => (
                <li key={slug}>
                  <div className="flex justify-between font-mono text-[12px]">
                    <span className={slug === result.route.offer ? "text-fg" : "text-dim"}>{names[slug] ?? slug}</span>
                    <span className="text-dim">{p.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-3">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: slug === result.route.offer ? "var(--decide)" : "var(--faint)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, p * 100)}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-5 grid grid-cols-2 gap-3 font-mono text-[12px]">
              <Meter label="score · urgency" value={result.decision.answers.urgency.score} max={2} />
              <Meter label="score · budget" value={result.decision.answers.budget.score} max={2} />
              <div className="rounded-xl border border-line p-3">
                <dt className="text-faint">noul · decision maker</dt>
                <dd className="mt-1 text-lg text-fg">{result.decision.answers.decision_maker.noul.toFixed(2)}</dd>
              </div>
              <div className="rounded-xl border border-line p-3">
                <dt className="text-faint">noul · spam</dt>
                <dd className="mt-1 text-lg text-fg">{result.decision.answers.spam.noul.toFixed(2)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-2 p-3.5">
              <div className="font-mono text-[12px]">
                <span className="text-faint">code → </span>
                <span className="text-fg">
                  {result.route.priority} · {NEXT_LABEL[result.route.next] ?? result.route.next}
                </span>
              </div>
              {result.route.offer !== "other" && result.route.next !== "discard" ? (
                <Link
                  href={`/start?offer=${encodeURIComponent(result.route.offer)}&m=${encodeURIComponent(text.slice(0, 600))}`}
                  className="flex items-center gap-1.5 font-mono text-[12px] text-write hover:underline"
                >
                  Start this job <Arrow />
                </Link>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Meter({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <dt className="text-faint">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1.5">
        <span className="text-lg text-fg">{value.toFixed(2)}</span>
        <span className="text-faint">/ {max}</span>
      </dd>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: max + 1 }, (_, i) => (
          <span key={i} className="h-1 flex-1 rounded-full" style={{ background: value >= i - 0.25 ? "var(--decide)" : "var(--bg-3)" }} />
        ))}
      </div>
    </div>
  );
}
