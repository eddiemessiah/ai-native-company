import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { Choice, Noul, Score } from "../src/index";
import { AnthropicProvider, renderPrompt, responseSchema, toAnswers } from "../src/providers/anthropic";

const questions = {
  team: Choice({ instructions: "Which team should handle this", criteria: { billing: "Payments", other: "Anything else" } }),
  mood: Score({ instructions: "How frustrated the customer is", criteria: ["Calm", "Annoyed", "Angry"] }),
  refund: Noul("The customer is explicitly asking for a refund"),
};

function fakeClient(response: unknown) {
  const create = vi.fn().mockResolvedValue(response);
  return { client: { beta: { messages: { create } } } as unknown as Anthropic, create };
}

describe("AnthropicProvider", () => {
  it("builds a strict schema with every field required", () => {
    const schema = responseSchema(questions) as { required: string[]; properties: Record<string, any> };
    expect(schema.required).toEqual(["team", "mood", "refund"]);
    expect(schema.properties.team.properties.probabilities.required).toEqual(["billing", "other"]);
    expect(schema.properties.mood.properties.level_probabilities.required).toEqual(["level_0", "level_1", "level_2"]);
    expect(schema.properties.refund.required).toEqual(["p_yes"]);
  });

  it("renders state as data and lists every option", () => {
    const prompt = renderPrompt({ message: "charged twice" }, questions);
    expect(prompt).toContain("<state>");
    expect(prompt).toContain("- billing: Payments");
    expect(prompt).toContain("- level_2: Angry");
  });

  it("normalizes probabilities and derives choice, score and confidence", () => {
    const a = toAnswers(questions, {
      team: { probabilities: { billing: 3, other: 1 } },
      mood: { level_probabilities: { level_0: 0.2, level_1: 0.2, level_2: 0.6 } },
      refund: { p_yes: 1.4 },
    });
    expect(a.team).toMatchObject({ choice: "billing", confidence: 0.75 });
    expect(a.mood.level).toBe(2);
    expect(a.mood.score).toBeCloseTo(1.4);
    expect(a.refund.noul).toBe(1);
  });

  it("calls the API with structured output and server-side fallbacks, and reports usage", async () => {
    const { client, create } = fakeClient({
      id: "msg_1",
      model: "claude-opus-5",
      stop_reason: "end_turn",
      usage: { input_tokens: 420, output_tokens: 60 },
      content: [
        { type: "thinking", thinking: "" },
        {
          type: "text",
          text: JSON.stringify({
            team: { probabilities: { billing: 0.9, other: 0.1 } },
            mood: { level_probabilities: { level_0: 0.7, level_1: 0.2, level_2: 0.1 } },
            refund: { p_yes: 0.95 },
          }),
        },
      ],
    });
    const provider = new AnthropicProvider({ client, model: "claude-opus-5" });
    const result = await provider.decide({ state: "charged twice, refund please", questions });
    expect(result.answers.team.choice).toBe("billing");
    expect(result.usage).toEqual({ inputTokens: 420, outputTokens: 60 });
    const params = create.mock.calls[0]![0];
    expect(params.fallbacks).toBe("default");
    expect(params.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(params.output_config.format.type).toBe("json_schema");
    expect(params.output_config.effort).toBe("low");
  });

  it("omits server-side fallbacks for models that don't take them", async () => {
    const { client, create } = fakeClient({
      id: "m",
      model: "claude-haiku-4-5",
      stop_reason: "end_turn",
      usage: { input_tokens: 1, output_tokens: 1 },
      content: [{ type: "text", text: JSON.stringify({ team: { probabilities: { billing: 1, other: 0 } }, mood: { level_probabilities: { level_0: 1, level_1: 0, level_2: 0 } }, refund: { p_yes: 0 } }) }],
    });
    await new AnthropicProvider({ client, model: "claude-haiku-4-5" }).decide({ state: "x", questions });
    expect(create.mock.calls[0]![0].fallbacks).toBeUndefined();
  });

  it("throws on refusal so the brain falls back", async () => {
    const { client } = fakeClient({ id: "m", model: "claude-opus-5", stop_reason: "refusal", usage: {}, content: [] });
    await expect(new AnthropicProvider({ client }).decide({ state: "x", questions })).rejects.toThrow(/declined/);
  });
});
