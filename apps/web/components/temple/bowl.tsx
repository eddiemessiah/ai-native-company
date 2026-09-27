"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Arrow } from "@/components/bits";
import { TempleHead } from "./head";

const SEAMS = [
  "M150 150 L172 196 L160 236 L184 282 L176 330",
  "M318 162 L296 210 L310 246 L286 290",
  "M172 196 L214 214 L248 204 L296 210",
  "M160 236 L118 262 L96 300",
  "M184 282 L232 300 L262 336",
];

/** Kintsugi: a broken bowl mended in gold, the seams drawn as the section scrolls by. */
export function Bowl({ rules }: { rules: readonly { rule: string; offer: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const drawn = useTransform(scrollYProgress, [0.15, 1], [0, 1]);
  const glow = useTransform(scrollYProgress, [0.6, 1], [0, 1]);

  return (
    <section ref={ref} className="relative py-28 md:py-36" aria-labelledby="bowl-title">
      <div className="wrap grid items-center gap-14 lg:grid-cols-12">
        <div className="flex justify-center lg:col-span-5">
          <svg viewBox="0 0 420 400" className="h-auto w-full max-w-[300px] lg:max-w-[420px]" aria-hidden="true">
            <defs>
              <linearGradient id="bowl-glaze" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--t-paper-3)" }} />
                <stop offset="1" style={{ stopColor: "var(--t-paper)" }} />
              </linearGradient>
              <linearGradient id="bowl-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f3d68a" />
                <stop offset="0.5" style={{ stopColor: "var(--t-gold)" }} />
                <stop offset="1" stopColor="#8a6a2a" />
              </linearGradient>
            </defs>
            <ellipse cx="210" cy="362" rx="120" ry="14" fill="rgba(0,0,0,.28)" />
            <path d="M70 142 C74 250 128 340 210 346 C292 340 346 250 350 142 Z" fill="url(#bowl-glaze)" stroke="var(--line-2)" strokeWidth="2" />
            <ellipse cx="210" cy="142" rx="140" ry="30" fill="var(--t-paper-2)" stroke="var(--line-2)" strokeWidth="2" />
            <ellipse cx="210" cy="146" rx="122" ry="22" fill="var(--t-paper)" />
            <path d="M160 340 L164 360 L256 360 L260 340" fill="var(--t-paper-2)" stroke="var(--line-2)" strokeWidth="2" />
            <motion.g style={{ opacity: reduce ? 1 : glow }}>
              {SEAMS.map((d) => (
                <path key={`g${d}`} d={d} fill="none" stroke="var(--t-gold)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
              ))}
            </motion.g>
            {SEAMS.map((d) => (
              <motion.path
                key={d}
                d={d}
                fill="none"
                stroke="url(#bowl-gold)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pathLength: reduce ? 1 : drawn }}
              />
            ))}
          </svg>
        </div>
        <div className="lg:col-span-7">
          <TempleHead
            id="bowl-title"
            kanji="金継ぎ"
            reading="kintsugi · golden joinery"
            eyebrow="The rulebook"
            title={
              <>
                Every correction <span className="serif text-write">is mended in gold.</span>
              </>
            }
            lede="When a person fixes an agent's work, the fix becomes a rule, and every later job follows it. Anyone can download a model in an afternoon. Nobody can download our corrections."
          />
          <ul className="mt-10 grid gap-3 md:ml-[108px]">
            {rules.map((r) => (
              <li key={r.rule} className="t-rule">
                <p className="text-[15px] leading-relaxed text-fg/90">{r.rule}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">From the {r.offer} rulebook</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 md:ml-[108px]">
            <Link href="/company" className="btn">
              How the firm works <Arrow />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
