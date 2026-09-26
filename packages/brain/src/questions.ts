import type { ChoiceQuestion, Diagnostic, NoulQuestion, QuestionSet, ScoreQuestion } from "./types";

export class QuestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionError";
  }
}

const MAX_CHOICE_OPTIONS = 255;
const MIN_SCORE_LEVELS = 2;
const MAX_SCORE_LEVELS = 10;

/** Pick one option from a set. Always include an explicit `other` so nothing-fits is a valid answer. */
export function Choice<const K extends string>(spec: {
  instructions: string;
  criteria: Record<K, string>;
}): ChoiceQuestion<K> {
  const keys = Object.keys(spec.criteria);
  if (!spec.instructions.trim()) throw new QuestionError("Choice needs instructions");
  if (keys.length < 2) throw new QuestionError("Choice needs at least 2 options");
  if (keys.length > MAX_CHOICE_OPTIONS) {
    throw new QuestionError(`Choice supports at most ${MAX_CHOICE_OPTIONS} options (got ${keys.length})`);
  }
  return { type: "choice", instructions: spec.instructions, criteria: spec.criteria };
}

/** Place something on an ordered scale you define, lowest level first. */
export function Score(spec: { instructions: string; criteria: readonly string[] }): ScoreQuestion {
  if (!spec.instructions.trim()) throw new QuestionError("Score needs instructions");
  const n = spec.criteria.length;
  if (n < MIN_SCORE_LEVELS || n > MAX_SCORE_LEVELS) {
    throw new QuestionError(`Score needs ${MIN_SCORE_LEVELS}–${MAX_SCORE_LEVELS} levels (got ${n})`);
  }
  return { type: "score", instructions: spec.instructions, criteria: [...spec.criteria] };
}

/** A yes/no question answered as a probability of yes. */
export function Noul(spec: { instructions: string } | string): NoulQuestion {
  const instructions = typeof spec === "string" ? spec : spec.instructions;
  if (!instructions.trim()) throw new QuestionError("Noul needs instructions");
  return { type: "noul", instructions };
}

const OTHER_KEYS = new Set(["other", "none", "unknown", "unclear", "none_of_the_above", "no_match"]);
const NEGATION = /\b(not|never|no|none|except|unless|without|isn't|doesn't|don't|won't|can't)\b/i;
const COUNTING = /\b(how many|count|number of|total of|sum of|at least \d+|more than \d+|fewer than \d+)\b/i;
const DATE_ORDER = /\b(before|after|earlier|later|older|newer|within \d+ (days?|weeks?|months?)|since|until)\b/i;

/**
 * Static checks that encode the known failure modes of System One models:
 * literal reading, no arithmetic, dates as text, and field names carrying no meaning.
 */
export function lintQuestions(questions: QuestionSet): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const [name, q] of Object.entries(questions)) {
    const text = q.type === "choice" ? `${q.instructions} ${Object.values(q.criteria).join(" ")}` : q.instructions;

    if (q.instructions.trim().split(/\s+/).length < 3) {
      out.push({
        level: "warn",
        code: "thin-instructions",
        question: name,
        message: `"${name}": instructions are very short. The model never sees the field name; put the whole requirement in the instructions.`,
      });
    }
    if (NEGATION.test(q.instructions)) {
      out.push({
        level: "info",
        code: "negation",
        question: name,
        message: `"${name}": contains a negation. System One models read literally; state the condition positively where you can.`,
      });
    }
    if (COUNTING.test(text)) {
      out.push({
        level: "warn",
        code: "counting",
        question: name,
        message: `"${name}": looks like counting. Count in code and ask one Noul per item instead.`,
      });
    }
    if (DATE_ORDER.test(text) && /\d{4}|\bdate|\bday|\bmonth|\byear/i.test(text)) {
      out.push({
        level: "warn",
        code: "date-order",
        question: name,
        message: `"${name}": compares dates. Dates are text to the model; order and diff them in code.`,
      });
    }
    if (q.type === "choice") {
      const keys = Object.keys(q.criteria);
      if (!keys.some((k) => OTHER_KEYS.has(k.toLowerCase()))) {
        out.push({
          level: "warn",
          code: "no-other",
          question: name,
          message: `"${name}": no explicit "other" option. Without it the model must pick the closest wrong answer.`,
        });
      }
      const descriptions = Object.values(q.criteria).map((d) => d.trim().toLowerCase());
      if (new Set(descriptions).size !== descriptions.length) {
        out.push({
          level: "warn",
          code: "duplicate-criteria",
          question: name,
          message: `"${name}": two options share a description, so they cannot be told apart.`,
        });
      }
    }
  }
  return out;
}
