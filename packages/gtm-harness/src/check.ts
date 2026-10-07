import { inventedNumbers, unfilledSlots, wordCount } from "./claims";
import { parseDay, STAGES } from "./pipeline";
import { CLAUDE_SKILLS_DIR, SKILLS_DIR } from "./harness";
import {
  contactKey,
  doNotContact,
  isDoNotContact,
  parseApprovals,
  parseCsv,
  parseDraft,
  statusOf,
  textHash,
  withRecordedVerdict,
  type ApprovalRecord,
  type Draft,
  type ReviewRecord,
} from "./outbox";

/**
 * The workspace's rules, checked by code. Agents read AGENTS.md and rules/; this makes sure what
 * they wrote follows them, before the founder spends any attention on it. Every finding names the
 * rule it breaks and says how to fix it, so an agent can correct its own work. Node only (outbox).
 */

export interface Finding {
  readonly level: "error" | "warning";
  readonly path: string;
  readonly rule: string;
  readonly problem: string;
  readonly fix: string;
}

export const PIPELINE_HEADER = "name,handle_or_email,channel,source,score_pct,stage,last_touch,next_step,notes,do_not_contact";
const REQUIRED_COLUMNS = ["name", "handle_or_email", "channel", "source", "stage", "do_not_contact"] as const;
const MANUALS = ["AGENTS.md", "rules/outreach.md", "rules/claims.md", "workflows/approvals.md"] as const;

/** Where messages to people live: drafts/*.md and campaigns/<name>/outbox/*.md. */
export function isDraftPath(path: string): boolean {
  if (path.toLowerCase().endsWith("/readme.md")) return false;
  return /^drafts\/[^/]+\.md$/.test(path) || /^campaigns\/[^/]+\/outbox\/[^/]+\.md$/.test(path);
}

/** What a draft is checked against: the words the founder approved claims in, the word limit, who opted out. */
export interface DraftContext {
  readonly claimSources: string;
  readonly wordLimit: number | null;
  readonly optedOut: ReadonlySet<string>;
}

export function draftContext(files: Readonly<Record<string, string>>): DraftContext {
  return {
    claimSources: Object.entries(files)
      .filter(([path]) => path.startsWith("brain/products/"))
      .map(([, content]) => content)
      .join("\n"),
    wordLimit: wordLimitFrom(files["rules/outreach.md"]),
    optedOut: files["pipeline.csv"] ? doNotContact(files["pipeline.csv"]) : new Set(),
  };
}

/** The limit in rules/outreach.md ("Under 90 words."), so the check follows the founder's own rule. */
export function wordLimitFrom(rules: string | undefined): number | null {
  const match = rules?.match(/under (\d+) words/i);
  return match ? Number(match[1]) : null;
}

/** The checks one message must pass before it may reach the founder, or leave as a link. */
export function checkDraft(draft: Draft, ctx: DraftContext): Finding[] {
  const out: Finding[] = [];
  const path = draft.file;
  if (isDoNotContact(draft, ctx.optedOut)) {
    out.push({
      level: "error",
      path,
      rule: "rules/outreach.md: anyone who asked to stop is marked do_not_contact",
      problem: `${draft.to} is marked do_not_contact in pipeline.csv`,
      fix: "Delete this draft. They asked not to be contacted.",
    });
  }
  const slots = unfilledSlots(draft.text);
  if (slots.length) {
    out.push({
      level: "error",
      path,
      rule: "workflows/approvals.md: an approval covers the exact text that gets sent",
      problem: `unfilled ${slots.length === 1 ? "slot" : "slots"} ${slots.join(", ")}`,
      fix: "Fill every slot from the person's public work, citing where it came from, before asking for approval.",
    });
  }
  const words = wordCount(draft.text);
  if (ctx.wordLimit !== null && words >= ctx.wordLimit) {
    out.push({
      level: "error",
      path,
      rule: `rules/outreach.md: under ${ctx.wordLimit} words`,
      problem: `${words} words`,
      fix: `Cut it below ${ctx.wordLimit} words: keep the personal line and the one ask.`,
    });
  }
  const invented = inventedNumbers(draft.text, ctx.claimSources);
  if (invented.length) {
    out.push({
      level: "error",
      path,
      rule: "rules/claims.md: every number has a source you could show",
      problem: `${invented.map((n) => `"${n}"`).join(", ")} ${invented.length === 1 ? "isn't" : "aren't"} in brain/products/`,
      fix: "Add the claim with its source to the Approved claims table in brain/products/, or take the number out.",
    });
  }
  const channel = draft.channel.toLowerCase();
  if ((channel.includes("whatsapp") || channel.includes("email")) && !draft.to) {
    out.push({
      level: "warning",
      path,
      rule: "campaigns/<name>/outbox/README.md: one file per message to a person",
      problem: "no **To:** line, so the send link opens without a recipient",
      fix: "Add a **To:** line with their number or email.",
    });
  }
  return out;
}

/** What the CLI knows beyond the files: which decisions and verdicts verify (ledger.ts). */
export interface CheckOptions {
  /** The founder's decisions that verify. Without this, approvals.jsonl is read as written. */
  readonly approvals?: readonly ApprovalRecord[];
  /** The reviewer's verdicts that verify. Without this, a draft's Reviewer line is read as written. */
  readonly reviews?: readonly ReviewRecord[];
  /** The latest verified decision on each campaign's approval.md: the approved text's hash, or null. */
  readonly campaignApprovals?: ReadonlyMap<string, string | null>;
  /** Findings from outside the files, such as ledger lines that don't verify. */
  readonly extra?: readonly Finding[];
}

export function checkWorkspace(files: Readonly<Record<string, string>>, opts: CheckOptions = {}): Finding[] {
  const out: Finding[] = [...(opts.extra ?? [])];
  for (const path of MANUALS) {
    if (files[path] === undefined) {
      out.push({ level: "warning", path, rule: "AGENTS.md: read first", problem: "missing", fix: `Restore ${path}; agents read it before they work.` });
    }
  }

  const pipeline = files["pipeline.csv"];
  if (pipeline === undefined) {
    out.push({ level: "error", path: "pipeline.csv", rule: "AGENTS.md: keep state", problem: "missing", fix: `Create it with this header: ${PIPELINE_HEADER}` });
  } else {
    out.push(...checkPipeline(pipeline));
  }

  const ctx = draftContext(files);
  const approvals = opts.approvals ?? (files["approvals.jsonl"] ? parseApprovals(files["approvals.jsonl"]) : []);
  const drafts: Draft[] = [];
  for (const [path, content] of Object.entries(files)) {
    if (!isDraftPath(path)) continue;
    const draft = parseDraft(path, content);
    if (!draft) {
      out.push({
        level: "error",
        path,
        rule: "campaigns/<name>/outbox/README.md: the draft format",
        problem: "not a draft: it needs a '# Channel · Who' heading, a '---' line, then the message",
        fix: "Rewrite it in the format in campaigns/<name>/outbox/README.md.",
      });
      continue;
    }
    const judged = opts.reviews ? withRecordedVerdict(draft, opts.reviews) : draft;
    drafts.push(judged);
    out.push(...checkDraftInWorkspace(judged, content, ctx, approvals));
  }
  out.push(...duplicateTexts(drafts));
  out.push(...checkCampaigns(files, opts.campaignApprovals));
  out.push(...skillsDrift(files));
  return out.sort((a, b) => (a.level === b.level ? a.path.localeCompare(b.path) : a.level === "error" ? -1 : 1));
}

function checkDraftInWorkspace(draft: Draft, content: string, ctx: DraftContext, approvals: readonly ApprovalRecord[]): Finding[] {
  const status = statusOf(draft, approvals);
  // A sent message is history: the checks are for what can still reach someone.
  if (status === "sent" || status === "rejected") return [];
  const out = checkDraft(draft, ctx);
  if (!/^\*\*Reviewer:\*\*/m.test(content)) {
    out.push({ level: "warning", path: draft.file, rule: "AGENTS.md: roles", problem: "no **Reviewer:** line", fix: "Run the review-drafts skill on it." });
  }
  if (status === "stale") {
    out.push({
      level: "warning",
      path: draft.file,
      rule: "workflows/approvals.md: a draft edited after approval needs a new approval",
      problem: "edited after the founder approved it",
      fix: "Send it for approval again (pnpm gtm review), or restore the approved text.",
    });
  }
  return out;
}

function checkPipeline(csv: string): Finding[] {
  const out: Finding[] = [];
  const [header, ...rows] = parseCsv(csv);
  const columns = (header ?? []).map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length) {
    return [
      {
        level: "error",
        path: "pipeline.csv",
        rule: "AGENTS.md: keep state",
        problem: `the header is missing ${missing.join(", ")}`,
        fix: `Restore the header: ${PIPELINE_HEADER}`,
      },
    ];
  }
  const col = (name: string) => columns.indexOf(name);
  const seen = new Map<string, number>();
  rows.forEach((row, i) => {
    const line = i + 2;
    const at = `pipeline.csv:${line}`;
    if (row.length !== columns.length) {
      out.push({
        level: "error",
        path: at,
        rule: "pipeline.csv: one row per lead",
        problem: `${row.length} fields where the header has ${columns.length}`,
        fix: 'Put quotes around any field with a comma in it, like "Lagos, Nigeria".',
      });
      return;
    }
    const name = row[col("name")]?.trim() ?? "";
    const handle = row[col("handle_or_email")]?.trim() ?? "";
    if (!name && !handle) {
      out.push({ level: "error", path: at, rule: "pipeline.csv: one row per lead", problem: "no name or handle", fix: "Fill in who this is, or delete the row." });
    }
    if (!(row[col("source")]?.trim() ?? "")) {
      out.push({
        level: "error",
        path: at,
        rule: "AGENTS.md: public information only, with its URL",
        problem: `${name || handle || "this lead"} has no source`,
        fix: "Add where you found them (a URL or the group's name), or delete the row.",
      });
    }
    const score = col("score_pct") >= 0 ? (row[col("score_pct")]?.trim() ?? "") : "";
    if (score && !(Number.isFinite(Number(score.replace(/%$/, ""))) && Number(score.replace(/%$/, "")) >= 0 && Number(score.replace(/%$/, "")) <= 100)) {
      out.push({ level: "error", path: at, rule: "brain/audience.md: the scorecard", problem: `score_pct "${score}" isn't 0–100`, fix: "Score the lead again with the score-leads skill." });
    }
    const stage = row[col("stage")]?.trim().toLowerCase() ?? "";
    if (stage && !(STAGES as readonly string[]).includes(stage)) {
      out.push({ level: "warning", path: at, rule: "pipeline.csv: the stages", problem: `stage "${stage}" isn't one code knows`, fix: `Use one of: ${STAGES.join(", ")}.` });
    }
    const touched = col("last_touch") >= 0 ? (row[col("last_touch")]?.trim() ?? "") : "";
    if (touched && !parseDay(touched)) {
      out.push({ level: "warning", path: at, rule: "pipeline.csv: dates", problem: `last_touch "${touched}" isn't a date code can count from`, fix: "Write it as YYYY-MM-DD." });
    }
    const key = handle ? contactKey(handle) : "";
    if (key) {
      const first = seen.get(key);
      if (first) {
        out.push({ level: "warning", path: at, rule: "pipeline.csv: one row per lead", problem: `the same person as line ${first}`, fix: "Merge the two rows into one." });
      } else {
        seen.set(key, line);
      }
    }
  });
  return out;
}

function duplicateTexts(drafts: readonly Draft[]): Finding[] {
  const byText = new Map<string, string[]>();
  for (const d of drafts) {
    const key = d.text.toLowerCase().replace(/\s+/g, " ").trim();
    byText.set(key, [...(byText.get(key) ?? []), d.file]);
  }
  return [...byText.values()]
    .filter((files) => files.length > 1)
    .flatMap((files) =>
      files.map((path) => ({
        level: "warning" as const,
        path,
        rule: "rules/outreach.md: never the same text to many people",
        problem: `the same text as ${files.filter((f) => f !== path).join(", ")}`,
        fix: "Give each its own line that only that person could receive.",
      })),
    );
}

function checkCampaigns(files: Readonly<Record<string, string>>, recorded?: ReadonlyMap<string, string | null>): Finding[] {
  const out: Finding[] = [];
  const campaigns = new Set(Object.keys(files).flatMap((p) => p.match(/^campaigns\/([^/]+)\//)?.[1] ?? []));
  for (const name of campaigns) {
    const path = `campaigns/${name}/approval.md`;
    const approval = files[path];
    const field = (label: string) => approval?.match(new RegExp(`^\\*\\*${label}:\\*\\*(.*)$`, "m"))?.[1]?.trim() ?? "";
    const approved = /^approved\b/i.test(field("Status"));
    if (approved && recorded && approval !== undefined && recorded.get(path) !== textHash(approval)) {
      out.push({
        level: "error",
        path,
        rule: `${path}: only the founder approves a campaign`,
        problem: recorded.get(path)
          ? "edited after the founder approved it"
          : "says approved, but no approval is recorded for it on this machine",
        fix: `Set the status back to not approved. The founder approves with pnpm gtm approve <folder> --campaign ${name}, at a terminal.`,
      });
    } else if (approved && (!field("Approved by") || !field("Date"))) {
      out.push({
        level: "error",
        path,
        rule: `${path}: approved means signed with a name and a date`,
        problem: "approved, but with no name or date",
        fix: "Only the founder approves: set the status back to not approved until they sign it.",
      });
    }
    const outputs = Object.keys(files).filter((p) => p.startsWith(`campaigns/${name}/outputs/`));
    if (!approved && outputs.length) {
      out.push({
        level: "error",
        path: `campaigns/${name}/outputs/`,
        rule: `${path}: production starts only when the status says approved`,
        problem: `${outputs.length} ${outputs.length === 1 ? "output" : "outputs"} made before the direction was approved`,
        fix: "Stop production and ask the founder to approve the direction in approval.md.",
      });
    }
  }
  return out;
}

function skillsDrift(files: Readonly<Record<string, string>>): Finding[] {
  const out: Finding[] = [];
  for (const [path, content] of Object.entries(files)) {
    if (!path.startsWith(SKILLS_DIR)) continue;
    const copy = `${CLAUDE_SKILLS_DIR}${path.slice(SKILLS_DIR.length)}`;
    if (files[copy] !== content) {
      out.push({
        level: "warning",
        path: copy,
        rule: "AGENTS.md: the same skills in both folders",
        problem: files[copy] === undefined ? `missing; ${path} has it` : `differs from ${path}`,
        fix: `Run pnpm gtm sync, or copy ${path} over it.`,
      });
    }
  }
  return out;
}

/** One line per finding, then the fix; the format an agent can act on. */
export function formatFindings(findings: readonly Finding[]): string {
  if (!findings.length) return "All clear: every check passed.";
  const errors = findings.filter((f) => f.level === "error").length;
  const warnings = findings.length - errors;
  const lines = findings.map((f) => `${f.level === "error" ? "error  " : "warning"} ${f.path}: ${f.problem}\n        rule: ${f.rule}\n        fix:  ${f.fix}`);
  return `${lines.join("\n")}\n\n${errors} ${errors === 1 ? "error" : "errors"}, ${warnings} ${warnings === 1 ? "warning" : "warnings"}.`;
}
