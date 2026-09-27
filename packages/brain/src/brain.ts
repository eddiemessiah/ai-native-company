import { costUsd, estimateTokens, pricingFor } from "./cost";
import { consoleSink, stateToText, toRecord, type DecisionSink } from "./log";
import { normalizedEntropy } from "./math";
import { gate, type ActionPolicy, type GateResult } from "./policy";
import { lintQuestions } from "./questions";
import type {
  Answer,
  AnswersFor,
  Decision,
  DecisionProvider,
  Diagnostic,
  ProviderAttempt,
  QuestionSet,
  State,
} from "./types";

export interface BrainOptions {
  /** Tried in order. Put the calibrated System One model first and fallbacks after it. */
  readonly providers: readonly DecisionProvider[];
  readonly sinks?: readonly DecisionSink[];
  /** Per-attempt timeout. System One calls are 70–500 ms; anything near this is an outage, not slowness. */
  readonly timeoutMs?: number;
  /** Store the raw state in decision records. Off by default: state often holds customer data. */
  readonly includeStateInLogs?: boolean;
  /** Normalized entropy above which a Choice/Score answer is flagged as flat. */
  readonly flatThreshold?: number;
  readonly now?: () => Date;
  readonly id?: () => string;
}

export interface DecideOptions {
  readonly signal?: AbortSignal;
  readonly meta?: Readonly<Record<string, unknown>>;
  /** Gate answers against action policies in the same call; results are logged with the decision. */
  readonly policies?: Readonly<Record<string, ActionPolicy>>;
}

export class BrainError extends Error {
  constructor(
    message: string,
    readonly attempts: readonly ProviderAttempt[],
  ) {
    super(message);
    this.name = "BrainError";
  }
}

export class Brain {
  private readonly providers: readonly DecisionProvider[];
  private readonly sinks: readonly DecisionSink[];
  private readonly timeoutMs: number;
  private readonly flatThreshold: number;

  constructor(private readonly opts: BrainOptions) {
    if (opts.providers.length === 0) throw new Error("Brain needs at least one provider");
    this.providers = opts.providers;
    this.sinks = opts.sinks ?? [consoleSink];
    this.timeoutMs = opts.timeoutMs ?? 8_000;
    this.flatThreshold = opts.flatThreshold ?? 0.92;
  }

  get providerNames(): string[] {
    return this.providers.map((p) => p.name);
  }

  /**
   * Ask every question in one pass. Questions run in parallel on a System One
   * model, so ask everything up front and let code decide what was relevant.
   */
  async decide<Qs extends QuestionSet>(
    name: string,
    state: State,
    questions: Qs,
    options: DecideOptions = {},
  ): Promise<Decision<Qs> & { gates: Readonly<Record<string, GateResult>> }> {
    const diagnostics: Diagnostic[] = lintQuestions(questions);
    const attempts: ProviderAttempt[] = [];
    const inputTokens = estimateTokens(stateToText(state)) + estimateTokens(JSON.stringify(questions));

    for (const provider of this.providers) {
      const started = performance.now();
      const signal = combine(options.signal, AbortSignal.timeout(this.timeoutMs));
      try {
        const result = await provider.decide({ state, questions, signal });
        validateAnswers(questions, result.answers);
        const latencyMs = Math.round(performance.now() - started);
        const pricing = pricingFor(provider.name) ?? pricingFor(result.model);
        const cost =
          result.usage?.costUsd ??
          (pricing
            ? costUsd(pricing, result.usage?.inputTokens ?? inputTokens, result.usage?.outputTokens ?? 0)
            : 0);

        diagnostics.push(...this.flatness(questions, result.answers));

        const decision: Decision<Qs> = {
          id: this.opts.id?.() ?? crypto.randomUUID(),
          name,
          at: (this.opts.now?.() ?? new Date()).toISOString(),
          answers: result.answers,
          provider: provider.name,
          model: result.model,
          calibrated: provider.calibrated,
          latencyMs,
          costUsd: cost,
          inputTokens: result.usage?.inputTokens ?? inputTokens,
          ...(result.requestId ? { requestId: result.requestId } : {}),
          attempts,
          diagnostics,
        };

        const gates: Record<string, GateResult> = {};
        for (const [question, policy] of Object.entries(options.policies ?? {})) {
          const answer = (result.answers as Record<string, Answer>)[question];
          if (answer) gates[question] = gate(answer, policy, { calibrated: provider.calibrated });
        }

        await this.log(decision, state, questions, Object.values(gates), options.meta);
        return { ...decision, gates };
      } catch (error) {
        if (options.signal?.aborted) throw error;
        attempts.push({
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error),
          latencyMs: Math.round(performance.now() - started),
        });
      }
    }
    throw new BrainError(
      `All decision providers failed for "${name}": ${attempts.map((a) => `${a.provider}: ${a.error}`).join("; ")}`,
      attempts,
    );
  }

  private flatness<Qs extends QuestionSet>(questions: Qs, answers: AnswersFor<Qs>): Diagnostic[] {
    const out: Diagnostic[] = [];
    for (const name of Object.keys(questions)) {
      const a = (answers as Record<string, Answer>)[name];
      if (!a || a.type === "noul") continue;
      const probs = a.type === "choice" ? Object.values<number>(a.probabilities) : a.probabilities;
      const h = normalizedEntropy(probs);
      if (h >= this.flatThreshold) {
        out.push({
          level: "warn",
          code: "flat-distribution",
          question: name,
          message: `"${name}": probabilities are nearly flat (entropy ${h.toFixed(2)}). The options were not distinguishable from this state; fix the criteria or send the fields the question needs.`,
        });
      }
    }
    return out;
  }

  private async log<Qs extends QuestionSet>(
    decision: Decision<Qs>,
    state: State,
    questions: Qs,
    gates: readonly GateResult[],
    meta?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    if (this.sinks.length === 0) return;
    const record = await toRecord(decision, state, questions, {
      includeState: this.opts.includeStateInLogs ?? false,
      gates,
      ...(meta ? { meta } : {}),
    });
    await Promise.all(
      this.sinks.map(async (sink) => {
        try {
          await sink.write(record);
        } catch (error) {
          console.warn(`[brain] decision sink failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }),
    );
  }
}

/** Rejects provider output that doesn't match the schema asked for, so the brain can fall back instead of acting on it. */
export function validateAnswers(questions: QuestionSet, answers: unknown): void {
  if (!answers || typeof answers !== "object") throw new Error("provider returned no answers");
  const map = answers as Record<string, Answer | undefined>;
  for (const [name, q] of Object.entries(questions)) {
    const a = map[name];
    if (!a) throw new Error(`missing answer for "${name}"`);
    if (a.type !== q.type) throw new Error(`"${name}": expected ${q.type}, got ${a.type}`);
    if (a.type === "choice" && q.type === "choice") {
      if (!(a.choice in q.criteria)) throw new Error(`"${name}": choice "${a.choice}" is not one of the options`);
      assertProbability(a.confidence, `${name}.confidence`);
    }
    if (a.type === "score" && q.type === "score") {
      if (a.probabilities.length !== q.criteria.length) {
        throw new Error(`"${name}": expected ${q.criteria.length} level probabilities`);
      }
      if (!(a.score >= 0 && a.score <= q.criteria.length - 1)) throw new Error(`"${name}": score out of range`);
      assertProbability(a.confidence, `${name}.confidence`);
    }
    if (a.type === "noul") assertProbability(a.noul, `${name}.noul`);
  }
}

function assertProbability(x: number, label: string): void {
  if (!(typeof x === "number" && x >= 0 && x <= 1)) throw new Error(`${label} must be a probability in [0, 1]`);
}

function combine(a: AbortSignal | undefined, b: AbortSignal): AbortSignal {
  return a ? AbortSignal.any([a, b]) : b;
}
