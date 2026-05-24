import { describe, expect, it } from "vitest";
import { getLegalUpdateDashboard, legalUpdateInternals } from "@/server/rules/legal-update.service";

describe("legal update service", () => {
  it("blocks medium or higher pending changes from publish without staff review", () => {
    const dashboard = getLegalUpdateDashboard();

    expect(dashboard.blockedPublishChanges.map((change) => change.riskLevel)).toContain("critical");
    expect(dashboard.autoPublishableChanges.every((change) => change.riskLevel === "low")).toBe(true);
    expect(legalUpdateInternals.requiresStaffReview({ riskLevel: "medium" } as never)).toBe(true);
  });

  it("returns impacted reports and hsk codes for review queue", () => {
    const dashboard = getLegalUpdateDashboard();

    expect(dashboard.impactedHsCodes).toContain("8507601000");
    expect(dashboard.impactedReports[0]?.status).toBe("source_changed_after_generation");
  });
});
