import { describe, expect, it } from "vitest";
import { MemoryStore, UpstashStore } from "@/lib/security/shared-store";
import { withWriteLock } from "@/lib/security/write-lock";

describe("memory store", () => {
  it("counts hits per window and expires them", async () => {
    let now = 1_000;
    const store = new MemoryStore(() => now);
    expect(await store.hit("k", 100)).toBe(1);
    expect(await store.hit("k", 100)).toBe(2);
    now += 101;
    expect(await store.hit("k", 100)).toBe(1);
  });
  it("hands out a value only once", async () => {
    const store = new MemoryStore();
    await store.set("t", "APP-1", 1_000);
    expect(await store.take("t")).toBe("APP-1");
    expect(await store.take("t")).toBeNull();
  });
  it("gives a lock to one holder and releases only with its token", async () => {
    const store = new MemoryStore();
    const token = await store.acquire("lock", 1_000);
    expect(token).toBeTruthy();
    expect(await store.acquire("lock", 1_000)).toBeNull();
    await store.release("lock", "wrong");
    expect(await store.acquire("lock", 1_000)).toBeNull();
    await store.release("lock", token!);
    expect(await store.acquire("lock", 1_000)).toBeTruthy();
  });
});

describe("Upstash store", () => {
  function fake() {
    const data = new Map<string, string>();
    const sent: string[][][] = [];
    const fetcher = (async (url: string, init: RequestInit) => {
      expect(url).toBe("https://example.upstash.io/pipeline");
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret");
      const commands = JSON.parse(String(init.body)) as string[][];
      sent.push(commands);
      const results = commands.map(([name, key, ...rest]) => {
        if (name === "SET") {
          if (rest.includes("NX") && data.has(key)) return { result: null };
          data.set(key, rest[0]);
          return { result: "OK" };
        }
        if (name === "INCR") {
          data.set(key, String(Number(data.get(key) ?? 0) + 1));
          return { result: Number(data.get(key)) };
        }
        if (name === "GETDEL") {
          const value = data.get(key) ?? null;
          data.delete(key);
          return { result: value };
        }
        if (name === "GET") return { result: data.get(key) ?? null };
        if (name === "DEL") return { result: data.delete(key) ? 1 : 0 };
        if (name === "EVAL") {
          const [lockKey, token] = [rest[1], rest[2]];
          if (data.get(lockKey) === token) data.delete(lockKey);
          return { result: 1 };
        }
        return { error: `unknown ${name}` };
      });
      return new Response(JSON.stringify(results), { status: 200 });
    }) as unknown as typeof fetch;
    return {
      store: new UpstashStore("https://example.upstash.io/", "secret", fetcher),
      data,
      sent,
    };
  }
  it("speaks the REST pipeline protocol", async () => {
    const { store, sent } = fake();
    expect(await store.hit("rl:x", 60_000)).toBe(1);
    expect(await store.hit("rl:x", 60_000)).toBe(2);
    expect(sent[0]).toEqual([
      ["SET", "rl:x", "0", "PX", "60000", "NX"],
      ["INCR", "rl:x"],
    ]);
    await store.set("recover:h", "APP-1", 300_000);
    expect(await store.take("recover:h")).toBe("APP-1");
    expect(await store.take("recover:h")).toBeNull();
  });
  it("locks and releases with a token", async () => {
    const { store, data } = fake();
    const token = await store.acquire("lock", 20_000);
    expect(token).toBeTruthy();
    expect(await store.acquire("lock", 20_000)).toBeNull();
    await store.release("lock", token!);
    expect(data.has("lock")).toBe(false);
  });
  it("reports errors so callers can fall back", async () => {
    const failing = new UpstashStore(
      "https://example.upstash.io",
      "secret",
      (async () => new Response("down", { status: 503 })) as unknown as typeof fetch,
    );
    await expect(failing.get("k")).rejects.toThrow("Upstash 503");
  });
});

describe("write lock", () => {
  it("runs writes one at a time, even when one fails", async () => {
    const order: string[] = [];
    const slow = (name: string, ms: number, fail = false) =>
      withWriteLock(async () => {
        order.push(`${name} start`);
        await new Promise((resolve) => setTimeout(resolve, ms));
        order.push(`${name} end`);
        if (fail) throw new Error("boom");
        return name;
      });
    const results = await Promise.allSettled([slow("a", 30, true), slow("b", 5), slow("c", 1)]);
    expect(order).toEqual(["a start", "a end", "b start", "b end", "c start", "c end"]);
    expect(results.map((r) => r.status)).toEqual(["rejected", "fulfilled", "fulfilled"]);
  });
});
