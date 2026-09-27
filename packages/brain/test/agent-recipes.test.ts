import { describe, expect, it } from "vitest";
import { Brain, lintQuestions, ScriptedProvider } from "../src/index";
import {
  actionGateQuestions,
  decideActionGate,
  purchaseQuestions,
  routeActionGate,
  routePurchase,
  type ActionGateAnswers,
  type PurchaseAnswers,
} from "../src/recipes/index";

const noul = (p: number) => ({ type: "noul" as const, noul: p });
const gateAnswers = (matches: number, riskier = 0.1, approved = 0.2) =>
  ({ matches_request: noul(matches), user_approved: noul(approved), riskier_than_stated: noul(riskier) }) as ActionGateAnswers;
const purchase = (serves: number, legit: number) =>
  ({ serves_task: noul(serves), looks_legitimate: noul(legit) }) as PurchaseAnswers;
const calibrated = { calibrated: true };

describe("agent recipes: questions", () => {
  it("lint clean apart from informational findings", () => {
    for (const qs of [actionGateQuestions(), purchaseQuestions()]) {
      expect(lintQuestions(qs).filter((d) => d.level !== "info")).toEqual([]);
    }
  });
});

describe("Shonin Gate routing", () => {
  const input = { action: "look up order A-104", request: "where is my order?", risk: "read" as const };

  it("executes a read the user asked for", () => {
    expect(routeActionGate(gateAnswers(0.9), input, calibrated)).toMatchObject({ verdict: "execute", effectiveRisk: "read" });
  });

  it("escalates an action that doesn't match the request", () => {
    expect(routeActionGate(gateAnswers(0.2), input, calibrated)).toMatchObject({ verdict: "escalate" });
  });

  it("never executes money or irreversible actions, however confident", () => {
    const r = routeActionGate(gateAnswers(0.99), { ...input, risk: "money" }, calibrated);
    expect(r.verdict).toBe("confirm");
  });

  it("applies the external bar when an action looks riskier than stated", () => {
    const r = routeActionGate(gateAnswers(0.8, 0.9), { ...input, risk: "write" }, calibrated);
    expect(r).toMatchObject({ verdict: "confirm", effectiveRisk: "external", threshold: 0.85 });
    expect(r.reason).toContain("riskier");
  });

  it("lets the caller raise the bar but not lower it", () => {
    expect(routeActionGate(gateAnswers(0.8), { ...input, risk: "write", minConfidence: 0.9 }, calibrated).verdict).toBe("confirm");
    const lowered = routeActionGate(gateAnswers(0.55), { ...input, minConfidence: 0.1 }, calibrated);
    expect(lowered).toMatchObject({ verdict: "execute", threshold: 0.5 });
  });

  it("asks uncalibrated providers for a person on external actions", () => {
    const r = routeActionGate(gateAnswers(0.95), { ...input, risk: "external" }, { calibrated: false });
    expect(r.verdict).toBe("confirm");
  });

  it("runs end to end through the brain", async () => {
    const brain = new Brain({
      providers: [new ScriptedProvider(() => ({ matches_request: noul(0.93), user_approved: noul(0.8), riskier_than_stated: noul(0.05) }))],
      sinks: [],
    });
    const { route, decision } = await decideActionGate(brain, input);
    expect(route).toMatchObject({ verdict: "execute", userApproved: true });
    expect(decision.provider).toBe("scripted");
  });
});

describe("Shonin Check purchase routing", () => {
  it("pays when the purchase serves the task and the offer looks real", () => {
    expect(routePurchase(purchase(0.9, 0.9), calibrated).verdict).toBe("pay");
  });

  it("blocks when the model is confident the answer is no", () => {
    expect(routePurchase(purchase(0.2, 0.9), calibrated)).toMatchObject({ verdict: "block" });
    expect(routePurchase(purchase(0.9, 0.1), calibrated)).toMatchObject({ verdict: "block" });
  });

  it("asks a person when unsure, with a stricter bar for uncalibrated providers", () => {
    expect(routePurchase(purchase(0.65, 0.9), calibrated).verdict).toBe("confirm");
    expect(routePurchase(purchase(0.75, 0.9), calibrated).verdict).toBe("pay");
    expect(routePurchase(purchase(0.75, 0.9), { calibrated: false }).verdict).toBe("confirm");
  });
});
