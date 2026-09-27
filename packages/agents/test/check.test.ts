import { Brain, ScriptedProvider } from "@repo/brain";
import { describe, expect, it } from "vitest";
import { checkPayment, CheckInputError, decodePaymentRequired, inspectPayment, NeedsBrainError, resolveNetwork } from "../src/index";

const CELO_USDC = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PAY_TO = "0x1111111111111111111111111111111111111111";
const URL = "https://nova.example/api/v1/triage";

const accept = (over: Record<string, unknown> = {}) => ({
  scheme: "exact",
  network: "eip155:42220",
  asset: CELO_USDC,
  amount: "10000",
  payTo: PAY_TO,
  maxTimeoutSeconds: 300,
  extra: { name: "USDC", version: "2" },
  ...over,
});
const required = (...accepts: Record<string, unknown>[]) => ({
  x402Version: 2,
  resource: { url: URL, description: "Triage a support ticket", mimeType: "application/json" },
  accepts: accepts.length ? accepts : [accept()],
});
const header = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64");
const inspect = (value: unknown, ctx: Parameters<typeof inspectPayment>[1] = { url: URL }) =>
  inspectPayment(decodePaymentRequired(value), ctx);

describe("decoding payment requests", () => {
  it("reads the v2 header and prices known stablecoins", () => {
    const req = decodePaymentRequired(header(required()));
    expect(req.options[0]).toMatchObject({ amountUsd: 0.01, token: { symbol: "USDC" } });
    expect(req.options[0]!.network).toMatchObject({ id: "eip155:42220", name: "Celo" });
  });

  it("reads x402 v1 bodies with network names", () => {
    const req = decodePaymentRequired({
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: "base",
          maxAmountRequired: "10000",
          resource: "https://api.example/data",
          description: "Market data",
          mimeType: "application/json",
          payTo: PAY_TO,
          maxTimeoutSeconds: 60,
          asset: BASE_USDC,
          extra: { name: "USD Coin", version: "2" },
        },
      ],
    });
    expect(req.options[0]).toMatchObject({ amountUsd: 0.01, resourceUrl: "https://api.example/data" });
    expect(req.options[0]!.network.id).toBe("eip155:8453");
    expect(resolveNetwork("celo").id).toBe("eip155:42220");
  });

  it("rejects input that isn't a payment request", () => {
    expect(() => decodePaymentRequired("not base64 json")).toThrow(CheckInputError);
    expect(() => decodePaymentRequired({ accepts: [] })).toThrow(CheckInputError);
    expect(() => decodePaymentRequired({ x402Version: 2, accepts: [{ scheme: "exact" }] })).toThrow(CheckInputError);
  });
});

describe("code checks", () => {
  it("pays a small, well-formed request for the host it called", () => {
    const r = inspect(required(), { url: URL, budgetUsd: 0.05 });
    expect(r.verdict).toBe("pay");
    expect(r.checks.every((c) => c.status === "pass")).toBe(true);
    // scheme, network, token, amount, budget, payTo, domain, timeout, resource, host
    expect(r.checks).toHaveLength(10);
    expect(r.reasons).toEqual(["passed all 10 checks"]);
  });

  it("blocks over budget, bad payees and the wrong host", () => {
    expect(inspect(required(), { url: URL, budgetUsd: 0.005 }).verdict).toBe("block");
    expect(inspect(required(accept({ payTo: CELO_USDC })), { url: URL }).reasons).toContain("payTo is the token contract itself");
    expect(inspect(required(accept({ payTo: "0x0000000000000000000000000000000000000000" }))).verdict).toBe("block");
    expect(inspect(required(accept({ payTo: "not-an-address" }))).verdict).toBe("block");
    expect(inspect(required(), { url: "https://other.example/x" }).reasons[0]).toMatch(/you called other\.example/);
    expect(inspect(required(), { url: URL, allowPayTo: ["0x2222222222222222222222222222222222222222"] }).verdict).toBe("block");
  });

  it("asks a person about unknown tokens, wrong signing domains, testnets and large amounts", () => {
    expect(inspect(required(accept({ asset: "0x3333333333333333333333333333333333333333" }))).verdict).toBe("confirm");
    const domain = inspect(required(accept({ extra: { name: "USD Coin", version: "2" } })));
    expect(domain.verdict).toBe("confirm");
    expect(domain.reasons[0]).toMatch(/signature would be rejected/);
    expect(inspect(required(accept({ network: "eip155:11142220", asset: "0x01C5C0122039549AD1493B8220cABEdD739BC44E" }))).verdict).toBe(
      "confirm",
    );
    const large = inspect(required(accept({ amount: "500000" })));
    expect(large).toMatchObject({ verdict: "confirm" });
    expect(large.reasons[0]).toMatch(/above your \$0\.10 auto-approve limit/);
    expect(inspect(required(accept({ amount: "500000" })), { url: URL, autoApproveUsd: 1 }).verdict).toBe("pay");
  });

  it("picks the cheapest option that passes", () => {
    const r = inspect(
      required(
        accept({ amount: "5000", payTo: "0x0000000000000000000000000000000000000000" }),
        accept({ amount: "20000" }),
        accept({ amount: "10000" }),
      ),
    );
    expect(r.verdict).toBe("pay");
    expect(r.option?.index).toBe(2);
  });

  it("blocks a request with no way to pay", () => {
    expect(inspect({ x402Version: 2, accepts: [] }).verdict).toBe("block");
  });
});

describe("the intent check", () => {
  const brainSaying = (serves: number, legit: number) =>
    new Brain({
      providers: [new ScriptedProvider(() => ({ serves_task: { type: "noul", noul: serves }, looks_legitimate: { type: "noul", noul: legit } }))],
      sinks: [],
    });

  it("pays when the purchase serves the task", async () => {
    const { result, decision } = await checkPayment({ paymentRequired: header(required()), url: URL, task: "triage this support ticket" }, brainSaying(0.95, 0.95));
    expect(result.verdict).toBe("pay");
    expect(decision?.provider).toBe("scripted");
  });

  it("lets the model block, but never raise a code verdict", async () => {
    const off = await checkPayment({ paymentRequired: required(), url: URL, task: "book a flight" }, brainSaying(0.1, 0.9));
    expect(off.result.verdict).toBe("block");
    const large = await checkPayment({ paymentRequired: required(accept({ amount: "500000" })), url: URL, task: "triage" }, brainSaying(0.99, 0.99));
    expect(large.result.verdict).toBe("confirm");
  });

  it("works without a model when no task is given, and says so", async () => {
    const { result } = await checkPayment({ paymentRequired: required(), url: URL }, null);
    expect(result.verdict).toBe("pay");
    expect(result.reasons.at(-1)).toMatch(/intent not checked/);
    await expect(checkPayment({ paymentRequired: required(), url: URL, task: "x" }, null)).rejects.toThrow(NeedsBrainError);
  });
});
