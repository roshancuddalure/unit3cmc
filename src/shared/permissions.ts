import type { RoleKey } from "./types/domain";

const permissionMatrix: Record<RoleKey, string[]> = {
  super_admin: [
    "dashboard:view",
    "logbook:write",
    "logbook:review",
    "documents:view",
    "documents:write",
    "documents:review",
    "learning:view",
    "learning:manage",
    "cases:view",
    "cases:write",
    "admin:manage"
  ],
  unit_admin_or_faculty: [
    "dashboard:view",
    "logbook:write",
    "logbook:review",
    "documents:view",
    "documents:write",
    "documents:review",
    "learning:view",
    "learning:manage",
    "cases:view",
    "cases:write"
  ],
  faculty: [
    "dashboard:view",
    "logbook:write",
    "logbook:involved-view",
    "learning:view",
    "documents:view",
    "cases:view",
    "cases:write"
  ],
  postgraduate: [
    "dashboard:view",
    "logbook:write",
    "learning:view",
    "documents:view",
    "cases:view",
    "cases:write"
  ],
  reviewer: [
    "dashboard:view",
    "logbook:write",
    "logbook:review",
    "documents:view",
    "documents:review",
    "learning:view",
    "cases:view",
    "cases:write"
  ]
};

export function hasPermission(role: RoleKey, permission: string): boolean {
  return permissionMatrix[role].includes(permission);
}
