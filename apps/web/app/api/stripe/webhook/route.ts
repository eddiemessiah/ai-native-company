import { offerBySlug } from "@repo/catalog";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { notify } from "@/lib/notify";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/** Every paid checkout lands on the founder's phone, with what was bought and by whom. */
export async function POST(req: Request) {
  const client = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!client || !secret) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const offer = offerBySlug(session.metadata?.offer ?? "");
    const amount = session.amount_total === null ? "?" : `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() ?? ""}`;
    const email = session.customer_details?.email ?? "unknown";
    const country = session.customer_details?.address?.country ?? "unknown";
    await notify({
      title: `Paid: ${offer?.name ?? session.metadata?.offer ?? "an offer"}`,
      lines: [
        ["Amount", amount],
        ["For", offer?.checkout?.label ?? "?"],
        ["Buyer", email],
        ["Country", country],
      ],
      body: "Reply within one working day with the scope and a start date.",
      payload: { type: "checkout.completed", offer: offer?.slug ?? null, amount: session.amount_total, currency: session.currency, email, country, session: session.id },
    });
  }

  return NextResponse.json({ received: true });
}
