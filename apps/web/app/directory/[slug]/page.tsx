import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { offerBySlug, offers } from "@repo/catalog";
import { Arrow, SplitRows, StatusPill } from "@/components/bits";
import { Glyph } from "@/components/glyph";
import { OfferCard } from "@/components/offer-card";
import { Reveal } from "@/components/reveal";
import { stripeConfigured } from "@/lib/stripe";

export function generateStaticParams() {
  return offers.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata(props: PageProps<"/directory/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const offer = offerBySlug(slug);
  if (!offer) return {};
  return { title: offer.name, description: offer.oneLiner };
}

export default async function OfferPage(props: PageProps<"/directory/[slug]">) {
  const { slug } = await props.params;
  const offer = offerBySlug(slug);
  if (!offer) notFound();

  const related = offers.filter((o) => o.slug !== offer.slug && o.category === offer.category).slice(0, 3);
  const pieces = [
    { k: "Unit", v: offer.unit },
    { k: "Review layer", v: offer.review },
    { k: "Delivery", v: offer.delivery },
    { k: "Turnaround", v: offer.turnaround },
  ];

  return (
    <article className="wrap pb-10 pt-28">
      <nav aria-label="Breadcrumb" className="font-mono text-xs text-faint">
        <Link href="/directory" className="hover:text-fg">
          Directory
        </Link>{" "}
        / {offer.name}
      </nav>

      <header className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-4">
            <Glyph seed={offer.slug} size={72} muted={offer.status === "soon"} className="text-fg" />
            <StatusPill status={offer.status} />
            {offer.firstJobFree ? <span className="chip h-6 !text-write">First job free</span> : null}
          </div>
          <h1 className="mt-8 text-[clamp(44px,7vw,104px)] font-semibold leading-[0.9] tracking-[-0.055em]">{offer.name}</h1>
          <p className="mt-6 max-w-2xl text-[clamp(18px,1.7vw,22px)] leading-relaxed text-dim">{offer.oneLiner}</p>
        </div>
        <aside className="lg:col-span-4">
          <div className="card sticky top-24 p-6">
            <p className="label">Price</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{offer.price.label}</p>
            {offer.price.ngn ? <p className="mt-1 font-mono text-sm text-dim">In Nigeria: {offer.price.ngn}</p> : null}
            <p className="mt-5 border-t border-line pt-4 text-sm text-dim">
              <span className="font-mono text-xs text-faint">INSTEAD OF · </span>
              {offer.price.humanAlternative}
            </p>
            {offer.api ? (
              <Link href={`/agents#${offer.slug}`} className="btn btn-solid mt-6 w-full justify-center">
                Call the API <Arrow />
              </Link>
            ) : offer.category === "product" && offer.links?.[0] ? (
              <Link href={offer.links[0].href} className="btn btn-solid mt-6 w-full justify-center">
                {offer.links[0].label} free <Arrow />
              </Link>
            ) : offer.status === "soon" ? (
              <Link href={`/start?offer=${offer.slug}`} className="btn mt-6 w-full justify-center">
                Join the waitlist <Arrow />
              </Link>
            ) : offer.checkout && stripeConfigured() ? (
              <>
                <form action="/api/checkout" method="post" className="mt-6">
                  <input type="hidden" name="offer" value={offer.slug} />
                  <button type="submit" className="btn btn-solid w-full justify-center">
                    Pay ${offer.checkout.amountUsd.toLocaleString("en-US")} and start <Arrow />
                  </button>
                </form>
                <p className="mt-2 text-center font-mono text-[11px] text-faint">
                  {offer.checkout.label} · card, wallet or bank, in your currency
                </p>
                <Link href={`/start?offer=${offer.slug}`} className="btn mt-3 w-full justify-center">
                  {offer.firstJobFree ? "Claim a free first job" : "Ask first"}
                </Link>
              </>
            ) : (
              <Link href={`/start?offer=${offer.slug}`} className="btn btn-solid mt-6 w-full justify-center">
                {offer.firstJobFree ? "Claim a free first job" : "Start this job"} <Arrow />
              </Link>
            )}
          </div>
        </aside>
      </header>

      <section className="mt-20 grid gap-12 lg:grid-cols-12">
        <div className="space-y-16 lg:col-span-8">
          <Reveal>
            <h2 className="label">The split</h2>
            <div className="mt-5">
              <SplitRows split={offer.split} />
            </div>
          </Reveal>

          <Reveal>
            <h2 className="label">Engine</h2>
            <p className="mt-5 text-xl leading-relaxed">{offer.engine}</p>
          </Reveal>

          <Reveal>
            <h2 className="label">Rulebook</h2>
            <p className="mt-3 text-sm text-dim">
              What correct means here, and the mistakes we&apos;ve already caught. It grows one job at a time.
            </p>
            <ol className="mt-6 space-y-px overflow-hidden rounded-2xl border border-line bg-line">
              {offer.rulebook.map((rule, i) => (
                <li key={rule} className="grid grid-cols-[48px_1fr] gap-2 bg-bg p-5">
                  <span className="font-mono text-xs text-faint">R{String(i + 1).padStart(2, "0")}</span>
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          {offer.api ? (
            <Reveal>
              <h2 className="label">Endpoint</h2>
              <pre className="card mt-5 overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-dim">
                <code>
                  <span className="text-decide">{offer.api.method}</span> {offer.api.path}
                  {"  "}
                  <span className="text-faint"># ${offer.api.priceUsd} per call, USDC via x402</span>
                  {"\n\n"}
                  {JSON.stringify(offer.api.inputExample, null, 2)}
                </code>
              </pre>
            </Reveal>
          ) : null}
        </div>

        <div className="space-y-10 lg:col-span-4">
          <Reveal>
            <h2 className="label">Intake</h2>
            <ul className="mt-5 space-y-3">
              {offer.intake.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] text-dim">
                  <span className="dot mt-2 bg-line-2" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <dl className="divide-y divide-line border-y border-line">
              {pieces.map((p) => (
                <div key={p.k} className="py-4">
                  <dt className="font-mono text-xs text-faint">{p.k.toUpperCase()}</dt>
                  <dd className="mt-1.5 text-[15px]">{p.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal>
            <h2 className="label">How we find buyers</h2>
            <ul className="mt-5 space-y-3">
              {offer.distribution.map((d) => (
                <li key={d} className="text-[15px] text-dim">
                  {d}
                </li>
              ))}
            </ul>
          </Reveal>
          {offer.links?.length ? (
            <Reveal>
              <h2 className="label">Links</h2>
              <ul className="mt-5 space-y-2 font-mono text-sm">
                {offer.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="inline-flex items-center gap-1.5 text-decide hover:underline" {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                      {l.label} <Arrow className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}
        </div>
      </section>

      {related.length ? (
        <section className="mt-28">
          <h2 className="label">More like this</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((o) => (
              <OfferCard key={o.slug} offer={o} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
