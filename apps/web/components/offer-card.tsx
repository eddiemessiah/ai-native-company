import Link from "next/link";
import type { Offer } from "@repo/catalog";
import { Arrow, SplitBar, StatusPill } from "./bits";
import { Glyph } from "./glyph";

const CATEGORY_LABEL: Record<Offer["category"], string> = {
  service: "Service",
  "agent-api": "Agent API",
  product: "Product",
  infra: "Infrastructure",
  community: "Community",
  research: "Research",
};

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Link
      href={`/directory/${offer.slug}`}
      className="group card relative flex h-full flex-col overflow-hidden p-6 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-line-2"
    >
      <div className="flex items-start justify-between gap-4">
        <Glyph
          seed={offer.slug}
          size={52}
          muted={offer.status === "soon"}
          className="text-fg transition-transform duration-700 group-hover:rotate-90"
        />
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={offer.status} />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">{CATEGORY_LABEL[offer.category]}</span>
        </div>
      </div>
      <h3 className="mt-7 text-[23px] font-semibold leading-tight tracking-[-0.03em]">{offer.name}</h3>
      <p className="mt-2.5 text-[15px] leading-relaxed text-dim">{offer.oneLiner}</p>
      <div className="mt-auto pt-7">
        <dl className="space-y-2 font-mono text-[12px]">
          <div className="grid grid-cols-[56px_1fr] gap-3">
            <dt className="text-faint">UNIT</dt>
            <dd className="text-dim">{offer.unit}</dd>
          </div>
          <div className="grid grid-cols-[56px_1fr] gap-3">
            <dt className="text-faint">PRICE</dt>
            <dd className="text-fg">{offer.price.label}</dd>
          </div>
        </dl>
        <SplitBar className="mt-5" />
        <div className="mt-4 flex items-center justify-between font-mono text-[12px] text-faint">
          <span>{offer.firstJobFree ? "First job free" : offer.turnaround}</span>
          <span className="flex items-center gap-1.5 text-dim transition-colors group-hover:text-fg">
            Open <Arrow />
          </span>
        </div>
      </div>
    </Link>
  );
}
