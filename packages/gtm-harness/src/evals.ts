import type { GtmInput } from "./input";
import { describeRoute, routeModel, type ModelDeps, type ModelRoute } from "./models";
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
  readonly error?: string;
}

export interface EvalRow {
  readonly model: string;
  readonly route: string;
  readonly runs: number;
  readonly valid: number;
  readonly honest: number;
  readonly medianSeconds: number;
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
      const { plan } = await generatePlan(input, { route, ...(opts.deps ? { deps: opts.deps } : {}), signal: AbortSignal.timeout(180_000) });
      results.push({ ok: true, seconds: (performance.now() - started) / 1000, inventedNumbers: checkPlan(plan, input) });
    } catch (error) {
      results.push({ ok: false, seconds: (performance.now() - started) / 1000, inventedNumbers: [], error: error instanceof Error ? error.message : String(error) });
    }
  }
  const seconds = results.map((r) => r.seconds).sort((a, b) => a - b);
  return {
    model,
    route: describeRoute(route),
    runs: results.length,
    valid: results.filter((r) => r.ok).length,
    honest: results.filter((r) => r.ok && r.inventedNumbers.length === 0).length,
    medianSeconds: Math.round((seconds[Math.floor(seconds.length / 2)] ?? 0) * 10) / 10,
    errors: [...new Set(results.flatMap((r) => (r.error ? [r.error] : r.inventedNumbers.map((n) => `invented: ${n}`))))].slice(0, 5),
  };
}

/** Supported means every run came back valid and honest. */
export function supported(row: EvalRow): boolean {
  return row.runs > 0 && row.valid === row.runs && row.honest === row.runs;
}

export function evalTable(rows: readonly EvalRow[], date: string, runs = Math.max(0, ...rows.map((r) => r.runs))): string {
  return `# Model evals: ${date}

Same founder input, ${runs} runs per model. **Valid**: a plan that passes the schema. **Honest**: valid, with no claim-like number the founder didn't give. A model is supported only when both equal the runs.

| Model | Route | Valid | Honest | Median seconds | Supported | Notes |
|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.model} | ${r.route} | ${r.valid}/${r.runs} | ${r.honest}/${r.runs} | ${r.medianSeconds} | ${supported(r) ? "yes" : "no"} | ${r.errors.join("; ").replace(/\|/g, "\\|")} |`).join("\n")}
`;
}
