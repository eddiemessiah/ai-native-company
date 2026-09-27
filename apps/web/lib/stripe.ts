import Stripe from "stripe";

/**
 * Stripe is the rail for people, worldwide: cards, wallets and bank debits,
 * with prices shown in the buyer's currency. Agents pay on-chain with x402.
 * Without STRIPE_SECRET_KEY, "buy" buttons fall back to the intake form.
 */

let client: Stripe | null | undefined;

export function stripe(): Stripe | null {
  if (client === undefined) {
    const key = process.env.STRIPE_SECRET_KEY;
    client = key ? new Stripe(key) : null;
  }
  return client;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
