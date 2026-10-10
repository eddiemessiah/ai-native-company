import { appendFile, mkdir, readFile, realpath, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join, normalize, sep } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkDraft, draftContext, formatFindings, PIPELINE_HEADER } from "./check";
import { check, collectDrafts, readLedgers, readWorkspace, review, status } from "./cli";
import { telegramFromEnv, type TelegramConfig } from "./connectors";
import { contactKey, csvRow, doNotContact, parseCsv, parseDraft } from "./outbox";
import { formatDue, parseDay, parseScorecard, scoreLead, STAGES } from "./pipeline";
import { trace } from "./trace";

/**
 * The workspace as MCP tools, for any agent and any MCP client, including chat apps that can't
 * read files. Each tool does one job and enforces the workspace's rules in code: a lead needs a
 * source, nobody marked do_not_contact gets a draft, every new draft comes back with what the
 * checker found. There is no tool that sends a message or approves one: approvals come only from
 * the founder (Telegram or the terminal), and the founder taps every send link. Node only.
 */

export interface WorkspaceServerOptions {
  /** The workspace folder. */
  readonly dir: string;
  readonly env?: Record<string, string | undefined>;
  /** Telegram for approval requests; defaults to TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from env. */
  readonly telegram?: TelegramConfig | null;
  readonly fetch?: typeof fetch;
  readonly version?: string;
}

interface ToolResult {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

const ok = (text: string): ToolResult => ({ content: [{ type: "text", text }] });
const fail = (text: string): ToolResult => ({ content: [{ type: "text", text }], isError: true });

const READ = { readOnlyHint: true, openWorldHint: false } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: false } as const;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "draft";

/** A path inside the workspace, or null for anything that would leave it. */
export function insideWorkspace(dir: string, path: string): string | null {
  if (!path || path.startsWith("/") || path.startsWith("\\") || /^[a-z]:/i.test(path)) return null;
  const full = normalize(join(dir, path));
  const root = normalize(dir.endsWith(sep) ? dir : dir + sep);
  return full.startsWith(root) ? full : null;
}

/** The same, after following symlinks: a link inside the workspace can't point out of it. */
export async function resolveInside(dir: string, path: string): Promise<string | null> {
  const full = insideWorkspace(dir, path);
  if (!full) return null;
  const real = await realpath(full).catch(() => null);
  if (!real) return full;
  const root = await realpath(dir);
  return real === root || real.startsWith(root.endsWith(sep) ? root : root + sep) ? real : null;
}

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

async function readPipeline(dir: string): Promise<{ header: string[]; rows: string[][] }> {
  const path = join(dir, "pipeline.csv");
  const csv = (await exists(path)) ? await readFile(path, "utf8") : `${PIPELINE_HEADER}\n`;
  const [header, ...rows] = parseCsv(csv);
  return { header: header ?? PIPELINE_HEADER.split(","), rows };
}

/** Written whole to a temporary file, then renamed: a crash never leaves half a pipeline. */
async function writePipeline(dir: string, header: readonly string[], rows: readonly string[][]): Promise<void> {
  const tmp = join(dir, `.pipeline.csv.${process.pid}.tmp`);
  await writeFile(tmp, `${[header, ...rows].map(csvRow).join("\n")}\n`);
  await rename(tmp, join(dir, "pipeline.csv"));
}

/** The workspace's creation date, from the README the harness writes, or null. */
function createdOn(readme: string | undefined): Date | null {
  const m = readme?.match(/on (\d{4})-(\d{2})-(\d{2})\./);
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}

/** Today's part of sprint.md: day 1 is the day the workspace was made. */
export function todaysSprint(sprint: string, created: Date | null, today: Date): string {
  const days = sprint.split(/^(?=## Day \d+)/m).filter((d) => d.startsWith("## Day"));
  if (!days.length) return sprint.trim();
  if (!created) return sprint.trim();
  const n = Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - created.getTime()) / 86_400_000) + 1;
  if (n > days.length) return `The ${days.length}-day sprint is over. Run the weekly-review skill, then plan the next one with the founder.`;
  return days[Math.max(1, n) - 1]!.trim();
}

const isYes = (v: string | undefined) => !!v && !["", "no", "n", "false", "0"].includes(v.trim().toLowerCase());

export function createWorkspaceServer(opts: WorkspaceServerOptions): McpServer {
  const { dir } = opts;
  const env = opts.env ?? process.env;
  const server = new McpServer({ name: "shonin-gtm", version: opts.version ?? "0.1.0" });

  // Every tool call leaves one line in .shonin/trace.jsonl, personal fields hashed (trace.ts).
  const register = server.registerTool.bind(server);
  const traced = (name: string, config: unknown, callback: (...a: unknown[]) => Promise<ToolResult>) =>
    register(name, config as never, (async (...a: unknown[]) => {
      let result: ToolResult;
      try {
        result = await callback(...a);
      } catch (error) {
        result = fail(`${name} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      const args = (a.length > 1 ? a[0] : {}) as Record<string, unknown>;
      await trace(dir, { at: new Date().toISOString(), actor: "mcp", action: name, ok: !result.isError, args, result: result.content.map((c) => c.text).join("\n") });
      return result;
    }) as never);
  (server as unknown as { registerTool: typeof traced }).registerTool = traced;

  server.registerTool(
    "gtm_status",
    {
      title: "Where the go-to-market stands",
      description:
        "Start every session here. Lists every draft with its status (held, pending, approved, rejected, stale, sent) and counts leads by stage. Read the campaign's state.md and sprint.md next.",
      inputSchema: {},
      annotations: READ,
    },
    async () => {
      const { header, rows } = await readPipeline(dir);
      const stage = header.indexOf("stage");
      const dnc = header.indexOf("do_not_contact");
      const counts = new Map<string, number>();
      for (const row of rows) {
        const key = isYes(row[dnc]) ? "do_not_contact" : row[stage]?.trim() || "no stage";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const leads = rows.length ? [...counts].map(([k, n]) => `${k}: ${n}`).join(", ") : "none yet";
      return ok(`Drafts:\n${await status(dir)}\n\nLeads (${rows.length}): ${leads}`);
    },
  );

  server.registerTool(
    "gtm_read",
    {
      title: "Read a workspace file",
      description:
        "Read one file in the workspace by its path, such as AGENTS.md, brain/index.md, brain/audience.md, rules/outreach.md or campaigns/first-campaign/state.md. Start with AGENTS.md, then brain/index.md: it says which file answers which question.",
      inputSchema: { path: z.string().min(1).describe("A path inside the workspace, e.g. brain/audience.md") },
      annotations: READ,
    },
    async ({ path }) => {
      const full = await resolveInside(dir, path);
      if (!full) return fail(`${path} is outside the workspace. Use a relative path such as brain/index.md.`);
      if (!(await exists(full))) return fail(`${path} doesn't exist. brain/index.md lists the brain's files; workflows/router.md says which file each task reads.`);
      const info = await stat(full);
      if (!info.isFile()) return fail(`${path} is a folder; name a file in it.`);
      if (info.size > 100_000) return fail(`${path} is ${info.size} bytes; files over 100 KB aren't served whole.`);
      return ok(await readFile(full, "utf8"));
    },
  );

  server.registerTool(
    "gtm_check",
    {
      title: "Check the workspace against its rules",
      description:
        "Run before anything goes to the founder. Checks drafts (unfilled [slots], the word limit, numbers with no source in brain/products/, people marked do_not_contact, the same text sent to many), the pipeline, campaign approvals and skills. Each finding names the rule and the fix. Drafts with errors are held back from approval.",
      inputSchema: {},
      annotations: READ,
    },
    async () => ok(formatFindings(await check(dir))),
  );

  server.registerTool(
    "gtm_leads",
    {
      title: "List leads",
      description: "List leads from pipeline.csv, optionally only one stage (new, reach out, nurture, skip, or any stage the founder uses).",
      inputSchema: {
        stage: z.string().optional().describe("Only leads at this stage"),
        limit: z.number().int().min(1).max(200).optional().describe("At most this many; default 50"),
      },
      annotations: READ,
    },
    async ({ stage, limit }) => {
      const { header, rows } = await readPipeline(dir);
      const at = (row: string[], col: string) => row[header.indexOf(col)]?.trim() ?? "";
      const picked = rows.filter((r) => !stage || at(r, "stage").toLowerCase() === stage.toLowerCase()).slice(0, limit ?? 50);
      if (!picked.length) return ok(stage ? `No leads at stage "${stage}".` : "No leads yet. Use gtm_add_lead with a source for each.");
      return ok(
        picked
          .map((r) =>
            [at(r, "name"), at(r, "handle_or_email"), at(r, "channel"), at(r, "stage"), at(r, "score_pct") && `${at(r, "score_pct")}%`, isYes(at(r, "do_not_contact")) ? "DO NOT CONTACT" : ""]
              .filter(Boolean)
              .join(" · "),
          )
          .join("\n"),
      );
    },
  );

  server.registerTool(
    "gtm_add_lead",
    {
      title: "Add a lead",
      description:
        "Add one person or team to pipeline.csv. Public information only: the source is required (the URL or group where you found them). Refuses anyone already in the pipeline, and anyone marked do_not_contact. Score them next with the scorecard in brain/audience.md.",
      inputSchema: {
        name: z.string().min(1).describe("Their name, or the team's"),
        handle: z.string().min(1).describe("Their handle, email or number, as you'd use it to reach them"),
        channel: z.string().min(1).describe("Where you'd reach them: whatsapp, email, x, telegram, linkedin…"),
        source: z.string().min(3).describe("The public URL or group where you found them"),
        notes: z.string().optional().describe("Anything you inferred starts with 'Inference:'"),
      },
      annotations: WRITE,
    },
    async ({ name, handle, channel, source, notes }) => {
      const { header, rows } = await readPipeline(dir);
      const key = contactKey(handle);
      if (!key) return fail(`"${handle}" isn't a handle, email or number anyone could be reached at.`);
      const col = (c: string) => header.indexOf(c);
      const existing = rows.findIndex((r) => contactKey(r[col("handle_or_email")] ?? "") === key);
      if (existing >= 0) {
        const row = rows[existing]!;
        return isYes(row[col("do_not_contact")])
          ? fail(`${handle} is marked do_not_contact (pipeline.csv line ${existing + 2}). They asked not to be contacted; don't add them again.`)
          : fail(`${handle} is already in pipeline.csv (line ${existing + 2}, stage "${row[col("stage")] ?? ""}"). Update that row with gtm_update_lead instead.`);
      }
      const values: Record<string, string> = { name, handle_or_email: handle, channel, source, stage: "new", notes: notes ?? "" };
      const row = header.map((h) => values[h] ?? "");
      await writePipeline(dir, header, [...rows, row]);
      return ok(`Added ${name} at stage "new" (pipeline.csv line ${rows.length + 2}). Score them against brain/audience.md next.`);
    },
  );

  server.registerTool(
    "gtm_update_lead",
    {
      title: "Update a lead",
      description:
        "Update one lead in pipeline.csv, found by its handle, email or number. Set the stage, the next step, notes or the last touch (YYYY-MM-DD), or mark them do_not_contact when they ask you to stop. Scores come only from gtm_score_lead. Marking do_not_contact can't be undone here: only the founder edits that by hand.",
      inputSchema: {
        handle: z.string().min(1).describe("Their handle, email or number, as in pipeline.csv"),
        stage: z.enum(STAGES).optional().describe("Where they are now; scores set reach out, nurture or skip through gtm_score_lead"),
        next_step: z.string().optional().describe('"stop" after the one follow-up'),
        last_touch: z
          .string()
          .refine((v) => parseDay(v) !== null, "a date written YYYY-MM-DD")
          .optional()
          .describe("When the founder last messaged them, YYYY-MM-DD"),
        notes: z.string().optional(),
        do_not_contact: z.literal(true).optional().describe("Set when they ask not to be contacted"),
      },
      annotations: WRITE,
    },
    async (args) => {
      const { header, rows } = await readPipeline(dir);
      const col = (c: string) => header.indexOf(c);
      const key = contactKey(args.handle);
      const i = rows.findIndex((r) => contactKey(r[col("handle_or_email")] ?? "") === key);
      if (i < 0) return fail(`${args.handle} isn't in pipeline.csv. Add them with gtm_add_lead, with a source.`);
      const row = [...rows[i]!];
      while (row.length < header.length) row.push("");
      const set = (c: string, v: string | number | undefined) => {
        if (v !== undefined && col(c) >= 0) row[col(c)] = String(v);
      };
      set("stage", args.stage);
      set("next_step", args.next_step);
      set("last_touch", args.last_touch);
      set("notes", args.notes);
      if (args.do_not_contact) set("do_not_contact", "yes");
      const next = [...rows];
      next[i] = row;
      await writePipeline(dir, header, next);
      return ok(`Updated ${args.handle} (pipeline.csv line ${i + 2}).${args.do_not_contact ? " They're marked do_not_contact: no card or link will ever be made for them." : ""}`);
    },
  );

  server.registerTool(
    "gtm_score_lead",
    {
      title: "Score a lead against the scorecard",
      description:
        "Judge each criterion in brain/audience.md met or not, with the public evidence for each one met. Code adds the weights, sets score_pct and the stage (reach out, nurture or skip), and notes the evidence. Never add up weights yourself.",
      inputSchema: {
        handle: z.string().min(1).describe("Their handle, email or number, as in pipeline.csv"),
        criteria: z
          .array(z.object({ criterion: z.string().min(1), met: z.boolean(), evidence: z.string().optional().describe("The public source; required when met") }))
          .min(1)
          .describe("One judgement per scorecard criterion"),
        disqualifier: z.string().optional().describe("A disqualifier from brain/audience.md they match; it makes the stage skip"),
      },
      annotations: WRITE,
    },
    async ({ handle, criteria, disqualifier }) => {
      const audiencePath = join(dir, "brain", "audience.md");
      const scorecard = (await exists(audiencePath)) ? parseScorecard(await readFile(audiencePath, "utf8")) : [];
      const result = scoreLead(scorecard, criteria, disqualifier);
      if (!result.ok) return fail(`Not scored: ${result.problem}.`);
      const { header, rows } = await readPipeline(dir);
      const col = (c: string) => header.indexOf(c);
      const key = contactKey(handle);
      const i = rows.findIndex((r) => contactKey(r[col("handle_or_email")] ?? "") === key);
      if (i < 0) return fail(`${handle} isn't in pipeline.csv. Add them with gtm_add_lead, with a source.`);
      const row = [...rows[i]!];
      while (row.length < header.length) row.push("");
      if (isYes(row[col("do_not_contact")])) return fail(`${handle} is marked do_not_contact. There's nothing to score.`);
      const evidence = criteria.filter((c) => c.met).map((c) => `${c.criterion}: ${c.evidence}`);
      const note = `Scored ${new Date().toISOString().slice(0, 10)}: ${result.score}%${disqualifier ? `, disqualified (${disqualifier})` : ""}${evidence.length ? `. Met: ${evidence.join("; ")}` : ""}`;
      row[col("score_pct")] = String(result.score);
      row[col("stage")] = result.stage;
      if (col("notes") >= 0) row[col("notes")] = [row[col("notes")]?.trim(), note].filter(Boolean).join(" | ");
      const next = [...rows];
      next[i] = row;
      await writePipeline(dir, header, next);
      return ok(`${handle}: ${result.score}%, so "${result.stage}".${result.stage === "reach out" ? " Next: gtm_write_draft." : ""}`);
    },
  );

  server.registerTool(
    "gtm_due",
    {
      title: "Who is due a follow-up",
      description:
        "Code counts the working days: leads contacted with no reply, last touched 3 or more working days ago and not stopped are due their one follow-up. Lists who must not get another message too.",
      inputSchema: {},
      annotations: READ,
    },
    async () => ok(formatDue(await readPipeline(dir), new Date())),
  );

  server.registerTool(
    "gtm_drafts",
    {
      title: "List drafts",
      description: "Every draft in drafts/ and the campaigns' outboxes, with its status. Held drafts break a rule: run gtm_check to see the fix.",
      inputSchema: {},
      annotations: READ,
    },
    async () => ok(await status(dir)),
  );

  server.registerTool(
    "gtm_write_draft",
    {
      title: "Write a draft message",
      description:
        "Write one message to one person in the right format, for the founder to approve. Fill every [slot] from their public work and use only claims from brain/products/. Returns what the checker finds; fix every error before asking for approval. Never overwrites a file. Refuses anyone marked do_not_contact. It doesn't send anything.",
      inputSchema: {
        channel: z.string().min(1).describe("WhatsApp, Email, X, Telegram, LinkedIn…"),
        who: z.string().min(1).describe("Who it's for, as the heading shows it, e.g. 'Ada (Lagos traders' group)'"),
        to: z.string().optional().describe("Their number, email or handle; needed for a WhatsApp or email link"),
        subject: z.string().optional().describe("Email subject"),
        source: z.string().min(3).describe("Where the personal line comes from: a URL or the group's name"),
        text: z.string().min(1).describe("The message itself"),
        campaign: z.string().optional().describe("Save to campaigns/<name>/outbox/ instead of drafts/"),
      },
      annotations: WRITE,
    },
    async ({ channel, who, to, subject, source, text, campaign }) => {
      const pipelinePath = join(dir, "pipeline.csv");
      const optedOut = (await exists(pipelinePath)) ? doNotContact(await readFile(pipelinePath, "utf8")) : new Set<string>();
      if (to && optedOut.has(contactKey(to))) return fail(`${to} is marked do_not_contact in pipeline.csv. They asked not to be contacted: no draft.`);
      if (campaign && !(await exists(join(dir, "campaigns", campaign)))) return fail(`There's no campaigns/${campaign}/. Leave campaign out to save in drafts/.`);
      const folder = campaign ? `campaigns/${campaign}/outbox` : "drafts";
      await mkdir(join(dir, folder), { recursive: true });
      const base = `${slug(channel)}-${slug(who)}`;
      let file = `${folder}/${base}.md`;
      for (let n = 2; await exists(join(dir, file)); n++) file = `${folder}/${base}-${n}.md`;
      const content = [
        `# ${channel} · ${who}`,
        "",
        ...(to ? [`**To:** ${to}`] : []),
        ...(subject ? [`**Subject:** ${subject}`] : []),
        `**Source:** ${source}`,
        "**Reviewer:** not reviewed yet",
        "",
        "---",
        "",
        text.trim(),
        "",
      ].join("\n");
      await mkdir(dirname(join(dir, file)), { recursive: true });
      await writeFile(join(dir, file), content);
      const draft = parseDraft(file, content)!;
      const findings = checkDraft(draft, draftContext(await readWorkspace(dir)));
      return ok(
        findings.length
          ? `Saved ${file}, but fix these before asking for approval:\n${formatFindings(findings)}`
          : `Saved ${file}. It passes the checks. Next: gtm_request_approval with this file.`,
      );
    },
  );

  server.registerTool(
    "gtm_request_approval",
    {
      title: "Ask the founder to approve drafts",
      description:
        "Send drafts to the founder for approval: the reviewer marks new drafts ready, revise or blocked; drafts that break a rule are held with the fix; the rest go to the founder's Telegram with Approve and Reject. You can't approve anything yourself, and nothing is sent to the person: the founder taps the link after approving.",
      inputSchema: { file: z.string().optional().describe("One draft, by its path; leave out for every draft waiting") },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ file }) => {
      const telegram = opts.telegram === undefined ? telegramFromEnv(env) : opts.telegram;
      if (!telegram) {
        return ok(
          "Telegram isn't connected for this workspace, so approvals happen in the founder's terminal. Ask the founder to run `pnpm gtm review <this folder> --local`. Nothing was sent anywhere.",
        );
      }
      if (file && !(await collectDrafts(dir)).some(({ draft }) => draft.file === file)) return fail(`${file} isn't a draft in this workspace. gtm_drafts lists them.`);
      const log = await review(dir, { env, telegram, ...(opts.fetch ? { fetch: opts.fetch } : {}), ...(file ? { only: file } : {}) });
      return ok(log.join("\n"));
    },
  );

  server.registerTool(
    "gtm_approvals",
    {
      title: "Read the founder's decisions",
      description: "Every recorded decision: who approved or rejected which draft, when and how. Approvals bind the exact text; an edited draft needs a new one.",
      inputSchema: {},
      annotations: READ,
    },
    async () => {
      const { approvals } = await readLedgers(dir);
      const ignored = approvals.untrusted.length
        ? `\n\n${approvals.untrusted.length} line${approvals.untrusted.length === 1 ? "" : "s"} in approvals.jsonl didn't verify and don't count. Only the founder decides.`
        : "";
      if (!approvals.trusted.length) return ok(`No decisions recorded yet. The founder records them with \`pnpm gtm wait\` (Telegram) or \`pnpm gtm review --local\`.${ignored}`);
      return ok(`${approvals.trusted.map((a) => `${a.at} ${a.decision.padEnd(9)} ${a.file} by ${a.by} (${a.via})`).join("\n")}${ignored}`);
    },
  );

  server.registerTool(
    "gtm_log_correction",
    {
      title: "Log a correction",
      description:
        "Record a change the founder made to a draft in corrections-log.md. On Mondays, repeated corrections become proposed rules; the founder accepts them.",
      inputSchema: {
        draft: z.string().min(1).describe("The draft's path"),
        change: z.string().min(1).describe("What the founder changed, in a few words"),
        type: z.enum(["factual error", "audience preference", "missing information", "style"]),
        rule: z.string().optional().describe("The rule you'd propose, if this has come up before"),
      },
      annotations: WRITE,
    },
    async ({ draft, change, type, rule }) => {
      const path = join(dir, "corrections-log.md");
      if (!(await exists(path))) return fail("corrections-log.md is missing. Run gtm_check: it says how to restore the workspace's files.");
      const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
      const date = new Date().toISOString().slice(0, 10);
      const current = await readFile(path, "utf8");
      await writeFile(path, `${current.trimEnd()}\n| ${date} | ${cell(draft)} | ${cell(change)} | ${type} | ${cell(rule ?? "")} |\n`);
      return ok(`Logged in corrections-log.md: ${change}.`);
    },
  );

  server.registerTool(
    "gtm_session_start",
    {
      title: "Start a session",
      description:
        "Call first in every session. One read: where drafts and leads stand, who is due a follow-up, what the checker finds, the campaign's state, today's part of the sprint, and the last session's handoff.",
      inputSchema: {},
      annotations: READ,
    },
    async () => {
      const files = await readWorkspace(dir);
      const findings = await check(dir);
      const errors = findings.filter((f) => f.level === "error");
      const campaigns = Object.keys(files).filter((p) => /^campaigns\/[^/]+\/state\.md$/.test(p));
      const handoffs = (files["progress.md"] ?? "").split(/^(?=## )/m).filter((b) => b.startsWith("## "));
      const sections = [
        `## Where things stand\n\n${await status(dir)}`,
        `## Follow-ups\n\n${formatDue(await readPipeline(dir), new Date())}`,
        `## The checker\n\n${errors.length} ${errors.length === 1 ? "error" : "errors"}, ${findings.length - errors.length} warnings.${errors
          .slice(0, 5)
          .map((f) => `\n- ${f.path}: ${f.problem}. Fix: ${f.fix}`)
          .join("")}${errors.length > 5 ? "\n- … run gtm_check for the rest" : ""}`,
        ...campaigns.map((p) => `## ${p}\n\n${files[p]!.replace(/^# .*\n+/, "").trim()}`),
        `## Today in sprint.md\n\n${todaysSprint(files["sprint.md"] ?? "", createdOn(files["README.md"]), new Date())}`,
        `## The last handoff\n\n${handoffs.length ? handoffs[handoffs.length - 1]!.trim() : "None yet: this is the first session."}`,
      ];
      return ok(sections.join("\n\n"));
    },
  );

  server.registerTool(
    "gtm_session_end",
    {
      title: "End a session",
      description:
        "Call last in every session. Saves the handoff to progress.md, so the next session starts where this one stopped: what's done, blockers, the next action, and anything the founder should know (mistakes, learnings, what you wished you had). Returns what the checker still finds.",
      inputSchema: {
        done: z.string().min(1).describe("What this session finished"),
        next: z.string().min(1).describe("The next action, specific enough to start on"),
        blockers: z.string().optional().describe("What's waiting on the founder or on something else"),
        mistakes: z.string().optional().describe("What went wrong, so a rule can stop it"),
        learnings: z.string().optional().describe("What worked, so it can be repeated"),
        desires: z.string().optional().describe("A tool, file or rule you wished you had"),
      },
      annotations: WRITE,
    },
    async ({ done, next, blockers, mistakes, learnings, desires }) => {
      const path = join(dir, "progress.md");
      const line = (label: string, value: string | undefined) => (value?.trim() ? `**${label}:** ${value.trim()}\n` : "");
      const block = `\n## ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC\n\n${line("Done", done)}${line("Blockers", blockers)}${line("Next", next)}${line("Mistakes", mistakes)}${line("Learnings", learnings)}${line("Desires", desires)}`;
      if (!(await exists(path))) await writeFile(path, "# Progress\n");
      await appendFile(path, block);
      const findings = await check(dir);
      const errors = findings.filter((f) => f.level === "error").length;
      return ok(`Handoff saved to progress.md.${errors ? ` The checker still finds ${errors} ${errors === 1 ? "error" : "errors"}: run gtm_check before the founder reviews anything.` : " The checker finds no errors."}`);
    },
  );

  return server;
}
