import Anthropic from "@anthropic-ai/sdk";
import { generateText, jsonSchema, Output } from "ai";

/**
 * The model router. The harness works with whichever model the founder uses
 * and pays for; nothing else in the package knows which one it is.
 *
 *  - "gateway": any "provider/model" id (anthropic/claude-opus-5, openai/…, xai/…, google/…)
 *    through Vercel AI Gateway. AI_GATEWAY_API_KEY, or the OIDC token on Vercel. Provider keys
 *    can be brought to the gateway (BYOK) in the Vercel dashboard.
 *  - "openai-compatible": any /chat/completions endpoint: OpenRouter, xAI, a local model in
 *    Ollama or LM Studio. GTM_BASE_URL + GTM_API_KEY, or OPENROUTER_API_KEY for a "provider/model" id.
 *  - "anthropic": Claude through the Anthropic API (ANTHROPIC_API_KEY). The default.
 *
 * Explicit beats implicit: a "provider/model" id goes through a router, a bare id goes to
 * Anthropic, and with nothing configured the caller falls back to templates.
 */
export type ModelRoute =
  | { readonly kind: "anthropic"; readonly model: string }
  | { readonly kind: "gateway"; readonly model: string }
  | { readonly kind: "openai-compatible"; readonly model: string; readonly baseUrl: string; readonly apiKey?: string; readonly label: string };

export const DEFAULT_MODEL = "claude-opus-5";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1";

type Env = Record<string, string | undefined>;

export class ModelError extends Error {}

export function routeModel(env: Env = process.env, override?: string): ModelRoute | null {
  // `||`, not `??`: a blank GTM_MODEL= copied from .env.example must not become the model name.
  const model = (override || env.GTM_MODEL || "").trim();
  const baseUrl = (env.GTM_BASE_URL || "").trim().replace(/\/+$/, "");
  if (baseUrl) {
    if (!model) return null;
    return { kind: "openai-compatible", model, baseUrl, ...(env.GTM_API_KEY ? { apiKey: env.GTM_API_KEY } : {}), label: hostLabel(baseUrl) };
  }
  if (model.includes("/")) {
    if (env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN) return { kind: "gateway", model };
    if (env.OPENROUTER_API_KEY) return { kind: "openai-compatible", model, baseUrl: OPENROUTER_URL, apiKey: env.OPENROUTER_API_KEY, label: "OpenRouter" };
    return null;
  }
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN) return { kind: "anthropic", model: model || DEFAULT_MODEL };
  return null;
}

/** What to tell a person about the route, e.g. "openai/gpt-5 via Vercel AI Gateway". */
export function describeRoute(route: ModelRoute): string {
  switch (route.kind) {
    case "anthropic":
      return `${route.model} via the Anthropic API`;
    case "gateway":
      return `${route.model} via Vercel AI Gateway`;
    case "openai-compatible":
      return `${route.model} via ${route.label}`;
  }
}

function hostLabel(baseUrl: string): string {
  try {
    const host = new URL(baseUrl).hostname;
    if (host === "localhost" || host === "127.0.0.1") return "a local model server";
    if (host.endsWith("openrouter.ai")) return "OpenRouter";
    if (host.endsWith("x.ai")) return "xAI";
    return host;
  } catch {
    return "a custom endpoint";
  }
}

export interface StructuredRequest {
  readonly system: string;
  readonly prompt: string;
  /** A JSON schema with closed objects and every property required: the portable subset. */
  readonly schema: Record<string, unknown>;
  readonly name: string;
  readonly maxTokens?: number;
  readonly effort?: "low" | "medium" | "high";
  readonly signal?: AbortSignal;
}

/** What one call used. Cost only when the router reports it (AI Gateway, OpenRouter); never estimated. */
export interface Usage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly costUsd?: number;
}

export interface StructuredResult {
  readonly value: unknown;
  readonly model: string;
  readonly usage: Usage;
}

function usageOf(inputTokens: unknown, outputTokens: unknown, cost?: unknown): Usage {
  const count = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : undefined);
  const usd = cost === null || cost === undefined || cost === "" ? undefined : count(Number(cost));
  const input = count(inputTokens);
  const output = count(outputTokens);
  return { ...(input !== undefined ? { inputTokens: input } : {}), ...(output !== undefined ? { outputTokens: output } : {}), ...(usd !== undefined ? { costUsd: usd } : {}) };
}

/** The gateway call, injectable so tests never touch the network. */
export type GatewayCall = (args: {
  model: string;
  instructions: string;
  prompt: string;
  schema: Record<string, unknown>;
  name: string;
  maxOutputTokens: number;
  abortSignal?: AbortSignal;
}) => Promise<{ output: unknown; modelId?: string; usage?: Usage }>;

export interface ModelDeps {
  readonly anthropic?: Anthropic;
  readonly gateway?: GatewayCall;
  readonly fetch?: typeof fetch;
}

/** One structured answer from whichever model the route names. Callers validate the value. */
export async function generateStructured(route: ModelRoute, req: StructuredRequest, deps: ModelDeps = {}): Promise<StructuredResult> {
  switch (route.kind) {
    case "anthropic":
      return viaAnthropic(route, req, deps.anthropic ?? new Anthropic());
    case "gateway":
      return viaGateway(route, req, deps.gateway ?? callGateway);
    case "openai-compatible":
      return viaOpenAICompatible(route, req, deps.fetch ?? fetch);
  }
}

function supportsDefaultFallbacks(model: string): boolean {
  return /^claude-(opus-5|fable-5)/.test(model);
}

async function viaAnthropic(route: Extract<ModelRoute, { kind: "anthropic" }>, req: StructuredRequest, client: Anthropic): Promise<StructuredResult> {
  const response = await client.beta.messages.create(
    {
      model: route.model,
      max_tokens: req.maxTokens ?? 8000,
      ...(supportsDefaultFallbacks(route.model) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      output_config: { effort: req.effort ?? "low", format: { type: "json_schema", schema: req.schema } },
      system: req.system,
      messages: [{ role: "user", content: req.prompt }],
    },
    req.signal ? { signal: req.signal } : undefined,
  );
  if (response.stop_reason === "refusal") throw new ModelError("the model declined to answer");
  if (response.stop_reason === "max_tokens") throw new ModelError("the answer was cut off");
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const u = response.usage as Partial<typeof response.usage> | undefined;
  const input = u?.input_tokens === undefined ? undefined : u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
  return { value: parseJson(text), model: response.model, usage: usageOf(input, u?.output_tokens) };
}

const callGateway: GatewayCall = async (args) => {
  const result = await generateText({
    model: args.model,
    instructions: args.instructions,
    prompt: args.prompt,
    output: Output.object({ schema: jsonSchema(args.schema), name: args.name }),
    maxOutputTokens: args.maxOutputTokens,
    maxRetries: 1,
    ...(args.abortSignal ? { abortSignal: args.abortSignal } : {}),
  });
  return {
    output: result.output,
    modelId: result.response.modelId,
    usage: usageOf(result.usage.inputTokens, result.usage.outputTokens, result.providerMetadata?.gateway?.cost),
  };
};

async function viaGateway(route: Extract<ModelRoute, { kind: "gateway" }>, req: StructuredRequest, call: GatewayCall): Promise<StructuredResult> {
  const { output, modelId, usage } = await call({
    model: route.model,
    instructions: req.system,
    prompt: req.prompt,
    schema: req.schema,
    name: req.name,
    maxOutputTokens: req.maxTokens ?? 8000,
    ...(req.signal ? { abortSignal: req.signal } : {}),
  });
  if (output === undefined || output === null) throw new ModelError("the model returned no structured output");
  return { value: output, model: modelId ?? route.model, usage: usage ?? {} };
}

async function viaOpenAICompatible(
  route: Extract<ModelRoute, { kind: "openai-compatible" }>,
  req: StructuredRequest,
  doFetch: typeof fetch,
): Promise<StructuredResult> {
  const res = await doFetch(`${route.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(route.apiKey ? { authorization: `Bearer ${route.apiKey}` } : {}) },
    body: JSON.stringify({
      model: route.model,
      max_tokens: req.maxTokens ?? 8000,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.prompt },
      ],
      response_format: { type: "json_schema", json_schema: { name: req.name, strict: true, schema: req.schema } },
    }),
    ...(req.signal ? { signal: req.signal } : {}),
  });
  if (!res.ok) throw new ModelError(`${route.label} answered ${res.status}`);
  const body = (await res.json().catch(() => null)) as {
    model?: string;
    choices?: { finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  } | null;
  const choice = body?.choices?.[0];
  if (!choice?.message) throw new ModelError(`${route.label} returned no answer`);
  if (choice.message.refusal) throw new ModelError("the model declined to answer");
  if (choice.finish_reason === "length") throw new ModelError("the answer was cut off");
  return {
    value: parseJson(choice.message.content ?? ""),
    model: body?.model ?? route.model,
    usage: usageOf(body?.usage?.prompt_tokens, body?.usage?.completion_tokens, body?.usage?.cost),
  };
}

/** Parses a JSON answer, tolerating the ```json fences some local models add. */
function parseJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new ModelError("the model returned text that isn't JSON");
  }
}
