import { describe, expect, it } from "vitest";
import { completionReportDocumentRoleLabel } from "@/features/service-requests/service-request-completion-report-labels";

describe("completion report labels", () => {
  it("maps archive document roles to user-facing labels by request type", () => {
    expect(completionReportDocumentRoleLabel("freight", "final_bl_or_awb")).toBe("최종 B/L 또는 AWB");
    expect(completionReportDocumentRoleLabel("clearance", "import_declaration_certificate")).toBe("수입신고필증");
  });

  it("keeps unknown roles visible for future archive roles", () => {
    expect(completionReportDocumentRoleLabel("freight", "future_archive_role")).toBe("future_archive_role");
  });
});
