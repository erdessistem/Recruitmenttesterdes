import "server-only";

export type RepositoryErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "NOT_IMPLEMENTED";

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
  }
}

export function notFound(message: string): RepositoryError {
  return new RepositoryError("NOT_FOUND", message);
}

export function conflict(message: string): RepositoryError {
  return new RepositoryError("CONFLICT", message);
}
