import { BrainError } from "@repo/brain";
import { decideLead, gateDraft, scoreGrant, triageTicket, type RubricCriterion } from "@repo/brain/recipes";
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
} as const;
