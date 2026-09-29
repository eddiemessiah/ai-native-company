import { describe, expect, it } from "vitest";
import { Brain, ScriptedProvider, lintQuestions } from "../src/index";
import { checkClaim, claimQuestions, routeClaim, type ClaimAnswers } from "../src/recipes/index";

const noul = (p: number) => ({ type: "noul" as const, noul: p });
const answers = (supported: number, adds: number, contradicts: number) =>
  ({ supported: noul(supported), adds: noul(adds), contradicts: noul(contradicts) }) as unknown as ClaimAnswers;

const claim = {
  claim: "A failed call is never charged.",
  quote: "x402 settles only below 400, so a failed call is never charged.",
};

describe("claim check", () => {
  it("asks three questions that pass the linter without warnings", () => {
    expect(lintQuestions(claimQuestions).filter((d) => d.level === "warn")).toEqual([]);
  });

  it("cuts claims the quote contradicts or doesn't support", () => {
    expect(routeClaim(answers(0.9, 0.1, 0.8)).verdict).toBe("cut");
    expect(routeClaim(answers(0.3, 0.1, 0.1))).toMatchObject({ verdict: "cut", reasons: [expect.stringMatching(/doesn't say this/)] });
  });

  it("sends a claim that adds detail to a person", () => {
    expect(routeClaim(answers(0.9, 0.7, 0.05))).toMatchObject({ verdict: "check", reasons: [expect.stringMatching(/adds something/)] });
  });

  it("passes a supported claim from a calibrated model", async () => {
    const brain = new Brain({ providers: [new ScriptedProvider(() => answers(0.97, 0.05, 0.01), "jev")], sinks: [] });
    const { decision, route } = await checkClaim(brain, claim);
    expect(decision.gates.supported?.verdict).toBe("execute");
    expect(route.verdict).toBe("ok");
  });

  it("asks a person when an uncalibrated model is the judge", async () => {
    const brain = new Brain({ providers: [new ScriptedProvider(() => answers(0.97, 0.05, 0.01), "claude", false)], sinks: [] });
    const { route } = await checkClaim(brain, claim);
    expect(route.verdict).toBe("check");
    expect(route.reasons[0]).toMatch(/^publish_claim:/);
  });
});
