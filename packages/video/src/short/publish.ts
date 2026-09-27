import { disclosesAI, type ShortScript } from "./script";
import type { VoiceLicence, VoiceSpec } from "./voice";

/**
 * What the client needs to post a short: the files, the copy, the AI labels switched on, and every sentence
 * with the passage it rests on. We never post; this is the checklist the person who posts works from.
 */
export interface PublishPacket {
  readonly version: 1;
  readonly file: string;
  readonly captions: string;
  readonly cover: string;
  readonly title: string;
  readonly post: string;
  /** BCP 47 tag of the language the short speaks. */
  readonly language: string;
  /** YouTube, TikTok and Meta all require a label on synthetic voices (research/explainer-shorts.md §4). */
  readonly labels: {
    readonly youtube: { readonly containsSyntheticMedia: boolean };
    readonly tiktok: { readonly aiGeneratedContent: boolean };
    readonly meta: { readonly aiInfo: boolean };
  };
  readonly voice: VoiceSpec & VoiceLicence;
  /** Pexels asks for a credit when there's room; its licence doesn't require one. */
  readonly footageCredit?: string;
  /** A credit the voice's licence requires, such as CC-BY-4.0 weights. It goes in the post or description. */
  readonly voiceCredit?: string;
  /** Every beat's narration, and the passage and source behind each fact in it. */
  readonly claims: readonly PacketBeat[];
  readonly scriptHash: string;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
}

export interface PacketBeat {
  readonly beat: number;
  readonly narration: string;
  readonly sources: readonly { claim: string; quote: string; source: string; title: string; url?: string }[];
}

export function publishPacket(
  script: ShortScript,
  voice: VoiceSpec & VoiceLicence,
  scriptHash: string,
  opts: { footageAuthors?: readonly string[]; voiceCredit?: string; language?: string } = {},
): PublishPacket {
  const known = new Map(script.sources.map((s) => [s.id, s]));
  const authors = [...new Set(opts.footageAuthors ?? [])];
  return {
    version: 1,
    file: "short.mp4",
    captions: "short.srt",
    cover: "cover.jpg",
    title: script.title,
    post: script.post,
    language: opts.language ?? "en",
    labels: { youtube: { containsSyntheticMedia: true }, tiktok: { aiGeneratedContent: true }, meta: { aiInfo: true } },
    voice,
    ...(authors.length ? { footageCredit: `Footage: ${authors.join(", ")} (Pexels)` } : {}),
    ...(opts.voiceCredit ? { voiceCredit: opts.voiceCredit } : {}),
    claims: script.beats.map((b, i) => ({
      beat: i + 1,
      narration: b.narration,
      sources: (b.claims ?? []).map((c) => {
        const s = known.get(c.source);
        return { claim: c.text, quote: c.quote, source: c.source, title: s?.title ?? c.source, ...(s?.url ? { url: s.url } : {}) };
      }),
    })),
    scriptHash,
  };
}

/** What stops a packet from being approved. Code checks the labels and the disclosure; people check the rest. */
export function packetProblems(packet: PublishPacket, scriptHash: string): string[] {
  const problems: string[] = [];
  if (packet.scriptHash !== scriptHash) problems.push("publish.json is for a different script: render again");
  if (!packet.labels?.youtube?.containsSyntheticMedia) problems.push("YouTube's altered-or-synthetic setting is off");
  if (!packet.labels?.tiktok?.aiGeneratedContent) problems.push("TikTok's AI-generated label is off");
  if (!packet.labels?.meta?.aiInfo) problems.push("Meta's AI info label is off");
  if (!disclosesAI(packet.post ?? "", packet.language)) problems.push("The post doesn't say the voice is AI");
  if (packet.voice?.use !== "publish") {
    problems.push(`${packet.voice?.provider}:${packet.voice?.voice} is a draft voice (${packet.voice?.note ?? packet.voice?.licence})`);
  }
  return problems;
}
