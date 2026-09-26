import { describe, expect, it } from "vitest";
import { lintQuestions } from "../src/index";
import {
  activeTurnQuestions,
  approvalQuestions,
  classifyApproval,
  evaluateTriage,
  resolveTurn,
  triageQuestions,
  type ApprovalAnswers,
  type TriageAnswers,
  type TurnAnswers,
} from "../src/recipes/teammate";

const choice = (c: string, confidence = 0.9, rest: Record<string, number> = {}) => ({
  type: "choice" as const,
  choice: c,
  probabilities: { [c]: confidence, ...rest },
  confidence,
});
const score = (s: number, confidence = 0.8) => ({ type: "score" as const, score: s, level: Math.round(s), probabilities: [], confidence });
const noul = (p: number) => ({ type: "noul" as const, noul: p });

/** A neutral baseline: an open, useful question for the room. */
function answers(over: Partial<Record<string, unknown>> = {}): TriageAnswers {
  return {
    route: choice("answer", 0.85, { pass: 0.1 }),
    addressee: choice("the_room", 0.8),
    priority: choice("normal", 0.8),
    effort: score(1),
    ack_emoji: choice("none", 0.7),
    investigate_kind: choice("other", 0.8),
    usefulness: score(3),
    answerability: score(3),
    urgency: score(1),
    noise: score(0),
    interruption_cost: score(1),
    investigation_value: score(1),
    reaction_fit: score(1),
    is_summons: noul(0.1),
    accepts_offer: noul(0.05),
    checkable_claim: noul(0.2),
    other_app_exchange: noul(0.02),
    durable_update: noul(0.1),
    ...over,
  } as unknown as TriageAnswers;
}

describe("teammate triage", () => {
  it("has 18 questions that pass the linter without warnings", () => {
    const qs = triageQuestions("Nova");
    expect(Object.keys(qs)).toHaveLength(18);
    expect(lintQuestions(qs).filter((d) => d.level === "warn")).toEqual([]);
  });

  it("answers an open, useful question for the room", () => {
    const v = evaluateTriage(answers(), { mode: "proactive" });
    expect(v).toMatchObject({ via: "jev", decision: "ANSWER", priority: "normal" });
  });

  it("stays quiet on banter", () => {
    const v = evaluateTriage(
      answers({ route: choice("pass", 0.9), usefulness: score(0), noise: score(4), ack_emoji: choice("none") }),
      { mode: "proactive" },
    );
    expect(v).toMatchObject({ via: "jev", decision: "PASS" });
  });

  it("reacts to a ship with an emoji instead of a message", () => {
    const v = evaluateTriage(
      answers({ route: choice("acknowledge", 0.9), ack_emoji: choice("tada", 0.9), usefulness: score(1), reaction_fit: score(4) }),
      { mode: "proactive" },
    );
    expect(v).toMatchObject({ via: "jev", decision: "ACK", emoji: "tada" });
  });

  it("notes durable decisions with a pencil", () => {
    const v = evaluateTriage(
      answers({ route: choice("acknowledge", 0.9), ack_emoji: choice("clap", 0.6), durable_update: noul(0.9), usefulness: score(1), reaction_fit: score(4) }),
      { mode: "proactive" },
    );
    expect(v).toMatchObject({ decision: "ACK", emoji: "pencil2" });
  });

  it("investigates an incident quietly and urgently", () => {
    const v = evaluateTriage(
      answers({
        route: choice("investigate", 0.9),
        priority: choice("urgent", 0.9),
        investigate_kind: choice("incident_or_regression", 0.9),
        checkable_claim: noul(0.95),
        investigation_value: score(4),
        urgency: score(4),
        usefulness: score(3),
      }),
      { mode: "proactive" },
    );
    expect(v).toMatchObject({ via: "jev", decision: "INVESTIGATE", priority: "urgent" });
    if (v.via === "jev") expect(v.hypothesis).toMatch(/deploys/);
  });

  it("hands unsure routes to the LLM", () => {
    expect(evaluateTriage(answers({ route: choice("answer", 0.45) }), { mode: "proactive" }).via).toBe("llm");
    expect(evaluateTriage(answers({ route: choice("other", 0.9) }), { mode: "proactive" }).via).toBe("llm");
  });

  it("stays out of a question addressed to a named person", () => {
    const v = evaluateTriage(answers({ addressee: choice("a_person", 0.9) }), { mode: "proactive" });
    expect(v).toMatchObject({ decision: "PASS" });
  });

  it("answers a summons even when nobody tagged it", () => {
    const v = evaluateTriage(answers({ is_summons: noul(0.9), route: choice("pass", 0.6) }), { mode: "reserved" });
    expect(v).toMatchObject({ decision: "ANSWER", priority: "summons" });
  });

  it("is stricter in reserved mode: a borderline answer goes to the LLM", () => {
    const v = evaluateTriage(answers(), { mode: "reserved" });
    expect(v.via).toBe("llm");
  });
});

describe("active-turn gate", () => {
  const turn = (effect: string, confidence = 0.9, corrects = 0.1) =>
    ({ effect: choice(effect, confidence), corrects_detail: noul(corrects) }) as unknown as TurnAnswers;

  it("only the asker can stop a turn", () => {
    expect(resolveTurn(turn("stop"), { authorOwnsTurn: true })).toEqual({ via: "jev", effect: "stop" });
    expect(resolveTurn(turn("stop"), { authorOwnsTurn: false })).toEqual({ via: "jev", effect: "append" });
  });

  it("treats a correction as a replacement", () => {
    expect(resolveTurn(turn("ignore", 0.9, 0.9), { authorOwnsTurn: true })).toEqual({ via: "jev", effect: "replace" });
  });

  it("falls back when unsure", () => {
    expect(resolveTurn(turn("append", 0.5), { authorOwnsTurn: true }).via).toBe("llm");
    expect(Object.keys(activeTurnQuestions())).toEqual(["effect", "corrects_detail"]);
  });
});

describe("approval classifier", () => {
  const approval = (effect: string, confidence: number, extra: Record<string, number>, flags: [number, number, number]) =>
    ({
      effect: choice(effect, confidence, extra),
      changes_state: noul(flags[0]),
      reaches_people: noul(flags[1]),
      money_or_access: noul(flags[2]),
    }) as unknown as ApprovalAnswers;

  it("pauses anything that moves money or reaches people", () => {
    expect(classifyApproval(approval("read", 0.95, {}, [0, 0, 0.8]))).toMatchObject({ effect: "privileged", pause: true });
    expect(classifyApproval(approval("read", 0.95, {}, [0, 0.7, 0]))).toMatchObject({ effect: "external_communication", pause: true });
  });

  it("accepts a read only when it is proven", () => {
    expect(classifyApproval(approval("read", 0.97, { metadata: 0.01 }, [0.02, 0.01, 0]))).toMatchObject({ effect: "read", pause: false });
    expect(classifyApproval(approval("read", 0.85, {}, [0.02, 0.01, 0])).via).toBe("llm");
  });

  it("pauses every non-read", () => {
    expect(classifyApproval(approval("material_write", 0.8, {}, [0.9, 0.1, 0]))).toMatchObject({ pause: true });
    expect(Object.keys(approvalQuestions())).toHaveLength(4);
  });
});
