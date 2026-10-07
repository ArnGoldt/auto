import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canCompleteOperation,
  supplementBlocksWork,
  canReleaseOrder,
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
