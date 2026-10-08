import { db } from "@/db";
import { memberships, staffUsers, workshops } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function listOrgStaff(organizationId: string) {
  const rows = await db
    .select({
      id: staffUsers.id,
      fullName: staffUsers.fullName,
      email: staffUsers.email,
      active: staffUsers.active,
      role: memberships.role,
      allBranches: memberships.allBranches,
      workshopId: memberships.workshopId,
      workshopName: workshops.name,
    })
    .from(staffUsers)
    .innerJoin(memberships, eq(memberships.userId, staffUsers.id))
    .leftJoin(workshops, eq(workshops.id, memberships.workshopId))
    .where(eq(staffUsers.organizationId, organizationId));

  return rows;
}

export async function getStaffForEdit(organizationId: string, userId: string) {
  const [row] = await db
    .select({
      id: staffUsers.id,
      fullName: staffUsers.fullName,
      email: staffUsers.email,
      active: staffUsers.active,
      role: memberships.role,
      allBranches: memberships.allBranches,
      workshopId: memberships.workshopId,
    })
    .from(staffUsers)
    .innerJoin(memberships, eq(memberships.userId, staffUsers.id))
    .where(
      and(
        eq(staffUsers.id, userId),
        eq(staffUsers.organizationId, organizationId),
      ),
    );

  return row ?? null;
}

export async function listOrgWorkshops(organizationId: string) {
  return db.query.workshops.findMany({
    where: eq(workshops.organizationId, organizationId),
    orderBy: (w, { asc }) => [asc(w.name)],
  });
}
