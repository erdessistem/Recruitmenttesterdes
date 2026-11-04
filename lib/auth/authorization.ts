import "server-only";
import type { Repository } from "@/lib/repositories/types";
import { verifySession } from "./token";
export async function authorizeSession(repository: Repository, token: string) {
  const session = await verifySession(token);
  if (!session) return null;
  const admin = await repository.getAdminByEmail(session.email);
  return admin && admin.active && admin.role === "superadmin" && admin.sessionVersion === session.version ? admin : null;
}
