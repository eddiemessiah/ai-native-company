import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Approvals are signed with a key outside the workspace; tests use a throwaway one, never ~/.config.
process.env.GTM_APPROVAL_KEY_FILE = join(mkdtempSync(join(tmpdir(), "gtm-key-")), "approval.key");
import {
  approveCampaign,
  check as checkWorkspaceDir,
  collectDrafts,
  createWorkspace,
  links,
  loadEnv,
  main,
  markSent,
  readApprovals,
  readWorkspace,
  recordDecision,
  review,
  status,
  sync,
  wait,
  withVerdict,
} from "../src/cli";
import { approvalKeyPath, loadApprovalKey, signRecord, verifyRecord } from "../src/ledger";
import { checkWorkspace, formatFindings, wordLimitFrom } from "../src/check";
import { pollDecisions, postForReview, sendReviewCard, toolStatus, type TelegramConfig } from "../src/connectors";
import {
  buildHarness,
  describeRoute,
  evalModel,
  evalTable,
  generateStructured,
  gtmInputSchema,
  inventedNumbers,
  routeModel,
  supported,
  templatePlan,
  type GtmInput,
  type ModelRoute,
} from "../src/index";
import {
  canSend,
  contactKey,
  doNotContact,
  draftId,
  isDoNotContact,
  parseApprovals,
  parseCsv,
  parseDraft,
  sendLink,
  statusOf,
  textHash,
  type ApprovalRecord,
} from "../src/outbox";

const input: GtmInput = gtmInputSchema.parse({
  product: "Ajo Circle",
  pitch: "Rotating savings groups on MiniPay, with automatic payouts in stablecoins.",
  audience: "Market traders and savings-group leaders in Lagos",
  stage: "live",
  goal: "100 active savers",
  channels: ["whatsapp", "x", "communities"],
  regions: "Nigeria",
});

/** A fetch that records requests and answers from a script, so no test touches the network. */
function fakeFetch(answer: (url: string, body: Record<string, unknown>) => unknown, status = 200) {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const f = (async (url: string | URL, init?: RequestInit) => {
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    calls.push({ url: String(url), body });
    return new Response(JSON.stringify(answer(String(url), body)), { status, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return { f, calls };
}

describe("the model router", () => {
  it("routes provider/model ids through a router, bare ids to Anthropic, and nothing to templates", () => {
    expect(routeModel({})).toBeNull();
    expect(routeModel({ ANTHROPIC_API_KEY: "k" })).toEqual({ kind: "anthropic", model: "claude-opus-5" });
    expect(routeModel({ ANTHROPIC_API_KEY: "k", GTM_MODEL: "" })).toEqual({ kind: "anthropic", model: "claude-opus-5" });
    expect(routeModel({ GTM_MODEL: "openai/gpt-5", AI_GATEWAY_API_KEY: "g" })).toEqual({ kind: "gateway", model: "openai/gpt-5" });
    expect(routeModel({ GTM_MODEL: "xai/grok-4", VERCEL_OIDC_TOKEN: "t" })).toEqual({ kind: "gateway", model: "xai/grok-4" });
    expect(routeModel({ GTM_MODEL: "anthropic/claude-opus-5", OPENROUTER_API_KEY: "o" })).toMatchObject({ kind: "openai-compatible", label: "OpenRouter" });
    // A provider/model id with no router configured doesn't silently become a different model.
    expect(routeModel({ GTM_MODEL: "openai/gpt-5", ANTHROPIC_API_KEY: "k" })).toBeNull();
    expect(routeModel({ GTM_BASE_URL: "http://localhost:11434/v1/", GTM_MODEL: "llama3.3" })).toEqual({
      kind: "openai-compatible",
      model: "llama3.3",
      baseUrl: "http://localhost:11434/v1",
      label: "a local model server",
    });
    expect(routeModel({ GTM_BASE_URL: "https://api.x.ai/v1" })).toBeNull();
    expect(describeRoute({ kind: "gateway", model: "google/gemini-3-pro" })).toBe("google/gemini-3-pro via Vercel AI Gateway");
  });

  it("asks the gateway for a structured object and returns it with the served model", async () => {
    let args: Record<string, unknown> = {};
    const out = await generateStructured(
      { kind: "gateway", model: "openai/gpt-5" },
      { system: "s", prompt: "p", schema: { type: "object" }, name: "gtm_plan" },
      {
        gateway: async (a) => {
          args = a;
          return { output: { ok: true }, modelId: "gpt-5-2026-08", usage: { inputTokens: 1200, outputTokens: 3400, costUsd: 0.05 } };
        },
      },
    );
    expect(out).toEqual({ value: { ok: true }, model: "gpt-5-2026-08", usage: { inputTokens: 1200, outputTokens: 3400, costUsd: 0.05 } });
    expect(args).toMatchObject({ model: "openai/gpt-5", instructions: "s", prompt: "p", name: "gtm_plan", maxOutputTokens: 8000 });
  });

  it("speaks /chat/completions with a strict JSON schema, and reports failures plainly", async () => {
    const route: ModelRoute = { kind: "openai-compatible", model: "x-model", baseUrl: "https://api.x.ai/v1", apiKey: "secret", label: "xAI" };
    const ok = fakeFetch(() => ({
      model: "x-model-1",
      choices: [{ finish_reason: "stop", message: { content: '```json\n{"a":1}\n```' } }],
      usage: { prompt_tokens: 900, completion_tokens: 2100, cost: 0.012 },
    }));
    const out = await generateStructured(route, { system: "s", prompt: "p", schema: { type: "object" }, name: "n" }, { fetch: ok.f });
    expect(out).toEqual({ value: { a: 1 }, model: "x-model-1", usage: { inputTokens: 900, outputTokens: 2100, costUsd: 0.012 } });
    expect(ok.calls[0]!.url).toBe("https://api.x.ai/v1/chat/completions");
    expect(ok.calls[0]!.body).toMatchObject({ model: "x-model", response_format: { type: "json_schema", json_schema: { name: "n", strict: true } } });

    const req = { system: "s", prompt: "p", schema: {}, name: "n" };
    await expect(generateStructured(route, req, { fetch: fakeFetch(() => ({}), 401).f })).rejects.toThrow("xAI answered 401");
    await expect(generateStructured(route, req, { fetch: fakeFetch(() => ({ choices: [{ message: { content: "", refusal: "no" } }] })).f })).rejects.toThrow("declined");
    await expect(generateStructured(route, req, { fetch: fakeFetch(() => ({ choices: [{ finish_reason: "length", message: { content: "{" } }] })).f })).rejects.toThrow("cut off");
  });
});

describe("the workspace", () => {
  const { plan } = templatePlan(input);
  const files = buildHarness(input, plan, [], new Date("2026-10-07T09:00:00Z"), {
    tools: [{ name: "Telegram approvals", connected: true, does: "Approve from your phone" }],
  });

  it("gives every skill valid frontmatter and routes to every skill", () => {
    const skills = Object.keys(files).filter((f) => f.startsWith(".agents/skills/"));
    expect(skills.length).toBe(11);
    for (const path of skills) {
      const name = path.split("/")[2]!;
      const content = files[path]!;
      expect(content.startsWith(`---\nname: ${name}\ndescription: `), path).toBe(true);
      expect(files["workflows/router.md"], name).toContain(name);
    }
  });

  it("runs in every agent: the same skills for Claude Code, and AGENTS.md for Gemini CLI", () => {
    const shared = Object.keys(files).filter((f) => f.startsWith(".agents/skills/"));
    const claude = Object.keys(files).filter((f) => f.startsWith(".claude/skills/"));
    expect(claude.map((f) => f.replace(".claude/", ".agents/")).sort()).toEqual(shared.sort());
    for (const path of shared) expect(files[path.replace(".agents/", ".claude/")]).toBe(files[path]);
    expect(JSON.parse(files[".gemini/settings.json"]!)).toEqual({ context: { fileName: ["AGENTS.md"] } });
    expect(files["AGENTS.md"]).toContain("make the same change in both");
    expect(files["README.md"]).toContain("pnpm gtm sync");
  });

  it("keeps facts and approvals honest", () => {
    expect(files["brain/brand.md"]).toContain("Assumption:");
    expect(files["campaigns/first-campaign/approval.md"]).toContain("**Status:** not approved");
    expect(files["workflows/approvals.md"]).toContain("None granted");
    expect(files["workflows/tools.md"]).toContain("| Telegram approvals | yes | Approve from your phone |");
    expect(files["workflows/tools.md"]).toContain("No bot logs into anyone's WhatsApp or Telegram account");
  });
});

describe("the outbox", () => {
  const { plan } = templatePlan(input);
  const files = buildHarness(input, plan, [{ verdict: "ready", fixes: [], provider: "jev", calibrated: true }]);
  const file = Object.keys(files).find((f) => f.startsWith("drafts/01-"))!;
  const draft = parseDraft(file, files[file]!)!;
  const approve = (hash: string, decision: ApprovalRecord["decision"] = "approved"): ApprovalRecord => ({ file, hash, decision, by: "@founder", at: "2026-10-07T10:00:00Z", via: "telegram" });

  it("reads the drafts the harness writes", () => {
    expect(draft).toMatchObject({ channel: "WhatsApp", verdict: "ready" });
    expect(draft.text).toContain("Ajo Circle");
    expect(draftId(draft)).toHaveLength(16);
    expect(parseDraft("x.md", "no heading or separator")).toBeNull();
  });

  it("binds an approval to the exact text, and stops at sent", () => {
    const hash = textHash(draft.text);
    expect(statusOf(draft, [])).toBe("pending");
    expect(canSend(draft, [approve(hash)])).toBe(true);
    const edited = { ...draft, text: `${draft.text} Edited.` };
    expect(statusOf(edited, [approve(hash)])).toBe("stale");
    expect(canSend(edited, [approve(hash)])).toBe(false);
    expect(statusOf(draft, [approve(hash), approve(hash, "sent")])).toBe("sent");
    expect(canSend({ ...draft, verdict: "blocked" }, [approve(hash)])).toBe(false);
    expect(parseApprovals(`${JSON.stringify(approve(hash))}\n{"torn":`)).toHaveLength(1);
  });

  it("builds one-tap links only where the app supports them", () => {
    expect(sendLink({ ...draft, to: "+234 801 234 5678" })!.url.startsWith("https://wa.me/2348012345678?text=")).toBe(true);
    expect(sendLink(draft)!.url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(sendLink({ ...draft, channel: "Email", to: "ada@example.com", subject: "Hi" })!.url).toMatch(/^mailto:ada@example\.com\?subject=Hi&body=/);
    expect(sendLink({ ...draft, channel: "X", to: "@ada" })!.url.startsWith("https://x.com/intent/post?text=")).toBe(true);
    expect(sendLink({ ...draft, channel: "LinkedIn" })).toBeNull();
  });

  it("finds everyone marked do_not_contact, however their address is written", () => {
    expect(parseCsv('a,"b, with comma","say ""no"""\r\n\nc,"two\nlines",d')).toEqual([
      ["a", "b, with comma", 'say "no"'],
      ["c", "two\nlines", "d"],
    ]);
    expect(contactKey("+234 801 234 5678")).toBe(contactKey("wa.me/2348012345678"));
    expect(contactKey("Ada <ADA@Example.com>")).toBe("ada@example.com");
    expect(contactKey("https://x.com/ada_builds/")).toBe(contactKey("@Ada_Builds"));
    expect(contactKey("linkedin.com/in/ada")).not.toBe(contactKey("linkedin.com/in/bola"));

    const csv = [
      "name,handle_or_email,channel,source,score_pct,stage,last_touch,next_step,notes,do_not_contact",
      'Ada,+234 801 234 5678,whatsapp,"https://example.com/ada, the group",80,contacted,2026-10-07,stop,"said ""no thanks""",yes',
      "Bola,bola@example.com,email,https://example.com/bola,70,new,,,,",
      "Chi,@chi,x,https://x.com/chi,60,new,,,,no",
    ].join("\n");
    const blocked = doNotContact(csv);
    expect([...blocked]).toEqual(["2348012345678"]);
    expect(isDoNotContact({ ...draft, to: "+2348012345678" }, blocked)).toBe(true);
    expect(isDoNotContact({ ...draft, to: "bola@example.com" }, blocked)).toBe(false);
    expect(isDoNotContact(draft, blocked)).toBe(false);
    expect(doNotContact("name,notes\nAda,yes").size).toBe(0);
  });
});

describe("the ledger", () => {
  it("signs records with a key kept outside the workspace, and catches any change", async () => {
    expect(approvalKeyPath()).toBe(process.env.GTM_APPROVAL_KEY_FILE);
    const key = (await loadApprovalKey(process.env, true))!;
    expect(key).toHaveLength(32);
    const record = signRecord(key, { file: "drafts/01.md", hash: "abc", decision: "approved", by: "@founder", at: "2026-10-07T10:00:00Z", via: "telegram" });
    expect(verifyRecord(key, record)).toBe(true);
    expect(verifyRecord(key, { ...record, decision: "rejected" })).toBe(false);
    expect(verifyRecord(key, { ...record, sig: "0".repeat(64) })).toBe(false);
    expect(verifyRecord(null, record)).toBe(false);
    expect(verifyRecord(key, { file: "x" })).toBe(false);
    if (process.platform !== "win32") {
      const { stat } = await import("node:fs/promises");
      expect((await stat(approvalKeyPath())).mode & 0o777).toBe(0o600);
    }
  });
});

describe("the connectors", () => {
  const cfg: TelegramConfig = { token: "T", chatId: "42" };

  it("posts review cards with short callback data to the founder's chat only", async () => {
    const { f, calls } = fakeFetch(() => ({ ok: true, result: { message_id: 7 } }));
    const id = await sendReviewCard({ ...cfg, fetch: f }, { file: "drafts/01.md", channel: "WhatsApp", text: "Hi [name]" }, "0123456789abcdef");
    expect(id).toBe(7);
    expect(calls[0]!.url).toBe("https://api.telegram.org/botT/sendMessage");
    const keyboard = (calls[0]!.body.reply_markup as { inline_keyboard: { callback_data: string }[][] }).inline_keyboard[0]!;
    expect(calls[0]!.body.chat_id).toBe("42");
    expect(keyboard.map((b) => b.callback_data)).toEqual(["a:0123456789abcdef", "r:0123456789abcdef"]);
    expect(keyboard.every((b) => new TextEncoder().encode(b.callback_data).length <= 64)).toBe(true);
  });

  it("accepts decisions only from the chat and the approvers, for known drafts", async () => {
    const press = (update_id: number, data: string, chat = 42, from = 1) => ({
      update_id,
      callback_query: { id: `q${update_id}`, data, from: { id: from, username: "founder" }, message: { message_id: 9, chat: { id: chat } } },
    });
    const { f, calls } = fakeFetch((url) =>
      url.endsWith("/getUpdates")
        ? { ok: true, result: [press(1, "a:aaaa"), press(2, "a:aaaa", 99), press(3, "a:zzzz"), press(4, "r:bbbb", 42, 2)] }
        : { ok: true, result: true },
    );
    const known = new Map([
      ["aaaa", { label: "Open in WhatsApp", url: "https://wa.me/?text=hi" }],
      ["bbbb", null],
    ]);
    const out = await pollDecisions({ ...cfg, approverIds: ["1"], fetch: f }, { known, now: () => new Date("2026-10-07T10:00:00Z") });
    expect(out.nextOffset).toBe(5);
    expect(out.decisions).toEqual([{ id: "aaaa", decision: "approved", by: "@founder", at: "2026-10-07T10:00:00.000Z" }]);
    const edit = calls.find((c) => c.url.endsWith("/editMessageReplyMarkup"))!;
    expect(edit.body.reply_markup).toEqual({ inline_keyboard: [[{ text: "Open in WhatsApp", url: "https://wa.me/?text=hi" }]] });
  });

  it("sends Slack review copies and reports what's connected", async () => {
    const { f, calls } = fakeFetch(() => ({}));
    await postForReview("https://hooks.slack.test/x", { file: "drafts/01.md", channel: "Email", text: "Hello" }, { fetch: f });
    expect(String(calls[0]!.body.text)).toContain("Hello");
    expect(toolStatus({}).find((t) => t.name === "Model")).toMatchObject({ connected: false });
    expect(toolStatus({ GTM_MODEL: "openai/gpt-5", AI_GATEWAY_API_KEY: "g", TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1" }).filter((t) => t.connected).map((t) => t.name)).toEqual([
      "Model",
      "Telegram approvals",
      "One-tap send links",
    ]);
  });
});

describe("the CLI", () => {
  /** A fresh workspace. With personalize, the drafts' [slots] are filled, as the preparer would before approval. */
  async function workspace(opts: { personalize?: boolean } = {}) {
    const dir = await mkdtemp(join(tmpdir(), "gtm-"));
    const result = await createWorkspace(dir, input, { env: {}, now: new Date("2026-10-07T09:00:00Z") });
    if (opts.personalize) {
      for (const { draft, content } of await collectDrafts(dir)) {
        const cut = content.lastIndexOf("\n---\n");
        await writeFile(join(dir, draft.file), content.slice(0, cut) + content.slice(cut).replace(/\[[^\]\n]+\](?!\()/g, "Ada"));
      }
    }
    return { dir, result };
  }

  it("builds a workspace with templates when no model is configured, and refuses to overwrite", async () => {
    const { dir, result } = await workspace();
    expect(result.planBy).toBe("templates");
    expect(result.files).toBeGreaterThan(40);
    expect(result.note).toContain("No model is configured");
    await expect(createWorkspace(dir, input, { env: {} })).rejects.toThrow("isn't empty");

    // Opened in Claude Code, the workspace offers its own MCP tools; --silent keeps stdout for the protocol.
    const mcp = JSON.parse(await readFile(join(dir, ".mcp.json"), "utf8")) as { mcpServers: Record<string, { command: string; args: string[] }> };
    const server = mcp.mcpServers["shonin-gtm"]!;
    expect(server.command).toBe("pnpm");
    expect(server.args.slice(0, 2)).toEqual(["--silent", "--dir"]);
    expect(await readFile(join(server.args[2]!, "packages/gtm-harness/package.json"), "utf8")).toContain("@repo/gtm-harness");
    expect(server.args.slice(3)).toEqual(["gtm", "mcp", dir]);
  });

  it("records terminal approvals, gives links for approved drafts, and voids them when the text changes", async () => {
    const { dir } = await workspace({ personalize: true });
    const before = await collectDrafts(dir);
    const sendable = before.filter(({ draft }) => draft.verdict !== "blocked");
    expect(sendable.length).toBeGreaterThan(0);

    const log = await review(dir, { env: {}, local: true, ask: async (d) => (d.channel === "WhatsApp" ? "a" : "s") });
    expect(log.some((l) => l.startsWith("approved"))).toBe(true);
    expect((await readApprovals(dir)).every((a) => a.via === "cli")).toBe(true);
    expect(await status(dir)).toContain("approved");

    const approved = await links(dir);
    expect(approved.join("\n")).toContain("https://wa.me/?text=");

    const whatsapp = before.find(({ draft }) => draft.channel === "WhatsApp")!;
    await writeFile(join(dir, whatsapp.draft.file), `${whatsapp.content.trimEnd()} One more line.\n`);
    expect((await links(dir)).join("\n")).not.toContain(whatsapp.draft.file);
    expect(await status(dir)).toContain("stale");
  });

  it("lets the --env file win over the shell, so a client's cards go to the client's chat", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gtm-env-"));
    const file = join(dir, "acme.env");
    await writeFile(file, "TELEGRAM_CHAT_ID=acme-chat\nGTM_APPROVER_IDS=777\n");
    const env: Record<string, string | undefined> = { TELEGRAM_CHAT_ID: "edidiong-chat", TELEGRAM_BOT_TOKEN: "T" };
    expect(await loadEnv(file, env)).toEqual(["GTM_APPROVER_IDS", "TELEGRAM_CHAT_ID"]);
    expect(env).toEqual({ TELEGRAM_CHAT_ID: "acme-chat", GTM_APPROVER_IDS: "777", TELEGRAM_BOT_TOKEN: "T" });
  });

  it("syncs edited skills to Claude Code's folder, and keeps skills only Claude Code has", async () => {
    const { dir } = await workspace();
    expect(await sync(dir)).toEqual(["Claude Code's skills already match .agents/skills/"]);

    await writeFile(join(dir, ".agents/skills/score-leads/SKILL.md"), "---\nname: score-leads\ndescription: Edited.\n---\n\nScore them.\n");
    await mkdir(join(dir, ".agents/skills/win-back"), { recursive: true });
    await writeFile(join(dir, ".agents/skills/win-back/SKILL.md"), "---\nname: win-back\ndescription: New.\n---\n\nWin them back.\n");
    await mkdir(join(dir, ".claude/skills/mine"), { recursive: true });
    await writeFile(join(dir, ".claude/skills/mine/SKILL.md"), "---\nname: mine\ndescription: Claude only.\n---\n\nMine.\n");

    const log = await sync(dir);
    expect(log).toContain("updated   .claude/skills/score-leads/SKILL.md");
    expect(log).toContain("added     .claude/skills/win-back/SKILL.md");
    expect(log.some((l) => l.startsWith("kept      .claude/skills/mine/SKILL.md"))).toBe(true);
    expect(await readFile(join(dir, ".claude/skills/score-leads/SKILL.md"), "utf8")).toContain("Edited.");
    expect((await sync(dir))[0]).toBe("Claude Code's skills already match .agents/skills/");
  });

  it("gives no link or approval card for anyone marked do_not_contact", async () => {
    const { dir } = await workspace({ personalize: true });
    const whatsapp = (await collectDrafts(dir)).find(({ draft }) => draft.channel === "WhatsApp")!;
    const lines = whatsapp.content.split("\n");
    lines.splice(lines.lastIndexOf("---"), 0, "**To:** +234 801 234 5678", "");
    await writeFile(join(dir, whatsapp.draft.file), lines.join("\n"));

    await review(dir, { env: {}, local: true, ask: async (d) => (d.channel === "WhatsApp" ? "a" : "s") });
    expect((await links(dir)).join("\n")).toContain("https://wa.me/2348012345678?text=");

    await writeFile(
      join(dir, "pipeline.csv"),
      'name,handle_or_email,channel,source,score_pct,stage,last_touch,next_step,notes,do_not_contact\nAda,2348012345678,whatsapp,"a group, Lagos",80,contacted,2026-10-07,stop,"asked us to stop",yes\n',
    );
    const out = (await links(dir)).join("\n");
    expect(out).toContain("Not sent: +234 801 234 5678 is marked do_not_contact");
    expect(out).not.toContain("wa.me/2348012345678");

    await writeFile(join(dir, whatsapp.draft.file), `${lines.join("\n").trimEnd()} Thanks.\n`);
    const before = (await readApprovals(dir)).length;
    const log = await review(dir, { env: {}, local: true, ask: async () => "a" });
    expect(log.join("\n")).toContain(`skipped   ${whatsapp.draft.file}: +234 801 234 5678 is marked do_not_contact`);
    expect((await readApprovals(dir)).slice(before).some((a) => a.file === whatsapp.draft.file)).toBe(false);
  });

  it("sends review cards to Telegram, then records the founder's decision", async () => {
    const { dir } = await workspace({ personalize: true });
    const target = (await collectDrafts(dir)).find(({ draft }) => draft.channel === "WhatsApp")!.draft;
    let pressed = "";
    const { f } = fakeFetch((url, body) => {
      if (url.endsWith("/sendMessage")) {
        if (String(body.text).includes(target.file)) pressed = String((body.reply_markup as { inline_keyboard: { callback_data: string }[][] }).inline_keyboard[0]![0]!.callback_data);
        return { ok: true, result: { message_id: 11 } };
      }
      if (url.endsWith("/getUpdates")) {
        return { ok: true, result: [{ update_id: 1, callback_query: { id: "q", data: pressed, from: { id: 1, username: "founder" }, message: { message_id: 11, chat: { id: 42 } } } }] };
      }
      return { ok: true, result: true };
    });
    const telegram: TelegramConfig = { token: "T", chatId: "42" };
    const sent = await review(dir, { env: {}, telegram, fetch: f });
    expect(sent.some((l) => l.startsWith("to Telegram"))).toBe(true);
    const decided = await wait(dir, { env: {}, telegram, fetch: f, waitSeconds: 0 });
    expect(decided.join("\n")).toContain(`approved  ${target.file} by @founder`);
    const record = (await readApprovals(dir)).find((a) => a.file === target.file)!;
    expect(record).toMatchObject({ decision: "approved", via: "telegram", hash: textHash(target.text) });
  });

  it("keeps waiting until every card sent to Telegram is decided", async () => {
    const { dir } = await workspace({ personalize: true });
    const pressed: string[] = [];
    let round = 0;
    const { f } = fakeFetch((url, body) => {
      if (url.endsWith("/sendMessage")) {
        pressed.push(String((body.reply_markup as { inline_keyboard: { callback_data: string }[][] }).inline_keyboard[0]![0]!.callback_data));
        return { ok: true, result: { message_id: pressed.length } };
      }
      if (url.endsWith("/getUpdates")) {
        // One press per poll: the loop must come back for the rest.
        const data = pressed[round];
        round += 1;
        return { ok: true, result: data ? [{ update_id: round, callback_query: { id: `q${round}`, data, from: { id: 1, username: "founder" }, message: { message_id: round, chat: { id: 42 } } } }] : [] };
      }
      return { ok: true, result: true };
    });
    const telegram: TelegramConfig = { token: "T", chatId: "42" };
    await review(dir, { env: {}, telegram, fetch: f });
    expect(pressed.length).toBeGreaterThan(1);
    const decided = await wait(dir, { env: {}, telegram, fetch: f, waitSeconds: 1, minutes: 0.1 });
    expect(decided.filter((l) => l.startsWith("approved"))).toHaveLength(pressed.length);
  });

  it("holds drafts that break a rule before they reach the founder, and says why", async () => {
    const { dir } = await workspace();
    const log = await review(dir, { env: {}, local: true, ask: async () => "a" });
    expect(log.some((l) => /^held {6}drafts\/01-whatsapp\.md: unfilled slots \[name\]/.test(l))).toBe(true);
    expect(log).not.toContain("approved  drafts/01-whatsapp.md");
    expect(await status(dir)).toMatch(/^held +WhatsApp +drafts\/01-whatsapp\.md +\(1 to fix: pnpm gtm check\)/m);
    // Only drafts with no slots reached the founder.
    for (const a of await readApprovals(dir)) {
      const d = (await collectDrafts(dir)).find(({ draft }) => draft.file === a.file)!.draft;
      expect(d.text).not.toMatch(/\[[^\]]+\]/);
    }

    // A slotted draft approved before this rule existed still gets no link: it would send "[name]" as written.
    const whatsapp = (await collectDrafts(dir)).find(({ draft }) => draft.channel === "WhatsApp")!.draft;
    await recordDecision(dir, { file: whatsapp.file, hash: textHash(whatsapp.text), decision: "approved", by: "@founder", at: "2026-10-07T10:00:00Z", via: "telegram" });
    expect((await links(dir)).join("\n")).toContain("Not sent: it still has [name]");
  });

  it("checks a whole workspace against its own rules, with a fix for every finding", async () => {
    const { dir } = await workspace({ personalize: true });
    expect((await checkWorkspaceDir(dir)).filter((f) => f.level === "error")).toEqual([]);

    const product = Object.keys(await readWorkspace(dir)).find((p) => p.startsWith("brain/products/"))!;
    await writeFile(join(dir, "drafts/04-email.md"), "# Email · Bola\n\n**To:** bola@example.com\n**Reviewer:** not reviewed yet\n\n---\n\nHi Bola, 5,000 traders already save with us. Want a demo?\n");
    await writeFile(join(dir, "drafts/05-email.md"), `# Email · Chi\n\n**To:** chi@example.com\n**Reviewer:** not reviewed yet\n\n---\n\n${"word ".repeat(95)}\n`);
    await writeFile(join(dir, "drafts/06-email.md"), "Hi, no heading and no separator.\n");
    await writeFile(
      join(dir, "pipeline.csv"),
      [
        "name,handle_or_email,channel,source,score_pct,stage,last_touch,next_step,notes,do_not_contact",
        "Bola,bola@example.com,email,,85,reach out,,,,",
        "Chi,chi@example.com,email,https://example.com/chi,140,new,,,,",
        "Bola again,BOLA@example.com,email,https://example.com/b,80,new,,,,",
        "Dee,dee@example.com,email,https://example.com/d,80,new",
      ].join("\n"),
    );
    await mkdir(join(dir, "campaigns/first-campaign/outputs"), { recursive: true });
    await writeFile(join(dir, "campaigns/first-campaign/outputs/post.md"), "A post made before approval.\n");
    await writeFile(join(dir, ".claude/skills/score-leads/SKILL.md"), "---\nname: score-leads\ndescription: Drifted.\n---\n\nOld.\n");

    const findings = await checkWorkspaceDir(dir);
    const has = (path: string, text: string) => findings.some((f) => f.path === path && `${f.problem} ${f.rule}`.includes(text) && f.fix.length > 0);
    expect(has("drafts/04-email.md", '"5,000 traders" isn\'t in brain/products/')).toBe(true);
    expect(has("drafts/05-email.md", "95 words")).toBe(true);
    expect(has("drafts/06-email.md", "not a draft")).toBe(true);
    expect(has("pipeline.csv:2", "has no source")).toBe(true);
    expect(has("pipeline.csv:3", "isn't 0–100")).toBe(true);
    expect(has("pipeline.csv:4", "the same person as line 2")).toBe(true);
    expect(has("pipeline.csv:5", "6 fields where the header has 10")).toBe(true);
    expect(has("campaigns/first-campaign/outputs/", "before the direction was approved")).toBe(true);
    expect(has(".claude/skills/score-leads/SKILL.md", "differs from .agents/skills/score-leads/SKILL.md")).toBe(true);
    expect(findings[0]!.level).toBe("error");

    // A claim with its source in the product file passes.
    const productFile = join(dir, product);
    await writeFile(productFile, `${await readFile(productFile, "utf8")}| 5,000 traders save with us | our dashboard, 6 Oct | 2026-10-07 |\n`);
    expect((await checkWorkspaceDir(dir)).some((f) => f.path === "drafts/04-email.md" && f.problem.includes("5,000"))).toBe(false);

    const text = formatFindings(findings);
    expect(text).toMatch(/^error {2}/);
    expect(text).toContain("fix:  ");
    expect(text).toMatch(/\d+ errors, \d+ warnings?\.$/);
  });

  it("holds drafts for phrases in rules/checks.md, and warns about keys inside the workspace", async () => {
    const { dir } = await workspace({ personalize: true });
    await writeFile(join(dir, "drafts/04-email.md"), "# Email · Bola\n\n**To:** bola@example.com\n**Reviewer:** not reviewed yet\n\n---\n\nHi Bola, hope you\u2019re well! Our seamless app: https://ajo.example\n");
    await writeFile(join(dir, ".env"), "TELEGRAM_BOT_TOKEN=x\n");
    const findings = await checkWorkspaceDir(dir);
    const on = (path: string) => findings.filter((f) => f.path === path).map((f) => `${f.level}: ${f.problem}`);
    expect(on("drafts/04-email.md")).toEqual(expect.arrayContaining(['error: says "seamless"', `error: says "hope you're well"`, 'warning: says "http*"']));
    expect(on(".env")).toEqual(["warning: an env file inside the workspace, where every agent working here can read it"]);
    const log = await review(dir, { env: {}, local: true, ask: async () => "s" });
    expect(log).toContainEqual(expect.stringMatching(/^held {6}drafts\/04-email\.md: says "seamless"/));

    // A founder's new rule is enforced from the next check on.
    await writeFile(join(dir, "rules/checks.md"), `${await readFile(join(dir, "rules/checks.md"), "utf8")}| mate | corrections-log.md 2026-10-08: too casual | Use their name | error |\n`);
    await writeFile(join(dir, "drafts/05-x.md"), "# X · Chi\n\n**Reviewer:** not reviewed yet\n\n---\n\nHey mate, quick question about your stall.\n");
    expect((await checkWorkspaceDir(dir)).some((f) => f.path === "drafts/05-x.md" && f.problem === 'says "mate"')).toBe(true);
  });

  it("traces CLI commands on a workspace: the command and its flags, nothing personal", async () => {
    const { dir } = await workspace({ personalize: true });
    const log = console.log;
    console.log = () => {};
    try {
      expect(await main(["check", dir])).toBe(0);
      expect(await main(["sent", dir, "drafts/01-whatsapp.md"])).toBe(0);
    } finally {
      console.log = log;
    }
    const lines = (await readFile(join(dir, ".shonin/trace.jsonl"), "utf8")).trim().split("\n").map((l) => JSON.parse(l) as { actor: string; action: string; args: { flags: string } });
    expect(lines.map((l) => `${l.actor}:${l.action}`)).toEqual(["cli:check", "cli:sent"]);
    expect(JSON.stringify(lines)).not.toContain("01-whatsapp");
  });

  it("puts at most GTM_MAX_CARDS_PER_DAY drafts in front of the founder each day", async () => {
    const { dir } = await workspace({ personalize: true });
    const asked: string[] = [];
    const log = await review(dir, { env: { GTM_MAX_CARDS_PER_DAY: "1" }, local: true, ask: async (d) => (asked.push(d.file), "s") });
    expect(asked).toHaveLength(1);
    expect(log.some((l) => l.includes("today's 1 drafts have been in front of you"))).toBe(true);
    const again: string[] = [];
    await review(dir, { env: { GTM_MAX_CARDS_PER_DAY: "1" }, local: true, ask: async (d) => (again.push(d.file), "s") });
    expect(again).toEqual([]);
  });

  it("flags signed-off campaigns with no signature, and the same text sent to many", () => {
    const base = buildHarness(input, templatePlan(input).plan, []);
    const files: Record<string, string> = {
      ...base,
      "campaigns/first-campaign/approval.md": "# Approval\n\n**Status:** approved\n**Approved by:**\n**Date:**\n",
      "drafts/07-x.md": "# X · Ada\n\n**Reviewer:** not reviewed yet\n\n---\n\nSame words for everyone.\n",
      "drafts/08-x.md": "# X · Bola\n\n**Reviewer:** not reviewed yet\n\n---\n\nSame words for everyone.\n",
    };
    const findings = checkWorkspace(files);
    expect(findings.some((f) => f.path === "campaigns/first-campaign/approval.md" && f.problem === "approved, but with no name or date")).toBe(true);
    expect(findings.some((f) => f.path === "drafts/07-x.md" && f.problem === "the same text as drafts/08-x.md")).toBe(true);
    expect(wordLimitFrom(files["rules/outreach.md"])).toBe(90);
  });

  it("counts only decisions signed with the founder's key, and says so about the rest", async () => {
    const { dir } = await workspace({ personalize: true });
    const target = (await collectDrafts(dir)).find(({ draft }) => draft.channel === "WhatsApp")!.draft;
    // An agent appends an approval by hand: it doesn't verify, so nothing changes.
    await writeFile(join(dir, "approvals.jsonl"), `${JSON.stringify({ file: target.file, hash: textHash(target.text), decision: "approved", by: "@founder", at: "2026-10-07T10:00:00Z", via: "telegram" })}\n`);
    expect(await readApprovals(dir)).toEqual([]);
    expect((await links(dir)).join("\n")).not.toContain(target.file);
    expect(await status(dir)).not.toMatch(/^approved/m);
    const findings = await checkWorkspaceDir(dir);
    expect(findings.find((f) => f.path === "approvals.jsonl:1")).toMatchObject({ level: "error", rule: "workflows/approvals.md: only the founder approves" });

    // Piped answers at a terminal that isn't one aren't approvals either.
    if (!process.stdin.isTTY) {
      const log = await review(dir, { env: {}, local: true });
      expect(log.join("\n")).toContain("Approvals need the founder at an interactive terminal");
      expect(await readApprovals(dir)).toEqual([]);
    }
  });

  it("re-reviews a draft whose Reviewer line was typed by hand", async () => {
    const { dir } = await workspace({ personalize: true });
    await writeFile(join(dir, "drafts/04-email.md"), "# Email · Bola\n\n**To:** bola@example.com\n**Reviewer:** READY: typed by an agent\n\n---\n\nHi Bola, saw your post on Lagos Traders. Would a 2-minute demo help?\n");
    expect(await status(dir)).toMatch(/^unreviewed +Email +drafts\/04-email\.md/m);
    const log = await review(dir, { env: {}, local: true, ask: async () => "s" });
    expect(log).toContainEqual(expect.stringMatching(/^reviewed {2}drafts\/04-email\.md: (ready|revise|blocked)$/));
  });

  it("approves a campaign only at the founder's terminal, bound to approval.md's text", async () => {
    const { dir } = await workspace({ personalize: true });
    const path = join(dir, "campaigns/first-campaign/approval.md");
    const original = await readFile(path, "utf8");
    // Typed in by anyone else, an approval doesn't count.
    await writeFile(path, original.replace("**Status:** not approved", "**Status:** approved").replace("**Approved by:**", "**Approved by:** Edidiong").replace("**Date:**", "**Date:** 2026-10-07"));
    expect((await checkWorkspaceDir(dir)).find((f) => f.path === "campaigns/first-campaign/approval.md")?.problem).toBe("says approved, but no approval is recorded for it on this machine");

    await writeFile(path, original);
    expect(await approveCampaign(dir, "first-campaign", { confirm: async () => false })).toBe("Not approved. Nothing changed.");
    expect(await approveCampaign(dir, "first-campaign", { confirm: async () => true, now: new Date("2026-10-08T09:00:00Z") })).toContain("Approved campaigns/first-campaign/approval.md");
    const signedOff = await readFile(path, "utf8");
    expect(signedOff).toMatch(/\*\*Status:\*\* approved\n/);
    expect(signedOff).toContain("**Date:** 2026-10-08");
    await mkdir(join(dir, "campaigns/first-campaign/outputs"), { recursive: true });
    await writeFile(join(dir, "campaigns/first-campaign/outputs/post.md"), "Made after approval.\n");
    expect((await checkWorkspaceDir(dir)).some((f) => f.path.startsWith("campaigns/first-campaign/"))).toBe(false);

    await writeFile(path, signedOff.replace("**Budget:** $0 unless written here", "**Budget:** $500"));
    expect((await checkWorkspaceDir(dir)).find((f) => f.path === "campaigns/first-campaign/approval.md")?.problem).toBe("edited after the founder approved it");
    if (!process.stdin.isTTY) expect(await approveCampaign(dir, "first-campaign")).toContain("interactive terminal");
  });

  it("records a send for an approved draft, after which it gives no more links", async () => {
    const { dir } = await workspace({ personalize: true });
    await review(dir, { env: {}, local: true, ask: async (d) => (d.channel === "WhatsApp" ? "a" : "s") });
    const file = (await collectDrafts(dir)).find(({ draft }) => draft.channel === "WhatsApp")!.draft.file;
    expect(await markSent(dir, "drafts/nope.md", { confirm: async () => true })).toContain("isn't a draft");
    expect(await markSent(dir, file, { confirm: async () => true })).toBe(`Recorded: ${file} sent.`);
    expect(await status(dir)).toMatch(new RegExp(`^sent +WhatsApp +${file.replace(/[.]/g, "\\.")}`, "m"));
    expect((await links(dir)).join("\n")).not.toContain(file);
    expect(await markSent(dir, file, { confirm: async () => true })).toContain("is sent, not approved");
  });

  it("writes the reviewer's verdict without changing the message", async () => {
    const content = "# Email · Ada\n\n**To:** ada@example.com\n**Reviewer:** not reviewed yet\n\n---\n\nHi Ada, one question.\n";
    const updated = withVerdict(content, { verdict: "revise", fixes: ["add one small ask"], provider: "heuristic", calibrated: false });
    const before = parseDraft("d.md", content)!;
    const after = parseDraft("d.md", updated)!;
    expect(after.verdict).toBe("revise");
    expect(after.to).toBe("ada@example.com");
    expect(textHash(after.text)).toBe(textHash(before.text));
  });
});

describe("model evals", () => {
  it("flags claim-like numbers the founder never gave, not the durations in an ask", () => {
    const words = "Ajo Circle: savings groups for 100 active savers";
    expect(inventedNumbers("Join 5,000 users who saved 30% more", words)).toEqual(["5,000 users", "30%"]);
    expect(inventedNumbers("Would a 10-minute call help? We want 100 active savers.", words)).toEqual([]);
    expect(inventedNumbers("We raised $2m", words)).toEqual(["$2m"]);
  });

  it("supports a model only when every run is valid and honest", async () => {
    const good = templatePlan(input).plan;
    const route: ModelRoute = { kind: "gateway", model: "openai/gpt-5" };
    let call = 0;
    const metered = async () => {
      call++;
      return { output: good, modelId: "gpt-5", usage: { inputTokens: 1000 * call, outputTokens: 3000 * call, costUsd: 0.01 * call } };
    };
    const ok = await evalModel("openai/gpt-5", input, { runs: 3, route, deps: { gateway: metered } });
    expect(ok).toMatchObject({ runs: 3, valid: 3, honest: 3, medianInputTokens: 2000, medianOutputTokens: 6000, medianCostUsd: 0.02 });
    expect(supported(ok)).toBe(true);

    const boastful = { ...good, drafts: good.drafts.map((d, i) => (i === 0 ? { ...d, text: `${d.text} 10,000 traders already use it.` } : d)) };
    const bad = await evalModel("xai/grok-4", input, { runs: 2, route: { kind: "gateway", model: "xai/grok-4" }, deps: { gateway: async () => ({ output: boastful }) } });
    expect(bad).toMatchObject({ valid: 2, honest: 0 });
    expect(bad.errors[0]).toContain("invented: 10,000 traders");

    const broken = await evalModel("google/gemini-x", input, { runs: 2, route: { kind: "gateway", model: "google/gemini-x" }, deps: { gateway: async () => ({ output: { not: "a plan" } }) } });
    expect(broken.valid).toBe(0);

    expect((await evalModel("openai/gpt-5", input, { runs: 1, env: {} })).route).toBe("not configured");
    const table = evalTable([ok, bad, broken], "2026-10-07");
    expect(table).toContain("| openai/gpt-5 | openai/gpt-5 via Vercel AI Gateway | 3/3 | 3/3 |");
    expect(table).toContain("| 2000 / 6000 | $0.0200 | yes |");
    expect(table).toContain("| n/a | n/a | no |");
    expect(bad.medianCostUsd).toBeUndefined();
  });
});
