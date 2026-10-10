// SPDX-License-Identifier: MIT
// GTM Harness. Copyright (c) 2026 Edidiong Umana; licence text in packages/gtm-harness/LICENSE.

import type { Metadata } from "next";
import { GtmHarness } from "@/components/gtm-harness";

export const metadata: Metadata = {
  title: "GTM Harness",
  description:
    "Your go-to-market, run by agents you can check: an ideal-customer scorecard, where your customers gather, reviewed first messages, a 7-day sprint and a workspace your agents keep running, with any model. Free and open source (MIT).",
};

const SPLIT = [
  { color: "var(--write)", k: "An LLM writes", d: "the plan, the sources and the first messages" },
  { color: "var(--decide)", k: "The brain reviews", d: "every draft: ready, revise or blocked" },
  { color: "var(--code)", k: "Code packs", d: "the workspace, the scorecard math and the dashboard" },
  { color: "var(--human)", k: "You send", d: "everything, and log what you changed" },
];

export default function GtmPage() {
  return (
    <div className="wrap pb-10 pt-32">
      <p className="label flex flex-wrap items-center gap-3">
        <span className="dot live-dot" />
        Free and open source · runs in any agent
      </p>
      <h1 className="mt-5 max-w-5xl text-[clamp(44px,7.5vw,112px)] font-semibold leading-[0.9] tracking-[-0.055em]">
        Your go-to-market, <span className="serif text-write">run by agents</span> you can check.
      </h1>
      <p className="mt-8 max-w-2xl text-lg text-dim">
        Describe your product. In about a minute you get your ideal-customer scorecard, where those customers already
        gather, three first messages checked by a reviewer that can block but never send, a 7-day sprint, and a workspace
        your own agents keep running: a marketing brain, a skill for every role and a first campaign. It runs in Claude
        Code or any agent that reads AGENTS.md.
      </p>
      <ul className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {SPLIT.map((s) => (
          <li key={s.k} className="bg-bg p-5">
            <span className="dot h-2.5 w-2.5" style={{ background: s.color }} />
            <p className="mt-4 font-medium">{s.k}</p>
            <p className="mt-1 text-sm text-dim">{s.d}</p>
          </li>
        ))}
      </ul>
      <div className="mt-16">
        <GtmHarness />
      </div>
    </div>
  );
}
