import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/** A url-safe random id with a readable prefix: ws_…, act_…, usr_…. */
export const randomId = (prefix: string, bytes = 12) => `${prefix}_${randomBytes(bytes).toString("base64url")}`;

/** Every field but the signature, keys sorted, so the same record always signs the same way. */
function canonical(record: Readonly<Record<string, unknown>>): string {
  const { sig: _sig, ...rest } = record;
  return JSON.stringify(Object.fromEntries(Object.entries(rest).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));
}

export type Signed<T> = T & { sig: string };

export function sign<T extends Record<string, unknown>>(key: Buffer, record: T): Signed<T> {
  return { ...record, sig: createHmac("sha256", key).update(canonical(record)).digest("hex") };
}

export function verify(key: Buffer, record: Readonly<Record<string, unknown>> | undefined | null): boolean {
  if (!record || typeof record.sig !== "string" || !/^[0-9a-f]{64}$/.test(record.sig)) return false;
  const expected = createHmac("sha256", key).update(canonical(record)).digest();
  return timingSafeEqual(expected, Buffer.from(record.sig, "hex"));
}

/** Compares two strings without leaking where they differ. */
export function safeEqual(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y) && a.length === b.length;
}

/** AES-256-GCM. The output is iv.tag.ciphertext, each base64url. */
export function encrypt(key: Buffer, plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(key: Buffer, sealed: string): string {
  const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
  if (!iv || !tag || !body) throw new Error("Not a sealed value");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

/** A signed, expiring token: base64url(payload).signature. Used for session cookies and one-time links. */
export function seal(key: Buffer, payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${createHmac("sha256", key).update(body).digest("base64url")}`;
}

export function unseal<T extends { exp: number }>(key: Buffer, token: string | undefined, now = Date.now()): T | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", key).update(body).digest("base64url");
  if (!safeEqual(expected, mac)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    return typeof payload.exp === "number" && payload.exp > now ? payload : null;
  } catch {
    return null;
  }
}
