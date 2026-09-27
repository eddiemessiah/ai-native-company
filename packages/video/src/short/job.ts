import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { shortDuration } from "../time";
import { sceneText } from "./scene";
import type { ScriptReport, ShortScript } from "./script";
import type { VoiceLicence, VoiceSpec } from "./voice";

/**
 * An explainer-short job, one folder:
 *
 *   short.json       the brief's settings: topic, length, voice, visuals, sources
 *   sources/         the source texts, as given (every claim must quote one)
 *   brief.md         what the writer gets
 *   script.json      what the writer returned
 *   check.json       code checks, the content gate and every claim's verdict
 *   status.json      where the job is, and who approved which script
 *   decisions.jsonl  one brain decision per line (state hashed)
 *   audio/ visuals/  per-beat voice and picture
 *   renders/         short.mp4, short.srt, cover.jpg, credits.json, publish.json (labels, post, claim-to-source list)
 *   review.md        the sheet a person approves from
 */
export interface ShortSettings {
  readonly version: 1;
  readonly topic: string;
  readonly audience: string;
  readonly createdAt: string;
  readonly minSec: number;
  readonly maxSec: number;
  /** "auto", or "provider[:voice]", e.g. "azure:en-NG-AbeoNeural". */
  readonly voice: string;
  readonly visuals: "brand" | "stock" | "local";
  readonly localDir?: string;
  readonly music?: string;
  /** The licence id or certificate for the music bed: what clears a Content ID claim. */
  readonly musicLicence?: string;
  readonly cta?: string;
  /** Who the short is for: a cloned voice's release must name them. Our own channel is "Shonin". */
  readonly client?: string;
  /** The language it speaks, as a BCP 47 tag: en unless set. */
  readonly language?: string;
  readonly lexicon?: Readonly<Record<string, string>>;
  readonly sources: readonly { readonly id: string; readonly title: string; readonly url?: string; readonly file: string }[];
}

export interface ClaimResult {
  readonly beat: number;
  readonly text: string;
  readonly verdict: "ok" | "check" | "cut";
  readonly reasons: readonly string[];
}

export interface ShortCheck {
  readonly at: string;
  readonly scriptHash: string;
  readonly code: ScriptReport;
  readonly gate: { readonly verdict: string; readonly fixes: readonly string[]; readonly provider: string; readonly model: string };
  readonly claims: readonly ClaimResult[];
  /** No code problems and no claim to cut. The gate's verdict is advice for the person approving. */
  readonly passed: boolean;
}

export interface ShortStatus {
  stage: "new" | "written" | "checked" | "rendered" | "approved";
  checkedHash?: string;
  checkPassed?: boolean;
  renderedHash?: string;
  forced?: boolean;
  /** The voice of the last render, the licence it was used under and, for a clone, its release. Approval refuses a draft voice. */
  voice?: VoiceSpec & VoiceLicence & { readonly engine?: string; readonly clones?: boolean; readonly release?: string };
  approvedBy?: string;
  approvedAt?: string;
}

export function shortPaths(dir: string) {
  return {
    dir,
    settings: join(dir, "short.json"),
    status: join(dir, "status.json"),
    sources: join(dir, "sources"),
    brief: join(dir, "brief.md"),
    script: join(dir, "script.json"),
    check: join(dir, "check.json"),
    decisions: join(dir, "decisions.jsonl"),
    audio: join(dir, "audio"),
    visuals: join(dir, "visuals"),
    renders: join(dir, "renders"),
    publish: join(dir, "renders", "publish.json"),
    review: join(dir, "review.md"),
  };
}

export const hashText = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);

export function readScript(dir: string): { script: ShortScript; hash: string } {
  const file = shortPaths(dir).script;
  if (!existsSync(file)) throw new Error(`No script.json in ${dir}: run \`short write\`, or write it from brief.md`);
  const text = readFileSync(file, "utf8");
  return { script: JSON.parse(text) as ShortScript, hash: hashText(text) };
}

export function readSources(dir: string, settings: ShortSettings): Map<string, string> {
  return new Map(settings.sources.map((s) => [s.id, readFileSync(join(dir, s.file), "utf8")]));
}

/** The sheet a person approves from. Regenerated after every step. */
export function renderShortReview(
  settings: ShortSettings,
  status: ShortStatus,
  script: ShortScript | null,
  check: ShortCheck | null,
  jobRef: string,
): string {
  const lines = [`# Short: ${script?.title ?? settings.topic}`, "", `Topic: ${settings.topic}. Stage: **${status.stage}**.`, ""];
  if (status.stage === "approved") lines.push(`Approved by ${status.approvedBy} at ${status.approvedAt}.`, "");
  if (status.forced) lines.push("> Rendered with `--force` past a failed check.", "");
  if (status.voice) {
    const v = status.voice;
    lines.push(
      v.use === "publish"
        ? `Voice: ${v.provider}:${v.voice}, under ${v.licence}.`
        : `> **Draft voice.** ${v.provider}:${v.voice} (${v.licence}): ${v.note ?? "not for publishing"}. Approval needs a licensed voice.`,
      "",
    );
  }
  if (check) {
    const cut = check.claims.filter((c) => c.verdict === "cut").length;
    const flagged = check.claims.filter((c) => c.verdict === "check").length;
    lines.push(
      "## Check",
      "",
      `${check.passed ? "Passed" : "**Failed**"}: ${check.code.words} words (about ${check.code.estimatedSeconds}s spoken), ` +
        `${check.claims.length} claims (${cut} to cut, ${flagged} for a person). Content gate: **${check.gate.verdict}** ` +
        `via ${check.gate.provider}/${check.gate.model}.`,
      "",
    );
    if (check.gate.provider === "heuristic") {
      lines.push("> **Demo check.** The heuristic can't judge writing or claims. Read every claim against its source yourself.", "");
    }
    for (const p of check.code.problems) lines.push(`- problem: ${p}`);
    for (const w of check.code.warnings) lines.push(`- warning: ${w}`);
    for (const f of check.gate.fixes) lines.push(`- gate: ${f}`);
    for (const c of check.claims.filter((x) => x.verdict !== "ok")) lines.push(`- beat ${c.beat}, ${c.verdict}: "${c.text}" (${c.reasons.join("; ")})`);
    lines.push("");
  }
  if (script) {
    lines.push("## Script", "");
    script.beats.forEach((b, i) => {
      lines.push(`**${i + 1}. ${b.onscreen}**`, "", `> ${b.narration}`, "");
      if (b.visual?.kind === "scene") {
        const shown = b.visual.template === "code" ? b.visual.data.lines.map((l) => `\`${l}\``) : sceneText(b.visual);
        lines.push(`Scene (${b.visual.template}): ${shown.join(" · ")}`, "");
      }
      for (const c of b.claims ?? []) lines.push(`- "${c.quote}" (${c.source})`);
      if ((b.claims ?? []).length > 0) lines.push("");
    });
    lines.push("## Post", "", script.post, "", "## Sources", "");
    for (const s of script.sources) lines.push(`- ${s.id}: ${s.title}${s.url ? ` (${s.url})` : ""}`);
    lines.push("");
  }
  if (status.stage === "rendered" || status.stage === "approved") {
    lines.push(
      "## Files",
      "",
      "`renders/short.mp4` · `renders/short.srt` · `renders/cover.jpg` · `renders/credits.json` · `renders/publish.json`",
      "",
      "When you post, switch on the AI label on every platform: YouTube's altered-or-synthetic setting, TikTok's AI-generated label, Meta's AI info. `publish.json` has the post and the claim-to-source list.",
      "",
    );
  }
  lines.push(
    "Nothing here publishes. Watch the render, then approve it and post it yourself:",
    "",
    "```bash",
    `pnpm video short approve ${jobRef} --by "Your name"`,
    "```",
    "",
  );
  return lines.join("\n");
}

export function describeLength(check: ShortCheck | null, seconds?: number): string {
  if (seconds !== undefined) return shortDuration(seconds);
  return check ? `about ${check.code.estimatedSeconds}s` : "";
}
