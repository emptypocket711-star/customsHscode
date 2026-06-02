import { describe, expect, it } from "vitest";
import { safeCompletionReportSourceHref } from "@/features/service-requests/service-request-completion-report-source-url";

describe("completion report source URL safety", () => {
  it("allows http and https source URLs", () => {
    expect(safeCompletionReportSourceHref("https://example.test/source")).toBe("https://example.test/source");
    expect(safeCompletionReportSourceHref("http://localhost/source")).toBe("http://localhost/source");
  });

  it("rejects unsafe or empty source URLs", () => {
    expect(safeCompletionReportSourceHref("javascript:alert(1)")).toBeNull();
    expect(safeCompletionReportSourceHref("data:text/html,source")).toBeNull();
    expect(safeCompletionReportSourceHref("/internal/source")).toBeNull();
    expect(safeCompletionReportSourceHref(undefined)).toBeNull();
  });
});
