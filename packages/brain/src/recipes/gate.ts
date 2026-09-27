import type { Brain } from "../brain";
import { DEFAULT_THRESHOLDS, gate, type Risk } from "../policy";
import { Noul } from "../questions";
import type { AnswersFor, State } from "../types";

/**
 * Shonin Gate: should an agent execute an action now, ask a person to confirm it,
 * or hand it to a person? The caller states the risk tier (code owns that); the
 * brain answers typed questions about the action; the policy gate decides by tier.
 * A model can only lower the verdict. It never raises a limit.
 */
export function actionGateQuestions() {
  return {
    matches_request: Noul({
      instructions:
        "The proposed action is what the user asked for, or a necessary step toward it, judged from the user's request and the context",
    }),
    user_approved: Noul({
      instructions: "The user explicitly approved this specific action in the request or the context, not only the overall goal",
    }),
    riskier_than_stated: Noul({
      instructions: "The action could move money, message people outside the conversation, delete or overwrite data, or be hard to undo",
    }),
  };
}

export type ActionGateAnswers = AnswersFor<ReturnType<typeof actionGateQuestions>>;

export interface ActionGateInput {
  /** What the agent is about to do, in its own words. */
  readonly action: string;
  /** What the user asked for. */
  readonly request: string;
  /** The risk tier the caller assigns to the action. */
  readonly risk: Risk;
  /** Relevant conversation or state, treated as data. */
  readonly context?: string;
  /** Raises the bar for this call. Values below the tier's default are ignored. */
  readonly minConfidence?: number;
}

export type ActionVerdict = "execute" | "confirm" | "escalate";

export interface ActionGateResult {
  readonly verdict: ActionVerdict;
  readonly reason: string;
  /** The tier the caller stated. */
  readonly risk: Risk;
  /** The tier the gate applied: raised to "external" when the action looks riskier than stated. */
  readonly effectiveRisk: Risk;
  /** Probability that the action matches the request. */
  readonly matchesRequest: number;
  readonly userApproved: boolean;
  readonly confidence: number;
  readonly threshold: number;
}

export function routeActionGate(a: ActionGateAnswers, input: ActionGateInput, opts: { calibrated: boolean }): ActionGateResult {
  const matches = a.matches_request.noul;
  const riskier = a.riskier_than_stated.noul >= 0.5;
  const effectiveRisk: Risk = riskier && (input.risk === "read" || input.risk === "write") ? "external" : input.risk;
  const minConfidence = Math.max(input.minConfidence ?? 0, DEFAULT_THRESHOLDS[effectiveRisk]);
  const base = {
    risk: input.risk,
    effectiveRisk,
    matchesRequest: matches,
    userApproved: a.user_approved.noul >= 0.5,
  };

  if (matches < 0.5) {
    return {
      ...base,
      verdict: "escalate",
      reason: "the action does not look like what the user asked for: a person decides",
      confidence: 1 - matches,
      threshold: minConfidence,
    };
  }

  const g = gate(a.matches_request, { action: "agent_action", risk: effectiveRisk, minConfidence }, opts);
  const raised = effectiveRisk !== input.risk ? `; it looks riskier than "${input.risk}", so the ${effectiveRisk} bar applies` : "";
  return { ...base, verdict: g.verdict, reason: g.reason + raised, confidence: g.confidence, threshold: g.threshold };
}

export async function decideActionGate(brain: Brain, input: ActionGateInput) {
  const state: State = {
    action: input.action,
    user_request: input.request,
    stated_risk: input.risk,
    ...(input.context ? { context: input.context } : {}),
  };
  const decision = await brain.decide("gate.action", state, actionGateQuestions());
  return { decision, route: routeActionGate(decision.answers, input, { calibrated: decision.calibrated }) };
}
