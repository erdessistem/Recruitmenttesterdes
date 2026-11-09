import "server-only";

import { randomBytes } from "node:crypto";

import {
  formatApplicantId,
  UNIQUE_CODE_ALPHABET,
  UNIQUE_CODE_LENGTH,
} from "@/lib/format/applicant-id";

type RandomBytes = (size: number) => Uint8Array;

export class ApplicantIdGenerationError extends Error {
  constructor(message = "Gagal membuat Applicant ID yang unik.") {
    super(message);
    this.name = "ApplicantIdGenerationError";
  }
}

/**
 * Generates a confusion-safe code using a cryptographically secure generator.
 * The alphabet length is 32, so byte modulo is unbiased.
 */
export function generateUniqueCode(
  random: RandomBytes = randomBytes,
  length: number = UNIQUE_CODE_LENGTH,
): string {
  const bytes = random(length);
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += UNIQUE_CODE_ALPHABET[bytes[index]! % UNIQUE_CODE_ALPHABET.length];
  }

  return code;
}

/** Generates a 16-byte base64url secret token for tracking links. */
export function generateSecretToken(random: RandomBytes = randomBytes): string {
  return Buffer.from(random(16)).toString("base64url");
}

export interface ApplicantIdOptions {
  maxAttempts?: number;
  random?: RandomBytes;
}

/**
 * Generates an Applicant ID and retries when the candidate ID already exists.
 * Collisions are extremely unlikely, but the check is required by the data model.
 */
export async function generateApplicantIdWithRetry(
  positionCode: string,
  fullName: string,
  exists: (id: string) => Promise<boolean>,
  options: ApplicantIdOptions = {},
): Promise<string> {
  const maxAttempts = options.maxAttempts ?? 10;
  const random = options.random ?? randomBytes;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = formatApplicantId(positionCode, fullName, generateUniqueCode(random));

    if (!(await exists(candidate))) return candidate;
  }

  throw new ApplicantIdGenerationError();
}

/** Generates a non-identifying `ANON-XXXXXX` ID for retention cleanup. */
export async function generateAnonymizedIdWithRetry(
  exists: (id: string) => Promise<boolean>,
  options: ApplicantIdOptions = {},
): Promise<string> {
  const maxAttempts = options.maxAttempts ?? 10;
  const random = options.random ?? randomBytes;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = `ANON-${generateUniqueCode(random)}`;
    if (!(await exists(candidate))) return candidate;
  }

  throw new ApplicantIdGenerationError("Gagal membuat ID anonim yang unik.");
}
