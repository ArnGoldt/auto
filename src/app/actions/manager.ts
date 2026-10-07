"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  clientAccounts,
  estimateLines,
  estimateVersions,
  operations,
  operationChecklistItems,
  supplements,
  orders,
} from "@/db/schema";
import { requireManagerSession } from "@/lib/auth";
import { saveInspection, type InspectionInput } from "@/lib/inspection";
import { writeAudit } from "@/lib/audit";

export async function completeInspectionAction(
  input: Omit<InspectionInput, "managerUserId" | "organizationId" | "workshopId"> & {
    workshopId: string;
  },
) {
  const session = await requireManagerSession();
  const inquiry = await db.query.inquiries.findFirst({
    where: (i, { eq }) => eq(i.id, input.inquiryId),
  });
  if (!inquiry) throw new Error("Обращение не найдено");

  const result = await saveInspection({
    ...input,
    organizationId: session.user.organizationId,
    managerUserId: session.user.id,
  });

  revalidatePath("/app/inquiries");
  revalidatePath("/app/clients");
  return result;
}

export async function addEstimateLineAction(params: {
  orderId: string;
  estimateVersionId: string;
  zone: string;
  operationName: string;
  price: string;
}) {
  const session = await requireManagerSession();
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.orderId),
  });
  if (!order || order.organizationId !== session.user.organizationId) {
    throw new Error("Заказ не найден");
  }

  await db.insert(estimateLines).values({
    estimateVersionId: params.estimateVersionId,
    zone: params.zone,
    operationName: params.operationName,
    price: params.price,
    sortOrder: 99,
  });

  const lines = await db.query.estimateLines.findMany({
    where: eq(estimateLines.estimateVersionId, params.estimateVersionId),
  });
  const total = lines.reduce((s, l) => s + Number(l.price), 0);
  await db
    .update(estimateVersions)
    .set({ totalAmount: String(total) })
    .where(eq(estimateVersions.id, params.estimateVersionId));

  await writeAudit({
    organizationId: session.user.organizationId,
    entityType: "estimate",
    entityId: params.estimateVersionId,
    action: "line_added",
    payload: params,
    userId: session.user.id,
  });

  revalidatePath(`/app/orders/${params.orderId}`);
}

export async function createOperationFromLineAction(params: {
  orderId: string;
  estimateLineId: string;
  name: string;
  assigneeUserId: string;
}) {
  const session = await requireManagerSession();
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.orderId),
  });
  if (!order) throw new Error("Заказ не найден");

  const [op] = await db
    .insert(operations)
    .values({
      orderId: params.orderId,
      estimateLineId: params.estimateLineId,
      name: params.name,
      status: "assigned",
      assigneeUserId: params.assigneeUserId,
    })
    .returning();

  await db.insert(operationChecklistItems).values([
    {
      operationId: op.id,
      label: "Подготовка поверхности",
      required: true,
      requiresPhoto: true,
      sortOrder: 1,
    },
    {
      operationId: op.id,
      label: "Контроль качества",
      required: true,
      requiresPhoto: false,
      sortOrder: 2,
    },
  ]);

  await writeAudit({
    organizationId: session.user.organizationId,
    entityType: "operation",
    entityId: op.id,
    action: "assigned",
    payload: { assigneeUserId: params.assigneeUserId },
    userId: session.user.id,
  });

  revalidatePath(`/app/orders/${params.orderId}`);
  revalidatePath("/master");
}

export async function createClientAccountAction(params: {
  clientId: string;
  login: string;
  password: string;
}) {
  const session = await requireManagerSession();
  const existing = await db.query.clientAccounts.findFirst({
    where: eq(clientAccounts.clientId, params.clientId),
  });
  if (existing) throw new Error("У клиента уже есть доступ в ЛК");

  const hash = await bcrypt.hash(params.password, 10);
  const [account] = await db
    .insert(clientAccounts)
    .values({
      clientId: params.clientId,
      login: params.login,
      passwordHash: hash,
      createdByUserId: session.user.id,
    })
    .returning();

  await writeAudit({
    organizationId: session.user.organizationId,
    entityType: "client_account",
    entityId: account.id,
    action: "created",
    payload: { login: params.login, clientId: params.clientId },
    userId: session.user.id,
  });

  revalidatePath(`/app/clients/${params.clientId}`);
  return { login: params.login };
}

export async function createSupplementAction(params: {
  orderId: string;
  title: string;
  amount: string;
  description?: string;
}) {
  const session = await requireManagerSession();
  const [sup] = await db
    .insert(supplements)
    .values({
      orderId: params.orderId,
      title: params.title,
      description: params.description,
      amount: params.amount,
      status: "pending_client",
      createdByUserId: session.user.id,
    })
    .returning();

  await writeAudit({
    organizationId: session.user.organizationId,
    entityType: "supplement",
    entityId: sup.id,
    action: "created",
    userId: session.user.id,
  });

  revalidatePath(`/app/orders/${params.orderId}`);
}
