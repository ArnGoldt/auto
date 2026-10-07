"use server";

import { db } from "@/db";
import {
  checklistItems,
  operationChecklists,
  operations,
  orderEvents,
} from "@/db/schema";
import { getStaffSession } from "@/lib/session";
import { canCompleteOperation } from "@/lib/rules";
import { writeAudit } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";

async function requireMaster() {
  const session = await getStaffSession();
  if (!session || session.role !== "MASTER") throw new Error("Forbidden");
  return session;
}

export async function startOperationForm(formData: FormData) {
  await startOperation(String(formData.get("operationId")));
}

export async function completeOperationForm(formData: FormData) {
  const id = String(formData.get("operationId"));
  await completeOperation(id);
}

export async function startOperation(operationId: string) {
  const session = await requireMaster();
  const op = await db.query.operations.findFirst({
    where: eq(operations.id, operationId),
  });
  if (!op || op.assigneeUserId !== session.userId) throw new Error("Forbidden");
  await db
    .update(operations)
    .set({ status: "IN_PROGRESS" })
    .where(eq(operations.id, operationId));
  revalidatePath(`/master/operations/${operationId}`);
}

export async function toggleChecklistItem(formData: FormData) {
  const session = await requireMaster();
  const itemId = String(formData.get("itemId"));
  const operationId = String(formData.get("operationId"));

  const item = await db.query.checklistItems.findFirst({
    where: eq(checklistItems.id, itemId),
  });
  if (!item) return;

  const cl = await db.query.operationChecklists.findFirst({
    where: eq(operationChecklists.id, item.checklistId),
  });
  const op = cl
    ? await db.query.operations.findFirst({
        where: eq(operations.id, cl.operationId),
      })
    : null;
  if (!op || op.assigneeUserId !== session.userId) throw new Error("Forbidden");

  await db
    .update(checklistItems)
    .set({
      completed: !item.completed,
      completedByUserId: !item.completed ? session.userId : null,
      completedAt: !item.completed ? new Date() : null,
    })
    .where(eq(checklistItems.id, itemId));

  await writeAudit({
    workshopId: op.workshopId,
    entityType: "checklist_item",
    entityId: itemId,
    action: "checklist.toggled",
    actorStaffId: session.userId,
  });

  revalidatePath(`/master/operations/${operationId}`);
}

export async function uploadChecklistPhoto(formData: FormData) {
  const session = await requireMaster();
  const itemId = String(formData.get("itemId"));
  const operationId = String(formData.get("operationId"));
  const file = formData.get("photo") as File | null;
  if (!file) return;

  const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
  await fs.mkdir(uploadDir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  const fname = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const relDir = path.join("public", "uploads");
  await fs.mkdir(relDir, { recursive: true });
  const rel = `/uploads/${fname}`;
  await fs.writeFile(path.join(process.cwd(), "public", "uploads", fname), buf);

  await db
    .update(checklistItems)
    .set({
      photoPath: rel,
      completed: true,
      completedByUserId: session.userId,
      completedAt: new Date(),
    })
    .where(eq(checklistItems.id, itemId));

  revalidatePath(`/master/operations/${operationId}`);
}

export async function completeOperation(operationId: string) {
  const session = await requireMaster();
  const op = await db.query.operations.findFirst({
    where: eq(operations.id, operationId),
  });
  if (!op || op.assigneeUserId !== session.userId) throw new Error("Forbidden");

  const cl = await db.query.operationChecklists.findFirst({
    where: eq(operationChecklists.operationId, operationId),
  });
  const items = cl
    ? await db.query.checklistItems.findMany({
        where: eq(checklistItems.checklistId, cl.id),
      })
    : [];

  if (!canCompleteOperation(items)) {
    redirect(`/master/operations/${operationId}?error=checklist`);
  }

  await db
    .update(operations)
    .set({ status: "QC_REVIEW" })
    .where(eq(operations.id, operationId));

  await db.insert(orderEvents).values({
    orderId: op.orderId,
    title: "Операция отправлена на контроль качества",
    body: op.title,
    visibleToClient: true,
    confirmed: true,
  });

  redirect("/master");
}
