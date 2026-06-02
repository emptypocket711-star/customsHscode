import { describe, expect, it } from "vitest";
import {
  buildPartnerOpportunityNextFocus,
  buildRequesterServiceRequestNextFocus
} from "@/server/repositories/service-request-list-view";

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

  it("routes requester drafts with documents to the publish anchor when available", () => {
    expect(buildRequesterServiceRequestNextFocus({
      ...baseInput,
      documentCount: 1,
      publishAnchor: "#request-publish",
      requestStatus: "draft"
    })).toEqual({
      href: "#request-publish",
      label: "공개 설정",
      tone: "info",
      value: "대기"
    });
  });

  it("routes selected partner opportunities to lifecycle actions before bid submission", () => {
    expect(buildPartnerOpportunityNextFocus({
      bidAnchor: "#opportunity-bid",
      questionAnchor: "#opportunity-questions",
      requestStatus: "partner_selected",
      unansweredQuestionCount: 1
    })).toEqual({
      href: "#request-lifecycle",
      label: "진행 시작",
      tone: "info",
      value: "선정"
    });
  });

  it("routes partner opportunity questions before bid submission", () => {
    expect(buildPartnerOpportunityNextFocus({
      bidAnchor: "#opportunity-bid",
      questionAnchor: "#opportunity-questions",
      unansweredQuestionCount: 2
    })).toEqual({
      href: "#opportunity-questions",
      label: "질문 답변 확인",
      tone: "warning",
      value: "2건"
    });
  });

  it("routes partner opportunities to bid submission when no earlier action is pending", () => {
    expect(buildPartnerOpportunityNextFocus({
      bidAnchor: "#opportunity-bid",
      questionAnchor: "#opportunity-questions",
      unansweredQuestionCount: 0
    })).toEqual({
      href: "#opportunity-bid",
      label: "견적 제출",
      tone: "info",
      value: "작성"
    });
  });

  it("routes in-progress partner opportunities to completion controls", () => {
    expect(buildPartnerOpportunityNextFocus({
      bidAnchor: "#opportunity-bid",
      questionAnchor: "#opportunity-questions",
      requestStatus: "in_progress",
      unansweredQuestionCount: 3
    })).toEqual({
      href: "#request-lifecycle",
      label: "완료 처리",
      tone: "info",
      value: "진행중"
    });
  });

  it("routes completed partner opportunities to the completion report and feedback section", () => {
    expect(buildPartnerOpportunityNextFocus({
      bidAnchor: "#opportunity-bid",
      questionAnchor: "#opportunity-questions",
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
