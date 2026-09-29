import type { Brain } from "../brain";
import type { GateResult } from "../policy";
import { Noul } from "../questions";
import type { AnswersFor } from "../types";

/**
 * Source check for anything we publish that states a fact: a short's
 * narration, a thread, a report line. Code has already confirmed the quote
 * appears word for word in the source; this decides whether the quote says
 * what the claim says. One call per claim.
 */
export type SourcedClaim = {
  /** The sentence we want to publish. */
  readonly claim: string;
  /** The passage from the source that is supposed to back it, verbatim. */
  readonly quote: string;
};

export const claimQuestions = {
  supported: Noul("The quote field states the claim field, or states facts that directly imply it"),
  adds: Noul(
    "The claim field adds a number, name, date, comparison or promise that the quote field does not contain",
  ),
  contradicts: Noul("The quote field contradicts the claim field"),
};

export type ClaimAnswers = AnswersFor<typeof claimQuestions>;

/** ok: publishable as written. check: a person reads it against the source. cut: rewrite or remove it. */
export type ClaimVerdict = "ok" | "check" | "cut";

export interface ClaimRoute {
  readonly verdict: ClaimVerdict;
  readonly reasons: readonly string[];
}

export function routeClaim(a: ClaimAnswers, gates: readonly GateResult[] = []): ClaimRoute {
  if (a.contradicts.noul >= 0.5) return { verdict: "cut", reasons: [`the source says otherwise (${a.contradicts.noul.toFixed(2)})`] };
  if (a.supported.noul < 0.5) return { verdict: "cut", reasons: [`the quote doesn't say this (${a.supported.noul.toFixed(2)})`] };
  const checks: string[] = [];
  if (a.adds.noul >= 0.5) checks.push(`adds something the quote doesn't contain (${a.adds.noul.toFixed(2)})`);
  for (const g of gates) if (g.verdict !== "execute") checks.push(`${g.action}: ${g.reason}`);
  return checks.length > 0 ? { verdict: "check", reasons: checks } : { verdict: "ok", reasons: [`supported ${a.supported.noul.toFixed(2)}`] };
}

/** Publishing a claim is external, so it clears the .85 bar or a person reads it. */
export async function checkClaim(brain: Brain, claim: SourcedClaim, opts: { meta?: Readonly<Record<string, unknown>> } = {}) {
  const decision = await brain.decide("claim.check", claim, claimQuestions, {
    policies: { supported: { action: "publish_claim", risk: "external" } },
    ...(opts.meta ? { meta: opts.meta } : {}),
  });
  return { decision, route: routeClaim(decision.answers, Object.values(decision.gates)) };
}
