import { spawn } from "node:child_process";
import { renameSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { round3 } from "./time";
import type { Format, Interval, Mode, SourceInfo } from "./types";

export class CommandError extends Error {
  constructor(
    message: string,
    readonly stderr: string,
  ) {
    super(message);
    this.name = "CommandError";
  }
}

export interface RunResult {
  readonly stdout: string;
  readonly stderr: string;
}

/** Runs a command without a shell. Rejects with the tail of stderr on a non-zero exit. */
export function run(
  cmd: string,
  args: readonly string[],
  opts: { cwd?: string; onProgress?: (seconds: number) => void; showErrors?: boolean } = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    // showErrors: let the command write straight to the terminal (long jobs that print their own progress).
    const child = spawn(cmd, args, { cwd: opts.cwd, stdio: ["ignore", "pipe", opts.showErrors ? "inherit" : "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr?.on("data", (d: Buffer) => {
      const text = d.toString();
      stderr += text;
      const m = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
      if (m && opts.onProgress) opts.onProgress(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]));
    });
    child.on("error", (e: NodeJS.ErrnoException) =>
      reject(e.code === "ENOENT" ? new Error(`${cmd} is not installed or not on PATH`) : e),
    );
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new CommandError(`${cmd} exited with ${code}:\n${stderr.trim().split("\n").slice(-8).join("\n")}`, stderr));
    });
  });
}

const fmt = (n: number) => round3(n).toFixed(3);

export function parseRate(rate: string | undefined): number {
  if (!rate) return 0;
  const [n, d] = rate.split("/").map(Number);
  if (!Number.isFinite(n)) return 0;
  return d ? n! / d : n!;
}

/** Whole frames in a span, as seconds. The epsilon absorbs float error: 25.2 - 20 is 5.1999…, which is still 156 frames at 30 fps. */
export function frameLength(seconds: number, fps: string): number {
  const rate = parseRate(fps) || 30;
  return Math.floor(seconds * rate + 1e-6) / rate;
}

const sane = (rate: unknown) => typeof rate === "string" && parseRate(rate) >= 1 && parseRate(rate) <= 120;

export function parseProbe(json: unknown): SourceInfo {
  const doc = (json ?? {}) as { format?: { duration?: string }; streams?: Record<string, unknown>[] };
  const streams = doc.streams ?? [];
  const video = streams.find(
    (s) => s.codec_type === "video" && !(s.disposition as Record<string, number> | undefined)?.attached_pic,
  );
  if (!video) throw new Error("The source has no video stream");
  const side = video.side_data_list as { rotation?: number }[] | undefined;
  const rotation = side?.find((s) => typeof s.rotation === "number")?.rotation ?? Number((video.tags as Record<string, string> | undefined)?.rotate ?? 0);
  const swap = Math.abs(rotation) % 180 === 90;
  const width = Number(video.width);
  const height = Number(video.height);
  const fps = sane(video.avg_frame_rate) ? String(video.avg_frame_rate) : sane(video.r_frame_rate) ? String(video.r_frame_rate) : "30/1";
  return {
    duration: round3(Number(doc.format?.duration ?? video.duration ?? 0)),
    width: swap ? height : width,
    height: swap ? width : height,
    fps,
    hasAudio: streams.some((s) => s.codec_type === "audio"),
  };
}

export async function probe(file: string): Promise<SourceInfo> {
  const { stdout } = await run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file]);
  return parseProbe(JSON.parse(stdout));
}

/** Major version, or 99 for a git build ("N-12345-g…"), which is newer than any release. */
export function parseFfmpegVersion(firstLine: string): number {
  const m = /ffmpeg version n?(\d+)\./.exec(firstLine);
  return m ? Number(m[1]) : 99;
}

export const FORMATS: Readonly<Record<Format, { readonly width: number; readonly height: number }>> = {
  "9x16": { width: 1080, height: 1920 },
  "1x1": { width: 1080, height: 1080 },
  "16x9": { width: 1920, height: 1080 },
};

const even = (n: number) => Math.max(2, Math.floor(n / 2) * 2);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The region of the source that fills the output frame, in source pixels.
 * focusX and focusY: 0 is the left or top edge, 0.5 the centre, 1 the right or bottom edge.
 */
export function cropBox(src: { width: number; height: number }, format: Format, focusX = 0.5, focusY = 0.5) {
  const { width: W, height: H } = FORMATS[format];
  const target = W / H;
  if (src.width / src.height > target) {
    const w = Math.min(even(src.height * target), even(src.width));
    return { x: Math.round((src.width - w) * clamp01(focusX)), y: 0, w, h: even(src.height) };
  }
  const h = Math.min(even(src.width / target), even(src.height));
  return { x: 0, y: Math.round((src.height - h) * clamp01(focusY)), w: even(src.width), h };
}

/** The size the whole source takes inside the output frame in fit mode. */
export function fitBox(src: { width: number; height: number }, format: Format) {
  const { width: W, height: H } = FORMATS[format];
  const scale = Math.min(W / src.width, H / src.height);
  return { w: even(src.width * scale), h: even(src.height * scale) };
}

export interface FrameSpec {
  readonly source: SourceInfo;
  readonly format: Format;
  readonly mode: Mode;
  readonly focusX?: number;
  /** Prefix for intermediate pads, so several chains can share one graph. */
  readonly tag?: string;
}

/** Filtergraph from one video pad to another: reframe, then a constant frame rate and pixel format. */
export function videoChain(input: string, output: string, spec: FrameSpec): string {
  const { width: W, height: H } = FORMATS[spec.format];
  const t = spec.tag ?? "f";
  const tail = `fps=${spec.source.fps},format=yuv420p,setsar=1`;
  if (spec.mode === "crop") {
    const b = cropBox(spec.source, spec.format, spec.focusX ?? 0.5);
    return `[${input}]crop=${b.w}:${b.h}:${b.x}:${b.y},scale=${W}:${H}:flags=lanczos,${tail}[${output}]`;
  }
  const f = fitBox(spec.source, spec.format);
  return [
    `[${input}]split=2[${t}bg][${t}fg]`,
    `[${t}bg]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=luma_radius=40:luma_power=2,drawbox=x=0:y=0:w=iw:h=ih:color=black@0.3:t=fill[${t}bgb]`,
    `[${t}fg]scale=${f.w}:${f.h}:flags=lanczos[${t}fgs]`,
    `[${t}bgb][${t}fgs]overlay=(W-w)/2:(H-h)/2,${tail}[${output}]`,
  ].join(";");
}

export interface LoudnessTarget {
  readonly i: number;
  readonly tp: number;
  readonly lra: number;
}

/**
 * Social video: -14 LUFS integrated, and at most -1 dBTP in the delivered file
 * (research/video-editing.md). The chain aims at -2 dBTP because AAC encoding
 * added 0.5 dB of true peak in our tests (our data, 2026-09-27).
 */
export const SOCIAL_LOUDNESS: LoudnessTarget = { i: -14, tp: -2, lra: 11 };

/** What loudnorm's first pass measured. Values stay strings, exactly as loudnorm printed them. */
export interface Loudness {
  readonly input_i: string;
  readonly input_tp: string;
  readonly input_lra: string;
  readonly input_thresh: string;
  readonly target_offset: string;
}

export function measureArgs(src: string, range?: Interval, target: LoudnessTarget = SOCIAL_LOUDNESS): string[] {
  return [
    "-hide_banner",
    "-nostats",
    ...(range ? ["-ss", fmt(range.start), "-t", fmt(range.end - range.start)] : []),
    "-i",
    src,
    "-vn",
    "-sn",
    "-af",
    `loudnorm=I=${target.i}:TP=${target.tp}:LRA=${target.lra}:print_format=json`,
    "-f",
    "null",
    "-",
  ];
}

/** The JSON block loudnorm prints at the end of a first pass. Null for silence, which has nothing to normalize. */
export function parseLoudnorm(stderr: string): Loudness | null {
  const start = stderr.lastIndexOf("{");
  const end = stderr.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    const j = JSON.parse(stderr.slice(start, end + 1)) as Record<string, string>;
    const keys = ["input_i", "input_tp", "input_lra", "input_thresh", "target_offset"] as const;
    if (!keys.every((k) => Number.isFinite(Number(j[k])))) return null;
    return Object.fromEntries(keys.map((k) => [k, j[k]!])) as unknown as Loudness;
  } catch {
    return null;
  }
}

/** Second pass: apply the measured values linearly, then back to 48 kHz (loudnorm works at 192 kHz). */
export function loudnormFilter(m: Loudness, t: LoudnessTarget = SOCIAL_LOUDNESS): string {
  return (
    `loudnorm=I=${t.i}:TP=${t.tp}:LRA=${t.lra}:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
    `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`
  );
}

function audioChain(input: string, output: string, duration: number, loudness: Loudness | null, target?: LoudnessTarget): string {
  const fadeOut = Math.min(0.15, duration / 4);
  const level = loudness ? loudnormFilter(loudness, target) : "aresample=48000";
  return `[${input}]${level},afade=t=in:st=0:d=0.04,afade=t=out:st=${fmt(duration - fadeOut)}:d=${fmt(fadeOut)}[${output}]`;
}

const SAFE_NAME = /^[\w./-]+$/;

function assFilter(file: string, fontsDir?: string): string {
  for (const p of [file, fontsDir ?? ""]) {
    if (p && !SAFE_NAME.test(p)) throw new Error(`Use a plain relative path inside the filtergraph: "${p}"`);
  }
  return fontsDir ? `ass=${file}:fontsdir=${fontsDir}` : `ass=${file}`;
}

export interface EncodeOptions {
  readonly preset?: string;
  readonly crf?: number;
}

function encodeArgs(opts: EncodeOptions, audio: boolean): string[] {
  return [
    "-c:v",
    "libx264",
    "-preset",
    opts.preset ?? "medium",
    "-crf",
    String(opts.crf ?? 20),
    "-pix_fmt",
    "yuv420p",
    ...(audio ? ["-c:a", "aac", "-b:a", "160k", "-ar", "48000"] : ["-an"]),
    "-movflags",
    "+faststart",
  ];
}

export interface ClipRender extends EncodeOptions {
  readonly src: string;
  readonly range: Interval;
  readonly frame: FrameSpec;
  /** Subtitle and font paths are relative to the working directory ffmpeg runs in. */
  readonly ass?: string;
  readonly fontsDir?: string;
  readonly loudness?: Loudness | null;
  readonly target?: LoudnessTarget;
  readonly out: string;
}

/** One clip in one pass: seek, reframe, burn captions, level the audio, encode. */
export function clipArgs(r: ClipRender): string[] {
  const duration = r.range.end - r.range.start;
  const audio = r.frame.source.hasAudio;
  const graph = [
    videoChain("0:v", r.ass ? "vr" : "v", { ...r.frame, tag: "c" }),
    ...(r.ass ? [`[vr]${assFilter(r.ass, r.fontsDir)}[v]`] : []),
    ...(audio ? [audioChain("0:a", "a", duration, r.loudness ?? null, r.target)] : []),
  ].join(";");
  return [
    "-hide_banner",
    "-y",
    "-ss",
    fmt(r.range.start),
    "-t",
    fmt(duration),
    "-i",
    r.src,
    "-filter_complex",
    graph,
    "-map",
    "[v]",
    ...(audio ? ["-map", "[a]"] : []),
    ...encodeArgs(r, audio),
    r.out,
  ];
}

/** Where each beat starts on the trailer's timeline, once each crossfade overlaps two beats. */
export function beatOffsets(lengths: readonly number[], fade: number): number[] {
  let acc = 0;
  return lengths.map((d, k) => {
    const offset = round3(acc - k * fade);
    acc += d;
    return offset;
  });
}

export interface TrailerRender extends EncodeOptions {
  readonly src: string;
  readonly beats: readonly (Interval & { readonly focusX?: number; readonly mode?: Mode })[];
  readonly source: SourceInfo;
  readonly format: Format;
  readonly mode: Mode;
  readonly fade: number;
  readonly ass?: string;
  readonly fontsDir?: string;
  readonly out: string;
}

/**
 * Beats joined with crossfades. Each beat is its own seeked input, so a
 * 60-second trailer from a 2-hour recording decodes about 60 seconds.
 */
export function trailerArgs(r: TrailerRender): string[] {
  const n = r.beats.length;
  if (n === 0) throw new Error("A trailer needs at least one beat");
  const audio = r.source.hasAudio;
  // Whole frames only, so each crossfade starts exactly where its beat's last frames are.
  const lengths = r.beats.map((b) => frameLength(b.end - b.start, r.source.fps));
  const offsets = beatOffsets(lengths, r.fade);
  const graph: string[] = [];
  r.beats.forEach((b, k) => {
    graph.push(
      videoChain(`${k}:v`, `v${k}`, { source: r.source, format: r.format, mode: b.mode ?? r.mode, focusX: b.focusX ?? 0.5, tag: `b${k}` }),
    );
    if (audio) graph.push(`[${k}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${k}]`);
  });
  let v = "v0";
  let a = "a0";
  for (let k = 1; k < n; k++) {
    graph.push(`[${v}][v${k}]xfade=transition=fade:duration=${fmt(r.fade)}:offset=${fmt(offsets[k]!)}[xv${k}]`);
    v = `xv${k}`;
    if (audio) {
      graph.push(`[${a}][a${k}]acrossfade=d=${fmt(r.fade)}[xa${k}]`);
      a = `xa${k}`;
    }
  }
  graph.push(r.ass ? `[${v}]${assFilter(r.ass, r.fontsDir)}[v]` : `[${v}]null[v]`);
  if (audio) graph.push(`[${a}]anull[a]`);
  return [
    "-hide_banner",
    "-y",
    ...r.beats.flatMap((b, k) => ["-ss", fmt(b.start), "-t", fmt(lengths[k]!), "-i", r.src]),
    "-filter_complex",
    graph.join(";"),
    "-map",
    "[v]",
    ...(audio ? ["-map", "[a]"] : []),
    ...encodeArgs(r, audio),
    r.out,
  ];
}

/** Re-levels a finished file's audio and copies the video untouched. */
export function normalizeArgs(input: string, loudness: Loudness, out: string, target: LoudnessTarget = SOCIAL_LOUDNESS): string[] {
  return [
    "-hide_banner",
    "-y",
    "-i",
    input,
    "-map",
    "0:v",
    "-map",
    "0:a",
    "-c:v",
    "copy",
    "-af",
    loudnormFilter(loudness, target),
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    out,
  ];
}

/**
 * The tightened long-form cut as a filtergraph script: every kept stretch
 * trimmed from the same decode and joined with concat, which re-aligns audio
 * and video at each join. 10 ms fades stop clicks at the cuts.
 */
export function tightenGraph(keeps: readonly Interval[], opts: { hasAudio: boolean; fps: string }): string {
  const n = keeps.length;
  if (n === 0) throw new Error("Nothing left to keep");
  const lines = [`[0:v]split=${n}${keeps.map((_, i) => `[sv${i}]`).join("")}`];
  if (opts.hasAudio) lines.push(`[0:a]asplit=${n}${keeps.map((_, i) => `[sa${i}]`).join("")}`);
  keeps.forEach((k, i) => {
    lines.push(`[sv${i}]trim=start=${fmt(k.start)}:end=${fmt(k.end)},setpts=PTS-STARTPTS[v${i}]`);
    if (opts.hasAudio) {
      const d = k.end - k.start;
      const f = Math.min(0.01, d / 4);
      lines.push(
        `[sa${i}]atrim=start=${fmt(k.start)}:end=${fmt(k.end)},asetpts=PTS-STARTPTS,afade=t=in:d=${fmt(f)},afade=t=out:st=${fmt(d - f)}:d=${fmt(f)}[a${i}]`,
      );
    }
  });
  const pads = keeps.map((_, i) => (opts.hasAudio ? `[v${i}][a${i}]` : `[v${i}]`)).join("");
  lines.push(`${pads}concat=n=${n}:v=1:a=${opts.hasAudio ? 1 : 0}${opts.hasAudio ? "[vc][a]" : "[vc]"}`);
  lines.push(`[vc]fps=${opts.fps},format=yuv420p[v]`);
  return `${lines.join(";\n")}\n`;
}

export function tightenArgs(src: string, script: string, out: string, opts: EncodeOptions & { hasAudio: boolean; ffmpegMajor: number }): string[] {
  const graph = opts.ffmpegMajor >= 7 ? ["-/filter_complex", script] : ["-filter_complex_script", script];
  return [
    "-hide_banner",
    "-y",
    "-i",
    src,
    ...graph,
    "-map",
    "[v]",
    ...(opts.hasAudio ? ["-map", "[a]"] : []),
    ...encodeArgs({ preset: opts.preset ?? "veryfast", crf: opts.crf ?? 20 }, opts.hasAudio),
    out,
  ];
}

/** Audio pauses. `minSec` is only what gets reported; the cut rules decide what gets removed. */
export function silenceArgs(src: string, noiseDb = -35, minSec = 0.3): string[] {
  return ["-hide_banner", "-nostats", "-i", src, "-vn", "-sn", "-af", `silencedetect=noise=${noiseDb}dB:d=${minSec}`, "-f", "null", "-"];
}

/** Stretches where the picture doesn't change, on a small copy for speed. */
export function freezeArgs(src: string, minSec = 0.3): string[] {
  return ["-hide_banner", "-nostats", "-i", src, "-an", "-sn", "-vf", `scale=320:-2,freezedetect=n=-60dB:d=${minSec}`, "-f", "null", "-"];
}

/** A still for the review sheet, with the 9:16 crop drawn on it so a person can check the framing. */
export function frameArgs(src: string, t: number, out: string, box?: { x: number; y: number; w: number; h: number }): string[] {
  const draw = box ? `drawbox=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}:color=0xFFB000@0.9:t=8,` : "";
  return ["-hide_banner", "-loglevel", "error", "-y", "-ss", fmt(t), "-i", src, "-frames:v", "1", "-vf", `${draw}scale=640:-2`, "-q:v", "3", out];
}

/** Loudness of a file (or a stretch of it), measured by loudnorm's first pass. */
export async function measureLoudness(src: string, range?: Interval, target: LoudnessTarget = SOCIAL_LOUDNESS): Promise<Loudness | null> {
  return parseLoudnorm((await run("ffmpeg", measureArgs(src, range, target))).stderr);
}

/** Two-pass loudness on a finished file: measure, then rewrite its audio and copy its video. */
export async function levelAndFinish(dir: string, raw: string, final: string, hasAudio: boolean): Promise<void> {
  const loud = hasAudio ? await measureLoudness(join(dir, raw)) : null;
  if (loud) {
    await run("ffmpeg", normalizeArgs(raw, loud, final), { cwd: dir });
    unlinkSync(join(dir, raw));
  } else {
    renameSync(join(dir, raw), join(dir, final));
  }
}
