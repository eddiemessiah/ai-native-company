import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@repo/catalog";
import { DEFAULT_THRESHOLDS, ESCALATE_BELOW, UNCALIBRATED_PENALTY } from "@repo/brain";
import { Arrow, HUMAN, SectionHead, SPLIT } from "@/components/bits";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "How we work",
  description: "The operating principles of an AI-native firm: the split between LLMs, System One models and code; confidence gates; and what we won't do.",
};

const RISK_COPY: Record<string, { label: string; verdict: string }> = {
  read: { label: "Read-only lookups", verdict: "Executes above the bar" },
  write: { label: "Internal, reversible changes", verdict: "Executes above the bar, else a person confirms" },
  external: { label: "Messages to people", verdict: "Executes above the bar, else a person confirms" },
  money: { label: "Moves money", verdict: "Prepared only; a person approves" },
  irreversible: { label: "Can't be undone", verdict: "Prepared only; a person approves" },
};

const WONT = [
  "Let a model fire anything that moves money or can't be undone. It prepares; a person approves.",
  "Invent traction, users, partners or numbers, for us or for a client.",
  "Treat text inside a customer's data as instructions. State is data.",
  "Sell a decision without saying which model made it, its version, and how sure it was.",
  "Take paid work that conflicts with an ecosystem role: builders we support in a community role get free help, not invoices.",
  "Keep a mistake private. Every one becomes a rulebook entry.",
];

const INFLUENCES = [
  { t: "AI-native services", by: "Greg Isenberg", d: "Sell the finished work, per unit, priced against the human alternative. Build the rulebook one mistake at a time." },
  { t: "System One models", by: "TypeSafe AI · Jev", d: "Typed, calibrated decisions in one parallel pass. The smart if-statement for judgments code can't compute." },
  { t: "Agent reliability", by: "Princeton HAL", d: "Measure consistency, robustness, calibration and safety, and report accuracy per dollar." },
  { t: "The multiplayer harness", by: "Supermemory company-brain", d: "Knowing when to speak, when to check first, and when silence is the right answer." },
];

export default function CompanyPage() {
  return (
    <div className="pt-28">
      <section className="wrap pb-24">
        <p className="label">How we work</p>
        <h1 className="mt-5 max-w-6xl text-[clamp(44px,7.5vw,112px)] font-semibold leading-[0.9] tracking-[-0.055em]">
          A firm that runs <span className="serif text-dim">on</span> decisions you can inspect.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-dim">{brand.story}</p>
      </section>

      <section className="border-y border-line bg-bg-2/40">
        <div className="wrap py-24">
          <SectionHead n="01" label="The split" title={<>Four colours, <span className="serif text-dim">four</span> jobs.</>} />
          <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
            {[...SPLIT, HUMAN].map((s, i) => (
              <Reveal as="li" key={s.label} delay={i * 0.05} className="bg-bg p-7">
                <span className="block h-1.5 w-12 rounded-full" style={{ background: s.color }} />
                <p className="mt-6 text-xl font-semibold">{s.label}</p>
                <p className="mt-2 text-sm text-dim">{brand.thesis[i] ?? "Money, legal exposure and reputation always get a person."}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap py-24">
        <SectionHead
          n="02"
          label="Confidence gates"
          title={<>One bar <span className="serif text-dim">per</span> kind of risk.</>}
          lede={`Below ${ESCALATE_BELOW} confidence, a person always decides. Providers whose probabilities aren't trained against outcomes must clear every bar by an extra ${UNCALIBRATED_PENALTY}, and never execute external actions on their own.`}
        />
        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                <th className="py-3 pr-4 font-normal">Risk</th>
                <th className="py-3 pr-4 font-normal">What it covers</th>
                <th className="py-3 pr-4 font-normal">Bar</th>
                <th className="py-3 font-normal">What happens</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(DEFAULT_THRESHOLDS).map(([risk, bar]) => (
                <tr key={risk} className="border-b border-line">
                  <td className="py-4 pr-4 font-mono text-sm">{risk}</td>
                  <td className="py-4 pr-4 text-dim">{RISK_COPY[risk]?.label}</td>
                  <td className="py-4 pr-4 font-mono text-decide">{bar.toFixed(2)}</td>
                  <td className="py-4">{RISK_COPY[risk]?.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-y border-line bg-bg-2/40">
        <div className="wrap grid gap-12 py-24 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label">03 · What we won&apos;t do</p>
            <h2 className="mt-5 text-[clamp(34px,4.4vw,60px)] font-semibold leading-[0.98] tracking-[-0.045em]">
              The rules <span className="serif text-dim">under</span> the rulebooks.
            </h2>
          </div>
          <ol className="space-y-px overflow-hidden rounded-3xl border border-line bg-line lg:col-span-8">
            {WONT.map((w, i) => (
              <li key={w} className="grid grid-cols-[52px_1fr] gap-3 bg-bg p-6">
                <span className="font-mono text-xs text-human">N{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[17px] leading-relaxed">{w}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap py-24">
        <SectionHead n="04" label="Standing on" title={<>Ideas we <span className="serif text-dim">build</span> on.</>} />
        <ul className="mt-14 grid gap-5 md:grid-cols-2">
          {INFLUENCES.map((x, i) => (
            <Reveal as="li" key={x.t} delay={i * 0.05} className="card p-7">
              <p className="font-mono text-xs text-faint">{x.by}</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{x.t}</p>
              <p className="mt-3 text-dim">{x.d}</p>
            </Reveal>
          ))}
        </ul>
        <div className="mt-16 flex flex-wrap gap-3">
          <Link href="/start" className="btn btn-solid">
            Start a job <Arrow />
          </Link>
          <Link href="/research" className="btn">
            Read the research
          </Link>
        </div>
      </section>
    </div>
  );
}
