import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createNovaServer, NO_PAYMENT } from "../src/server";

type Seen = { url: string; method: string; body: unknown };

async function connect(respond: (url: string) => Response) {
  const seen: Seen[] = [];
  const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();
    seen.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return respond(url);
  }) as typeof fetch;
  const server = createNovaServer({ baseUrl: "https://nova.test", fetch: fakeFetch });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientSide);
  return { client, seen };
}

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

describe("nova-mcp", () => {
  it("lists the agent tools", async () => {
    const { client } = await connect(() => json({}));
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["nova_catalog", "nova_check", "nova_gate", "nova_receipt"]);
  });

  it("posts a check to Nova and returns its verdict", async () => {
    const { client, seen } = await connect(() => json({ verdict: "pay", reasons: ["passed all 10 checks"] }));
    const result = await client.callTool({
      name: "nova_check",
      arguments: { paymentRequired: "eyJ4NDAy…", url: "https://api.example.com/v1/rates", budgetUsd: 0.05 },
    });
    expect(seen[0]).toMatchObject({ url: "https://nova.test/api/v1/check", method: "POST", body: { budgetUsd: 0.05 } });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse((result.content as { text: string }[])[0]!.text)).toMatchObject({ verdict: "pay" });
  });

  it("explains an unpaid 402 instead of failing silently", async () => {
    const { client } = await connect(() => json({}, 402));
    const result = await client.callTool({ name: "nova_gate", arguments: { action: "email the customer", request: "refund A-104", risk: "external" } });
    expect(result.isError).toBe(true);
    expect((result.content as { text: string }[])[0]!.text).toBe(NO_PAYMENT);
  });

  it("rejects arguments outside the schema before calling Nova", async () => {
    const { client, seen } = await connect(() => json({}));
    const result = await client.callTool({ name: "nova_gate", arguments: { action: "x", request: "y", risk: "catastrophic" } });
    expect(result.isError).toBe(true);
    expect(seen).toHaveLength(0);
  });

  it("reads the free catalog", async () => {
    const { client, seen } = await connect(() => json({ offers: [] }));
    const result = await client.callTool({ name: "nova_catalog", arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(seen[0]).toMatchObject({ url: "https://nova.test/api/v1/catalog", method: "GET" });
  });
});
