import { parseTimestamp, round3 } from "./time";
import type { Interval, Sentence, Transcript, TranscriptSource, Word } from "./types";

export interface Cue {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/** Reads whisper JSON (openai-whisper, faster-whisper, whisper.cpp), SRT or WebVTT. */
export function parseTranscript(text: string, filename = ""): Transcript {
  const body = text.replace(/^﻿/, "");
  const head = body.trimStart();
  if (head.startsWith("{")) return parseWhisperJson(JSON.parse(head) as unknown);
  if (head.startsWith("WEBVTT") || /\.vtt$/i.test(filename)) return fromCues("vtt", parseVtt(body));
  return fromCues("srt", parseSrt(body));
}

const TIMING = /(\d[\d:.,]*)\s*-->\s*(\d[\d:.,]*)/;

function blocks(text: string): string[][] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((b) => b.split("\n"));
}

function cleanLine(line: string): string {
  return line
    .replace(/<[^>]*>/g, "") // <i>, <c>, <v Speaker>, <00:00:01.000>
    .replace(/\{\\[^}]*\}/g, "") // {\an8}
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cueFrom(lines: readonly string[]): { start: number; end: number; lines: string[] } | null {
  const at = lines.findIndex((l) => TIMING.test(l));
  if (at < 0) return null;
  const m = TIMING.exec(lines[at]!)!;
  return {
    start: parseTimestamp(m[1]!),
    end: parseTimestamp(m[2]!),
    lines: lines.slice(at + 1).map(cleanLine).filter(Boolean),
  };
}

export function parseSrt(text: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of blocks(text)) {
    const cue = cueFrom(block);
    if (cue && cue.lines.length > 0) cues.push({ start: cue.start, end: cue.end, text: cue.lines.join(" ") });
  }
  return cues;
}

/** WebVTT, including rolling captions, where each cue repeats the line before it (YouTube's auto-captions do this). */
export function parseVtt(text: string): Cue[] {
  const cues: Cue[] = [];
  let previous: readonly string[] = [];
  for (const block of blocks(text)) {
    const cue = cueFrom(block);
    if (!cue) continue;
    const fresh = cue.lines.filter((l) => !previous.includes(l));
    previous = cue.lines;
    if (fresh.length > 0) cues.push({ start: cue.start, end: cue.end, text: fresh.join(" ") });
  }
  return cues;
}

function fromCues(source: TranscriptSource, cues: readonly Cue[]): Transcript {
  const sorted = [...cues].sort((a, b) => a.start - b.start);
  return { source, approximate: true, words: sorted.flatMap(spread) };
}

/** Spreads a cue's time across its words by length. Approximate by construction. */
export function spread(cue: Cue): Word[] {
  const tokens = cue.text.split(/\s+/).filter(Boolean);
  const total = tokens.reduce((sum, t) => sum + t.length + 1, 0);
  const span = Math.max(0, cue.end - cue.start);
  let t = cue.start;
  return tokens.map((text) => {
    const d = (span * (text.length + 1)) / total;
    const word = { text, start: round3(t), end: round3(t + d) };
    t += d;
    return word;
  });
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function toWord(w: Record<string, unknown>): Word[] {
  const raw = typeof w.word === "string" ? w.word : typeof w.text === "string" ? w.text : "";
  const text = raw.trim();
  const start = num(w.start);
  const end = num(w.end);
  if (!text || start === null || end === null) return [];
  return [{ text, start: round3(start), end: round3(Math.max(start, end)) }];
}

/**
 * openai-whisper and faster-whisper: `segments[].words[]` with times in seconds.
 * whisper.cpp (-oj): `transcription[].offsets` in milliseconds; run it with
 * `--max-len 1 --split-on-word` and every segment is one measured word.
 */
export function parseWhisperJson(json: unknown): Transcript {
  const doc = (json ?? {}) as Record<string, unknown>;
  if (Array.isArray(doc.segments)) {
    let approximate = false;
    const words: Word[] = [];
    for (const seg of doc.segments as Record<string, unknown>[]) {
      const measured = Array.isArray(seg.words) ? (seg.words as Record<string, unknown>[]).flatMap(toWord) : [];
      const start = num(seg.start);
      const end = num(seg.end);
      if (measured.length > 0) {
        words.push(...measured);
      } else if (typeof seg.text === "string" && start !== null && end !== null) {
        approximate = true;
        words.push(...spread({ start, end, text: seg.text.trim() }));
      }
    }
    return {
      source: "whisper",
      approximate,
      ...(typeof doc.language === "string" ? { language: doc.language } : {}),
      words: words.sort((a, b) => a.start - b.start),
    };
  }
  if (Array.isArray(doc.transcription)) {
    const cues = (doc.transcription as Record<string, unknown>[]).flatMap((s) => {
      const offsets = (s.offsets ?? {}) as Record<string, unknown>;
      const from = num(offsets.from);
      const to = num(offsets.to);
      const text = typeof s.text === "string" ? s.text.trim() : "";
      return from === null || to === null || !text ? [] : [{ start: from / 1000, end: to / 1000, text }];
    });
    const result = (doc.result ?? {}) as Record<string, unknown>;
    return {
      source: "whisper-cpp",
      approximate: !cues.every((c) => !/\s/.test(c.text)),
      ...(typeof result.language === "string" ? { language: result.language } : {}),
      words: cues.flatMap(spread).sort((a, b) => a.start - b.start),
    };
  }
  throw new Error("Unrecognised transcript JSON: expected whisper `segments` or whisper.cpp `transcription`");
}

const ABBREVIATIONS = new Set(["mr.", "mrs.", "ms.", "dr.", "prof.", "st.", "vs.", "etc.", "e.g.", "i.e.", "no.", "approx."]);

export function endsSentence(word: string): boolean {
  const w = word.toLowerCase().replace(/["'”’)\]]+$/, "");
  if (ABBREVIATIONS.has(w) || /(\.\.\.|…)$/.test(w)) return false;
  return /[.?!]$/.test(w);
}

/**
 * Sentences end on . ? ! or a pause of `pauseSec`. A run-on longer than
 * `maxSec` (captions without punctuation do this) breaks at its widest pause.
 */
export function splitSentences(words: readonly Word[], opts: { pauseSec?: number; maxSec?: number } = {}): Sentence[] {
  const pauseSec = opts.pauseSec ?? 1;
  const maxSec = opts.maxSec ?? 25;
  const out: Sentence[] = [];
  let first = 0;
  const flush = (last: number) => {
    const slice = words.slice(first, last + 1);
    out.push({
      index: out.length,
      first,
      last,
      start: slice[0]!.start,
      end: slice[slice.length - 1]!.end,
      text: slice.map((w) => w.text).join(" "),
    });
    first = last + 1;
  };
  for (let i = 0; i < words.length; i++) {
    const w = words[i]!;
    const next = words[i + 1];
    if (!next || endsSentence(w.text) || next.start - w.end >= pauseSec) {
      flush(i);
      continue;
    }
    if (i > first && w.end - words[first]!.start > maxSec) {
      let cut = first;
      let widest = -Infinity;
      for (let j = first; j < i; j++) {
        const gap = words[j + 1]!.start - words[j]!.end;
        if (gap > widest) {
          widest = gap;
          cut = j;
        }
      }
      flush(cut);
    }
  }
  return out;
}

/** Hesitations only. "Like" and "you know" carry meaning often enough that a person decides. */
const FILLERS = new Set(["um", "umm", "uh", "uhh", "uhm", "erm", "er"]);

export function isFiller(text: string): boolean {
  return FILLERS.has(text.toLowerCase().replace(/[^a-z]/g, ""));
}

/**
 * The span to cut for words first..last: a little lead-in and ring-out, but
 * never past the midpoint of the gap to a neighbouring word, so no clip starts
 * or ends on part of another word.
 */
export function paddedRange(
  words: readonly Word[],
  first: number,
  last: number,
  opts: { approximate?: boolean; duration?: number } = {},
): Interval {
  const lead = opts.approximate ? 0.3 : 0.12;
  const tail = opts.approximate ? 0.5 : 0.35;
  const a = words[first];
  const b = words[last];
  if (!a || !b || last < first) throw new Error(`No words between ${first} and ${last}`);
  const prev = words[first - 1];
  const next = words[last + 1];
  let start = a.start - lead;
  if (prev) start = Math.max(start, (prev.end + a.start) / 2);
  let end = b.end + tail;
  if (next) end = Math.min(end, (b.end + next.start) / 2);
  start = Math.max(0, Math.min(start, a.start));
  end = Math.max(end, b.end);
  if (opts.duration !== undefined) end = Math.min(end, opts.duration);
  return { start: round3(start), end: round3(end) };
}

/** Index of the word whose start (or end) is nearest to t. */
export function nearestWord(words: readonly Word[], t: number, edge: "start" | "end"): number {
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < words.length; i++) {
    const diff = Math.abs(words[i]![edge] - t);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}
