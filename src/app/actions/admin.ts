"use server";

import { db } from "@/db";
import {
  memberships,
  organizations,
  staffUsers,
  workshops,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import {
  ASSIGNABLE_STAFF_ROLES,
  roleNeedsWorkshop,
  roleSupportsAllBranches,
} from "@/lib/roles";
import { requireNetworkAdmin } from "@/lib/staff-data";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function adminSession() {
  const { session, user } = await requireNetworkAdmin();
  if (!user) throw new Error("User not found");
  return { session, user };
}

async function ensureUniqueEmail(
  organizationId: string,
  email: string,
  excludeUserId?: string,
) {
  const normalized = email.trim().toLowerCase();
  const existing = await db.query.staffUsers.findFirst({
    where: excludeUserId
      ? and(
          eq(staffUsers.organizationId, organizationId),
          eq(staffUsers.email, normalized),
          ne(staffUsers.id, excludeUserId),
        )
      : and(
          eq(staffUsers.organizationId, organizationId),
          eq(staffUsers.email, normalized),
        ),
  });
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }
  return normalized;
}

function parseStaffRole(raw: string) {
  if (!(ASSIGNABLE_STAFF_ROLES as readonly string[]).includes(raw)) {
    throw new Error("INVALID_ROLE");
  }
  return raw as (typeof ASSIGNABLE_STAFF_ROLES)[number];
}

export async function createStaff(formData: FormData) {
  const { session, user } = await adminSession();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = parseStaffRole(String(formData.get("role") ?? ""));
  const workshopId = String(formData.get("workshopId") ?? "") || null;
  const allBranches = formData.get("allBranches") === "on";
  const active = formData.get("active") === "on";

  if (!fullName || !email || password.length < 6) {
    redirect("/app/admin/staff/new?error=validation");
  }

  if (roleNeedsWorkshop(role) && !workshopId) {
    redirect("/app/admin/staff/new?error=workshop");
  }

  let normalizedEmail: string;
  try {
    normalizedEmail = await ensureUniqueEmail(session.organizationId, email);
  } catch {
    redirect("/app/admin/staff/new?error=email");
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(staffUsers)
    .values({
      organizationId: session.organizationId,
      email: normalizedEmail,
      passwordHash,
      fullName,
      active,
    })
    .returning();

  await db.insert(memberships).values({
    userId: created.id,
    organizationId: session.organizationId,
    role,
    allBranches: roleSupportsAllBranches(role) ? allBranches : false,
    workshopId: roleNeedsWorkshop(role) ? workshopId : null,
  });

  await writeAudit({
    organizationId: session.organizationId,
    entityType: "staff_user",
    entityId: created.id,
    action: "CREATE_STAFF",
    payload: { email: normalizedEmail, role, fullName },
    actorStaffId: user.id,
  });

  revalidatePath("/app/admin/staff");
  redirect("/app/admin/staff");
}

export async function updateStaff(formData: FormData) {
  const { session, user } = await adminSession();
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = parseStaffRole(String(formData.get("role") ?? ""));
  const workshopId = String(formData.get("workshopId") ?? "") || null;
  const allBranches = formData.get("allBranches") === "on";
  const active = formData.get("active") === "on";

  const target = await db.query.staffUsers.findFirst({
    where: and(
      eq(staffUsers.id, id),
      eq(staffUsers.organizationId, session.organizationId),
    ),
  });
  if (!target) redirect("/app/admin/staff?error=notfound");

  if (!fullName || !email) {
    redirect(`/app/admin/staff/${id}?error=validation`);
  }
  if (roleNeedsWorkshop(role) && !workshopId) {
    redirect(`/app/admin/staff/${id}?error=workshop`);
  }

  let normalizedEmail: string;
  try {
    normalizedEmail = await ensureUniqueEmail(
      session.organizationId,
      email,
      id,
    );
  } catch {
    redirect(`/app/admin/staff/${id}?error=email`);
  }

  const updates: { fullName: string; email: string; active: boolean; passwordHash?: string } =
    { fullName, email: normalizedEmail, active };
  if (password.length >= 6) {
    updates.passwordHash = await hashPassword(password);
  }

  await db.update(staffUsers).set(updates).where(eq(staffUsers.id, id));

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, id),
  });
  if (membership) {
    await db
      .update(memberships)
      .set({
        role,
        allBranches: roleSupportsAllBranches(role) ? allBranches : false,
        workshopId: roleNeedsWorkshop(role) ? workshopId : null,
      })
      .where(eq(memberships.id, membership.id));
  } else {
    await db.insert(memberships).values({
      userId: id,
      organizationId: session.organizationId,
      role,
      allBranches: roleSupportsAllBranches(role) ? allBranches : false,
      workshopId: roleNeedsWorkshop(role) ? workshopId : null,
    });
  }

  await writeAudit({
    organizationId: session.organizationId,
    entityType: "staff_user",
    entityId: id,
    action: "UPDATE_STAFF",
    payload: { email: normalizedEmail, role, fullName, active },
    actorStaffId: user.id,
  });

  revalidatePath("/app/admin/staff");
  revalidatePath(`/app/admin/staff/${id}`);
  redirect("/app/admin/staff");
}

export async function createWorkshop(formData: FormData) {
  const { session, user } = await adminSession();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const active = formData.get("active") === "on";

  if (!name) redirect("/app/admin/workshops/new?error=validation");

  const [created] = await db
    .insert(workshops)
    .values({
      organizationId: session.organizationId,
      name,
      address,
      phone,
      active,
    })
    .returning();

  await writeAudit({
    organizationId: session.organizationId,
    workshopId: created.id,
    entityType: "workshop",
    entityId: created.id,
    action: "CREATE_WORKSHOP",
    payload: { name, address, phone, active },
    actorStaffId: user.id,
  });

  revalidatePath("/app/admin/workshops");
  revalidatePath("/app/workshops");
  redirect("/app/admin/workshops");
}

export async function updateWorkshop(formData: FormData) {
  const { session, user } = await adminSession();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const active = formData.get("active") === "on";

  const existing = await db.query.workshops.findFirst({
    where: and(
      eq(workshops.id, id),
      eq(workshops.organizationId, session.organizationId),
    ),
  });
  if (!existing) redirect("/app/admin/workshops?error=notfound");
  if (!name) redirect(`/app/admin/workshops/${id}?error=validation`);

  await db
    .update(workshops)
    .set({ name, address, phone, active })
    .where(eq(workshops.id, id));

  await writeAudit({
    organizationId: session.organizationId,
    workshopId: id,
    entityType: "workshop",
    entityId: id,
    action: "UPDATE_WORKSHOP",
    payload: { name, address, phone, active },
    actorStaffId: user.id,
  });

  revalidatePath("/app/admin/workshops");
  revalidatePath("/app/workshops");
  revalidatePath(`/app/admin/workshops/${id}`);
  redirect("/app/admin/workshops");
}

export async function updateOrganization(formData: FormData) {
  const { session, user } = await adminSession();
  const name = String(formData.get("name") ?? "").trim();
  const legalName = String(formData.get("legalName") ?? "").trim() || null;

  if (!name) redirect("/app/admin/organization?error=validation");

  await db
    .update(organizations)
    .set({ name, legalName })
    .where(eq(organizations.id, session.organizationId));

  await writeAudit({
    organizationId: session.organizationId,
    entityType: "organization",
    entityId: session.organizationId,
    action: "UPDATE_ORGANIZATION",
    payload: { name, legalName },
    actorStaffId: user.id,
  });

  revalidatePath("/app/admin");
  revalidatePath("/app/admin/organization");
  redirect("/app/admin/organization?saved=1");
}
