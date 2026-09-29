import type { Brain } from "../brain";
import type { GateResult } from "../policy";
import { Noul } from "../questions";
import type { AnswersFor } from "../types";

/**
 * Fidelity check for a translation we publish in someone's voice: a dubbed
 * short's narration, beat by beat. Code has already confirmed the numbers,
 * names, quotes and code survived; this decides whether the meaning did,
 * and whether the target puts new words in the speaker's mouth.
 */
export type Translation = {
  /** The text as approved in its original language. */
  readonly source: string;
  /** The translation we want to publish. */
  readonly target: string;
  /** BCP 47 tag of the target language. */
  readonly language: string;
};

export const translationQuestions = {
  faithful: Noul(
    "The target field says what the source field says, in the language named in the language field: the same facts, numbers, names and promises, with nothing left out",
  ),
  adds: Noul(
    "The target field states a fact, number, name, price, endorsement or promise that the source field does not contain",
  ),
};

export type TranslationAnswers = AnswersFor<typeof translationQuestions>;

/** ok: publishable as written. check: a native speaker reads it against the source. cut: translate it again. */
export type TranslationVerdict = "ok" | "check" | "cut";

export interface TranslationRoute {
  readonly verdict: TranslationVerdict;
  readonly reasons: readonly string[];
}

export function routeTranslation(a: TranslationAnswers, gates: readonly GateResult[] = []): TranslationRoute {
  if (a.adds.noul >= 0.5) return { verdict: "cut", reasons: [`says something the source doesn't (${a.adds.noul.toFixed(2)})`] };
  if (a.faithful.noul < 0.5) return { verdict: "cut", reasons: [`doesn't say what the source says (${a.faithful.noul.toFixed(2)})`] };
  const checks = gates.filter((g) => g.verdict !== "execute").map((g) => `${g.action}: ${g.reason}`);
  return checks.length > 0 ? { verdict: "check", reasons: checks } : { verdict: "ok", reasons: [`faithful ${a.faithful.noul.toFixed(2)}`] };
}

/** Publishing a translation is external, so it clears the .85 bar or a native speaker reads it. */
export async function checkTranslation(brain: Brain, t: Translation, opts: { meta?: Readonly<Record<string, unknown>> } = {}) {
  const decision = await brain.decide("translation.check", t, translationQuestions, {
    policies: { faithful: { action: "publish_translation", risk: "external" } },
    ...(opts.meta ? { meta: opts.meta } : {}),
  });
  return { decision, route: routeTranslation(decision.answers, Object.values(decision.gates)) };
}
