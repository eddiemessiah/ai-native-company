import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { brainFromEnv } from "@repo/brain/env";
import { checkClaim, gateDraft } from "@repo/brain/recipes";
import { buildAss, buildSrt, captionStyle, chunkWords, SOCIAL_CHUNKS, SUBTITLE_CHUNKS } from "../captions";
import { fileSink } from "../decide";
import { frameArgs, levelAndFinish, measureLoudness, run } from "../ffmpeg";
import { installFonts } from "../fonts";
import { ensureDir, slug, writeJson } from "../job";
import { shortDuration } from "../time";
import { captionWords, concatList, finalArgs, timeline, shortLength, voiceArgs } from "./assemble";
import { renderBrief, writeScript, type BriefSource } from "./brief";
import {
  hashText,
  readScript,
  readSources,
  renderShortReview,
  shortPaths,
  type ClaimResult,
  type ShortCheck,
  type ShortSettings,
  type ShortStatus,
} from "./job";
import { checkScript, DEFAULT_LEXICON, draftText, forSpeech } from "./script";
import { ACCENTS, brandArgs, download, footageArgs, isImage, pickLocal, pickPexels, searchPexels, stillArgs } from "./visuals";
import { autoVoice, parseVoice, speak } from "./voice";

export const SHORT_HELP = `Explainer shorts: a topic and its sources in; a sourced 30–60 second vertical video out.
LLM writes the script, code checks every count and quote, the brain checks each claim, a person approves.

  pnpm video short new "<topic>" --source <file|url> [--source …] [--seconds 30-50] [--audience "…"]
                       [--voice auto|edge|azure|openai|elevenlabs:<id>|say|pico|espeak] [--visuals brand|stock|local]
                       [--local <folder>] [--music <file>] [--cta "…"] [--out <job>]
  pnpm video short write <job> [--model claude-opus-5]     Claude writes script.json from brief.md
  pnpm video short check <job> [--demo]                    code checks, content gate, one claim check per claim
  pnpm video short render <job> [--force]                  voice, visuals, captions, music, loudness
  pnpm video short approve <job> --by "<name>"

No ANTHROPIC_API_KEY? Any writer can fill in script.json from brief.md, an agent in a Claude Code session included.`;

export interface ShortContext {
  readonly positionals: readonly string[];
  readonly opt: Readonly<Record<string, string | boolean | string[] | undefined>>;
  readonly abs: (p: string) => string;
  readonly rel: (p: string) => string;
  readonly fail: (message: string) => never;
}

const str = (v: unknown) => (typeof v === "string" ? v : undefined);

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|br|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

export function titleOf(text: string, fallback: string): string {
  const frontMatter = /^---\s*\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
  const front = /^title:\s*["']?(.+?)["']?\s*$/m.exec(frontMatter)?.[1];
  const heading = /^#\s+(.+)$/m.exec(text)?.[1];
  return (front ?? heading ?? fallback).trim();
}

async function loadSource(ctx: ShortContext, ref: string, index: number): Promise<BriefSource> {
  if (/^https?:\/\//i.test(ref)) {
    const res = await fetch(ref);
    if (!res.ok) ctx.fail(`Couldn't fetch ${ref} (${res.status})`);
    const body = await res.text();
    const html = /<(html|body|p)[\s>]/i.test(body);
    const title = html ? (/<title>([^<]+)<\/title>/i.exec(body)?.[1] ?? new URL(ref).hostname) : titleOf(body, new URL(ref).hostname);
    return { id: `s${index + 1}`, title: title.trim(), url: ref, text: html ? htmlToText(body) : body };
  }
  const file = ctx.abs(ref);
  if (!existsSync(file)) ctx.fail(`No source at ${file}`);
  const text = readFileSync(file, "utf8");
  const name = basename(file).replace(/\.[^.]+$/, "");
  return { id: slug(name) || `s${index + 1}`, title: titleOf(text, name), text };
}

function parseSeconds(value: string | undefined): { minSec: number; maxSec: number } {
  if (!value) return { minSec: 30, maxSec: 50 };
  const m = /^(\d+)(?:-(\d+))?$/.exec(value.trim());
  if (!m) throw new Error(`--seconds takes a length like 45 or a range like 30-50 (got "${value}")`);
  const max = Number(m[2] ?? m[1]);
  const min = m[2] ? Number(m[1]) : Math.max(15, max - 15);
  if (min >= max || max > 140) throw new Error(`Keep shorts between 15 and 140 seconds, shortest first (got ${value})`);
  return { minSec: min, maxSec: max };
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function save(ctx: ShortContext, dir: string, settings: ShortSettings, status: ShortStatus): void {
  const p = shortPaths(dir);
  writeJson(p.status, status);
  const script = existsSync(p.script) ? readScript(dir).script : null;
  const check = existsSync(p.check) ? readJson<ShortCheck>(p.check) : null;
  writeFileSync(p.review, renderShortReview(settings, status, script, check, ctx.rel(dir)));
}

function load(ctx: ShortContext) {
  const ref = ctx.positionals[2] ?? ctx.fail(`usage: pnpm video short ${ctx.positionals[1]} <job>`);
  const dir = ctx.abs(ref);
  const p = shortPaths(dir);
  if (!existsSync(p.settings)) ctx.fail(`No short.json in ${dir}: start one with \`pnpm video short new\``);
  return { dir, p, settings: readJson<ShortSettings>(p.settings), status: readJson<ShortStatus>(p.status) };
}

async function create(ctx: ShortContext): Promise<void> {
  const topic = ctx.positionals[2];
  const refs = (ctx.opt.source as string[] | undefined) ?? [];
  if (!topic || refs.length === 0) ctx.fail('usage: pnpm video short new "<topic>" --source <file|url> [--source …]');
  const visuals = str(ctx.opt.visuals) ?? "brand";
  if (visuals !== "brand" && visuals !== "stock" && visuals !== "local") ctx.fail("--visuals is brand, stock or local");
  if (visuals === "local" && !str(ctx.opt.local)) ctx.fail("--visuals local needs --local <folder of your clips and images>");
  const voice = str(ctx.opt.voice) ?? "auto";
  if (voice !== "auto") parseVoice(voice);
  const { minSec, maxSec } = parseSeconds(str(ctx.opt.seconds));

  const sources = await Promise.all(refs.map((r, i) => loadSource(ctx, r, i)));
  const ids = new Set<string>();
  const unique = sources.map((s, i) => (ids.has(s.id) ? { ...s, id: `${s.id}-${i + 1}` } : (ids.add(s.id), s)));

  const dir = ensureDir(ctx.abs(str(ctx.opt.out) ?? join("video-jobs", "shorts", slug(topic!))));
  const p = shortPaths(dir);
  ensureDir(p.sources);
  for (const s of unique) writeFileSync(join(p.sources, `${s.id}.md`), s.text);
  const settings: ShortSettings = {
    version: 1,
    topic: topic!,
    audience: str(ctx.opt.audience) ?? "builders and founders who are new to the topic",
    createdAt: new Date().toISOString(),
    minSec,
    maxSec,
    voice,
    visuals,
    ...(str(ctx.opt.local) ? { localDir: ctx.abs(str(ctx.opt.local)!) } : {}),
    ...(str(ctx.opt.music) ? { music: ctx.abs(str(ctx.opt.music)!) } : {}),
    ...(str(ctx.opt.cta) ? { cta: str(ctx.opt.cta)! } : {}),
    sources: unique.map((s) => ({ id: s.id, title: s.title, ...(s.url ? { url: s.url } : {}), file: `sources/${s.id}.md` })),
  };
  writeJson(p.settings, settings);
  writeFileSync(p.brief, renderBrief(settings, unique));
  save(ctx, dir, settings, { stage: "new" });
  console.log(
    `Short ${ctx.rel(dir)}: ${unique.length} sources, ${minSec}–${maxSec}s, ${visuals} visuals, voice ${voice}.\n` +
      `Next: pnpm video short write ${ctx.rel(dir)}   (or write script.json from brief.md)`,
  );
}

async function write(ctx: ShortContext): Promise<void> {
  const { dir, p, settings } = load(ctx);
  const sources = settings.sources.map((s) => ({ ...s, text: readFileSync(join(dir, s.file), "utf8") }));
  console.log("Writing the script with Claude…");
  let result;
  try {
    result = await writeScript(readFileSync(p.brief, "utf8"), sources, str(ctx.opt.model) ? { model: str(ctx.opt.model)! } : {});
  } catch (error) {
    return ctx.fail(
      `The writer failed: ${error instanceof Error ? error.message : String(error)}\n` +
        "Without Anthropic credentials, write script.json from brief.md yourself (an agent in a Claude Code session can).",
    );
  }
  writeJson(p.script, result.script);
  save(ctx, dir, settings, { stage: "written" });
  console.log(`Wrote ${ctx.rel(p.script)} with ${result.model} (${result.inputTokens} in, ${result.outputTokens} out). Next: pnpm video short check ${ctx.rel(dir)}`);
}

async function check(ctx: ShortContext): Promise<void> {
  const { dir, p, settings } = load(ctx);
  const { script, hash } = readScript(dir);
  const sources = readSources(dir, settings);
  const code = checkScript(script, sources, { minSec: settings.minSec, maxSec: settings.maxSec });

  let brain;
  try {
    brain = brainFromEnv({ allowHeuristic: Boolean(ctx.opt.demo), sinks: [fileSink(p.decisions)], timeoutMs: 60_000 });
  } catch {
    return ctx.fail("No decision model: set AI_GATEWAY_API_KEY (Jev) or ANTHROPIC_API_KEY, or pass --demo for a dry run");
  }
  const gate = await gateDraft(brain, draftText(script));
  const claims: ClaimResult[] = [];
  for (const [i, beat] of script.beats.entries()) {
    for (const claim of beat.claims ?? []) {
      const text = sources.get(claim.source) ?? "";
      if (!text) continue;
      const { decision, route } = await checkClaim(brain, { claim: claim.text, quote: claim.quote }, { meta: { job: basename(dir), beat: i + 1 } });
      // The heuristic can't judge whether a quote supports a claim, so a demo never cuts: a person reads each one.
      const demo = decision.provider === "heuristic";
      claims.push({
        beat: i + 1,
        text: claim.text,
        verdict: demo ? "check" : route.verdict,
        reasons: demo ? ["demo: read it against its quote yourself", ...route.reasons] : route.reasons,
      });
    }
  }
  const result: ShortCheck = {
    at: new Date().toISOString(),
    scriptHash: hash,
    code,
    gate: { verdict: gate.verdict.verdict, fixes: gate.verdict.fixes, provider: gate.decision.provider, model: gate.decision.model },
    claims,
    passed: code.problems.length === 0 && !claims.some((c) => c.verdict === "cut"),
  };
  writeJson(p.check, result);
  // A new check starts the approval over: the next render and approval are for this script.
  save(ctx, dir, settings, { stage: "checked", checkedHash: hash, checkPassed: result.passed });

  console.log(`${result.passed ? "Passed" : "Failed"}: ${code.words} words, about ${code.estimatedSeconds}s. Content gate: ${result.gate.verdict}.`);
  for (const problem of code.problems) console.log(`  problem: ${problem}`);
  for (const warning of code.warnings) console.log(`  warning: ${warning}`);
  for (const c of claims) console.log(`  beat ${c.beat} claim ${c.verdict}: ${c.text}`);
  console.log(`Review: ${ctx.rel(p.review)}${result.passed ? `\nNext: pnpm video short render ${ctx.rel(dir)}` : ""}`);
  if (!result.passed) process.exitCode = 1;
}

async function render(ctx: ShortContext): Promise<void> {
  const { dir, p, settings, status } = load(ctx);
  const { script, hash } = readScript(dir);
  const checked = status.checkPassed === true && status.checkedHash === hash;
  if (!checked && !ctx.opt.force) ctx.fail("The current script hasn't passed `short check`. Fix it and check again, or pass --force to render a draft anyway");
  if (!checked) console.warn("warning: rendering a script that hasn't passed its check (--force)");

  const voice = settings.voice === "auto" ? await autoVoice() : parseVoice(settings.voice);
  const lexicon = { ...DEFAULT_LEXICON, ...(settings.lexicon ?? {}) };
  ensureDir(p.audio);
  ensureDir(p.visuals);
  const out = ensureDir(p.renders);
  console.log(`Voicing ${script.beats.length} beats with ${voice.provider}:${voice.voice}…`);
  const spoken = [];
  for (const [i, beat] of script.beats.entries()) {
    spoken.push(await speak(voice, forSpeech(beat.narration, lexicon), p.audio, `beat-${String(i + 1).padStart(2, "0")}`));
  }
  const beats = timeline(spoken.map((s) => s.duration));
  const total = shortLength(beats);
  await run("ffmpeg", voiceArgs(spoken.map((s) => s.file), beats, join(p.audio, "voice.wav")));

  console.log(`Building ${settings.visuals} visuals for ${shortDuration(total)}…`);
  const credits: Record<string, unknown>[] = [{ part: "voice", provider: voice.provider, voice: voice.voice }];
  const localFiles = settings.localDir && existsSync(settings.localDir) ? readdirSync(settings.localDir).map((f) => join(settings.localDir!, f)).sort() : [];
  const used = new Set<string>();
  const segments: string[] = [];
  for (const b of beats) {
    const beat = script.beats[b.index]!;
    const name = `beat-${String(b.index + 1).padStart(2, "0")}.mp4`;
    const target = join(p.visuals, name);
    const accent = ACCENTS[b.index % ACCENTS.length]!;
    let args = brandArgs(b.length, accent, target, b.index + 1);
    if (beat.visual?.kind === "stock") {
      const key = process.env.PEXELS_API_KEY;
      const clip = key ? pickPexels(await searchPexels(beat.visual.query, key), b.length) : null;
      if (clip) {
        const file = join(ensureDir(join(p.visuals, "stock")), `pexels-${clip.id}.mp4`);
        await download(clip.link, file);
        args = footageArgs(file, b.length, target);
        credits.push({ part: `beat ${b.index + 1}`, provider: "pexels", id: clip.id, page: clip.page, author: clip.author, authorUrl: clip.authorUrl, licence: "Pexels License" });
      } else {
        console.warn(`  beat ${b.index + 1}: ${key ? `no portrait clip for "${beat.visual.query}"` : "no PEXELS_API_KEY"}, using the brand background`);
      }
    } else if (beat.visual?.kind === "local") {
      const file = beat.visual.file ? ctx.abs(beat.visual.file) : pickLocal(localFiles, beat.visual.query, used);
      if (file) {
        used.add(file);
        args = isImage(file) ? stillArgs(file, b.length, target) : footageArgs(file, b.length, target);
        credits.push({ part: `beat ${b.index + 1}`, provider: "client", file });
      }
    }
    await run("ffmpeg", args);
    segments.push(name);
  }
  writeFileSync(join(p.visuals, "list.txt"), concatList(segments));
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "visual.mp4"], { cwd: p.visuals });

  const words = captionWords(script.beats.map((s) => s.narration), beats);
  const headlines = beats.map((b) => ({
    text: script.beats[b.index]!.onscreen,
    start: b.start,
    end: b.start + b.length - 0.05,
    color: ACCENTS[b.index % ACCENTS.length]!,
  }));
  writeFileSync(join(out, "short.ass"), buildAss(chunkWords(words, SOCIAL_CHUNKS), captionStyle("9x16"), { headlines }));
  writeFileSync(join(out, "short.srt"), buildSrt(chunkWords(words, SUBTITLE_CHUNKS)));
  const fonts = installFonts(out);
  if (settings.music) credits.push({ part: "music", file: settings.music, note: "confirm the licence before publishing" });

  console.log("Rendering the short…");
  await run(
    "ffmpeg",
    finalArgs({
      visual: join(p.visuals, "visual.mp4"),
      voice: join(p.audio, "voice.wav"),
      total,
      ass: "short.ass",
      fontsDir: fonts,
      ...(settings.music ? { music: settings.music } : {}),
      out: "short.raw.mp4",
    }),
    { cwd: out },
  );
  await levelAndFinish(out, "short.raw.mp4", "short.mp4", true);
  await run("ffmpeg", frameArgs(join(out, "short.mp4"), Math.min(1.2, total / 2), join(out, "cover.jpg")));
  writeJson(join(out, "credits.json"), credits);
  const loud = await measureLoudness(join(out, "short.mp4"));

  const next: ShortStatus = { stage: "rendered", ...(status.checkedHash ? { checkedHash: status.checkedHash } : {}), checkPassed: checked, renderedHash: hash, ...(checked ? {} : { forced: true }) };
  save(ctx, dir, settings, next);
  console.log(
    `  ${ctx.rel(join(out, "short.mp4"))}  ${shortDuration(total)}${loud ? `  ${loud.input_i} LUFS, true peak ${loud.input_tp} dBTP` : ""}\n` +
      `  ${ctx.rel(join(out, "short.srt"))} · ${ctx.rel(join(out, "cover.jpg"))}\nWatch it, then: pnpm video short approve ${ctx.rel(dir)} --by "Your name"`,
  );
}

function approve(ctx: ShortContext): void {
  const { dir, settings, status } = load(ctx);
  const by = str(ctx.opt.by)?.trim();
  if (!by) ctx.fail('A person approves each short: add --by "<name>"');
  const { hash } = readScript(dir);
  if (status.stage !== "rendered" && status.stage !== "approved") ctx.fail("Render the short and watch it before approving");
  if (status.renderedHash !== hash) ctx.fail("script.json changed after the render: render again, then approve");
  if (status.forced) console.log("Note: this render skipped a failed check (--force). Approving means you checked it yourself.");
  save(ctx, dir, settings, { ...status, stage: "approved", approvedBy: by!, approvedAt: new Date().toISOString() });
  console.log(`Approved by ${by}. Nothing has been posted; post it from your own account.`);
}

export async function runShort(ctx: ShortContext): Promise<void> {
  const sub = ctx.positionals[1];
  const commands: Record<string, (c: ShortContext) => void | Promise<void>> = { new: create, write, check, render, approve };
  if (!sub || !(sub in commands)) {
    console.log(SHORT_HELP);
    if (sub) process.exitCode = 1;
    return;
  }
  await commands[sub]!(ctx);
}
