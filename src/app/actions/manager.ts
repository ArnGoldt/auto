"use server";

import { db } from "@/db";
import {
  clientAccounts,
  clients,
  inquiries,
  managerReminders,
  operations,
  operationChecklists,
  checklistItems,
  orders,
  supplements,
  vehicles,
  workshops,
} from "@/db/schema";
import { getStaffSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supplementBlocksWork } from "@/lib/rules";
import {
  createEstimateRevisionFromLines,
  getLatestEstimateForOrder,
} from "@/lib/estimate";

async function requireManager() {
  const session = await getStaffSession();
  if (!session || !["MANAGER", "NETWORK_ADMIN", "NETWORK_DIRECTOR"].includes(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function createPublicInquiry(formData: FormData) {
  const workshopId = String(formData.get("workshopId"));
  const description = String(formData.get("description") ?? "");
  const workTypes = String(formData.get("workTypes") ?? "PAINT");
  const contactName = String(formData.get("contactName") ?? "");
  const contactPhone = String(formData.get("contactPhone") ?? "");
  const contactEmail = String(formData.get("contactEmail") ?? "");
  const pdConsent = formData.get("pdConsent") === "on";
  const promoCode = String(formData.get("promoCode") ?? "").trim() || null;
  if (!pdConsent) redirect("/request?error=consent");

  const ws = await db.query.workshops.findFirst({
    where: eq(workshops.id, workshopId),
  });
  if (!ws) redirect("/request?error=workshop");

  const [inq] = await db
    .insert(inquiries)
    .values({
      organizationId: ws.organizationId,
      workshopId,
      stage: "NEW",
      source: "WEB",
      contactName,
      contactPhone,
      contactEmail,
      workTypes,
      description,
      pdConsent: true,
      promoCode: promoCode?.toUpperCase() ?? null,
    })
    .returning();

  if (promoCode) {
    await writeAudit({
      organizationId: ws.organizationId,
      workshopId,
      entityType: "inquiry",
      entityId: inq.id,
      action: "promotion.code_attached",
      payload: { promoCode: promoCode.toUpperCase() },
    });
  }

  await db.insert(managerReminders).values({
    organizationId: ws.organizationId,
    inquiryId: inq.id,
    kind: "RESPOND_LEAD",
    dueAt: new Date(Date.now() + 4 * 3600000),
  });

  redirect("/request?sent=1");
}

export async function completeInspection(formData: FormData) {
  const session = await requireManager();
  const inquiryId = String(formData.get("inquiryId"));
  const workshopId = String(formData.get("workshopId"));
  const fullName = String(formData.get("fullName"));
  const phone = String(formData.get("phone"));
  const email = String(formData.get("email") ?? "");
  const make = String(formData.get("make"));
  const model = String(formData.get("model"));
  const plate = String(formData.get("plate") ?? "");
  const pdConsent = formData.get("pdConsent") === "on";
  if (!pdConsent) redirect(`/app/inquiries/${inquiryId}/inspect?error=consent`);

  const inquiry = await db.query.inquiries.findFirst({
    where: eq(inquiries.id, inquiryId),
  });
  if (!inquiry) redirect("/app/inquiries");

  const norm = normalizePhone(phone);
  let client =
    (await db.query.clients.findFirst({
      where: and(
        eq(clients.organizationId, inquiry.organizationId),
        eq(clients.phone, phone),
      ),
    })) ??
    (email
      ? await db.query.clients.findFirst({
          where: and(
            eq(clients.organizationId, inquiry.organizationId),
            eq(clients.email, email),
          ),
        })
      : null);

  let createdClient = false;
  if (!client) {
    [client] = await db
      .insert(clients)
      .values({
        organizationId: inquiry.organizationId,
        fullName,
        phone,
        email: email || null,
        pdConsentAt: new Date(),
      })
      .returning();
    createdClient = true;
  }

  const [vehicle] = await db
    .insert(vehicles)
    .values({
      clientId: client.id,
      make,
      model,
      plate,
    })
    .returning();

  const promised = new Date(Date.now() + 10 * 86400000);
  const [order] = await db
    .insert(orders)
    .values({
      organizationId: inquiry.organizationId,
      workshopId,
      clientId: client.id,
      vehicleId: vehicle.id,
      inquiryId,
      salesStage: "BOOKED",
      productionStage: "INTAKE",
      promisedDateOriginal: promised,
      promisedDateCurrent: promised,
      intakeNotes: String(formData.get("intakeNotes") ?? ""),
    })
    .returning();

  await db
    .update(inquiries)
    .set({ clientId: client.id, stage: "BOOKED" })
    .where(eq(inquiries.id, inquiryId));

  await writeAudit({
    organizationId: inquiry.organizationId,
    workshopId,
    entityType: "client",
    entityId: client.id,
    action: createdClient ? "client.created" : "client.linked",
    payload: { phone: norm },
    actorStaffId: session.userId,
  });

  redirect(`/app/orders/${order.id}`);
}

export async function createClientPortalAccess(formData: FormData) {
  const session = await requireManager();
  const clientId = String(formData.get("clientId"));
  const login = String(formData.get("login")).trim();
  const password = String(formData.get("password"));
  const hash = await hashPassword(password);

  const existing = await db.query.clientAccounts.findFirst({
    where: eq(clientAccounts.clientId, clientId),
  });
  if (existing) {
    await db
      .update(clientAccounts)
      .set({ login, passwordHash: hash, enabled: true })
      .where(eq(clientAccounts.id, existing.id));
  } else {
    await db.insert(clientAccounts).values({
      clientId,
      login,
      passwordHash: hash,
      enabled: true,
      createdByUserId: session.userId,
    });
  }

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });
  await writeAudit({
    organizationId: client?.organizationId,
    entityType: "client_account",
    entityId: clientId,
    action: "portal.access_created",
    actorStaffId: session.userId,
  });
  revalidatePath(`/app/clients/${clientId}`);
}

export async function addEstimateVersion(formData: FormData) {
  const session = await requireManager();
  const orderId = String(formData.get("orderId"));
  const zone = String(formData.get("zone"));
  const operationName = String(formData.get("operation"));
  const priceRub = Number(formData.get("priceRub"));

  const { lines: prevLines } = await getLatestEstimateForOrder(orderId);
  const copied = prevLines.map((l) => ({
    lineKind: l.lineKind ?? ("WORK" as const),
    zone: l.zone,
    operation: l.operation,
    laborHours: l.laborHours,
    materials: l.materials,
    priceRub: l.priceRub,
    promotionId: l.promotionId,
    sortOrder: l.sortOrder ?? 0,
  }));
  copied.push({
    lineKind: "WORK" as const,
    zone,
    operation: operationName,
    laborHours: null,
    materials: null,
    priceRub,
    promotionId: null,
    sortOrder: copied.length,
  });

  await createEstimateRevisionFromLines(orderId, session.userId, copied);

  revalidatePath(`/app/orders/${orderId}`);
}

export async function assignOperation(formData: FormData) {
  const session = await requireManager();
  const operationId = String(formData.get("operationId"));
  const assigneeUserId = String(formData.get("assigneeUserId"));

  const op = await db.query.operations.findFirst({
    where: eq(operations.id, operationId),
  });
  if (!op) return;

  if (op.supplementId) {
    const supp = await db.query.supplements.findFirst({
      where: eq(supplements.id, op.supplementId),
    });
    if (supp && supplementBlocksWork(supp.status)) {
      redirect(`/app/orders/${op.orderId}?error=supplement`);
    }
  }

  await db
    .update(operations)
    .set({ assigneeUserId, status: "ASSIGNED" })
    .where(eq(operations.id, operationId));

  revalidatePath(`/app/orders/${op.orderId}`);
}

export async function createOperationWithChecklist(formData: FormData) {
  const session = await requireManager();
  const orderId = String(formData.get("orderId"));
  const workshopId = String(formData.get("workshopId"));
  const title = String(formData.get("title"));
  const kind = String(formData.get("kind") ?? "PAINT");
  const assigneeUserId = String(formData.get("assigneeUserId") ?? "") || null;

  const [op] = await db
    .insert(operations)
    .values({
      orderId,
      workshopId,
      title,
      kind,
      status: assigneeUserId ? "ASSIGNED" : "WAITING",
      assigneeUserId,
    })
    .returning();

  const [cl] = await db
    .insert(operationChecklists)
    .values({ operationId: op.id, templateKind: kind })
    .returning();

  const defaults =
    kind === "WELD"
      ? [
          "Подготовка зоны и меры безопасности",
          "Пробный шов (если требуется)",
          "Фото скрытой зоны до закрытия",
          "Антикор после ремонта",
        ]
      : [
          "Маскировка и подготовка",
          "Фото до закрытия зоны",
          "Грунт и база",
          "Лак и контроль цвета",
        ];

  await db.insert(checklistItems).values(
    defaults.map((label, idx) => ({
      checklistId: cl.id,
      label,
      required: true,
      requiresPhoto: label.includes("Фото"),
      sortOrder: idx,
    })),
  );

  await writeAudit({
    workshopId,
    entityType: "operation",
    entityId: op.id,
    action: "operation.created",
    actorStaffId: session.userId,
  });

  revalidatePath(`/app/orders/${orderId}`);
}

export async function createSupplement(formData: FormData) {
  const session = await requireManager();
  const orderId = String(formData.get("orderId"));
  const reason = String(formData.get("reason"));
  const priceDeltaRub = Number(formData.get("priceDeltaRub"));
  const scheduleImpactDays = Number(formData.get("scheduleImpactDays") ?? 0);

  await db.insert(supplements).values({
    orderId,
    status: "PENDING_CLIENT",
    reason,
    priceDeltaRub,
    scheduleImpactDays,
  });

  revalidatePath(`/app/orders/${orderId}`);
}
