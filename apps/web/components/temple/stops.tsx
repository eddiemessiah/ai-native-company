import Link from "next/link";
import type { Offer } from "@repo/catalog";
import { Arrow } from "@/components/bits";
import { TempleHead } from "./head";
import { Rise } from "./rise";
import { Stamp } from "./stamp";

type Tone = "go" | "ask" | "stop";

/** Each agent product is a stop on the temple path, with the seals it can press. */
const STOPS: Readonly<Record<string, { place: string; placeJa: string; when: string; question: string; seals: readonly (readonly [string, string, Tone])[] }>> = {
  "shonin-check": {
    place: "the water basin",
    placeJa: "手水舎",
    when: "Before it pays",
    question: "Should my agent pay this?",
    seals: [
      ["許", "pay", "go"],
      ["問", "confirm", "ask"],
      ["止", "block", "stop"],
    ],
  },
  "shonin-gate": {
    place: "the gate",
    placeJa: "山門",
    when: "Before it acts",
    question: "Execute, confirm or escalate?",
    seals: [
      ["行", "execute", "go"],
      ["問", "confirm", "ask"],
      ["上", "escalate", "stop"],
    ],
  },
  "shonin-receipt": {
    place: "the seal book",
    placeJa: "御朱印",
    when: "After it pays",
    question: "Did it settle, and can it go in the books?",
    seals: [["済", "settled and signed", "go"]],
  },
};

const TONE: Record<Tone, string> = { go: "text-live", ask: "text-write", stop: "text-human" };

export function Stops({ products, callPrice, networks }: { products: readonly Offer[]; callPrice: string; networks: string }) {
  return (
    <section className="relative py-28 md:py-36" aria-labelledby="stops-title">
      <div className="wrap">
        <TempleHead
          id="stops-title"
          kanji="商人"
          reading="shōnin · merchant"
          eyebrow="For agents"
          title={
            <>
              Three stops <span className="serif text-dim">for every agent.</span>
            </>
          }
          lede={`Before it pays, before it acts, after it pays. Each stop answers in seconds, for ${callPrice} a call. No sales call, no account, no API key: the agent pays per call with x402.`}
        />

        <div className="mt-14 grid gap-5 md:ml-[108px] lg:grid-cols-3">
          {products.map((o, i) => {
            const stop = STOPS[o.slug];
            if (!stop) return null;
            return (
              <Rise key={o.slug} delay={i * 0.08} as="article" className="t-stop t-washi">
                <div className="t-fibers" aria-hidden="true" />
                <div className="flex items-start justify-between gap-4">
                  <p className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-faint">
                    0{i + 1} · {stop.when}
                  </p>
                  <p className="text-right" aria-hidden="true">
                    <span lang="ja" className="t-kanji block text-[17px] text-fg/80">
                      {stop.placeJa}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{stop.place}</span>
                  </p>
                </div>
                <h3 className="mt-6 text-[30px] font-semibold tracking-[-0.04em]">{o.name}</h3>
                <p className="mt-1 font-mono text-[12.5px] text-write">{o.price.label}</p>
                <p className="mt-5 text-[19px] font-medium leading-snug tracking-[-0.01em]">{stop.question}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-dim">{o.oneLiner.replace(`${stop.question} `, "")}</p>
                <ul className="mt-7 flex flex-wrap gap-4" aria-label="Verdicts">
                  {stop.seals.map(([k, label, tone], j) => (
                    <li key={label} className="grid justify-items-center gap-2">
                      <Stamp kanji={k} delay={0.25 + i * 0.12 + j * 0.14} rotate={j % 2 ? 4 : -4} />
                      <span className={`font-mono text-[11px] ${TONE[tone]}`}>{label}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 font-mono text-[12px]">
                  {o.api ? (
                    <span>
                      <span className="text-decide">{o.api.method}</span> {o.api.path}
                    </span>
                  ) : null}
                  <Link href={`/directory/${o.slug}`} className="t-link inline-flex items-center gap-1.5 text-dim hover:text-fg">
                    How it decides <Arrow className="h-3 w-3" />
                  </Link>
                </div>
              </Rise>
            );
          })}
        </div>

        <Rise className="mt-8 md:ml-[108px]">
          <div className="t-strip">
            <span className="text-fg">POST /api/v1/check</span>
            <span className="t-arrow" aria-hidden="true">→</span>
            <span className="text-human">402 Payment Required</span>
            <span className="t-arrow" aria-hidden="true">→</span>
            <span>pay {callPrice} in USDC with x402</span>
            <span className="t-arrow" aria-hidden="true">→</span>
            <span className="text-live">200 {"{ \"verdict\": \"pay\" }"}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[12px] text-dim">
              x402 v2 · {networks} · also as MCP tools: <span className="text-fg">shonin-mcp</span> · the payment settles only if the
              call succeeds
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/agents" className="btn btn-solid h-10 text-[12.5px]">
                Plug in your agent <Arrow />
              </Link>
              <a href="/llms.txt" className="btn h-10 text-[12.5px]">
                llms.txt
              </a>
            </div>
          </div>
        </Rise>
      </div>
    </section>
  );
}
