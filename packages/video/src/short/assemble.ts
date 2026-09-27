import { spread } from "../transcript";
import { round3 } from "../time";
import type { Word } from "../types";

const FPS = 30;

export interface BeatTiming {
  readonly index: number;
  /** Where the beat starts in the short. */
  readonly start: number;
  /** Seconds of voice in the beat. */
  readonly voice: number;
  /** The beat's full length: its voice plus the pause after it, in whole frames. */
  readonly length: number;
}

/**
 * Lays the beats end to end. Each beat's length is rounded up to whole frames
 * and its pause absorbs the rounding, so picture and voice never drift apart
 * however many beats there are.
 */
export function timeline(voiceSeconds: readonly number[], opts: { gap?: number; tail?: number } = {}): BeatTiming[] {
  const gap = opts.gap ?? 0.25;
  const tail = opts.tail ?? 0.8;
  let start = 0;
  return voiceSeconds.map((voice, index) => {
    const pause = index === voiceSeconds.length - 1 ? tail : gap;
    const length = Math.ceil((voice + pause) * FPS - 1e-6) / FPS;
    const beat = { index, start: round3(start), voice: round3(voice), length: round3(length) };
    start += length;
    return beat;
  });
}

export function shortLength(beats: readonly BeatTiming[]): number {
  const last = beats[beats.length - 1];
  return last ? round3(last.start + last.length) : 0;
}

/** Caption words for each beat, spread across its voice by length: the script is known, so no transcription. */
export function captionWords(narrations: readonly string[], beats: readonly BeatTiming[]): Word[] {
  return beats.flatMap((b) => spread({ start: b.start, end: b.start + b.voice, text: narrations[b.index] ?? "" }));
}

/** The voice track: every beat's audio, padded with silence to its beat length, joined. */
export function voiceArgs(files: readonly string[], beats: readonly BeatTiming[], out: string): string[] {
  const pads = beats.map((b, i) => `[${i}:a]apad=whole_dur=${b.length.toFixed(3)}[p${i}]`);
  const join = `${beats.map((_, i) => `[p${i}]`).join("")}concat=n=${beats.length}:v=0:a=1[a]`;
  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    ...files.flatMap((f) => ["-i", f]),
    "-filter_complex",
    [...pads, join].join(";"),
    "-map",
    "[a]",
    "-ac",
    "1",
    "-ar",
    "48000",
    "-c:a",
    "pcm_s16le",
    out,
  ];
}

/** A concat-demuxer list; every segment was encoded the same way, so they join without re-encoding. */
export function concatList(files: readonly string[]): string {
  return `${files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n")}\n`;
}

export interface FinalRender {
  readonly visual: string;
  readonly voice: string;
  readonly total: number;
  /** Relative to the working directory ffmpeg runs in. */
  readonly ass: string;
  readonly fontsDir: string;
  readonly music?: string;
  /** Linear gain for the music bed before ducking; 0.2 is about 14 dB under the voice. */
  readonly musicGain?: number;
  readonly out: string;
}

/**
 * Fine grain (it also dithers the gradients), captions and headlines burned
 * in, a saffron progress bar filling along the bottom edge, and music ducked
 * under the voice whenever someone is speaking.
 */
export function finalArgs(r: FinalRender): string[] {
  const t = r.total.toFixed(3);
  const video = [
    `[0:v]noise=alls=4:allf=t,ass=${r.ass}:fontsdir=${r.fontsDir}[vt]`,
    `color=c=0xffb000:s=1080x10:r=${FPS}:d=${t}[bar]`,
    `[vt][bar]overlay=x='-w+w*t/${t}':y=H-h:shortest=1[v]`,
  ];
  const audio = r.music
    ? [
        `[2:a]aresample=48000,volume=${(r.musicGain ?? 0.2).toFixed(2)}[m]`,
        "[1:a]aresample=48000,asplit=2[vo][sc]",
        "[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=300[md]",
        "[vo][md]amix=inputs=2:duration=first:normalize=0[a]",
      ]
    : ["[1:a]aresample=48000[a]"];
  return [
    "-hide_banner",
    "-y",
    "-i",
    r.visual,
    "-i",
    r.voice,
    ...(r.music ? ["-stream_loop", "-1", "-i", r.music] : []),
    "-filter_complex",
    [...video, ...audio].join(";"),
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-t",
    t,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    r.out,
  ];
}
