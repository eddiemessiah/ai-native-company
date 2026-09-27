import type { Brain } from "@repo/brain";
import { decidePurchase, type PurchaseRoute } from "@repo/brain/recipes";
import { findToken, isAddress, resolveNetwork, toUnits, ZERO_ADDRESS, type NetworkInfo, type TokenInfo } from "./networks";

/**
 * Shonin Check: "should my agent pay this?"
 *
 * Code checks every payment option in an x402 PAYMENT-REQUIRED (token, amount,
 * budget, payee, signing domain, host). Only when those pass, and the caller
 * says what the user asked for, does the brain answer whether the purchase
 * serves that task. A model can lower the verdict, never raise it, and never
 * above the caller's auto-approve limit.
 */

export type Verdict = "pay" | "confirm" | "block";
export type CheckStatus = "pass" | "warn" | "fail";

export interface CheckItem {
  readonly id: string;
  readonly status: CheckStatus;
  readonly detail: string;
}

export interface PaymentOption {
  readonly index: number;
  readonly scheme: string;
  readonly network: NetworkInfo;
  readonly asset: string;
  readonly token: TokenInfo | undefined;
  /** Atomic units, as sent. */
  readonly amount: string;
  readonly amountUsd: number | null;
  readonly payTo: string;
  readonly maxTimeoutSeconds: number;
  readonly extra: Readonly<Record<string, unknown>>;
  readonly resourceUrl?: string;
  readonly description?: string;
}

export interface PaymentRequest {
  readonly x402Version: number;
  readonly resource?: { readonly url?: string; readonly description?: string; readonly serviceName?: string };
  readonly options: readonly PaymentOption[];
}

export class CheckInputError extends Error {}
export class NeedsBrainError extends Error {}

const MAX_OPTIONS = 20;
export const DEFAULT_AUTO_APPROVE_USD = 0.1;

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);

function decodeBase64(value: string): string {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Accepts the PAYMENT-REQUIRED header value (base64 JSON), a JSON string, or the decoded object; x402 v1 or v2. */
export function decodePaymentRequired(raw: unknown): PaymentRequest {
  let value: unknown = raw;
  if (typeof raw === "string") {
    const text = raw.trim();
    try {
      value = JSON.parse(text.startsWith("{") ? text : decodeBase64(text));
    } catch {
      throw new CheckInputError("paymentRequired is not valid JSON or base64-encoded JSON");
    }
  }
  if (!isObject(value)) throw new CheckInputError("paymentRequired must be an object");
  const version = value.x402Version;
  if (typeof version !== "number") throw new CheckInputError("paymentRequired.x402Version is missing");
  if (!Array.isArray(value.accepts)) throw new CheckInputError("paymentRequired.accepts must be an array");

  const resource = isObject(value.resource)
    ? {
        ...(str(value.resource.url) ? { url: str(value.resource.url) } : {}),
        ...(str(value.resource.description) ? { description: str(value.resource.description) } : {}),
        ...(str(value.resource.serviceName) ? { serviceName: str(value.resource.serviceName) } : {}),
      }
    : undefined;

  const options = value.accepts.slice(0, MAX_OPTIONS).map((a, index): PaymentOption => {
    if (!isObject(a)) throw new CheckInputError(`accepts[${index}] must be an object`);
    const scheme = str(a.scheme);
    const networkId = str(a.network);
    const asset = str(a.asset);
    const payTo = str(a.payTo);
    // v2 names it `amount`; v1 names it `maxAmountRequired`.
    const amountRaw = a.amount ?? a.maxAmountRequired;
    const amount = typeof amountRaw === "number" ? String(amountRaw) : str(amountRaw);
    if (!scheme || !networkId || !asset || !payTo || !amount) {
      throw new CheckInputError(`accepts[${index}] needs scheme, network, asset, payTo and amount`);
    }
    const network = resolveNetwork(networkId);
    const token = findToken(asset, network);
    let amountUsd: number | null = null;
    if (token && /^\d+$/.test(amount)) amountUsd = toUnits(BigInt(amount), token.decimals);
    return {
      index,
      scheme,
      network,
      asset,
      token,
      amount,
      amountUsd,
      payTo,
      maxTimeoutSeconds: typeof a.maxTimeoutSeconds === "number" ? a.maxTimeoutSeconds : 60,
      extra: isObject(a.extra) ? a.extra : {},
      ...(str(a.resource) ? { resourceUrl: str(a.resource) } : {}),
      ...(str(a.description) ? { description: str(a.description) } : {}),
    };
  });

  return { x402Version: version, ...(resource ? { resource } : {}), options };
}

export interface CheckContext {
  /** The URL the agent called. Its host must match the resource being paid for. */
  readonly url?: string;
  readonly budgetUsd?: number;
  readonly allowPayTo?: readonly string[];
}

const usd = (n: number) => `$${n < 0.01 ? n.toPrecision(2) : n.toFixed(2)}`;

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

export function inspectOption(o: PaymentOption, req: PaymentRequest, ctx: CheckContext): CheckItem[] {
  const out: CheckItem[] = [];
  const add = (id: string, status: CheckStatus, detail: string) => out.push({ id, status, detail });

  if (o.scheme === "exact") add("scheme", "pass", "exact: the amount is fixed");
  else if (o.scheme === "upto") add("scheme", "warn", "upto: the amount is a maximum, the final charge can be lower");
  else add("scheme", "warn", `unknown scheme "${o.scheme}"`);

  if (o.network.family === "unknown") add("network", "warn", `unknown network "${o.network.id}"`);
  else if (o.network.testnet) add("network", "warn", `${o.network.name} is a testnet: no real money moves`);
  else add("network", "pass", o.network.name);

  if (o.token) add("token", "pass", `${o.token.symbol} (${o.token.address})`);
  else add("token", "warn", "unknown token: it can't be priced in USD");

  const positive = /^\d+$/.test(o.amount) && BigInt(o.amount) > 0n;
  if (!positive) add("amount", "fail", "amount must be a positive integer in atomic units");
  else add("amount", "pass", o.amountUsd === null ? `${o.amount} atomic units` : usd(o.amountUsd));

  if (ctx.budgetUsd !== undefined) {
    if (o.amountUsd === null) add("budget", "warn", "an unpriced token can't be compared with your budget");
    else if (o.amountUsd > ctx.budgetUsd) add("budget", "fail", `costs ${usd(o.amountUsd)}, over your ${usd(ctx.budgetUsd)} budget`);
    else add("budget", "pass", `within your ${usd(ctx.budgetUsd)} budget`);
  }

  const payTo = o.payTo.toLowerCase();
  if (!isAddress(o.payTo, o.network.family)) add("payTo", "fail", "payTo is not a valid address");
  else if (payTo === ZERO_ADDRESS) add("payTo", "fail", "payTo is the zero address");
  else if (payTo === o.asset.toLowerCase()) add("payTo", "fail", "payTo is the token contract itself");
  else if (ctx.allowPayTo?.length && !ctx.allowPayTo.some((a) => a.toLowerCase() === payTo)) {
    add("payTo", "fail", "payTo is not on your allowlist");
  } else add("payTo", "pass", o.payTo);

  const domainName = str(o.extra.name);
  const domainVersion = str(o.extra.version);
  if (o.token?.domain && o.scheme === "exact" && (domainName || domainVersion)) {
    const expected = o.token.domain;
    if (domainName !== expected.name || domainVersion !== expected.version) {
      add(
        "domain",
        "warn",
        `signing domain "${domainName ?? "?"}" v${domainVersion ?? "?"} doesn't match ${o.token.symbol}'s "${expected.name}" v${expected.version}: the signature would be rejected`,
      );
    } else add("domain", "pass", `signing domain matches ${o.token.symbol}`);
  }

  if (o.maxTimeoutSeconds <= 0) add("timeout", "fail", "maxTimeoutSeconds must be positive");
  else if (o.maxTimeoutSeconds > 3600) add("timeout", "warn", "the authorization stays valid for over an hour");
  else add("timeout", "pass", `${o.maxTimeoutSeconds}s`);

  const resourceUrl = o.resourceUrl ?? req.resource?.url;
  if (resourceUrl) {
    const host = hostOf(resourceUrl);
    const local = host === "localhost" || host === "127.0.0.1";
    if (!host) add("resource", "warn", "the resource URL is not a valid URL");
    else if (!resourceUrl.startsWith("https://") && !local) add("resource", "warn", "the resource is not served over https");
    else add("resource", "pass", resourceUrl);
    const called = ctx.url ? hostOf(ctx.url) : undefined;
    if (called && host && called !== host) add("host", "fail", `the payment is for ${host}, but you called ${called}`);
    else if (called && host) add("host", "pass", `matches ${called}`);
  } else if (ctx.url) {
    add("host", "warn", "no resource URL to match against the host you called");
  }

  return out;
}

export interface OptionSummary {
  readonly index: number;
  readonly scheme: string;
  readonly network: string;
  readonly networkName: string;
  readonly token: string | null;
  readonly asset: string;
  readonly amount: string;
  readonly amountUsd: number | null;
  readonly payTo: string;
}

export interface CodeCheck {
  readonly verdict: Verdict;
  readonly reasons: readonly string[];
  readonly option: PaymentOption | null;
  readonly checks: readonly CheckItem[];
}

export function summarize(o: PaymentOption): OptionSummary {
  return {
    index: o.index,
    scheme: o.scheme,
    network: o.network.id,
    networkName: o.network.name,
    token: o.token?.symbol ?? null,
    asset: o.asset,
    amount: o.amount,
    amountUsd: o.amountUsd,
    payTo: o.payTo,
  };
}

/** Code only: no model. Picks the safest option and says pay, confirm or block. */
export function inspectPayment(req: PaymentRequest, ctx: CheckContext & { autoApproveUsd?: number }): CodeCheck {
  if (req.options.length === 0) {
    return { verdict: "block", reasons: ["the payment request offers no way to pay"], option: null, checks: [] };
  }
  const evaluated = req.options.map((o) => ({ o, checks: inspectOption(o, req, ctx) }));
  const count = (checks: readonly CheckItem[], s: CheckStatus) => checks.filter((c) => c.status === s).length;
  const eligible = evaluated
    .filter((e) => count(e.checks, "fail") === 0)
    .sort(
      (a, b) =>
        Number(a.o.amountUsd === null) - Number(b.o.amountUsd === null) ||
        (a.o.amountUsd ?? 0) - (b.o.amountUsd ?? 0) ||
        count(a.checks, "warn") - count(b.checks, "warn"),
    );

  const best = eligible[0];
  if (!best) {
    const first = evaluated[0]!;
    return {
      verdict: "block",
      reasons: first.checks.filter((c) => c.status === "fail").map((c) => c.detail),
      option: first.o,
      checks: first.checks,
    };
  }

  const warnings = best.checks.filter((c) => c.status === "warn").map((c) => c.detail);
  const limit = ctx.autoApproveUsd ?? DEFAULT_AUTO_APPROVE_USD;
  if (warnings.length) return { verdict: "confirm", reasons: warnings, option: best.o, checks: best.checks };
  if (best.o.amountUsd !== null && best.o.amountUsd > limit) {
    return {
      verdict: "confirm",
      reasons: [`costs ${usd(best.o.amountUsd)}, above your ${usd(limit)} auto-approve limit`],
      option: best.o,
      checks: best.checks,
    };
  }
  return { verdict: "pay", reasons: [`passed all ${best.checks.length} checks`], option: best.o, checks: best.checks };
}

export interface CheckInput extends CheckContext {
  readonly paymentRequired: unknown;
  /** What the user asked the agent to do. Enables the intent check. */
  readonly task?: string;
  /** Payments above this need a person, whatever the checks say. Default $0.10. */
  readonly autoApproveUsd?: number;
}

export interface CheckResult {
  readonly verdict: Verdict;
  readonly reasons: readonly string[];
  readonly option: OptionSummary | null;
  readonly checks: readonly CheckItem[];
  readonly intent?: PurchaseRoute;
}

export async function checkPayment(input: CheckInput, brain: Brain | null) {
  const req = decodePaymentRequired(input.paymentRequired);
  const code = inspectPayment(req, input);
  const base: CheckResult = {
    verdict: code.verdict,
    reasons: code.reasons,
    option: code.option ? summarize(code.option) : null,
    checks: code.checks,
  };
  if (code.verdict === "block" || !code.option) return { result: base };
  if (!input.task) {
    return { result: { ...base, reasons: [...base.reasons, "intent not checked: send `task` to check the purchase serves it"] } };
  }
  if (!brain) throw new NeedsBrainError("The intent check needs a decision model, and none is configured.");

  const option = code.option;
  const resourceUrl = option.resourceUrl ?? req.resource?.url;
  const description = option.description ?? req.resource?.description;
  const { decision, route } = await decidePurchase(brain, {
    task: input.task,
    resource: {
      ...(resourceUrl ? { url: resourceUrl } : {}),
      ...(description ? { description } : {}),
      ...(req.resource?.serviceName ? { serviceName: req.resource.serviceName } : {}),
    },
    priceUsd: option.amountUsd,
    network: option.network.name,
  });

  // The model can only lower the verdict.
  const verdict: Verdict = route.verdict === "block" ? "block" : route.verdict === "confirm" || code.verdict === "confirm" ? "confirm" : "pay";
  const reasons = verdict === "block" ? route.reasons : [...code.reasons, ...route.reasons];
  return { result: { ...base, verdict, reasons, intent: route }, decision };
}
