import Link from "next/link";
import { brand, chapters, featured, offers, proofs, tracks } from "@repo/catalog";
import { AgentProducts } from "@/components/agent-products";
import { Arrow, HUMAN, Legend, SectionHead, SPLIT } from "@/components/bits";
import { BrainDemo } from "@/components/brain-demo";
import { Glyph } from "@/components/glyph";
import { Loom } from "@/components/loom";
import { OfferCard } from "@/components/offer-card";
import { Reveal } from "@/components/reveal";
import { Ticker } from "@/components/ticker";
import { paymentNetworks } from "@/lib/chain";

const PIPELINE = [
  { k: "Unit", d: "One clearly defined thing with a finish line: an audit, an agent, an application. Never an hour." },
  { k: "Intake", d: "A form, not three scoping calls. The brain routes it to the right offer in one typed decision." },
  { k: "Engine", d: "LLMs draft, a System One model routes and scores, code does the exact parts." },
  { k: "Rulebook", d: "What correct means in this niche, and every way the AI gets it wrong. The real product." },
  { k: "Review", d: "High-confidence, low-stakes work ships. Money, legal and reputation get a person." },
  { k: "Delivery", d: "A page you can check any time. The status is visible without asking anyone." },
];

export default function Home() {
  const names = Object.fromEntries(offers.map((o) => [o.slug, o.name]));
  const apis = offers.filter((o) => o.api).map((o) => o.slug);
  const live = offers.filter((o) => o.status !== "soon").length;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate min-h-[100svh] overflow-hidden pt-16">
        <div className="absolute inset-0 -z-10">
          <div className="loom-mask absolute inset-0">
            <Loom />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
        </div>

        <div className="wrap grid min-h-[calc(100svh-4rem)] items-center gap-12 py-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="label flex flex-wrap items-center gap-3">
                <span className="dot live-dot" />
                An AI-native firm · for agents and businesses, worldwide
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-7 text-[clamp(64px,11.5vw,176px)] font-semibold leading-[0.84] tracking-[-0.06em]">
                The work,
                <br />
                <span className="serif pr-2 text-write">done.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-8 max-w-xl text-[clamp(17px,1.5vw,20px)] leading-relaxed text-dim">
                {brand.name} sells to agents and to businesses. Agents buy checks and decisions per call, with no account.
                Businesses buy finished work (audits, agents, grant applications, company brains) priced per unit. A
                decision brain checks every step, and people own the outcome.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/agents" className="btn btn-solid">
                  Plug in your agent <Arrow />
                </Link>
                <Link href="/start" className="btn">
                  Start a job
                </Link>
                <Link href="/directory" className="btn">
                  Browse {offers.length} offers
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <Legend className="mt-10" />
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.2} y={30}>
              <BrainDemo names={names} apis={apis} />
            </Reveal>
          </div>
        </div>
      </section>

      <Ticker />

      {/* ── 01 For agents ────────────────────────────────────────────────── */}
      <section className="wrap py-28 md:py-36">
        <SectionHead
          n="01"
          label="For agents, first"
          title={
            <>
              The firm <span className="serif text-dim">agents can</span> hire.
            </>
          }
          lede="An agent doesn't need a sales call. It reads the offer, checks it and pays per call: no account, no API key, no procurement. Three products for agents that spend money and act on someone's behalf."
        />
        <div className="mt-16">
          <AgentProducts />
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="label">How an agent pays us</p>
            <ol className="mt-5 space-y-3 text-[15px] text-dim">
              <li>
                <span className="mr-2 font-mono text-xs text-faint">01</span>It calls the endpoint and gets a 402 with the price.
              </li>
              <li>
                <span className="mr-2 font-mono text-xs text-faint">02</span>It signs a gasless stablecoin authorization. No transaction yet.
              </li>
              <li>
                <span className="mr-2 font-mono text-xs text-faint">03</span>It retries with the signature, and we do the work.
              </li>
              <li>
                <span className="mr-2 font-mono text-xs text-faint">04</span>The payment settles only if the call succeeds.
              </li>
            </ol>
            <p className="mt-6 font-mono text-[12.5px] text-dim">x402 v2 · {paymentNetworks().join(" · ")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/agents" className="btn btn-solid">
                Plug in your agent <Arrow />
              </Link>
              <a href="/llms.txt" className="btn">
                llms.txt
              </a>
              <a href="/.well-known/agent-card.json" className="btn">
                Agent card
              </a>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-7" y={30}>
            <pre className="card overflow-x-auto p-6 font-mono text-[12px] leading-[1.75] text-dim md:p-8">
              <code>
                <span className="text-faint"># Before your agent pays an API, it asks Shonin Check.</span>
                {"\n"}$ curl -X POST {"<site>"}/api/v1/check \{"\n"}
                {"    "}-d {`'{"paymentRequired":"eyJ4NDAyVmVyc2lvbiI6Mi…",`}
                {"\n"}
                {"         "}
                {`"url":"https://api.example.com/v1/rates",`}
                {"\n"}
                {"         "}
                {`"task":"Get today's USD/EUR rate","budgetUsd":0.05}'`}
                {"\n"}
                <span className="text-human">HTTP/1.1 402 Payment Required</span> <span className="text-faint"># $0.01 per check</span>
                {"\n"}
                <span className="text-faint"># sign, retry</span>
                {"\n"}
                <span className="text-live">HTTP/1.1 200 OK</span>
                {"\n"}
                {`{ "verdict": "pay",`}
                {"\n"}
                {`  "reasons": ["passed all 10 checks",`}
                {"\n"}
                {`    "the purchase serves the task and the offer looks legitimate"],`}
                {"\n"}
                {`  "option": { "networkName": "Base", "token": "USDC",`}
                {"\n"}
                {`    "amountUsd": 0.002, "payTo": "0x…" } }`}
              </code>
            </pre>
          </Reveal>
        </div>
      </section>

      {/* ── 02 The split ─────────────────────────────────────────────────── */}
      <section className="wrap py-28 md:py-36">
        <SectionHead
          n="02"
          label="How the firm thinks"
          title={
            <>
              Stop renting a frontier model <span className="serif text-dim">to say</span> &ldquo;billing&rdquo;.
            </>
          }
          lede="Most calls inside an agent aren't text. They're a choice from a list, a number on a scale, a yes or no. So we split every job three ways, and a person holds the pen on anything that moves money or can't be undone."
        />
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
          {[
            { ...SPLIT[0], body: "Research, drafts, briefs, code, explanations. The expensive engine, used only where language is the output." },
            { ...SPLIT[1], body: "Route, score, approve, escalate. Typed answers with calibrated confidence, in one parallel pass." },
            { ...SPLIT[2], body: "Counts, dates, limits, payments, records. Anything exact never touches a model." },
            { key: "human", ...HUMAN, body: "Money, legal exposure, reputation. The system prepares; a person approves. Always." },
          ].map((c, i) => (
            <Reveal key={c.label} delay={i * 0.06} className="bg-bg p-7 md:p-8">
              <span className="dot h-2.5 w-2.5" style={{ background: c.color }} />
              <h3 className="mt-6 text-2xl font-semibold">{c.label}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-dim">{c.body}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 grid gap-6 rounded-3xl border border-line p-7 md:grid-cols-3 md:p-10">
          <div className="md:col-span-2">
            <p className="label">Why it pays</p>
            <p className="mt-4 text-[clamp(22px,2.4vw,30px)] font-medium leading-snug tracking-[-0.02em]">
              A public pipeline in September 2026 summarized 1,018 research papers with a generative model for{" "}
              <span className="text-write">$3.99</span>, then classified all of them with a System One model for{" "}
              <span className="text-decide">$0.08</span>, at a median 256 ms each.
            </p>
          </div>
          <div className="flex flex-col justify-end font-mono text-sm text-dim">
            <p>Use each model for what it&apos;s built for. The biggest savings come from requests that skip the model entirely once a cheap decision routes them to plain code.</p>
          </div>
        </Reveal>
      </section>

      {/* ── 03 Pipeline ──────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-bg-2/40">
        <div className="wrap py-28 md:py-36">
          <SectionHead
            n="03"
            label="How a job moves"
            title={
              <>
                A service business <span className="serif text-dim">that runs</span> like software.
              </>
            }
            lede="Intake is a form. Scope is a menu. Quality is a rulebook. Account management is a dashboard. That's what turns an agency's 25% margins into software margins."
          />
          <ol className="relative mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE.map((step, i) => (
              <Reveal as="li" key={step.k} delay={i * 0.05} className="group relative bg-bg p-7 md:p-9">
                <span className="font-mono text-xs text-faint">0{i + 1}</span>
                <h3 className="mt-8 text-3xl font-semibold tracking-[-0.04em]">{step.k}</h3>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-dim">{step.d}</p>
                <span className="strip-weave absolute inset-x-0 bottom-0 h-1.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 04 Directory ─────────────────────────────────────────────────── */}
      <section className="wrap py-28 md:py-36">
        <SectionHead
          n="04"
          label="The directory"
          title={
            <>
              {offers.length} ways <span className="serif text-dim">to hand us</span> the work.
            </>
          }
          lede={`${live} are open today. Every one names its unit, its rulebook, who reviews it, and what the human alternative costs, because that's what we price against.`}
        />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map((offer, i) => (
            <Reveal key={offer.slug} delay={(i % 3) * 0.06}>
              <OfferCard offer={offer} />
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 flex justify-center">
          <Link href="/directory" className="btn">
            See all {offers.length} in the directory <Arrow />
          </Link>
        </Reveal>
      </section>

      {/* ── 05 Study group ───────────────────────────────────────────────── */}
      <section className="wrap py-28 md:py-36">
        <SectionHead
          n="05"
          label="AI Study Group"
          title={
            <>
              Learn to build agents. <span className="serif text-write">Get paid</span> to run them.
            </>
          }
          lede="The firm needs people who can run agents well. So we train them in the open, online and in city chapters, starting where we already run events. Graduates join the bench that delivers our jobs."
        />
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          <Reveal className="card p-7 lg:col-span-2">
            <ul className="divide-y divide-line">
              {tracks.map((t) => (
                <li key={t.code} className="grid grid-cols-[48px_1fr_auto] items-baseline gap-4 py-4">
                  <span className="font-mono text-xs text-faint">{t.code}</span>
                  <div>
                    <p className="text-lg font-medium">{t.title}</p>
                    <p className="mt-1 text-sm text-dim">{t.blurb}</p>
                  </div>
                  <span className={`chip h-6 text-[11px] ${t.status === "open" ? "!text-live" : ""}`}>{t.status === "open" ? "Open" : "Soon"}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08} className="card flex flex-col justify-between p-7">
            <div>
              <p className="font-mono text-[64px] font-light leading-none tracking-[-0.05em]">{chapters.length}</p>
              <p className="mt-2 text-dim">
                chapters planned · {chapters.filter((c) => c.status === "active").length} cities where we&apos;ve already run
                workshops
              </p>
              <ul className="mt-8 flex flex-wrap gap-1.5">
                {chapters.map((c) => (
                  <li key={c.city} className={`chip h-7 text-[11.5px] ${c.status === "active" ? "!border-live/50 !text-fg" : ""}`}>
                    {c.status === "active" ? <span className="dot bg-live" /> : null}
                    {c.city}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-10 space-y-3">
              <p className="text-sm text-dim">Free tracks. $49 live cohorts. Certificates on Celo.</p>
              <Link href="/study" className="btn btn-solid w-full justify-center">
                Join the study group <Arrow />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 06 Proof ─────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-bg-2/40">
        <div className="wrap py-28 md:py-36">
          <SectionHead
            n="06"
            label="Proof, not promises"
            title={
              <>
                Shipped <span className="serif text-dim">before</span> we had a name.
              </>
            }
          />
          <ul className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {proofs.map((p, i) => (
              <Reveal as="li" key={p.label} delay={i * 0.05} className="bg-bg p-6">
                <p className="text-lg font-semibold leading-snug">{p.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-dim">{p.detail}</p>
                {p.href ? (
                  <a href={p.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs text-decide hover:underline">
                    Verify <Arrow className="h-3 w-3" />
                  </a>
                ) : null}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 07 Leadership ────────────────────────────────────────────────── */}
      <section className="wrap py-28 md:py-36">
        <SectionHead
          n="07"
          label="Who runs it"
          title={
            <>
              Led by a person <span className="serif text-dim">and</span> an agent.
            </>
          }
        />
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          <Reveal className="card p-8">
            <p className="label">{brand.founder.role}</p>
            <p className="mt-5 text-3xl font-semibold tracking-[-0.03em]">{brand.founder.name}</p>
            <p className="mt-1 font-mono text-sm text-dim">{brand.founder.alias} · {brand.founder.based}</p>
            <p className="mt-6 leading-relaxed text-dim">
              AI builder and workshop facilitator. Builds multi-agent orchestrations and agentic payment systems on Celo;
              four years growing builder ecosystems across Africa. Owns every outcome the firm delivers.
            </p>
            <div className="mt-7 flex gap-4 font-mono text-xs">
              <a href={brand.founder.x} target="_blank" rel="noreferrer" className="text-dim hover:text-fg">X</a>
              <a href={brand.founder.github} target="_blank" rel="noreferrer" className="text-dim hover:text-fg">GitHub</a>
              <a href={brand.founder.telegram} target="_blank" rel="noreferrer" className="text-dim hover:text-fg">Telegram</a>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="card relative overflow-hidden p-8">
            <Glyph seed="shonin-one" size={120} className="absolute -right-6 -top-6 text-fg opacity-20" />
            <p className="label">{brand.agent.role}</p>
            <p className="mt-5 text-3xl font-semibold tracking-[-0.03em]">{brand.agent.name}</p>
            <p className="mt-1 font-mono text-sm text-decide">System One brain · every decision logged</p>
            <p className="mt-6 leading-relaxed text-dim">{brand.agent.description}</p>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="wrap pb-10">
        <Reveal className="relative overflow-hidden rounded-[32px] border border-line p-10 md:p-16">
          <div className="strip-weave absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative grid gap-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <p className="label">Design partners</p>
              <h2 className="mt-5 text-[clamp(38px,6vw,84px)] font-semibold leading-[0.95]">
                Your first audit <span className="serif text-write">is free.</span>
              </h2>
              <p className="mt-6 max-w-xl text-lg text-dim">
                The first five businesses get an Agent Readiness Audit or an AI Visibility Audit at no cost, in exchange
                for an honest case study.
              </p>
            </div>
            <div className="flex md:col-span-4 md:justify-end">
              <Link href="/start?offer=agent-readiness-audit" className="btn btn-solid h-12 px-6 text-sm">
                Claim a free audit <Arrow />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
