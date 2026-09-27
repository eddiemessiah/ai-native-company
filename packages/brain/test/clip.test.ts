import { describe, expect, it } from "vitest";
import { Brain, MemorySink, ScriptedProvider, lintQuestions } from "../src/index";
import { clipQuestions, decideClip, routeClip, type ClipAnswers } from "../src/recipes/index";

const choice = <K extends string>(c: K, confidence = 0.9) => ({
  type: "choice" as const,
  choice: c,
  probabilities: { [c]: confidence } as Record<K, number>,
  confidence,
});
const score = (s: number, confidence = 0.85) => ({
  type: "score" as const,
  score: s,
  level: Math.round(s),
  probabilities: [0.05, 0.05, 0.05, 0.85],
  confidence,
});
const noul = (p: number) => ({ type: "noul" as const, noul: p });

function answers(over: Partial<Record<keyof ClipAnswers, unknown>> = {}): ClipAnswers {
  return {
    hook: score(2.7),
    payoff: score(2.4),
    standalone: noul(0.92),
    kind: choice("insight"),
    sensitive: noul(0.05),
    private_info: noul(0.01),
    ...over,
  } as unknown as ClipAnswers;
}

const moment = {
  recording: "CeloIQ Sessions: agent payments on Celo",
  previous: "So that was the setup.",
  moment: "Here's the thing nobody tells you about x402: the request is the payment. One header, and the call settles.",
};

describe("clip scoring", () => {
  it("asks six questions that pass the linter without warnings", () => {
    expect(Object.keys(clipQuestions)).toHaveLength(6);
    expect(lintQuestions(clipQuestions).filter((d) => d.level === "warn")).toEqual([]);
  });

  it("keeps a strong, self-contained moment and ranks it in code", () => {
    const r = routeClip(answers());
    expect(r.verdict).toBe("keep");
    expect(r.rank).toBe(Math.round(100 * (0.5 * (2.7 / 3) + 0.3 * (2.4 / 3) + 0.2 * 0.92)));
    expect(r.kind).toBe("insight");
  });

  it("drops housekeeping, moments that lean on context, and weak moments", () => {
    expect(routeClip(answers({ kind: choice("other") })).verdict).toBe("drop");
    expect(routeClip(answers({ standalone: noul(0.3) })).reasons[0]).toMatch(/needs the rest of the recording/);
    const weak = routeClip(answers({ hook: score(0.4), payoff: score(0.8) }));
    expect(weak.verdict).toBe("drop");
    expect(weak.reasons[0]).toMatch(/below 50/);
  });

  it("keeps an unsure 'other' in play instead of dropping it", () => {
    expect(routeClip(answers({ kind: choice("other", 0.4) })).verdict).toBe("keep");
  });

  it("sends money claims and private information to a person", () => {
    const money = routeClip(answers({ sensitive: noul(0.8) }));
    expect(money.verdict).toBe("review");
    expect(money.reasons[0]).toMatch(/money, health or legal/);
    const phone = routeClip(answers({ private_info: noul(0.7) }));
    expect(phone.verdict).toBe("review");
    expect(phone.reasons[0]).toMatch(/cut or bleep/);
  });

  it("scores through the brain, gates the write, and logs only a hash of the moment", async () => {
    const sink = new MemorySink();
    const brain = new Brain({ providers: [new ScriptedProvider(() => answers(), "jev")], sinks: [sink] });
    const { decision, route } = await decideClip(brain, moment, { meta: { job: "test", candidate: 3 } });
    expect(route.verdict).toBe("keep");
    expect(decision.gates.hook?.verdict).toBe("execute");
    expect(decision.gates.standalone?.verdict).toBe("execute");
    expect(sink.records[0]?.state).toBeUndefined();
    expect(sink.records[0]?.meta).toEqual({ job: "test", candidate: 3 });
  });

  it("asks a person to look when an uncalibrated provider is unsure", async () => {
    const unsure = answers({ standalone: noul(0.62) });
    const brain = new Brain({ providers: [new ScriptedProvider(() => unsure, "claude", false)], sinks: [] });
    const { decision, route } = await decideClip(brain, moment);
    expect(decision.gates.standalone?.verdict).toBe("confirm");
    expect(route.verdict).toBe("review");
    expect(route.reasons.some((r) => r.startsWith("propose_clip:"))).toBe(true);
  });
});
