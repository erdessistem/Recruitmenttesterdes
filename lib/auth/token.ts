import { SignJWT, jwtVerify } from "jose";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

export interface SessionPayload { email: string; version: number }
function secret() {
  const value = process.env.AUTH_SECRET;
  if (value && value.length >= 32) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET wajib diatur di production (minimal 32 karakter).");
  return new TextEncoder().encode("development-only-insecure-auth-secret-change-before-production");
}
export async function signSession(payload: SessionPayload) {
  return new SignJWT({ email: payload.email, version: payload.version }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`).sign(secret());
}
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.email !== "string" || !Number.isSafeInteger(payload.version) || typeof payload.exp !== "number" || typeof payload.iat !== "number") return null;
    return { email: payload.email, version: payload.version as number };
  } catch { return null; }
}
