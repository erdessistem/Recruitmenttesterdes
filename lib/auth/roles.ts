import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";

const RANK: Record<AdminRole, number> = { viewer: 0, hr: 1, superadmin: 2 };

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

/** True when the role has at least the access of `minimum`. */
export function hasRole(role: AdminRole, minimum: AdminRole): boolean {
  return RANK[role] >= RANK[minimum];
}

/** HR and superadmins change data; viewers only read. */
export const canEdit = (role: AdminRole) => hasRole(role, "hr");
export const canManage = (role: AdminRole) => hasRole(role, "superadmin");
