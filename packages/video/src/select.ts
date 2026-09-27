import type { Interval, Sentence } from "./types";

export type Verdict = "keep" | "review" | "drop";

/** Anything with a place in time and a rank from the brain. */
export interface Rankable extends Interval {
  readonly rank: number;
  readonly verdict: Verdict;
}

const verdictOrder = (v: Verdict) => (v === "keep" ? 0 : v === "review" ? 1 : 2);

/**
 * Best first, never overlapping. Code owns the count and the overlap rule; the
 * brain only supplied the ranks.
 */
export function selectClips<T extends Rankable>(scored: readonly T[], opts: { count: number; minGapSec?: number }): T[] {
  const gap = opts.minGapSec ?? 0;
  const pool = scored
    .filter((s) => s.verdict !== "drop")
    .sort((a, b) => b.rank - a.rank || verdictOrder(a.verdict) - verdictOrder(b.verdict) || a.start - b.start);
  const picked: T[] = [];
  for (const s of pool) {
    if (picked.length >= opts.count) break;
    if (!picked.some((p) => s.start < p.end + gap && p.start < s.end + gap)) picked.push(s);
  }
  return picked;
}

/** One beat of a trailer: whole sentences from the opening of a clip. */
export interface Beat {
  readonly clip: number;
  /** First and last sentence (inclusive). */
  readonly first: number;
  readonly last: number;
}

/**
 * Builds a trailer from the openings of the best clips: each beat is the
 * clip's first sentence, plus the next ones until it reaches `minSec`. Beats
 * are whole sentences in the speaker's own order, so a trailer can reorder
 * moments but never splices words into a new sentence.
 */
export function trailerBeats(
  clips: readonly { readonly n: number; readonly start: number; readonly end: number }[],
  sentences: readonly Sentence[],
  opts: { seconds: number; minSec?: number; maxSec?: number; fadeSec?: number },
): Beat[] {
  const minSec = opts.minSec ?? 4;
  const maxSec = opts.maxSec ?? 12;
  const fade = opts.fadeSec ?? 0.3;
  const beats: Beat[] = [];
  let total = 0;
  for (const clip of clips) {
    const inside = sentences.filter((s) => s.start >= clip.start - 0.05 && s.end <= clip.end + 0.05);
    const opening = inside[0];
    if (!opening) continue;
    let last = opening;
    for (const s of inside.slice(1)) {
      if (last.end - opening.start >= minSec) break;
      last = s;
    }
    const length = last.end - opening.start;
    if (length < minSec * 0.5 || length > maxSec) continue;
    const added = beats.length === 0 ? length : length - fade;
    if (total + added > opts.seconds) continue;
    beats.push({ clip: clip.n, first: opening.index, last: last.index });
    total += added;
  }
  return beats;
}
