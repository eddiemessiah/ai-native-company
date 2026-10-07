import { appendFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { userInfo } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { brainFromEnv, providersFromEnv } from "@repo/brain/env";
import { pollDecisions, postForReview, sendReviewCard, telegramFromEnv, toolStatus, type TelegramConfig } from "./connectors";
import { buildHarness } from "./harness";
import { gtmInputSchema, type GtmInput } from "./input";
import { describeRoute, routeModel } from "./models";
import { approvalLine, canSend, draftId, parseApprovals, parseDraft, sendLink, statusOf, textHash, type ApprovalRecord, type Draft, type SendLink } from "./outbox";
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
  review <dir> [--local]       Review new drafts, then ask for approval: in Telegram (and Slack),
                               or here in the terminal with --local
  wait <dir> [--minutes N]     Collect Telegram decisions into approvals.jsonl (default 10)
  links <dir>                  One-tap send links for every approved draft

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

export async function readApprovals(dir: string): Promise<ApprovalRecord[]> {
  const path = join(dir, "approvals.jsonl");
  return (await exists(path)) ? parseApprovals(await readFile(path, "utf8")) : [];
}

export async function recordDecision(dir: string, record: ApprovalRecord): Promise<void> {
  await appendFile(join(dir, "approvals.jsonl"), approvalLine(record));
}

const VERDICT_TEXT: Readonly<Record<OutreachReview["verdict"], string>> = {
  ready: "READY: the founder can send it after filling the [slots]",
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
  const files = buildHarness(input, generated.plan, reviews, opts.now ?? new Date(), { tools: toolStatus(env) });
  await writeFiles(dir, files);
  const planBy = generated.generatedBy.kind === "model" && route ? describeRoute({ ...route, model: generated.generatedBy.model ?? route.model }) : "templates";
  return { files: Object.keys(files).length, planBy, verdicts: reviews.map((r) => r?.verdict ?? "not reviewed"), ...(note ? { note } : {}) };
}

export async function status(dir: string): Promise<string> {
  const drafts = await collectDrafts(dir);
  const approvals = await readApprovals(dir);
  if (!drafts.length) return "No drafts yet.";
  return drafts.map(({ draft }) => `${statusOf(draft, approvals).padEnd(10)} ${draft.channel.padEnd(12)} ${draft.file}`).join("\n");
}

/** Reviews unreviewed drafts with the brain, then asks the founder about every draft still waiting. */
export async function review(
  dir: string,
  opts: { env?: Env; local?: boolean; ask?: (draft: Draft) => Promise<"a" | "r" | "s">; telegram?: TelegramConfig | null; fetch?: typeof fetch } = {},
): Promise<string[]> {
  const env = opts.env ?? process.env;
  const log: string[] = [];
  const brain = brainFromEnv({ env, allowHeuristic: true, sinks: [] });
  const approvals = await readApprovals(dir);

  // 1. The reviewer: drafts without a verdict get one, written into the file.
  for (const { draft, content } of await collectDrafts(dir)) {
    if (draft.verdict) continue;
    const verdict = await reviewOutreach(brain, { channel: draft.channel, audience: draft.to ?? "", text: draft.text }).catch(() => null);
    if (verdict) {
      await writeFile(join(dir, draft.file), withVerdict(content, verdict));
      log.push(`reviewed  ${draft.file}: ${verdict.verdict}`);
    }
  }

  // 2. The founder: every draft that's pending for its current text.
  const waiting = (await collectDrafts(dir)).filter(({ draft }) => {
    const s = statusOf(draft, approvals);
    if (s === "blocked") log.push(`blocked   ${draft.file}: the reviewer blocked it; rewrite it first`);
    return s === "pending" || s === "stale";
  });
  if (!waiting.length) {
    log.push("Nothing waiting for approval.");
    return log;
  }

  if (opts.local || !(opts.telegram ?? telegramFromEnv(env))) {
    if (!opts.local) log.push("Telegram isn't connected, so approve here (or set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID).");
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
  const known = new Map(Object.entries(state.cards).map(([id, c]) => [id, c.link] as const));
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
  const out: string[] = [];
  for (const { draft } of await collectDrafts(dir)) {
    if (!canSend(draft, approvals)) continue;
    const link = sendLink(draft);
    out.push(link ? `${draft.file}\n  ${link.label}: ${link.url}` : `${draft.file}\n  Copy the text and send it on ${draft.channel} yourself.`);
  }
  return out.length ? out : ["No approved drafts yet. Run `pnpm gtm review <dir>`."];
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
  if (envFile) process.loadEnvFile(at(envFile));
  try {
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
