import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/**
 * Signed records: the founder's approvals and the reviewer's verdicts. An agent working in the
 * workspace can write any file in it, so a line in approvals.jsonl proves nothing by itself. Each
 * record is signed with a key that lives outside every workspace, in the founder's own config
 * folder; a record that doesn't verify counts for nothing, and `pnpm gtm check` says so.
 *
 * This raises the bar from appending a line to reading a secret the agent was never given. The
 * hosted runtime closes it fully: only the server writes approvals. Node only.
 */

type Env = Record<string, string | undefined>;

/** Where the signing key lives: GTM_APPROVAL_KEY_FILE, or ~/.config/shonin-gtm/approval.key. */
export function approvalKeyPath(env: Env = process.env): string {
  return env.GTM_APPROVAL_KEY_FILE || join(env.XDG_CONFIG_HOME || join(homedir(), ".config"), "shonin-gtm", "approval.key");
}

/** The key, or null when none exists yet. With create, makes one readable only by this user. */
export async function loadApprovalKey(env: Env = process.env, create = false): Promise<Buffer | null> {
  const path = approvalKeyPath(env);
  try {
    const hex = (await readFile(path, "utf8")).trim();
    if (/^[0-9a-f]{64}$/i.test(hex)) return Buffer.from(hex, "hex");
    throw new Error(`${path} isn't a signing key (64 hex characters). Move it aside, and the next approval makes a new one.`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    if (!create) return null;
    const key = randomBytes(32);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, `${key.toString("hex")}\n`, { mode: 0o600 });
    return key;
  }
}

/** Every field but the signature, keys sorted, so the same record always signs the same way. */
function canonical(record: Readonly<Record<string, unknown>>): string {
  const { sig: _sig, ...rest } = record;
  return JSON.stringify(Object.fromEntries(Object.entries(rest).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));
}

export function signRecord<T extends Record<string, unknown>>(key: Buffer, record: T): T & { sig: string } {
  return { ...record, sig: createHmac("sha256", key).update(canonical(record)).digest("hex") };
}

export function verifyRecord(key: Buffer | null, record: Readonly<Record<string, unknown>>): boolean {
  if (!key || typeof record.sig !== "string" || !/^[0-9a-f]{64}$/.test(record.sig)) return false;
  const expected = createHmac("sha256", key).update(canonical(record)).digest();
  return timingSafeEqual(expected, Buffer.from(record.sig, "hex"));
}

/** Appends one signed record, making the key on first use. */
export async function appendSigned(path: string, record: Record<string, unknown>, env: Env = process.env): Promise<void> {
  const key = (await loadApprovalKey(env, true))!;
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(signRecord(key, record))}\n`);
}

/** Every parseable line, split into the ones this machine's key signed and the ones it didn't. */
export async function readSigned<T>(
  path: string,
  accept: (value: Record<string, unknown>) => value is T & Record<string, unknown>,
  env: Env = process.env,
): Promise<{ trusted: T[]; untrusted: { line: number; value: Record<string, unknown> }[] }> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { trusted: [], untrusted: [] };
    throw error;
  }
  const key = await loadApprovalKey(env, false);
  const trusted: T[] = [];
  const untrusted: { line: number; value: Record<string, unknown> }[] = [];
  text.split("\n").forEach((raw, i) => {
    if (!raw.trim()) return;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      return; // A torn last line from a crash is skipped, never guessed at.
    }
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    if (accept(record) && verifyRecord(key, record)) trusted.push(record);
    else untrusted.push({ line: i + 1, value: record });
  });
  return { trusted, untrusted };
}
