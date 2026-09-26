import { describe, expect, it } from "vitest";
import {
  Brain,
  BrainError,
  Choice,
  HeuristicProvider,
  MemorySink,
  Noul,
  QuestionError,
  Score,
  ScriptedProvider,
  gate,
  lintQuestions,
  normalizedEntropy,
} from "../src/index";

const questions = {
  department: Choice({
    instructions: "Which team should handle this ticket",
    criteria: {
      billing: "Payment, subscription, refunds or duplicate charges",
      technical: "Bugs or integration problems",
      other: "Anything that does not fit the above",
    },
  }),
  frustration: Score({
    instructions: "How frustrated the customer appears",
    criteria: ["Calm, just stating facts", "Frustrated but civil", "Very angry, strong language"],
  }),
  refund_requested: Noul("The customer is explicitly asking for a refund"),
};

const good = {
  department: { type: "choice", choice: "billing", probabilities: { billing: 0.9, technical: 0.05, other: 0.05 }, confidence: 0.9 },
  frustration: { type: "score", score: 0.4, level: 0, probabilities: [0.65, 0.3, 0.05], confidence: 0.65 },
  refund_requested: { type: "noul", noul: 0.97 },
};

const ticket = {
  subject: "Duplicate charge",
  message: "I was charged twice for order A-104. Please refund the duplicate.",
};

describe("question builders", () => {
  it("rejects invalid shapes", () => {
    expect(() => Choice({ instructions: "x y z", criteria: { only: "one option" } })).toThrow(QuestionError);
    expect(() => Score({ instructions: "x y z", criteria: ["one"] })).toThrow(QuestionError);
    expect(() => Score({ instructions: "x y z", criteria: Array.from({ length: 11 }, (_, i) => `l${i}`) })).toThrow(
      QuestionError,
    );
    expect(() => Noul("  ")).toThrow(QuestionError);
  });

  it("lints the known System One failure modes", () => {
    const codes = lintQuestions({
      a: Choice({ instructions: "Pick the team", criteria: { x: "one", y: "two" } }),
      b: Noul("Count how many items are in the cart"),
      c: Noul("The invoice date is before 2026-01-01"),
      d: Noul("urgent?"),
    }).map((d) => `${d.question}:${d.code}`);
    expect(codes).toContain("a:no-other");
    expect(codes).toContain("b:counting");
    expect(codes).toContain("c:date-order");
    expect(codes).toContain("d:thin-instructions");
  });
});

describe("policy gate", () => {
  const choice = (confidence: number) =>
    ({ type: "choice", choice: "x", probabilities: { x: confidence }, confidence }) as const;

  it("escalates when genuinely unsure", () => {
    expect(gate(choice(0.4), { action: "show", risk: "read" }, { calibrated: true }).verdict).toBe("escalate");
  });

  it("uses a bar per risk tier", () => {
    expect(gate(choice(0.6), { action: "show", risk: "read" }, { calibrated: true }).verdict).toBe("execute");
    expect(gate(choice(0.6), { action: "update", risk: "write" }, { calibrated: true }).verdict).toBe("confirm");
    expect(gate(choice(0.9), { action: "send", risk: "external" }, { calibrated: true }).verdict).toBe("execute");
  });

  it("never fires money or irreversible actions: prepare, then a human approves", () => {
    expect(gate(choice(0.99), { action: "transfer", risk: "money" }, { calibrated: true }).verdict).toBe("confirm");
    expect(gate(choice(0.8), { action: "transfer", risk: "money" }, { calibrated: true }).verdict).toBe("escalate");
    expect(gate(choice(0.99), { action: "delete", risk: "irreversible" }, { calibrated: true }).verdict).toBe("confirm");
  });

  it("demands a wider margin from uncalibrated providers", () => {
    expect(gate(choice(0.75), { action: "update", risk: "write" }, { calibrated: false }).verdict).toBe("confirm");
    expect(gate(choice(0.99), { action: "send", risk: "external" }, { calibrated: false }).verdict).toBe("confirm");
  });

  it("reads a noul's confidence from whichever side it leans to", () => {
    const g = gate({ type: "noul", noul: 0.05 }, { action: "flag", risk: "read" }, { calibrated: true });
    expect(g.confidence).toBeCloseTo(0.95);
  });
});

describe("Brain", () => {
  it("answers through the first healthy provider and logs a hashed record", async () => {
    const sink = new MemorySink();
    const brain = new Brain({ providers: [new ScriptedProvider(() => good, "jev")], sinks: [sink] });
    const d = await brain.decide("support.triage", ticket, questions, {
      policies: { refund_requested: { action: "issue_refund", risk: "money" } },
    });
    expect(d.answers.department.choice).toBe("billing");
    expect(d.provider).toBe("jev");
    expect(d.gates.refund_requested?.verdict).toBe("confirm");
    expect(sink.records).toHaveLength(1);
    const record = sink.records[0]!;
    expect(record.stateHash).toMatch(/^[0-9a-f]{64}$/);
    expect(record.state).toBeUndefined();
    expect(record.questions.map((q) => q.name)).toEqual(["department", "frustration", "refund_requested"]);
    expect(d.costUsd).toBeGreaterThan(0);
    expect(d.costUsd).toBeLessThan(0.0001);
  });

  it("falls back when a provider throws, and records the failed attempt", async () => {
    const down = new ScriptedProvider(() => {
      throw new Error("503 upstream");
    }, "jev");
    const brain = new Brain({ providers: [down, new ScriptedProvider(() => good, "backup", false)], sinks: [] });
    const d = await brain.decide("t", ticket, questions);
    expect(d.provider).toBe("backup");
    expect(d.calibrated).toBe(false);
    expect(d.attempts).toEqual([expect.objectContaining({ provider: "jev", error: "503 upstream" })]);
  });

  it("falls back when a provider returns an answer outside the schema", async () => {
    const bad = new ScriptedProvider(() => ({ ...good, department: { ...good.department, choice: "sales" } }), "jev");
    const brain = new Brain({ providers: [bad, new ScriptedProvider(() => good, "backup")], sinks: [] });
    const d = await brain.decide("t", ticket, questions);
    expect(d.provider).toBe("backup");
    expect(d.attempts[0]?.error).toMatch(/not one of the options/);
  });

  it("times out a hung provider", async () => {
    const hung = new ScriptedProvider(({ signal }) => new Promise((_, reject) => signal?.addEventListener("abort", () => reject(new Error("aborted")))), "jev");
    const brain = new Brain({ providers: [hung, new ScriptedProvider(() => good, "backup")], sinks: [], timeoutMs: 30 });
    const d = await brain.decide("t", ticket, questions);
    expect(d.provider).toBe("backup");
  });

  it("throws BrainError with every attempt when all providers fail", async () => {
    const fail = (name: string) =>
      new ScriptedProvider(() => {
        throw new Error(`${name} down`);
      }, name);
    const brain = new Brain({ providers: [fail("a"), fail("b")], sinks: [] });
    await expect(brain.decide("t", ticket, questions)).rejects.toBeInstanceOf(BrainError);
  });

  it("flags flat distributions: the criteria could not be told apart", async () => {
    const flat = {
      ...good,
      department: { type: "choice", choice: "billing", probabilities: { billing: 0.34, technical: 0.33, other: 0.33 }, confidence: 0.34 },
    };
    const brain = new Brain({ providers: [new ScriptedProvider(() => flat)], sinks: [] });
    const d = await brain.decide("t", ticket, questions);
    expect(d.diagnostics.some((x) => x.code === "flat-distribution" && x.question === "department")).toBe(true);
    expect(normalizedEntropy([0.34, 0.33, 0.33])).toBeGreaterThan(0.99);
  });
});

describe("HeuristicProvider", () => {
  it("routes an obvious billing ticket and detects the refund request", async () => {
    const brain = new Brain({ providers: [new HeuristicProvider()], sinks: [] });
    const d = await brain.decide("t", ticket, questions);
    expect(d.answers.department.choice).toBe("billing");
    expect(d.answers.refund_requested.noul).toBeGreaterThan(0.5);
    expect(d.calibrated).toBe(false);
  });

  it("falls to other when nothing matches", async () => {
    const brain = new Brain({ providers: [new HeuristicProvider()], sinks: [] });
    const d = await brain.decide("t", "What time does the Lagos meetup start?", questions);
    expect(d.answers.department.choice).toBe("other");
  });

  it("reads intensity cues on scales", async () => {
    const brain = new Brain({ providers: [new HeuristicProvider()], sinks: [] });
    const calm = await brain.decide("t", "Hello, my card was charged twice. Could you check?", questions);
    const angry = await brain.decide("t", "THIS IS UNACCEPTABLE!!! I am furious, charged twice, refund now!!", questions);
    expect(angry.answers.frustration.score).toBeGreaterThan(calm.answers.frustration.score);
  });
});
