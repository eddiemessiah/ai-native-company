import type { Brain } from "../brain";
import type { GateResult } from "../policy";
import { Choice, Noul, Score } from "../questions";
import type { AnswersFor } from "../types";

/**
 * Highlight scoring for the Video Desk. Code cuts a long recording into
 * candidate moments on sentence boundaries; this decides which ones are
 * clips. One call per candidate, every question in the same pass.
 *
 * Code owns everything exact: durations, overlaps, how many clips to keep.
 * A person approves every clip before anything is published.
 */
export type ClipMoment = {
  /** What the recording is, e.g. "CeloIQ Sessions, episode 12: agent payments on Celo". */
  readonly recording: string;
  /** The sentence spoken just before the moment, so the model can tell whether the moment leans on it. */
  readonly previous: string;
  /** The words of the candidate clip, in order. */
  readonly moment: string;
};

export const clipQuestions = {
  hook: Score({
    instructions:
      "How strongly the first sentence of the moment field makes someone scrolling X, TikTok or Instagram Reels stop and keep watching",
    criteria: [
      "A greeting, housekeeping, filler, or a sentence that only makes sense after the previous field",
      "A clear but ordinary opening",
      "A specific claim, figure, question or story opening that creates curiosity",
      "A bold, surprising or quotable opening line that is hard to scroll past",
    ],
  }),
  payoff: Score({
    instructions: "How well the moment field ends: on a complete answer, result, punchline or lesson",
    criteria: [
      "Stops mid-thought or trails off into the next topic",
      "Ends on a partial point",
      "Ends on a clear, complete point",
      "Ends on a strong line people would quote or share",
    ],
  }),
  standalone: Noul(
    "A viewer who only sees the moment field, with none of the recording around it, understands what is being said and why it matters",
  ),
  kind: Choice({
    instructions: "What kind of moment the moment field is",
    criteria: {
      insight: "A lesson, opinion, explanation or framework",
      story: "A personal story or anecdote with a beginning and an end",
      how_to: "Step-by-step instructions, a walkthrough or a live demo of how to do something",
      news: "An announcement, launch, partnership, grant or opportunity",
      humor: "A joke, banter or a funny reaction",
      other: "Greetings, housekeeping, sponsor reads, audio or technical problems, or anything else",
    },
  }),
  sensitive: Noul(
    "The moment field makes a claim about money, investment returns, token prices, health or the law that a person should check before it is published",
  ),
  private_info: Noul(
    "The moment field says private information out loud: a phone number, home address, password, seed phrase, private key or bank account number",
  ),
};

export type ClipAnswers = AnswersFor<typeof clipQuestions>;

/** keep: proposed as a clip. review: proposed, with something a person must check first. drop: not a clip. */
export type ClipVerdict = "keep" | "review" | "drop";

export interface ClipRoute {
  readonly verdict: ClipVerdict;
  /** 0–100, computed in code from the typed answers. Only compare ranks from the same provider and model. */
  readonly rank: number;
  readonly kind: string;
  readonly reasons: readonly string[];
}

/** Below this rank a moment is not worth a person's review time. */
export const DEFAULT_MIN_CLIP_RANK = 50;

/**
 * Deterministic routing on top of the typed answers. The rank weights the
 * opening most: on a feed, a clip that loses the first two seconds never gets
 * to its payoff.
 */
export function routeClip(
  a: ClipAnswers,
  opts: { minRank?: number; gates?: readonly GateResult[] } = {},
): ClipRoute {
  const minRank = opts.minRank ?? DEFAULT_MIN_CLIP_RANK;
  const rank = Math.round(100 * (0.5 * (a.hook.score / 3) + 0.3 * (a.payoff.score / 3) + 0.2 * a.standalone.noul));
  const base = { rank, kind: a.kind.choice };
  const drop = (reason: string): ClipRoute => ({ ...base, verdict: "drop", reasons: [reason] });

  if (a.kind.choice === "other" && a.kind.confidence >= 0.5) return drop("housekeeping, greeting or off-topic");
  if (a.standalone.noul < 0.5) return drop(`needs the rest of the recording (stands alone ${a.standalone.noul.toFixed(2)})`);
  if (rank < minRank) return drop(`rank ${rank} is below ${minRank}`);

  const reasons = [
    `hook ${a.hook.score.toFixed(2)}/3`,
    `payoff ${a.payoff.score.toFixed(2)}/3`,
    `stands alone ${a.standalone.noul.toFixed(2)}`,
  ];
  const checks: string[] = [];
  if (a.private_info.noul >= 0.5) {
    checks.push(`private information said aloud (${a.private_info.noul.toFixed(2)}): cut or bleep it before this ships`);
  }
  if (a.sensitive.noul >= 0.5) {
    checks.push(`money, health or legal claim (${a.sensitive.noul.toFixed(2)}): check it before this ships`);
  }
  for (const g of opts.gates ?? []) {
    if (g.verdict !== "execute") checks.push(`${g.action}: ${g.reason}`);
  }
  if (checks.length > 0) return { ...base, verdict: "review", reasons: [...checks, ...reasons] };
  return { ...base, verdict: "keep", reasons };
}

/**
 * Proposing a clip is an internal, reversible write: it lands in a review
 * sheet, never on a feed. Publishing stays with a person.
 */
export async function decideClip(
  brain: Brain,
  moment: ClipMoment,
  opts: { minRank?: number; meta?: Readonly<Record<string, unknown>> } = {},
) {
  const decision = await brain.decide("clip.score", moment, clipQuestions, {
    policies: {
      hook: { action: "rank_clip", risk: "write" },
      standalone: { action: "propose_clip", risk: "write" },
    },
    ...(opts.meta ? { meta: opts.meta } : {}),
  });
  const route = routeClip(decision.answers, {
    ...(opts.minRank === undefined ? {} : { minRank: opts.minRank }),
    gates: Object.values(decision.gates),
  });
  return { decision, route };
}
