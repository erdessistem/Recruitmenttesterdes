import "server-only";
import { RepositoryError } from "@/lib/repositories/errors";
import { fallbackStore, sharedStore, type SharedStore } from "./shared-store";

const LOCK_KEY = "lock:sheets-write";
/** A holder that crashes frees the lock after this long. Longer than any single write. */
const LOCK_TTL_MS = 20_000;
/** How long a request waits for its turn before giving up. */
const WAIT_MS = 8_000;

const state = globalThis as typeof globalThis & { __writeQueue?: Promise<unknown> };

/** Runs one at a time inside this process, so local requests never race each other. */
function inProcess<T>(task: () => Promise<T>): Promise<T> {
  const previous = state.__writeQueue ?? Promise.resolve();
  const run = previous.then(task, task);
  state.__writeQueue = run.catch(() => undefined);
  return run;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function acquire(): Promise<{ store: SharedStore; token: string }> {
  let store = sharedStore();
  const deadline = Date.now() + WAIT_MS;
  for (;;) {
    let token: string | null;
    try {
      token = await store.acquire(LOCK_KEY, LOCK_TTL_MS);
    } catch (error) {
      if (!store.shared) throw error;
      // Upstash did not answer: fall back to this process only, as before Upstash existed.
      console.error("Write lock unavailable, using process lock:", (error as Error).message);
      store = fallbackStore();
      continue;
    }
    if (token) return { store, token };
    if (Date.now() >= deadline) {
      throw new RepositoryError(
        "CONFLICT",
        "Sistem sedang sibuk. Silakan coba lagi sebentar lagi.",
      );
    }
    await sleep(100 + Math.random() * 150);
  }
}

/**
 * Lets only one request at a time read-modify-write the spreadsheet, across all
 * server instances when Upstash is configured. Google Sheets has no locking of its
 * own, so without this two simultaneous changes can overwrite each other.
 */
export function withWriteLock<T>(task: () => Promise<T>): Promise<T> {
  return inProcess(async () => {
    const { store, token } = await acquire();
    try {
      return await task();
    } finally {
      await store.release(LOCK_KEY, token).catch((error: Error) => {
        console.error("Write lock release failed; it expires on its own:", error.message);
      });
    }
  });
}
