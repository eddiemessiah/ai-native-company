import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addRelease,
  checkClone,
  consentProblems,
  isPreset,
  loadRegistry,
  newReleaseProblems,
  parseVoice,
  releaseProblems,
  revokeRelease,
  saveRelease,
  voiceEngine,
  type CloneJob,
  type VoiceRelease,
} from "../src/index";

const statement = "I, Ada Obi, agree that Shonin may make an AI copy of my voice for Kowry's shorts in English and French until September 2027.";
const job: CloneJob = { client: "Kowry", language: "fr", use: "shorts", date: "2026-10-01" };
const release: VoiceRelease = {
  version: 1,
  id: "ada-obi-kowry-2026-09-27",
  person: "Ada Obi",
  client: "Kowry",
  languages: ["en", "fr"],
  uses: ["shorts", "dubs"],
  channels: ["youtube", "tiktok"],
  until: "2027-09-30",
  release: { file: "release.pdf", sha256: "a" },
  consent: { file: "consent.wav", sha256: "b", statement },
  profiles: [{ provider: "local", engine: "voxcpm2", voice: "ada-obi" }],
  approvedBy: "Edidiong",
  approvedAt: "2026-09-27T12:00:00.000Z",
};

describe("consent", () => {
  it("needs the person, Shonin and the client named in a real sentence", () => {
    expect(consentProblems("Ada Obi", "Kowry", statement)).toEqual([]);
    expect(consentProblems("Ada Obi", "Kowry", "I agree.")).toEqual([
      "the statement doesn't name Ada Obi",
      "the statement doesn't name Shonin",
      "the statement doesn't name the client, Kowry",
      "the statement is too short to be a consent: say who, for whom and what for",
    ]);
  });

  it("checks a new release before copying anything", () => {
    const base = {
      person: "Ada Obi",
      client: "Kowry",
      languages: ["en"],
      uses: ["shorts"],
      channels: ["tiktok"],
      until: "2027-01-01",
      releaseFile: "/nope.pdf",
      consentFile: "/nope.wav",
      statement,
      approvedBy: "Edidiong",
      today: "2026-09-27",
    };
    const problems = newReleaseProblems({ ...base, until: "2026-09-01", uses: ["shorts", "deepfakes"], approvedBy: " " }).join("\n");
    expect(problems).toMatch(/a person approves every release/);
    expect(problems).toMatch(/--until is the last day of use/);
    expect(problems).toMatch(/--uses takes shorts, dubs, clips, ads, podcasts \(not deepfakes\)/);
    expect(problems).toMatch(/no signed release at \/nope.pdf/);
    expect(problems).toMatch(/no consent recording at \/nope.wav/);
  });
});

describe("clones", () => {
  it("knows which engines clone, and fails closed on one it doesn't know", () => {
    expect(voiceEngine(parseVoice("local:af_heart"), {})).toEqual({ engine: "kokoro", clones: false });
    expect(voiceEngine(parseVoice("local:ada-obi"), { LOCAL_TTS_MODEL: "voxcpm2" })).toEqual({ engine: "voxcpm2", clones: true });
    expect(voiceEngine(parseVoice("local:x"), { LOCAL_TTS_MODEL: "some-new-engine" })).toEqual({ engine: "some-new-engine", clones: true });
    expect(voiceEngine(parseVoice("elevenlabs:abc"), {})).toEqual({ engine: "elevenlabs", clones: true });
    expect(voiceEngine(parseVoice("azure"), {})).toEqual({ engine: "azure", clones: false });
  });

  it("treats a cloning engine's unknown voice as someone's clone", () => {
    expect(isPreset(parseVoice("local:default"), "voxcpm2")).toBe(true);
    expect(isPreset(parseVoice("local:bm_george"), "kokoro")).toBe(true);
    const registry = { releases: [], stock: [] };
    const vox = { engine: "voxcpm2", clones: true };
    expect(checkClone(parseVoice("local:default"), vox, registry, job)).toEqual({ clone: false });
    const unknown = checkClone(parseVoice("local:ada-obi"), vox, registry, job);
    expect(unknown.clone && unknown.problems[0]).toMatch(/counts as someone's clone, and no release covers it/);
    const declared = {
      releases: [],
      stock: [{ provider: "elevenlabs", engine: "elevenlabs", voice: "lib1", name: "library voice", approvedBy: "E", approvedAt: "t" }],
    };
    expect(checkClone(parseVoice("elevenlabs:lib1"), { engine: "elevenlabs", clones: true }, declared, job)).toMatchObject({ clone: false, stock: { name: "library voice" } });
  });

  it("uses a clone only inside its release: client, language, use, dates", () => {
    const vox = { engine: "voxcpm2", clones: true };
    expect(checkClone(parseVoice("local:ada-obi"), vox, { releases: [release], stock: [] }, job)).toEqual({ clone: true, release, problems: [] });
    expect(releaseProblems(release, { ...job, client: "Another Co" })).toEqual(["release ada-obi-kowry-2026-09-27 is for Kowry, not Another Co"]);
    expect(releaseProblems(release, { ...job, language: "sw-KE" })).toEqual(["release ada-obi-kowry-2026-09-27 covers en, fr, not sw"]);
    expect(releaseProblems(release, { ...job, use: "ads" })).toEqual(["release ada-obi-kowry-2026-09-27 covers shorts, dubs, not ads"]);
    expect(releaseProblems(release, { ...job, date: "2027-10-01" })).toEqual(["release ada-obi-kowry-2026-09-27 ended on 2027-09-30"]);
    const revoked = { ...release, revoked: { by: "Ada Obi", at: "2026-12-01T09:00:00.000Z", reason: "changed her mind" } };
    expect(releaseProblems(revoked, job)).toEqual(["release ada-obi-kowry-2026-09-27 was revoked on 2026-12-01 by Ada Obi: changed her mind"]);
  });
});

describe("registry", () => {
  it("records a release with hashes, links a voice, and revokes by deleting the recording", () => {
    const dir = mkdtempSync(join(tmpdir(), "voices-"));
    const pdf = join(dir, "signed.pdf");
    const wav = join(dir, "said.wav");
    writeFileSync(pdf, "signed");
    writeFileSync(wav, "audio");
    const reg = join(dir, "registry");
    const input = {
      person: "Ada Obi",
      client: "Kowry",
      languages: ["en", "fr"],
      uses: ["shorts"],
      channels: ["tiktok"],
      until: "2027-09-30",
      releaseFile: pdf,
      consentFile: wav,
      statement,
      approvedBy: "Edidiong",
      today: "2026-09-27",
    };
    const made = addRelease(reg, input);
    expect(made.id).toBe("ada-obi-kowry-2026-09-27");
    expect(made.release.sha256).toBe(createHash("sha256").update("signed").digest("hex"));
    expect(made.consent.sha256).toBe(createHash("sha256").update("audio").digest("hex"));
    expect(readFileSync(join(reg, made.id, "consent.wav"), "utf8")).toBe("audio");
    saveRelease(reg, { ...made, profiles: [{ provider: "local", engine: "voxcpm2", voice: "ada-obi" }] });
    expect(loadRegistry(reg).releases[0]!.profiles).toHaveLength(1);
    expect(() => addRelease(reg, input)).toThrow(/already exists/);
    const revoked = revokeRelease(reg, loadRegistry(reg).releases[0]!, "Edidiong", "client asked");
    expect(existsSync(join(reg, made.id, "consent.wav"))).toBe(false);
    expect(existsSync(join(reg, made.id, "release.pdf"))).toBe(true);
    const saved = JSON.parse(readFileSync(join(reg, made.id, "release.json"), "utf8")) as VoiceRelease;
    expect(saved.revoked).toMatchObject({ by: "Edidiong", reason: "client asked" });
    expect(saved.consent.sha256).toBe(revoked.consent.sha256);
    expect(checkClone(parseVoice("local:ada-obi"), { engine: "voxcpm2", clones: true }, loadRegistry(reg), { ...job, client: "Kowry" })).toMatchObject({
      clone: true,
      problems: [expect.stringMatching(/was revoked/)],
    });
  });
});
