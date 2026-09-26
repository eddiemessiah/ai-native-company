export function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

/** Normalizes non-negative weights to a distribution. All-zero or invalid input becomes uniform. */
export function normalize(values: readonly number[]): number[] {
  const safe = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = safe.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 1 / Math.max(1, values.length));
  return safe.map((v) => v / total);
}

export function softmax(logits: readonly number[], temperature = 1): number[] {
  const t = temperature > 0 ? temperature : 1;
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp((l - max) / t));
  return normalize(exps);
}

export function argmax(values: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if ((values[i] ?? -Infinity) > (values[best] ?? -Infinity)) best = i;
  }
  return best;
}

/** Expected level index of a distribution over ordered levels. */
export function expectedLevel(probabilities: readonly number[]): number {
  return probabilities.reduce((acc, p, i) => acc + p * i, 0);
}

/**
 * Normalized Shannon entropy in [0, 1]. 1 means the distribution is flat:
 * the options were not distinguishable from the state provided, which
 * usually means the criteria are wrong, not that the model is confused.
 */
export function normalizedEntropy(probabilities: readonly number[]): number {
  const n = probabilities.length;
  if (n <= 1) return 0;
  const h = probabilities.reduce((acc, p) => (p > 0 ? acc - p * Math.log(p) : acc), 0);
  return h / Math.log(n);
}

/** Maps a score on an n-level scale to 0–100 (useful when porting harnesses that expect percentages). */
export function toPercent(score: number, levels: number): number {
  if (levels <= 1) return 0;
  return Math.round((Math.min(levels - 1, Math.max(0, score)) / (levels - 1)) * 100);
}
