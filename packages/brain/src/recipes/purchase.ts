import type { Brain } from "../brain";
import { gate } from "../policy";
import { Noul } from "../questions";
import type { AnswersFor, State } from "../types";

/**
 * The decision half of Shonin Check: does a purchase an agent is about to make
 * serve the user's task, and does the offer look like a real paid service?
 * Code does the rest (tokens, amounts, budgets, addresses) before this runs.
 *
 * The bar is the "write" tier, because the caller only asks this for payments
 * under its own auto-approve limit: that limit is the person's approval, and a
 * model never raises it.
 */
export function purchaseQuestions() {
  return {
    serves_task: Noul({
      instructions:
        "Buying this resource directly helps complete the user's task, judged from the task, the resource description and the seller's URL",
    }),
    looks_legitimate: Noul({
      instructions:
        "The resource description is specific and consistent with a real paid API, dataset or service, not a donation request, a giveaway or an unrelated upsell",
    }),
  };
}

export type PurchaseAnswers = AnswersFor<ReturnType<typeof purchaseQuestions>>;

export interface PurchaseState {
  /** What the user asked the agent to do. */
  readonly task: string;
  readonly resource: { readonly url?: string; readonly description?: string; readonly serviceName?: string };
  readonly priceUsd: number | null;
  readonly network?: string;
}

export type PurchaseVerdict = "pay" | "confirm" | "block";

export interface PurchaseRoute {
  readonly verdict: PurchaseVerdict;
  readonly reasons: readonly string[];
  readonly servesTask: number;
  readonly legitimate: number;
  readonly threshold: number;
}

/** Below this, the model is confident the answer is "no", and it may block. */
export const CONFIDENT_NO = 0.3;

export function routePurchase(a: PurchaseAnswers, opts: { calibrated: boolean }): PurchaseRoute {
  const serves = a.serves_task.noul;
  const legit = a.looks_legitimate.noul;
  const policy = { action: "pay_within_limit", risk: "write" as const };
  const servesGate = gate(a.serves_task, policy, opts);
  const legitGate = gate(a.looks_legitimate, policy, opts);
  const base = { servesTask: serves, legitimate: legit, threshold: servesGate.threshold };

  const reasons: string[] = [];
  if (serves < CONFIDENT_NO) reasons.push("the purchase does not serve the user's task");
  if (legit < CONFIDENT_NO) reasons.push("the offer does not look like a real paid service");
  if (reasons.length) return { ...base, verdict: "block", reasons };

  const clears = (p: number, g: { verdict: string }) => p >= 0.5 && g.verdict === "execute";
  if (clears(serves, servesGate) && clears(legit, legitGate)) {
    return { ...base, verdict: "pay", reasons: ["the purchase serves the task and the offer looks legitimate"] };
  }
  if (!clears(serves, servesGate)) reasons.push(`unsure the purchase serves the task (${serves.toFixed(2)})`);
  if (!clears(legit, legitGate)) reasons.push(`unsure the offer is legitimate (${legit.toFixed(2)})`);
  return { ...base, verdict: "confirm", reasons };
}

export async function decidePurchase(brain: Brain, s: PurchaseState) {
  const state: State = {
    user_task: s.task,
    seller_url: s.resource.url ?? "unknown",
    seller_name: s.resource.serviceName ?? "unknown",
    resource_description: s.resource.description ?? "none given",
    price_usd: s.priceUsd ?? "unknown",
    ...(s.network ? { network: s.network } : {}),
  };
  const decision = await brain.decide("check.purchase", state, purchaseQuestions());
  return { decision, route: routePurchase(decision.answers, { calibrated: decision.calibrated }) };
}
