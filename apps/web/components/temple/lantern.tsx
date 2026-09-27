import Link from "next/link";
import type { Offer } from "@repo/catalog";
import { Arrow } from "@/components/bits";
import { TempleHead } from "./head";
import { Rise } from "./rise";

const LIGHTS = [
  "An ideal-customer scorecard, and where those customers gather.",
  "Three first messages, each checked by a reviewer that can block a draft but never send one.",
  "A 7-day sprint and a Monday dashboard.",
  "A folder your own agents keep running in Claude Code.",
  "Nothing sent in your name: you send everything.",
];

/** A paper lantern: glows, sways, and lights the GTM Harness. */
function PaperLantern() {
  return (
    <svg viewBox="0 0 320 460" className="h-auto w-full max-w-[190px] lg:max-w-[300px]" aria-hidden="true">
      <defs>
        <radialGradient id="lan-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={{ stopColor: "var(--t-lamp-glow)" }} />
          <stop offset="1" style={{ stopColor: "var(--t-lamp-glow)", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="lan-paper" x1="0" x2="1">
          <stop offset="0" style={{ stopColor: "var(--t-lantern)" }} />
          <stop offset="0.5" style={{ stopColor: "#ff7a3d" }} />
          <stop offset="1" style={{ stopColor: "var(--t-lantern)" }} />
        </linearGradient>
      </defs>
      <circle cx="160" cy="250" r="170" fill="url(#lan-glow)" className="t-flicker" />
      <line x1="160" y1="0" x2="160" y2="64" stroke="var(--t-wood-dark)" strokeWidth="3" />
      <g className="t-sway">
        <rect x="112" y="60" width="96" height="18" rx="4" fill="#141311" />
        <path d="M100 78 C60 140 60 330 100 392 L220 392 C260 330 260 140 220 78 Z" fill="url(#lan-paper)" />
        {[112, 146, 180, 214, 248, 282, 316, 350].map((y) => (
          <path key={y} d={`M${66 + Math.abs(y - 235) * 0.2} ${y} Q160 ${y + 8} ${254 - Math.abs(y - 235) * 0.2} ${y}`} fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="1.6" />
        ))}
        <path className="t-flame" d="M160 262 C148 244 152 228 160 214 C168 228 172 244 160 262 Z" fill="var(--t-lamp)" opacity="0.55" />
        <text x="160" y="258" textAnchor="middle" className="t-kanji" fontSize="74" fill="#141311" opacity="0.88">
          灯
        </text>
        <rect x="112" y="392" width="96" height="18" rx="4" fill="#141311" />
        <path d="M150 410 L150 446 M160 410 L160 452 M170 410 L170 446" stroke="#141311" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Lantern({ harness }: { harness: Offer }) {
  return (
    <section className="relative py-28 md:py-36" aria-labelledby="lantern-title">
      <div className="wrap grid items-center gap-14 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-7">
          <TempleHead
            id="lantern-title"
            kanji="灯籠"
            reading="tōrō · lantern"
            eyebrow={`For founders · ${harness.price.label}`}
            title={
              <>
                A lantern <span className="serif text-write">for founders.</span>
              </>
            }
            lede={harness.oneLiner}
          />
          <ol className="mt-10 grid gap-3 md:ml-[108px]">
            {LIGHTS.map((l, i) => (
              <Rise as="li" key={l} delay={i * 0.06} className="flex gap-4 border-b border-line pb-3 text-[15.5px]">
                <span className="t-light-dot" aria-hidden="true" />
                <span className="text-fg/90">{l}</span>
              </Rise>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3 md:ml-[108px]">
            <Link href="/gtm" className="btn btn-solid">
              Run it on your product <Arrow />
            </Link>
          </div>
        </div>
        <div className="order-1 flex justify-center lg:order-2 lg:col-span-5">
          <PaperLantern />
        </div>
      </div>
    </section>
  );
}
