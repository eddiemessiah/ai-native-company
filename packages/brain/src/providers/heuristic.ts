import { argmax, clamp01, expectedLevel, softmax } from "../math";
import type {
  Answer,
  AnswersFor,
  ChoiceQuestion,
  DecisionProvider,
  NoulQuestion,
  ProviderRequest,
  ProviderResult,
  QuestionSet,
  ScoreQuestion,
  State,
} from "../types";

/**
 * Deterministic lexical stand-in for a System One model.
 *
 * For development, tests, and demos when no model key is configured. It
 * matches words between the state and each option's description, so option
 * descriptions written in the customer's vocabulary route well. It is NOT
 * calibrated and should never be the only provider behind a consequential
 * action; the policy gate treats it accordingly.
 */
export class HeuristicProvider implements DecisionProvider {
  readonly name = "heuristic";
  readonly calibrated = false;

  async decide<Qs extends QuestionSet>(req: ProviderRequest<Qs>): Promise<ProviderResult<Qs>> {
    const text = flatten(req.state);
    const tokens = new Set(tokenize(text));
    const answers: Record<string, Answer> = {};
    for (const [name, q] of Object.entries(req.questions)) {
      if (q.type === "choice") answers[name] = choose(q, tokens);
      else if (q.type === "score") answers[name] = score(q, tokens, text);
      else answers[name] = noul(q, tokens);
    }
    return { answers: answers as AnswersFor<Qs>, model: "heuristic-lexical-1" };
  }
}

const OTHER_KEYS = new Set(["other", "none", "unknown", "unclear", "none_of_the_above", "no_match"]);

function choose(q: ChoiceQuestion<string>, tokens: ReadonlySet<string>): Answer {
  const keys = Object.keys(q.criteria);
  const logits = keys.map((key) => {
    if (OTHER_KEYS.has(key.toLowerCase())) return 0.9;
    const keyTokens = tokenize(key.replace(/[_-]+/g, " "));
    const descTokens = tokenize(q.criteria[key] ?? "");
    const vocab = new Set([...keyTokens, ...descTokens]);
    let hits = 0;
    for (const t of keyTokens) if (tokens.has(t)) hits += 2;
    for (const t of new Set(descTokens)) if (tokens.has(t)) hits += 1;
    return (2.2 * hits) / Math.sqrt(Math.max(1, vocab.size) / 4 + 1);
  });
  const probs = softmax(logits, 1);
  const best = argmax(probs);
  const probabilities = Object.fromEntries(keys.map((k, i) => [k, round(probs[i] ?? 0)]));
  return {
    type: "choice",
    choice: keys[best] ?? keys[0]!,
    probabilities,
    confidence: round(probs[best] ?? 0),
  };
}

/** Cue lexicons that push a score up when the question is about that dimension. */
const CUES: readonly { triggers: RegExp; markers: RegExp; shouting?: boolean }[] = [
  {
    triggers: /urgen|priorit|deadline|soon|timeline|time/i,
    markers:
      /\b(urgent|asap|immediately|today|tomorrow|right now|deadline|clos(es|ing)|launch(ing)? (on|next)|this (week|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(by|before) (monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|christmas|end of)|in (one|two|three|1|2|3) weeks?)\b|!{2,}/gi,
  },
  {
    triggers: /frustrat|angry|upset|tone|sentiment|emotion/i,
    markers: /\b(angry|furious|unacceptable|terrible|worst|scam|ridiculous|disappointed|frustrated|annoyed|refund now)\b|!{2,}/gi,
    shouting: true,
  },
  {
    triggers: /sever|impact|block|critical|outage/i,
    markers: /\b(down|outage|blocked|blocking|cannot|can't|broken|crash(es|ed)?|data loss|all users|production)\b/gi,
  },
  {
    triggers: /budget|spend|price|afford|fund|money/i,
    markers:
      /(\$|₦|€|£|\bngn\b|\busd\b|\bbudget\b|\bapproved\b|\bfunded\b|\braised\b|\bseries [abc]\b|\benterprise\b|\bbank\b|\bfintech\b|\btelco\b|\bngo\b|\bfoundation\b|\bteam of \d+|\b\d+ (restaurants|branches|stores|shops|outlets|staff|employees|people)\b|\b\d+\s?(k|m|million|thousand)\b)/gi,
  },
];

function score(q: ScoreQuestion, tokens: ReadonlySet<string>, raw: string): Answer {
  const n = q.criteria.length;
  const overlap = q.criteria.map((level) => {
    let hits = 0;
    for (const t of new Set(tokenize(level))) if (tokens.has(t)) hits += 1;
    return hits;
  });
  const context = `${q.instructions} ${q.criteria.join(" ")}`;
  let push = 0;
  for (const cue of CUES) {
    if (!cue.triggers.test(context)) continue;
    let found = raw.match(cue.markers)?.length ?? 0;
    if (cue.shouting) found += raw.match(/\b[A-Z]{5,}\b/g)?.length ?? 0;
    push += Math.min(3, found);
  }
  // Prior leans to the lower-middle of the scale; cues push toward the top.
  const logits = overlap.map((hits, i) => {
    const position = n > 1 ? i / (n - 1) : 0;
    const prior = -1.2 * Math.abs(position - 0.3);
    return prior + 1.1 * hits + push * 1.1 * (position - 0.4);
  });
  const probs = softmax(logits, 0.8).map(round);
  return {
    type: "score",
    score: round(expectedLevel(probs)),
    level: argmax(probs),
    probabilities: probs,
    confidence: round(Math.max(...probs)),
  };
}

function noul(q: NoulQuestion, tokens: ReadonlySet<string>): Answer {
  const wanted = [...new Set(tokenize(q.instructions))].filter((t) => !NOUL_NOISE.has(t));
  if (wanted.length === 0) return { type: "noul", noul: 0.5 };
  const hits = wanted.filter((t) => tokens.has(t)).length;
  const ratio = hits / wanted.length;
  const p = 0.08 + 0.84 / (1 + Math.exp(-9 * (ratio - 0.22)));
  return { type: "noul", noul: round(clamp01(p)) };
}

function flatten(state: State): string {
  if (typeof state === "string") return state;
  if (Array.isArray(state)) return state.map((m) => m.content).join("\n");
  const parts: string[] = [];
  const walk = (v: unknown): void => {
    if (v == null) return;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") parts.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") {
      for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
        parts.push(k.replace(/[_-]+/g, " "));
        walk(child);
      }
    }
  };
  walk(state);
  return parts.join(" ");
}

const STOPWORDS = new Set(
  (
    "a an and are as at be been but by can could did do does for from had has have how i if in into is it its " +
    "just me my of on or our out so than that the their them then there these they this to too us was we were " +
    "what when where which who why will with would you your yours about also any some such very more most other " +
    "please need needs want wants help hello hi thanks thank would like looking get got make made one two"
  ).split(" "),
);
const SHORT_KEEP = new Set(["ai", "ml", "ui", "ux", "hr", "qa", "pr", "go"]);

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((t) => (t.length >= 3 || SHORT_KEEP.has(t)) && !STOPWORDS.has(t))
    .map(stem);
}

function stem(t: string): string {
  if (t.length <= 4) return t;
  if (t.endsWith("ies")) return `${t.slice(0, -3)}y`;
  if (t.endsWith("ing") && t.length > 6) return t.slice(0, -3);
  if (t.endsWith("ed") && t.length > 5) return t.slice(0, -2);
  if (t.endsWith("es") && t.length > 5) return t.slice(0, -2);
  if (t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

const NOUL_NOISE = new Set(tokenize("the this that message customer user person explicitly asking about is are a an of for to"));

function round(x: number): number {
  return Math.round(x * 1000) / 1000;
}
