import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { clockTime, shortDuration } from "./time";
import type { Mode, SourceInfo, Transcript, TranscriptSource } from "./types";

/**
 * A job is one recording and everything made from it, in one folder:
 *
 *   job.json         the source, its probe, the transcript's provenance
 *   transcript.json  words with times (normalized from whisper, SRT or VTT)
 *   plan.json        the proposed clips, their scores and who approved them
 *   decisions.jsonl  one brain decision per scored moment (state hashed, never stored)
 *   review.md        the sheet a person approves from
 *   brief.md         what the writer (an LLM) gets: clips, rules, the transcript
 *   frames/          a still per clip with the 9:16 crop drawn on it
 *   renders/         clips, captions, subtitles and trailers
 *   tightened/       the tightened long-form cut
 *
 * Client footage and jobs stay out of git (video-jobs/ is ignored).
 */
export interface Job {
  readonly version: 1;
  readonly title: string;
  /** Absolute path to the recording. */
  readonly source: string;
  readonly info: SourceInfo;
  readonly transcript: {
    readonly file: string;
    readonly source: TranscriptSource;
    readonly approximate: boolean;
    readonly language?: string;
    readonly words: number;
    readonly sentences: number;
  };
  readonly createdAt: string;
}

/** X's cap for accounts without Premium, the tightest of the five platforms, so one file posts everywhere (research/video-editing.md §3). */
export const MAX_CLIP_SEC = 140;

export type ClipStatus = "proposed" | "approved" | "rejected";

export interface PlannedClip {
  /** 1 is the best-ranked clip. */
  readonly n: number;
  start: number;
  end: number;
  text: string;
  readonly rank: number;
  readonly verdict: "keep" | "review";
  readonly kind: string;
  readonly reasons: readonly string[];
  readonly decisionId: string;
  status: ClipStatus;
  approvedBy?: string;
  approvedAt?: string;
  mode: Mode;
  /** Horizontal centre of the vertical crop: 0 is the left edge, 1 the right. */
  focusX: number;
  title?: string;
  post?: string;
}

export interface Plan {
  readonly version: 1;
  readonly createdAt: string;
  readonly brain: { readonly provider: string; readonly model: string; readonly calibrated: boolean };
  readonly counts: { readonly candidates: number; readonly keep: number; readonly review: number; readonly drop: number; readonly failed: number };
  clips: PlannedClip[];
}

export function jobPaths(dir: string) {
  return {
    dir,
    job: join(dir, "job.json"),
    transcript: join(dir, "transcript.json"),
    plan: join(dir, "plan.json"),
    decisions: join(dir, "decisions.jsonl"),
    review: join(dir, "review.md"),
    brief: join(dir, "brief.md"),
    frames: join(dir, "frames"),
    renders: join(dir, "renders"),
    tightened: join(dir, "tightened"),
  };
}

function readJson<T>(file: string, what: string): T {
  if (!existsSync(file)) throw new Error(`No ${what} at ${file}`);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

export function writeJson(file: string, value: unknown): void {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function readJob(dir: string): { job: Job; transcript: Transcript } {
  const p = jobPaths(dir);
  return {
    job: readJson<Job>(p.job, "job.json (run `ingest` first)"),
    transcript: readJson<Transcript>(p.transcript, "transcript.json (run `ingest` first)"),
  };
}

export function readPlan(dir: string): Plan {
  return readJson<Plan>(jobPaths(dir).plan, "plan.json (run `plan` first)");
}

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "recording"
  );
}

export const clipName = (n: number) => `clip-${String(n).padStart(2, "0")}`;

/** The sheet a person approves from. Regenerated from plan.json after every change. */
export function renderReview(job: Job, plan: Plan, jobRef: string): string {
  const { info } = job;
  const approved = plan.clips.filter((c) => c.status === "approved").length;
  const lines = [
    `# Review: ${job.title}`,
    "",
    `Source \`${basename(job.source)}\`: ${shortDuration(info.duration)}, ${info.width}×${info.height}. ` +
      `Transcript: ${job.transcript.source}${job.transcript.approximate ? " (word times approximate: check every cut)" : ""}.`,
    `Scored by ${plan.brain.provider}/${plan.brain.model}${plan.brain.calibrated ? "" : " (uncalibrated)"}: ` +
      `${plan.counts.candidates} moments, ${plan.counts.keep} kept, ${plan.counts.review} flagged, ${plan.counts.drop} dropped` +
      `${plan.counts.failed ? `, ${plan.counts.failed} failed` : ""}. ${approved} of ${plan.clips.length} clips approved.`,
    "",
  ];
  if (plan.brain.provider === "heuristic") {
    lines.push(
      "> **Demo scores.** These come from the lexical heuristic, not a decision model. The order is a guess; judge every clip yourself.",
      "",
    );
  }
  lines.push(
    "Watch the drafts in `renders/`, then approve, reject or adjust. Nothing is published from here.",
    "",
    "```bash",
    `pnpm video approve ${jobRef} 1 3 --by "Your name"`,
    `pnpm video reject ${jobRef} 2`,
    `pnpm video set ${jobRef} 4 --end=-1.5 --focus 0.35   # trim the ending, move the crop left`,
    `pnpm video render ${jobRef} --approved`,
    "```",
    "",
  );
  for (const c of plan.clips) {
    const flag = c.verdict === "review" ? " · **check first**" : "";
    lines.push(
      `## ${c.n} · ${clockTime(c.start)}–${clockTime(c.end)} (${shortDuration(c.end - c.start)}) · ${c.kind} · rank ${c.rank} · ${c.status}${flag}`,
      "",
    );
    if (c.title) lines.push(`**${c.title}**`, "");
    lines.push(`![clip ${c.n}](frames/${clipName(c.n)}.jpg)`, "", `> ${c.text}`, "");
    for (const r of c.reasons) lines.push(`- ${r}`);
    lines.push(`- framing: ${c.mode}${c.mode === "crop" ? `, focus ${c.focusX.toFixed(2)}` : ""}`);
    if (c.post) lines.push(`- post: ${c.post}`);
    if (c.status === "approved") lines.push(`- approved by ${c.approvedBy} at ${c.approvedAt}`);
    lines.push("");
  }
  return lines.join("\n");
}

/** What the writer gets. The writer drafts copy only; code checks lengths, a person approves. */
export function renderBrief(job: Job, plan: Plan, sentences: readonly { start: number; text: string }[], jobRef: string): string {
  const lines = [
    `# Writer's brief: ${job.title}`,
    "",
    "Write copy for the clips below, then chapters for the full recording.",
    "",
    "Rules:",
    "- Use only what is said in the clip. Add no claim, number, name or promise the speaker didn't make.",
    "- Plain, specific, short. Lead with the most surprising specific. No hype words, no emoji walls (company/gtm/content-engine.md).",
    "- `title`: 100 characters at most (YouTube's limit); aim for under 60. `post`: 280 characters at most, one call to action.",
    "- Spell names and products exactly as in the glossary and the transcript.",
    "- Chapters: first at 0:00, at least 3, each 10 seconds or longer, titled in a few words. Code snaps them to sentence starts.",
    "",
    `Return \`copy.json\` and load it with \`pnpm video copy ${jobRef} copy.json\`:`,
    "",
    "```json",
    '{ "1": { "title": "…", "post": "…" }, "2": { "title": "…", "post": "…" } }',
    "```",
    "",
    `Return \`chapters.txt\` and check it with \`pnpm video chapters ${jobRef} chapters.txt\`:`,
    "",
    "```text",
    "0:00 Intro",
    "3:12 …",
    "```",
    "",
    "## Clips",
    "",
  ];
  for (const c of plan.clips.filter((x) => x.status !== "rejected")) {
    lines.push(`### ${c.n} (${c.kind}, ${shortDuration(c.end - c.start)})`, "", `> ${c.text}`, "");
  }
  lines.push("## Full transcript", "");
  for (const s of sentences) lines.push(`[${clockTime(s.start)}] ${s.text}`);
  lines.push("");
  return lines.join("\n");
}
