import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectDrafts, createWorkspace, links, readApprovals, review, status, sync, wait, withVerdict } from "../src/cli";
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
  async function workspace() {
    const dir = await mkdtemp(join(tmpdir(), "gtm-"));
    const result = await createWorkspace(dir, input, { env: {}, now: new Date("2026-10-07T09:00:00Z") });
    return { dir, result };
  }

  it("builds a workspace with templates when no model is configured, and refuses to overwrite", async () => {
    const { dir, result } = await workspace();
    expect(result.planBy).toBe("templates");
    expect(result.files).toBeGreaterThan(40);
    expect(result.note).toContain("No model is configured");
    await expect(createWorkspace(dir, input, { env: {} })).rejects.toThrow("isn't empty");
  });

  it("records terminal approvals, gives links for approved drafts, and voids them when the text changes", async () => {
    const { dir } = await workspace();
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
    const { dir } = await workspace();
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
    const { dir } = await workspace();
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
    const { dir } = await workspace();
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
