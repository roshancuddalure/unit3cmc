export const roleKeys = [
  "super_admin",
  "unit_admin_or_faculty",
  "postgraduate",
  "reviewer"
] as const;

export type RoleKey = (typeof roleKeys)[number];

export const userStatuses = ["pending", "active", "suspended", "archived"] as const;

export type UserStatus = (typeof userStatuses)[number];

export interface AuthenticatedUser {
  id: string;
  unitId: string;
  role: RoleKey;
  name: string;
  username: string;
  displayName: string;
  email: string;
  status: UserStatus;
  mustChangePassword: boolean;
}

export interface DashboardSnapshot {
  logbookEntries: number;
  pendingReviews: number;
  activeLearners: number;
  sopDocuments: number;
  caseArchiveEntries: number;
}
