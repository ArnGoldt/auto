import { db } from "@/db";
import { getStaffSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { staffUsers } from "@/db/schema";
import { isNetworkAdminRole } from "@/lib/roles";

export async function requireStaff(roles?: string[]) {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.role)) redirect("/login");
  const user = await db.query.staffUsers.findFirst({
    where: eq(staffUsers.id, session.userId),
  });
  return { session, user };
}

export async function requireNetworkAdmin() {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (!isNetworkAdminRole(session.role)) redirect("/app/access-denied");
  const user = await db.query.staffUsers.findFirst({
    where: eq(staffUsers.id, session.userId),
  });
  return { session, user };
}

export async function requireMasterSession() {
  const session = await getStaffSession();
  if (!session || session.role !== "MASTER") redirect("/login");
  return session;
}
