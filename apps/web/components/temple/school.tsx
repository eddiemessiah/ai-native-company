import Link from "next/link";
import type { Chapter, Offer, Track } from "@repo/catalog";
import { Arrow } from "@/components/bits";
import { TempleHead } from "./head";
import { Rise } from "./rise";

/** The temple school: the AI Study Group's tracks, hung like writing boards. */
export function School({ study, tracks, chapters }: { study: Offer; tracks: readonly Track[]; chapters: readonly Chapter[] }) {
  const active = chapters.filter((c) => c.status === "active").length;
  return (
    <section className="relative py-28 md:py-36" aria-labelledby="school-title">
      <div className="wrap">
        <TempleHead
          id="school-title"
          kanji="寺子屋"
          reading="terakoya · temple school"
          eyebrow={`AI Study Group · ${study.price.label}`}
          title={
            <>
              The temple school. <span className="serif text-dim">Learn to run agents.</span>
            </>
          }
          lede="The firm needs people who can run agents well, so we train them in the open: free tracks, live cohorts, city chapters and certificates on Celo. Graduates join the bench that delivers our jobs."
        />
        <div className="mt-14 grid gap-5 md:ml-[108px] lg:grid-cols-12">
          <ol className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
            {tracks.map((t, i) => (
              <Rise as="li" key={t.code} delay={(i % 2) * 0.06} className="t-tablet t-washi">
                <div className="t-fibers" aria-hidden="true" />
                <div className="relative flex items-center justify-between gap-3">
                  <span className="font-mono text-[11.5px] text-faint">{t.code}</span>
                  <span className={`chip h-6 text-[11px] ${t.status === "open" ? "!border-live/40 !text-live" : ""}`}>
                    {t.status === "open" ? "Open" : "Soon"}
                  </span>
                </div>
                <p className="relative mt-4 text-[18px] font-semibold leading-snug tracking-[-0.02em]">{t.title}</p>
                <p className="relative mt-2 text-[14px] leading-relaxed text-dim">{t.blurb}</p>
              </Rise>
            ))}
          </ol>
          <Rise delay={0.1} className="t-tablet t-kumiko-frame flex flex-col justify-between lg:col-span-4">
            <div>
              <p className="font-mono text-[64px] font-light leading-none tracking-[-0.05em]">{chapters.length}</p>
              <p className="mt-2 text-dim">
                city chapters planned, {active} where we have already run workshops.
              </p>
              <ul className="mt-6 flex flex-wrap gap-1.5">
                {chapters.map((c) => (
                  <li key={c.city} className={`chip h-7 text-[11.5px] ${c.status === "active" ? "!border-live/50 !text-fg" : ""}`}>
                    {c.status === "active" ? <span className="dot bg-live" /> : null}
                    {c.city}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/study" className="btn btn-solid mt-8 w-full justify-center">
              Join the study group <Arrow />
            </Link>
          </Rise>
        </div>
      </div>
    </section>
  );
}
