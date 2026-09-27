/**
 * Every offer is described with the eight pieces of an AI-native service:
 * unit, intake, engine, rulebook, review layer, delivery, pricing, distribution.
 * If an offer can't fill these in, it isn't ready to sell.
 */

export type Category = "service" | "infra" | "agent-api" | "community" | "research";
export type Status = "live" | "beta" | "soon";
export type Audience = "smb" | "startup" | "enterprise" | "builders" | "agents" | "learners" | "ecosystems";

export interface Price {
  /** What we show, e.g. "$490 per audit". */
  readonly label: string;
  /** Local price in Nigeria where it differs, paid through Paystack, e.g. "₦350,000". */
  readonly ngn?: string;
  /** What the buyer pays today for the human alternative. We price against this, not our costs. */
  readonly humanAlternative: string;
  readonly model: "per-unit" | "retainer" | "share-of-savings" | "per-call" | "cohort" | "free" | "sponsorship";
}

/** Buy online through Stripe Checkout: a fixed price or a deposit, in USD. */
export interface Checkout {
  readonly amountUsd: number;
  /** What the buyer pays for, e.g. "50% deposit on one agent ($2,500)". */
  readonly label: string;
}

export interface X402Route {
  readonly method: "POST" | "GET";
  readonly path: string;
  /** Price per call in USD, settled in USDC via x402. */
  readonly priceUsd: number;
  readonly description: string;
  readonly inputExample: Readonly<Record<string, unknown>>;
}

export interface Offer {
  readonly slug: string;
  readonly name: string;
  readonly category: Category;
  readonly status: Status;
  readonly oneLiner: string;
  /** Buyer-vocabulary description. Doubles as the Choice criterion when the brain routes leads. */
  readonly pitch: string;
  readonly audience: readonly Audience[];
  readonly unit: string;
  readonly intake: readonly string[];
  readonly engine: string;
  /** The real product: what "correct" means and how the AI gets it wrong. Grows one mistake at a time. */
  readonly rulebook: readonly string[];
  readonly review: string;
  readonly delivery: string;
  readonly turnaround: string;
  readonly price: Price;
  readonly distribution: readonly string[];
  /** The split: what the LLM writes, what the System One model decides, what code executes. */
  readonly split: { readonly llm: string; readonly decide: string; readonly code: string };
  readonly tags: readonly string[];
  readonly featured?: boolean;
  readonly firstJobFree?: boolean;
  readonly api?: X402Route;
  readonly checkout?: Checkout;
  readonly links?: readonly { label: string; href: string }[];
}

export interface Proof {
  readonly label: string;
  readonly detail: string;
  readonly href?: string;
}
