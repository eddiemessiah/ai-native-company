import { createWriteStream, existsSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

/** The site's palette (apps/web/app/globals.css): the split colours on the dark ground. */
export const BRAND = {
  bg: "#0b0b0a",
  bg2: "#1a1916",
  write: "#ffb000",
  decide: "#7480ff",
  human: "#ff5a36",
  bone: "#ede8dc",
} as const;

/** Headline colour per beat, in turn. */
export const ACCENTS = [BRAND.write, BRAND.decide, BRAND.human, BRAND.bone] as const;

const W = 1080;
const H = 1920;
const FPS = 30;

/** Blends two #rrggbb colours: t = 0 gives a, 1 gives b. */
export function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const hex = (color: string) => `0x${color.slice(1)}`;

/** Beat segments are intermediates (the final pass re-encodes them), so: fast, and nearly lossless. */
const ENCODE = ["-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", String(FPS)];

/**
 * A brand beat: a slow beam of the beat's accent across the dark ground (the
 * site's loom). A smooth gradient loses nothing drawn at quarter size and
 * scaled up; the final pass adds the grain once.
 */
export function brandArgs(seconds: number, accent: string, out: string, seed: number): string[] {
  const tint = mix(BRAND.bg, accent, 0.24);
  const source = `gradients=s=${W / 4}x${H / 4}:r=${FPS}:d=${seconds.toFixed(3)}:n=3:c0=${hex(BRAND.bg)}:c1=${hex(tint)}:c2=${hex(BRAND.bg)}:type=linear:speed=0.004:seed=${seed}`;
  return ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", source, "-vf", `scale=${W}:${H}:flags=bicubic,format=yuv420p`, ...ENCODE, out];
}

/** Fill 9:16 from any footage, trim or loop it to length, and darken it so the headline reads. */
function coverChain(): string {
  return `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${FPS},drawbox=x=0:y=0:w=iw:h=ih:color=black@0.35:t=fill,format=yuv420p`;
}

export function footageArgs(file: string, seconds: number, out: string): string[] {
  return ["-hide_banner", "-loglevel", "error", "-y", "-stream_loop", "-1", "-t", seconds.toFixed(3), "-i", file, "-vf", coverChain(), ...ENCODE, out];
}

/** A slow push-in on a still image. */
export function stillArgs(file: string, seconds: number, out: string): string[] {
  const frames = Math.ceil(seconds * FPS);
  const zoom = `zoompan=z='min(zoom+0.0006,1.15)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}`;
  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    file,
    "-vf",
    `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},${zoom},drawbox=x=0:y=0:w=iw:h=ih:color=black@0.35:t=fill,format=yuv420p`,
    "-frames:v",
    String(frames),
    ...ENCODE,
    out,
  ];
}

const IMAGE = /\.(jpe?g|png|webp)$/i;
export const isImage = (file: string) => IMAGE.test(file);

const tokens = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);

/**
 * Picks a clip from the client's own footage by matching the beat's query
 * against file names; unused files first, then the next in order. Code, not a
 * model: file names are the only description there is.
 */
export function pickLocal(files: readonly string[], query: string | undefined, used: ReadonlySet<string>): string | null {
  if (files.length === 0) return null;
  const wanted = new Set(tokens(query ?? ""));
  const score = (f: string) => tokens(f.split(/[\\/]/).pop() ?? f).filter((t) => wanted.has(t)).length;
  const ranked = files
    .map((f, i) => ({ f, i, s: score(f), u: used.has(f) ? 1 : 0 }))
    .sort((a, b) => a.u - b.u || b.s - a.s || a.i - b.i);
  return ranked[0]!.f;
}

export interface StockClip {
  readonly id: number;
  readonly page: string;
  readonly link: string;
  readonly width: number;
  readonly height: number;
  readonly duration: number;
  readonly author: string;
  readonly authorUrl: string;
}

/**
 * From a Pexels video search, the first portrait clip long enough for the
 * beat (Pexels ranks by relevance), and its file closest to 1080×1920.
 */
export function pickPexels(json: unknown, minSeconds: number): StockClip | null {
  const videos = ((json ?? {}) as { videos?: Record<string, unknown>[] }).videos ?? [];
  for (const v of videos) {
    const duration = Number(v.duration ?? 0);
    const files = ((v.video_files ?? []) as Record<string, unknown>[]).filter(
      (f) => f.file_type === "video/mp4" && Number(f.height) > Number(f.width) && typeof f.link === "string",
    );
    if (files.length === 0 || duration < Math.min(minSeconds, 3)) continue;
    const best = files.reduce((a, b) => (Math.abs(Number(b.height) - H) < Math.abs(Number(a.height) - H) ? b : a));
    const user = (v.user ?? {}) as Record<string, unknown>;
    return {
      id: Number(v.id),
      page: String(v.url ?? ""),
      link: String(best.link),
      width: Number(best.width),
      height: Number(best.height),
      duration,
      author: String(user.name ?? ""),
      authorUrl: String(user.url ?? ""),
    };
  }
  return null;
}

export async function searchPexels(query: string, apiKey: string, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  const url = `https://api.pexels.com/videos/search?${new URLSearchParams({ query, orientation: "portrait", size: "medium", per_page: "15" })}`;
  const res = await fetchImpl(url, { headers: { authorization: apiKey } });
  if (!res.ok) throw new Error(`Pexels search for "${query}" returned ${res.status}`);
  return res.json();
}

export async function download(url: string, file: string): Promise<void> {
  if (existsSync(file)) return;
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}): ${url}`);
  await pipeline(Readable.fromWeb(res.body as unknown as WebReadableStream), createWriteStream(file));
}
