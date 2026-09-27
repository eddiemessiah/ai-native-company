import type { Proof } from "@repo/catalog";
import { Arrow } from "@/components/bits";
import { Glyph } from "@/components/glyph";
import { TempleHead } from "./head";
import { Rise } from "./rise";

interface Person {
  name: string;
  role: string;
  line: string;
  detail: string;
}

/** Proofs carved in stone, and the two who run the temple. */
export function Stones({ proofs, founder, agent }: { proofs: readonly Proof[]; founder: Person; agent: Person }) {
  return (
    <section className="relative py-28 md:py-36" aria-labelledby="stones-title">
      <div className="wrap">
        <TempleHead
          id="stones-title"
          kanji="碑"
          reading="hi · stone tablet"
          eyebrow="Proof, not promises"
          title={
            <>
              Shipped <span className="serif text-dim">before we had a name.</span>
            </>
          }
        />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 md:ml-[108px] lg:grid-cols-5">
          {proofs.map((p, i) => (
            <Rise as="li" key={p.label} delay={i * 0.06} className="t-stone p-5" y={26}>
              <span lang="ja" className="t-kanji text-[15px] text-faint" aria-hidden="true">
                碑
              </span>
              <p className="relative mt-3 text-[16.5px] font-semibold leading-snug">{p.label}</p>
              <p className="relative mt-2 text-[13.5px] leading-relaxed text-dim">{p.detail}</p>
              {p.href ? (
                <a href={p.href} target="_blank" rel="noreferrer" className="relative mt-4 inline-flex items-center gap-1.5 font-mono text-[11.5px] text-decide hover:underline">
                  Verify <Arrow className="h-3 w-3" />
                </a>
              ) : null}
            </Rise>
          ))}
        </ul>

        <div className="mt-16 grid gap-5 md:ml-[108px] md:grid-cols-2">
          {[founder, agent].map((x, i) => (
            <Rise key={x.name} delay={i * 0.08} className="t-tablet t-washi relative overflow-hidden">
              <div className="t-fibers" aria-hidden="true" />
              {i === 1 ? <Glyph seed="shonin-one" size={120} className="absolute -right-6 -top-6 text-fg opacity-15" /> : null}
              <p className="label relative">{x.role}</p>
              <p className="relative mt-4 text-[28px] font-semibold tracking-[-0.03em]">{x.name}</p>
              <p className={`relative mt-1 font-mono text-[12.5px] ${i === 1 ? "text-decide" : "text-dim"}`}>{x.line}</p>
              <p className="relative mt-5 leading-relaxed text-dim">{x.detail}</p>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
