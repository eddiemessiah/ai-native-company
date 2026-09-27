import type { Offer, Status } from "@repo/catalog";

/** The four meanings colour is allowed to carry. */
export const SPLIT = [
  { key: "llm", label: "LLM writes", color: "var(--write)" },
  { key: "decide", label: "System One decides", color: "var(--decide)" },
  { key: "code", label: "Code executes", color: "var(--code)" },
] as const;

export const HUMAN = { label: "A person approves", color: "var(--human)" } as const;

export function SectionHead({
  n,
  label,
  title,
  lede,
  className = "",
}: {
  n: string;
  label: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-6 md:grid-cols-12 ${className}`}>
      <div className="md:col-span-3">
        <p className="label flex items-center gap-3">
          <span className="text-fg">{n}</span>
          <span className="h-px w-8 bg-line-2" />
          {label}
        </p>
      </div>
      <div className="md:col-span-9">
        <h2 className="text-[clamp(34px,5.2vw,72px)] font-semibold leading-[0.98]">{title}</h2>
        {lede ? <p className="mt-6 max-w-2xl text-lg text-dim">{lede}</p> : null}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const text = status === "live" ? "Live" : status === "beta" ? "Beta" : "Soon";
  const color = status === "live" ? "var(--live)" : status === "beta" ? "var(--write)" : "var(--faint)";
  return (
    <span className="chip h-6 gap-1.5 px-2.5 text-[11px]">
      <span className={`dot ${status === "live" ? "live-dot" : ""}`} style={{ background: color }} />
      {text}
    </span>
  );
}

export function SplitBar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1 gap-1 ${className}`} aria-hidden="true">
      {SPLIT.map((s) => (
        <span key={s.key} className="flex-1 rounded-full" style={{ background: s.color, opacity: s.key === "code" ? 0.55 : 0.9 }} />
      ))}
      <span className="w-3 rounded-full" style={{ background: HUMAN.color }} />
    </div>
  );
}

export function SplitRows({ split }: { split: Offer["split"] }) {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {SPLIT.map((s) => (
        <div key={s.key} className="grid grid-cols-[150px_1fr] gap-4 py-3.5 sm:grid-cols-[190px_1fr]">
          <dt className="flex items-center gap-2.5 font-mono text-xs text-dim">
            <span className="dot" style={{ background: s.color }} />
            {s.label}
          </dt>
          <dd className="text-[15px]">{split[s.key]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Legend({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11.5px] text-dim ${className}`}>
      {[...SPLIT, HUMAN].map((s) => (
        <li key={s.label} className="flex items-center gap-2">
          <span className="dot" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

export function Arrow({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
