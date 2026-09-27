import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { LOCAL_ENGINES, localEngineId, type VoiceSpec } from "./short/voice";

/**
 * Consent-first voice cloning (research/voicestudio.md §7c). A cloned voice is a person's biometric data under
 * Nigeria's Data Protection Act and their likeness on every platform we post to. No signed release and spoken
 * consent, no clone: code refuses to render or approve a cloned voice without an active release that covers the
 * job. Edidiong approves every release. The registry holds voice recordings, so it lives in video-jobs/voices,
 * which git ignores.
 */

export const VOICE_USES = ["shorts", "dubs", "clips", "ads", "podcasts"] as const;
export type VoiceUse = (typeof VOICE_USES)[number];

export interface VoiceProfile {
  readonly provider: string;
  /** The engine that made it: voxcpm2, elevenlabs. */
  readonly engine: string;
  readonly voice: string;
}

export interface VoiceRelease {
  readonly version: 1;
  readonly id: string;
  /** The person whose voice it is. */
  readonly person: string;
  /** The one client it may be used for: "Shonin" for our own channel. */
  readonly client: string;
  /** Languages it may speak, as BCP 47 prefixes: en, fr, sw. */
  readonly languages: readonly string[];
  readonly uses: readonly VoiceUse[];
  readonly channels: readonly string[];
  /** The last day it may be used, YYYY-MM-DD. */
  readonly until: string;
  /** The signed release, copied into the registry, with its hash. */
  readonly release: { readonly file: string; readonly sha256: string };
  /** The person reading the consent statement in their own voice. Deleted on revocation; the hash stays. */
  readonly consent: { readonly file: string; readonly sha256: string; readonly statement: string };
  /** Voices made from this person's reference audio, on engines that clone. */
  readonly profiles: readonly VoiceProfile[];
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly revoked?: { readonly by: string; readonly at: string; readonly reason: string };
}

/** A voice that is nobody's clone, such as a library or designed voice, declared so by a person. */
export interface StockVoice extends VoiceProfile {
  readonly name: string;
  readonly approvedBy: string;
  readonly approvedAt: string;
}

export interface VoiceRegistry {
  readonly releases: readonly VoiceRelease[];
  readonly stock: readonly StockVoice[];
}

/** The engine behind a voice, and whether it can clone. An engine we don't know is assumed able to. */
export function voiceEngine(spec: VoiceSpec, env: NodeJS.ProcessEnv): { engine: string; clones: boolean } {
  switch (spec.provider) {
    case "local": {
      const engine = localEngineId(env);
      return { engine, clones: LOCAL_ENGINES[engine]?.clones ?? true };
    }
    case "elevenlabs":
      // Instant and professional voice clones share the id space with library voices.
      return { engine: "elevenlabs", clones: true };
    default:
      return { engine: spec.provider, clones: false };
  }
}

/** Names that servers map to their engine's built-in default voice. */
const DEFAULT_VOICE_NAMES = new Set(["default", "alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"]);
/** Voices an engine ships with: Kokoro's are a language letter, a sex letter and a name (af_heart, bm_george). */
const PRESETS: Readonly<Record<string, RegExp>> = { kokoro: /^[a-z][fm]_[a-z]+$/ };

export function isPreset(spec: VoiceSpec, engine: string): boolean {
  if (spec.provider !== "local") return false;
  return DEFAULT_VOICE_NAMES.has(spec.voice) || Boolean(PRESETS[engine]?.test(spec.voice));
}

export interface CloneJob {
  readonly client: string;
  readonly language: string;
  readonly use: VoiceUse;
  /** YYYY-MM-DD. */
  readonly date: string;
}

/** What stops a release from covering a job. Empty means it covers it. */
export function releaseProblems(r: VoiceRelease, job: CloneJob): string[] {
  const problems: string[] = [];
  const lang = job.language.toLowerCase().split("-")[0]!;
  if (r.revoked) problems.push(`release ${r.id} was revoked on ${r.revoked.at.slice(0, 10)} by ${r.revoked.by}: ${r.revoked.reason}`);
  if (job.date > r.until) problems.push(`release ${r.id} ended on ${r.until}`);
  if (r.client.trim().toLowerCase() !== job.client.trim().toLowerCase()) problems.push(`release ${r.id} is for ${r.client}, not ${job.client}`);
  if (!r.languages.some((l) => l.toLowerCase().split("-")[0] === lang)) problems.push(`release ${r.id} covers ${r.languages.join(", ")}, not ${lang}`);
  if (!r.uses.includes(job.use)) problems.push(`release ${r.id} covers ${r.uses.join(", ")}, not ${job.use}`);
  return problems;
}

export type CloneCheck =
  | { readonly clone: false; readonly stock?: StockVoice }
  | { readonly clone: true; readonly release?: VoiceRelease; readonly problems: readonly string[] };

const same = (a: VoiceProfile, b: VoiceProfile) => a.provider === b.provider && a.engine === b.engine && a.voice === b.voice;

/**
 * Whether a voice is someone's clone and, if so, whether a release covers this job. A voice on an engine that
 * can clone is treated as a clone unless it is a preset or a person declared it stock: fail closed.
 */
export function checkClone(spec: VoiceSpec, engine: { engine: string; clones: boolean }, registry: VoiceRegistry, job: CloneJob): CloneCheck {
  if (!engine.clones || isPreset(spec, engine.engine)) return { clone: false };
  const profile = { provider: spec.provider, engine: engine.engine, voice: spec.voice };
  const stock = registry.stock.find((s) => same(s, profile));
  if (stock) return { clone: false, stock };
  const release = registry.releases.find((r) => r.profiles.some((p) => same(p, profile)));
  if (!release) {
    return {
      clone: true,
      problems: [
        `${spec.provider}:${spec.voice} on ${engine.engine} is neither a preset nor a declared stock voice, so it counts as someone's clone, and no release covers it. Record one with \`pnpm video voice add\` and \`voice link\`, or declare a stock voice with \`voice stock\``,
      ],
    };
  }
  return { clone: true, release, problems: releaseProblems(release, job) };
}

/** A statement read aloud in the person's own voice has to name them, us and the client. */
export function consentProblems(person: string, client: string, statement: string): string[] {
  const text = statement.toLowerCase();
  const problems: string[] = [];
  if (!text.includes(person.trim().toLowerCase())) problems.push(`the statement doesn't name ${person}`);
  if (!text.includes("shonin")) problems.push("the statement doesn't name Shonin");
  if (!text.includes(client.trim().toLowerCase())) problems.push(`the statement doesn't name the client, ${client}`);
  if (statement.trim().split(/\s+/).length < 12) problems.push("the statement is too short to be a consent: say who, for whom and what for");
  return problems;
}

export const sha256File = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

const slugOf = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function loadRegistry(dir: string): VoiceRegistry {
  const releases: VoiceRelease[] = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, "release.json")))
        .map((d) => JSON.parse(readFileSync(join(dir, d.name, "release.json"), "utf8")) as VoiceRelease)
    : [];
  const stockFile = join(dir, "stock.json");
  const stock = existsSync(stockFile) ? (JSON.parse(readFileSync(stockFile, "utf8")) as StockVoice[]) : [];
  return { releases, stock };
}

export function saveRelease(dir: string, release: VoiceRelease): void {
  mkdirSync(join(dir, release.id), { recursive: true });
  writeFileSync(join(dir, release.id, "release.json"), `${JSON.stringify(release, null, 2)}\n`);
}

export interface NewRelease {
  readonly person: string;
  readonly client: string;
  readonly languages: readonly string[];
  readonly uses: readonly string[];
  readonly channels: readonly string[];
  readonly until: string;
  readonly releaseFile: string;
  readonly consentFile: string;
  readonly statement: string;
  readonly approvedBy: string;
  readonly today: string;
}

/** Everything wrong with a new release, before anything is copied. */
export function newReleaseProblems(r: NewRelease): string[] {
  const problems = consentProblems(r.person, r.client, r.statement);
  if (!r.approvedBy.trim()) problems.push("a person approves every release: add --by");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.until) || r.until <= r.today) problems.push(`--until is the last day of use, YYYY-MM-DD and after today (got "${r.until}")`);
  if (r.languages.length === 0) problems.push("name the languages the voice may speak: --languages en,fr");
  const unknown = r.uses.filter((u) => !(VOICE_USES as readonly string[]).includes(u));
  if (r.uses.length === 0 || unknown.length) problems.push(`--uses takes ${VOICE_USES.join(", ")}${unknown.length ? ` (not ${unknown.join(", ")})` : ""}`);
  if (r.channels.length === 0) problems.push("name the channels: --channels youtube,tiktok,instagram,x");
  if (!existsSync(r.releaseFile)) problems.push(`no signed release at ${r.releaseFile}`);
  if (!existsSync(r.consentFile)) problems.push(`no consent recording at ${r.consentFile}`);
  return problems;
}

/** Copies the signed release and the consent recording into the registry and records their hashes. */
export function addRelease(dir: string, r: NewRelease): VoiceRelease {
  const id = `${slugOf(r.person)}-${slugOf(r.client)}-${r.today}`;
  if (existsSync(join(dir, id))) throw new Error(`A release ${id} already exists: revoke it or add the new one tomorrow`);
  mkdirSync(join(dir, id), { recursive: true });
  const releaseCopy = `release${extname(r.releaseFile).toLowerCase()}`;
  const consentCopy = `consent${extname(r.consentFile).toLowerCase()}`;
  copyFileSync(r.releaseFile, join(dir, id, releaseCopy));
  copyFileSync(r.consentFile, join(dir, id, consentCopy));
  const release: VoiceRelease = {
    version: 1,
    id,
    person: r.person.trim(),
    client: r.client.trim(),
    languages: r.languages,
    uses: r.uses as VoiceUse[],
    channels: r.channels,
    until: r.until,
    release: { file: releaseCopy, sha256: sha256File(r.releaseFile) },
    consent: { file: consentCopy, sha256: sha256File(r.consentFile), statement: r.statement.trim() },
    profiles: [],
    approvedBy: r.approvedBy.trim(),
    approvedAt: new Date().toISOString(),
  };
  saveRelease(dir, release);
  return release;
}

/** Marks a release revoked and deletes the consent recording; the hashes stay as the record. */
export function revokeRelease(dir: string, release: VoiceRelease, by: string, reason: string): VoiceRelease {
  const revoked: VoiceRelease = { ...release, revoked: { by: by.trim(), at: new Date().toISOString(), reason: reason.trim() } };
  rmSync(join(dir, release.id, release.consent.file), { force: true });
  saveRelease(dir, revoked);
  return revoked;
}
