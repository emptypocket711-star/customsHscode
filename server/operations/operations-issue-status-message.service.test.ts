import { describe, expect, it } from "vitest";
import {
  buildOperationsIssueStatusErrorMessage,
  buildOperationsIssueStatusNextStep,
  buildOperationsIssueStatusSuccessMessage,
  operationsIssueStatusActionLabel
} from "@/server/operations/operations-issue-status-message.service";

describe("operations issue status messages", () => {
  it.each([
    ["resolved", "해결 처리"],
    ["ignored", "제외 처리"],
    ["open", "다시 열기"],
    [undefined, "상태 변경"],
    ["unexpected", "상태 변경"]
  ])("maps %s to the action label %s", (status, label) => {
    expect(operationsIssueStatusActionLabel(status)).toBe(label);
  });

  it("builds status-specific success messages", () => {
    expect(buildOperationsIssueStatusSuccessMessage("resolved"))
      .toBe("운영 이슈 해결 처리 결과를 저장했습니다.");
    expect(buildOperationsIssueStatusSuccessMessage("ignored"))
      .toBe("운영 이슈 제외 처리 결과를 저장했습니다.");
    expect(buildOperationsIssueStatusSuccessMessage("open"))
      .toBe("운영 이슈 다시 열기 결과를 저장했습니다.");
  });

  it("builds status-specific error messages with the original reason", () => {
    expect(buildOperationsIssueStatusErrorMessage("resolved", "권한이 없습니다."))
      .toBe("운영 이슈 해결 처리를 저장하지 못했습니다. 권한이 없습니다.");
    expect(buildOperationsIssueStatusErrorMessage("ignored", "입력값을 확인해 주세요."))
      .toBe("운영 이슈 제외 처리를 저장하지 못했습니다. 입력값을 확인해 주세요.");
    expect(buildOperationsIssueStatusErrorMessage("open", "네트워크 오류"))
      .toBe("운영 이슈 다시 열기를 저장하지 못했습니다. 네트워크 오류");
  });

  it("falls back to a generic action message for invalid status input", () => {
    expect(buildOperationsIssueStatusSuccessMessage("invalid"))
      .toBe("운영 이슈 상태 변경 결과를 저장했습니다.");
    expect(buildOperationsIssueStatusErrorMessage(undefined, "입력값을 확인해 주세요."))
      .toBe("운영 이슈 상태 변경을 저장하지 못했습니다. 입력값을 확인해 주세요.");
  });

  it("builds status-specific next-step guidance", () => {
    expect(buildOperationsIssueStatusNextStep("resolved"))
      .toContain("재발 여부를 모니터링");
    expect(buildOperationsIssueStatusNextStep("ignored"))
      .toContain("제외 근거");
    expect(buildOperationsIssueStatusNextStep("open"))
      .toContain("우선순위");
    expect(buildOperationsIssueStatusNextStep("invalid"))
      .toContain("상태 변경 이력");
  });
});
