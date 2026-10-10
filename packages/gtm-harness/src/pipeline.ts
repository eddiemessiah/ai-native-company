/**
 * The pipeline's arithmetic, done by code: a lead's score from the scorecard, its stage, and who
 * is due a follow-up in working days. The model judges each criterion with its evidence; it never
 * adds up weights or counts days. Browser-safe.
 */

/** One home for the thresholds; brain/audience.md and AGENTS.md are written from these. */
export const REACH_OUT_AT = 80;
export const NURTURE_AT = 60;
/** Working days to wait before the one follow-up rules/outreach.md allows. */
export const FOLLOW_UP_AFTER = 3;

/** The stages a lead moves through. Anything else in pipeline.csv is flagged by the check. */
export const STAGES = ["new", "reach out", "nurture", "skip", "contacted", "replied", "call", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];

export interface Criterion {
  readonly name: string;
  readonly weight: number;
  readonly lookFor: string;
}

/** The scorecard table in brain/audience.md: | Criterion | Weight | What to look for |. */
export function parseScorecard(audience: string): Criterion[] {
  const section = audience.split(/^## The scorecard\s*$/m)[1]?.split(/^## /m)[0] ?? "";
  const out: Criterion[] = [];
  for (const line of section.split("\n")) {
    const cells = line
      .trim()
      .replace(/^\||\|$/g, "")
      .split(/(?<!\\)\|/)
      .map((c) => c.trim().replace(/\\\|/g, "|"));
    if (cells.length < 2) continue;
    const weight = Number(cells[1]);
    if (!cells[0] || cells[0] === "Criterion" || !Number.isFinite(weight) || weight <= 0) continue;
    out.push({ name: cells[0], weight, lookFor: cells[2] ?? "" });
  }
  return out;
}

export function stageFor(score: number): Stage {
  return score >= REACH_OUT_AT ? "reach out" : score >= NURTURE_AT ? "nurture" : "skip";
}

export interface Judgement {
  readonly criterion: string;
  readonly met: boolean;
  readonly evidence?: string;
}

export type ScoreResult =
  | { readonly ok: true; readonly score: number; readonly stage: Stage; readonly met: readonly string[] }
  | { readonly ok: false; readonly problem: string };

/**
 * The score is the sum of the weights met, over the total, as a whole percent. Every criterion must
 * be judged exactly once, and a criterion counted as met needs its evidence.
 */
export function scoreLead(criteria: readonly Criterion[], judgements: readonly Judgement[], disqualifier?: string): ScoreResult {
  if (!criteria.length) return { ok: false, problem: "brain/audience.md has no scorecard table to score against" };
  const key = (s: string) => s.trim().toLowerCase();
  const byName = new Map(criteria.map((c) => [key(c.name), c]));
  const seen = new Set<string>();
  for (const j of judgements) {
    const k = key(j.criterion);
    if (!byName.has(k)) return { ok: false, problem: `"${j.criterion}" isn't on the scorecard. The criteria are: ${criteria.map((c) => c.name).join("; ")}` };
    if (seen.has(k)) return { ok: false, problem: `"${j.criterion}" is judged twice` };
    if (j.met && !j.evidence?.trim()) return { ok: false, problem: `"${j.criterion}" is marked met with no evidence. Give the public source that shows it` };
    seen.add(k);
  }
  const missing = criteria.filter((c) => !seen.has(key(c.name)));
  if (missing.length) return { ok: false, problem: `judge every criterion; missing: ${missing.map((c) => c.name).join("; ")}` };
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  const metNames = judgements.filter((j) => j.met).map((j) => byName.get(key(j.criterion))!.name);
  const gained = metNames.reduce((sum, name) => sum + byName.get(key(name))!.weight, 0);
  const score = Math.round((gained / total) * 100);
  return { ok: true, score, stage: disqualifier?.trim() ? "skip" : stageFor(score), met: metNames };
}

/** A date written YYYY-MM-DD, at UTC midnight, or null when it isn't one. */
export function parseDay(value: string | undefined): Date | null {
  const m = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? d : null;
}

/** Weekdays after `from`, up to and including `to`: Friday to Monday is 1. */
export function workingDaysBetween(from: Date, to: Date): number {
  let days = 0;
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  while (d.getTime() < end) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) days++;
  }
  return days;
}

export interface Lead {
  readonly line: number;
  readonly name: string;
  readonly handle: string;
  readonly stage: string;
  readonly lastTouch: string;
  readonly nextStep: string;
  readonly doNotContact: boolean;
}

export function leadsFrom(header: readonly string[], rows: readonly string[][]): Lead[] {
  const col = (row: readonly string[], name: string) => row[header.indexOf(name)]?.trim() ?? "";
  return rows.map((row, i) => ({
    line: i + 2,
    name: col(row, "name"),
    handle: col(row, "handle_or_email"),
    stage: col(row, "stage").toLowerCase(),
    lastTouch: col(row, "last_touch"),
    nextStep: col(row, "next_step").toLowerCase(),
    doNotContact: !!col(row, "do_not_contact") && !["no", "n", "false", "0"].includes(col(row, "do_not_contact").toLowerCase()),
  }));
}

/**
 * Who gets the one follow-up today: contacted, no reply, last touched FOLLOW_UP_AFTER or more working
 * days ago, and not stopped. Leads already followed up (next_step "stop") are listed so nobody writes again.
 */
export function dueFollowUps(leads: readonly Lead[], today: Date): { due: Lead[]; waiting: Lead[]; stopped: Lead[]; undated: Lead[] } {
  const out = { due: [] as Lead[], waiting: [] as Lead[], stopped: [] as Lead[], undated: [] as Lead[] };
  for (const lead of leads) {
    if (lead.doNotContact || lead.stage !== "contacted") continue;
    if (lead.nextStep === "stop") {
      out.stopped.push(lead);
      continue;
    }
    const touched = parseDay(lead.lastTouch);
    if (!touched) out.undated.push(lead);
    else if (workingDaysBetween(touched, today) >= FOLLOW_UP_AFTER) out.due.push(lead);
    else out.waiting.push(lead);
  }
  return out;
}

/** The follow-up list, worked out by code from pipeline.csv and today's date. */
export function formatDue(pipeline: { header: string[]; rows: string[][] }, today: Date): string {
  const { due, waiting, stopped, undated } = dueFollowUps(leadsFrom(pipeline.header, pipeline.rows), today);
  const who = (l: { name: string; handle: string; line: number }) => `${l.name || l.handle} (${l.handle}, pipeline.csv line ${l.line})`;
  const parts = [
    due.length ? `Due their one follow-up today:\n${due.map((l) => `- ${who(l)}`).join("\n")}` : "Nobody is due a follow-up today.",
    waiting.length ? `Not yet (under ${FOLLOW_UP_AFTER} working days): ${waiting.map(who).join(", ")}` : "",
    stopped.length ? `Followed up already, so no more messages: ${stopped.map(who).join(", ")}` : "",
    undated.length ? `Contacted with no last_touch date, so code can't count: ${undated.map(who).join(", ")}. Set last_touch (YYYY-MM-DD).` : "",
  ];
  return parts.filter(Boolean).join("\n\n");
}
