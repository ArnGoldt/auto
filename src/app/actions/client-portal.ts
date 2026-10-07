"use server";

import { db } from "@/db";
import { orderEvents, orders, supplements } from "@/db/schema";
import { getClientSession } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function decideSupplement(formData: FormData) {
  const session = await getClientSession();
  if (!session) throw new Error("Unauthorized");

  const supplementId = String(formData.get("supplementId"));
  const decision = String(formData.get("decision"));

  const supp = await db.query.supplements.findFirst({
    where: eq(supplements.id, supplementId),
  });
  if (!supp) return;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, supp.orderId),
  });
  if (!order || order.clientId !== session.clientId) throw new Error("Forbidden");

  const status = decision === "approve" ? "APPROVED" : "REJECTED";
  await db
    .update(supplements)
    .set({
      status: status as "APPROVED" | "REJECTED",
      clientDecisionAt: new Date(),
    })
    .where(eq(supplements.id, supplementId));

  await db.insert(orderEvents).values({
    orderId: supp.orderId,
    title:
      decision === "approve"
        ? "Клиент согласовал доп. работы"
        : "Клиент отклонил доп. работы",
    body: supp.reason,
    visibleToClient: true,
    confirmed: true,
  });

  await writeAudit({
    organizationId: session.organizationId,
    entityType: "supplement",
    entityId: supplementId,
    action: `supplement.${decision}`,
    actorClientAccountId: session.clientAccountId,
  });

  revalidatePath("/client");
}
