import { describe, expect, it } from "vitest";
import { Brain, HeuristicProvider } from "../src/index";
import {
  assessGrant,
  decideLead,
  grantQuestions,
  judgeDraft,
  placeLearner,
  routeLead,
  routeTicket,
  type ContentAnswers,
  type LeadAnswers,
  type StudyAnswers,
  type TicketAnswers,
} from "../src/recipes/index";

const choice = <K extends string>(c: K, confidence = 0.9) => ({
  type: "choice" as const,
  choice: c,
  probabilities: { [c]: confidence } as Record<K, number>,
  confidence,
});
const score = (s: number, confidence = 0.8) => ({
  type: "score" as const,
  score: s,
  level: Math.round(s),
  probabilities: [0.1, 0.1, 0.8],
  confidence,
});
const noul = (p: number) => ({ type: "noul" as const, noul: p });

describe("lead routing", () => {
  it("books a call for an urgent, funded decision maker", () => {
    const a = {
      offer: choice("grant-desk"),
      urgency: score(2),
      budget: score(1.8),
      decision_maker: noul(0.9),
      spam: noul(0.02),
    } as unknown as LeadAnswers;
    expect(routeLead(a)).toMatchObject({ priority: "P0", next: "book_call", offer: "grant-desk" });
  });

  it("discards spam and sends unclear requests to a person", () => {
    const base = { urgency: score(1), budget: score(1), decision_maker: noul(0.5) };
    expect(routeLead({ ...base, offer: choice("x"), spam: noul(0.95) } as unknown as LeadAnswers).next).toBe("discard");
    expect(routeLead({ ...base, offer: choice("other"), spam: noul(0.1) } as unknown as LeadAnswers).next).toBe(
      "human_review",
    );
    expect(routeLead({ ...base, offer: choice("x", 0.4), spam: noul(0.1) } as unknown as LeadAnswers).next).toBe(
      "human_review",
    );
  });

  it("routes a real message end to end with the heuristic provider", async () => {
    const brain = new Brain({ providers: [new HeuristicProvider()], sinks: [] });
    const { route } = await decideLead(
      brain,
      { message: "We need help writing our grant application for the Celo Prezenti round. Deadline is this week." },
      [
        { slug: "grant-desk", name: "Grant Desk", pitch: "We write and review grant applications, RFPs and proposals for funding rounds" },
        { slug: "company-brain", name: "Company Brain", pitch: "An AI teammate in your Slack or WhatsApp that remembers company knowledge" },
        { slug: "agent-launch", name: "Agent Launch Sprint", pitch: "We build and deploy a custom AI agent for your business" },
      ],
    );
    expect(route.offer).toBe("grant-desk");
  });
});

describe("ticket cascade", () => {
  const base = { complexity: score(0.2), frustration: score(0.3), refund_requested: noul(0.1), has_repro: noul(0.5) };
  it("sends order status to plain code, never a model", () => {
    expect(routeTicket({ ...base, intent: choice("order_status") } as unknown as TicketAnswers)).toEqual({
      kind: "code",
      handler: "lookup_order",
    });
  });
  it("sends refunds to a person and angry customers to a person", () => {
    expect(routeTicket({ ...base, intent: choice("billing"), refund_requested: noul(0.9) } as unknown as TicketAnswers).kind).toBe(
      "human",
    );
    expect(routeTicket({ ...base, intent: choice("product_question"), frustration: score(1.9) } as unknown as TicketAnswers).kind).toBe(
      "human",
    );
  });
  it("loads a specialist LLM for product questions", () => {
    expect(routeTicket({ ...base, intent: choice("product_question") } as unknown as TicketAnswers)).toEqual({
      kind: "llm",
      specialist: "product",
    });
  });
});

describe("grant fit", () => {
  it("weights criteria and names what to fix first", () => {
    const qs = grantQuestions();
    const answers: Record<string, unknown> = {};
    for (const [name, q] of Object.entries(qs)) {
      if (q.type === "score") answers[name] = { ...score(name === "c_budget" ? 0 : 3), probabilities: [0, 0, 0, 1] };
    }
    Object.assign(answers, { eligible: noul(0.9), unsupported_claims: noul(0.1), ready: noul(0.8) });
    const result = assessGrant(answers as never);
    expect(result.fixFirst[0]).toBe("Budget");
    expect(result.score).toBeGreaterThan(80);
    expect(result.verdict).toBe("submit");
  });
});

describe("study placement", () => {
  it("assigns a pod from typed answers", () => {
    const a = {
      track: choice("t4"),
      level: score(1.2),
      hours: score(2),
      goal: choice("startup"),
      wants_live: noul(0.8),
    } as unknown as StudyAnswers;
    expect(placeLearner(a, { timezone: "Africa/Accra" })).toMatchObject({
      track: "t4",
      band: "builder",
      format: "cohort",
      pod: "t4-builder-africa",
      needsHuman: false,
    });
  });
});

describe("content gate", () => {
  it("publishes only strong, sourced drafts", () => {
    const strong = {
      hook: score(2.5),
      specificity: score(2.4),
      voice: score(2.6),
      unsourced_numbers: noul(0.1),
      ready: noul(0.9),
    } as unknown as ContentAnswers;
    expect(judgeDraft(strong).verdict).toBe("publish");
    expect(judgeDraft({ ...strong, unsourced_numbers: noul(0.8) } as ContentAnswers).verdict).toBe("revise");
  });
});
