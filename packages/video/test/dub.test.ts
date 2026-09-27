import { describe, expect, it } from "vitest";
import { alignDub, checkDub, checkScript, DEFAULT_GLOSSARY, disclosesAI, renderDubBrief, type ShortScript } from "../src/index";

const source: ShortScript = {
  version: 1,
  title: "x402 on Celo",
  post: "Agents pay per call. Voiced with AI.",
  sources: [{ id: "post", title: "Post" }],
  beats: [
    {
      narration: "It's called x402. Your API answers 402 Payment Required with a price.",
      onscreen: "402 Payment Required",
      visual: { kind: "brand" },
      claims: [{ text: "Your API answers 402 Payment Required with a price.", source: "post", quote: "your API answers `402 Payment Required` with a price" }],
    },
    {
      narration: "Price at $0.01 or more.",
      onscreen: "Price with room",
      visual: { kind: "scene", template: "number", data: { value: "$0.001", label: "per settlement", kicker: "the facilitator's fee" } },
      claims: [{ text: "Price at $0.01 or more.", source: "post", quote: "price at $0.01 or more" }],
    },
    {
      narration: "Wrap your handler.",
      onscreen: "One wrapper",
      visual: { kind: "scene", template: "code", data: { lines: ["export const POST = withX402(", "  handler,"], highlight: 2, kicker: "settles below 400" } },
      claims: [],
    },
  ],
};
const dub = { from: "../short-x402", fromHash: "abc", language: "fr", glossary: DEFAULT_GLOSSARY };

/** What a translator returns: text translated, and some things it shouldn't have touched changed. */
const written: ShortScript = {
  ...source,
  title: "x402 sur Celo",
  post: "Les agents paient à l'appel. Voix générée par IA.",
  beats: [
    {
      narration: "Ça s'appelle x402. Votre API répond 402 Payment Required avec un prix.",
      onscreen: "402 Payment Required",
      visual: { kind: "stock", query: "paiement" },
      claims: [{ text: "Votre API répond 402 Payment Required avec un prix.", source: "blog", quote: "une citation traduite" }],
    },
    {
      narration: "Fixez un prix de $0.01 ou plus.",
      onscreen: "Un prix avec de la marge",
      visual: { kind: "scene", template: "number", data: { value: "0,001 $", label: "par règlement", kicker: "les frais du facilitateur" } },
      claims: [{ text: "Fixez un prix de $0.01 ou plus.", source: "post", quote: "price at $0.01 or more" }],
    },
    {
      narration: "Enveloppez votre handler.",
      onscreen: "Un seul wrapper",
      visual: { kind: "scene", template: "code", data: { lines: ["export const POST = avecX402("], kicker: "réglé sous 400" } },
      claims: [],
    },
  ],
};

describe("dubs", () => {
  it("briefs the translator with the locks, the glossary and the disclosure in French", () => {
    const brief = renderDubBrief(source, dub);
    expect(brief).toContain("# Dub brief: x402 on Celo → French (fr)");
    expect(brief).toContain("Keep all 3 beats, in order.");
    expect(brief).toContain("Keep these terms as written: x402, USDC");
    expect(brief).toContain('ending with "Voix générée par IA."');
    expect(brief).toContain('"value": "$0.001"');
  });

  it("puts back what a translation mustn't change", () => {
    const { script, problems } = alignDub(source, written);
    expect(problems).toEqual([]);
    const [one, two, three] = script.beats;
    expect(one!.visual).toEqual({ kind: "brand" });
    expect(one!.claims).toEqual([{ text: "Votre API répond 402 Payment Required avec un prix.", source: "post", quote: "your API answers `402 Payment Required` with a price" }]);
    expect(two!.visual).toEqual({ kind: "scene", template: "number", data: { value: "$0.001", label: "par règlement", kicker: "les frais du facilitateur" } });
    expect(three!.visual).toEqual({ kind: "scene", template: "code", data: { lines: ["export const POST = withX402(", "  handler,"], highlight: 2, kicker: "réglé sous 400" } });
    expect(script.sources).toBe(source.sources);
    expect(checkDub(source, script, DEFAULT_GLOSSARY)).toEqual([]);
  });

  it("names what couldn't be matched", () => {
    const short = { ...written, beats: [{ ...written.beats[0]!, claims: [] }, { ...written.beats[1]!, visual: { kind: "brand" as const } }] };
    expect(alignDub(source, short).problems).toEqual([
      "the translation has 2 beats; the source has 3",
      "beat 1: the translation has 0 claims; the source has 1",
      "beat 2: the translation changed the number scene; keep the template and translate its text",
    ]);
  });

  it("catches numbers, names and locked parts a translation changed, and beats left in English", () => {
    const aligned = alignDub(source, written).script;
    const broken: ShortScript = {
      ...aligned,
      beats: [
        { ...aligned.beats[0]!, narration: "Ça s'appelle le protocole. Votre API répond avec un prix." },
        { ...aligned.beats[1]!, narration: "Fixez un prix de 0,01 $ ou plus." },
        { ...source.beats[2]!, visual: { kind: "scene", template: "code", data: { lines: ["export const POST = avecX402("] } } },
      ],
    };
    expect(checkDub(source, broken, DEFAULT_GLOSSARY)).toEqual([
      "Beat 1 says no numbers; the source says 402. Write numbers as the source does",
      'Beat 1 drops "x402", which stays as written',
      "Beat 2 says 0, 01; the source says 0.01. Write numbers as the source does",
      "Beat 3 isn't translated",
      "Beat 3: the code scene's code changed; only its text is translated",
      // Its kicker, "settles below 400", went missing with the rewrite.
      "Beat 3: the scene's numbers changed; write them as the source does",
    ]);
  });

  it("accepts the disclosure in the post's own language, or in English", () => {
    expect(disclosesAI("Les agents paient à l'appel. Voix générée par IA.", "fr")).toBe(true);
    expect(disclosesAI("Voix de synthèse.", "fr-FR")).toBe(true);
    expect(disclosesAI("Les agents paient. Voiced with AI.", "fr")).toBe(true);
    expect(disclosesAI("Les agents paient à l'appel.", "fr")).toBe(false);
    const report = checkScript({ ...alignDub(source, written).script, post: "Les agents paient." }, new Map([["post", ""]]), { minSec: 1, maxSec: 60, language: "fr" });
    expect(report.problems.join("\n")).toContain('end it with "Voix générée par IA."');
  });
});
