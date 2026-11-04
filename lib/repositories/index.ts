import "server-only";
import { MemoryRepository } from "./memory";
import type { Repository } from "./types";
import { createSheetsRepository } from "./sheets";
import { hasGoogleSheetsConfig } from "@/lib/env";

const globalRepository = globalThis as typeof globalThis & { __erdesRepository?: Repository };
/** Development defaults to seed data; production must never silently use ephemeral memory. */
export const repository: Repository = globalRepository.__erdesRepository ??= hasGoogleSheetsConfig() ? createSheetsRepository() : process.env.NODE_ENV === "production" ? new Proxy({} as Repository, { get: () => async () => { throw new Error("Google Sheets belum dikonfigurasi."); } }) : new MemoryRepository();
