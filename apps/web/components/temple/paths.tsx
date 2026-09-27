import Link from "next/link";
import { Arrow } from "@/components/bits";
import { TempleHead } from "./head";
import { Rise } from "./rise";

/** Start here: three kinds of visitor, what each can do, and the first step for each. */
export function Paths({ callPrice, auditPrice }: { callPrice: string; auditPrice: string }) {
  const paths = [
    {
      k: "証",
      who: "You run an agent",
      title: "Let it check before it pays.",
      body: `Your agent pays for APIs or acts for someone. Before it pays or acts, it asks Shonin: pay, confirm with a person, or block. ${callPrice} a call, paid by the agent, with no account.`,
      first: "First step: point your agent at /api/v1/check, or add shonin-mcp to its tools.",
      links: [
        { href: "/agents", label: "Plug in your agent", solid: true },
        { href: "/directory/shonin-check", label: "How Check decides" },
      ],
    },
    {
      k: "商",
      who: "You run a business",
      title: "Hand us a job with a finish line.",
      body: `An audit, a website customers and AI assistants can use, an agent in production, a grant application. Fixed price per unit, never per hour: from a ${auditPrice} audit to an agent in production.`,
      first: "First step: pick an offer, or describe the job and the brain routes it.",
      links: [
        { href: "/directory", label: "Commission work", solid: true },
        { href: "/start", label: "Describe the job" },
      ],
    },
    {
      k: "灯",
      who: "You're building or learning",
      title: "Take the free tools and the school.",
      body: "Founders run the GTM Harness: a go-to-market plan, three reviewed first messages and a 7-day sprint, free and open source. Learners join the AI Study Group and become the people who run agents.",
      first: "First step: run the harness on your product, or start a free track.",
      links: [
        { href: "/gtm", label: "Run the GTM Harness", solid: true },
        { href: "/study", label: "Join the study group" },
      ],
    },
  ];

  return (
    <section id="start" className="relative scroll-mt-16 py-28 md:py-36" aria-labelledby="start-title">
      <div className="wrap">
        <TempleHead
          id="start-title"
          kanji="道"
          reading="michi · the way"
          eyebrow="Start here"
          title={
            <>
              Three ways in. <span className="serif text-dim">Pick yours.</span>
            </>
          }
          lede="Shonin serves agents, the businesses that hire us, and the people learning to build. Find yours and you'll know the next step."
        />
        <div className="mt-14 grid gap-5 md:ml-[108px] lg:grid-cols-3">
          {paths.map((p, i) => (
            <Rise key={p.k} delay={i * 0.08} as="article" className="t-path-card t-washi">
              <div className="t-fibers" aria-hidden="true" />
              <span lang="ja" className="t-kanji t-path-k" aria-hidden="true">
                {p.k}
              </span>
              <p className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-faint">
                0{i + 1} · {p.who}
              </p>
              <h3 className="pr-12 text-[26px] font-semibold leading-[1.1] tracking-[-0.03em]">{p.title}</h3>
              <div className="grid content-start gap-4">
                <p className="text-[15px] leading-relaxed text-dim">{p.body}</p>
                <p className="border-l-2 border-human/60 pl-3 font-mono text-[12px] leading-relaxed text-fg/80">{p.first}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.links.map((l) => (
                  <Link key={l.href} href={l.href} className={`btn h-10 text-[12.5px] ${l.solid ? "btn-solid" : ""}`}>
                    {l.label}
                    {l.solid ? <Arrow /> : null}
                  </Link>
                ))}
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
