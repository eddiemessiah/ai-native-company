import type { Answer, Decision, Diagnostic, ProviderAttempt, QuestionSet, State } from "./types";
import type { GateResult } from "./policy";

/**
 * One line per decision. Thin logging at the highest-volume layer is what
 * makes a misrouted batch unreconstructable, so every decision records the
 * model version, the full probabilities and the confidence.
 *
 * The raw state is not stored by default (it may hold customer data); a
 * SHA-256 of it is, so a decision can be matched to its input later.
 */
export interface DecisionRecord {
  readonly id: string;
  readonly name: string;
  readonly at: string;
  readonly provider: string;
  readonly model: string;
  readonly calibrated: boolean;
  readonly latencyMs: number;
  readonly costUsd: number;
  readonly inputTokens: number;
  readonly requestId?: string;
  readonly stateHash: string;
  readonly state?: State;
  readonly questions: readonly { name: string; type: string; options?: readonly string[]; levels?: number }[];
  readonly answers: Readonly<Record<string, Answer>>;
  readonly gates?: readonly GateResult[];
  readonly attempts: readonly ProviderAttempt[];
  readonly diagnostics: readonly Diagnostic[];
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface DecisionSink {
  write(record: DecisionRecord): void | Promise<void>;
}

export class MemorySink implements DecisionSink {
  readonly records: DecisionRecord[] = [];
  constructor(private readonly limit = 1000) {}
  write(record: DecisionRecord): void {
    this.records.push(record);
    if (this.records.length > this.limit) this.records.shift();
  }
}

export const consoleSink: DecisionSink = {
  write(record) {
    const summary = Object.entries(record.answers)
      .map(([name, a]) => `${name}=${describeAnswer(a)}`)
      .join(" ");
    console.info(
      `[brain] ${record.name} via ${record.provider}/${record.model} ${record.latencyMs}ms $${record.costUsd.toFixed(6)} ${summary}`,
    );
  },
};

/** POSTs each record as JSON (e.g. to a log drain, Slack/Telegram relay, or warehouse ingest). */
export function webhookSink(url: string, headers: Record<string, string> = {}): DecisionSink {
  return {
    async write(record) {
      await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(record),
      });
    },
  };
}

export function describeAnswer(a: Answer): string {
  switch (a.type) {
    case "choice":
      return `${a.choice}(${a.confidence.toFixed(2)})`;
    case "score":
      return `${a.score.toFixed(2)}(${a.confidence.toFixed(2)})`;
    case "noul":
      return a.noul.toFixed(2);
  }
}

export async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function stateToText(state: State): string {
  return typeof state === "string" ? state : JSON.stringify(state);
}

export async function toRecord<Qs extends QuestionSet>(
  decision: Decision<Qs>,
  state: State,
  questions: Qs,
  opts: { includeState?: boolean; gates?: readonly GateResult[]; meta?: Readonly<Record<string, unknown>> } = {},
): Promise<DecisionRecord> {
  return {
    id: decision.id,
    name: decision.name,
    at: decision.at,
    provider: decision.provider,
    model: decision.model,
    calibrated: decision.calibrated,
    latencyMs: decision.latencyMs,
    costUsd: decision.costUsd,
    inputTokens: decision.inputTokens,
    ...(decision.requestId ? { requestId: decision.requestId } : {}),
    stateHash: await sha256(stateToText(state)),
    ...(opts.includeState ? { state } : {}),
    questions: Object.entries(questions).map(([name, q]) => ({
      name,
      type: q.type,
      ...(q.type === "choice" ? { options: Object.keys(q.criteria) } : {}),
      ...(q.type === "score" ? { levels: q.criteria.length } : {}),
    })),
    answers: decision.answers as Readonly<Record<string, Answer>>,
    ...(opts.gates ? { gates: opts.gates } : {}),
    attempts: decision.attempts,
    diagnostics: decision.diagnostics,
    ...(opts.meta ? { meta: opts.meta } : {}),
  };
}
