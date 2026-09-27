import {
  checkPayment,
  CheckInputError,
  decodePaymentResponse,
  fetchReceipt,
  NeedsBrainError,
  ReceiptInputError,
  ReceiptNotFoundError,
  resolveNetwork,
  signReceipt,
} from "@repo/agents";
import { BrainError } from "@repo/brain";
import { decideActionGate, decideLead, gateDraft, scoreGrant, triageTicket, type RubricCriterion } from "@repo/brain/recipes";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPaidBrain, publicDecision } from "./brain";

/**
 * Handlers behind the paid routes. Returning >= 400 means the x402 wrapper
 * does not settle: a caller never pays for an error, a timeout, or a model outage.
 */

function unavailable() {
  return NextResponse.json({ error: "No decision model is configured on this deployment." }, { status: 503 });
}

async function run<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    return NextResponse.json(await fn());
  } catch (error) {
    const status = error instanceof BrainError ? 503 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status });
  }
}

async function body<S extends z.ZodType>(req: NextRequest, schema: S): Promise<z.infer<S> | NextResponse> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  }
  return parsed.data;
}

export const triageSchema = z.object({
  subject: z.string().max(300).optional(),
  message: z.string().min(3).max(8000),
  customer: z.record(z.string(), z.unknown()).optional(),
});

export async function triage(req: NextRequest): Promise<NextResponse> {
  const input = await body(req, triageSchema);
  if (input instanceof NextResponse) return input;
  const brain = getPaidBrain();
  if (!brain) return unavailable();
  return run(async () => {
    const { decision, route } = await triageTicket(brain, input);
    return { route, decision: publicDecision(decision) };
  });
}

export const leadSchema = z.object({
  message: z.string().min(3).max(8000),
  offers: z
    .array(z.object({ slug: z.string().min(1).max(60), name: z.string().min(1).max(120), pitch: z.string().min(3).max(600) }))
    .min(1)
    .max(40),
  company: z.string().max(200).optional(),
});

export async function leadScore(req: NextRequest): Promise<NextResponse> {
  const input = await body(req, leadSchema);
  if (input instanceof NextResponse) return input;
  const brain = getPaidBrain();
  if (!brain) return unavailable();
  return run(async () => {
    const { decision, route } = await decideLead(brain, { message: input.message, ...(input.company ? { company: input.company } : {}) }, input.offers);
    return { route, decision: publicDecision(decision) };
  });
}

export const grantSchema = z.object({
  program: z.string().min(2).max(300),
  requirements: z.string().max(6000).optional(),
  application: z.string().min(50).max(40_000),
  rubric: z
    .array(z.object({ id: z.string().regex(/^[a-z0-9_]{1,24}$/), label: z.string().max(80), description: z.string().max(400), weight: z.number().min(0).max(10) }))
    .min(2)
    .max(12)
    .optional(),
});

export async function grantFit(req: NextRequest): Promise<NextResponse> {
  const input = await body(req, grantSchema);
  if (input instanceof NextResponse) return input;
  const brain = getPaidBrain();
  if (!brain) return unavailable();
  return run(async () => {
    const { rubric, ...state } = input;
    const { decision, assessment } = await scoreGrant(
      brain,
      { program: state.program, application: state.application, ...(state.requirements ? { requirements: state.requirements } : {}) },
      ...(rubric ? [rubric as RubricCriterion[]] : []),
    );
    return { assessment, decision: publicDecision(decision) };
  });
}

export const contentSchema = z.object({ draft: z.string().min(20).max(20_000), format: z.string().max(40).optional() });

export async function contentGate(req: NextRequest): Promise<NextResponse> {
  const input = await body(req, contentSchema);
  if (input instanceof NextResponse) return input;
  const brain = getPaidBrain();
  if (!brain) return unavailable();
  return run(async () => {
    const { decision, verdict } = await gateDraft(brain, input);
    return { verdict, decision: publicDecision(decision) };
  });
}

// ─── For agents ──────────────────────────────────────────────────────────────

const address = z.string().min(3).max(100);

export const checkSchema = z.object({
  paymentRequired: z.union([z.string().min(2).max(20_000), z.record(z.string(), z.unknown())]),
  url: z.string().url().max(2000).optional(),
  task: z.string().min(3).max(2000).optional(),
  budgetUsd: z.number().nonnegative().max(1_000_000).optional(),
  autoApproveUsd: z.number().nonnegative().max(1_000_000).optional(),
  allowPayTo: z.array(address).max(50).optional(),
});

export async function check(req: NextRequest): Promise<NextResponse> {
  const input = await body(req, checkSchema);
  if (input instanceof NextResponse) return input;
  // The intent check needs a model; the code checks don't.
  const brain = input.task ? getPaidBrain() : null;
  if (input.task && !brain) return unavailable();
  try {
    const { result, decision } = await checkPayment(input, brain);
    return NextResponse.json({ ...result, ...(decision ? { decision: publicDecision(decision) } : {}) });
  } catch (error) {
    if (error instanceof CheckInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof NeedsBrainError) return unavailable();
    const status = error instanceof BrainError ? 503 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status });
  }
}

export const gateSchema = z.object({
  action: z.string().min(3).max(2000),
  request: z.string().min(3).max(4000),
  risk: z.enum(["read", "write", "external", "money", "irreversible"]),
  context: z.string().max(12_000).optional(),
  minConfidence: z.number().min(0).max(0.99).optional(),
});

export async function gateAction(req: NextRequest): Promise<NextResponse> {
  const input = await body(req, gateSchema);
  if (input instanceof NextResponse) return input;
  const brain = getPaidBrain();
  if (!brain) return unavailable();
  return run(async () => {
    const { decision, route } = await decideActionGate(brain, input);
    return { ...route, decision: publicDecision(decision) };
  });
}

const expected = z.object({
  payTo: address.optional(),
  amount: z.string().regex(/^\d+$/).max(80).optional(),
  payer: address.optional(),
});

export const receiptSchema = z.union([
  z.object({ paymentResponse: z.string().min(10).max(10_000), expected: expected.optional() }),
  z.object({
    network: z.string().min(3).max(100),
    transaction: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    expected: expected.optional(),
  }),
]);

/** RPC_URL_<chainId> overrides the public endpoint, e.g. RPC_URL_42220 for Celo. */
function rpcFor(network: string): string | undefined {
  const { chainId } = resolveNetwork(network);
  return chainId === undefined ? undefined : process.env[`RPC_URL_${chainId}`] || undefined;
}

export async function receipt(req: NextRequest): Promise<NextResponse> {
  const input = await body(req, receiptSchema);
  if (input instanceof NextResponse) return input;
  try {
    const query =
      "paymentResponse" in input
        ? (() => {
            const decoded = decodePaymentResponse(input.paymentResponse);
            const exp = { ...(decoded.payer ? { payer: decoded.payer } : {}), ...input.expected };
            return { network: decoded.network, transaction: decoded.transaction, expected: exp };
          })()
        : { network: input.network, transaction: input.transaction, ...(input.expected ? { expected: input.expected } : {}) };
    const rpcUrl = rpcFor(query.network);
    const result = await fetchReceipt(query, rpcUrl ? { rpcUrl } : {});
    const key = process.env.RECEIPT_SIGNING_KEY;
    if (key && /^0x[0-9a-fA-F]{64}$/.test(key)) return NextResponse.json(await signReceipt(result, key as `0x${string}`));
    return NextResponse.json({ receipt: result });
  } catch (error) {
    if (error instanceof ReceiptInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof ReceiptNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    // An RPC outage is not the caller's fault, and nothing settles on a 5xx.
    return NextResponse.json({ error: "Could not read the chain right now. Try again shortly." }, { status: 502 });
  }
}

/** JSON-schema views of the bodies, for the Bazaar discovery extension. */
export const discovery = {
  triage: {
    properties: {
      subject: { type: "string", description: "Ticket subject" },
      message: { type: "string", description: "The customer's message" },
    },
    required: ["message"],
  },
  lead: {
    properties: {
      message: { type: "string", description: "The inbound lead's message" },
      offers: { type: "array", description: "Your offers: [{ slug, name, pitch }]" },
    },
    required: ["message", "offers"],
  },
  grant: {
    properties: {
      program: { type: "string", description: "Program or funder name" },
      requirements: { type: "string", description: "Eligibility and requirements text" },
      application: { type: "string", description: "The application text" },
      rubric: { type: "array", description: "Optional rubric: [{ id, label, description, weight }]" },
    },
    required: ["program", "application"],
  },
  content: {
    properties: { draft: { type: "string", description: "The draft post, thread or article" } },
    required: ["draft"],
  },
  check: {
    properties: {
      paymentRequired: { type: "string", description: "The PAYMENT-REQUIRED header value (base64 JSON), or the decoded JSON" },
      url: { type: "string", description: "The URL your agent called" },
      task: { type: "string", description: "What the user asked for; enables the intent check" },
      budgetUsd: { type: "number", description: "The most your agent may spend on this call" },
      autoApproveUsd: { type: "number", description: "Above this, the verdict is at most confirm (default 0.10)" },
      allowPayTo: { type: "array", description: "Optional payee allowlist" },
    },
    required: ["paymentRequired"],
  },
  gate: {
    properties: {
      action: { type: "string", description: "What the agent is about to do" },
      request: { type: "string", description: "What the user asked for" },
      risk: { type: "string", description: "read | write | external | money | irreversible" },
      context: { type: "string", description: "Relevant conversation or state" },
      minConfidence: { type: "number", description: "Raise the bar for this call" },
    },
    required: ["action", "request", "risk"],
  },
  receipt: {
    properties: {
      network: { type: "string", description: "CAIP-2 network, e.g. eip155:42220" },
      transaction: { type: "string", description: "The settlement transaction hash" },
      paymentResponse: { type: "string", description: "Or: the PAYMENT-RESPONSE header value" },
      expected: { type: "object", description: "Optional: { payTo, amount, payer } to match" },
    },
    required: [],
  },
} as const;
