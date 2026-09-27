import { BrainError } from "@repo/brain";
import { decideLead } from "@repo/brain/recipes";
import { offerBySlug } from "@repo/catalog";
import { z } from "zod";
import { getPublicBrain, leadOffers } from "@/lib/brain";
import { notify } from "@/lib/notify";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const Body = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    phone: z.string().trim().max(60).optional().or(z.literal("")),
    company: z.string().trim().max(160).optional().or(z.literal("")),
    website: z.string().trim().max(300).optional().or(z.literal("")),
    offer: z.string().trim().max(80).optional().or(z.literal("")),
    budget: z.string().trim().max(80).optional().or(z.literal("")),
    timeline: z.string().trim().max(80).optional().or(z.literal("")),
    message: z.string().trim().min(10).max(4000),
    // Honeypot: people never see this field, bots fill it.
    company_url: z.string().max(0).optional().or(z.literal("")),
  })
  .refine((b) => Boolean(b.email || b.phone), { message: "Leave an email or a WhatsApp/Telegram number", path: ["email"] });

export async function POST(req: Request) {
  const limit = rateLimit(`intake:${clientKey(req)}`, 6, 10 * 60_000);
  if (!limit.ok) return Response.json({ error: "Too many submissions. Try again shortly." }, { status: 429 });

  const json = await req.json().catch(() => null);
  if (json && typeof json === "object" && "company_url" in json && (json as { company_url?: string }).company_url) {
    return Response.json({ ok: true, route: null }); // bot: accept silently
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const lead = parsed.data;
  const chosen = lead.offer ? offerBySlug(lead.offer) : undefined;

  let route: Awaited<ReturnType<typeof decideLead>>["route"] | null = null;
  let decision: Awaited<ReturnType<typeof decideLead>>["decision"] | null = null;
  try {
    ({ route, decision } = await decideLead(
      getPublicBrain(),
      {
        message: lead.message,
        ...(chosen ? { offer_they_picked: `${chosen.name}: ${chosen.oneLiner}` } : {}),
        ...(lead.company ? { company: lead.company } : {}),
        ...(lead.budget ? { budget: lead.budget } : {}),
        ...(lead.timeline ? { timeline: lead.timeline } : {}),
      },
      leadOffers,
    ));
  } catch (error) {
    // The brain being down must never lose a lead.
    if (!(error instanceof BrainError)) console.error(error);
  }

  const routedOffer = route && route.offer !== "other" ? offerBySlug(route.offer) : undefined;
  await notify({
    title: `New lead · ${route?.priority ?? "P?"} · ${routedOffer?.name ?? chosen?.name ?? "unrouted"}`,
    lines: [
      ["From", `${lead.name}${lead.company ? ` (${lead.company})` : ""}`],
      ["Contact", [lead.email, lead.phone].filter(Boolean).join(" · ")],
      ["Picked", chosen?.name ?? "—"],
      ["Brain", route ? `${route.offer} @ ${route.offerConfidence.toFixed(2)} → ${route.next}` : "unavailable"],
      ["Budget / timeline", `${lead.budget || "—"} / ${lead.timeline || "—"}`],
      ...(decision ? ([["Decided by", `${decision.provider}/${decision.model} in ${decision.latencyMs}ms`]] as [string, string][]) : []),
    ],
    body: lead.message,
    payload: { lead: { ...lead, company_url: undefined }, route, decisionId: decision?.id, at: new Date().toISOString() },
  });

  return Response.json({
    ok: true,
    route: route
      ? {
          ...route,
          offerName: routedOffer?.name ?? null,
          firstJobFree: Boolean(routedOffer?.firstJobFree),
        }
      : null,
    decidedBy: decision ? { provider: decision.provider, model: decision.model, latencyMs: decision.latencyMs } : null,
  });
}
