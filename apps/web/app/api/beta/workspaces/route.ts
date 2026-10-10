import { createWorkspace } from "@repo/gtm-cloud";
import { buildHarness, generatePlan, gtmInputSchema, reviewOutreach, routeModel, templatePlan, type GeneratedPlan } from "@repo/gtm-harness";
import { NextResponse } from "next/server";
import { beta, betaCtx, BetaError, readJson, requireUser } from "@/lib/beta";
import { getPublicBrain } from "@/lib/brain";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Plans the whole beta can generate in a day, across everyone: the model bill has a ceiling. */
const PLANS_PER_DAY = 40;

/**
 * A new workspace: the LLM writes the plan (templates when no model is configured or it fails),
 * the brain reviews each draft, code packs the harness files, and the drafts land on the Desk.
 */
export async function POST(req: Request) {
  return beta(async () => {
    const user = await requireUser();
    if (user.workspaceIds.length >= 3) throw new BetaError("The beta allows three workspaces per person.");
    const parsed = gtmInputSchema.safeParse(await readJson(req));
    if (!parsed.success) {
      return NextResponse.json({ error: "Check the form.", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
    }
    const limit = rateLimit(`beta-ws:${user.id}`, 5, 60 * 60_000);
    if (!limit.ok) {
      return NextResponse.json({ error: "That's five plans this hour. Try again in a bit." }, { status: 429, headers: { "retry-after": String(limit.retryAfterS) } });
    }
    const c = betaCtx();
    const today = new Date().toISOString().slice(0, 10);
    if ((await c.store.incr(`cap:plans:${today}`, 172_800)) > PLANS_PER_DAY) {
      throw new BetaError("The beta has written today's plans. Come back tomorrow.", 429);
    }
    const input = parsed.data;

    let generated: GeneratedPlan;
    let note: string | undefined;
    const route = routeModel(process.env);
    if (route) {
      try {
        const effort = process.env.GTM_EFFORT === "medium" || process.env.GTM_EFFORT === "high" ? process.env.GTM_EFFORT : "low";
        generated = await generatePlan(input, { route, effort, signal: AbortSignal.timeout(90_000) });
      } catch (error) {
        console.error("[beta] plan failed, using templates:", error instanceof Error ? error.message : error);
        generated = templatePlan(input);
        note = "The model was unavailable, so this plan uses our templates.";
      }
    } else {
      generated = templatePlan(input);
      note = "This plan uses our templates. With a model key on this deployment, it's written for your product.";
    }

    const brain = getPublicBrain();
    const reviews = await Promise.all(generated.plan.drafts.map((d) => reviewOutreach(brain, d).catch(() => null)));
    const files = buildHarness(input, generated.plan, reviews);
    const generatedBy = generated.generatedBy.kind === "model" ? (generated.generatedBy.model ?? "a model") : "template";
    const { workspace } = await createWorkspace(c, user, input, { plan: generated.plan, generatedBy, files, reviews });

    await notify({
      title: "Shonin GTM beta: new workspace",
      lines: [
        ["Who", user.name],
        ["Email", user.email ?? "not given"],
        ["Product", input.product],
        ["Goal", input.goal],
        ["Plan by", generatedBy],
      ],
      body: input.pitch,
      payload: { type: "beta.workspace", workspaceId: workspace.id, product: input.product, generatedBy },
    }).catch(() => undefined);

    return NextResponse.json({ workspaceId: workspace.id, ...(note ? { note } : {}) });
  }, req);
}
