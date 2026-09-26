import type { Brain } from "../brain";
import { Choice, Noul, Score } from "../questions";
import type { AnswersFor, State } from "../types";

/** Places an applicant to the AI Study Group into a track, a level and a pod. */
export const studyQuestions = {
  track: Choice({
    instructions: "Which learning track fits what this person wants to learn or build",
    criteria: {
      t1: "Agentic AI engineering: building agents with LLMs, tools, MCP, memory and evals",
      t2: "Ethical and responsible AI in Africa: bias, data protection, African languages, policy and safety",
      t3: "Inference engineering: serving models fast and cheap, GPUs, KV cache, quantisation, latency",
      t4: "Onchain agents on Celo: stablecoins, wallets, MiniPay, x402 payments, agents that move money",
      unsure: "The person has not said enough to choose a track",
    },
  }),
  level: Score({
    instructions: "The person's current technical level",
    criteria: [
      "New to programming",
      "Can read and edit code, has built small projects",
      "Ships software professionally",
      "Experienced ML, infrastructure or protocol engineer",
    ],
  }),
  hours: Score({
    instructions: "Hours per week the person says they can commit",
    criteria: ["Under 2 hours a week", "2 to 5 hours a week", "5 to 10 hours a week", "More than 10 hours a week"],
  }),
  goal: Choice({
    instructions: "The person's main reason for joining",
    criteria: {
      job: "Get hired as an AI or agent engineer",
      freelance: "Earn from AI freelance or client work",
      startup: "Build their own AI product or startup",
      upskill_team: "Train themselves or their team for their current employer",
      research: "Do AI research",
      other: "Curiosity or anything else",
    },
  }),
  wants_live: Noul("The person wants live sessions, a cohort or a study partner rather than learning fully alone"),
};

export type StudyAnswers = AnswersFor<typeof studyQuestions>;

export interface Placement {
  readonly track: string;
  readonly band: "foundations" | "builder" | "advanced";
  readonly format: "self_paced" | "pod" | "cohort";
  readonly pod: string;
  readonly needsHuman: boolean;
  readonly notes: readonly string[];
}

/** Code assigns the pod; the model only answered typed questions. */
export function placeLearner(a: StudyAnswers, opts: { timezone?: string } = {}): Placement {
  const band = a.level.score < 0.8 ? "foundations" : a.level.score < 2.2 ? "builder" : "advanced";
  const format = a.wants_live.noul >= 0.5 ? (a.hours.score >= 1.5 ? "cohort" : "pod") : "self_paced";
  const tz = (opts.timezone ?? "Africa/Lagos").split("/")[0]?.toLowerCase() ?? "africa";
  const needsHuman = a.track.choice === "unsure" || a.track.confidence < 0.5;
  const notes: string[] = [];
  if (needsHuman) notes.push("track unclear: ask one follow-up question");
  if (a.hours.score < 0.5) notes.push("under 2h/week: start self-paced, invite to the next cohort later");
  if (a.goal.choice === "upskill_team") notes.push("possible team/enterprise training lead");
  return {
    track: a.track.choice,
    band,
    format,
    pod: `${a.track.choice}-${band}-${tz}`,
    needsHuman,
    notes,
  };
}

export async function placeApplicant(brain: Brain, application: State, opts: { timezone?: string } = {}) {
  const decision = await brain.decide("study.place", application, studyQuestions);
  return { decision, placement: placeLearner(decision.answers, opts) };
}
