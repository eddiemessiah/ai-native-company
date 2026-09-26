import { Brain, MemorySink, consoleSink, type Decision, type QuestionSet } from "@repo/brain";
import { brainFromEnv, providersFromEnv } from "@repo/brain/env";
import { sellable } from "@repo/catalog";
import type { OfferRef } from "@repo/brain/recipes";

/** The last decisions this server instance made, for the admin view and debugging. */
export const recentDecisions = new MemorySink(100);

let publicBrain: Brain | undefined;
let paidBrain: Brain | undefined | null;

/**
 * For free, low-stakes routing (the homepage demo, intake). Falls back to the
 * lexical heuristic when no model key is configured, so the site always works.
 */
export function getPublicBrain(): Brain {
  publicBrain ??= brainFromEnv({ allowHeuristic: true, sinks: [consoleSink, recentDecisions], timeoutMs: 6_000 });
  return publicBrain;
}

/**
 * For paid API calls. Never answers with the heuristic: if no model is
 * configured, paid routes return 503 and no payment is settled.
 */
export function getPaidBrain(): Brain | null {
  if (paidBrain === undefined) {
    const providers = providersFromEnv(process.env, { allowHeuristic: false });
    paidBrain = providers.length ? new Brain({ providers, sinks: [consoleSink, recentDecisions], timeoutMs: 8_000 }) : null;
  }
  return paidBrain;
}

export const leadOffers: readonly OfferRef[] = sellable.map((o) => ({ slug: o.slug, name: o.name, pitch: o.pitch }));

/** Rounds every number in a JSON-like value (probabilities read better at 4 dp). */
function tidy<T>(value: T, dp = 4): T {
  const f = 10 ** dp;
  const walk = (v: unknown): unknown =>
    typeof v === "number"
      ? Math.round(v * f) / f
      : Array.isArray(v)
        ? v.map(walk)
        : v && typeof v === "object"
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
          : v;
  return walk(value) as T;
}

/** What we show publicly about a decision: never the raw state. */
export function publicDecision<Qs extends QuestionSet>(d: Decision<Qs>) {
  return {
    id: d.id,
    provider: d.provider,
    model: d.model,
    calibrated: d.calibrated,
    latencyMs: d.latencyMs,
    costUsd: Math.round(d.costUsd * 1e8) / 1e8,
    answers: tidy(d.answers),
    diagnostics: d.diagnostics.filter((x) => x.level !== "info"),
  };
}
