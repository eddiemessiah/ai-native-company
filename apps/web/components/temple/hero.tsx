"use client";

import Link from "next/link";
import { useRef } from "react";
import { Arrow } from "@/components/bits";
import { HeroScene } from "./hero-scene";

const KANJI = [
  { k: "商人", tip: "Merchant · agents trade the work" },
  { k: "証人", tip: "Witness · every decision is recorded" },
  { k: "承認", tip: "Approval · a person signs off" },
];

/** The first screen: a temple gate at dusk, what Shonin is in one line, and where to go next. */
export function Hero({ callPrice, auditPrice }: { callPrice: string; auditPrice: string }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} className="t-hero" aria-labelledby="hero-title">
      <div className="t-scene" aria-hidden="true">
        <HeroScene target={ref} />
      </div>
      <div className="t-hero-scrim" aria-hidden="true" />

      <div className="t-hero-body wrap relative flex min-h-[max(700px,100svh)] items-center pb-24 pt-28">
        <div className="max-w-[660px]">
          <p className="label t-in flex flex-wrap items-center gap-3 !text-dim">
            <span className="dot live-dot" />
            <span className="md:hidden">An AI-native firm · worldwide</span>
            <span className="hidden md:inline">An AI-native firm · for agents and businesses, worldwide</span>
          </p>
          <h1
            id="hero-title"
            className="t-in mt-6 text-[clamp(44px,7.2vw,104px)] font-semibold leading-[0.92] tracking-[-0.05em]"
            style={{ "--d": "0.1s" } as React.CSSProperties}
          >
            Agents do the work.
            <br />
            A person{" "}
            <span className="relative inline-block">
              <span className="serif pr-1 text-human">seals</span>
              <svg className="t-brush" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 14 C50 4, 120 18, 196 8" />
              </svg>
            </span>{" "}
            what matters.
          </h1>
          <p
            className="t-in mt-7 max-w-xl text-[clamp(16px,1.35vw,19px)] leading-relaxed text-dim"
            style={{ "--d": "0.2s" } as React.CSSProperties}
          >
            Shonin is a firm run by agents and checked by people. Agents buy a check, a gate and a receipt for {callPrice} a
            call, with no account. Businesses commission finished work, priced per unit: from a {auditPrice} audit to an agent
            in production.
          </p>
          <div className="t-in mt-8 flex flex-wrap items-center gap-3" style={{ "--d": "0.3s" } as React.CSSProperties}>
            <Link href="/agents" className="btn btn-solid">
              Plug in your agent <Arrow />
            </Link>
            <Link href="/directory" className="btn t-glass">
              Commission work
            </Link>
            <a href="#start" className="t-link ml-1 font-mono text-[12.5px]">
              New here? Start below
            </a>
          </div>
        </div>

        <ul className="t-in absolute right-[clamp(16px,3vw,36px)] top-1/2 hidden -translate-y-1/2 flex-col gap-5 md:flex" style={{ "--d": "0.5s" } as React.CSSProperties}>
          {KANJI.map((x) => (
            <li key={x.k}>
              <span tabIndex={0} className="t-hk">
                <span lang="ja" className="t-kanji text-[22px] leading-[1.1]">
                  {x.k}
                </span>
                <span className="t-tip">{x.tip}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
