import type { Brain } from "../brain";
import { Noul, Score } from "../questions";
import type { AnswersFor, State } from "../types";

/**
 * Publish gate for the content engine. An LLM drafts; this decides whether the
 * draft ships, goes back for revision, or gets a human edit. Publishing is an
 * external action, so the bar is high.
 */
export const contentQuestions = {
  hook: Score({
    instructions: "How strongly the opening line makes a builder want to keep reading",
    criteria: ["Generic or throat-clearing", "Clear but ordinary", "Specific and interesting", "Impossible to scroll past"],
  }),
  specificity: Score({
    instructions: "How concrete the draft is: real numbers, names, code, steps and examples",
    criteria: ["Vague claims only", "Some specifics", "Mostly concrete", "Dense with verifiable specifics"],
  }),
  voice: Score({
    instructions: "How much the draft sounds like a hands-on builder rather than generic AI-written marketing",
    criteria: ["Reads like generic AI filler", "Neutral", "Direct and technical", "Unmistakably a builder's voice"],
  }),
  unsourced_numbers: Noul("The draft states statistics, prices or benchmark numbers without saying where they come from"),
  ready: Noul("The draft is ready to publish as written"),
};

export type ContentAnswers = AnswersFor<typeof contentQuestions>;

export interface ContentVerdict {
  readonly verdict: "publish" | "revise" | "human_edit";
  readonly fixes: readonly string[];
}

export function judgeDraft(a: ContentAnswers): ContentVerdict {
  const fixes: string[] = [];
  if (a.hook.score < 1.5) fixes.push("rewrite the hook: lead with the most surprising specific");
  if (a.specificity.score < 1.5) fixes.push("replace claims with numbers, names, code or steps");
  if (a.voice.score < 1.5) fixes.push("cut filler; write it the way you'd explain it to a builder");
  if (a.unsourced_numbers.noul >= 0.5) fixes.push("add a source for every number, or remove it");
  if (fixes.length === 0 && a.ready.noul >= 0.7) return { verdict: "publish", fixes };
  return { verdict: fixes.length > 2 ? "human_edit" : "revise", fixes };
}

export async function gateDraft(brain: Brain, draft: State) {
  const decision = await brain.decide("content.gate", draft, contentQuestions, {
    policies: { ready: { action: "publish_post", risk: "external" } },
  });
  return { decision, verdict: judgeDraft(decision.answers) };
}
