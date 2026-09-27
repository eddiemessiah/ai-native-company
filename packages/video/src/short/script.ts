/**
 * An explainer short as data. An LLM writes it; code checks everything
 * countable and every quote before a voice is recorded; the brain checks that
 * each quote supports its claim; a person approves the render.
 */

import { sceneProblems, sceneText, type SceneVisual } from "./scene";

export interface ShortClaim {
  /** The sentence of narration that states a fact. */
  readonly text: string;
  /** Id of the source it comes from. */
  readonly source: string;
  /** The passage that backs it, copied word for word from the source. */
  readonly quote: string;
}

export type Visual =
  | { readonly kind: "brand" }
  | { readonly kind: "stock"; readonly query: string }
  | { readonly kind: "local"; readonly query?: string; readonly file?: string }
  | SceneVisual;

export interface ShortBeat {
  /** What the voice says: one or two sentences. */
  readonly narration: string;
  /** The big text on screen: six words at most. */
  readonly onscreen: string;
  readonly visual?: Visual;
  /** Every factual sentence in the narration, each with its quote. */
  readonly claims?: readonly ShortClaim[];
}

export interface ShortScript {
  readonly version: 1;
  readonly title: string;
  /** beats[0] is the hook; the last beat carries the one call to action. */
  readonly beats: readonly ShortBeat[];
  /** The post that goes with the video. */
  readonly post: string;
  readonly sources: readonly { readonly id: string; readonly title: string; readonly url?: string }[];
}

export interface ScriptLimits {
  readonly minSec: number;
  readonly maxSec: number;
  /** Speaking rate used to estimate length before a voice exists: 2.5 words a second is 150 a minute. */
  readonly wordsPerSecond?: number;
}

export interface ScriptReport {
  /** Blocking: the short can't be voiced until these are fixed. */
  readonly problems: readonly string[];
  readonly warnings: readonly string[];
  readonly words: number;
  readonly estimatedSeconds: number;
}

const words = (text: string) => text.split(/\s+/).filter(Boolean);

/** Lowercase, straight quotes, single spaces: a quote has to survive copy and paste, not typography. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every number said aloud: 1,700 · 0.18 · 42% · $0.01 · 3x · ₦250,000. Commas are dropped so 1,700 matches
 * 1700. Digits inside a name (x402, ERC-8004, web3, v2) are part of the name, not a figure to source.
 */
export function numbersIn(text: string): string[] {
  const figures = text.replace(/(\d),(\d{3})/g, "$1$2").match(/(?<![A-Za-z]-?|[\d.])\d+(?:\.\d+)?/g) ?? [];
  return figures.map((n) => n.replace(/\.0+$/, ""));
}

/** The line every post carries: the voice is synthetic (research/explainer-shorts.md §4, §6d). */
export const AI_DISCLOSURE = "Voiced with AI.";

/** "Voiced with AI", "narrated by AI", "AI voice", "AI-generated voiceover". */
export const DISCLOSES_AI =
  /\b(?:voiced|narrated|made|created|generated|produced)\s+(?:with|by|using)\s+(?:an?\s+)?AI\b|\bAI[- ](?:voice|voiced|narrat|generated)/i;

/** A narrator claiming to be a human expert: YouTube won't monetize AI personas giving health, legal or money advice. */
const EXPERT_PERSONA =
  /\b(?:as an?|I am an?|I'm an?|I'm your|as your)\s+(?:(?:certified|licensed|qualified|practising|practicing)\s+)?(?:doctor|physician|nurse|pharmacist|lawyer|attorney|solicitor|barrister|financial (?:adviser|advisor|planner)|investment (?:adviser|advisor)|accountant|therapist|expert)\b/i;

/** Code checks: counts, lengths, and every quote found word for word in its source. */
export function checkScript(script: ShortScript, sources: ReadonlyMap<string, string>, limits: ScriptLimits): ScriptReport {
  const problems: string[] = [];
  const warnings: string[] = [];
  const wps = limits.wordsPerSecond ?? 2.5;
  const count = script.beats.reduce((n, b) => n + words(b.narration).length, 0);
  const estimatedSeconds = Math.round((count / wps) * 10) / 10;

  if (script.beats.length < 3 || script.beats.length > 10) problems.push(`Use 3 to 10 beats (got ${script.beats.length})`);
  if (estimatedSeconds < limits.minSec || estimatedSeconds > limits.maxSec) {
    problems.push(`${count} words is about ${estimatedSeconds}s spoken; aim for ${limits.minSec}–${limits.maxSec}s`);
  }
  if (script.title.length > 100) problems.push(`Title is ${script.title.length} characters; YouTube allows 100`);
  if (script.post.length > 280) problems.push(`Post is ${script.post.length} characters; X allows 280 without Premium`);
  if (!DISCLOSES_AI.test(script.post)) problems.push(`The post must say the voice is AI: end it with "${AI_DISCLOSURE}"`);
  const persona = EXPERT_PERSONA.exec(script.post);
  if (persona) problems.push(`The post presents the narrator as a human expert ("${persona[0]}"); name the source instead`);
  const hook = script.beats[0];
  if (hook && words(hook.narration).length > 16) {
    warnings.push(`The hook runs ${words(hook.narration).length} words; under 16 lands it in the first few seconds`);
  }

  const known = new Map(script.sources.map((s) => [s.id, s]));
  script.beats.forEach((beat, i) => {
    const n = i + 1;
    const shown = words(beat.onscreen).length;
    if (shown === 0 || shown > 6 || beat.onscreen.length > 40) {
      problems.push(`Beat ${n}: on-screen text is ${shown} words and ${beat.onscreen.length} characters; keep it to 6 words and 40 characters`);
    }
    if (!beat.narration.trim()) problems.push(`Beat ${n} has no narration`);
    const expert = EXPERT_PERSONA.exec(beat.narration);
    if (expert) problems.push(`Beat ${n}: the narrator presents itself as a human expert ("${expert[0]}"); an AI voice names its source instead`);
    if (beat.visual?.kind === "stock" && !beat.visual.query.trim()) problems.push(`Beat ${n}: a stock visual needs a search query`);

    const quotes: string[] = [];
    for (const claim of beat.claims ?? []) {
      const text = sources.get(claim.source);
      if (!known.has(claim.source) || text === undefined) {
        problems.push(`Beat ${n}: claim cites "${claim.source}", which is not one of the sources`);
        continue;
      }
      if (!normalizeText(text).includes(normalizeText(claim.quote))) {
        problems.push(`Beat ${n}: the quote for "${claim.text}" is not in ${claim.source} word for word`);
        continue;
      }
      quotes.push(claim.quote);
    }
    const backed = new Set(quotes.flatMap(numbersIn));
    for (const number of numbersIn(beat.narration)) {
      if (!backed.has(number)) problems.push(`Beat ${n} says ${number}, but none of its quotes contains it`);
    }

    if (beat.visual?.kind === "scene") {
      const scene = beat.visual;
      for (const problem of sceneProblems(scene)) problems.push(`Beat ${n}: ${scene.template} scene: ${problem}`);
      // A figure on screen is a claim like one said aloud.
      for (const number of sceneText(scene).flatMap(numbersIn)) {
        if (!backed.has(number)) problems.push(`Beat ${n}: the scene shows ${number}, but none of its quotes contains it`);
      }
      if (scene.template === "code") {
        const texts = [...sources.values()].map(normalizeText);
        for (const line of scene.data.lines ?? []) {
          if (line.trim() && !texts.some((t) => t.includes(normalizeText(line)))) {
            problems.push(`Beat ${n}: the code line "${line.trim()}" isn't in any source; show code the sources contain`);
          }
        }
      }
    }
  });
  if (!script.beats.some((b) => (b.claims ?? []).length > 0)) {
    warnings.push("No claims cite a source: fine for an opinion piece, not for an explainer");
  }
  return { problems, warnings, words: count, estimatedSeconds };
}

/** Terms text-to-speech engines misread. Captions keep the written form; only the voice hears these. */
export const DEFAULT_LEXICON: Readonly<Record<string, string>> = {
  x402: "x four oh two",
  USDC: "U S D C",
  cUSD: "C U S D",
  MiniPay: "Mini Pay",
  "ERC-8004": "E R C eighty oh four",
  API: "A P I",
  APIs: "A P Is",
  LLM: "L L M",
  LLMs: "L L Ms",
};

/** Applies a pronunciation lexicon to narration before it goes to a voice. Whole words only. */
export function forSpeech(text: string, lexicon: Readonly<Record<string, string>> = DEFAULT_LEXICON): string {
  let out = text;
  for (const [written, spoken] of Object.entries(lexicon)) {
    const escaped = written.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "g"), spoken);
  }
  return out;
}

/** The narration as one draft, for the content gate. */
export function draftText(script: ShortScript): string {
  return [script.title, ...script.beats.map((b) => b.narration), script.post].join("\n\n");
}
