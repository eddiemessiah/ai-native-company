import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { userInfo } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseEnv } from "node:util";
import { brainFromEnv, providersFromEnv } from "@repo/brain/env";
import { checkDraft, checkWorkspace, draftContext, formatFindings, type DraftContext, type Finding } from "./check";
import { unfilledSlots } from "./claims";
import { pollDecisions, postForReview, sendReviewCard, telegramFromEnv, toolStatus, type TelegramConfig } from "./connectors";
import { evalModel, evalTable } from "./evals";
import { buildHarness, CLAUDE_SKILLS_DIR, SKILLS_DIR } from "./harness";
import { gtmInputSchema, type GtmInput } from "./input";
import { describeRoute, routeModel } from "./models";
import { appendSigned, readSigned } from "./ledger";
import {
  canSend,
  doNotContact,
  draftId,
  isApprovalRecord,
  isDoNotContact,
  isReviewRecord,
  parseCsv,
  parseDraft,
  sendLink,
  statusOf,
  textHash,
  withRecordedVerdict,
  type ApprovalRecord,
  type Draft,
  type ReviewRecord,
  type SendLink,
} from "./outbox";
import { formatDue } from "./pipeline";
import { generatePlan, templatePlan, type GeneratedPlan } from "./plan";
import { reviewOutreach, type OutreachReview } from "./review";

/**
 * The local CLI: run a GTM workspace with any model, review drafts, approve them from
 * Telegram or the terminal, and get one-tap send links. It never sends anything to a
 * prospect; it only posts review cards to the founder's own chat and Slack channel.
 */

const HELP = `Shonin GTM Harness: a go-to-market workspace your agents run, with any model.

Usage: pnpm gtm <command> [options]   (add --env <file> to load keys, e.g. --env apps/web/.env.local)

  doctor                       What's connected: the model, the reviewer, Telegram, Slack
  new <dir> --input <file>     Build a workspace from a founder's answers (JSON); --force to overwrite
  status <dir>                 Every draft and where it stands
  check <dir>                  Check the workspace against its own rules; every finding says how to fix it
  review <dir> [--local]       Review new drafts, then ask for approval: in Telegram (and Slack),
                               or here in the terminal with --local
  wait <dir> [--minutes N]     Collect Telegram decisions into approvals.jsonl (default 10)
  links <dir>                  One-tap send links for every approved draft
  due <dir>                    Who is due their one follow-up today, counted in working days by code
  sent <dir> <draft>           Record that you sent an approved draft (at your terminal)
  approve <dir> --campaign <name>
                               Approve a campaign's direction, deliverables and budget (at your terminal)
  sync <dir>                   Copy the skills in .agents/skills/ to .claude/skills/ for Claude Code
  mcp <dir>                    Serve the workspace as MCP tools (stdio) for any agent; no tool sends or approves
  eval --input <file> --models a,b [--runs N] [--out <dir>]
                               Run the same input through each model; write the support table

Nothing is ever sent by this tool. Approved drafts become links you tap to send.`;

type Env = Record<string, string | undefined>;

// ── Workspace files ───────────────────────────────────────────────────────────

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

export async function writeFiles(dir: string, files: Readonly<Record<string, string>>): Promise<void> {
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
  }
}

/** Every draft in the workspace: drafts/*.md and campaigns/<c>/outbox/*.md. */
export async function collectDrafts(dir: string): Promise<{ draft: Draft; content: string }[]> {
  const folders = ["drafts"];
  if (await exists(join(dir, "campaigns"))) {
    for (const c of await readdir(join(dir, "campaigns"))) folders.push(`campaigns/${c}/outbox`);
  }
  const out: { draft: Draft; content: string }[] = [];
  for (const folder of folders) {
    if (!(await exists(join(dir, folder)))) continue;
    for (const name of (await readdir(join(dir, folder))).sort()) {
      if (!name.endsWith(".md") || name.toLowerCase() === "readme.md") continue;
      const file = `${folder}/${name}`;
      const content = await readFile(join(dir, file), "utf8");
      const draft = parseDraft(file, content);
      if (draft) out.push({ draft, content });
    }
  }
  return out;
}

// ── The ledgers: signed decisions and verdicts (ledger.ts) ────────────────────

const APPROVALS = "approvals.jsonl";
const REVIEWS = join(".shonin", "reviews.jsonl");

/** Both ledgers, each split into what this machine's key signed and what it didn't. */
export async function readLedgers(dir: string) {
  const [approvals, reviews] = await Promise.all([
    readSigned<ApprovalRecord>(join(dir, APPROVALS), isApprovalRecord),
    readSigned<ReviewRecord>(join(dir, REVIEWS), isReviewRecord),
  ]);
  return { approvals, reviews };
}

/** The founder's decisions that verify. A line nobody signed counts for nothing. */
export async function readApprovals(dir: string): Promise<ApprovalRecord[]> {
  return (await readSigned<ApprovalRecord>(join(dir, APPROVALS), isApprovalRecord)).trusted;
}

/** The reviewer's verdicts that verify. */
export async function readReviews(dir: string): Promise<ReviewRecord[]> {
  return (await readSigned<ReviewRecord>(join(dir, REVIEWS), isReviewRecord)).trusted;
}

export async function recordDecision(dir: string, record: ApprovalRecord): Promise<void> {
  const { sig: _sig, ...unsigned } = record;
  await appendSigned(join(dir, APPROVALS), { ...unsigned });
}

export async function recordReview(dir: string, record: ReviewRecord): Promise<void> {
  const { sig: _sig, ...unsigned } = record;
  await appendSigned(join(dir, REVIEWS), { ...unsigned });
}

/** Every draft, carrying only the verdict the reviewer recorded for its current text. */
export async function reviewedDrafts(dir: string): Promise<{ draft: Draft; content: string }[]> {
  const reviews = await readReviews(dir);
  return (await collectDrafts(dir)).map(({ draft, content }) => ({ draft: withRecordedVerdict(draft, reviews), content }));
}

/** Every text file in the workspace, by its path inside it. Skips .git, node_modules and the CLI's own state. */
export async function readWorkspace(dir: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const walk = async (rel: string): Promise<void> => {
    for (const entry of await readdir(join(dir, rel), { withFileTypes: true })) {
      const path = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (![".git", "node_modules", ".shonin"].includes(entry.name)) await walk(path);
      } else if (entry.isFile() && (await stat(join(dir, path))).size <= 1_000_000) {
        out[path] = await readFile(join(dir, path), "utf8");
      }
    }
  };
  await walk("");
  return out;
}

export async function check(dir: string): Promise<Finding[]> {
  const files = await readWorkspace(dir);
  const { approvals, reviews } = await readLedgers(dir);
  const extra: Finding[] = [
    ...approvals.untrusted.map(({ line, value }) => ({
      level: "error" as const,
      path: `${APPROVALS}:${line}`,
      rule: "workflows/approvals.md: only the founder approves",
      problem: `${String(value.decision ?? "a decision")} on ${String(value.file ?? "a draft")} that this machine's approval key didn't sign, so it doesn't count`,
      fix: "Delete the line. The founder decides in Telegram, or at a terminal with pnpm gtm review --local.",
    })),
    ...reviews.untrusted.map(({ line }) => ({
      level: "warning" as const,
      path: `.shonin/reviews.jsonl:${line}`,
      rule: "AGENTS.md: roles",
      problem: "a verdict this machine's key didn't sign, so it doesn't count",
      fix: "Delete the line and run pnpm gtm review: the reviewer gives its own verdict.",
    })),
  ];
  const campaignApprovals = new Map<string, string | null>();
  for (const a of approvals.trusted) {
    if (/^campaigns\/[^/]+\/approval\.md$/.test(a.file)) campaignApprovals.set(a.file, a.decision === "approved" ? a.hash : null);
  }
  return checkWorkspace(files, { approvals: approvals.trusted, reviews: reviews.trusted, campaignApprovals, extra });
}

/** Who asked not to be contacted, from the workspace's pipeline.csv. */
export async function readDoNotContact(dir: string): Promise<Set<string>> {
  const path = join(dir, "pipeline.csv");
  return (await exists(path)) ? doNotContact(await readFile(path, "utf8")) : new Set();
}

const VERDICT_TEXT: Readonly<Record<OutreachReview["verdict"], string>> = {
  ready: "READY: fill any [slots], then it goes to the founder for approval",
  revise: "REVISE: fix the points below first",
  blocked: "BLOCKED: breaks a rule; rewrite before anyone sees it",
};

/** Writes the reviewer's verdict into a draft's Reviewer line. The message text (and its hash) doesn't change. */
export function withVerdict(content: string, review: OutreachReview): string {
  const line = `**Reviewer:** ${VERDICT_TEXT[review.verdict]}${review.fixes.length ? `\n\n${review.fixes.map((f) => `- ${f}`).join("\n")}` : ""}\n\n_Reviewed by ${review.provider}${review.calibrated ? "" : " (uncalibrated)"}._`;
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const sep = lines.lastIndexOf("---");
  const head = lines.slice(0, sep).join("\n");
  const body = lines.slice(sep).join("\n");
  const reviewerBlock = /\*\*Reviewer:\*\*[\s\S]*?(?=\n\*\*[A-Z][a-z]+:\*\*|\n*$)/;
  const replaced = reviewerBlock.test(head) ? head.replace(reviewerBlock, () => line) : `${head.trimEnd()}\n${line}`;
  return `${replaced.trimEnd()}\n\n${body}`;
}

// ── Review state (which cards went to Telegram) ──────────────────────────────

interface ReviewState {
  offset?: number;
  cards: Record<string, { file: string; hash: string; messageId: number; link: SendLink | null }>;
}

async function readState(dir: string): Promise<ReviewState> {
  const path = join(dir, ".shonin", "review-state.json");
  if (!(await exists(path))) return { cards: {} };
  try {
    return JSON.parse(await readFile(path, "utf8")) as ReviewState;
  } catch {
    return { cards: {} };
  }
}

async function saveState(dir: string, state: ReviewState): Promise<void> {
  await mkdir(join(dir, ".shonin"), { recursive: true });
  await writeFile(join(dir, ".shonin", "review-state.json"), `${JSON.stringify(state, null, 2)}\n`);
}

// ── Commands ─────────────────────────────────────────────────────────────────

export async function doctor(env: Env = process.env): Promise<string> {
  const rows = toolStatus(env).map((t) => `${t.connected ? "✓" : "·"} ${t.name}: ${t.connected ? t.does : `not connected. ${t.needs ?? ""}`}`);
  const providers = providersFromEnv(env, { allowHeuristic: false }).map((p) => p.name);
  rows.splice(
    1,
    0,
    providers.length
      ? `✓ Reviewer: the decision brain (${providers.join(", then ")})`
      : "· Reviewer: the free heuristic only (uncalibrated). Set AI_GATEWAY_API_KEY, OPENROUTER_API_KEY or ANTHROPIC_API_KEY for a real reviewer.",
  );
  return rows.join("\n");
}

export async function createWorkspace(
  dir: string,
  input: GtmInput,
  opts: { env?: Env; force?: boolean; now?: Date; plan?: GeneratedPlan } = {},
): Promise<{ files: number; planBy: string; verdicts: string[]; note?: string }> {
  const env = opts.env ?? process.env;
  if ((await exists(dir)) && (await readdir(dir)).length > 0 && !opts.force) {
    throw new Error(`${dir} isn't empty. Use --force to write over it.`);
  }
  const route = routeModel(env);
  let generated = opts.plan;
  let note: string | undefined;
  if (!generated) {
    if (route) {
      try {
        generated = await generatePlan(input, { route, signal: AbortSignal.timeout(120_000) });
      } catch (error) {
        note = `The model failed (${error instanceof Error ? error.message : String(error)}), so the plan uses templates.`;
        generated = templatePlan(input);
      }
    } else {
      note = "No model is configured, so the plan uses templates. Run `pnpm gtm doctor` to connect one.";
      generated = templatePlan(input);
    }
  }
  const brain = brainFromEnv({ env, allowHeuristic: true, sinks: [] });
  const reviews = await Promise.all(generated.plan.drafts.map((d) => reviewOutreach(brain, d).catch(() => null)));
  const files = { ...buildHarness(input, generated.plan, reviews, opts.now ?? new Date(), { tools: toolStatus(env) }), ".mcp.json": mcpConfig(dir) };
  await writeFiles(dir, files);
  // The verdicts given at creation count like any other: recorded and signed, for the exact text.
  const reviewedAt = new Date().toISOString();
  for (const { draft } of await collectDrafts(dir)) {
    const i = generated.plan.drafts.findIndex((d) => d.text.trim() === draft.text);
    const r = i >= 0 ? reviews[i] : null;
    if (r) await recordReview(dir, { file: draft.file, hash: textHash(draft.text), verdict: r.verdict, provider: r.provider, calibrated: r.calibrated, at: reviewedAt });
  }
  const planBy = generated.generatedBy.kind === "model" && route ? describeRoute({ ...route, model: generated.generatedBy.model ?? route.model }) : "templates";
  return { files: Object.keys(files).length, planBy, verdicts: reviews.map((r) => r?.verdict ?? "not reviewed"), ...(note ? { note } : {}) };
}

/**
 * Project MCP config for a workspace made on this machine: open the folder in Claude Code and it
 * offers this workspace's tools. Absolute paths, because the workspace and the repo live apart.
 * `--silent` keeps pnpm's own lines off stdout, where the protocol runs.
 */
export function mcpConfig(dir: string, repoRoot = fileURLToPath(new URL("../../..", import.meta.url))): string {
  const config = { mcpServers: { "shonin-gtm": { command: "pnpm", args: ["--silent", "--dir", repoRoot.replace(/[\\/]+$/, ""), "gtm", "mcp", resolve(dir)] } } };
  return `${JSON.stringify(config, null, 2)}\n`;
}

export async function status(dir: string): Promise<string> {
  const drafts = await reviewedDrafts(dir);
  const approvals = await readApprovals(dir);
  if (!drafts.length) return "No drafts yet.";
  const ctx = draftContext(await readWorkspace(dir));
  return drafts
    .map(({ draft }) => {
      const s = statusOf(draft, approvals);
      const errors = s === "pending" || s === "stale" || s === "unreviewed" ? checkDraft(draft, ctx).filter((f) => f.level === "error").length : 0;
      return `${(errors ? "held" : s).padEnd(10)} ${draft.channel.padEnd(12)} ${draft.file}${errors ? `  (${errors} to fix: pnpm gtm check)` : ""}`;
    })
    .join("\n");
}

/** Reviews unreviewed drafts with the brain, then asks the founder about every draft still waiting. */
export async function review(
  dir: string,
  opts: {
    env?: Env;
    local?: boolean;
    ask?: (draft: Draft) => Promise<"a" | "r" | "s">;
    telegram?: TelegramConfig | null;
    fetch?: typeof fetch;
    /** Only this draft, by its path in the workspace. */
    only?: string;
  } = {},
): Promise<string[]> {
  const env = opts.env ?? process.env;
  const inScope = (file: string) => !opts.only || file === opts.only;
  const log: string[] = [];
  const brain = brainFromEnv({ env, allowHeuristic: true, sinks: [] });
  const approvals = await readApprovals(dir);

  // 1. The reviewer: every draft with no recorded verdict for its current text gets one, recorded
  //    and signed, and shown in the file. A verdict typed into the file doesn't count.
  const recorded = await readReviews(dir);
  for (const { draft, content } of await collectDrafts(dir)) {
    if (!inScope(draft.file) || withRecordedVerdict(draft, recorded).verdict) continue;
    const verdict = await reviewOutreach(brain, { channel: draft.channel, audience: draft.to ?? "", text: draft.text }).catch(() => null);
    if (verdict) {
      await writeFile(join(dir, draft.file), withVerdict(content, verdict));
      await recordReview(dir, {
        file: draft.file,
        hash: textHash(draft.text),
        verdict: verdict.verdict,
        provider: verdict.provider,
        calibrated: verdict.calibrated,
        at: new Date().toISOString(),
      });
      log.push(`reviewed  ${draft.file}: ${verdict.verdict}`);
    }
  }

  // 2. The founder: every draft that's pending for its current text, unless its recipient opted out
  //    or code finds a rule it breaks. The founder's attention goes only to drafts that pass.
  const optedOut = await readDoNotContact(dir);
  const ctx: DraftContext = draftContext(await readWorkspace(dir));
  const waiting = (await reviewedDrafts(dir)).filter(({ draft }) => {
    if (!inScope(draft.file)) return false;
    const s = statusOf(draft, approvals);
    if (s === "blocked") log.push(`blocked   ${draft.file}: the reviewer blocked it; rewrite it first`);
    if (s !== "pending" && s !== "stale") return false;
    if (isDoNotContact(draft, optedOut)) {
      log.push(`skipped   ${draft.file}: ${draft.to} is marked do_not_contact in pipeline.csv`);
      return false;
    }
    const errors = checkDraft(draft, ctx).filter((f) => f.level === "error");
    for (const f of errors) log.push(`held      ${draft.file}: ${f.problem}. Fix: ${f.fix}`);
    return errors.length === 0;
  });
  if (!waiting.length) {
    log.push("Nothing waiting for approval.");
    return log;
  }

  if (opts.local || !(opts.telegram ?? telegramFromEnv(env))) {
    if (!opts.local) log.push("Telegram isn't connected, so approve here (or set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID).");
    if (!opts.ask && !process.stdin.isTTY) {
      log.push("Approvals need the founder at an interactive terminal, or in Telegram. Piped or scripted answers aren't accepted.");
      return log;
    }
    const terminal = opts.ask ? null : terminalAsker();
    const ask = opts.ask ?? terminal!.ask;
    try {
      for (const { draft } of waiting) {
        const answer = await ask(draft);
        if (answer === "s") continue;
        const record: ApprovalRecord = {
          file: draft.file,
          hash: textHash(draft.text),
          decision: answer === "a" ? "approved" : "rejected",
          by: `cli:${safeUser()}`,
          at: new Date().toISOString(),
          via: "cli",
        };
        await recordDecision(dir, record);
        log.push(`${record.decision.padEnd(9)} ${draft.file}`);
      }
    } finally {
      terminal?.close();
    }
    return log;
  }

  const telegram = (opts.telegram ?? telegramFromEnv(env))!;
  const tg = opts.fetch ? { ...telegram, fetch: opts.fetch } : telegram;
  const state = await readState(dir);
  for (const { draft } of waiting) {
    const id = draftId(draft);
    if (state.cards[id]) continue;
    const link = sendLink(draft);
    const messageId = await sendReviewCard(tg, draft, id);
    state.cards[id] = { file: draft.file, hash: textHash(draft.text), messageId, link };
    log.push(`to Telegram ${draft.file}`);
    if (env.GTM_SLACK_WEBHOOK_URL) {
      await postForReview(env.GTM_SLACK_WEBHOOK_URL, draft, opts.fetch ? { fetch: opts.fetch } : {}).catch((e: unknown) =>
        log.push(`Slack copy failed for ${draft.file}: ${e instanceof Error ? e.message : String(e)}`),
      );
    }
  }
  await saveState(dir, state);
  log.push("Approve in Telegram, then run `pnpm gtm wait <dir>` to record your decisions.");
  return log;
}

/** Collects Telegram decisions until every card is decided or time runs out. */
export async function wait(
  dir: string,
  opts: { env?: Env; minutes?: number; telegram?: TelegramConfig | null; fetch?: typeof fetch; waitSeconds?: number } = {},
): Promise<string[]> {
  const env = opts.env ?? process.env;
  const base = opts.telegram ?? telegramFromEnv(env);
  if (!base) throw new Error("Telegram isn't connected: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.");
  const telegram = opts.fetch ? { ...base, fetch: opts.fetch } : base;
  const state = await readState(dir);
  const log: string[] = [];
  const deadline = Date.now() + (opts.minutes ?? 10) * 60_000;
  // Cards still waiting for a decision; decided ones leave the map and the saved state.
  // A recipient who opted out since the card went out gets no link, whatever the decision.
  const optedOut = await readDoNotContact(dir);
  const drafts = new Map((await collectDrafts(dir)).map(({ draft }) => [draft.file, draft] as const));
  const known = new Map(
    Object.entries(state.cards).map(([id, c]) => {
      const draft = drafts.get(c.file);
      return [id, draft && isDoNotContact(draft, optedOut) ? null : c.link] as const;
    }),
  );
  while (Date.now() < deadline && known.size > 0) {
    const { decisions, nextOffset } = await pollDecisions(telegram, { ...(state.offset !== undefined ? { offset: state.offset } : {}), waitSeconds: opts.waitSeconds ?? 25, known });
    state.offset = nextOffset;
    for (const d of decisions) {
      const card = state.cards[d.id];
      if (!card) continue;
      const current = (await collectDrafts(dir)).find(({ draft }) => draft.file === card.file)?.draft;
      if (!current || textHash(current.text) !== card.hash) {
        log.push(`changed   ${card.file}: edited after it was sent for review; run review again`);
      } else {
        await recordDecision(dir, { file: card.file, hash: card.hash, decision: d.decision, by: d.by, at: d.at, via: "telegram" });
        log.push(`${d.decision.padEnd(9)} ${card.file} by ${d.by}`);
      }
      delete state.cards[d.id];
      known.delete(d.id);
    }
    await saveState(dir, state);
    if (opts.waitSeconds === 0) break;
  }
  if (!log.length) log.push("No decisions yet.");
  return log;
}

export async function links(dir: string): Promise<string[]> {
  const approvals = await readApprovals(dir);
  const optedOut = await readDoNotContact(dir);
  const out: string[] = [];
  for (const { draft } of await reviewedDrafts(dir)) {
    if (!canSend(draft, approvals)) continue;
    if (isDoNotContact(draft, optedOut)) {
      out.push(`${draft.file}\n  Not sent: ${draft.to} is marked do_not_contact in pipeline.csv.`);
      continue;
    }
    const slots = unfilledSlots(draft.text);
    if (slots.length) {
      out.push(`${draft.file}\n  Not sent: it still has ${slots.join(", ")}, and the link would send them as written. Fill them, then approve it again.`);
      continue;
    }
    const link = sendLink(draft);
    out.push(link ? `${draft.file}\n  ${link.label}: ${link.url}` : `${draft.file}\n  Copy the text and send it on ${draft.channel} yourself.`);
  }
  return out.length ? out : ["No approved drafts yet. Run `pnpm gtm review <dir>`."];
}

/** Records that the founder sent an approved draft, for its exact text. Only at the founder's terminal. */
export async function markSent(dir: string, file: string, opts: { confirm?: () => Promise<boolean> } = {}): Promise<string> {
  const entry = (await reviewedDrafts(dir)).find(({ draft }) => draft.file === file);
  if (!entry) return `${file} isn't a draft in this workspace.`;
  const approvals = await readApprovals(dir);
  const status = statusOf(entry.draft, approvals);
  if (status !== "approved") return `${file} is ${status}, not approved, so it can't have been sent from the harness.`;
  if (!opts.confirm && !process.stdin.isTTY) return "Only the founder records a send, at an interactive terminal.";
  const ok = opts.confirm ? await opts.confirm() : await terminalConfirm(`Did you send ${file} as approved? [y/N] `);
  if (!ok) return "Nothing recorded.";
  await recordDecision(dir, { file, hash: textHash(entry.draft.text), decision: "sent", by: `cli:${safeUser()}`, at: new Date().toISOString(), via: "cli" });
  return `Recorded: ${file} sent.`;
}

/** Sets one "**Field:** value" line in a markdown file, or adds it at the end. */
function setField(content: string, field: string, value: string): string {
  const line = new RegExp(`^\\*\\*${field}:\\*\\*.*$`, "m");
  return line.test(content) ? content.replace(line, () => `**${field}:** ${value}`) : `${content.trimEnd()}\n**${field}:** ${value}\n`;
}

/**
 * The founder approves a campaign's direction, deliverables and budget at the terminal. The decision
 * is signed and bound to approval.md's exact text, so any later edit to it needs approving again.
 */
export async function approveCampaign(
  dir: string,
  campaign: string,
  opts: { confirm?: (content: string) => Promise<boolean>; now?: Date } = {},
): Promise<string> {
  const file = `campaigns/${campaign}/approval.md`;
  const path = join(dir, file);
  if (!(await exists(path))) return `There's no ${file}.`;
  if (!opts.confirm && !process.stdin.isTTY) return "Campaign approvals need the founder at an interactive terminal. Piped or scripted answers aren't accepted.";
  const content = await readFile(path, "utf8");
  const ok = opts.confirm ? await opts.confirm(content) : await terminalConfirm(`${content}\nApprove this direction, these deliverables and this budget? [y/N] `);
  if (!ok) return "Not approved. Nothing changed.";
  const by = `cli:${safeUser()}`;
  const date = (opts.now ?? new Date()).toISOString().slice(0, 10);
  const signedOff = setField(setField(setField(content, "Status", "approved"), "Approved by", by), "Date", date);
  await writeFile(path, signedOff);
  await recordDecision(dir, { file, hash: textHash(signedOff), decision: "approved", by, at: new Date().toISOString(), via: "cli" });
  return `Approved ${file}. Production can start; any edit to approval.md needs approving again.`;
}

/** Every file under root, as sorted paths relative to it. */
async function filesUnder(root: string, rel = ""): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(join(root, rel), { withFileTypes: true })) {
    const path = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await filesUnder(root, path)));
    else if (entry.isFile()) out.push(path);
  }
  return out.sort();
}

/**
 * Claude Code reads skills only from .claude/skills/, every other agent from .agents/skills/.
 * This copies the second over the first. A skill only Claude Code has is reported, never deleted.
 */
export async function sync(dir: string): Promise<string[]> {
  const from = join(dir, SKILLS_DIR);
  if (!(await exists(from))) return [`Nothing to sync: ${dir} has no ${SKILLS_DIR}`];
  const sources = await filesUnder(from);
  const changes: string[] = [];
  for (const rel of sources) {
    const content = await readFile(join(from, rel));
    const target = join(dir, CLAUDE_SKILLS_DIR, rel);
    const current = await readFile(target).catch(() => null);
    if (current?.equals(content)) continue;
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
    changes.push(`${current ? "updated" : "added  "}   ${CLAUDE_SKILLS_DIR}${rel}`);
  }
  const claudeOnly = (await exists(join(dir, CLAUDE_SKILLS_DIR))) ? (await filesUnder(join(dir, CLAUDE_SKILLS_DIR))).filter((rel) => !sources.includes(rel)) : [];
  return [
    ...(changes.length ? changes : [`Claude Code's skills already match ${SKILLS_DIR}`]),
    ...claudeOnly.map((rel) => `kept      ${CLAUDE_SKILLS_DIR}${rel}: only Claude Code has it; add it to ${SKILLS_DIR} to share it`),
  ];
}

/**
 * Loads an env file over the current environment. Node's own loadEnvFile keeps a variable the
 * shell already has, so `--env clients/acme.env` would quietly send Acme's review cards to whichever
 * TELEGRAM_CHAT_ID the shell exported. The file named on the command line wins.
 */
export async function loadEnv(path: string, env: Env = process.env): Promise<string[]> {
  const values = parseEnv(await readFile(path, "utf8"));
  const keys = Object.keys(values).sort();
  for (const key of keys) env[key] = values[key];
  return keys;
}

// ── Terminal plumbing ────────────────────────────────────────────────────────

function safeUser(): string {
  try {
    return userInfo().username;
  } catch {
    return "founder";
  }
}

/** One line reader for the whole session: it buffers, so piped answers ("a\ns\nr") all count. */
function terminalAsker(): { ask: (draft: Draft) => Promise<"a" | "r" | "s">; close: () => void } {
  const rl = createInterface({ input: process.stdin, terminal: false });
  const lines = rl[Symbol.asyncIterator]();
  return {
    ask: async (draft) => {
      process.stdout.write(`\n── ${draft.file} · ${draft.channel}${draft.to ? ` → ${draft.to}` : ""} · reviewer: ${draft.verdict ?? "none"}\n\n${draft.text}\n\n[a]pprove, [r]eject or [s]kip? `);
      const next = await lines.next();
      if (!process.stdin.isTTY) process.stdout.write("\n");
      const answer = next.done ? "s" : String(next.value).trim().toLowerCase();
      return answer.startsWith("a") ? "a" : answer.startsWith("r") ? "r" : "s";
    },
    close: () => rl.close(),
  };
}

async function terminalConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return /^y(es)?$/i.test((await rl.question(question)).trim());
  } finally {
    rl.close();
  }
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const [command, rawTarget] = argv;
  // `pnpm gtm` runs inside packages/gtm-harness; resolve paths from where the founder typed the command.
  const base = process.env.INIT_CWD ?? process.cwd();
  const at = (path: string) => resolve(base, path);
  const target = rawTarget && !rawTarget.startsWith("--") ? at(rawTarget) : undefined;
  const envFile = flag(argv, "env");
  try {
    if (envFile) await loadEnv(at(envFile));
    switch (command) {
      case "doctor":
        console.log(await doctor());
        return 0;
      case "new": {
        const inputPath = flag(argv, "input");
        if (!target || !inputPath) throw new Error("Usage: pnpm gtm new <dir> --input <answers.json>");
        const input = gtmInputSchema.parse(JSON.parse(await readFile(at(inputPath), "utf8")));
        const result = await createWorkspace(target, input, { force: argv.includes("--force") });
        console.log(`Wrote ${result.files} files to ${rawTarget}. Plan by ${result.planBy}. Drafts: ${result.verdicts.join(", ")}.`);
        if (result.note) console.log(result.note);
        return 0;
      }
      case "status":
        if (!target) throw new Error("Usage: pnpm gtm status <dir>");
        console.log(await status(target));
        return 0;
      case "check": {
        if (!target) throw new Error("Usage: pnpm gtm check <dir>");
        const findings = await check(target);
        console.log(formatFindings(findings));
        return findings.some((f) => f.level === "error") ? 1 : 0;
      }
      case "review":
        if (!target) throw new Error("Usage: pnpm gtm review <dir> [--local]");
        console.log((await review(target, { local: argv.includes("--local") })).join("\n"));
        return 0;
      case "wait": {
        if (!target) throw new Error("Usage: pnpm gtm wait <dir> [--minutes N]");
        const minutes = Number(flag(argv, "minutes") ?? 10);
        console.log((await wait(target, { minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 10 })).join("\n"));
        return 0;
      }
      case "links":
        if (!target) throw new Error("Usage: pnpm gtm links <dir>");
        console.log((await links(target)).join("\n"));
        return 0;
      case "due": {
        if (!target) throw new Error("Usage: pnpm gtm due <dir>");
        const csv = (await exists(join(target, "pipeline.csv"))) ? await readFile(join(target, "pipeline.csv"), "utf8") : "";
        const [header = [], ...rows] = parseCsv(csv);
        console.log(formatDue({ header, rows }, new Date()));
        return 0;
      }
      case "sent": {
        const file = argv[2];
        if (!target || !file) throw new Error("Usage: pnpm gtm sent <dir> <draft>");
        console.log(await markSent(target, file));
        return 0;
      }
      case "approve": {
        const campaign = flag(argv, "campaign");
        if (!target || !campaign) throw new Error("Usage: pnpm gtm approve <dir> --campaign <name>");
        console.log(await approveCampaign(target, campaign));
        return 0;
      }
      case "sync":
        if (!target) throw new Error("Usage: pnpm gtm sync <dir>");
        console.log((await sync(target)).join("\n"));
        return 0;
      case "mcp": {
        if (!target) throw new Error("Usage: pnpm gtm mcp <dir>");
        // stdout carries the protocol here: every message to a person goes to stderr.
        const { createWorkspaceServer } = await import("./mcp");
        const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
        const transport = new StdioServerTransport();
        const closed = new Promise<void>((resolve) => {
          transport.onclose = () => resolve();
        });
        await createWorkspaceServer({ dir: target }).connect(transport);
        console.error(`shonin-gtm: serving ${target}. No tool sends or approves; the founder does both.`);
        await closed;
        return 0;
      }
      case "eval": {
        const inputPath = flag(argv, "input");
        const models = (flag(argv, "models") ?? "").split(",").map((m) => m.trim()).filter(Boolean);
        if (!inputPath || !models.length) throw new Error("Usage: pnpm gtm eval --input <answers.json> --models provider/a,provider/b [--runs 5] [--out <dir>]");
        const input = gtmInputSchema.parse(JSON.parse(await readFile(at(inputPath), "utf8")));
        const runs = Math.max(1, Math.min(20, Number(flag(argv, "runs") ?? 5) || 5));
        const rows = [];
        for (const model of models) {
          console.log(`Running ${model} ×${runs}…`);
          rows.push(await evalModel(model, input, { runs }));
        }
        const date = new Date().toISOString().slice(0, 10);
        const table = evalTable(rows, date, runs);
        const out = flag(argv, "out");
        if (out) {
          await mkdir(at(out), { recursive: true });
          await writeFile(join(at(out), `${date}.md`), table);
        }
        console.log(table);
        return 0;
      }
      default:
        console.log(HELP);
        return command && command !== "help" && command !== "--help" ? 1 : 0;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().then((code) => process.exit(code));
}
