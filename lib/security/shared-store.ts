import "server-only";
import { randomBytes } from "node:crypto";
import { getRateLimitConfig } from "@/lib/env";

/**
 * A tiny key-value store shared by every server instance (Upstash Redis over REST),
 * used for rate limits, lost-ID recovery handles and the Sheets write lock.
 * Without Upstash settings it falls back to this process's memory, which works on
 * one server but is not shared between Vercel instances.
 */
export interface SharedStore {
  readonly shared: boolean;
  /** Adds one hit in a fixed window and returns the hits so far, including this one. */
  hit(key: string, windowMs: number): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
  /** Reads and deletes in one step, so a value can be used only once. */
  take(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  /** Sets the key only if it is free. Returns a token for release, or null when taken. */
  acquire(key: string, ttlMs: number): Promise<string | null>;
  /** Releases only if the key still holds this token (another holder's lock is never removed). */
  release(key: string, token: string): Promise<void>;
}

type Entry = { value: string; expires: number };

export class MemoryStore implements SharedStore {
  readonly shared = false;
  private entries = new Map<string, Entry>();
  constructor(private readonly now: () => number = () => Date.now()) {}

  private read(key: string): Entry | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expires <= this.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry;
  }
  private prune() {
    if (this.entries.size < 5_000) return;
    for (const key of this.entries.keys()) this.read(key);
  }
  async hit(key: string, windowMs: number) {
    this.prune();
    const entry = this.read(key) ?? { value: "0", expires: this.now() + windowMs };
    entry.value = String(Number(entry.value) + 1);
    this.entries.set(key, entry);
    return Number(entry.value);
  }
  async get(key: string) {
    return this.read(key)?.value ?? null;
  }
  async set(key: string, value: string, ttlMs: number) {
    this.prune();
    this.entries.set(key, { value, expires: this.now() + ttlMs });
  }
  async take(key: string) {
    const value = this.read(key)?.value ?? null;
    this.entries.delete(key);
    return value;
  }
  async delete(key: string) {
    this.entries.delete(key);
  }
  async acquire(key: string, ttlMs: number) {
    if (this.read(key)) return null;
    const token = randomBytes(16).toString("hex");
    this.entries.set(key, { value: token, expires: this.now() + ttlMs });
    return token;
  }
  async release(key: string, token: string) {
    if (this.read(key)?.value === token) this.entries.delete(key);
  }
}

const RELEASE_SCRIPT =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

export class UpstashStore implements SharedStore {
  readonly shared = true;
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private async pipeline(commands: Array<Array<string | number>>): Promise<unknown[]> {
    const response = await this.fetcher(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands.map((command) => command.map(String))),
      signal: AbortSignal.timeout(3_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Upstash ${response.status}`);
    const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    return results.map((item) => {
      if (item.error) throw new Error(`Upstash: ${item.error}`);
      return item.result;
    });
  }
  async hit(key: string, windowMs: number) {
    const [, count] = await this.pipeline([
      ["SET", key, "0", "PX", windowMs, "NX"],
      ["INCR", key],
    ]);
    return Number(count);
  }
  async get(key: string) {
    const [value] = await this.pipeline([["GET", key]]);
    return value == null ? null : String(value);
  }
  async set(key: string, value: string, ttlMs: number) {
    await this.pipeline([["SET", key, value, "PX", ttlMs]]);
  }
  async take(key: string) {
    const [value] = await this.pipeline([["GETDEL", key]]);
    return value == null ? null : String(value);
  }
  async delete(key: string) {
    await this.pipeline([["DEL", key]]);
  }
  async acquire(key: string, ttlMs: number) {
    const token = randomBytes(16).toString("hex");
    const [result] = await this.pipeline([["SET", key, token, "PX", ttlMs, "NX"]]);
    return result === "OK" ? token : null;
  }
  async release(key: string, token: string) {
    await this.pipeline([["EVAL", RELEASE_SCRIPT, 1, key, token]]);
  }
}

/** Upstash keys from this app's own variables, or the names Vercel's Upstash integration adds. */
function upstashConfig() {
  const own = getRateLimitConfig();
  if (own) return own;
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return url && token ? { url, token } : null;
}

const state = globalThis as typeof globalThis & {
  __sharedStore?: SharedStore;
  __fallbackStore?: MemoryStore;
};

/** Process memory, used when Upstash is not set up or does not answer. */
export function fallbackStore(): MemoryStore {
  return (state.__fallbackStore ??= new MemoryStore());
}

export function sharedStore(): SharedStore {
  if (state.__sharedStore) return state.__sharedStore;
  const config = upstashConfig();
  return (state.__sharedStore = config
    ? new UpstashStore(config.url, config.token)
    : fallbackStore());
}

/** Runs against the shared store; if Upstash fails, logs once and uses process memory instead. */
export async function withStore<T>(task: (store: SharedStore) => Promise<T>): Promise<T> {
  const store = sharedStore();
  try {
    return await task(store);
  } catch (error) {
    if (!store.shared) throw error;
    console.error("Shared store unavailable, using process memory:", (error as Error).message);
    return task(fallbackStore());
  }
}
