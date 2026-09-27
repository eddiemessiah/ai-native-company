import Link from "next/link";
import { offers } from "@repo/catalog";
import { Arrow } from "./bits";
import { Reveal } from "./reveal";

type Tone = "go" | "ask" | "stop";

/** Where each product sits in an agent's loop, and the verdicts it can return. */
const STAGES: Readonly<Record<string, { step: string; verdicts: readonly (readonly [string, Tone])[] }>> = {
  "shonin-check": { step: "Before paying", verdicts: [["pay", "go"], ["confirm", "ask"], ["block", "stop"]] },
  "shonin-gate": { step: "Before acting", verdicts: [["execute", "go"], ["confirm", "ask"], ["escalate", "stop"]] },
  "shonin-receipt": { step: "After paying", verdicts: [["settled", "go"], ["signed", "go"], ["no payment found", "stop"]] },
};

const TONE: Record<Tone, string> = {
  go: "!border-live/40 !text-live",
  ask: "!border-write/40 !text-write",
  stop: "!border-human/40 !text-human",
};

export const agentProducts = offers.filter((o) => o.category === "agent-api" && o.featured && o.api);

export function AgentProducts({ anchors = false }: { anchors?: boolean }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {agentProducts.map((o, i) => {
        const stage = STAGES[o.slug];
        return (
          <Reveal key={o.slug} delay={i * 0.06}>
            <article {...(anchors ? { id: o.slug } : {})} className="card flex h-full flex-col p-7">
              <p className="font-mono text-xs text-faint">
                0{i + 1} · {stage?.step.toUpperCase()}
              </p>
              <h3 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">{o.name}</h3>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-dim">{o.oneLiner}</p>
              <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Verdicts">
                {stage?.verdicts.map(([v, tone]) => (
                  <li key={v} className={`chip h-7 font-mono text-[11.5px] ${TONE[tone]}`}>
                    {v}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 font-mono text-[12.5px]">
                <span>
                  <span className="text-decide">{o.api!.method}</span> {o.api!.path}
                </span>
                <span className="text-dim">${o.api!.priceUsd.toFixed(2)}</span>
              </div>
              <Link href={`/directory/${o.slug}`} className="mt-5 inline-flex items-center gap-1.5 text-sm text-dim hover:text-fg">
                How it decides <Arrow className="h-3 w-3" />
              </Link>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
