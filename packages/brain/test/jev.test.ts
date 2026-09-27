import { TypeSafeClient } from "@typesafe-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { Brain, Choice, Noul, Score } from "../src/index";
import { fromJevAnswers, JevProvider } from "../src/providers/jev";

const questions = {
  department: Choice({
    instructions: "Which team should handle this",
    criteria: { billing: "Payments and refunds", technical: "Bugs", other: "Anything else" },
  }),
  severity: Score({ instructions: "How severe is the issue", criteria: ["Cosmetic", "Workaround exists", "Blocking"] }),
  refund: Noul("The customer is explicitly asking for a refund"),
};

const jevBody = {
  model: "jev-1.13.0",
  answers: {
    department: { type: "choice", choice: "billing", confidence: 0.93, probabilities: { billing: 0.93, technical: 0.04, other: 0.03 } },
    severity: { type: "score", score: 1.04, confidence: 0.81, legend: {}, probabilities: { 0: 0.08, 1: 0.81, 2: 0.11 } },
    refund: { type: "noul", noul: 0.97 },
  },
  usage: { input_tokens: 212, output_tokens: 0 },
};

describe("JevProvider", () => {
  it("sends plain typed questions to /v1/systemone and maps the answers", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify(jevBody), {
        status: 200,
        headers: { "content-type": "application/json", "x-typesafe-request-id": "req_abc" },
      }),
    );
    const client = new TypeSafeClient({ apiKey: "sk-test", fetch: fetchMock, retry: { maxRetries: 0 } });
    const provider = new JevProvider({ transport: "typesafe", client, model: "jev-1.13.0" });
    const brain = new Brain({ providers: [provider], sinks: [] });

    const d = await brain.decide("support.triage", { message: "charged twice, refund please" }, questions);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/v1\/systemone$/);
    const sent = JSON.parse(String(init?.body));
    expect(sent.model).toBe("jev-1.13.0");
    expect(sent.questions.department).toEqual({
      type: "choice",
      instructions: "Which team should handle this",
      criteria: { billing: "Payments and refunds", technical: "Bugs", other: "Anything else" },
    });
    expect(sent.questions.severity.criteria).toEqual(["Cosmetic", "Workaround exists", "Blocking"]);

    expect(d.provider).toBe("jev");
    expect(d.calibrated).toBe(true);
    expect(d.model).toBe("jev-1.13.0");
    expect(d.requestId).toBe("req_abc");
    expect(d.answers.department).toMatchObject({ choice: "billing", confidence: 0.93 });
    expect(d.answers.severity).toMatchObject({ score: 1.04, level: 1, confidence: 0.81 });
    expect(d.answers.severity.probabilities).toHaveLength(3);
    expect(d.answers.refund.noul).toBe(0.97);
    // $0.042 per million input tokens, output free.
    expect(d.costUsd).toBeCloseTo((212 * 0.042) / 1e6, 12);
  });

  it("reaches Jev through OpenRouter's decisions endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ...jevBody, model: "typesafe/jev-1.13-20260917", usage: { input_tokens: 212, cost: 0.00001 } }), {
        status: 200,
      }),
    );
    const provider = new JevProvider({ transport: "openrouter", apiKey: "or-key", fetch: fetchMock as unknown as typeof fetch });
    const result = await provider.decide({ state: "charged twice", questions });
    const [url, init] = fetchMock.mock.calls[0]! as unknown as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/alpha/decisions");
    expect(JSON.parse(String(init.body)).model).toBe("~typesafe/jev-latest");
    expect(result.usage?.costUsd).toBe(0.00001);
    expect(result.answers.department.choice).toBe("billing");
  });

  it("maps AI Gateway boolean answers and index-keyed score probabilities", () => {
    const a = fromJevAnswers(questions, {
      department: { type: "choice", choice: "technical", probabilities: { billing: 0.2, technical: 0.7, other: 0.1 } },
      severity: { type: "score", score: 2, probabilities: { "0": 0, "1": 0.1, "2": 0.9 } },
      refund: { type: "noul", noul: 0.12 },
    });
    expect(a.department.choice).toBe("technical");
    expect(a.department.confidence).toBeCloseTo(0.7);
    expect(a.severity).toMatchObject({ level: 2, score: 2 });
    expect(a.refund.noul).toBe(0.12);
  });
});
