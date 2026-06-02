import { describe, expect, it } from "vitest";
import { completionReportPreviewUnavailableCopy } from "@/features/service-requests/service-request-completion-report-fallback-copy";

describe("completion report fallback copy", () => {
  it("keeps unavailable preview copy user-safe", () => {
    const copy = completionReportPreviewUnavailableCopy();
    const serialized = JSON.stringify(copy);

    expect(copy.title).toContain("완료 리포트");
    expect(copy.body).toContain("운영자");
    expect(serialized).not.toContain("schema");
    expect(serialized).not.toContain("table");
    expect(serialized).not.toContain("SQL");
    expect(serialized).not.toContain("DB");
  });
});
