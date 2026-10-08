import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canCompleteOperation,
  supplementBlocksWork,
  canReleaseOrder,
  validatePromotionApplicability,
  computePromotionDiscountRub,
  computeLoyaltyPointsEarn,
  estimateWorkSubtotalRub,
  estimateGrandTotalRub,
  isPromotionCurrentlyActive,
} from "./rules";

describe("supplementBlocksWork", () => {
  it("blocks pending supplement", () => {
    assert.equal(supplementBlocksWork("PENDING_CLIENT"), true);
    assert.equal(supplementBlocksWork("APPROVED"), false);
  });
});

describe("canCompleteOperation", () => {
  it("requires mandatory photo", () => {
    const ok = canCompleteOperation([
      {
        id: "1",
        checklistId: "c",
        label: "a",
        required: true,
        requiresPhoto: true,
        completed: true,
        completedByUserId: null,
        completedAt: null,
        photoPath: "/x.jpg",
        sortOrder: 0,
      },
    ]);
    assert.equal(ok, true);
  });
});

describe("canReleaseOrder", () => {
  it("needs qc", () => {
    assert.equal(canReleaseOrder(0, false), false);
    assert.equal(canReleaseOrder(0, true), true);
  });
});

const basePromo = {
  id: "p1",
  type: "PERCENT" as const,
  value: 10,
  minOrderAmountRub: null as number | null,
  validFrom: new Date("2026-01-01"),
  validTo: new Date("2026-12-31"),
  active: true,
  workshopId: null as string | null,
  code: null as string | null,
  maxRedemptions: null as number | null,
};

describe("validatePromotionApplicability", () => {
  it("rejects inactive", () => {
    const r = validatePromotionApplicability(
      { ...basePromo, active: false },
      { workshopId: "w1", orderSubtotalRub: 10000, redemptionCount: 0 },
    );
    assert.equal(r.ok, false);
  });

  it("enforces min order", () => {
    const r = validatePromotionApplicability(
      { ...basePromo, minOrderAmountRub: 20000 },
      { workshopId: "w1", orderSubtotalRub: 10000, redemptionCount: 0 },
    );
    assert.equal(r.ok, false);
  });

  it("matches promo code case-insensitively", () => {
    const r = validatePromotionApplicability(
      { ...basePromo, code: "SPRING10" },
      {
        workshopId: "w1",
        orderSubtotalRub: 10000,
        redemptionCount: 0,
        codeProvided: "spring10",
      },
    );
    assert.equal(r.ok, true);
  });
});

describe("computePromotionDiscountRub", () => {
  it("caps percent discount at subtotal", () => {
    assert.equal(
      computePromotionDiscountRub({ type: "PERCENT", value: 50 }, 1000),
      500,
    );
    assert.equal(
      computePromotionDiscountRub({ type: "FIXED", value: 5000 }, 3000),
      3000,
    );
  });
});

describe("estimate totals", () => {
  it("separates work and discount lines", () => {
    const lines = [
      { lineKind: "WORK", priceRub: 10000 },
      { lineKind: "DISCOUNT", priceRub: -1000 },
    ];
    assert.equal(estimateWorkSubtotalRub(lines), 10000);
    assert.equal(estimateGrandTotalRub(lines), 9000);
  });
});

describe("loyalty points", () => {
  it("earns 1%", () => {
    assert.equal(computeLoyaltyPointsEarn(23000), 230);
  });
});

describe("isPromotionCurrentlyActive", () => {
  it("checks window", () => {
    assert.equal(
      isPromotionCurrentlyActive(basePromo, new Date("2026-06-01")),
      true,
    );
    assert.equal(
      isPromotionCurrentlyActive(basePromo, new Date("2027-01-01")),
      false,
    );
  });
});
