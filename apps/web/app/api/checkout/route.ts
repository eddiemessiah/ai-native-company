import { offerBySlug } from "@repo/catalog";
import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Buy an offer online: a plain form posts the slug, Stripe Checkout takes the
 * money in the buyer's currency, and the webhook tells the founder. The price
 * comes from the catalog, never from the request.
 */
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const limit = rateLimit(`checkout:${clientKey(req)}`, 10, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const slug = String(form?.get("offer") ?? "");
  const offer = offerBySlug(slug);
  if (!offer?.checkout || offer.status === "soon") {
    return NextResponse.json({ error: "This offer can't be bought online." }, { status: 404 });
  }

  const client = stripe();
  if (!client) return NextResponse.redirect(`${origin}/start?offer=${offer.slug}`, 303);

  try {
    const session = await client.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(offer.checkout.amountUsd * 100),
            product_data: { name: `${offer.name}: ${offer.checkout.label}`, description: offer.oneLiner },
          },
        },
      ],
      success_url: `${origin}/start?paid=${offer.slug}`,
      cancel_url: `${origin}/directory/${offer.slug}`,
      metadata: { offer: offer.slug },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",
      invoice_creation: { enabled: true },
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("[checkout]", error instanceof Error ? error.message : error);
    return NextResponse.redirect(`${origin}/start?offer=${offer.slug}&checkout=failed`, 303);
  }
}
