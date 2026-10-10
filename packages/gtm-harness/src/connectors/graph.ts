/**
 * The company graph: the founder's own data, read through a Helix Foundry workspace
 * (Apache-2.0, https://github.com/HelixDB/helix-foundry). Foundry connects Postgres, MySQL,
 * Stripe, REST APIs, S3 and files into one ontology on the founder's machine, and runs SQL
 * over immutable snapshots in a sandboxed DuckDB with no internet access.
 *
 * The harness uses it for one thing: numbers a draft may quote. Each evidence query is SQL
 * that returns exactly one value (a count, a sum, a median). Foundry executes it; code checks
 * the shape; the value lands in brain/products/evidence.md with the SQL and the time, so the
 * claims check accepts it and anyone can rerun it. Rows never enter the workspace, so no
 * customer record reaches a model or a hosted Desk: only the aggregate does.
 *
 * Read-only by construction. This client has no call for Foundry's actions, sources,
 * proposals or pipelines, refuses SQL that isn't a single SELECT, and should be given a
 * read-only token (Settings → Developer tools, or `readOnly: true`).
 */

export interface GraphConfig {
  /** Where Foundry runs, e.g. http://localhost:3001. Foundry must stay on the founder's machine. */
  readonly baseUrl: string;
  readonly workspaceId: string;
  /** A workspace-scoped, read-only Foundry API token. */
  readonly token: string;
  readonly fetch?: typeof fetch;
}

/** One question the founder's data can answer with one number. */
export interface EvidenceQuery {
  /** The claim as a draft would say it, e.g. "Merchants paying in the last 90 days". */
  readonly claim: string;
  /** Foundry dataset ids the SQL reads. */
  readonly inputs: readonly string[];
  /** One SELECT that returns one row with one column. */
  readonly sql: string;
}

export interface Evidence extends EvidenceQuery {
  readonly value: string;
  readonly at: string;
}

export function graphFromEnv(env: Record<string, string | undefined> = process.env): GraphConfig | null {
  if (!env.FOUNDRY_URL || !env.FOUNDRY_WORKSPACE_ID || !env.FOUNDRY_TOKEN) return null;
  return { baseUrl: env.FOUNDRY_URL.replace(/\/+$/, ""), workspaceId: env.FOUNDRY_WORKSPACE_ID, token: env.FOUNDRY_TOKEN };
}

const WRITES = /\b(insert|update|delete|merge|create|drop|alter|truncate|attach|detach|copy|export|import|install|load|pragma|set|call|grant|revoke|vacuum|checkpoint)\b/i;

/**
 * A single read-only SELECT (or WITH … SELECT). Foundry's executor is read-only already;
 * this is the second lock, so a model-written query can't even ask for a write.
 */
export function readOnlySqlProblem(sql: string): string | null {
  const body = sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:[^']|'')*'/g, "''")
    .trim()
    .replace(/;\s*$/, "");
  if (!body) return "the SQL is empty";
  if (body.includes(";")) return "it has more than one statement";
  if (!/^(select|with)\b/i.test(body)) return "it doesn't start with SELECT or WITH";
  const write = body.match(WRITES);
  if (write) return `it uses ${write[0].toUpperCase()}`;
  return null;
}

async function call(cfg: GraphConfig, path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<unknown> {
  const res = await (cfg.fetch ?? fetch)(`${cfg.baseUrl}/api/v1/workspaces/${encodeURIComponent(cfg.workspaceId)}${path}`, {
    method: init.method,
    headers: { authorization: `Bearer ${cfg.token}`, ...(init.body === undefined ? {} : { "content-type": "application/json" }) },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  if (res.status === 401) throw new Error("Foundry refused the token (401). Make a read-only token in Settings → Developer tools.");
  if (!res.ok) throw new Error(`Foundry answered ${res.status} on ${path}`);
  return res.json();
}

/**
 * Rows from Foundry's query result. Its reference documents "a read-only result and profile"
 * without pinning the field names, so this accepts the shapes it could take and fails loudly
 * on anything else rather than guessing a number.
 */
function rowsOf(result: unknown): unknown[] {
  const r = result as Record<string, unknown> | unknown[];
  if (Array.isArray(r)) return r;
  for (const candidate of [r?.rows, (r?.result as Record<string, unknown> | undefined)?.rows, r?.result, r?.data]) {
    if (Array.isArray(candidate)) return candidate;
  }
  throw new Error("Foundry's query answer has no rows array; check /api/docs for this version's shape");
}

function single(rows: unknown[]): string {
  if (rows.length !== 1) throw new Error(`returned ${rows.length} rows; evidence is one number, so aggregate in SQL`);
  const row = rows[0];
  const values = Array.isArray(row) ? row : row && typeof row === "object" ? Object.values(row) : [row];
  if (values.length !== 1) throw new Error(`returned ${values.length} columns; evidence is one number, so select one`);
  const value = values[0];
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) return value.trim();
  throw new Error("didn't return a number");
}

/** Run one evidence query in Foundry and keep only its single value. */
export async function runEvidence(cfg: GraphConfig, query: EvidenceQuery, now: Date = new Date()): Promise<Evidence> {
  const problem = readOnlySqlProblem(query.sql);
  if (problem) throw new Error(`"${query.claim}": not run, because ${problem}`);
  if (!query.inputs.length) throw new Error(`"${query.claim}": name the dataset ids the SQL reads`);
  try {
    const value = single(rowsOf(await call(cfg, "/query", { method: "POST", body: { inputs: query.inputs, sql: query.sql } })));
    return { ...query, value, at: now.toISOString() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message.startsWith("Foundry") ? message : `"${query.claim}" ${message}`);
  }
}

/** Ontology objects of one kind, to see what the graph holds. Documented as `{ items, total }`. */
export async function listResources(
  cfg: GraphConfig,
  kind: string,
  opts: { search?: string; limit?: number } = {},
): Promise<{ items: { id: string; name: string; description?: string }[]; total: number }> {
  const params = new URLSearchParams({ offset: "0", limit: String(Math.min(Math.max(opts.limit ?? 50, 1), 100)) });
  if (opts.search) params.set("search", opts.search);
  const result = (await call(cfg, `/resources/${encodeURIComponent(kind)}?${params}`, { method: "GET" })) as {
    items?: { id: string; name: string; description?: string }[];
    total?: number;
  };
  const items = (result.items ?? []).map(({ id, name, description }) => ({ id, name, ...(description ? { description } : {}) }));
  return { items, total: result.total ?? items.length };
}

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

/**
 * brain/products/evidence.md: the claims a draft may quote from the founder's own data,
 * each with the SQL that produced it. The claims check reads every file in brain/products/.
 */
export function evidenceMarkdown(evidence: readonly Evidence[], source: { workspaceId: string }): string {
  const rows = evidence.map((e) => `| ${cell(e.claim)} | ${e.value} | ${e.at.slice(0, 10)} | ${cell(e.inputs.join(", "))} | \`${cell(e.sql)}\` |`);
  return [
    "# Evidence from the company graph",
    "",
    `Numbers from the founder's own data, run by code in Helix Foundry workspace \`${source.workspaceId}\`. Only these aggregates are stored here; no rows. Rerun with \`pnpm gtm ground <dir> --queries <file>\`; a number older than 30 days should be rerun before it's quoted.`,
    "",
    "| Claim | Value | As of | Datasets | SQL |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}
