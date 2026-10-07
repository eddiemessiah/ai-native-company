import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { collectDrafts, createWorkspace } from "../src/cli";
import type { TelegramConfig } from "../src/connectors";
import { gtmInputSchema } from "../src/index";
import { createWorkspaceServer, insideWorkspace } from "../src/mcp";
import { parseCsv, parseDraft } from "../src/outbox";

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
      "gtm_leads",
      "gtm_log_correction",
      "gtm_read",
      "gtm_request_approval",
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

    await call("gtm_update_lead", { handle: "+2348012345678", stage: "reach out", score_pct: 85, do_not_contact: true });
    const rows = parseCsv(await readFile(join(dir, "pipeline.csv"), "utf8"));
    expect(rows[1]).toEqual(["Ada, Lagos", "+234 801 234 5678", "whatsapp", "https://example.com/ada", "85", "reach out", "", "", "", "yes"]);
    expect((await add("wa.me/2348012345678")).text).toContain("marked do_not_contact");
    expect(await call("gtm_update_lead", { handle: "+2348012345678", do_not_contact: false })).toMatchObject({ isError: true });
    expect(await call("gtm_update_lead", { handle: "nobody@example.com", stage: "new" })).toMatchObject({ isError: true });
    expect((await call("gtm_leads", { stage: "reach out" })).text).toContain("DO NOT CONTACT");
    expect((await call("gtm_status")).text).toContain("Leads (1): do_not_contact: 1");
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
