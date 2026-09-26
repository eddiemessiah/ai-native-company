/**
 * Core types for the "System One" decision layer.
 *
 * The split this package enforces:
 *   - LLMs write (briefs, emails, code, explanations).
 *   - A System One model decides (pick from a list, place on a scale, yes/no).
 *   - Code executes, and owns anything exact or irreversible.
 *
 * Question and answer shapes mirror TypeSafe's Jev primitives (Choice, Score,
 * Noul) so any provider can stand in for Jev behind the same interface.
 */

export type Message = {
  readonly role: "system" | "user" | "assistant" | "tool";
  readonly content: string;
};

/** Whatever context matters for the decision. Prefer an object over a string when there is more than one piece of context. */
export type State = string | Readonly<Record<string, unknown>> | readonly Message[];

export interface ChoiceQuestion<K extends string = string> {
  readonly type: "choice";
  readonly instructions: string;
  /** option key -> description. The description is part of the instruction: the model never sees your variable names. */
  readonly criteria: Readonly<Record<K, string>>;
}

export interface ScoreQuestion {
  readonly type: "score";
  readonly instructions: string;
  /** Ordered levels, lowest first. Level index comes from array order. 2–10 levels. */
  readonly criteria: readonly string[];
}

export interface NoulQuestion {
  readonly type: "noul";
  readonly instructions: string;
}

export type Question = ChoiceQuestion<string> | ScoreQuestion | NoulQuestion;
export type QuestionSet = Readonly<Record<string, Question>>;

export interface ChoiceAnswer<K extends string = string> {
  readonly type: "choice";
  readonly choice: K;
  readonly probabilities: Readonly<Record<K, number>>;
  readonly confidence: number;
}

export interface ScoreAnswer {
  readonly type: "score";
  /** Position on the scale; can land between levels (e.g. 1.035). */
  readonly score: number;
  /** Most likely level index (argmax of probabilities). */
  readonly level: number;
  readonly probabilities: readonly number[];
  readonly confidence: number;
}

export interface NoulAnswer {
  readonly type: "noul";
  /** Probability the answer is yes. There is no separate confidence: the number is the belief. */
  readonly noul: number;
}

export type Answer = ChoiceAnswer<string> | ScoreAnswer | NoulAnswer;

export type AnswerFor<Q> = Q extends ChoiceQuestion<infer K>
  ? ChoiceAnswer<K>
  : Q extends ScoreQuestion
    ? ScoreAnswer
    : Q extends NoulQuestion
      ? NoulAnswer
      : never;

export type AnswersFor<Qs extends QuestionSet> = { readonly [N in keyof Qs]: AnswerFor<Qs[N]> };

export interface ProviderRequest<Qs extends QuestionSet> {
  readonly state: State;
  readonly questions: Qs;
  readonly signal?: AbortSignal;
}

export interface ProviderUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  /** Exact cost when the provider reports one; otherwise the brain estimates it. */
  readonly costUsd?: number;
}

export interface ProviderResult<Qs extends QuestionSet> {
  readonly answers: AnswersFor<Qs>;
  /** Exact model version that answered. Log it: a silent version bump changes every threshold you tuned. */
  readonly model: string;
  readonly usage?: ProviderUsage;
  readonly requestId?: string;
}

export interface DecisionProvider {
  readonly name: string;
  /**
   * True only when the provider's probabilities are trained against outcomes
   * (Jev's RLCD). LLM self-reported probabilities and heuristics are not
   * calibrated, so policy gates treat them more conservatively.
   */
  readonly calibrated: boolean;
  decide<Qs extends QuestionSet>(req: ProviderRequest<Qs>): Promise<ProviderResult<Qs>>;
}

export type DiagnosticLevel = "info" | "warn" | "error";

export interface Diagnostic {
  readonly level: DiagnosticLevel;
  readonly code: string;
  readonly question?: string;
  readonly message: string;
}

export interface ProviderAttempt {
  readonly provider: string;
  readonly error: string;
  readonly latencyMs: number;
}

export interface Decision<Qs extends QuestionSet> {
  readonly id: string;
  /** Stable name for this decision point, e.g. "lead.route". Used for logs and per-decision thresholds. */
  readonly name: string;
  readonly at: string;
  readonly answers: AnswersFor<Qs>;
  readonly provider: string;
  readonly model: string;
  readonly calibrated: boolean;
  readonly latencyMs: number;
  readonly costUsd: number;
  readonly inputTokens: number;
  readonly requestId?: string;
  /** Providers that failed before this one answered. */
  readonly attempts: readonly ProviderAttempt[];
  readonly diagnostics: readonly Diagnostic[];
}
