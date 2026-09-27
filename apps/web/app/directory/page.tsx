import type { Metadata } from "next";
import { Suspense } from "react";
import { categories, offers } from "@repo/catalog";
import { Legend } from "@/components/bits";
import { DirectoryBrowser } from "@/components/directory-browser";

export const metadata: Metadata = {
  title: "Directory",
  description: "Every service, agent API, and program the firm offers, with its unit, rulebook, review layer and price.",
};

export default function DirectoryPage() {
  const live = offers.filter((o) => o.status === "live").length;
  return (
    <div className="wrap pb-10 pt-32">
      <p className="label">Directory</p>
      <h1 className="mt-5 max-w-5xl text-[clamp(44px,7.5vw,112px)] font-semibold leading-[0.9] tracking-[-0.055em]">
        Everything we sell, <span className="serif text-dim">and exactly</span> how it&apos;s made.
      </h1>
      <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <p className="max-w-2xl text-lg text-dim">
          {offers.length} offers, {live} live. Services cash-flow from day one and teach us what to automate; APIs and
          infrastructure productize what the services prove.
        </p>
        <Legend />
      </div>
      <div className="mt-12">
        <Suspense fallback={null}>
          <DirectoryBrowser offers={offers} categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
