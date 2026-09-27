import type { Answer } from "./types";

/**
 * How bad it is to be wrong.
 *  - read:         read-only lookups
 *  - write:        internal, reversible state changes
 *  - external:     messages to people or third parties
 *  - money:        moves funds (prepare only, a human confirms)
 *  - irreversible: cannot be undone (prepare only, a human confirms)
 */
export type Risk = "read" | "write" | "external" | "money" | "irreversible";

export type Verdict = "execute" | "confirm" | "escalate";

export interface ActionPolicy {
  readonly action: string;
  readonly risk: Risk;
  /** Overrides the default threshold for this risk tier. */
  readonly minConfidence?: number;
  /** Force a human confirmation even above threshold. */
  readonly alwaysConfirm?: boolean;
}

export interface GateResult {
  readonly action: string;
  readonly verdict: Verdict;
  readonly confidence: number;
  readonly threshold: number;
  readonly reason: string;
}

/** One threshold per risk tier, scaled to what being wrong costs. Not one global number. */
export const DEFAULT_THRESHOLDS: Readonly<Record<Risk, number>> = {
  read: 0.5,
  write: 0.7,
  external: 0.85,
  money: 0.9,
  irreversible: 0.95,
};

/** Below this the model is genuinely unsure: always hand it to a person. */
export const ESCALATE_BELOW = 0.5;

/** Extra margin demanded from providers whose probabilities are not trained against outcomes. */
export const UNCALIBRATED_PENALTY = 0.1;

const PREPARE_ONLY: ReadonlySet<Risk> = new Set<Risk>(["money", "irreversible"]);

/** Confidence in the answer as given. For a Noul this is the belief in whichever side it leans to. */
export function confidenceOf(answer: Answer): number {
  if (answer.type === "noul") return Math.max(answer.noul, 1 - answer.noul);
  return answer.confidence;
}

/**
 * Decide whether code may act on an answer.
 *
 * A calibrated confidence is a reason to route more aggressively, never a
 * reason to let a model fire something that can't be undone: money and
 * irreversible actions are at most prepared and confirmed by a human.
 */
export function gate(answer: Answer, policy: ActionPolicy, opts: { calibrated: boolean }): GateResult {
  const confidence = confidenceOf(answer);
  const base = policy.minConfidence ?? DEFAULT_THRESHOLDS[policy.risk];
  const threshold = Math.min(0.99, opts.calibrated ? base : base + UNCALIBRATED_PENALTY);
  const result = (verdict: Verdict, reason: string): GateResult => ({
    action: policy.action,
    verdict,
    confidence,
    threshold,
    reason,
  });

  if (confidence < ESCALATE_BELOW) {
    return result("escalate", `confidence ${fmt(confidence)} is below ${ESCALATE_BELOW}: genuinely unsure`);
  }
  if (PREPARE_ONLY.has(policy.risk)) {
    return confidence >= threshold
      ? result("confirm", `${policy.risk} action: prepared, waiting for a human to approve`)
      : result("escalate", `${policy.risk} action below ${fmt(threshold)}: a human decides`);
  }
  if (!opts.calibrated && policy.risk === "external") {
    return result("confirm", "uncalibrated provider: external actions need a human confirmation");
  }
  if (confidence < threshold) {
    return result("confirm", `confidence ${fmt(confidence)} below the ${policy.risk} bar of ${fmt(threshold)}`);
  }
  if (policy.alwaysConfirm) {
    return result("confirm", "policy requires a human confirmation");
  }
  return result("execute", `confidence ${fmt(confidence)} clears the ${policy.risk} bar of ${fmt(threshold)}`);
}

function fmt(n: number): string {
  return n.toFixed(2);
}
