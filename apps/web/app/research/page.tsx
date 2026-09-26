import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@repo/catalog";
import { Arrow } from "@/components/bits";
import { Reveal } from "@/components/reveal";
import { getPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Research",
  description: "Griot: sourced field notes on AI in Africa, AI-native services, System One models and agent payments.",
};

export const dynamic = "force-static";

export default function ResearchPage() {
  const posts = getPosts();
  return (
    <div className="wrap pb-10 pt-32">
      <p className="label">Griot · the research desk</p>
      <h1 className="mt-5 max-w-5xl text-[clamp(44px,7.5vw,112px)] font-semibold leading-[0.9] tracking-[-0.055em]">
        Field notes <span className="serif text-dim">on</span> AI in Africa.
      </h1>
      <p className="mt-8 max-w-2xl text-lg text-dim">
        A griot keeps a people&apos;s record. Ours keeps the builders&apos;: what&apos;s shipping, what it costs, and what
        works. Every claim has a source; every number has a date; what we couldn&apos;t verify says so.
      </p>

      <ul className="mt-16 divide-y divide-line border-y border-line">
        {posts.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={Math.min(i, 4) * 0.04}>
            <Link href={`/research/${p.slug}`} className="group grid gap-4 py-8 md:grid-cols-12 md:items-baseline">
              <span className="font-mono text-xs text-faint md:col-span-2">{p.date}</span>
              <div className="md:col-span-8">
                <h2 className="text-[clamp(24px,2.6vw,34px)] font-semibold leading-tight tracking-[-0.03em] transition-colors group-hover:text-write">
                  {p.title}
                </h2>
                <p className="mt-2 max-w-2xl text-dim">{p.description}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <li key={t} className="chip h-6 text-[11px]">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="flex items-center gap-2 font-mono text-xs text-dim md:col-span-2 md:justify-end">
                {p.minutes} min <Arrow />
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>

      <div className="mt-16 flex flex-col gap-4 rounded-3xl border border-line p-8 md:flex-row md:items-center md:justify-between">
        <p className="max-w-xl text-dim">New notes go out as threads first. Follow along, or pitch us a story.</p>
        <div className="flex gap-3">
          <a href={brand.founder.x} target="_blank" rel="noreferrer" className="btn btn-solid">
            Follow on X <Arrow />
          </a>
          <a href={brand.founder.telegram} target="_blank" rel="noreferrer" className="btn">
            Telegram
          </a>
        </div>
      </div>
    </div>
  );
}
