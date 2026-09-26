const LINES: readonly { kind: "write" | "decide" | "code" | "human"; text: string }[] = [
  { kind: "decide", text: "lead.route → grant-desk · 0.91 · 184ms" },
  { kind: "code", text: "calendar.slot 14:00 WAT ✓" },
  { kind: "decide", text: "support.triage → billing · 0.94" },
  { kind: "human", text: "approve? refund ₦12,500 → founder" },
  { kind: "write", text: "draft → audit report §3 · 1.2k tok" },
  { kind: "decide", text: "brain.triage → pass · silence is fine" },
  { kind: "code", text: "x402.settle 0.01 USDC · celo" },
  { kind: "decide", text: "study.place → T4 onchain · builder · pod africa" },
  { kind: "decide", text: "content.gate → revise · unsourced number" },
  { kind: "write", text: "draft → grant milestones v2" },
  { kind: "human", text: "approve? send proposal to client" },
  { kind: "decide", text: "turn.gate → replace · newer request wins" },
  { kind: "code", text: "budget.check agent-7 · $3.20 / $5.00 ✓" },
];

const COLOR = { write: "var(--write)", decide: "var(--decide)", code: "var(--code)", human: "var(--human)" } as const;

/** A strip of the kind of decisions the firm makes all day. Illustrative, not live data. */
export function Ticker() {
  const row = [...LINES, ...LINES];
  return (
    <div className="relative overflow-hidden border-y border-line bg-bg-2/60 py-3.5" aria-label="Examples of decisions the firm makes">
      <div className="marquee flex w-max gap-10 whitespace-nowrap font-mono text-[12.5px] text-dim">
        {row.map((l, i) => (
          <span key={i} className="flex items-center gap-2.5" aria-hidden={i >= LINES.length}>
            <span className="dot" style={{ background: COLOR[l.kind] }} />
            {l.text}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg to-transparent" />
    </div>
  );
}
