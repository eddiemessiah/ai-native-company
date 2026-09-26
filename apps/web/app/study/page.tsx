import type { Metadata } from "next";
import { chapters, tracks } from "@repo/catalog";
import { Arrow, SectionHead } from "@/components/bits";
import { ChapterMap } from "@/components/chapter-map";
import { Reveal } from "@/components/reveal";
import { StudyApply } from "@/components/study-apply";
import { links } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Study Group",
  description:
    "A global study group for becoming an AI engineer: free tracks, weekly pods, live cohorts, city chapters across Africa and the diaspora, and certificates on Celo.",
};

const UPGRADES = [
  { k: "Pods", d: "5–8 people at the same level and timezone meet weekly. Nobody learns alone; nobody drops out quietly." },
  { k: "Cohorts", d: "Four-week live runs with a mentor, a demo day and a shipped project. $49, with scholarships for every cohort." },
  { k: "Chapters", d: "City leads host monthly build nights. Lagos, Enugu, Abakaliki, Makurdi and Jos already have a history of events." },
  { k: "Ship weeks", d: "Every phase ends with something deployed, not a quiz alone. Capstones use real problems from real businesses." },
  { k: "The bench", d: "Builder-certified members get paid work on the firm's jobs: review layers, agent sprints, forward-deployed roles." },
  { k: "Onchain proof", d: "Explorer, Scholar and Builder certificates as soulbound tokens on Celo, verifiable by any employer." },
];

const TIERS = [
  { name: "Free", price: "₦0", body: "Every track, lesson, quiz and certificate. Self-paced, forever.", cta: "Start now" },
  { name: "Pro cohort", price: "$49 · ₦25,000", body: "Four weeks live, a weekly pod, mentor reviews, demo day, priority for the bench.", cta: "Apply" },
  { name: "Team", price: "From $4,000 / 20 seats", body: "A private cohort for your company, capstones on your workflows, manager reports.", cta: "Talk to us" },
  { name: "Sponsor", price: "From $2,500 / cohort", body: "Fund scholarships or a track. Your name on the certificates and first look at the talent.", cta: "Sponsor" },
];

export default function StudyPage() {
  const active = chapters.filter((c) => c.status === "active").length;
  return (
    <div className="pt-28">
      <section className="wrap grid gap-12 pb-24 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="label">AI Study Group · v2</p>
          <h1 className="mt-5 text-[clamp(48px,8vw,124px)] font-semibold leading-[0.88] tracking-[-0.06em]">
            Learn to build agents. <span className="serif text-write">Get paid</span> to run them.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-dim">
            The academy started as a free, self-paced course. Version two makes it a study <em>group</em>: pods, live
            cohorts and city chapters across Africa and the diaspora, and a direct line from certificate to paid work.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#apply" className="btn btn-solid">
              Apply and get placed <Arrow />
            </a>
            <a href={links.academy} target="_blank" rel="noreferrer" className="btn">
              Start T1 free
            </a>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-px self-end overflow-hidden rounded-3xl border border-line bg-line lg:col-span-4 lg:grid-cols-1">
          {[
            { v: tracks.length, l: "tracks, 2 open now" },
            { v: chapters.length, l: `chapters planned, ${active} active` },
            { v: "₦0", l: "to start, forever" },
          ].map((s) => (
            <div key={s.l} className="bg-bg p-5">
              <dt className="sr-only">{s.l}</dt>
              <dd className="font-mono text-[clamp(28px,3vw,44px)] font-light tracking-[-0.04em]">{s.v}</dd>
              <p className="mt-1 text-sm text-dim">{s.l}</p>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-y border-line bg-bg-2/40">
        <div className="wrap py-24">
          <SectionHead n="01" label="What changed" title={<>From a course <span className="serif text-dim">to a</span> group.</>} />
          <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {UPGRADES.map((u, i) => (
              <Reveal as="li" key={u.k} delay={i * 0.04} className="bg-bg p-7">
                <p className="text-2xl font-semibold tracking-[-0.03em]">{u.k}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-dim">{u.d}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap py-24">
        <SectionHead n="02" label="Tracks" title={<>Six roles <span className="serif text-dim">the agent economy</span> is hiring for.</>} />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((t, i) => (
            <Reveal key={t.code} delay={(i % 3) * 0.05} className="card flex h-full flex-col p-7">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-faint">{t.code}</span>
                <span className={`chip h-6 text-[11px] ${t.status === "open" ? "!text-live" : ""}`}>{t.status === "open" ? "Open" : "Soon"}</span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">{t.title}</h3>
              <p className="mt-1 font-mono text-xs text-decide">{t.role}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-dim">{t.blurb}</p>
              <ul className="mt-auto flex flex-wrap gap-1.5 pt-6">
                {t.topics.map((topic) => (
                  <li key={topic} className="chip h-6 text-[11px]">
                    {topic}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-bg-2/40">
        <div className="wrap py-24">
          <SectionHead
            n="03"
            label="Chapters"
            title={<>Lagos first. <span className="serif text-dim">Then</span> everywhere.</>}
            lede="A chapter is a lead, a monthly build night and a group chat. We start where we've already run workshops, then recruit leads city by city: alumni who can host ten people and a projector."
          />
          <div className="mt-14">
            <ChapterMap chapters={chapters} />
          </div>
        </div>
      </section>

      <section className="wrap py-24">
        <SectionHead n="04" label="Formats" title={<>Free to learn. <span className="serif text-dim">Paid to</span> go faster.</>} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.05} className={`card flex h-full flex-col p-7 ${i === 1 ? "!border-write/60" : ""}`}>
              <p className="label">{t.name}</p>
              <p className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{t.price}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-dim">{t.body}</p>
              <a href={t.name === "Free" ? links.academy : t.name === "Pro cohort" ? "#apply" : "/start?offer=team-ai-upskilling"} className="btn mt-auto justify-center" style={{ marginTop: "1.75rem" }}>
                {t.cta}
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="apply" className="wrap scroll-mt-24 pb-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label">Apply</p>
            <h2 className="mt-5 text-[clamp(36px,4.6vw,64px)] font-semibold leading-[0.95] tracking-[-0.05em]">
              Placed in <span className="serif text-write">one second.</span>
            </h2>
            <p className="mt-6 text-dim">
              Tell us where you are and where you want to be. The brain picks your track, level and pod with typed
              questions; a mentor checks every placement.
            </p>
          </div>
          <div className="lg:col-span-8">
            <StudyApply academyUrl={links.academy} />
          </div>
        </div>
      </section>
    </div>
  );
}
