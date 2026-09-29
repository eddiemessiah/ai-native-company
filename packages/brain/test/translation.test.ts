import { describe, expect, it } from "vitest";
import { Brain, ScriptedProvider, lintQuestions } from "../src/index";
import { checkTranslation, routeTranslation, translationQuestions, type TranslationAnswers } from "../src/recipes/index";

const noul = (p: number) => ({ type: "noul" as const, noul: p });
const answers = (faithful: number, adds: number) => ({ faithful: noul(faithful), adds: noul(adds) }) as unknown as TranslationAnswers;

const beat = {
  source: "A failed call is free. Payment settles only when your handler answers below 400.",
  target: "Un appel échoué est gratuit. Le paiement n'est réglé que si votre handler répond en dessous de 400.",
  language: "fr",
};

describe("translation check", () => {
  it("asks two questions that pass the linter without warnings", () => {
    expect(lintQuestions(translationQuestions).filter((d) => d.level === "warn")).toEqual([]);
  });

  it("cuts a translation that adds something or loses the meaning", () => {
    expect(routeTranslation(answers(0.95, 0.8))).toMatchObject({ verdict: "cut", reasons: [expect.stringMatching(/says something the source doesn't/)] });
    expect(routeTranslation(answers(0.2, 0.1))).toMatchObject({ verdict: "cut", reasons: [expect.stringMatching(/doesn't say what the source says/)] });
  });

  it("passes a faithful translation from a calibrated model", async () => {
    const brain = new Brain({ providers: [new ScriptedProvider(() => answers(0.97, 0.03), "jev")], sinks: [] });
    const { decision, route } = await checkTranslation(brain, beat);
    expect(decision.gates.faithful?.verdict).toBe("execute");
    expect(route.verdict).toBe("ok");
  });

  it("sends it to a native speaker when an uncalibrated model is the judge", async () => {
    const brain = new Brain({ providers: [new ScriptedProvider(() => answers(0.97, 0.03), "claude", false)], sinks: [] });
    const { route } = await checkTranslation(brain, beat);
    expect(route.verdict).toBe("check");
    expect(route.reasons[0]).toMatch(/^publish_translation:/);
  });
});
