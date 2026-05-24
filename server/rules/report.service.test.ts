import { describe, expect, it } from "vitest";
import { generateMockReport } from "@/server/rules/report.service";

describe("report service", () => {
  it("generates an import report with source locks and pending review", () => {
    const report = generateMockReport("import");

    expect(report.sourceLocks.length).toBeGreaterThan(0);
    expect(report.approval.status).toBe("pending_review");
    expect(report.disclaimer).toContain("AI 예비진단");
  });

  it("generates an export report without final export-control certainty", () => {
    const report = generateMockReport("export");

    expect(report.sections.some((section) => section.title.includes("전략물자"))).toBe(true);
    expect(report.customerSummary).toContain("담당자 검토");
  });
});
