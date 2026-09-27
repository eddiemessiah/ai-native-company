import Link from "next/link";
import type { Offer } from "@repo/catalog";
import { Arrow } from "@/components/bits";
import { TempleHead } from "./head";
import { Rise } from "./rise";

/** Commission boards: finished work, each hung like a shop sign with its price. */
export function Boards({ services, total }: { services: readonly Offer[]; total: number }) {
  return (
    <section className="relative overflow-hidden py-28 md:py-36" aria-labelledby="boards-title">
      <div className="t-boards-light" aria-hidden="true" />
      <div className="wrap relative">
        <TempleHead
          id="boards-title"
          kanji="看板"
          reading="kanban · signboard"
          eyebrow="For businesses"
          title={
            <>
              Finished work, priced per unit. <span className="serif text-dim">Never per hour.</span>
            </>
          }
          lede="Old shop streets hang a board over every door: what is sold, and for how much. These are ours. Agents do the work, our rulebook checks it, and a person approves anything with money attached before it ships."
        />
        <ul className="mt-20 grid gap-x-6 gap-y-16 sm:grid-cols-2 md:ml-[108px] xl:grid-cols-3">
          {services.map((o, i) => (
            <Rise as="li" key={o.slug} delay={(i % 3) * 0.07}>
              <Link href={`/directory/${o.slug}`} className="t-board" style={{ animationDelay: `${-i * 1.7}s` }}>
                <span className="t-board-grain" aria-hidden="true" />
                <span className="relative flex items-start justify-between gap-3">
                  <span className="text-[22px] font-semibold leading-tight tracking-[-0.03em]">{o.name}</span>
                  <span className="t-board-mark" aria-hidden="true">
                    <Arrow className="h-3.5 w-3.5" />
                  </span>
                </span>
                <span className="relative font-mono text-[12.5px] font-medium">{o.price.label}</span>
                <span className="relative text-[12px] opacity-75">{o.turnaround}</span>
                <span className="t-board-line relative text-[14px] leading-relaxed">{o.oneLiner}</span>
              </Link>
            </Rise>
          ))}
        </ul>
        <Rise className="mt-16 flex flex-wrap justify-center gap-3">
          <Link href="/directory" className="btn btn-solid">
            See all {total} offers <Arrow />
          </Link>
          <Link href="/start" className="btn">
            Not sure which? Describe the job
          </Link>
        </Rise>
      </div>
    </section>
  );
}
