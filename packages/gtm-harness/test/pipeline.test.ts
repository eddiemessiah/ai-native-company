import { describe, expect, it } from "vitest";
import { buildHarness, gtmInputSchema, templatePlan } from "../src/index";
import { dueFollowUps, leadsFrom, parseDay, parseScorecard, scoreLead, stageFor, workingDaysBetween } from "../src/pipeline";

const input = gtmInputSchema.parse({
  product: "Ajo Circle",
  pitch: "Rotating savings groups on MiniPay, with automatic payouts in stablecoins.",
  audience: "Market traders and savings-group leaders in Lagos",
  stage: "live",
  goal: "100 active savers",
  channels: ["whatsapp", "x", "communities"],
  regions: "Nigeria",
});

describe("the pipeline's arithmetic", () => {
  it("reads the scorecard the workspace writes", () => {
    const { plan } = templatePlan(input);
    const criteria = parseScorecard(buildHarness(input, plan, [])["brain/audience.md"]!);
    expect(criteria.map((c) => [c.name, c.weight])).toEqual(plan.icp.criteria.map((c) => [c.name, c.weight]));
  });

  it("adds weights and sets the stage at the thresholds", () => {
    const criteria = [
      { name: "A", weight: 3, lookFor: "" },
      { name: "B", weight: 1, lookFor: "" },
    ];
    expect(scoreLead(criteria, [{ criterion: "a", met: true, evidence: "x" }, { criterion: "B", met: false }])).toEqual({ ok: true, score: 75, stage: "nurture", met: ["A"] });
    expect(stageFor(80)).toBe("reach out");
    expect(stageFor(79)).toBe("nurture");
    expect(stageFor(59)).toBe("skip");
    expect(scoreLead([], [])).toMatchObject({ ok: false });
    expect(scoreLead(criteria, [{ criterion: "A", met: true, evidence: "x" }, { criterion: "A", met: false }])).toMatchObject({ ok: false, problem: '"A" is judged twice' });
  });

  it("counts working days and dates exactly", () => {
    const friday = parseDay("2026-10-09")!;
    expect(workingDaysBetween(friday, parseDay("2026-10-12")!)).toBe(1);
    expect(workingDaysBetween(friday, parseDay("2026-10-14")!)).toBe(3);
    expect(workingDaysBetween(friday, parseDay("2026-10-11")!)).toBe(0);
    expect(parseDay("2026-02-30")).toBeNull();
    expect(parseDay("10/09/2026")).toBeNull();

    const header = ["name", "handle_or_email", "stage", "last_touch", "next_step", "do_not_contact"];
    const leads = leadsFrom(header, [
      ["Ada", "ada@x.com", "contacted", "2026-10-09", "", ""],
      ["Bola", "bola@x.com", "Contacted", "2026-10-13", "", ""],
      ["Chi", "chi@x.com", "contacted", "2026-10-01", "stop", ""],
      ["Dee", "dee@x.com", "replied", "2026-10-01", "", ""],
    ]);
    const due = dueFollowUps(leads, parseDay("2026-10-14")!);
    expect(due.due.map((l) => l.name)).toEqual(["Ada"]);
    expect(due.waiting.map((l) => l.name)).toEqual(["Bola"]);
    expect(due.stopped.map((l) => l.name)).toEqual(["Chi"]);
  });
});
