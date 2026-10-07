"use server";

import { db } from "@/db";
import { operations, orders } from "@/db/schema";
import { getStaffSession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function approveQc(formData: FormData) {
  const session = await getStaffSession();
  if (!session || !["QC", "NETWORK_ADMIN"].includes(session.role)) {
    throw new Error("Forbidden");
  }
  const operationId = String(formData.get("operationId"));
  await db
    .update(operations)
    .set({ status: "DONE" })
    .where(eq(operations.id, operationId));

  const op = await db.query.operations.findFirst({
    where: eq(operations.id, operationId),
  });
  if (op) {
    const pending = await db.query.operations.findMany({
      where: eq(operations.orderId, op.orderId),
    });
    const allDone = pending.every(
      (o) => o.status === "DONE" || o.id === operationId,
    );
    if (allDone) {
      await db
        .update(orders)
        .set({ productionStage: "READY" })
        .where(eq(orders.id, op.orderId));
    }
  }
  revalidatePath("/app");
}
