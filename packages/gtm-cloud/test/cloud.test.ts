import { buildHarness, templatePlan, type GtmInput } from "@repo/gtm-harness";
import { describe, expect, it } from "vitest";
import { handleBridgeRequest } from "../src/bridge";
import {
  approvalCovers,
  betaConfig,
  connectSlack,
  createAction,
  createLoginCode,
  createWorkspace,
  currentUser,
  decide,
  editAction,
  getAction,
  getWorkspace,
  handleTelegramUpdate,
  keys,
  linkFor,
  markSent,
  MemoryStore,
  redeemLoginCode,
  requestApproval,
  retry,
  rotateAgentToken,
  saveAction,
  saveWorkspace,
  signUp,
  telegramLinkUrl,
  verify,
  type Ctx,
  type Workspace,
} from "../src/index";
import { decrypt, encrypt, seal, sign, unseal } from "../src/crypto";

const INPUT: GtmInput = {
  product: "Kola Pay",
  pitch: "Kola Pay lets market traders in Lagos take stablecoin payments on MiniPay.",
  audience: "Market traders in Lagos who sell to customers abroad",
  stage: "live",
  goal: "Ten traders taking payments by November",
  channels: ["whatsapp", "x", "email"],
};

interface Call {
  url: string;
  body: Record<string, unknown> | string | null;
}

/** A fetch that records every call and answers like Telegram, X and Slack do. */
function fakeFetch(opts: { xFails?: boolean } = {}) {
  const calls: Call[] = [];
  let messageId = 100;
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const raw = typeof init?.body === "string" ? init.body : init?.body ? String(init.body) : null;
    let body: Record<string, unknown> | string | null = raw;
    try {
      body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
      /* form bodies stay strings */
    }
    calls.push({ url, body });
    const json = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
    if (url.startsWith("https://api.telegram.org/")) {
      const method = url.split("/").pop();
      if (method === "sendMessage") {
        const chatId = (body as { chat_id: number }).chat_id;
        return json(200, { ok: true, result: { message_id: ++messageId, chat: { id: chatId, username: chatId === -1001 ? "kolapay" : undefined } } });
      }
      return json(200, { ok: true, result: true });
    }
    if (url === "https://api.x.com/2/tweets") return opts.xFails ? json(429, { title: "Too Many Requests" }) : json(201, { data: { id: "1844" } });
    if (url.startsWith("https://hooks.slack.com/")) return new Response("ok", { status: 200 });
    return json(404, { error: "unexpected" });
  }) as typeof fetch;
  return { fn, calls };
}

function makeCtx(env: Record<string, string> = {}, f = fakeFetch()) {
  const cfg = betaConfig({
    NODE_ENV: "test",
    TELEGRAM_BETA_BOT_TOKEN: "123:abc",
    TELEGRAM_BETA_BOT_USERNAME: "ShoninGtmBot",
    TELEGRAM_BETA_WEBHOOK_SECRET: "s3cret",
    X_CLIENT_ID: "client",
    BETA_SITE_URL: "https://staging.example.com",
    ...env,
  });
  const ctx: Ctx = { store: new MemoryStore(), cfg, fetch: f.fn, now: () => new Date("2026-10-11T09:00:00Z") };
  return { ctx, calls: f.calls };
}

async function setup(env: Record<string, string> = {}, f = fakeFetch()) {
  const { ctx, calls } = makeCtx(env, f);
  const { user } = await signUp(ctx, { name: "Ada Obi", email: "ada@example.com" });
  const generated = templatePlan(INPUT);
  const files = buildHarness(INPUT, generated.plan, []);
  const { workspace, actions } = await createWorkspace(ctx, user, INPUT, { plan: generated.plan, generatedBy: "templates", files, reviews: [] });
  return { ctx, calls, user, workspace, actions };
}

async function connectX(ctx: Ctx, ws: Workspace): Promise<Workspace> {
  const next: Workspace = { ...ws, x: { username: "kolapay", access: encrypt(ctx.cfg.encryptionKey, "token"), expiresAt: Date.parse("2026-10-11T12:00:00Z") } };
  await saveWorkspace(ctx, next);
  return next;
}

describe("crypto", () => {
  it("signs records so any change breaks the signature", () => {
    const key = Buffer.alloc(32, 7);
    const record = sign(key, { kind: "approval", hash: "abc", by: "ada" });
    expect(verify(key, record)).toBe(true);
    expect(verify(key, { ...record, hash: "abd" })).toBe(false);
    expect(verify(Buffer.alloc(32, 8), record)).toBe(false);
  });
  it("encrypts tokens and seals expiring values", () => {
    const key = Buffer.alloc(32, 1);
    expect(decrypt(key, encrypt(key, "xoxb-secret"))).toBe("xoxb-secret");
    const token = seal(key, { uid: "u1", exp: 2000 });
    expect(unseal<{ uid: string; exp: number }>(key, token, 1000)?.uid).toBe("u1");
    expect(unseal(key, token, 3000)).toBeNull();
    expect(unseal(key, `${token}x`, 1000)).toBeNull();
  });
});

describe("auth", () => {
  it("keeps the gate shut without a valid invite, and opens it with one", async () => {
    const { ctx } = makeCtx({ BETA_GATE: "invite", BETA_INVITE_CODES: "LAGOS1,ACCRA2" });
    await expect(signUp(ctx, { name: "Ada" })).rejects.toThrow(/invite/);
    await expect(signUp(ctx, { name: "Ada", invite: "WRONG" })).rejects.toThrow(/invite/);
    const { user, cookie } = await signUp(ctx, { name: "Ada", invite: "ACCRA2" });
    expect((await currentUser(ctx, cookie))?.id).toBe(user.id);
    expect(await currentUser(ctx, "forged.value")).toBeNull();
  });
  it("redeems a Telegram sign-in code once", async () => {
    const { ctx } = makeCtx();
    const { user } = await signUp(ctx, { name: "Ada" });
    const code = await createLoginCode(ctx, user.id);
    expect((await redeemLoginCode(ctx, code)).user.id).toBe(user.id);
    await expect(redeemLoginCode(ctx, code)).rejects.toThrow(/expired or was used/);
  });
});

describe("the action loop", () => {
  it("turns the plan's drafts into actions, holding any with an unfilled slot", async () => {
    const { actions } = await setup();
    expect(actions.length).toBeGreaterThan(0);
    for (const a of actions) {
      const slots = /\[[^\]\n]{1,60}\](?!\()/.test(a.text);
      expect(a.status).toBe(slots ? "held" : "draft");
    }
  });

  it("checks platform limits, and skips outreach rules on the founder's own posts", async () => {
    const { ctx, workspace } = await setup();
    const long = await createAction(ctx, workspace, { channel: "x", text: "a".repeat(281), source: "web", author: "ada" });
    expect(long.status).toBe("held");
    expect(long.findings.some((f) => f.rule.includes("280"))).toBe(true);
    const withLink = await createAction(ctx, workspace, { channel: "x", text: "Our demo is Friday at 14:00 WAT: https://example.com/demo", source: "web", author: "ada" });
    expect(withLink.findings.filter((f) => f.rule.startsWith("rules/outreach.md"))).toEqual([]);
    const hype = await createAction(ctx, workspace, { channel: "x", text: "A revolutionary way to get paid.", source: "web", author: "ada" });
    expect(hype.status).toBe("held");
  });

  it("gives a person-channel approval a one-tap link and records the send with a signed receipt", async () => {
    const { ctx, workspace } = await setup();
    const a = await createAction(ctx, workspace, { channel: "whatsapp", to: "+234 801 234 5678", text: "Ada, saw your stall at Balogun. Want to try taking USDC this week?", source: "web", author: "ada" });
    const approved = await decide(ctx, workspace, a.id, "approved", "ada", "web");
    expect(approved.status).toBe("approved");
    expect(approvalCovers(ctx, approved)).toBe(true);
    expect(linkFor(approved)?.url).toMatch(/^https:\/\/wa\.me\/2348012345678\?text=/);
    const sent = await markSent(ctx, workspace, a.id, "ada");
    expect(sent.status).toBe("done");
    expect(verify(ctx.cfg.signingKey, sent.receipt)).toBe(true);
    expect(sent.receipt?.result).toBe("marked_sent");
  });

  it("posts an approved X post once, with a receipt, however many times it is approved", async () => {
    const { ctx, calls, workspace } = await setup();
    const ws = await connectX(ctx, workspace);
    const a = await createAction(ctx, ws, { channel: "x", text: "Kola Pay is live for traders at Balogun market.", source: "web", author: "ada" });
    const done = await decide(ctx, ws, a.id, "approved", "ada", "web");
    expect(done.status).toBe("done");
    expect(done.receipt?.ref).toBe("https://x.com/kolapay/status/1844");
    expect(verify(ctx.cfg.signingKey, done.receipt)).toBe(true);
    await decide(ctx, ws, a.id, "approved", "ada", "web");
    expect(calls.filter((c) => c.url === "https://api.x.com/2/tweets")).toHaveLength(1);
  });

  it("voids an approval when the text changes", async () => {
    const { ctx, workspace } = await setup();
    const a = await createAction(ctx, workspace, { channel: "email", to: "ada@example.com", text: "Ada, can we show you Kola Pay on Thursday?", source: "web", author: "ada" });
    await decide(ctx, workspace, a.id, "approved", "ada", "web");
    const edited = await editAction(ctx, workspace, a.id, "Ada, can we show you Kola Pay on Friday?", "ada");
    expect(edited.status).toBe("draft");
    expect(edited.approval).toBeUndefined();
    expect(linkFor(edited)).toBeNull();
  });

  it("refuses to run an action whose stored text no longer matches its approval", async () => {
    const { ctx, calls, workspace } = await setup();
    const ws = await connectX(ctx, workspace);
    const a = await createAction(ctx, ws, { channel: "x", text: "Approved text.", source: "web", author: "ada" });
    await requestApproval(ctx, ws, a.id);
    // Someone with store access swaps the text after the card went out.
    await saveAction(ctx, { ...(await getAction(ctx, a.id))!, text: "Swapped text." });
    await expect(decide(ctx, ws, a.id, "approved", "ada", "web")).rejects.toThrow(/doesn't match its hash/);
    expect(calls.some((c) => c.url === "https://api.x.com/2/tweets")).toBe(false);
  });

  it("leaves a failed post approved-but-failed, and a retry runs it", async () => {
    const failing = fakeFetch({ xFails: true });
    const { ctx, workspace } = await setup({}, failing);
    const ws = await connectX(ctx, workspace);
    const a = await createAction(ctx, ws, { channel: "x", text: "Demo day is Friday.", source: "web", author: "ada" });
    const failed = await decide(ctx, ws, a.id, "approved", "ada", "web");
    expect(failed.status).toBe("failed");
    expect(failed.error).toMatch(/Too Many Requests/);
    const working: Ctx = { ...ctx, fetch: fakeFetch().fn };
    const done = await retry(working, (await getWorkspace(working, ws.id))!, a.id);
    expect(done.status).toBe("done");
  });

  it("holds the approval queue to the daily cap", async () => {
    const { ctx, workspace } = await setup({ GTM_MAX_CARDS_PER_DAY: "2" });
    const make = () => createAction(ctx, workspace, { channel: "x", text: `Update ${Math.random()}`, source: "web", author: "ada" });
    const [a, b, c] = [await make(), await make(), await make()];
    await requestApproval(ctx, workspace, a.id);
    await requestApproval(ctx, workspace, b.id);
    await expect(requestApproval(ctx, workspace, c.id)).rejects.toMatchObject({ status: 429 });
  });

  it("posts approved updates to Slack through the encrypted webhook", async () => {
    const { ctx, calls, workspace } = await setup();
    await expect(connectSlack(ctx, workspace, "https://example.com/hook", "#growth")).rejects.toThrow(/incoming webhook/);
    const ws = await connectSlack(ctx, workspace, "https://hooks.slack.com/services/T0/B0/xyz", "#growth");
    expect(ws.slack?.webhook).not.toContain("hooks.slack.com");
    const a = await createAction(ctx, ws, { channel: "slack", text: "Three traders signed up today.", source: "web", author: "ada" });
    expect((await decide(ctx, ws, a.id, "approved", "ada", "web")).status).toBe("done");
    expect(calls.filter((c) => c.url.startsWith("https://hooks.slack.com/"))).toHaveLength(2);
  });
});

describe("the Telegram bot", () => {
  const start = (id: number, text: string, from = 42) => ({ update_id: id, message: { message_id: id, from: { id: from, username: "ada" }, chat: { id: from, type: "private" }, text } });

  async function linked() {
    const s = await setup();
    const url = (await telegramLinkUrl(s.ctx, s.workspace))!;
    await handleTelegramUpdate(s.ctx, start(1, `/start ${url.split("start=")[1]}`));
    return { ...s, workspace: (await getWorkspace(s.ctx, s.workspace.id))! };
  }

  it("links the founder's chat with the one-time start code", async () => {
    const { ctx, workspace } = await linked();
    expect(workspace.telegram).toMatchObject({ userId: 42, chatId: 42, username: "ada" });
    expect(await ctx.store.get(keys.telegramUser(42))).toBe(workspace.id);
  });

  it("counts only the linked founder's taps, and handles each update once", async () => {
    const { ctx, calls, workspace } = await linked();
    const a = await createAction(ctx, workspace, { channel: "whatsapp", to: "+2348012345678", text: "Ada, want to try it this week?", source: "web", author: "ada" });
    await requestApproval(ctx, workspace, a.id);
    const card = (await getAction(ctx, a.id))!.card!;
    const tap = (id: number, from: number) => ({ update_id: id, callback_query: { id: `cb${id}`, data: `a:${a.id}`, from: { id: from }, message: { message_id: card.messageId, chat: { id: card.chatId } } } });
    await handleTelegramUpdate(ctx, tap(10, 99));
    expect((await getAction(ctx, a.id))!.status).toBe("pending");
    await handleTelegramUpdate(ctx, tap(11, 42));
    const approved = (await getAction(ctx, a.id))!;
    expect(approved.status).toBe("approved");
    expect(approved.approval?.via).toBe("telegram");
    // The card's buttons become the one-tap link.
    const edit = calls.filter((c) => c.url.endsWith("/editMessageReplyMarkup")).pop()!;
    expect(JSON.stringify(edit.body)).toContain("wa.me");
    const before = calls.length;
    await handleTelegramUpdate(ctx, tap(11, 42));
    expect(calls.length).toBe(before);
  });

  it("records groups and channels where the founder makes the bot an admin, and posts approved updates there", async () => {
    const { ctx, calls, workspace } = await linked();
    await handleTelegramUpdate(ctx, { update_id: 20, my_chat_member: { chat: { id: -1001, type: "channel", title: "Kola Pay News", username: "kolapay" }, from: { id: 42 }, new_chat_member: { status: "administrator", user: { id: 1 } } } });
    const ws = (await getWorkspace(ctx, workspace.id))!;
    expect(ws.telegramTargets).toEqual([expect.objectContaining({ chatId: -1001, title: "Kola Pay News" })]);
    const a = await createAction(ctx, ws, { channel: "telegram_post", to: "-1001", text: "We're live at Balogun market from Monday.", source: "web", author: "ada" });
    const done = await decide(ctx, ws, a.id, "approved", "ada", "web");
    expect(done.status).toBe("done");
    expect(done.receipt?.ref).toMatch(/^https:\/\/t\.me\/kolapay\/\d+$/);
    expect(calls.some((c) => c.url.endsWith("/sendMessage") && (c.body as { chat_id: number }).chat_id === -1001)).toBe(true);
    await expect(createAction(ctx, ws, { channel: "telegram_post", to: "-999", text: "x", source: "web", author: "ada" })).rejects.toThrow(/isn't one of this workspace's/);
  });

  it("drafts from a chat message and sends the card back for approval", async () => {
    const { ctx, calls, workspace } = await linked();
    const drafter = async () => ({ channel: "x" as const, text: "Traders at Balogun can take USDC from Monday." });
    await handleTelegramUpdate(ctx, start(30, "a post about Monday's launch"), { drafter });
    const cards = calls.filter((c) => c.url.endsWith("/sendMessage") && JSON.stringify(c.body).includes("callback_data"));
    expect(cards.length).toBe(1);
    expect(JSON.stringify(cards[0]!.body)).toContain("Traders at Balogun");
  });

  it("ignores chats that aren't linked", async () => {
    const { ctx, calls } = await setup();
    await handleTelegramUpdate(ctx, start(40, "a post please", 7), { drafter: async () => ({ channel: "x", text: "nope" }) });
    expect(JSON.stringify(calls.at(-1)?.body)).toContain("isn't linked");
  });
});

describe("the agent bridge", () => {
  const rpc = (token: string | null, body: unknown) =>
    new Request("https://staging.example.com/api/beta/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  const init = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } };

  it("refuses requests without a valid token", async () => {
    const { ctx } = await setup();
    expect((await handleBridgeRequest(ctx, rpc(null, init))).status).toBe(401);
    expect((await handleBridgeRequest(ctx, rpc("shn_wrong", init))).status).toBe(401);
  });

  it("serves the workspace as tools, none of which can send or approve", async () => {
    const { ctx, workspace } = await setup();
    const { token } = await rotateAgentToken(ctx, workspace);
    expect((await handleBridgeRequest(ctx, rpc(token, init))).status).toBe(200);
    const list = await (await handleBridgeRequest(ctx, rpc(token, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }))).json();
    const names = (list as { result: { tools: { name: string }[] } }).result.tools.map((t) => t.name);
    expect(names).toContain("gtm_write_draft");
    expect(names.some((n) => /send|approve|post|publish/.test(n.replace("request_approval", "")))).toBe(false);

    const call = await (
      await handleBridgeRequest(ctx, rpc(token, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "gtm_write_draft", arguments: { channel: "x", text: "Monday: Balogun traders go live." } } }))
    ).json();
    expect(JSON.stringify(call)).toContain("draft");
    const fresh = (await getWorkspace(ctx, workspace.id))!;
    const { token: second } = await rotateAgentToken(ctx, fresh);
    expect((await handleBridgeRequest(ctx, rpc(token, init))).status).toBe(401);
    expect((await handleBridgeRequest(ctx, rpc(second, init))).status).toBe(200);
  });
});
