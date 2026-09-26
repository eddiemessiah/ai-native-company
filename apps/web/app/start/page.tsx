import type { Metadata } from "next";
import { offerBySlug, sellable } from "@repo/catalog";
import { IntakeForm } from "@/components/intake-form";
import { links } from "@/lib/site";

export const metadata: Metadata = {
  title: "Start a job",
  description: "Tell us what you need done. The decision brain routes it to the right offer; a person replies within a working day.",
};

export default async function StartPage(props: PageProps<"/start">) {
  const params = await props.searchParams;
  const offerParam = typeof params.offer === "string" ? params.offer : undefined;
  const message = typeof params.m === "string" ? params.m.slice(0, 1200) : undefined;
  const offer = offerParam ? offerBySlug(offerParam) : undefined;

  return (
    <div className="wrap grid gap-14 pb-10 pt-32 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="label">Start a job</p>
        <h1 className="mt-5 text-[clamp(44px,6vw,88px)] font-semibold leading-[0.92] tracking-[-0.055em]">
          A form, <span className="serif text-dim">not</span> three calls.
        </h1>
        <p className="mt-6 text-lg text-dim">
          Describe the job. The brain answers five typed questions about it (which offer fits, how urgent, what budget, who
          decides, is it spam), code sets the priority, and a person replies.
        </p>
        {offer ? (
          <div className="mt-8 rounded-2xl border border-line p-5">
            <p className="font-mono text-xs text-faint">YOU PICKED</p>
            <p className="mt-2 text-xl font-semibold">{offer.name}</p>
            <p className="mt-1 text-sm text-dim">{offer.price.label}</p>
          </div>
        ) : null}
        <ol className="mt-10 space-y-4 font-mono text-[12.5px] text-dim">
          <li><span className="text-decide">01</span> · The brain routes it (≈0.2 s)</li>
          <li><span className="text-decide">02</span> · Your lead reaches the founder&apos;s phone</li>
          <li><span className="text-decide">03</span> · A reply within one working day, WAT</li>
          <li><span className="text-decide">04</span> · A fixed scope and price before any work</li>
        </ol>
      </div>
      <div className="lg:col-span-8">
        <IntakeForm
          offers={sellable.map((o) => ({ slug: o.slug, name: o.name }))}
          {...(offer ? { initialOffer: offer.slug } : {})}
          {...(message ? { initialMessage: message } : {})}
          links={{ booking: links.booking, paystack: links.paystack, stripe: links.stripe }}
        />
      </div>
    </div>
  );
}
