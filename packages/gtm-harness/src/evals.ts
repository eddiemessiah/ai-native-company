import type { GtmInput } from "./input";
import { describeRoute, routeModel, type ModelDeps, type ModelRoute, type Usage } from "./models";
import { generatePlan, type GtmPlan } from "./plan";

/**
 * Evals before claims: a model counts as supported only after the same founder input,
 * run several times, comes back as a valid plan with honest drafts. The table these
 * produce is what "works with any model" rests on.
 */

export interface EvalRun {
  readonly ok: boolean;
  readonly seconds: number;
  /** Claim-like numbers in the drafts that the founder never gave us. */
  readonly inventedNumbers: readonly string[];
  readonly usage?: Usage;
  readonly error?: string;
}

export interface EvalRow {
  readonly model: string;
  readonly route: string;
  readonly runs: number;
  readonly valid: number;
  readonly honest: number;
  readonly medianSeconds: number;
  /** Medians over the valid runs; absent when the route didn't report them. */
  readonly medianInputTokens?: number;
  readonly medianOutputTokens?: number;
  /** Only when every valid run reported a cost: a partial median would mislead. */
  readonly medianCostUsd?: number;
  readonly errors: readonly string[];
}

/**
 * Numbers that read like claims (percentages, money, multiples, counts of users or customers)
 * and don't appear in what the founder wrote. Durations in an ask ("a 10-minute call") pass.
 */
export function inventedNumbers(text: string, founderWords: string): string[] {
  const claimLike = /(?:[$€£₦]\s?\d[\d,.]*\s?(?:k|m|bn|million|billion)?|\d[\d,.]*\s?(?:%|x\b|k\b|m\b|million|billion)|\d[\d,.]*\+?\s(?:users|customers|clients|teams|companies|businesses|downloads|merchants|traders|members|transactions))/gi;
  const known = new Set((founderWords.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")));
  return (text.match(claimLike) ?? []).filter((m) => {
    const digits = m.match(/\d[\d,.]*/)?.[0]?.replace(/[,.]$/, "") ?? "";
    return !known.has(digits);
  });
}

function founderWords(input: GtmInput): string {
  return [input.product, input.pitch, input.audience, input.goal, input.regions ?? "", input.url ?? ""].join(" ");
}

export function checkPlan(plan: GtmPlan, input: GtmInput): string[] {
  const words = founderWords(input);
  return plan.drafts.flatMap((d) => inventedNumbers(d.text, words));
}

export async function evalModel(
  model: string,
  input: GtmInput,
  opts: { runs?: number; env?: Record<string, string | undefined>; deps?: ModelDeps; route?: ModelRoute } = {},
): Promise<EvalRow> {
  const route = opts.route ?? routeModel({ ...(opts.env ?? process.env), GTM_MODEL: model });
  if (!route) {
    return { model, route: "not configured", runs: 0, valid: 0, honest: 0, medianSeconds: 0, errors: ["no route: set AI_GATEWAY_API_KEY, OPENROUTER_API_KEY or GTM_BASE_URL"] };
  }
  const results: EvalRun[] = [];
  for (let i = 0; i < (opts.runs ?? 5); i++) {
    const started = performance.now();
    try {
      const { plan, usage } = await generatePlan(input, { route, ...(opts.deps ? { deps: opts.deps } : {}), signal: AbortSignal.timeout(180_000) });
      results.push({ ok: true, seconds: (performance.now() - started) / 1000, inventedNumbers: checkPlan(plan, input), ...(usage ? { usage } : {}) });
    } catch (error) {
      results.push({ ok: false, seconds: (performance.now() - started) / 1000, inventedNumbers: [], error: error instanceof Error ? error.message : String(error) });
    }
  }
  const valid = results.filter((r) => r.ok);
  const inputTokens = median(valid.map((r) => r.usage?.inputTokens));
  const outputTokens = median(valid.map((r) => r.usage?.outputTokens));
  const costs = valid.map((r) => r.usage?.costUsd);
  const costUsd = costs.length > 0 && costs.every((c) => c !== undefined) ? median(costs) : undefined;
  return {
    model,
    route: describeRoute(route),
    runs: results.length,
    valid: valid.length,
    honest: valid.filter((r) => r.inventedNumbers.length === 0).length,
    medianSeconds: Math.round((median(results.map((r) => r.seconds)) ?? 0) * 10) / 10,
    ...(inputTokens !== undefined ? { medianInputTokens: inputTokens } : {}),
    ...(outputTokens !== undefined ? { medianOutputTokens: outputTokens } : {}),
    ...(costUsd !== undefined ? { medianCostUsd: costUsd } : {}),
    errors: [...new Set(results.flatMap((r) => (r.error ? [r.error] : r.inventedNumbers.map((n) => `invented: ${n}`))))].slice(0, 5),
  };
}

/** The upper median of the defined values, or undefined when there are none. */
function median(values: readonly (number | undefined)[]): number | undefined {
  const sorted = values.filter((v): v is number => v !== undefined).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Supported means every run came back valid and honest. */
export function supported(row: EvalRow): boolean {
  return row.runs > 0 && row.valid === row.runs && row.honest === row.runs;
}

export function evalTable(rows: readonly EvalRow[], date: string, runs = Math.max(0, ...rows.map((r) => r.runs))): string {
  return `# Model evals: ${date}

Same founder input, ${runs} runs per model. **Valid**: a plan that passes the schema. **Honest**: valid, with no claim-like number the founder didn't give. A model is supported only when both equal the runs. Tokens and cost are medians over the valid runs; cost appears only when the router reports it.

| Model | Route | Valid | Honest | Median seconds | Tokens in / out | Cost per run | Supported | Notes |
|---|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.model} | ${r.route} | ${r.valid}/${r.runs} | ${r.honest}/${r.runs} | ${r.medianSeconds} | ${tokens(r)} | ${r.medianCostUsd !== undefined ? `$${r.medianCostUsd.toFixed(4)}` : "n/a"} | ${supported(r) ? "yes" : "no"} | ${r.errors.join("; ").replace(/\|/g, "\\|")} |`).join("\n")}
`;
}

function tokens(r: EvalRow): string {
  if (r.medianInputTokens === undefined && r.medianOutputTokens === undefined) return "n/a";
  return `${r.medianInputTokens ?? "?"} / ${r.medianOutputTokens ?? "?"}`;
}
