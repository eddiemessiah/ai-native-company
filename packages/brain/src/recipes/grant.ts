import type { Brain } from "../brain";
import { toPercent } from "../math";
import { Noul, Score } from "../questions";
import type { Answer, Question, ScoreAnswer } from "../types";

export interface RubricCriterion {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly weight: number;
}

/** A common rubric shape for ecosystem grants and RFPs. Replace with the program's own rubric when it publishes one. */
export const DEFAULT_GRANT_RUBRIC: readonly RubricCriterion[] = [
  { id: "problem", label: "Problem", description: "A specific, real problem for named users, with evidence it matters.", weight: 2 },
  { id: "solution", label: "Solution", description: "A concrete solution that clearly addresses that problem.", weight: 2 },
  { id: "ecosystem", label: "Ecosystem fit", description: "Clear benefit to the funder's ecosystem, users or public goods.", weight: 2 },
  { id: "traction", label: "Traction", description: "Shipped work, users, transactions or other verifiable proof.", weight: 2 },
  { id: "team", label: "Team", description: "The team has shown it can build and deliver this.", weight: 1 },
  { id: "milestones", label: "Milestones", description: "Measurable milestones with dates and deliverables.", weight: 2 },
  { id: "budget", label: "Budget", description: "A budget that is itemized and proportionate to the milestones.", weight: 1 },
];

const LEVELS = [
  "Not addressed at all",
  "Mentioned but vague or unsupported",
  "Addressed with some specifics or evidence",
  "Strong, specific and backed by evidence or links",
];

export function grantQuestions(rubric: readonly RubricCriterion[] = DEFAULT_GRANT_RUBRIC) {
  const questions: Record<string, Question> = {};
  for (const c of rubric) {
    questions[`c_${c.id}`] = Score({
      instructions: `How well the application covers "${c.label}": ${c.description}`,
      criteria: LEVELS,
    });
  }
  questions.eligible = Noul("The applicant appears to meet the program's stated eligibility requirements");
  questions.unsupported_claims = Noul(
    "The application states numbers, users or traction without links, data or other evidence",
  );
  questions.ready = Noul("The application is complete and specific enough to submit today");
  return questions;
}

export interface GrantAssessment {
  /** Weighted 0–100. */
  readonly score: number;
  readonly criteria: readonly { id: string; label: string; percent: number; confidence: number }[];
  /** Weakest criteria first: what to fix before submitting. */
  readonly fixFirst: readonly string[];
  readonly eligible: number;
  readonly unsupportedClaims: number;
  readonly ready: number;
  readonly verdict: "submit" | "revise" | "not_eligible";
}

export function assessGrant(
  answers: Readonly<Record<string, Answer>>,
  rubric: readonly RubricCriterion[] = DEFAULT_GRANT_RUBRIC,
): GrantAssessment {
  const criteria = rubric.map((c) => {
    const a = answers[`c_${c.id}`] as ScoreAnswer;
    return { id: c.id, label: c.label, weight: c.weight, percent: toPercent(a.score, LEVELS.length), confidence: a.confidence };
  });
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const score = Math.round(criteria.reduce((s, c) => s + c.percent * c.weight, 0) / totalWeight);
  const noul = (name: string) => (answers[name]?.type === "noul" ? (answers[name] as { noul: number }).noul : 0);
  const eligible = noul("eligible");
  const ready = noul("ready");
  const unsupportedClaims = noul("unsupported_claims");
  const verdict = eligible < 0.4 ? "not_eligible" : score >= 70 && ready >= 0.6 && unsupportedClaims < 0.5 ? "submit" : "revise";
  return {
    score,
    criteria: criteria.map(({ weight: _w, ...rest }) => rest),
    fixFirst: [...criteria].sort((x, y) => x.percent - y.percent).slice(0, 3).map((c) => c.label),
    eligible,
    unsupportedClaims,
    ready,
    verdict,
  };
}

export async function scoreGrant(
  brain: Brain,
  input: { program: string; requirements?: string; application: string },
  rubric: readonly RubricCriterion[] = DEFAULT_GRANT_RUBRIC,
) {
  const decision = await brain.decide("grant.fit", input, grantQuestions(rubric));
  return { decision, assessment: assessGrant(decision.answers as Readonly<Record<string, Answer>>, rubric) };
}
