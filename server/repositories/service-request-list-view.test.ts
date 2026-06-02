import { describe, expect, it } from "vitest";
import { buildRequesterServiceRequestNextFocus } from "@/server/repositories/service-request-list-view";

const baseInput = {
  bidCount: 0,
  documentCount: 1,
  questionAnchor: "#request-questions",
  unansweredQuestionCount: 0
};

describe("service request list view", () => {
  it("routes selected and in-progress requester details to lifecycle actions before generic bid anchors", () => {
    expect(buildRequesterServiceRequestNextFocus({
      ...baseInput,
      bidCount: 2,
      requestStatus: "partner_selected",
      unansweredQuestionCount: 1
    })).toEqual({
      href: "#request-lifecycle",
      label: "진행 시작",
      tone: "info",
      value: "대기"
    });

    expect(buildRequesterServiceRequestNextFocus({
      ...baseInput,
      bidCount: 2,
      requestStatus: "in_progress"
    })).toEqual({
      href: "#request-lifecycle",
      label: "완료 처리",
      tone: "info",
      value: "진행중"
    });
  });

  it("routes completed requester details to the completion report and feedback section", () => {
    expect(buildRequesterServiceRequestNextFocus({
      ...baseInput,
      bidCount: 2,
      requestStatus: "completed",
      unansweredQuestionCount: 1
    })).toEqual({
      href: "#request-completion",
      label: "리포트·후기",
      tone: "success",
      value: "완료"
    });
  });
});
