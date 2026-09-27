import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseVoice } from "./short/voice";
import {
  addRelease,
  loadRegistry,
  newReleaseProblems,
  revokeRelease,
  saveRelease,
  voiceEngine,
  VOICE_USES,
  type StockVoice,
  type VoiceProfile,
} from "./voices";

export const VOICE_HELP = `Voices: a release for every cloned voice, and a declaration for every stock voice. Nothing clones without a release.

  pnpm video voice add "<person>" --client "<client>" --languages en,fr --uses shorts,dubs --channels youtube,tiktok
                       --until 2027-09-30 --release <signed file> --consent <recording> --statement "<what they read>" --by "<approver>"
  pnpm video voice link <release> --voice local:<voice id> [--engine voxcpm2]   a voice made from this person's reference audio
  pnpm video voice stock <provider:voice> --name "<what it is>" --by "<name>" [--engine <id>]   a voice that is nobody's clone
  pnpm video voice list
  pnpm video voice revoke <release> --by "<name>" --reason "<why>"

Uses: ${VOICE_USES.join(", ")}. The consent recording is the person reading the statement in their own voice; it has to name
them, Shonin and the client. The registry is video-jobs/voices (VOICE_REGISTRY moves it), which git ignores.`;

export interface VoiceContext {
  readonly positionals: readonly string[];
  readonly opt: Readonly<Record<string, string | boolean | string[] | undefined>>;
  readonly abs: (p: string) => string;
  readonly rel: (p: string) => string;
  readonly fail: (message: string) => never;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown) => str(v).split(",").map((s) => s.trim()).filter(Boolean);
export const today = () => new Date().toISOString().slice(0, 10);

/** Where releases live: video-jobs/voices unless VOICE_REGISTRY says otherwise. */
export const registryDir = (abs: (p: string) => string) => abs(process.env.VOICE_REGISTRY ?? join("video-jobs", "voices"));

function add(ctx: VoiceContext): void {
  const person = ctx.positionals[2] ?? ctx.fail('usage: pnpm video voice add "<person>" --client … (see pnpm video voice)');
  const draft = {
    person,
    client: str(ctx.opt.client),
    languages: list(ctx.opt.languages),
    uses: list(ctx.opt.uses),
    channels: list(ctx.opt.channels),
    until: str(ctx.opt.until),
    releaseFile: ctx.abs(str(ctx.opt.release) || "-"),
    consentFile: ctx.abs(str(ctx.opt.consent) || "-"),
    statement: str(ctx.opt.statement),
    approvedBy: str(ctx.opt.by),
    today: today(),
  };
  if (!draft.client) ctx.fail("--client names the one client the voice may be used for (Shonin for our own channel)");
  const problems = newReleaseProblems(draft);
  if (problems.length) ctx.fail(`No release recorded:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  const release = addRelease(registryDir(ctx.abs), draft);
  console.log(
    `Recorded release ${release.id}: ${release.person}'s voice for ${release.client}, ${release.languages.join(", ")}, until ${release.until}.\n` +
      `Next: make the voice on its engine (VoiceStudio: POST /profiles with the reference audio), then\n` +
      `  pnpm video voice link ${release.id} --voice local:<voice id>`,
  );
}

function link(ctx: VoiceContext): void {
  const id = ctx.positionals[2] ?? ctx.fail("usage: pnpm video voice link <release> --voice <provider:voice> [--engine <id>]");
  const dir = registryDir(ctx.abs);
  const registry = loadRegistry(dir);
  const release = registry.releases.find((r) => r.id === id) ?? ctx.fail(`No release ${id}: see pnpm video voice list`);
  if (release.revoked) ctx.fail(`Release ${id} was revoked`);
  const spec = parseVoice(str(ctx.opt.voice) || ctx.fail("--voice names the voice made from this person's audio, such as local:ada-voxcpm2"));
  const detected = voiceEngine(spec, str(ctx.opt.engine) ? { ...process.env, LOCAL_TTS_MODEL: str(ctx.opt.engine) } : process.env);
  if (!detected.clones) ctx.fail(`${detected.engine} doesn't clone voices, so there's nothing to link`);
  const profile: VoiceProfile = { provider: spec.provider, engine: detected.engine, voice: spec.voice };
  const same = (p: VoiceProfile) => p.provider === profile.provider && p.engine === profile.engine && p.voice === profile.voice;
  const owner = registry.releases.find((r) => r.profiles.some(same));
  if (owner) ctx.fail(`That voice is already linked to release ${owner.id}`);
  if (registry.stock.some(same)) ctx.fail("That voice is declared stock; a clone can't be stock");
  saveRelease(dir, { ...release, profiles: [...release.profiles, profile] });
  console.log(`Linked ${spec.provider}:${spec.voice} on ${detected.engine} to ${release.id}. Renders with it now check that release.`);
}

function stock(ctx: VoiceContext): void {
  const ref = ctx.positionals[2] ?? ctx.fail('usage: pnpm video voice stock <provider:voice> --name "<what it is>" --by "<name>"');
  const name = str(ctx.opt.name) || ctx.fail('--name says what the voice is, such as "ElevenLabs library voice Rachel"');
  const by = str(ctx.opt.by) || ctx.fail("A person declares a stock voice: add --by");
  const spec = parseVoice(ref);
  const detected = voiceEngine(spec, str(ctx.opt.engine) ? { ...process.env, LOCAL_TTS_MODEL: str(ctx.opt.engine) } : process.env);
  const dir = registryDir(ctx.abs);
  const registry = loadRegistry(dir);
  const entry: StockVoice = { provider: spec.provider, engine: detected.engine, voice: spec.voice, name, approvedBy: by, approvedAt: new Date().toISOString() };
  const same = (p: VoiceProfile) => p.provider === entry.provider && p.engine === entry.engine && p.voice === entry.voice;
  const owner = registry.releases.find((r) => r.profiles.some(same));
  if (owner) ctx.fail(`That voice is linked to release ${owner.id}: it's a clone, not stock`);
  writeFileSync(join(dir, "stock.json"), `${JSON.stringify([...registry.stock.filter((s) => !same(s)), entry], null, 2)}\n`);
  console.log(`Declared ${spec.provider}:${spec.voice} on ${detected.engine} a stock voice (${name}), by ${by}.`);
}

function show(ctx: VoiceContext): void {
  const { releases, stock: stockVoices } = loadRegistry(registryDir(ctx.abs));
  if (releases.length === 0 && stockVoices.length === 0) {
    console.log("No releases or stock voices yet. See pnpm video voice for how to add one.");
    return;
  }
  const now = today();
  for (const r of releases) {
    const status = r.revoked ? `revoked ${r.revoked.at.slice(0, 10)}` : r.until < now ? `ended ${r.until}` : `active until ${r.until}`;
    const voices = r.profiles.map((p) => `${p.provider}:${p.voice} (${p.engine})`).join(", ") || "no voice linked";
    console.log(`${r.id}  ${status}\n  ${r.person} for ${r.client} · ${r.languages.join(", ")} · ${r.uses.join(", ")} · ${voices}`);
  }
  for (const s of stockVoices) console.log(`stock  ${s.provider}:${s.voice} (${s.engine}): ${s.name}, declared by ${s.approvedBy}`);
}

function revoke(ctx: VoiceContext): void {
  const id = ctx.positionals[2] ?? ctx.fail('usage: pnpm video voice revoke <release> --by "<name>" --reason "<why>"');
  const by = str(ctx.opt.by) || ctx.fail("add --by");
  const reason = str(ctx.opt.reason) || ctx.fail("add --reason");
  const dir = registryDir(ctx.abs);
  const release = loadRegistry(dir).releases.find((r) => r.id === id) ?? ctx.fail(`No release ${id}`);
  if (release.revoked) ctx.fail(`Release ${id} was already revoked on ${release.revoked.at.slice(0, 10)}`);
  const done = revokeRelease(dir, release, by, reason);
  console.log(
    `Revoked ${done.id}. The consent recording is deleted; its hash stays. Renders and approvals with its voices now fail.` +
      (done.profiles.length ? `\nDelete these voices on their servers too (VoiceStudio: DELETE /profiles/<id>): ${done.profiles.map((p) => p.voice).join(", ")}` : ""),
  );
}

export async function runVoice(ctx: VoiceContext): Promise<void> {
  const sub = ctx.positionals[1];
  const commands: Record<string, (c: VoiceContext) => void> = { add, link, stock, list: show, revoke };
  if (!sub || !(sub in commands)) {
    console.log(VOICE_HELP);
    if (sub) process.exitCode = 1;
    return;
  }
  commands[sub]!(ctx);
}
