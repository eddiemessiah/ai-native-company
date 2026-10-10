import { mkdtempSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

process.env.GTM_APPROVAL_KEY_FILE = join(mkdtempSync(join(tmpdir(), "gtm-key-")), "approval.key");
import { ground } from "../src/cli";
import { draftContext } from "../src/check";
import { inventedNumbers } from "../src/claims";
import { evidenceMarkdown, graphFromEnv, listResources, readOnlySqlProblem, runEvidence, toolStatus, type GraphConfig } from "../src/connectors";

type Call = { url: string; init: RequestInit };

function fakeFoundry(answer: (url: string, body: unknown) => { status?: number; json: unknown }) {
  const calls: Call[] = [];
  const fetchFn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const { status = 200, json } = answer(url, init.body ? JSON.parse(String(init.body)) : undefined);
    return new Response(JSON.stringify(json), { status });
  }) as unknown as typeof fetch;
  return { calls, fetchFn };
}

const cfg = (fetchFn: typeof fetch): GraphConfig => ({ baseUrl: "http://localhost:3001", workspaceId: "ws_1", token: "ro_token", fetch: fetchFn });

describe("company graph: read-only SQL", () => {
  it("accepts one SELECT or WITH, with or without a trailing semicolon", () => {
    expect(readOnlySqlProblem("SELECT count(*) FROM customers")).toBeNull();
    expect(readOnlySqlProblem("with paid as (select * from charges) select count(*) from paid;")).toBeNull();
    expect(readOnlySqlProblem("select count(*) from t where note = 'drop; delete'")).toBeNull();
    expect(readOnlySqlProblem("select updated_at, offset_days from t")).toBeNull();
  });

  it("refuses writes, several statements and anything that isn't a query", () => {
    expect(readOnlySqlProblem("DELETE FROM customers")).toMatch(/SELECT or WITH/);
    expect(readOnlySqlProblem("select 1; drop table customers")).toMatch(/more than one/);
    expect(readOnlySqlProblem("with x as (select 1) insert into t select * from x")).toMatch(/INSERT/);
    expect(readOnlySqlProblem("select * from read_csv('x') -- ok\n; copy t to 'out.csv'")).toMatch(/more than one/);
    expect(readOnlySqlProblem("  ")).toMatch(/empty/);
  });
});

describe("company graph: evidence", () => {
  it("posts the SQL to the workspace's query route with the bearer token, and keeps the one value", async () => {
    const { calls, fetchFn } = fakeFoundry(() => ({ json: { rows: [{ paying: 42 }], profile: {} } }));
    const e = await runEvidence(cfg(fetchFn), { claim: "Merchants paying in the last 90 days", inputs: ["ds_charges"], sql: "select count(distinct customer) as paying from charges" }, new Date("2026-10-10T09:00:00Z"));
    expect(e.value).toBe("42");
    expect(e.at).toBe("2026-10-10T09:00:00.000Z");
    expect(calls[0]!.url).toBe("http://localhost:3001/api/v1/workspaces/ws_1/query");
    expect(new Headers(calls[0]!.init.headers).get("authorization")).toBe("Bearer ro_token");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ inputs: ["ds_charges"], sql: "select count(distinct customer) as paying from charges" });
  });

  it("never sends a write to Foundry", async () => {
    const { calls, fetchFn } = fakeFoundry(() => ({ json: { rows: [[1]] } }));
    await expect(runEvidence(cfg(fetchFn), { claim: "x", inputs: ["d"], sql: "update customers set plan = 'free'" })).rejects.toThrow(/not run/);
    expect(calls).toHaveLength(0);
  });

  it("refuses rows: evidence is one aggregate, so no customer record reaches the workspace", async () => {
    const many = fakeFoundry(() => ({ json: { rows: [{ email: "a@x.co" }, { email: "b@x.co" }] } }));
    await expect(runEvidence(cfg(many.fetchFn), { claim: "Emails", inputs: ["d"], sql: "select email from customers" })).rejects.toThrow(/2 rows/);
    const wide = fakeFoundry(() => ({ json: { result: { rows: [{ n: 1, email: "a@x.co" }] } } }));
    await expect(runEvidence(cfg(wide.fetchFn), { claim: "Wide", inputs: ["d"], sql: "select 1, email from customers limit 1" })).rejects.toThrow(/2 columns/);
    const text = fakeFoundry(() => ({ json: [{ email: "a@x.co" }] }));
    await expect(runEvidence(cfg(text.fetchFn), { claim: "Text", inputs: ["d"], sql: "select email from customers limit 1" })).rejects.toThrow(/number/);
  });

  it("says what to do when the token is refused", async () => {
    const { fetchFn } = fakeFoundry(() => ({ status: 401, json: {} }));
    await expect(runEvidence(cfg(fetchFn), { claim: "x", inputs: ["d"], sql: "select 1" })).rejects.toThrow(/read-only token/);
  });

  it("lists ontology resources with a capped limit", async () => {
    const { calls, fetchFn } = fakeFoundry(() => ({ json: { items: [{ id: "o1", name: "Customer", revision: 3, data: { secret: 1 } }], total: 1 } }));
    const out = await listResources(cfg(fetchFn), "objectType", { search: "cust", limit: 500 });
    expect(out).toEqual({ items: [{ id: "o1", name: "Customer" }], total: 1 });
    expect(calls[0]!.url).toBe("http://localhost:3001/api/v1/workspaces/ws_1/resources/objectType?offset=0&limit=100&search=cust");
    expect(calls[0]!.init.method).toBe("GET");
  });

  it("is configured from the environment, and shows in the tool list", () => {
    expect(graphFromEnv({})).toBeNull();
    expect(graphFromEnv({ FOUNDRY_URL: "http://localhost:3001/", FOUNDRY_WORKSPACE_ID: "ws", FOUNDRY_TOKEN: "t" })).toEqual({ baseUrl: "http://localhost:3001", workspaceId: "ws", token: "t" });
    expect(toolStatus({}).find((t) => t.name === "Company graph")).toMatchObject({ connected: false });
    expect(toolStatus({ FOUNDRY_URL: "u", FOUNDRY_WORKSPACE_ID: "w", FOUNDRY_TOKEN: "t" }).find((t) => t.name === "Company graph")).toMatchObject({ connected: true });
  });
});

describe("pnpm gtm ground", () => {
  it("writes each single value with its SQL to brain/products/, which the claims check then accepts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gtm-ground-"));
    await writeFile(join(dir, "AGENTS.md"), "# workspace\n");
    const { fetchFn } = fakeFoundry((_url, body) => {
      const sql = (body as { sql: string }).sql;
      return sql.includes("email") ? { json: { rows: [{ email: "a@x.co" }, { email: "b@x.co" }] } } : { json: { rows: [{ n: 1240 }] } };
    });
    const lines = await ground(
      dir,
      [
        { claim: "Merchants paid through us in September", inputs: ["ds_charges"], sql: "select count(*) as n from charges where month = 9" },
        { claim: "Customer emails", inputs: ["ds_customers"], sql: "select email from customers" },
      ],
      { graph: cfg(fetchFn), now: new Date("2026-10-10T09:00:00Z") },
    );
    expect(lines[0]).toBe("ok      Merchants paid through us in September: 1240");
    expect(lines[1]).toMatch(/^skipped "Customer emails" returned 2 rows/);
    const file = await readFile(join(dir, "brain/products/evidence.md"), "utf8");
    expect(file).toContain("| Merchants paid through us in September | 1240 | 2026-10-10 | ds_charges | `select count(*) as n from charges where month = 9` |");
    expect(file).not.toContain("a@x.co");

    const ctx = draftContext({ "brain/products/evidence.md": file });
    expect(inventedNumbers("1,240 merchants paid through us in September.", ctx.claimSources)).toEqual(["1,240 merchants"]);
    expect(inventedNumbers("1240 merchants paid through us in September.", ctx.claimSources)).toEqual([]);
  });

  it("needs a workspace and a graph", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gtm-ground-"));
    await expect(ground(dir, [])).rejects.toThrow(/AGENTS.md/);
    await writeFile(join(dir, "AGENTS.md"), "# workspace\n");
    await expect(ground(dir, [{ claim: "abc", inputs: ["d"], sql: "select 1" }], { env: {} })).rejects.toThrow(/FOUNDRY_URL/);
  });

  it("renders evidence as a table a person can rerun", () => {
    const md = evidenceMarkdown([{ claim: "A | B", value: "7", at: "2026-10-10T00:00:00.000Z", inputs: ["d1", "d2"], sql: "select\n  7" }], { workspaceId: "ws" });
    expect(md).toContain("| A \\| B | 7 | 2026-10-10 | d1, d2 | `select 7` |");
  });
});
