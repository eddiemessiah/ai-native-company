import { isFiller } from "./transcript";
import { round3 } from "./time";
import type { Interval, Word } from "./types";

const NUM = "(-?\\d+(?:\\.\\d+)?)";

function pairs(stderr: string, startKey: RegExp, endKey: RegExp, duration: number): Interval[] {
  const out: Interval[] = [];
  let open: number | null = null;
  for (const line of stderr.split(/\r?\n/)) {
    const s = startKey.exec(line);
    if (s) open = Math.max(0, Number(s[1]));
    const e = endKey.exec(line);
    if (e && open !== null) {
      out.push({ start: open, end: Math.min(duration, Number(e[1])) });
      open = null;
    }
  }
  if (open !== null && open < duration) out.push({ start: open, end: duration });
  return out.filter((i) => i.end > i.start);
}

/** Reads `silencedetect` output. A silence still open at the end of the file runs to `duration`. */
export function parseSilences(stderr: string, duration: number): Interval[] {
  return pairs(stderr, new RegExp(`silence_start:\\s*${NUM}`), new RegExp(`silence_end:\\s*${NUM}`), duration);
}

/** Reads `freezedetect` output: the stretches where the picture doesn't change. */
export function parseFreezes(stderr: string, duration: number): Interval[] {
  return pairs(stderr, new RegExp(`freeze_start:\\s*${NUM}`), new RegExp(`freeze_end:\\s*${NUM}`), duration);
}

export function merge(list: readonly Interval[]): Interval[] {
  const sorted = [...list].filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.start <= last.end) out[out.length - 1] = { start: last.start, end: Math.max(last.end, i.end) };
    else out.push({ ...i });
  }
  return out;
}

/** Parts of `a` outside every interval in `b`. */
export function subtract(a: readonly Interval[], b: readonly Interval[]): Interval[] {
  const holes = merge(b);
  const out: Interval[] = [];
  for (const i of merge(a)) {
    let start = i.start;
    for (const h of holes) {
      if (h.end <= start || h.start >= i.end) continue;
      if (h.start > start) out.push({ start, end: h.start });
      start = Math.max(start, h.end);
    }
    if (start < i.end) out.push({ start, end: i.end });
  }
  return out;
}

export function intersect(a: readonly Interval[], b: readonly Interval[]): Interval[] {
  const out: Interval[] = [];
  const bb = merge(b);
  for (const i of merge(a)) {
    for (const j of bb) {
      const start = Math.max(i.start, j.start);
      const end = Math.min(i.end, j.end);
      if (end > start) out.push({ start, end });
    }
  }
  return out;
}

export interface CutOptions {
  readonly silences: readonly Interval[];
  readonly words: readonly Word[];
  /** Silences longer than this are shortened. */
  readonly maxPause?: number;
  /** How much of a shortened silence stays, so speech still breathes. */
  readonly keepPause?: number;
  /** Cut um, uh and erm. Only with measured word times. */
  readonly fillers?: boolean;
  /**
   * Screen recordings: only cut where the picture is still too, so a silent
   * stretch of typing or clicking stays in.
   */
  readonly still?: readonly Interval[];
  /** Cuts shorter than this are skipped; tiny cuts read as glitches. */
  readonly minCut?: number;
}

/** What to remove for a tighter long-form cut. Never cuts into a spoken word that isn't a filler. */
export function cutIntervals(opts: CutOptions): Interval[] {
  const maxPause = opts.maxPause ?? 0.6;
  const keepPause = Math.min(opts.keepPause ?? 0.25, maxPause);
  const minCut = opts.minCut ?? 0.1;
  const cuts: Interval[] = [];
  for (const s of opts.silences) {
    if (s.end - s.start > maxPause) cuts.push({ start: s.start + keepPause / 2, end: s.end - keepPause / 2 });
  }
  const spoken: Interval[] = [];
  opts.words.forEach((w, i) => {
    if (opts.fillers && isFiller(w.text)) {
      const prev = opts.words[i - 1];
      const next = opts.words[i + 1];
      cuts.push({ start: prev ? Math.max(prev.end, w.start - 0.05) : w.start, end: next ? Math.min(next.start, w.end + 0.05) : w.end });
    } else {
      spoken.push({ start: w.start, end: w.end });
    }
  });
  const allowed = opts.still ? intersect(cuts, opts.still) : merge(cuts);
  return subtract(allowed, spoken)
    .filter((c) => c.end - c.start >= minCut)
    .map((c) => ({ start: round3(c.start), end: round3(c.end) }));
}

/**
 * The complement of `cuts` over [0, duration]. With `fps`, every boundary
 * snaps to a frame so audio and video lose exactly the same time at each cut
 * and never drift apart.
 */
export function keepIntervals(duration: number, cuts: readonly Interval[], opts: { fps?: number; minKeep?: number } = {}): Interval[] {
  const minKeep = opts.minKeep ?? 0.1;
  const snap = (t: number) => (opts.fps ? Math.round(t * opts.fps) / opts.fps : t);
  const keeps: Interval[] = [];
  let t = 0;
  for (const c of merge(cuts)) {
    if (c.start > t) keeps.push({ start: t, end: c.start });
    t = Math.max(t, c.end);
  }
  if (t < duration) keeps.push({ start: t, end: duration });
  return keeps
    .map((k) => ({ start: round3(snap(k.start)), end: round3(Math.min(duration, snap(k.end))) }))
    .filter((k) => k.end - k.start >= minKeep);
}

/** Where a moment of the source lands in the tightened cut. A moment inside a cut lands where the cut was. */
export function remap(t: number, keeps: readonly Interval[]): number {
  let acc = 0;
  for (const k of keeps) {
    if (t < k.start) return round3(acc);
    if (t <= k.end) return round3(acc + (t - k.start));
    acc += k.end - k.start;
  }
  return round3(acc);
}

/** Words that survive the cut, on the new timeline. */
export function remapWords(words: readonly Word[], keeps: readonly Interval[]): Word[] {
  return words
    .filter((w) => keeps.some((k) => (w.start + w.end) / 2 >= k.start && (w.start + w.end) / 2 <= k.end))
    .map((w) => ({ text: w.text, start: remap(w.start, keeps), end: remap(w.end, keeps) }));
}

export function totalLength(intervals: readonly Interval[]): number {
  return round3(intervals.reduce((sum, i) => sum + (i.end - i.start), 0));
}
