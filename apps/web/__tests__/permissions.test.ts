import { describe, expect, it } from "vitest";
import {
  ROLE_LABEL,
  canEditPatients,
  canManageKnowledge,
  canManageTeam,
} from "@/lib/permissions";
import { PRIMARY_NAV, SECONDARY_NAV, visibleFor } from "@/components/dashboard/nav-config";

describe("role capabilities", () => {
  it("gates team management to owners", () => {
    expect(canManageTeam("owner")).toBe(true);
    expect(canManageTeam("manager")).toBe(false);
    expect(canManageTeam(null)).toBe(false);
  });

  it("lets owners and managers edit knowledge + patients", () => {
    for (const r of ["owner", "manager"] as const) {
      expect(canManageKnowledge(r)).toBe(true);
      expect(canEditPatients(r)).toBe(true);
    }
    expect(canManageKnowledge("front_desk")).toBe(false);
    expect(canEditPatients("front_desk")).toBe(false);
  });

  it("labels every role", () => {
    expect(ROLE_LABEL.front_desk).toBe("Front Desk");
  });
});

describe("visibleFor", () => {
  it("front desk sees only the primary nav", () => {
    expect(visibleFor(PRIMARY_NAV, "front_desk").map((i) => i.href)).toEqual([
      "/dashboard",
      "/dashboard/patients",
      "/dashboard/chat-tester",
    ]);
    expect(visibleFor(SECONDARY_NAV, "front_desk")).toHaveLength(0);
  });

  it("owner sees team, manager does not", () => {
    expect(visibleFor(SECONDARY_NAV, "owner").some((i) => i.href === "/dashboard/team")).toBe(true);
    expect(visibleFor(SECONDARY_NAV, "manager").some((i) => i.href === "/dashboard/team")).toBe(
      false,
    );
  });
});
