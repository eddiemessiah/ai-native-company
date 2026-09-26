import { offers } from "./offers";
import type { Category, Offer, X402Route } from "./types";

export * from "./types";
export { brand, proofs } from "./brand";
export { offers } from "./offers";
export { tracks, chapters, type Chapter, type Track } from "./study";

export const categories: readonly { id: Category; label: string; blurb: string }[] = [
  { id: "service", label: "Services", blurb: "Finished work, priced per unit. Agents do it, people own it." },
  { id: "agent-api", label: "Agent APIs", blurb: "Endpoints agents discover and pay for per call with x402." },
  { id: "infra", label: "Infrastructure", blurb: "Open rails for the agent economy." },
  { id: "community", label: "Community", blurb: "Where the people who run the agents are trained." },
  { id: "research", label: "Research", blurb: "Sourced field notes and data on AI in Africa." },
];

export function offerBySlug(slug: string): Offer | undefined {
  return offers.find((o) => o.slug === slug);
}

export function offersIn(category: Category): Offer[] {
  return offers.filter((o) => o.category === category);
}

export const featured: readonly Offer[] = offers.filter((o) => o.featured);

/** Offers a human buyer can start today: what the lead router chooses between. */
export const sellable: readonly Offer[] = offers.filter(
  (o) => (o.category === "service" || o.category === "community") && o.status !== "soon",
);

export const paidRoutes: readonly (X402Route & { slug: string; name: string })[] = offers.flatMap((o) =>
  o.api ? [{ ...o.api, slug: o.slug, name: o.name }] : [],
);
