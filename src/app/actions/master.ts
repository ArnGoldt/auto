"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  attachments,
  operationChecklistItems,
  operations,
  supplements,
} from "@/db/schema";
import { requireMasterSession } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";
import { writeAudit } from "@/lib/audit";

export async function startOperationAction(operationId: string) {
  const session = await requireMasterSession();
  const op = await db.query.operations.findFirst({
    where: and(
      eq(operations.id, operationId),
      eq(operations.assigneeUserId, session.user.id),
    ),
  });
  if (!op) throw new Error("Операция не найдена");

  if (op.supplementId) {
    const sup = await db.query.supplements.findFirst({
      where: eq(supplements.id, op.supplementId),
    });
    if (sup && sup.status !== "approved") {
      throw new Error("Доп. работа не согласована клиентом");
    }
  }

  await db
    .update(operations)
    .set({ status: "in_progress", updatedAt: new Date() })
    .where(eq(operations.id, operationId));

  revalidatePath(`/master/operations/${operationId}`);
  revalidatePath("/master");
}

export async function toggleChecklistItemAction(
  itemId: string,
  completed: boolean,
) {
  const session = await requireMasterSession();
  const item = await db.query.operationChecklistItems.findFirst({
    where: eq(operationChecklistItems.id, itemId),
    with: { operation: true },
  });
  if (!item?.operation) throw new Error("Пункт не найден");
  if (item.operation.assigneeUserId !== session.user.id) {
    throw new Error("Нет доступа");
  }

  if (completed && item.requiresPhoto) {
    const photos = await db.query.attachments.findMany({
      where: eq(attachments.checklistItemId, itemId),
    });
    if (photos.length === 0) {
      throw new Error("Для этого пункта требуется фото");
    }
  }

  await db
    .update(operationChecklistItems)
    .set({
      completed,
      completedByUserId: completed ? session.user.id : null,
      completedAt: completed ? new Date() : null,
    })
    .where(eq(operationChecklistItems.id, itemId));

  await writeAudit({
    organizationId: session.user.organizationId,
    entityType: "checklist_item",
    entityId: itemId,
    action: completed ? "completed" : "reopened",
    userId: session.user.id,
  });

  revalidatePath(`/master/operations/${item.operationId}`);
}

export async function completeOperationAction(operationId: string) {
  const session = await requireMasterSession();
  const op = await db.query.operations.findFirst({
    where: and(
      eq(operations.id, operationId),
      eq(operations.assigneeUserId, session.user.id),
    ),
    with: { checklistItems: true },
  });
  if (!op) throw new Error("Операция не найдена");

  for (const item of op.checklistItems) {
    if (item.required && !item.completed) {
      throw new Error(`Не выполнен обязательный пункт: ${item.label}`);
    }
  }

  await db
    .update(operations)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(operations.id, operationId));

  await writeAudit({
    organizationId: session.user.organizationId,
    entityType: "operation",
    entityId: operationId,
    action: "completed",
    userId: session.user.id,
  });

  revalidatePath(`/master/operations/${operationId}`);
  revalidatePath("/master");
}

export async function uploadChecklistPhotoAction(formData: FormData) {
  const session = await requireMasterSession();
  const itemId = formData.get("itemId") as string;
  const file = formData.get("file") as File;
  if (!itemId || !file?.size) throw new Error("Нет файла");

  const item = await db.query.operationChecklistItems.findFirst({
    where: eq(operationChecklistItems.id, itemId),
    with: { operation: true },
  });
  if (!item?.operation || item.operation.assigneeUserId !== session.user.id) {
    throw new Error("Нет доступа");
  }

  const saved = await saveUpload(file, `ops/${item.operationId}`);
  await db.insert(attachments).values({
    organizationId: session.user.organizationId,
    orderId: item.operation.orderId,
    operationId: item.operationId,
    checklistItemId: itemId,
    fileName: saved.fileName,
    mimeType: saved.mimeType,
    storagePath: saved.storagePath,
    uploadedByUserId: session.user.id,
  });

  revalidatePath(`/master/operations/${item.operationId}`);
}
