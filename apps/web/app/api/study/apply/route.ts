import { BrainError } from "@repo/brain";
import { placeApplicant } from "@repo/brain/recipes";
import { z } from "zod";
import { getPublicBrain } from "@/lib/brain";
import { notify } from "@/lib/notify";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(3).max(200),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  timezone: z.string().trim().max(64).optional().or(z.literal("")),
  background: z.string().trim().min(10).max(3000),
  goal: z.string().trim().min(5).max(2000),
  hours: z.string().trim().max(40).optional().or(z.literal("")),
  live: z.string().optional(),
  company_url: z.string().max(0).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const limit = rateLimit(`study:${clientKey(req)}`, 6, 10 * 60_000);
  if (!limit.ok) return Response.json({ error: "Too many submissions. Try again shortly." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  const a = parsed.data;
  if (a.company_url) return Response.json({ ok: true, placement: null });

  let placement: Awaited<ReturnType<typeof placeApplicant>>["placement"] | null = null;
  let provider: string | null = null;
  try {
    const result = await placeApplicant(
      getPublicBrain(),
      {
        background: a.background,
        goal: a.goal,
        ...(a.hours ? { hours_per_week: a.hours } : {}),
        wants_live_sessions: a.live === "on" ? "yes, I want live sessions or a study pod" : "not specified",
      },
      { timezone: a.timezone || "Africa/Lagos" },
    );
    placement = result.placement;
    provider = `${result.decision.provider}/${result.decision.model}`;
  } catch (error) {
    if (!(error instanceof BrainError)) console.error(error);
  }

  await notify({
    title: `Study group application · ${placement?.track.toUpperCase() ?? "unplaced"} · ${placement?.format ?? "?"}`,
    lines: [
      ["Name", a.name],
      ["Contact", a.contact],
      ["City / TZ", `${a.city || "—"} / ${a.timezone || "—"}`],
      ["Placement", placement ? `${placement.pod} (${placement.band}, ${placement.format})` : "needs a person"],
      ...(placement?.notes.length ? ([["Notes", placement.notes.join("; ")]] as [string, string][]) : []),
      ...(provider ? ([["Decided by", provider]] as [string, string][]) : []),
    ],
    body: `Background: ${a.background}\n\nGoal: ${a.goal}`,
    payload: { application: { ...a, company_url: undefined }, placement, at: new Date().toISOString() },
  });

  return Response.json({ ok: true, placement });
}
