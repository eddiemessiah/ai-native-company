/**
 * Token and cost estimates. Prices are USD per million tokens as published by
 * each vendor (TypeSafe Jev: Sept 2026 launch pricing; Anthropic: 2026 list
 * prices). Pricing moves; treat these as defaults and override per deployment.
 */
export interface Pricing {
  readonly inputPerMTok: number;
  readonly outputPerMTok: number;
}

export const PRICING: Readonly<Record<string, Pricing>> = {
  jev: { inputPerMTok: 0.042, outputPerMTok: 0 },
  "claude-opus-5": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-sonnet-5": { inputPerMTok: 2, outputPerMTok: 10 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },
  heuristic: { inputPerMTok: 0, outputPerMTok: 0 },
};

/** Rough token count (≈4 characters per token for English text and JSON). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function costUsd(pricing: Pricing, inputTokens: number, outputTokens = 0): number {
  return (inputTokens * pricing.inputPerMTok + outputTokens * pricing.outputPerMTok) / 1_000_000;
}

export function pricingFor(providerOrModel: string): Pricing | undefined {
  if (PRICING[providerOrModel]) return PRICING[providerOrModel];
  if (providerOrModel.startsWith("jev")) return PRICING.jev;
  return undefined;
}

/**
 * What the same decision volume costs on a System One model versus a
 * generative model. Used by the Decision Router audit to size savings.
 */
export function compareCost(opts: {
  decisionsPerMonth: number;
  inputTokensPerDecision: number;
  llmOutputTokensPerDecision: number;
  llm: Pricing;
  systemOne?: Pricing;
}): { llmUsd: number; systemOneUsd: number; savingsUsd: number; ratio: number } {
  const s1 = opts.systemOne ?? PRICING.jev!;
  const llmUsd =
    opts.decisionsPerMonth * costUsd(opts.llm, opts.inputTokensPerDecision, opts.llmOutputTokensPerDecision);
  const systemOneUsd = opts.decisionsPerMonth * costUsd(s1, opts.inputTokensPerDecision, 0);
  return {
    llmUsd,
    systemOneUsd,
    savingsUsd: llmUsd - systemOneUsd,
    ratio: systemOneUsd > 0 ? llmUsd / systemOneUsd : Infinity,
  };
}
