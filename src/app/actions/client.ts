"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { supplements, orders } from "@/db/schema";
import { requireClientSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function approveSupplementAction(supplementId: string) {
  const session = await requireClientSession();
  const sup = await db.query.supplements.findFirst({
    where: eq(supplements.id, supplementId),
    with: { order: true },
  });
  if (!sup?.order) throw new Error("Доп. работа не найдена");
  if (sup.order.clientId !== session.user.clientId) {
    throw new Error("Нет доступа");
  }
  if (sup.status !== "pending_client" && sup.status !== "blocked") {
    throw new Error("Статус не позволяет согласовать");
  }

  await db
    .update(supplements)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(supplements.id, supplementId));

  await writeAudit({
    organizationId: session.user.organizationId,
    entityType: "supplement",
    entityId: supplementId,
    action: "approved_by_client",
    clientAccountId: session.user.id,
  });

  revalidatePath("/client");
  revalidatePath(`/client/orders/${sup.orderId}`);
}
