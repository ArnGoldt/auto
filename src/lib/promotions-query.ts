import { db } from "@/db";
import { promotions } from "@/db/schema";
import { and, eq, isNull, or, lte, gte } from "drizzle-orm";
import { isPromotionCurrentlyActive } from "@/lib/rules";

export async function listActiveNetworkPromotions(organizationId?: string) {
  const now = new Date();
  const rows = await db.query.promotions.findMany({
    where: organizationId
      ? eq(promotions.organizationId, organizationId)
      : undefined,
  });
  rows.sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime());
  return rows.filter(
    (p) => isPromotionCurrentlyActive(p, now) && p.workshopId == null,
  );
}

export async function listApplicablePromotionsForOrder(
  organizationId: string,
  workshopId: string,
) {
  const now = new Date();
  const rows = await db.query.promotions.findMany({
    where: and(
      eq(promotions.organizationId, organizationId),
      eq(promotions.active, true),
      lte(promotions.validFrom, now),
      gte(promotions.validTo, now),
      or(isNull(promotions.workshopId), eq(promotions.workshopId, workshopId)),
    ),
  });
  return rows;
}
