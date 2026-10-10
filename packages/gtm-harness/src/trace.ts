import { createHash } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * What happened in a workspace, one line per tool call or command, in .shonin/trace.jsonl: the
 * founder's audit log and the evals' transcript. Personal fields (names, handles, messages,
 * evidence) are hashed, never stored: the log keeps a fingerprint, the workspace keeps the data.
 * Node only.
 */

export interface TraceEvent {
  readonly at: string;
  readonly actor: "mcp" | "cli";
  readonly action: string;
  readonly ok: boolean;
  /** The arguments, with personal fields replaced by a short hash. */
  readonly args?: Readonly<Record<string, unknown>>;
  /** The result. Stored only as a hash: tool output names people. */
  readonly result?: string;
}

const PERSONAL = new Set([
  "file",
  "draft",
  "path",
  "handle",
  "to",
  "text",
  "name",
  "who",
  "subject",
  "source",
  "notes",
  "evidence",
  "criteria",
  "change",
  "done",
  "blockers",
  "next",
  "mistakes",
  "learnings",
  "desires",
  "disqualifier",
]);

const fingerprint = (value: unknown) => `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12)}`;

export function redact(args: Readonly<Record<string, unknown>> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args ?? {})) out[key] = PERSONAL.has(key) ? fingerprint(value) : value;
  return out;
}

export const TRACE_FILE = join(".shonin", "trace.jsonl");

export async function trace(dir: string, event: TraceEvent): Promise<void> {
  try {
    await mkdir(join(dir, ".shonin"), { recursive: true });
    const line = { ...event, ...(event.args ? { args: redact(event.args) } : {}), ...(event.result !== undefined ? { result: fingerprint(event.result) } : {}) };
    await appendFile(join(dir, TRACE_FILE), `${JSON.stringify(line)}\n`);
  } catch {
    // The trace must never be why a tool call fails.
  }
}
