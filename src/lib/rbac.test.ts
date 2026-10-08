import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isNetworkAdminRole } from "./roles";
import { requireStaffRole } from "./rbac";

describe("isNetworkAdminRole", () => {
  it("allows network admin roles only", () => {
    assert.equal(isNetworkAdminRole("NETWORK_ADMIN"), true);
    assert.equal(isNetworkAdminRole("NETWORK_DIRECTOR"), true);
    assert.equal(isNetworkAdminRole("MANAGER"), false);
    assert.equal(isNetworkAdminRole("QC"), false);
  });
});

describe("requireStaffRole admin guard", () => {
  const adminRoles = ["NETWORK_ADMIN", "NETWORK_DIRECTOR"];

  it("grants admin panel access roles", () => {
    assert.equal(
      requireStaffRole(
        {
          type: "staff",
          userId: "1",
          organizationId: "1",
          role: "NETWORK_ADMIN",
          allBranches: true,
          workshopId: null,
        },
        adminRoles,
      ),
      true,
    );
    assert.equal(
      requireStaffRole(
        {
          type: "staff",
          userId: "1",
          organizationId: "1",
          role: "MANAGER",
          allBranches: true,
          workshopId: null,
        },
        adminRoles,
      ),
      false,
    );
  });
});
