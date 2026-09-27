import { assTime, round3, srtTime } from "./time";
import type { Format, Word } from "./types";

export interface CaptionChunk {
  readonly start: number;
  readonly end: number;
  readonly words: readonly Word[];
}

export interface ChunkOptions {
  readonly maxWords: number;
  readonly maxChars: number;
  /** A pause longer than this starts a new chunk. */
  readonly maxGap: number;
  readonly maxSec: number;
  /** Also break after , ; and : (not just . ? !). */
  readonly breakOnComma?: boolean;
}

/** Burned-in captions for vertical clips: a few words at a time, read at a glance. */
export const SOCIAL_CHUNKS: ChunkOptions = { maxWords: 3, maxChars: 18, maxGap: 0.5, maxSec: 1.6, breakOnComma: true };
/** Uploaded subtitles (SRT): up to two lines of 42 characters. */
export const SUBTITLE_CHUNKS: ChunkOptions = { maxWords: 16, maxChars: 84, maxGap: 1, maxSec: 6 };

export function chunkWords(words: readonly Word[], opts: ChunkOptions): CaptionChunk[] {
  const breakAfter = opts.breakOnComma ? /[.?!,;:]["')\]]*$/ : /[.?!]["')\]]*$/;
  const groups: Word[][] = [];
  let current: Word[] = [];
  let chars = 0;
  for (const w of words) {
    const prev = current[current.length - 1];
    const full =
      current.length >= opts.maxWords ||
      chars + 1 + w.text.length > opts.maxChars ||
      (prev !== undefined && w.start - prev.end > opts.maxGap) ||
      (current.length > 0 && w.end - current[0]!.start > opts.maxSec);
    if (current.length > 0 && full) {
      groups.push(current);
      current = [];
      chars = 0;
    }
    chars += (current.length > 0 ? 1 : 0) + w.text.length;
    current.push(w);
    if (breakAfter.test(w.text)) {
      groups.push(current);
      current = [];
      chars = 0;
    }
  }
  if (current.length > 0) groups.push(current);

  return groups.map((ws, i) => {
    const next = groups[i + 1]?.[0];
    const start = ws[0]!.start;
    let end = ws[ws.length - 1]!.end;
    // Bridge short gaps so captions don't flicker, and hold every chunk long enough to read.
    if (next && next.start - end < 0.3) end = Math.max(end, next.start);
    if (end - start < 0.3) end = Math.max(end, Math.min(start + 0.3, next ? next.start : Infinity));
    return { start: round3(start), end: round3(end), words: ws };
  });
}

/** Words between start and end, moved so `start` is 0. */
export function wordsBetween(words: readonly Word[], start: number, end: number): Word[] {
  return words
    .filter((w) => w.start >= start - 0.01 && w.end <= end + 0.01)
    .map((w) => ({ text: w.text, start: round3(Math.max(0, w.start - start)), end: round3(Math.max(0, w.end - start)) }));
}

export interface CaptionStyle {
  readonly width: number;
  readonly height: number;
  readonly font: string;
  readonly size: number;
  readonly color: string;
  readonly highlight: string;
  readonly outline: number;
  /** Distance from the bottom edge. On 9:16 the captions sit above the app's own buttons and caption text. */
  readonly marginV: number;
}

/** The brand display face, shipped with the package as woff2 (@fontsource-variable/bricolage-grotesque, OFL-1.1). */
export const BRAND_FONT = "Bricolage Grotesque 96pt ExtraBold";

const LAYOUT: Record<Format, Pick<CaptionStyle, "width" | "height" | "size" | "outline" | "marginV">> = {
  "9x16": { width: 1080, height: 1920, size: 108, outline: 8, marginV: 560 },
  "1x1": { width: 1080, height: 1080, size: 88, outline: 6, marginV: 150 },
  "16x9": { width: 1920, height: 1080, size: 72, outline: 5, marginV: 90 },
};

/** White with a saffron highlight on the word being spoken: the brand's --write colour. */
export function captionStyle(format: Format, overrides: Partial<CaptionStyle> = {}): CaptionStyle {
  return { ...LAYOUT[format], font: BRAND_FONT, color: "#ffffff", highlight: "#ffb000", ...overrides };
}

/** #rrggbb in ASS's BBGGRR order. */
export function assColor(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Not a hex colour: ${hex}`);
  return `${m[3]}${m[2]}${m[1]}`.toUpperCase();
}

function escapeAss(text: string): string {
  return text.replace(/\{/g, "(").replace(/\}/g, ")").replace(/\\/g, "/");
}

/**
 * An ASS subtitle file with one event per spoken word: the whole chunk on
 * screen, the current word in the highlight colour.
 */
export interface Headline {
  readonly text: string;
  readonly start: number;
  readonly end: number;
  /** #rrggbb; defaults to the caption colour. */
  readonly color?: string;
}

export function buildAss(
  chunks: readonly CaptionChunk[],
  style: CaptionStyle,
  extra: {
    title?: { text: string; start: number; end: number };
    /** Big on-screen text for explainer shorts, one per beat: it pops in at the beat's start. */
    headlines?: readonly Headline[];
  } = {},
): string {
  const fg = assColor(style.color);
  const hl = assColor(style.highlight);
  const header = [
    "[Script Info]",
    "; Nova Video Desk",
    "ScriptType: v4.00+",
    `PlayResX: ${style.width}`,
    `PlayResY: ${style.height}`,
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "YCbCr Matrix: TV.709",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Caption,${style.font},${style.size},&H00${fg},&H00${hl},&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${style.outline},0,2,60,60,${style.marginV},1`,
    `Style: Title,${style.font},${Math.round(style.size * 0.85)},&H00${fg},&H00${hl},&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${style.outline},0,8,80,80,${Math.round(style.height * 0.12)},1`,
    `Style: Headline,${style.font},${Math.round(style.size * 1.25)},&H00${fg},&H00${hl},&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${style.outline},0,8,70,70,${Math.round(style.height * 0.24)},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const events: string[] = [];
  if (extra.title) {
    events.push(`Dialogue: 1,${assTime(extra.title.start)},${assTime(extra.title.end)},Title,,0,0,0,,${escapeAss(extra.title.text)}`);
  }
  for (const h of extra.headlines ?? []) {
    const color = assColor(h.color ?? style.color);
    const pop = `{\\fad(120,80)\\fscx86\\fscy86\\t(0,200,\\fscx100\\fscy100)\\1c&H${color}&}`;
    events.push(`Dialogue: 1,${assTime(h.start)},${assTime(h.end)},Headline,,0,0,0,,${pop}${escapeAss(h.text)}`);
  }
  for (const c of chunks) {
    c.words.forEach((w, k) => {
      const from = k === 0 ? c.start : w.start;
      const to = k === c.words.length - 1 ? c.end : c.words[k + 1]!.start;
      if (Math.round(to * 100) <= Math.round(from * 100)) return;
      const text = c.words
        .map((x, i) => (i === k ? `{\\1c&H${hl}&}${escapeAss(x.text)}{\\1c&H${fg}&}` : escapeAss(x.text)))
        .join(" ");
      events.push(`Dialogue: 0,${assTime(from)},${assTime(to)},Caption,,0,0,0,,${text}`);
    });
  }
  return `${[...header, ...events].join("\n")}\n`;
}

function twoLines(text: string, max: number): string {
  if (text.length <= max) return text;
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return best < 0 ? text : `${text.slice(0, best)}\n${text.slice(best + 1)}`;
}

/** SubRip for YouTube and LinkedIn uploads: two lines of up to 42 characters. */
export function buildSrt(chunks: readonly CaptionChunk[], lineChars = 42): string {
  return chunks
    .map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${twoLines(c.words.map((w) => w.text).join(" "), lineChars)}\n`)
    .join("\n");
}
