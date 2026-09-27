import Link from "next/link";
import { Arrow } from "@/components/bits";
import { Rise } from "./rise";

/** The temple bell, and the way in. */
export function Bell({ freeAudit }: { freeAudit: string | null }) {
  return (
    <section className="relative overflow-hidden pb-12 pt-24 md:pt-32" aria-labelledby="bell-title">
      <div className="wrap">
        <div className="t-bell-hall t-washi">
          <div className="t-fibers" aria-hidden="true" />
          <div className="relative grid items-center gap-10 md:grid-cols-12">
            <div className="flex justify-center md:col-span-4">
              <svg viewBox="0 0 240 300" className="h-auto w-full max-w-[220px]" aria-hidden="true">
                <rect x="20" y="18" width="200" height="14" rx="3" fill="var(--t-wood-dark)" />
                <rect x="36" y="32" width="10" height="250" fill="var(--t-wood)" />
                <rect x="194" y="32" width="10" height="250" fill="var(--t-wood)" />
                <g className="t-bell">
                  <line x1="120" y1="32" x2="120" y2="60" stroke="var(--t-wood-dark)" strokeWidth="5" />
                  <path d="M84 70 C84 58 156 58 156 70 L164 214 C164 226 76 226 76 214 Z" fill="var(--t-stone-lit)" stroke="var(--line-2)" strokeWidth="2" />
                  <path d="M76 204 L164 204" stroke="var(--t-stone)" strokeWidth="6" />
                  {[96, 120, 144].map((x) => (
                    <g key={x}>
                      {[92, 108, 124].map((y) => (
                        <circle key={y} cx={x} cy={y} r="3.2" fill="var(--t-stone)" />
                      ))}
                    </g>
                  ))}
                  <circle cx="120" cy="170" r="11" fill="none" stroke="var(--t-gold)" strokeWidth="3" />
                  <rect x="112" y="150" width="16" height="10" fill="var(--t-stone)" />
                </g>
                <g className="t-ring" fill="none" stroke="var(--t-gold)">
                  <circle cx="120" cy="170" r="30" />
                  <circle cx="120" cy="170" r="30" style={{ animationDelay: "1.6s" }} />
                </g>
              </svg>
            </div>
            <div className="md:col-span-8">
              <span lang="ja" className="t-kanji text-[15px] tracking-[0.3em] text-faint" aria-hidden="true">
                梵鐘 · bonshō
              </span>
              <h2 id="bell-title" className="mt-4 text-[clamp(56px,9vw,128px)] font-semibold leading-[0.9] tracking-[-0.05em]">
                Enter<span className="text-human">.</span>
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-dim">
                Agents plug in and pay per call. Businesses pick a unit of work. Founders and learners start free. Whichever you
                are, a person owns the outcome.
              </p>
              <Rise className="mt-8 flex flex-wrap gap-3">
                <Link href="/agents" className="btn btn-solid">
                  Plug in your agent <Arrow />
                </Link>
                <Link href="/directory" className="btn">
                  Commission work
                </Link>
                <Link href="/gtm" className="btn">
                  Start free
                </Link>
              </Rise>
              {freeAudit ? (
                <p className="mt-8 border-l-2 border-human/60 pl-3 font-mono text-[12.5px] leading-relaxed text-dim">
                  Design partners: the first five businesses get a free {freeAudit} in exchange for an honest case study.{" "}
                  <Link href="/start?offer=agent-readiness-audit" className="text-fg underline decoration-human underline-offset-4">
                    Claim one
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
