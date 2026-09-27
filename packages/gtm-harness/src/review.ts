import type { Brain } from "@repo/brain";
import { Noul, Score } from "@repo/brain";

/**
 * The reviewer. The preparer (an LLM) writes outreach; this decides whether a
 * draft is ready for the founder to send, needs a revision, or is blocked.
 * It can block but never ship: the harness sends nothing. The founder does.
 */
export const outreachQuestions = {
  personal: Score({
    instructions: "How specific the message is to one recipient or one narrow group, rather than a message anyone could receive",
    criteria: ["Could be sent to anyone", "Names the segment", "Has a real personalization slot", "Clearly written for one person"],
  }),
  clear_ask: Noul("The message ends with one clear, low-effort ask, such as a reply, a short call or a demo"),
  unsourced_claims: Noul("The message states numbers, results, customers or partners without saying where they come from"),
  pushy: Noul("The message uses hype, fake urgency, pressure or reads like mass spam"),
  ready: Noul("The message is ready for the founder to send as written, after filling the personalization slots"),
};

export type OutreachVerdict = "ready" | "revise" | "blocked";

export interface OutreachReview {
  readonly verdict: OutreachVerdict;
  readonly fixes: readonly string[];
  readonly provider: string;
  readonly calibrated: boolean;
}

type Answers = {
  personal: { score: number };
  clear_ask: { noul: number };
  unsourced_claims: { noul: number };
  pushy: { noul: number };
  ready: { noul: number };
};

export function judgeOutreach(a: Answers, opts: { calibrated: boolean }): Omit<OutreachReview, "provider" | "calibrated"> {
  const fixes: string[] = [];
  if (a.unsourced_claims.noul >= 0.5) fixes.push("remove or source every number, result and customer name");
  if (a.pushy.noul >= 0.5) fixes.push("cut the hype and the urgency; ask plainly");
  if (a.clear_ask.noul < 0.5) fixes.push("end with one small ask: a reply, a 10-minute call or a demo");
  if (a.personal.score < 1.5) fixes.push("add a line only this person could receive");
  // Claims and pressure damage trust with the people you most want to reach: block, don't just revise.
  if (a.unsourced_claims.noul >= 0.8 || a.pushy.noul >= 0.8) return { verdict: "blocked", fixes };
  const bar = opts.calibrated ? 0.7 : 0.8;
  if (fixes.length === 0 && a.ready.noul >= bar) return { verdict: "ready", fixes };
  return { verdict: "revise", fixes: fixes.length ? fixes : ["tighten it until you'd send it to someone you respect"] };
}

export async function reviewOutreach(brain: Brain, draft: { channel: string; audience: string; text: string }): Promise<OutreachReview> {
  const decision = await brain.decide("gtm.outreach_review", { channel: draft.channel, audience: draft.audience, message: draft.text }, outreachQuestions);
  const answers = decision.answers as unknown as Answers;
  return { ...judgeOutreach(answers, { calibrated: decision.calibrated }), provider: decision.provider, calibrated: decision.calibrated };
}
