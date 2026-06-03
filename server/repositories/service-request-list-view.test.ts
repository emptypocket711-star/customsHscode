import { describe, expect, it } from "vitest";
import {
  buildPartnerOpportunityNextFocus,
  buildPartnerOpportunityResponseClues,
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
    })).toMatchObject({
      detail: "파트너가 선정된 요청은 진행 시작 처리 후 후속 업무를 관리합니다.",
      href: "#request-lifecycle",
      label: "진행 시작",
      tone: "info",
      value: "대기"
    });

    expect(buildRequesterServiceRequestNextFocus({
      ...baseInput,
      bidCount: 2,
      requestStatus: "in_progress"
    })).toMatchObject({
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
    })).toMatchObject({
      detail: "거래 완료 후에는 완료 리포트, 보관 서류, 후기를 먼저 확인합니다.",
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
    })).toMatchObject({
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
    })).toMatchObject({
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
    })).toMatchObject({
      detail: "화주 답변이 남아 있으면 견적 조건을 확정하기 어렵습니다.",
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
    })).toMatchObject({
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
    })).toMatchObject({
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
    })).toMatchObject({
      href: "#request-completion",
      label: "리포트·후기",
      tone: "success",
      value: "완료"
    });
  });

  it("summarizes partner opportunity response clues before bid submission", () => {
    const clues = buildPartnerOpportunityResponseClues({
      bidAnchor: "#opportunity-bid",
      documentAnchor: "#opportunity-documents",
      documentCount: 0,
      interestStatus: "viewed",
      questionAnchor: "#opportunity-questions",
      requestStatus: "open",
      unansweredQuestionCount: 2
    });

    expect(clues).toEqual([
      {
        detail: "요청을 열람한 상태입니다. 질문 또는 견적 제출 중 다음 행동을 선택합니다.",
        href: "#opportunity-bid",
        label: "검토 상태",
        tone: "info",
        value: "검토중"
      },
      {
        detail: "화주가 답해야 할 질문이 남아 있으면 견적 판단이 늦어질 수 있습니다.",
        href: "#opportunity-questions",
        label: "질문 확인",
        tone: "warning",
        value: "2건"
      },
      {
        detail: "공개 서류가 없으면 견적 조건을 확정하기 어려울 수 있습니다.",
        href: "#opportunity-documents",
        label: "공개 서류",
        tone: "warning",
        value: "0건"
      }
    ]);
  });

  it("shows selected partner lifecycle clues instead of generic bid clues", () => {
    expect(buildPartnerOpportunityResponseClues({
      bidAnchor: "#opportunity-bid",
      documentAnchor: "#opportunity-documents",
      documentCount: 3,
      interestStatus: "interested",
      questionAnchor: "#opportunity-questions",
      requestStatus: "partner_selected",
      unansweredQuestionCount: 1
    })).toEqual([
      {
        detail: "선정된 요청입니다. 진행 시작 조건과 선정 후 공개 서류를 확인합니다.",
        href: "#request-lifecycle",
        label: "선정 후속",
        tone: "success",
        value: "선정"
      }
    ]);
  });
});
