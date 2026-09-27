import { buildHarness, generatePlan, gtmInputSchema, reviewOutreach, templatePlan, type GeneratedPlan } from "@repo/gtm-harness";
import { NextResponse } from "next/server";
import { getPublicBrain } from "@/lib/brain";
import { notify } from "@/lib/notify";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * One GTM Harness run: the LLM writes the plan (templates when no model is
 * configured or it fails), the brain reviews every draft, code packs the
 * folder. Free: builders in programs the founder supports get free tools only.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`gtm:${clientKey(req)}`, 6, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "That's six runs this hour. Try again in a bit." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterS) } },
    );
  }

  const parsed = gtmInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form.", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  }
  const input = parsed.data;

  let generated: GeneratedPlan;
  let note: string | undefined;
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
    try {
      const effort = process.env.GTM_EFFORT === "medium" || process.env.GTM_EFFORT === "high" ? process.env.GTM_EFFORT : "low";
      generated = await generatePlan(input, { effort, signal: AbortSignal.timeout(90_000) });
    } catch (error) {
      console.error("[gtm] plan failed, using templates:", error instanceof Error ? error.message : error);
      generated = templatePlan(input);
      note = "The model was unavailable, so this plan uses our templates. Run it again for one written for your product.";
    }
  } else {
    generated = templatePlan(input);
    note = "This plan uses our templates. With a model key on this deployment, it's written for your product.";
  }

  const brain = getPublicBrain();
  const reviews = await Promise.all(generated.plan.drafts.map((d) => reviewOutreach(brain, d).catch(() => null)));
  const files = buildHarness(input, generated.plan, reviews);

  await notify({
    title: "GTM Harness run (free tool)",
    lines: [
      ["Product", input.product],
      ["Stage", input.stage],
      ["For", input.audience],
      ["Goal", input.goal],
      ["Onchain", input.onchain ? "yes" : "no"],
      ["Email", input.email || "not given"],
    ],
    body: `${input.pitch}\n\nFree tool: no paid follow-up for builders in programs you support (conflicts rule 2).`,
    payload: { type: "gtm.run", product: input.product, stage: input.stage, onchain: Boolean(input.onchain), email: input.email || null, generatedBy: generated.generatedBy.kind },
  }).catch(() => undefined);

  return NextResponse.json({ plan: generated.plan, generatedBy: generated.generatedBy, reviews, files, ...(note ? { note } : {}) });
}
