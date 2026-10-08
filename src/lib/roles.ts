export const NETWORK_ADMIN_ROLES = ["NETWORK_ADMIN", "NETWORK_DIRECTOR"] as const;

export type NetworkAdminRole = (typeof NETWORK_ADMIN_ROLES)[number];

export function isNetworkAdminRole(role: string): role is NetworkAdminRole {
  return (NETWORK_ADMIN_ROLES as readonly string[]).includes(role);
}

/** Roles that network admins may assign to staff (excludes director — org-level only). */
export const ASSIGNABLE_STAFF_ROLES = [
  "MANAGER",
  "MASTER",
  "QC",
  "NETWORK_ADMIN",
  "BRANCH_DIRECTOR",
] as const;

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];

const ROLE_LABELS: Record<string, string> = {
  NETWORK_ADMIN: "Администратор сети",
  NETWORK_DIRECTOR: "Директор сети",
  MANAGER: "Менеджер",
  MASTER: "Мастер",
  QC: "Контроль качества",
  BRANCH_DIRECTOR: "Директор филиала",
};

export function staffRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function roleNeedsWorkshop(role: string): boolean {
  return role === "MASTER" || role === "BRANCH_DIRECTOR";
}

export function roleSupportsAllBranches(role: string): boolean {
  return role === "MANAGER" || role === "NETWORK_ADMIN" || role === "NETWORK_DIRECTOR";
}
