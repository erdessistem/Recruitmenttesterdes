import "server-only";
import type { Repository } from "@/lib/repositories/types";
import { verifySession } from "./token";
import { isAdminRole } from "./roles";
export async function authorizeSession(repository: Repository, token: string) {
  const session = await verifySession(token);
  if (!session) return null;
  const admin = await repository.getAdminByEmail(session.email);
  return admin && admin.active && isAdminRole(admin.role) && admin.sessionVersion === session.version ? admin : null;
}
