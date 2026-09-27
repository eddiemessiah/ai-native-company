import { TypeSafeClient, type EntryType, type Questions as JevQuestions } from "@typesafe-ai/sdk";
import { experimental_evaluate } from "ai";
import { argmax, clamp01, normalize } from "../math";
import type {
  Answer,
  AnswersFor,
  DecisionProvider,
  ProviderRequest,
  ProviderResult,
  QuestionSet,
  State,
} from "../types";

/**
 * Jev, TypeSafe's System One model: typed answers with calibrated
 * probabilities in one parallel pass. Three ways in, same answers out:
 *
 *  - "typesafe":   direct API through the official SDK (TYPESAFE_API_KEY; early access is waitlisted)
 *  - "gateway":    Vercel AI Gateway via AI SDK 7's experimental_evaluate (AI_GATEWAY_API_KEY or Vercel OIDC)
 *  - "openrouter": OpenRouter's decisions endpoint (OPENROUTER_API_KEY)
 *
 * Pin a model version once thresholds are tuned: jev-latest moves when a
 * release ships, and a silent bump changes every decision.
 */
export type JevTransport = "typesafe" | "gateway" | "openrouter";

export interface JevProviderOptions {
  readonly transport?: JevTransport;
  readonly model?: string;
  readonly apiKey?: string;
  readonly client?: TypeSafeClient;
  readonly fetch?: typeof fetch;
  /** Per-attempt timeout for the direct SDK (it retries once more on 408/429/5xx). */
  readonly timeoutMs?: number;
}

const DEFAULT_MODEL: Record<JevTransport, string> = {
  typesafe: "jev-1.13.0",
  gateway: "typesafe-ai/jev-latest",
  openrouter: "~typesafe/jev-latest",
};

export function detectJevTransport(env: Record<string, string | undefined> = process.env): JevTransport | undefined {
  if (env.TYPESAFE_API_KEY) return "typesafe";
  if (env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN) return "gateway";
  if (env.OPENROUTER_API_KEY) return "openrouter";
  return undefined;
}

export class JevProvider implements DecisionProvider {
  readonly name = "jev";
  readonly calibrated = true;
  readonly transport: JevTransport;
  private readonly model: string;
  private readonly client?: TypeSafeClient;
  private readonly apiKey?: string;
  private readonly fetcher: typeof fetch;

  constructor(opts: JevProviderOptions = {}) {
    this.transport = opts.transport ?? detectJevTransport() ?? "typesafe";
    this.model = opts.model ?? (this.transport === "typesafe" ? process.env.JEV_MODEL : undefined) ?? DEFAULT_MODEL[this.transport];
    this.fetcher = opts.fetch ?? fetch;
    if (this.transport === "typesafe") {
      this.client =
        opts.client ??
        new TypeSafeClient({
          ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
          defaultModel: this.model,
          timeout: opts.timeoutMs ?? 3_500,
          retry: { maxRetries: 1 },
          // "debug" would log request bodies (client data) unredacted.
          logLevel: "warn",
        });
    }
    if (this.transport === "openrouter") this.apiKey = opts.apiKey ?? process.env.OPENROUTER_API_KEY;
  }

  async decide<Qs extends QuestionSet>(req: ProviderRequest<Qs>): Promise<ProviderResult<Qs>> {
    switch (this.transport) {
      case "typesafe":
        return this.viaTypeSafe(req);
      case "gateway":
        return this.viaGateway(req);
      case "openrouter":
        return this.viaOpenRouter(req);
    }
  }

  private async viaTypeSafe<Qs extends QuestionSet>(req: ProviderRequest<Qs>): Promise<ProviderResult<Qs>> {
    // Our question objects are already the plain {type, instructions, criteria} shape the API takes.
    const { data, requestId } = await this.client!.systemOne(
      { state: toEntry(req.state), questions: req.questions as unknown as JevQuestions, model: this.model },
      req.signal ? { signal: req.signal } : undefined,
    ).withResponse();
    return {
      answers: fromJevAnswers(req.questions, data.answers as unknown as Record<string, unknown>),
      model: data.model,
      usage: { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens },
      ...(requestId ? { requestId } : {}),
    };
  }

  private async viaGateway<Qs extends QuestionSet>(req: ProviderRequest<Qs>): Promise<ProviderResult<Qs>> {
    const questions = Object.fromEntries(
      Object.entries(req.questions).map(([name, q]) => [
        name,
        q.type === "noul"
          ? { type: "boolean" as const, instructions: q.instructions }
          : q.type === "choice"
            ? { type: "choice" as const, instructions: q.instructions, criteria: q.criteria }
            : { type: "score" as const, instructions: q.instructions, criteria: q.criteria },
      ]),
    );
    const result = await experimental_evaluate({
      model: this.model,
      state: toEntry(req.state) as never,
      questions: questions as never,
      maxRetries: 1,
      ...(req.signal ? { abortSignal: req.signal } : {}),
    });
    const meta = (result as { providerMetadata?: Record<string, Record<string, unknown> | undefined> }).providerMetadata;
    const confidence = (meta?.typesafe?.confidence ?? {}) as Record<string, number>;
    const raw: Record<string, unknown> = {};
    for (const [name, a] of Object.entries(result.answers as Record<string, Record<string, unknown>>)) {
      raw[name] =
        a.type === "boolean"
          ? { type: "noul", noul: a.probability }
          : { ...a, ...(confidence[name] !== undefined ? { confidence: confidence[name] } : {}) };
    }
    const modelId = (result as { response?: { modelId?: string } }).response?.modelId ?? this.model;
    return {
      answers: fromJevAnswers(req.questions, raw),
      model: modelId,
      usage: {
        ...(result.usage.inputTokens !== undefined ? { inputTokens: result.usage.inputTokens } : {}),
        ...(result.usage.outputTokens !== undefined ? { outputTokens: result.usage.outputTokens } : {}),
      },
    };
  }

  private async viaOpenRouter<Qs extends QuestionSet>(req: ProviderRequest<Qs>): Promise<ProviderResult<Qs>> {
    if (!this.apiKey) throw new Error("OPENROUTER_API_KEY is not set");
    const res = await this.fetcher("https://openrouter.ai/api/alpha/decisions", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: this.model, state: toEntry(req.state), questions: req.questions }),
      ...(req.signal ? { signal: req.signal } : {}),
    });
    if (!res.ok) throw new Error(`OpenRouter decisions ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as {
      model?: string;
      answers?: Record<string, unknown>;
      usage?: { input_tokens?: number; output_tokens?: number; cost?: number };
    };
    return {
      answers: fromJevAnswers(req.questions, body.answers ?? {}),
      model: body.model ?? this.model,
      usage: {
        ...(body.usage?.input_tokens !== undefined ? { inputTokens: body.usage.input_tokens } : {}),
        ...(body.usage?.output_tokens !== undefined ? { outputTokens: body.usage.output_tokens } : {}),
        ...(body.usage?.cost !== undefined ? { costUsd: body.usage.cost } : {}),
      },
    };
  }
}

function toEntry(state: State): EntryType {
  // State is JSON by construction: a string, a JSON object, or an array of messages.
  return state as unknown as EntryType;
}

/**
 * Maps Jev's answer shapes onto ours. Jev rounds to two decimals and returns
 * score probabilities keyed by level index; we keep arrays and add the argmax level.
 */
export function fromJevAnswers<Qs extends QuestionSet>(questions: Qs, raw: Record<string, unknown>): AnswersFor<Qs> {
  const out: Record<string, Answer> = {};
  for (const [name, q] of Object.entries(questions)) {
    const a = (raw[name] ?? {}) as Record<string, unknown>;
    if (q.type === "choice") {
      const keys = Object.keys(q.criteria);
      const given = (a.probabilities ?? {}) as Record<string, number>;
      const probs = normalize(keys.map((k) => Number(given[k] ?? 0)));
      const choice = typeof a.choice === "string" && keys.includes(a.choice) ? a.choice : keys[argmax(probs)]!;
      out[name] = {
        type: "choice",
        choice,
        probabilities: Object.fromEntries(keys.map((k, i) => [k, probs[i] ?? 0])),
        confidence: clamp01(Number(a.confidence ?? probs[keys.indexOf(choice)] ?? 0)),
      };
    } else if (q.type === "score") {
      const given = a.probabilities as Record<string, number> | number[] | undefined;
      const probs = normalize(q.criteria.map((_, i) => Number((Array.isArray(given) ? given[i] : given?.[String(i)]) ?? 0)));
      const level = argmax(probs);
      out[name] = {
        type: "score",
        score: Math.min(q.criteria.length - 1, Math.max(0, Number(a.score ?? level))),
        level,
        probabilities: probs,
        confidence: clamp01(Number(a.confidence ?? probs[level] ?? 0)),
      };
    } else {
      out[name] = { type: "noul", noul: clamp01(Number(a.noul ?? a.probability ?? 0.5)) };
    }
  }
  return out as AnswersFor<Qs>;
}
