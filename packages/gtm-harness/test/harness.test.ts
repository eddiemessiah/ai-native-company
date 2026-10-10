import type Anthropic from "@anthropic-ai/sdk";
import { Brain, lintQuestions, ScriptedProvider } from "@repo/brain";
import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import {
  buildHarness,
  generatePlan,
  gtmInputSchema,
  judgeOutreach,
  normalizePlan,
  outreachQuestions,
  PlanError,
  renderInput,
  reviewOutreach,
  templatePlan,
  type GtmInput,
} from "../src/index";
import { zipHarness } from "../src/zip";

const input: GtmInput = gtmInputSchema.parse({
  product: "Ajo Circle",
  pitch: "Rotating savings groups on MiniPay, with automatic payouts in stablecoins.",
  audience: "Market traders and savings-group leaders in Lagos",
  stage: "live",
  goal: "100 active savers",
  channels: ["whatsapp", "x", "communities"],
  regions: "Nigeria",
  onchain: true,
});

describe("input", () => {
  it("accepts a founder's form and rejects junk", () => {
    expect(input.channels).toEqual(["whatsapp", "x", "communities"]);
    expect(gtmInputSchema.safeParse({ ...input, channels: [] }).success).toBe(false);
    expect(gtmInputSchema.safeParse({ ...input, stage: "unicorn" }).success).toBe(false);
  });

  it("marks the founder's words as data for the model", () => {
    const text = renderInput(input);
    expect(text.startsWith("<founder_input>")).toBe(true);
    expect(text).toContain("Built on Celo or MiniPay: yes");
  });
});

describe("the template plan", () => {
  it("fills every section without a model, with Celo channels when onchain", () => {
    const { plan, generatedBy } = templatePlan(input);
    expect(generatedBy.kind).toBe("template");
    expect(plan.icp.criteria.length).toBeGreaterThanOrEqual(5);
    expect(plan.drafts).toHaveLength(3);
    expect(plan.sprint).toHaveLength(7);
    expect(plan.metrics).toHaveLength(5);
    expect(plan.sources.some((s) => s.channel === "Celo ecosystem")).toBe(true);
    expect(() => normalizePlan(plan)).not.toThrow();
  });
});

describe("normalizing model output", () => {
  it("clamps counts and weights to what the harness promises", () => {
    const { plan } = templatePlan(input);
    const noisy = {
      ...plan,
      icp: { ...plan.icp, criteria: [...plan.icp.criteria, ...plan.icp.criteria].map((c) => ({ ...c, weight: 9 })) },
      drafts: [...plan.drafts, ...plan.drafts],
      sprint: [...plan.sprint].reverse().concat(plan.sprint),
    };
    const out = normalizePlan(noisy);
    expect(out.icp.criteria).toHaveLength(7);
    expect(out.icp.criteria.every((c) => c.weight === 5)).toBe(true);
    expect(out.drafts).toHaveLength(3);
    expect(out.sprint.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("rejects output that isn't a plan", () => {
    expect(() => normalizePlan({ positioning: {} })).toThrow(PlanError);
  });

  it("calls Claude with structured outputs and parses the plan", async () => {
    const { plan } = templatePlan(input);
    let request: Record<string, unknown> = {};
    const client = {
      beta: {
        messages: {
          create: async (body: Record<string, unknown>) => {
            request = body;
            return {
              stop_reason: "end_turn",
              model: "claude-opus-5",
              content: [{ type: "text", text: JSON.stringify(plan) }],
              usage: { input_tokens: 1000, output_tokens: 3000, cache_read_input_tokens: 200, cache_creation_input_tokens: null },
            };
          },
        },
      },
    } as unknown as Anthropic;
    const out = await generatePlan(input, { client });
    expect(out.generatedBy).toEqual({ kind: "model", model: "claude-opus-5", via: "anthropic" });
    expect(out.usage).toEqual({ inputTokens: 1200, outputTokens: 3000 });
    expect(request).toMatchObject({ model: "claude-opus-5", fallbacks: "default", output_config: { format: { type: "json_schema" } } });

    const previous = process.env.GTM_MODEL;
    process.env.GTM_MODEL = "";
    try {
      await generatePlan(input, { client });
      expect(request.model).toBe("claude-opus-5");
    } finally {
      if (previous === undefined) delete process.env.GTM_MODEL;
      else process.env.GTM_MODEL = previous;
    }
  });
});

describe("the reviewer", () => {
  const noul = (p: number) => ({ type: "noul" as const, noul: p });
  const answers = (over: Partial<Record<keyof typeof outreachQuestions, unknown>> = {}) => ({
    personal: { type: "score", score: 2.4, level: 2, probabilities: [0.05, 0.15, 0.3, 0.5], confidence: 0.5 },
    clear_ask: noul(0.9),
    unsourced_claims: noul(0.05),
    pushy: noul(0.05),
    ready: noul(0.9),
    ...over,
  });

  it("lints clean apart from informational findings", () => {
    expect(lintQuestions(outreachQuestions).filter((d) => d.level !== "info")).toEqual([]);
  });

  it("marks a personal, honest draft with one ask as ready", async () => {
    const brain = new Brain({ providers: [new ScriptedProvider(() => answers())], sinks: [] });
    const review = await reviewOutreach(brain, { channel: "X", audience: "traders", text: "Hi [name]…" });
    expect(review).toMatchObject({ verdict: "ready", fixes: [], provider: "scripted", calibrated: true });
  });

  it("blocks invented claims and pressure, and asks for revisions otherwise", () => {
    const j = (over: Record<string, unknown>) => judgeOutreach(answers(over) as never, { calibrated: true });
    expect(j({ unsourced_claims: noul(0.9) }).verdict).toBe("blocked");
    expect(j({ pushy: noul(0.85) }).verdict).toBe("blocked");
    expect(j({ clear_ask: noul(0.2) })).toMatchObject({ verdict: "revise" });
    expect(judgeOutreach(answers({ ready: noul(0.75) }) as never, { calibrated: false }).verdict).toBe("revise");
  });
});

describe("the harness folder", () => {
  it("writes the workspace, the drafts with their reviews, and zips them", () => {
    const { plan } = templatePlan(input);
    const reviews = plan.drafts.map((_, i) => (i === 0 ? { verdict: "ready" as const, fixes: [], provider: "jev", calibrated: true } : null));
    const files = buildHarness(input, plan, reviews, new Date("2026-09-29T09:00:00Z"));
    for (const f of [
      "README.md",
      "AGENTS.md",
      "CLAUDE.md",
      "brain/index.md",
      "brain/audience.md",
      "brain/products/ajo-circle.md",
      "workflows/router.md",
      "workflows/approvals.md",
      ".agents/skills/review-drafts/SKILL.md",
      ".claude/skills/review-drafts/SKILL.md",
      ".gemini/settings.json",
      "campaigns/first-campaign/approval.md",
      "rules/outreach.md",
      "corrections-log.md",
      "sprint.md",
      "dashboard.md",
      "pipeline.csv",
    ]) {
      expect(files[f], f).toBeTruthy();
    }
    const drafts = Object.keys(files).filter((f) => f.startsWith("drafts/"));
    expect(drafts).toHaveLength(3);
    expect(files[drafts[0]!]).toContain("READY");
    expect(files[drafts[1]!]).toContain("not reviewed yet");
    expect(files["AGENTS.md"]).toContain("Send, post, email or DM anything yourself");
    expect(files["CLAUDE.md"]!.startsWith("@AGENTS.md")).toBe(true);
    expect(files["README.md"]).toContain("2026-09-29");

    const unzipped = unzipSync(zipHarness(files));
    expect(Object.keys(unzipped)).toContain("gtm-harness/AGENTS.md");
    expect(strFromU8(unzipped["gtm-harness/sprint.md"]!)).toContain("- [ ]");
  });
});
