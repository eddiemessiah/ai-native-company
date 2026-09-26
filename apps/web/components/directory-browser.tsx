"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Audience, Category, Offer, Status } from "@repo/catalog";
import { OfferCard } from "./offer-card";

const AUDIENCE_LABEL: Record<Audience, string> = {
  smb: "Small business",
  startup: "Startups",
  enterprise: "Enterprise",
  builders: "Builders",
  agents: "AI agents",
  learners: "Learners",
  ecosystems: "Ecosystems & NGOs",
};

export function DirectoryBrowser({
  offers,
  categories,
}: {
  offers: readonly Offer[];
  categories: readonly { id: Category; label: string; blurb: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const category = (params.get("c") as Category | null) ?? null;
  const audience = (params.get("a") as Audience | null) ?? null;
  const status = (params.get("s") as Status | null) ?? null;

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((o) => {
      if (category && o.category !== category) return false;
      if (audience && !o.audience.includes(audience)) return false;
      if (status && o.status !== status) return false;
      if (!q) return true;
      return [o.name, o.oneLiner, o.pitch, o.unit, ...o.tags].join(" ").toLowerCase().includes(q);
    });
  }, [offers, query, category, audience, status]);

  const audiences = Array.from(new Set(offers.flatMap((o) => o.audience))) as Audience[];

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 space-y-3 border-b border-line bg-bg/85 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0" role="group" aria-label="Category">
          <FilterChip active={!category} onClick={() => set("c", null)}>
            All <span className="text-faint">{offers.length}</span>
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={category === c.id} onClick={() => set("c", category === c.id ? null : c.id)}>
              {c.label} <span className="text-faint">{offers.filter((o) => o.category === c.id).length}</span>
            </FilterChip>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <label className="sr-only" htmlFor="dir-search">
            Search the directory
          </label>
          <input
            id="dir-search"
            className="field h-10 py-0"
            placeholder="Search: grants, whatsapp, x402, AML…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Who it's for"
            className="field h-10 w-full py-0 sm:w-48"
            value={audience ?? ""}
            onChange={(e) => set("a", e.target.value || null)}
          >
            <option value="">For anyone</option>
            {audiences.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
          <select
            aria-label="Status"
            className="field h-10 w-full py-0 sm:w-40"
            value={status ?? ""}
            onChange={(e) => set("s", e.target.value || null)}
          >
            <option value="">Any status</option>
            <option value="live">Live</option>
            <option value="beta">Beta</option>
            <option value="soon">Soon</option>
          </select>
        </div>
      </div>

      {category ? (
        <p className="mt-8 max-w-2xl text-dim">{categories.find((c) => c.id === category)?.blurb}</p>
      ) : null}

      <p className="mt-8 font-mono text-xs text-faint" aria-live="polite">
        {results.length} {results.length === 1 ? "offer" : "offers"}
      </p>

      <motion.ul layout className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {results.map((offer) => (
            <motion.li
              key={offer.slug}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <OfferCard offer={offer} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {results.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line-2 p-10 text-center text-dim">
          Nothing matches. Tell us what you need on the{" "}
          <a className="text-fg underline decoration-decide underline-offset-4" href="/start">
            intake form
          </a>
          ; the brain will route it.
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`chip h-9 shrink-0 cursor-pointer gap-2 px-3.5 text-[12.5px] transition-colors ${
        active ? "!border-fg bg-fg !text-bg [&_span]:!text-bg/60" : "hover:border-fg hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
