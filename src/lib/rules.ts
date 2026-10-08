import type { checklistItems } from "@/db/schema";

export type ChecklistRow = typeof checklistItems.$inferSelect;

export type PromotionRow = {
  id: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmountRub: number | null;
  validFrom: Date;
  validTo: Date;
  active: boolean;
  workshopId: string | null;
  code: string | null;
  maxRedemptions: number | null;
};

export function supplementBlocksWork(status: string) {
  return status === "BLOCKED" || status === "PENDING_CLIENT" || status === "DRAFT";
}

export function canCompleteOperation(items: ChecklistRow[]) {
  const required = items.filter((i) => i.required);
  return required.every((i) => {
    if (!i.completed) return false;
    if (i.requiresPhoto && !i.photoPath) return false;
    return true;
  });
}

export function canReleaseOrder(
  openRequiredChecklists: number,
  qcPassed: boolean,
) {
  return openRequiredChecklists === 0 && qcPassed;
}

export function estimateWorkSubtotalRub(
  lines: { lineKind?: string | null; priceRub: number }[],
) {
  return lines
    .filter((l) => (l.lineKind ?? "WORK") !== "DISCOUNT")
    .reduce((s, l) => s + l.priceRub, 0);
}

export function estimateGrandTotalRub(
  lines: { lineKind?: string | null; priceRub: number }[],
) {
  return lines.reduce((s, l) => s + l.priceRub, 0);
}

export type PromotionValidation =
  | { ok: true }
  | { ok: false; reason: string };

export function validatePromotionApplicability(
  promotion: PromotionRow,
  ctx: {
    workshopId: string;
    orderSubtotalRub: number;
    redemptionCount: number;
    now?: Date;
    codeProvided?: string | null;
  },
): PromotionValidation {
  const now = ctx.now ?? new Date();
  if (!promotion.active) {
    return { ok: false, reason: "Акция неактивна" };
  }
  if (now < promotion.validFrom) {
    return { ok: false, reason: "Акция ещё не началась" };
  }
  if (now > promotion.validTo) {
    return { ok: false, reason: "Срок акции истёк" };
  }
  if (promotion.workshopId && promotion.workshopId !== ctx.workshopId) {
    return { ok: false, reason: "Акция не действует в этом филиале" };
  }
  if (
    promotion.minOrderAmountRub != null &&
    ctx.orderSubtotalRub < promotion.minOrderAmountRub
  ) {
    return {
      ok: false,
      reason: `Минимальная сумма заказа ${promotion.minOrderAmountRub} ₽`,
    };
  }
  if (
    promotion.maxRedemptions != null &&
    ctx.redemptionCount >= promotion.maxRedemptions
  ) {
    return { ok: false, reason: "Исчерпан лимит использований акции" };
  }
  if (promotion.code) {
    const provided = (ctx.codeProvided ?? "").trim().toUpperCase();
    const expected = promotion.code.trim().toUpperCase();
    if (provided !== expected) {
      return { ok: false, reason: "Неверный промокод" };
    }
  }
  return { ok: true };
}

export function computePromotionDiscountRub(
  promotion: Pick<PromotionRow, "type" | "value">,
  orderSubtotalRub: number,
): number {
  if (orderSubtotalRub <= 0) return 0;
  let discount =
    promotion.type === "PERCENT"
      ? Math.floor((orderSubtotalRub * promotion.value) / 100)
      : promotion.value;
  if (discount > orderSubtotalRub) discount = orderSubtotalRub;
  return discount;
}

/** 1% of order total, whole points */
export function computeLoyaltyPointsEarn(orderTotalRub: number) {
  if (orderTotalRub <= 0) return 0;
  return Math.floor(orderTotalRub * 0.01);
}

/** 100 points = 100 ₽ off */
export function computePointsRedemptionDiscountRub(pointsToRedeem: number) {
  if (pointsToRedeem <= 0) return 0;
  return Math.floor(pointsToRedeem);
}

export function isPromotionCurrentlyActive(
  promotion: Pick<PromotionRow, "active" | "validFrom" | "validTo">,
  now: Date = new Date(),
) {
  return (
    promotion.active &&
    now >= promotion.validFrom &&
    now <= promotion.validTo
  );
}
