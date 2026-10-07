import { StaffSession } from "./session";

export function staffHomePath(role: string) {
  if (role === "MASTER") return "/master";
  return "/app";
}

export function requireStaffRole(session: StaffSession | null, roles: string[]) {
  if (!session) return false;
  return roles.includes(session.role);
}

export function canAccessWorkshop(
  session: StaffSession,
  workshopId: string,
): boolean {
  if (session.allBranches) return true;
  return session.workshopId === workshopId;
}
