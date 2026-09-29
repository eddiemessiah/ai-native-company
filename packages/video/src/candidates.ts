import type { Sentence } from "./types";

/** A stretch of whole sentences that could become a clip. Code builds these; the brain scores them. */
export interface Candidate {
  readonly id: number;
  /** First and last sentence (inclusive). */
  readonly first: number;
  readonly last: number;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

export interface CandidateOptions {
  /** Shortest and longest clip, in seconds. */
  readonly minSec?: number;
  readonly maxSec?: number;
  /** Lengths to aim for from each starting sentence; one candidate per target. */
  readonly targets?: readonly number[];
  /** Minimum distance between two starting sentences, so neighbours don't all get scored. */
  readonly strideSec?: number;
  /** Cap on candidates sent to the brain, sampled evenly across the recording. */
  readonly limit?: number;
}

export function buildCandidates(sentences: readonly Sentence[], opts: CandidateOptions = {}): Candidate[] {
  const minSec = opts.minSec ?? 15;
  const maxSec = opts.maxSec ?? 60;
  if (!(minSec > 0 && maxSec > minSec)) throw new Error(`Need 0 < min < max seconds (got ${minSec} and ${maxSec})`);
  const targets = (opts.targets ?? [25, 45]).map((t) => Math.min(maxSec, Math.max(minSec, t)));
  const strideSec = opts.strideSec ?? 8;

  const out: Omit<Candidate, "id">[] = [];
  const seen = new Set<string>();
  let lastStart = -Infinity;
  for (let i = 0; i < sentences.length; i++) {
    const from = sentences[i]!;
    if (from.start - lastStart < strideSec) continue;
    let made = false;
    for (const target of targets) {
      let best = -1;
      let bestDiff = Infinity;
      for (let j = i; j < sentences.length; j++) {
        const length = sentences[j]!.end - from.start;
        if (length > maxSec) break;
        if (length < minSec) continue;
        const diff = Math.abs(length - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = j;
        }
      }
      if (best < 0 || seen.has(`${i}-${best}`)) continue;
      seen.add(`${i}-${best}`);
      made = true;
      out.push({
        first: i,
        last: best,
        start: from.start,
        end: sentences[best]!.end,
        text: sentences
          .slice(i, best + 1)
          .map((s) => s.text)
          .join(" "),
      });
    }
    if (made) lastStart = from.start;
  }
  return sampleEvenly(out, opts.limit ?? 400).map((c, id) => ({ id, ...c }));
}

export function sampleEvenly<T>(items: readonly T[], limit: number): T[] {
  if (items.length <= limit) return [...items];
  return Array.from({ length: limit }, (_, k) => items[Math.floor((k * items.length) / limit)]!);
}
