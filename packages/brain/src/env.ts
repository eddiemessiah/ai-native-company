import { Brain, type BrainOptions } from "./brain";
import type { DecisionSink } from "./log";
import { AnthropicProvider } from "./providers/anthropic";
import { HeuristicProvider } from "./providers/heuristic";
import { detectJevTransport, JevProvider } from "./providers/jev";
import type { DecisionProvider } from "./types";

type Env = Record<string, string | undefined>;

/**
 * Builds the provider chain from whatever keys are configured:
 * Jev (calibrated) first, then the Claude fallback (uncalibrated), then,
 * only where allowed, the lexical heuristic for free demos and local dev.
 */
export function providersFromEnv(env: Env = process.env, opts: { allowHeuristic?: boolean } = {}): DecisionProvider[] {
  const providers: DecisionProvider[] = [];
  const transport = detectJevTransport(env);
  if (transport) {
    providers.push(
      new JevProvider({
        transport,
        ...(transport === "typesafe" && env.JEV_MODEL ? { model: env.JEV_MODEL } : {}),
        ...(transport === "typesafe" && env.TYPESAFE_API_KEY ? { apiKey: env.TYPESAFE_API_KEY } : {}),
      }),
    );
  }
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN) {
    providers.push(new AnthropicProvider(env.BRAIN_FALLBACK_MODEL ? { model: env.BRAIN_FALLBACK_MODEL } : {}));
  }
  if (opts.allowHeuristic ?? true) providers.push(new HeuristicProvider());
  return providers;
}

export function brainFromEnv(
  opts: { env?: Env; allowHeuristic?: boolean; sinks?: readonly DecisionSink[] } & Omit<BrainOptions, "providers" | "sinks"> = {},
): Brain {
  const { env, allowHeuristic, sinks, ...rest } = opts;
  const providers = providersFromEnv(env, allowHeuristic === undefined ? {} : { allowHeuristic });
  if (providers.length === 0) throw new Error("No decision provider configured");
  return new Brain({ providers, ...(sinks ? { sinks } : {}), ...rest });
}
