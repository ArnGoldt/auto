"use server";

import { db } from "@/db";
import {
  clientLoyalty,
  clients,
  loyaltyTransactions,
  orders,
  promotionRedemptions,
  promotions,
} from "@/db/schema";
import { getStaffSession } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import {
  computePromotionDiscountRub,
  estimateWorkSubtotalRub,
  validatePromotionApplicability,
} from "@/lib/rules";
import {
  createEstimateRevisionFromLines,
  getLatestEstimateForOrder,
} from "@/lib/estimate";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireManager() {
  const session = await getStaffSession();
  if (
    !session ||
    !["MANAGER", "NETWORK_ADMIN", "NETWORK_DIRECTOR"].includes(session.role)
  ) {
    throw new Error("Forbidden");
  }
  return session;
}

async function redemptionCountForPromotion(promotionId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(promotionRedemptions)
    .where(eq(promotionRedemptions.promotionId, promotionId));
  return rows[0]?.count ?? 0;
}

export async function upsertPromotion(formData: FormData) {
  const session = await requireManager();
  const id = String(formData.get("id") ?? "");
  const organizationId = String(formData.get("organizationId"));
  const workshopRaw = String(formData.get("workshopId") ?? "");
  const workshopId = workshopRaw || null;
  const name = String(formData.get("name"));
  const description = String(formData.get("description") ?? "") || null;
  const type = String(formData.get("type")) as "PERCENT" | "FIXED";
  const value = Number(formData.get("value"));
  const minRaw = formData.get("minOrderAmountRub");
  const minOrderAmountRub = minRaw ? Number(minRaw) : null;
  const validFrom = new Date(String(formData.get("validFrom")));
  const validTo = new Date(String(formData.get("validTo")));
  const active = formData.get("active") === "on" || formData.get("active") === "true";
  const codeRaw = String(formData.get("code") ?? "").trim();
  const code = codeRaw ? codeRaw.toUpperCase() : null;
  const maxRaw = formData.get("maxRedemptions");
  const maxRedemptions = maxRaw ? Number(maxRaw) : null;

  const values = {
    organizationId,
    workshopId,
    name,
    description,
    type,
    value,
    minOrderAmountRub,
    validFrom,
    validTo,
    active,
    code,
    maxRedemptions,
    createdByUserId: session.userId,
  };

  if (id) {
    await db.update(promotions).set(values).where(eq(promotions.id, id));
    await writeAudit({
      organizationId,
      workshopId: workshopId ?? undefined,
      entityType: "promotion",
      entityId: id,
      action: "promotion.updated",
      payload: { name, code },
      actorStaffId: session.userId,
    });
  } else {
    const [row] = await db.insert(promotions).values(values).returning();
    await writeAudit({
      organizationId,
      workshopId: workshopId ?? undefined,
      entityType: "promotion",
      entityId: row.id,
      action: "promotion.created",
      payload: { name, code },
      actorStaffId: session.userId,
    });
  }

  revalidatePath("/app/promotions");
  redirect("/app/promotions");
}

export async function deactivatePromotion(formData: FormData) {
  const session = await requireManager();
  const id = String(formData.get("id"));
  const promo = await db.query.promotions.findFirst({
    where: eq(promotions.id, id),
  });
  if (!promo) return;
  await db.update(promotions).set({ active: false }).where(eq(promotions.id, id));
  await writeAudit({
    organizationId: promo.organizationId,
    workshopId: promo.workshopId ?? undefined,
    entityType: "promotion",
    entityId: id,
    action: "promotion.deactivated",
    actorStaffId: session.userId,
  });
  revalidatePath("/app/promotions");
}

export async function applyPromotionToOrder(formData: FormData) {
  const session = await requireManager();
  const orderId = String(formData.get("orderId"));
  const promotionId = String(formData.get("promotionId") ?? "");
  const promoCode = String(formData.get("promoCode") ?? "").trim();

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) redirect(`/app/orders/${orderId}?error=order`);

  let promotion = promotionId
    ? await db.query.promotions.findFirst({ where: eq(promotions.id, promotionId) })
    : null;

  if (!promotion && promoCode) {
    promotion =
      (await db.query.promotions.findFirst({
        where: and(
          eq(promotions.organizationId, order.organizationId),
          eq(promotions.code, promoCode.toUpperCase()),
        ),
      })) ?? null;
  }

  if (!promotion) redirect(`/app/orders/${orderId}?error=promo`);

  const { lines } = await getLatestEstimateForOrder(orderId);
  if (lines.length === 0) redirect(`/app/orders/${orderId}?error=estimate`);

  const workLines = lines.filter((l) => (l.lineKind ?? "WORK") !== "DISCOUNT");
  const subtotal = estimateWorkSubtotalRub(lines);
  const redemptionCount = await redemptionCountForPromotion(promotion.id);
  const check = validatePromotionApplicability(promotion, {
    workshopId: order.workshopId,
    orderSubtotalRub: subtotal,
    redemptionCount,
    codeProvided: promotion.code
      ? promotionId
        ? promotion.code
        : promoCode
      : null,
  });
  if (!check.ok) redirect(`/app/orders/${orderId}?error=${encodeURIComponent(check.reason)}`);

  const discount = computePromotionDiscountRub(promotion, subtotal);
  if (discount <= 0) redirect(`/app/orders/${orderId}?error=discount`);

  const copied = workLines.map((l) => ({
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
    lineKind: "DISCOUNT" as const,
    zone: null,
    operation: `Скидка: ${promotion.name}`,
    laborHours: null,
    materials: null,
    priceRub: -discount,
    promotionId: promotion.id,
    sortOrder: 999,
  });

  await createEstimateRevisionFromLines(
    orderId,
    session.userId,
    copied,
    `Применена акция «${promotion.name}»`,
  );

  await db.insert(promotionRedemptions).values({
    promotionId: promotion.id,
    orderId,
    clientId: order.clientId,
    appliedAmountRub: discount,
  });

  await writeAudit({
    organizationId: order.organizationId,
    workshopId: order.workshopId,
    entityType: "order",
    entityId: orderId,
    action: "promotion.applied",
    payload: {
      promotionId: promotion.id,
      discountRub: discount,
      code: promotion.code,
    },
    actorStaffId: session.userId,
  });

  revalidatePath(`/app/orders/${orderId}`);
  redirect(`/app/orders/${orderId}?promo=ok`);
}

export async function adjustClientLoyaltyPoints(formData: FormData) {
  const session = await requireManager();
  const clientId = String(formData.get("clientId"));
  const delta = Number(formData.get("delta"));
  const reason = String(formData.get("reason") ?? "Корректировка менеджера");

  if (!Number.isFinite(delta) || delta === 0) {
    redirect(`/app/clients/${clientId}?error=points`);
  }

  const existing = await db.query.clientLoyalty.findFirst({
    where: eq(clientLoyalty.clientId, clientId),
  });
  const nextBalance = (existing?.pointsBalance ?? 0) + delta;
  if (nextBalance < 0) redirect(`/app/clients/${clientId}?error=balance`);

  if (existing) {
    await db
      .update(clientLoyalty)
      .set({ pointsBalance: nextBalance, updatedAt: new Date() })
      .where(eq(clientLoyalty.id, existing.id));
  } else {
    await db.insert(clientLoyalty).values({
      clientId,
      pointsBalance: nextBalance,
    });
  }

  await db.insert(loyaltyTransactions).values({
    clientId,
    delta,
    reason,
  });

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  await writeAudit({
    organizationId: client?.organizationId,
    entityType: "client",
    entityId: clientId,
    action: "loyalty.points_adjusted",
    payload: { delta, reason, balance: nextBalance },
    actorStaffId: session.userId,
  });

  revalidatePath(`/app/clients/${clientId}`);
  redirect(`/app/clients/${clientId}?points=ok`);
}

export async function markOrderDelivered(formData: FormData) {
  const session = await requireManager();
  const orderId = String(formData.get("orderId"));
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return;

  if (order.productionStage === "DELIVERED") {
    redirect(`/app/orders/${orderId}`);
  }

  await db
    .update(orders)
    .set({ productionStage: "DELIVERED" })
    .where(eq(orders.id, orderId));

  const { lines } = await getLatestEstimateForOrder(orderId);
  const total = lines.reduce((s, l) => s + l.priceRub, 0);
  const { computeLoyaltyPointsEarn } = await import("@/lib/rules");
  const points = computeLoyaltyPointsEarn(total);

  if (points > 0) {
    const prior = await db.query.loyaltyTransactions.findFirst({
      where: and(
        eq(loyaltyTransactions.orderId, orderId),
        eq(loyaltyTransactions.reason, "order.completed"),
      ),
    });
    if (!prior) {
      const existing = await db.query.clientLoyalty.findFirst({
        where: eq(clientLoyalty.clientId, order.clientId),
      });
      if (existing) {
        await db
          .update(clientLoyalty)
          .set({
            pointsBalance: existing.pointsBalance + points,
            updatedAt: new Date(),
          })
          .where(eq(clientLoyalty.id, existing.id));
      } else {
        await db.insert(clientLoyalty).values({
          clientId: order.clientId,
          pointsBalance: points,
        });
      }
      await db.insert(loyaltyTransactions).values({
        clientId: order.clientId,
        delta: points,
        reason: "order.completed",
        orderId,
      });
      await writeAudit({
        organizationId: order.organizationId,
        workshopId: order.workshopId,
        entityType: "order",
        entityId: orderId,
        action: "loyalty.points_earned",
        payload: { points, orderTotalRub: total },
        actorStaffId: session.userId,
      });
    }
  }

  revalidatePath(`/app/orders/${orderId}`);
  revalidatePath(`/app/clients/${order.clientId}`);
  redirect(`/app/orders/${orderId}?delivered=1`);
}
