import { BrainError } from "@repo/brain";
import { decideLead } from "@repo/brain/recipes";
import { z } from "zod";
import { getPublicBrain, leadOffers, publicDecision } from "@/lib/brain";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const Body = z.object({ message: z.string().trim().min(8).max(1200) });

export async function POST(req: Request) {
  const limit = rateLimit(`demo:${clientKey(req)}`, 12, 60_000);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterS) } },
    );
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Write at least a sentence about what you need." }, { status: 400 });

  try {
    const { decision, route } = await decideLead(getPublicBrain(), { message: parsed.data.message }, leadOffers);
    return Response.json({ route, decision: publicDecision(decision) });
  } catch (error) {
    const message = error instanceof BrainError ? "The decision brain is unavailable right now." : "Something went wrong.";
    return Response.json({ error: message }, { status: 503 });
  }
}
