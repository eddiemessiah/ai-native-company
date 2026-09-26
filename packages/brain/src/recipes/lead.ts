import type { Brain } from "../brain";
import { Choice, Noul, Score } from "../questions";
import type { AnswersFor, State } from "../types";

export interface OfferRef {
  readonly slug: string;
  readonly name: string;
  /** Natural-language description in the buyer's own words. It is part of the instruction. */
  readonly pitch: string;
}

export function leadQuestions(offers: readonly OfferRef[]) {
  const criteria: Record<string, string> = {};
  for (const o of offers) criteria[o.slug] = `${o.name}: ${o.pitch}`;
  criteria.other = "None of these services fits what the person is asking for";
  return {
    offer: Choice({ instructions: "Which of our services best fits what this person is asking us to do", criteria }),
    urgency: Score({
      instructions: "How soon the person needs the work done",
      criteria: [
        "No timeline given, just exploring or asking questions",
        "Wants to start within the next few weeks",
        "Needs it this week, has a hard deadline, or says it is urgent",
      ],
    }),
    budget: Score({
      instructions: "The budget or size of organization the message suggests",
      criteria: [
        "An individual, a student, or no sign of budget",
        "A small business, creator or early startup",
        "A funded startup, NGO, foundation, bank, telco, government body or enterprise",
      ],
    }),
    decision_maker: Noul("The person writing owns the business or is the one who approves the spend"),
    spam: Noul("The message is spam, a sales pitch aimed at us, or has nothing to do with hiring us"),
  };
}

export type LeadAnswers = AnswersFor<ReturnType<typeof leadQuestions>>;

export type LeadNext = "book_call" | "send_intake" | "nurture" | "human_review" | "discard";

export interface LeadRoute {
  readonly offer: string;
  readonly offerConfidence: number;
  readonly priority: "P0" | "P1" | "P2" | "P3";
  readonly next: LeadNext;
  readonly reasons: readonly string[];
}

/** Deterministic routing on top of the typed answers. Code decides what happens next. */
export function routeLead(a: LeadAnswers): LeadRoute {
  const reasons: string[] = [];
  const base = { offer: a.offer.choice, offerConfidence: Math.round(a.offer.confidence * 1000) / 1000 };

  if (a.spam.noul >= 0.8) {
    return { ...base, priority: "P3", next: "discard", reasons: [`spam probability ${a.spam.noul.toFixed(2)}`] };
  }
  if (a.offer.choice === "other" || a.offer.confidence < 0.5) {
    reasons.push(
      a.offer.choice === "other" ? "no listed offer fits" : `unsure which offer fits (${a.offer.confidence.toFixed(2)})`,
    );
    return { ...base, priority: "P2", next: "human_review", reasons };
  }

  const dm = a.decision_maker.noul >= 0.6 ? 1 : 0;
  const points = a.urgency.score + a.budget.score + dm;
  reasons.push(
    `urgency ${a.urgency.score.toFixed(2)}/2`,
    `budget ${a.budget.score.toFixed(2)}/2`,
    dm ? "writer approves the spend" : "writer may not approve the spend",
  );

  if (points >= 4) return { ...base, priority: "P0", next: "book_call", reasons };
  if (points >= 3) return { ...base, priority: "P1", next: "book_call", reasons };
  if (points >= 1.5) return { ...base, priority: "P2", next: "send_intake", reasons };
  return { ...base, priority: "P3", next: "nurture", reasons };
}

export async function decideLead(brain: Brain, state: State, offers: readonly OfferRef[]) {
  const decision = await brain.decide("lead.route", state, leadQuestions(offers), {
    policies: { offer: { action: "auto_reply_with_offer", risk: "external" } },
  });
  return { decision, route: routeLead(decision.answers) };
}
