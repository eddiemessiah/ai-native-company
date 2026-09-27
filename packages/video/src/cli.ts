import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { brainFromEnv, providersFromEnv } from "@repo/brain/env";
import { buildCandidates } from "./candidates";
import { buildAss, buildSrt, captionStyle, chunkWords, SOCIAL_CHUNKS, SUBTITLE_CHUNKS, wordsBetween } from "./captions";
import { chapterProblems, formatChapters, snapChapters, type Chapter } from "./chapters";
import { fileSink, scoreCandidates } from "./decide";
import { cutIntervals, keepIntervals, parseFreezes, parseSilences, remap, remapWords, totalLength } from "./edit";
import {
  beatOffsets,
  clipArgs,
  cropBox,
  frameArgs,
  frameLength,
  freezeArgs,
  levelAndFinish,
  measureLoudness,
  parseFfmpegVersion,
  parseRate,
  probe,
  run,
  silenceArgs,
  tightenArgs,
  tightenGraph,
  trailerArgs,
} from "./ffmpeg";
import { brandFontFiles, installFonts } from "./fonts";
import {
  clipName,
  ensureDir,
  jobPaths,
  MAX_CLIP_SEC,
  readJob,
  readPlan,
  renderBrief,
  renderReview,
  slug,
  writeJson,
  type Job,
  type Plan,
  type PlannedClip,
} from "./job";
import { selectClips, trailerBeats } from "./select";
import { runShort } from "./short/cli";
import { clockTime, parseTimestamp, round3, shortDuration } from "./time";
import { nearestWord, paddedRange, parseTranscript, splitSentences } from "./transcript";
import type { Format, Interval, Mode, Sentence, Transcript } from "./types";

const HELP = `Nova Video Desk: one recording in; clips, a trailer, chapters and a tighter cut out.
Code cuts, the brain scores, a person approves. Nothing here publishes anything.

  pnpm video doctor
  pnpm video transcribe <video> [--out file.json] [--model large-v3-turbo] [--language en] [--glossary "Celo, MiniPay"]
  pnpm video ingest <video> --transcript <json|srt|vtt> --title "<recording>" [--out <job>]
  pnpm video plan <job> [--clips 8] [--min 15] [--max 60] [--demo] [--force]
  pnpm video approve <job> <n…> --by "<name>"
  pnpm video reject <job> <n…>
  pnpm video set <job> <n> [--start=±s] [--end=±s] [--exact] [--focus 0..1] [--mode crop|fit] [--title "…"] [--post "…"]
  pnpm video copy <job> <copy.json>
  pnpm video render <job> [--format 9x16|1x1|16x9] [--approved] [--no-captions]
  pnpm video trailer <job> [--seconds 45] [--format 16x9|9x16|1x1] [--title "…"]
  pnpm video tighten <job> [--mode talk|screen] [--max-pause 0.6] [--keep-fillers]
  pnpm video chapters <job> <chapters.txt|json> [--tightened]
  pnpm video short …                      topic + sources → a sourced explainer short (pnpm video short for its commands)

Jobs default to video-jobs/<title> (ignored by git). Paths are relative to where you run pnpm.
--demo ranks with the lexical heuristic when no decision model key is set: fine for a dry run, never for a client.`;

const here = process.env.INIT_CWD ?? process.cwd();
const abs = (p: string) => resolve(here, p);
/** Relative to where pnpm ran, unless that means climbing out of it. */
const rel = (p: string) => {
  const r = relative(here, p);
  return r.startsWith("..") ? p : r || ".";
};

class UsageError extends Error {}
const fail = (message: string): never => {
  throw new UsageError(message);
};

function parse() {
  try {
    return parseArgs({ args: process.argv.slice(2), allowPositionals: true, options: OPTIONS });
  } catch (error) {
    console.error(`video: ${error instanceof Error ? error.message : String(error)}\nRun pnpm video for the commands.`);
    process.exit(1);
  }
}

const OPTIONS = {
  out: { type: "string" },
  transcript: { type: "string" },
  title: { type: "string" },
  model: { type: "string" },
  language: { type: "string" },
  glossary: { type: "string" },
  clips: { type: "string" },
  min: { type: "string" },
  max: { type: "string" },
  limit: { type: "string" },
  concurrency: { type: "string" },
  demo: { type: "boolean" },
  by: { type: "string" },
  start: { type: "string" },
  end: { type: "string" },
  focus: { type: "string" },
  mode: { type: "string" },
  post: { type: "string" },
  format: { type: "string" },
  approved: { type: "boolean" },
  "no-captions": { type: "boolean" },
  preset: { type: "string" },
  seconds: { type: "string" },
  "max-pause": { type: "string" },
  noise: { type: "string" },
  "keep-fillers": { type: "boolean" },
  tightened: { type: "boolean" },
  exact: { type: "boolean" },
  force: { type: "boolean" },
  source: { type: "string", multiple: true },
  voice: { type: "string" },
  visuals: { type: "string" },
  local: { type: "string" },
  music: { type: "string" },
  cta: { type: "string" },
  audience: { type: "string" },
  help: { type: "boolean", short: "h" },
} as const;

const { values: opt, positionals } = parse();

function num(value: string | undefined, name: string, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) fail(`--${name} must be a number (got "${value}")`);
  return n;
}

function formatOf(value: string | undefined, fallback: Format): Format {
  const f = value ?? fallback;
  if (f !== "9x16" && f !== "1x1" && f !== "16x9") fail(`--format is 9x16, 1x1 or 16x9 (got "${f}")`);
  return f as Format;
}

function jobDir(): string {
  const ref = positionals[1];
  if (!ref) fail(`usage: pnpm video ${positionals[0]} <job>`);
  return abs(ref!);
}

function clipsNamed(plan: Plan, refs: readonly string[]): PlannedClip[] {
  if (refs.length === 0) fail("Name at least one clip number");
  return refs.map((r) => plan.clips.find((c) => c.n === Number(r)) ?? fail(`No clip ${r} in this plan`));
}

function saveReview(dir: string, job: Job, plan: Plan): void {
  const p = jobPaths(dir);
  writeJson(p.plan, plan);
  writeFileSync(p.review, renderReview(job, plan, rel(dir)));
}

const progress = (label: string) => (done: number, total: number) =>
  process.stderr.write(`\r${label} ${done}/${total}${done === total ? "\n" : ""}`);


async function grabFrame(job: Job, clip: PlannedClip, dir: string): Promise<void> {
  const frames = ensureDir(jobPaths(dir).frames);
  const t = clip.start + Math.min(1.5, (clip.end - clip.start) / 2);
  const box = clip.mode === "crop" && job.info.width > job.info.height ? cropBox(job.info, "9x16", clip.focusX) : undefined;
  await run("ffmpeg", frameArgs(job.source, t, join(frames, `${clipName(clip.n)}.jpg`), box));
}

/** First and last word inside a clip's current span. */
function wordSpan(t: Transcript, clip: Interval): [number, number] {
  const first = t.words.findIndex((w) => w.start >= clip.start - 0.01);
  let last = -1;
  t.words.forEach((w, i) => {
    if (w.end <= clip.end + 0.01) last = i;
  });
  if (first < 0 || last < first) fail("The clip no longer covers any words");
  return [first, last];
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function doctor(): Promise<void> {
  const rows: [string, boolean, string][] = [];
  try {
    const { stdout } = await run("ffmpeg", ["-hide_banner", "-version"]);
    rows.push(["ffmpeg", true, (stdout.split("\n")[0] ?? "").replace("ffmpeg version ", "").split(" ")[0] ?? ""]);
    const { stdout: filters } = await run("ffmpeg", ["-hide_banner", "-filters"]);
    for (const f of ["ass", "loudnorm", "silencedetect", "freezedetect", "xfade", "acrossfade"]) {
      const ok = new RegExp(`\\s${f}\\s`).test(filters);
      rows.push([`  ${f} filter`, ok, ok ? "" : f === "ass" ? "needs an ffmpeg built with libass (brew install ffmpeg has it)" : "update ffmpeg"]);
    }
  } catch {
    rows.push(["ffmpeg", false, "brew install ffmpeg · sudo apt install ffmpeg · winget install ffmpeg"]);
  }
  try {
    await run("ffprobe", ["-version"]);
    rows.push(["ffprobe", true, ""]);
  } catch {
    rows.push(["ffprobe", false, "ships with ffmpeg"]);
  }
  try {
    const { stdout } = await run("python3", ["-c", "import faster_whisper; print(faster_whisper.__version__)"]);
    rows.push(["faster-whisper", true, stdout.trim()]);
  } catch {
    rows.push(["faster-whisper", false, "optional: pip install faster-whisper, or bring a whisper.cpp JSON, SRT or VTT"]);
  }
  const providers = providersFromEnv(process.env, { allowHeuristic: false }).map((p) => p.name);
  rows.push([
    "decision brain",
    providers.length > 0,
    providers.length > 0 ? providers.join(" → ") : "set AI_GATEWAY_API_KEY (Jev) or ANTHROPIC_API_KEY; --demo uses the heuristic",
  ]);
  const fonts = brandFontFiles().length;
  rows.push(["brand font", fonts > 0, fonts > 0 ? `Bricolage Grotesque, ${fonts} subsets` : "run pnpm install"]);
  for (const [name, ok, note] of rows) console.log(`${ok ? "✓" : "✗"} ${name.padEnd(18)} ${note}`);
  const required = rows.filter(([name]) => name === "ffmpeg" || name === "ffprobe" || name.trim() === "ass filter");
  if (required.some(([, ok]) => !ok)) process.exitCode = 1;
}

async function transcribe(): Promise<void> {
  const video = positionals[1] ?? fail("usage: pnpm video transcribe <video> [--out file.json]");
  const out = abs(opt.out ?? `${video.replace(/\.[^./\\]+$/, "")}.whisper.json`);
  const script = fileURLToPath(new URL("../scripts/transcribe.py", import.meta.url));
  console.log(`Transcribing ${video} with faster-whisper ${opt.model ?? "large-v3-turbo"}…`);
  await run(
    "python3",
    [
      script,
      abs(video),
      out,
      "--model",
      opt.model ?? "large-v3-turbo",
      ...(opt.language ? ["--language", opt.language] : []),
      ...(opt.glossary ? ["--glossary", opt.glossary] : []),
    ],
    { showErrors: true },
  );
  console.log(`\nWrote ${rel(out)}. Next: pnpm video ingest ${video} --transcript ${rel(out)} --title "…"`);
}

async function ingest(): Promise<void> {
  const video = positionals[1];
  if (!video || !opt.transcript || !opt.title) fail('usage: pnpm video ingest <video> --transcript <file> --title "…" [--out <job>]');
  const src = abs(video!);
  if (!existsSync(src)) fail(`No file at ${src}`);
  const info = await probe(src);
  const transcriptFile = abs(opt.transcript!);
  const transcript = parseTranscript(readFileSync(transcriptFile, "utf8"), transcriptFile);
  if (transcript.words.length === 0) fail("The transcript has no words");
  const sentences = splitSentences(transcript.words);
  const lastWord = transcript.words[transcript.words.length - 1]!;
  if (lastWord.end > info.duration + 2) {
    console.warn(`warning: the transcript runs to ${clockTime(lastWord.end)} but the video is ${clockTime(info.duration)}. Is it for this file?`);
  }
  const dir = ensureDir(abs(opt.out ?? join("video-jobs", slug(opt.title!))));
  const p = jobPaths(dir);
  const job: Job = {
    version: 1,
    title: opt.title!,
    source: src,
    info,
    transcript: {
      file: transcriptFile,
      source: transcript.source,
      approximate: transcript.approximate,
      ...(transcript.language ? { language: transcript.language } : {}),
      words: transcript.words.length,
      sentences: sentences.length,
    },
    createdAt: new Date().toISOString(),
  };
  writeJson(p.job, job);
  writeJson(p.transcript, transcript);
  console.log(
    `Job ${rel(dir)}: ${shortDuration(info.duration)} at ${info.width}×${info.height}, ` +
      `${transcript.words.length} words in ${sentences.length} sentences from ${transcript.source}` +
      `${transcript.approximate ? " (approximate word times)" : ""}.\nNext: pnpm video plan ${rel(dir)}`,
  );
}

async function plan(): Promise<void> {
  const dir = jobDir();
  const p = jobPaths(dir);
  const { job, transcript } = readJob(dir);
  if (existsSync(p.plan) && !opt.force) {
    const approved = readPlan(dir).clips.filter((c) => c.status === "approved").length;
    if (approved > 0) fail(`${approved} clips are already approved; a new plan would discard those approvals. Pass --force to re-plan anyway`);
  }
  const sentences = splitSentences(transcript.words);
  const minSec = num(opt.min, "min", 15);
  const maxSec = num(opt.max, "max", 60);
  if (maxSec > MAX_CLIP_SEC) fail(`Clips run ${MAX_CLIP_SEC} seconds or less, so one file posts everywhere (got --max ${maxSec})`);
  const candidates = buildCandidates(sentences, { minSec, maxSec, limit: num(opt.limit, "limit", 400) });
  if (candidates.length === 0) fail(`No stretch of whole sentences runs between ${minSec}s and ${maxSec}s`);

  let brain;
  try {
    brain = brainFromEnv({ allowHeuristic: Boolean(opt.demo), sinks: [fileSink(p.decisions)], timeoutMs: 60_000 });
  } catch {
    return fail("No decision model: set AI_GATEWAY_API_KEY (Jev through the Vercel AI Gateway) or ANTHROPIC_API_KEY, or pass --demo");
  }
  console.log(`Scoring ${candidates.length} moments with ${brain.providerNames.join(" → ")}…`);
  const { scored, failed } = await scoreCandidates(brain, candidates, sentences, {
    recording: job.title,
    job: basename(dir),
    concurrency: num(opt.concurrency, "concurrency", 6),
    onProgress: progress("  scored"),
  });
  if (scored.length === 0) fail(`No moment could be scored (${failed} decisions failed); check the brain's keys with pnpm video doctor`);

  // The heuristic can't judge a clip, so a demo run would drop everything. Keep its best
  // moments as flagged drafts instead: a demo exercises the cutting, not the judging.
  const demo = scored.length > 0 && scored.every((s) => s.provider === "heuristic");
  const picked = selectClips(
    scored.map((s) => ({
      start: s.candidate.start,
      end: s.candidate.end,
      rank: s.route.rank,
      verdict: demo && s.route.verdict === "drop" ? ("review" as const) : s.route.verdict,
      s,
    })),
    { count: num(opt.clips, "clips", 8) },
  );
  const landscape = job.info.width > job.info.height;
  const clips: PlannedClip[] = picked.map(({ s, verdict }, i) => {
    const range = paddedRange(transcript.words, sentences[s.candidate.first]!.first, sentences[s.candidate.last]!.last, {
      approximate: transcript.approximate,
      duration: job.info.duration,
    });
    // Screen demos keep the whole frame; people get cropped to fill it.
    const mode: Mode = landscape && s.route.kind === "how_to" ? "fit" : "crop";
    return {
      n: i + 1,
      ...range,
      text: s.candidate.text,
      rank: s.route.rank,
      verdict: verdict === "keep" ? "keep" : "review",
      kind: s.route.kind,
      reasons: demo ? ["demo pick: ranked by the lexical heuristic, not a decision model", ...s.route.reasons] : s.route.reasons,
      decisionId: s.decisionId,
      status: "proposed",
      mode,
      focusX: 0.5,
    };
  });

  const providers = [...new Set(scored.map((s) => `${s.provider}/${s.model}`))];
  const plan: Plan = {
    version: 1,
    createdAt: new Date().toISOString(),
    brain: {
      provider: providers.length === 1 ? scored[0]!.provider : [...new Set(scored.map((s) => s.provider))].join("+"),
      model: providers.length === 1 ? scored[0]!.model : "mixed",
      calibrated: scored.length > 0 && scored.every((s) => s.calibrated),
    },
    counts: {
      candidates: candidates.length,
      keep: scored.filter((s) => s.route.verdict === "keep").length,
      review: scored.filter((s) => s.route.verdict === "review").length,
      drop: scored.filter((s) => s.route.verdict === "drop").length,
      failed,
    },
    clips,
  };
  for (const c of clips) await grabFrame(job, c, dir);
  saveReview(dir, job, plan);
  writeFileSync(p.brief, renderBrief(job, plan, sentences, rel(dir)));

  console.log(`\n${clips.length} clips proposed (${plan.counts.keep} kept, ${plan.counts.review} flagged, ${plan.counts.drop} dropped${failed ? `, ${failed} failed` : ""}):`);
  for (const c of clips) {
    console.log(`  ${String(c.n).padStart(2)}  ${clockTime(c.start).padStart(7)}  ${shortDuration(c.end - c.start).padStart(7)}  rank ${String(c.rank).padStart(3)}  ${c.verdict.padEnd(6)}  ${c.kind}`);
  }
  console.log(`\nReview: ${rel(p.review)} · Writer's brief: ${rel(p.brief)}\nDrafts: pnpm video render ${rel(dir)}`);
}

function mark(status: "approved" | "rejected"): void {
  const dir = jobDir();
  if (status === "approved" && !opt.by?.trim()) fail('A person approves each clip: add --by "<name>"');
  const { job } = readJob(dir);
  const plan = readPlan(dir);
  for (const c of clipsNamed(plan, positionals.slice(2))) {
    c.status = status;
    if (status === "approved") {
      c.approvedBy = opt.by!.trim();
      c.approvedAt = new Date().toISOString();
      if (c.verdict === "review") console.log(`Clip ${c.n} was flagged. Approved on the understanding that these were checked:\n  - ${c.reasons.join("\n  - ")}`);
    } else {
      delete c.approvedBy;
      delete c.approvedAt;
    }
    console.log(`Clip ${c.n}: ${status}`);
  }
  saveReview(dir, job, plan);
}

/**
 * Moves one edge of a clip. "-3" moves it at least 3 seconds earlier, to the
 * next sentence boundary that way; "+2" at least 2 seconds later; "12:04.5"
 * to the boundary nearest that time. Clips start and end on whole sentences;
 * --exact snaps to the nearest word instead.
 */
function moveEdge(t: Transcript, sentences: readonly Sentence[], word: number, value: string, edge: "start" | "end"): number {
  const relative = /^[+-]/.test(value);
  const target = relative ? t.words[word]![edge] + Number(value) : parseTimestamp(value);
  if (!Number.isFinite(target)) fail(`--${edge} takes +seconds, -seconds or a timestamp (got "${value}")`);
  if (opt.exact) return nearestWord(t.words, target, edge);
  const bounds = sentences.map((s) => (edge === "start" ? { time: s.start, word: s.first } : { time: s.end, word: s.last }));
  if (!relative) {
    return bounds.reduce((best, b) => (Math.abs(b.time - target) < Math.abs(best.time - target) ? b : best)).word;
  }
  if (Number(value) < 0) return (bounds.filter((b) => b.time <= target + 0.01).at(-1) ?? bounds[0]!).word;
  return (bounds.find((b) => b.time >= target - 0.01) ?? bounds.at(-1)!).word;
}

async function set(): Promise<void> {
  const dir = jobDir();
  const { job, transcript } = readJob(dir);
  const plan = readPlan(dir);
  const [clip] = clipsNamed(plan, positionals.slice(2, 3));
  const c = clip!;
  let changed = false;

  if (opt.start !== undefined || opt.end !== undefined) {
    const sentences = splitSentences(transcript.words);
    let [first, last] = wordSpan(transcript, c);
    if (opt.start !== undefined) first = moveEdge(transcript, sentences, first, opt.start, "start");
    if (opt.end !== undefined) last = moveEdge(transcript, sentences, last, opt.end, "end");
    if (last < first) fail("That would end the clip before it starts");
    const range = paddedRange(transcript.words, first, last, { approximate: transcript.approximate, duration: job.info.duration });
    if (range.end - range.start > MAX_CLIP_SEC) fail(`That makes clip ${c.n} ${shortDuration(range.end - range.start)}; clips run ${MAX_CLIP_SEC} seconds or less`);
    c.start = range.start;
    c.end = range.end;
    c.text = transcript.words
      .slice(first, last + 1)
      .map((w) => w.text)
      .join(" ");
    changed = true;
  }
  if (opt.focus !== undefined) {
    c.focusX = Math.min(1, Math.max(0, num(opt.focus, "focus", 0.5)));
    changed = true;
  }
  if (opt.mode !== undefined) {
    if (opt.mode !== "crop" && opt.mode !== "fit") fail("--mode is crop or fit");
    c.mode = opt.mode as Mode;
    changed = true;
  }
  if (opt.title !== undefined) {
    if (opt.title.length > 100) fail(`Titles are 100 characters at most on YouTube (this one is ${opt.title.length})`);
    c.title = opt.title;
    changed = true;
  }
  if (opt.post !== undefined) {
    if (opt.post.length > 280) fail(`Posts are 280 characters at most on X (this one is ${opt.post.length})`);
    c.post = opt.post;
    changed = true;
  }
  if (!changed) fail("Nothing to change: pass --start, --end, --focus, --mode, --title or --post");
  if (c.status === "approved") {
    c.status = "proposed";
    delete c.approvedBy;
    delete c.approvedAt;
    console.log(`Clip ${c.n} changed after approval, so it is back to proposed until a person approves it again.`);
  }
  await grabFrame(job, c, dir);
  saveReview(dir, job, plan);
  console.log(`Clip ${c.n}: ${clockTime(c.start)}–${clockTime(c.end)} (${shortDuration(c.end - c.start)}), ${c.mode}${c.mode === "crop" ? ` at ${c.focusX}` : ""}`);
}

function copy(): void {
  const dir = jobDir();
  const file = positionals[2] ?? fail("usage: pnpm video copy <job> <copy.json>");
  const { job } = readJob(dir);
  const plan = readPlan(dir);
  const written = JSON.parse(readFileSync(abs(file), "utf8")) as Record<string, { title?: string; post?: string }>;
  const problems: string[] = [];
  for (const [n, entry] of Object.entries(written)) {
    const c = plan.clips.find((x) => x.n === Number(n));
    if (!c) {
      problems.push(`No clip ${n}`);
      continue;
    }
    if (entry.title && entry.title.length > 100) problems.push(`Clip ${n}: title is ${entry.title.length} characters (100 max)`);
    if (entry.post && entry.post.length > 280) problems.push(`Clip ${n}: post is ${entry.post.length} characters (280 max)`);
  }
  if (problems.length > 0) fail(problems.join("\n"));
  for (const [n, entry] of Object.entries(written)) {
    const c = plan.clips.find((x) => x.n === Number(n))!;
    if (entry.title !== undefined) c.title = entry.title;
    if (entry.post !== undefined) c.post = entry.post;
    if (c.status === "approved") {
      c.status = "proposed";
      delete c.approvedBy;
      delete c.approvedAt;
    }
  }
  saveReview(dir, job, plan);
  console.log(`Copy for ${Object.keys(written).length} clips is in ${rel(jobPaths(dir).review)}; changed clips need approval again.`);
}

async function render(): Promise<void> {
  const dir = jobDir();
  const { job, transcript } = readJob(dir);
  const plan = readPlan(dir);
  const format = formatOf(opt.format, "9x16");
  const clips = plan.clips.filter((c) => (opt.approved ? c.status === "approved" : c.status !== "rejected"));
  if (clips.length === 0) fail(opt.approved ? "No approved clips yet" : "Every clip is rejected");
  const long = clips.filter((c) => c.end - c.start > MAX_CLIP_SEC);
  if (long.length > 0) fail(`Clips ${long.map((c) => c.n).join(", ")} run past ${MAX_CLIP_SEC} seconds; trim them with set --end`);
  const out = ensureDir(jobPaths(dir).renders);
  const fonts = installFonts(out);
  console.log(`Rendering ${clips.length} ${opt.approved ? "approved" : "draft"} clips at ${format}…`);
  for (const c of clips) {
    const name = `${clipName(c.n)}-${format}`;
    const range = { start: c.start, end: c.end };
    const words = wordsBetween(transcript.words, c.start, c.end);
    writeFileSync(join(out, `${clipName(c.n)}.srt`), buildSrt(chunkWords(words, SUBTITLE_CHUNKS)));
    const ass = opt["no-captions"] ? undefined : `${name}.ass`;
    if (ass) writeFileSync(join(out, ass), buildAss(chunkWords(words, SOCIAL_CHUNKS), captionStyle(format)));
    const loudness = job.info.hasAudio ? await measureLoudness(job.source, range) : null;
    await run(
      "ffmpeg",
      clipArgs({
        src: job.source,
        range,
        frame: { source: job.info, format, mode: c.mode, focusX: c.focusX },
        ...(ass ? { ass, fontsDir: fonts } : {}),
        loudness,
        out: `${name}.mp4`,
        ...(opt.preset ? { preset: opt.preset } : {}),
      }),
      { cwd: out },
    );
    console.log(`  ${rel(join(out, `${name}.mp4`))}  ${shortDuration(c.end - c.start)}  ${c.status}`);
  }
}

async function trailer(): Promise<void> {
  const dir = jobDir();
  const { job, transcript } = readJob(dir);
  const plan = readPlan(dir);
  const format = formatOf(opt.format, "16x9");
  const fade = 0.3;
  const approved = plan.clips.filter((c) => c.status === "approved");
  const pool = approved.length > 0 ? approved : plan.clips.filter((c) => c.status !== "rejected");
  const sentences = splitSentences(transcript.words);
  const beats = trailerBeats(pool, sentences, { seconds: num(opt.seconds, "seconds", 45), fadeSec: fade });
  if (beats.length === 0) fail("No clip opens with 4–12 seconds of whole sentences to use as a beat");

  const spans = beats.map((b) => {
    const c = pool.find((x) => x.n === b.clip)!;
    const range = paddedRange(transcript.words, sentences[b.first]!.first, sentences[b.last]!.last, {
      approximate: transcript.approximate,
      duration: job.info.duration,
    });
    return { ...range, focusX: c.focusX, mode: c.mode };
  });
  const lengths = spans.map((s) => frameLength(s.end - s.start, job.info.fps));
  const offsets = beatOffsets(lengths, fade);
  const words = spans.flatMap((s, k) => {
    const until = offsets[k + 1] ?? Infinity;
    return wordsBetween(transcript.words, s.start, s.start + lengths[k]!)
      .map((w) => ({ text: w.text, start: round3(w.start + offsets[k]!), end: round3(Math.min(until, w.end + offsets[k]!)) }))
      .filter((w) => w.start < until);
  });

  const out = ensureDir(jobPaths(dir).renders);
  const fonts = installFonts(out);
  const name = `trailer-${format}`;
  const title = opt.title ?? job.title;
  writeFileSync(
    join(out, `${name}.ass`),
    buildAss(chunkWords(words, SOCIAL_CHUNKS), captionStyle(format), { title: { text: title, start: 0, end: Math.min(2.5, lengths[0]!) } }),
  );
  console.log(`Trailer: ${beats.length} beats from clips ${beats.map((b) => b.clip).join(", ")}${approved.length ? " (approved)" : " (drafts)"}…`);
  await run(
    "ffmpeg",
    trailerArgs({
      src: job.source,
      beats: spans,
      source: job.info,
      format,
      mode: "crop",
      fade,
      ...(opt["no-captions"] ? {} : { ass: `${name}.ass`, fontsDir: fonts }),
      out: `${name}.raw.mp4`,
      ...(opt.preset ? { preset: opt.preset } : {}),
    }),
    { cwd: out },
  );
  await levelAndFinish(out, `${name}.raw.mp4`, `${name}.mp4`, job.info.hasAudio);
  const total = lengths.reduce((a, b) => a + b, 0) - fade * (lengths.length - 1);
  console.log(`  ${rel(join(out, `${name}.mp4`))}  ${shortDuration(total)}`);
}

async function tighten(): Promise<void> {
  const dir = jobDir();
  const { job, transcript } = readJob(dir);
  const mode = opt.mode ?? "talk";
  if (mode !== "talk" && mode !== "screen") fail("--mode is talk (cut every long pause) or screen (only where the picture is still too)");
  const fillers = !opt["keep-fillers"] && !transcript.approximate;
  const tdir = ensureDir(jobPaths(dir).tightened);
  const { info } = job;

  console.log(`Finding pauses${mode === "screen" ? " and still frames" : ""}…`);
  const silences = info.hasAudio ? parseSilences((await run("ffmpeg", silenceArgs(job.source, num(opt.noise, "noise", -35)))).stderr, info.duration) : [];
  const still = mode === "screen" ? parseFreezes((await run("ffmpeg", freezeArgs(job.source))).stderr, info.duration) : undefined;
  const cuts = cutIntervals({
    silences,
    words: transcript.words,
    maxPause: num(opt["max-pause"], "max-pause", 0.6),
    fillers,
    ...(still ? { still } : {}),
  });
  const keeps = keepIntervals(info.duration, cuts, { fps: parseRate(info.fps) });
  const kept = totalLength(keeps);
  writeJson(join(tdir, "keeps.json"), { mode, fillers, silences: silences.length, cuts, keeps });
  if (cuts.length === 0) {
    console.log("Nothing to cut at these settings.");
    return;
  }
  const removed = info.duration - kept;
  console.log(`Cutting ${shortDuration(removed)} of ${shortDuration(info.duration)} (${((100 * removed) / info.duration).toFixed(1)}%) in ${cuts.length} cuts${fillers ? ", fillers included" : ""}…`);

  writeFileSync(join(tdir, "graph.txt"), tightenGraph(keeps, { hasAudio: info.hasAudio, fps: info.fps }));
  const version = (await run("ffmpeg", ["-hide_banner", "-version"])).stdout.split("\n")[0] ?? "";
  await run(
    "ffmpeg",
    tightenArgs(job.source, "graph.txt", "tightened.raw.mp4", {
      hasAudio: info.hasAudio,
      ffmpegMajor: parseFfmpegVersion(version),
      ...(opt.preset ? { preset: opt.preset } : {}),
    }),
    { cwd: tdir, onProgress: (s) => process.stderr.write(`\r  encoded ${shortDuration(s)} of ${shortDuration(kept)}`) },
  );
  process.stderr.write("\n");
  await levelAndFinish(tdir, "tightened.raw.mp4", "tightened.mp4", info.hasAudio);
  writeFileSync(join(tdir, "tightened.srt"), buildSrt(chunkWords(remapWords(transcript.words, keeps), SUBTITLE_CHUNKS)));
  console.log(`  ${rel(join(tdir, "tightened.mp4"))}  ${shortDuration(kept)}\n  ${rel(join(tdir, "tightened.srt"))}`);
}

function parseChapters(text: string): Chapter[] {
  const trimmed = text.trim();
  if (trimmed.startsWith("[")) {
    return (JSON.parse(trimmed) as { start: number | string; title: string }[]).map((c) => ({
      start: typeof c.start === "number" ? c.start : parseTimestamp(c.start),
      title: c.title,
    }));
  }
  return trimmed.split(/\r?\n/).flatMap((line) => {
    const m = /^\s*\(?(\d+(?::\d{1,2}){1,2})\)?\s*[-–—:]?\s*(.+?)\s*$/.exec(line);
    return m ? [{ start: parseTimestamp(m[1]!), title: m[2]! }] : [];
  });
}

function chapters(): void {
  const dir = jobDir();
  const file = positionals[2] ?? fail("usage: pnpm video chapters <job> <chapters.txt|json> [--tightened]");
  const { job, transcript } = readJob(dir);
  let list = snapChapters(parseChapters(readFileSync(abs(file), "utf8")), splitSentences(transcript.words));
  let duration = job.info.duration;
  let target = dir;
  if (opt.tightened) {
    const t = jobPaths(dir).tightened;
    const { keeps } = JSON.parse(readFileSync(join(t, "keeps.json"), "utf8")) as { keeps: Interval[] };
    list = list.map((c, i) => ({ ...c, start: i === 0 ? 0 : remap(c.start, keeps) }));
    duration = totalLength(keeps);
    target = t;
  }
  const out = join(target, "chapters.txt");
  writeFileSync(out, `${formatChapters(list)}\n`);
  console.log(formatChapters(list));
  const problems = chapterProblems(list, duration);
  if (problems.length > 0) {
    console.error(`\nYouTube won't show these chapters yet:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log(`\nWrote ${rel(out)}: paste it into the video description.`);
  }
}

const commands: Record<string, () => void | Promise<void>> = {
  doctor,
  transcribe,
  ingest,
  plan,
  approve: () => mark("approved"),
  reject: () => mark("rejected"),
  set,
  copy,
  render,
  trailer,
  tighten,
  chapters,
  short: () => runShort({ positionals, opt, abs, rel, fail }),
};

const command = positionals[0];
if (!command || opt.help || !(command in commands)) {
  console.log(HELP);
  if (command && !(command in commands)) process.exitCode = 1;
} else {
  try {
    await commands[command]!();
  } catch (error) {
    console.error(`video ${command}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
