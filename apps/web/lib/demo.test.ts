import { Brain, HeuristicProvider } from "@repo/brain";
import { decideLead } from "@repo/brain/recipes";
import { describe, expect, it } from "vitest";
import { leadOffers } from "./brain";
import { DEMO_EXAMPLES } from "./demo-examples";

// Every visitor sees the demo, and a fresh deploy has no model keys, so it
// has to route well on the heuristic alone.
const CASES = [
  ...DEMO_EXAMPLES,
  {
    message: "We run 12 restaurants in Lagos and need WhatsApp ordering live before December. Budget approved.",
    offer: "agent-ready-website",
  },
  { message: "Our agents pay for APIs with x402. We need to stop them paying the wrong endpoints.", offer: "agent-spend-firewall" },
  { message: "Our agent sends emails and refunds. We want it to ask a human before risky actions.", offer: "nova-gate" },
  { message: "I need Instagram posts and reel scripts for my restaurant every week.", offer: "creative-packs" },
  { message: "Our support inbox is overwhelmed with tickets.", offer: "support-triage" },
];

describe("homepage demo on the keyless heuristic", () => {
  const brain = new Brain({ providers: [new HeuristicProvider()] });

  it.each(CASES)("routes to $offer: $message", async ({ message, offer }) => {
    const { route } = await decideLead(brain, { message }, leadOffers);
    expect(route.offer).toBe(offer);
  });
});
