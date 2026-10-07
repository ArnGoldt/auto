"use server";

import { db } from "@/db";
import {
  clientAccounts,
  clients,
  memberships,
  staffUsers,
} from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import {
  clearClientSession,
  clearStaffSession,
  setClientSession,
  setStaffSession,
} from "@/lib/session";
import { staffHomePath } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function staffLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.query.staffUsers.findFirst({
    where: eq(staffUsers.email, email),
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=1");
  }
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
  });
  if (!membership) redirect("/login?error=1");

  await setStaffSession({
    userId: user.id,
    organizationId: user.organizationId,
    role: membership.role,
    allBranches: membership.allBranches,
    workshopId: membership.workshopId,
  });
  redirect(staffHomePath(membership.role));
}

export async function staffLogout() {
  await clearStaffSession();
  redirect("/login");
}

export async function clientLogin(formData: FormData) {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const account = await db.query.clientAccounts.findFirst({
    where: eq(clientAccounts.login, login),
  });
  if (
    !account ||
    !account.enabled ||
    !(await verifyPassword(password, account.passwordHash))
  ) {
    redirect("/client/login?error=1");
  }
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, account.clientId),
  });
  if (!client) redirect("/client/login?error=1");

  await setClientSession({
    clientAccountId: account.id,
    clientId: client.id,
    organizationId: client.organizationId,
  });
  redirect("/client");
}

export async function clientLogout() {
  await clearClientSession();
  redirect("/client/login");
}
