import "server-only";
import { createHash } from "node:crypto";
import { withStore } from "./shared-store";

function key(scope: string, identity: string) {
  return `rl:${scope}:${createHash("sha256").update(identity).digest("hex")}`;
}

/**
 * Counts one attempt and says whether it is within `limit` per fixed window.
 * Shared across server instances when Upstash is configured.
 */
export async function allowAttempt(
  scope: string,
  identity: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<boolean> {
  const window = Math.floor(now / windowMs);
  const count = await withStore((store) =>
    store.hit(`${key(scope, identity)}:${window}`, windowMs),
  );
  return count <= limit;
}

/** Failed admin logins: counted on failure, cleared on success. */
export const loginFailures = {
  async blocked(identity: string, limit: number) {
    const value = await withStore((store) => store.get(key("login", identity)));
    return Number(value ?? 0) >= limit;
  },
  async record(identity: string, windowMs: number) {
    await withStore((store) => store.hit(key("login", identity), windowMs));
  },
  async clear(identity: string) {
    await withStore((store) => store.delete(key("login", identity)));
  },
};
