/**
 * Where the hosted harness keeps its state. Production uses Upstash Redis over its REST API,
 * called with plain fetch (no client library). Tests and local dev use the memory store, so a
 * test never touches the network.
 */

export interface Store {
  get(key: string): Promise<string | null>;
  /** With ex, the key expires after that many seconds. With nx, it's set only if it doesn't exist; returns false if it did. */
  set(key: string, value: string, opts?: { ex?: number; nx?: boolean }): Promise<boolean>;
  del(key: string): Promise<void>;
  /** Pushes to the head of a list. */
  lpush(key: string, value: string): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  /** Keeps only the first `keep` items of a list. */
  ltrim(key: string, keep: number): Promise<void>;
  /** Adds one and returns the new value; the first increment sets the expiry. */
  incr(key: string, ex?: number): Promise<number>;
}

export async function getJson<T>(store: Store, key: string): Promise<T | null> {
  const raw = await store.get(key);
  return raw === null ? null : (JSON.parse(raw) as T);
}

export async function setJson(store: Store, key: string, value: unknown, opts?: { ex?: number }): Promise<void> {
  await store.set(key, JSON.stringify(value), opts);
}

export class MemoryStore implements Store {
  private readonly values = new Map<string, { value: string; expires?: number }>();
  private readonly lists = new Map<string, string[]>();
  constructor(private readonly now: () => number = Date.now) {}

  private live(key: string) {
    const v = this.values.get(key);
    if (v?.expires !== undefined && v.expires <= this.now()) {
      this.values.delete(key);
      return undefined;
    }
    return v;
  }
  async get(key: string) {
    return this.live(key)?.value ?? null;
  }
  async set(key: string, value: string, opts: { ex?: number; nx?: boolean } = {}) {
    if (opts.nx && this.live(key)) return false;
    this.values.set(key, { value, ...(opts.ex ? { expires: this.now() + opts.ex * 1000 } : {}) });
    return true;
  }
  async del(key: string) {
    this.values.delete(key);
    this.lists.delete(key);
  }
  async lpush(key: string, value: string) {
    this.lists.set(key, [value, ...(this.lists.get(key) ?? [])]);
  }
  async lrange(key: string, start: number, stop: number) {
    const list = this.lists.get(key) ?? [];
    return list.slice(start, stop < 0 ? list.length + stop + 1 : stop + 1);
  }
  async ltrim(key: string, keep: number) {
    this.lists.set(key, (this.lists.get(key) ?? []).slice(0, keep));
  }
  async incr(key: string, ex?: number) {
    const current = Number(this.live(key)?.value ?? 0) + 1;
    const existing = this.live(key);
    this.values.set(key, { value: String(current), ...(existing?.expires !== undefined ? { expires: existing.expires } : ex ? { expires: this.now() + ex * 1000 } : {}) });
    return current;
  }
}

/** Upstash Redis REST: POST the command as a JSON array, read { result }. */
export class UpstashStore implements Store {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private async command<T>(...args: (string | number)[]): Promise<T> {
    const res = await this.fetcher(this.url, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as { result?: T; error?: string } | null;
    if (!res.ok || !json || json.error) throw new Error(`Store ${String(args[0])} failed: ${json?.error ?? res.status}`);
    return json.result as T;
  }
  async get(key: string) {
    return this.command<string | null>("GET", key);
  }
  async set(key: string, value: string, opts: { ex?: number; nx?: boolean } = {}) {
    const args: (string | number)[] = ["SET", key, value];
    if (opts.ex) args.push("EX", opts.ex);
    if (opts.nx) args.push("NX");
    return (await this.command<string | null>(...args)) === "OK";
  }
  async del(key: string) {
    await this.command("DEL", key);
  }
  async lpush(key: string, value: string) {
    await this.command("LPUSH", key, value);
  }
  async lrange(key: string, start: number, stop: number) {
    return this.command<string[]>("LRANGE", key, start, stop);
  }
  async ltrim(key: string, keep: number) {
    await this.command("LTRIM", key, 0, keep - 1);
  }
  async incr(key: string, ex?: number) {
    const value = await this.command<number>("INCR", key);
    if (value === 1 && ex) await this.command("EXPIRE", key, ex);
    return value;
  }
}

type Env = Record<string, string | undefined>;

/** Upstash when its REST credentials are set (Vercel's Upstash integration injects KV_REST_API_*), memory otherwise. */
export function storeFromEnv(env: Env = process.env, fetcher?: typeof fetch): { store: Store; kind: "upstash" | "memory" } {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { store: new UpstashStore(url, token, fetcher), kind: "upstash" };
  return { store: memory, kind: "memory" };
}

/** One memory store per server process, so local dev keeps state between requests. */
const memory = new MemoryStore();
