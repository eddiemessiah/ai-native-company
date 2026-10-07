import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

// Approvals are signed with a key outside the workspace; tests use a throwaway one, never ~/.config.
process.env.GTM_APPROVAL_KEY_FILE = join(mkdtempSync(join(tmpdir(), "gtm-key-")), "approval.key");
import { collectDrafts, createWorkspace } from "../src/cli";
import type { TelegramConfig } from "../src/connectors";
import { gtmInputSchema } from "../src/index";
import { createWorkspaceServer, insideWorkspace } from "../src/mcp";
import { parseCsv, parseDraft } from "../src/outbox";
import { parseScorecard } from "../src/pipeline";

const input = gtmInputSchema.parse({
  product: "Ajo Circle",
  pitch: "Rotating savings groups on MiniPay, with automatic payouts in stablecoins.",
  audience: "Market traders and savings-group leaders in Lagos",
  stage: "live",
  goal: "100 active savers",
  channels: ["whatsapp", "x", "communities"],
  regions: "Nigeria",
});

async function connect(opts: { telegram?: TelegramConfig | null; fetch?: typeof fetch } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "gtm-mcp-"));
  await createWorkspace(dir, input, { env: {}, now: new Date("2026-10-07T09:00:00Z") });
  const server = createWorkspaceServer({ dir, env: {}, telegram: opts.telegram ?? null, ...(opts.fetch ? { fetch: opts.fetch } : {}) });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientSide);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const result = await client.callTool({ name, arguments: args });
    return { text: (result.content as { text: string }[])[0]!.text, isError: result.isError === true };
  };
  return { dir, client, call };
}

describe("the workspace MCP server", () => {
  it("offers typed GTM tools, and none that sends or approves", async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "gtm_add_lead",
      "gtm_approvals",
      "gtm_check",
      "gtm_drafts",
      "gtm_due",
      "gtm_leads",
      "gtm_log_correction",
      "gtm_read",
      "gtm_request_approval",
      "gtm_score_lead",
      "gtm_status",
      "gtm_update_lead",
      "gtm_write_draft",
    ]);
    expect(names.some((n) => /send|approve$|publish|post/.test(n))).toBe(false);
    expect(tools.find((t) => t.name === "gtm_read")!.annotations).toMatchObject({ readOnlyHint: true });
  });

  it("reads workspace files, and nothing outside it", async () => {
    const { dir, call } = await connect();
    expect((await call("gtm_read", { path: "AGENTS.md" })).text).toContain("# AGENTS.md");
    expect(await call("gtm_read", { path: "../../etc/passwd" })).toMatchObject({ isError: true });
    expect(await call("gtm_read", { path: "/etc/passwd" })).toMatchObject({ isError: true });
    expect((await call("gtm_read", { path: "brain" })).text).toContain("is a folder");
    expect(insideWorkspace(dir, "brain/../AGENTS.md")).toBe(join(dir, "AGENTS.md"));
    expect(insideWorkspace(dir, "brain/../../x")).toBeNull();
  });

  it("adds leads only with a source, once, and never someone who opted out", async () => {
    const { dir, call } = await connect();
    const add = (handle: string, extra: Record<string, unknown> = {}) =>
      call("gtm_add_lead", { name: "Ada, Lagos", handle, channel: "whatsapp", source: "https://example.com/ada", ...extra });
    expect((await add("+234 801 234 5678")).text).toContain('Added Ada, Lagos at stage "new"');
    expect(await call("gtm_add_lead", { name: "Bola", handle: "bola@example.com", channel: "email", source: "" })).toMatchObject({ isError: true });
    expect((await add("2348012345678")).text).toContain("already in pipeline.csv (line 2");

    expect(await call("gtm_update_lead", { handle: "+2348012345678", stage: "hot lead" })).toMatchObject({ isError: true });
    expect(await call("gtm_update_lead", { handle: "+2348012345678", last_touch: "last Tuesday" })).toMatchObject({ isError: true });
    await call("gtm_update_lead", { handle: "+2348012345678", stage: "reach out", last_touch: "2026-10-05", do_not_contact: true });
    const rows = parseCsv(await readFile(join(dir, "pipeline.csv"), "utf8"));
    expect(rows[1]).toEqual(["Ada, Lagos", "+234 801 234 5678", "whatsapp", "https://example.com/ada", "", "reach out", "2026-10-05", "", "", "yes"]);
    expect((await add("wa.me/2348012345678")).text).toContain("marked do_not_contact");
    expect(await call("gtm_update_lead", { handle: "+2348012345678", do_not_contact: false })).toMatchObject({ isError: true });
    expect(await call("gtm_update_lead", { handle: "nobody@example.com", stage: "new" })).toMatchObject({ isError: true });
    expect((await call("gtm_leads", { stage: "reach out" })).text).toContain("DO NOT CONTACT");
    expect((await call("gtm_status")).text).toContain("Leads (1): do_not_contact: 1");
  });

  it("scores leads in code from the agent's judgement of each criterion", async () => {
    const { dir, call } = await connect();
    const scorecard = parseScorecard(await readFile(join(dir, "brain/audience.md"), "utf8"));
    expect(scorecard.length).toBeGreaterThan(1);
    await call("gtm_add_lead", { name: "Ada", handle: "ada@example.com", channel: "email", source: "https://example.com/ada" });

    const judge = (metUpTo: number) => scorecard.map((c, i) => ({ criterion: c.name, met: i < metUpTo, ...(i < metUpTo ? { evidence: `https://example.com/ada#${i}` } : {}) }));
    expect((await call("gtm_score_lead", { handle: "ada@example.com", criteria: judge(1).slice(1) })).text).toContain("missing");
    expect((await call("gtm_score_lead", { handle: "ada@example.com", criteria: [...judge(0), { criterion: "Vibes", met: true, evidence: "x" }] })).text).toContain("isn't on the scorecard");
    expect((await call("gtm_score_lead", { handle: "ada@example.com", criteria: judge(0).map((j) => ({ ...j, met: true })) })).text).toContain("no evidence");

    const all = await call("gtm_score_lead", { handle: "ada@example.com", criteria: judge(scorecard.length) });
    expect(all.text).toBe('ada@example.com: 100%, so "reach out". Next: gtm_write_draft.');
    const row = parseCsv(await readFile(join(dir, "pipeline.csv"), "utf8"))[1]!;
    expect(row.slice(4, 6)).toEqual(["100", "reach out"]);
    expect(row[8]).toContain(`Met: ${scorecard[0]!.name}: https://example.com/ada#0`);

    const total = scorecard.reduce((sum, c) => sum + c.weight, 0);
    const first = await call("gtm_score_lead", { handle: "ada@example.com", criteria: judge(1) });
    expect(first.text).toContain(`${Math.round((scorecard[0]!.weight / total) * 100)}%`);
    expect((await call("gtm_score_lead", { handle: "ada@example.com", criteria: judge(scorecard.length), disqualifier: "Already uses a rival" })).text).toContain('"skip"');
  });

  it("lists who is due a follow-up, counting working days in code", async () => {
    const { dir, call } = await connect();
    const today = new Date();
    const daysAgo = (n: number) => new Date(today.getTime() - n * 86_400_000).toISOString().slice(0, 10);
    await writeFile(
      join(dir, "pipeline.csv"),
      [
        "name,handle_or_email,channel,source,score_pct,stage,last_touch,next_step,notes,do_not_contact",
        `Ada,ada@example.com,email,https://e.com/a,90,contacted,${daysAgo(10)},,,`,
        `Bola,bola@example.com,email,https://e.com/b,90,contacted,${daysAgo(0)},,,`,
        `Chi,chi@example.com,email,https://e.com/c,90,contacted,${daysAgo(10)},stop,,`,
        "Dee,dee@example.com,email,https://e.com/d,90,contacted,,,,",
        `Eko,eko@example.com,email,https://e.com/e,90,contacted,${daysAgo(10)},,,yes`,
      ].join("\n"),
    );
    const out = (await call("gtm_due")).text;
    expect(out).toContain("Due their one follow-up today:\n- Ada (ada@example.com, pipeline.csv line 2)");
    expect(out).toContain("Not yet (under 3 working days): Bola");
    expect(out).toContain("no more messages: Chi");
    expect(out).toContain("can't count: Dee");
    expect(out).not.toContain("Eko");
  });

  it("writes drafts in the workspace format and reports what the checker finds", async () => {
    const { dir, call } = await connect();
    const slotted = await call("gtm_write_draft", {
      channel: "WhatsApp",
      who: "Ada (Lagos traders)",
      to: "+234 801 234 5678",
      source: "https://example.com/ada",
      text: "Hi [name], saw your savings group post. Would a 2-minute demo help?",
    });
    expect(slotted.text).toContain("Saved drafts/whatsapp-ada-lagos-traders.md, but fix these");
    expect(slotted.text).toContain("unfilled slot [name]");

    const clean = await call("gtm_write_draft", {
      channel: "WhatsApp",
      who: "Ada (Lagos traders)",
      to: "+234 801 234 5678",
      source: "https://example.com/ada",
      text: "Hi Ada, saw your savings group post in Lagos Traders. Would a 2-minute demo help?",
    });
    expect(clean.text).toContain("Saved drafts/whatsapp-ada-lagos-traders-2.md. It passes the checks.");
    const draft = parseDraft("d.md", await readFile(join(dir, "drafts/whatsapp-ada-lagos-traders-2.md"), "utf8"))!;
    expect(draft).toMatchObject({ channel: "WhatsApp", to: "+234 801 234 5678" });

    await call("gtm_add_lead", { name: "Bola", handle: "bola@example.com", channel: "email", source: "https://example.com/bola" });
    await call("gtm_update_lead", { handle: "bola@example.com", do_not_contact: true });
    expect(await call("gtm_write_draft", { channel: "Email", who: "Bola", to: "BOLA@example.com", source: "x.com/bola", text: "Hi Bola" })).toMatchObject({ isError: true });
    expect(await call("gtm_write_draft", { channel: "Email", who: "Chi", source: "x.com/chi", text: "Hi Chi", campaign: "nope" })).toMatchObject({ isError: true });
    expect((await call("gtm_drafts")).text).toMatch(/held +WhatsApp +drafts\/whatsapp-ada-lagos-traders\.md/);
  });

  it("asks the founder for approval through Telegram, holding drafts that break a rule", async () => {
    const sent: string[] = [];
    const fakeFetch = (async (url: string | URL, init?: RequestInit) => {
      if (String(url).endsWith("/sendMessage")) sent.push(String(JSON.parse(String(init?.body)).text));
      return new Response(JSON.stringify({ ok: true, result: { message_id: sent.length } }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    const { call } = await connect({ telegram: { token: "T", chatId: "42" }, fetch: fakeFetch });
    await call("gtm_write_draft", { channel: "WhatsApp", who: "Ada", to: "+2348012345678", source: "https://example.com/ada", text: "Hi Ada, saw your post. Would a 2-minute demo help?" });
    const out = (await call("gtm_request_approval")).text;
    expect(out).toContain("to Telegram drafts/whatsapp-ada.md");
    expect(out).toMatch(/held {6}drafts\/01-whatsapp\.md: unfilled slots/);
    expect(sent.some((t) => t.includes("Hi Ada, saw your post"))).toBe(true);
    expect(sent.some((t) => t.includes("[name]"))).toBe(false);
    expect((await call("gtm_approvals")).text).toContain("No decisions recorded yet");
  });

  it("without Telegram, tells the agent to hand approval to the founder's terminal", async () => {
    const { call } = await connect();
    const out = await call("gtm_request_approval");
    expect(out.isError).toBe(false);
    expect(out.text).toContain("pnpm gtm review <this folder> --local");
  });

  it("checks the workspace and logs corrections", async () => {
    const { dir, call } = await connect();
    expect((await call("gtm_check")).text).toContain("unfilled slots");
    await call("gtm_log_correction", { draft: "drafts/01-whatsapp.md", change: "Cut | 'fastest-growing'", type: "factual error" });
    expect(await readFile(join(dir, "corrections-log.md"), "utf8")).toMatch(/\| drafts\/01-whatsapp\.md \| Cut \\\| 'fastest-growing' \| factual error \| {2}\|\n$/);
    expect((await collectDrafts(dir)).length).toBe(3);
  });
});
