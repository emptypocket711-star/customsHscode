export function uniqueServiceRequestIds(...groups: Array<Array<{ id: string }>>) {
  return Array.from(new Set(groups.flatMap((group) => group.map((item) => item.id))));
}

export function completedServiceRequestIds(...groups: Array<Array<{ id: string; status: string }>>) {
  return uniqueServiceRequestIds(...groups.map((group) => group.filter((item) => item.status === "completed")));
}

export function shouldLoadServiceRequestFeedback(status: string) {
  return status === "completed";
}

export function groupServiceRequestItemsByRequestId<T extends { requestId: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((grouped, item) => {
    grouped[item.requestId] = [...(grouped[item.requestId] ?? []), item];
    return grouped;
  }, {});
}

export function serviceRequestFeedbackMapToRecord<T>(feedbackByRequestId: Map<string, T>) {
  return Object.fromEntries(feedbackByRequestId);
}

export type ServiceRequestNextFocus = {
  href: string;
  label: string;
  tone: "info" | "neutral" | "success" | "warning";
  value: string;
};

export type PartnerOpportunityResponseClue = {
  detail: string;
  href: string;
  label: string;
  tone: "info" | "neutral" | "success" | "warning";
  value: string;
};

export function buildRequesterServiceRequestNextFocus(input: {
  bidCount: number;
  documentCount: number;
  publishAnchor?: string;
  questionAnchor: string;
  requestStatus: string;
  unansweredQuestionCount: number;
}): ServiceRequestNextFocus {
  if (input.requestStatus === "completed") {
    return {
      href: "#request-completion",
      label: "리포트·후기",
      tone: "success",
      value: "완료"
    };
  }

  if (input.requestStatus === "in_progress") {
    return {
      href: "#request-lifecycle",
      label: "완료 처리",
      tone: "info",
      value: "진행중"
    };
  }

  if (input.requestStatus === "partner_selected") {
    return {
      href: "#request-lifecycle",
      label: "진행 시작",
      tone: "info",
      value: "대기"
    };
  }

  if (input.unansweredQuestionCount > 0) {
    return {
      href: input.questionAnchor,
      label: "미답변 질문",
      tone: "warning",
      value: `${input.unansweredQuestionCount}건`
    };
  }

  if (input.bidCount > 0) {
    return {
      href: "#request-bids",
      label: "견적 비교",
      tone: "info",
      value: `${input.bidCount}건`
    };
  }

  if (input.documentCount === 0) {
    return {
      href: "#request-documents",
      label: "서류 첨부",
      tone: "warning",
      value: "권장"
    };
  }

  if (input.requestStatus === "draft" && input.publishAnchor) {
    return {
      href: input.publishAnchor,
      label: "공개 설정",
      tone: "info",
      value: "대기"
    };
  }

  return {
    href: "#request-bids",
    label: "견적 대기",
    tone: "neutral",
    value: "대기"
  };
}

export function buildPartnerOpportunityNextFocus(input: {
  bidAnchor: string;
  questionAnchor: string;
  requestStatus?: string;
  unansweredQuestionCount: number;
}): ServiceRequestNextFocus {
  if (input.requestStatus === "completed") {
    return {
      href: "#request-completion",
      label: "리포트·후기",
      tone: "success",
      value: "완료"
    };
  }

  if (input.requestStatus === "in_progress") {
    return {
      href: "#request-lifecycle",
      label: "완료 처리",
      tone: "info",
      value: "진행중"
    };
  }

  if (input.requestStatus === "partner_selected") {
    return {
      href: "#request-lifecycle",
      label: "진행 시작",
      tone: "info",
      value: "선정"
    };
  }

  if (input.unansweredQuestionCount > 0) {
    return {
      href: input.questionAnchor,
      label: "질문 답변 확인",
      tone: "warning",
      value: `${input.unansweredQuestionCount}건`
    };
  }

  return {
    href: input.bidAnchor,
    label: "견적 제출",
    tone: "info",
    value: "작성"
  };
}

function partnerInterestStatusLabel(status?: string) {
  if (status === "viewed") return "검토중";
  if (status === "interested") return "관심 표시";
  if (status === "declined") return "참여 보류";
  return "미확인";
}

function partnerInterestStatusTone(status?: string): PartnerOpportunityResponseClue["tone"] {
  if (status === "interested") return "success";
  if (status === "declined") return "warning";
  if (status === "viewed") return "info";
  return "neutral";
}

function partnerInterestStatusDetail(status?: string) {
  if (status === "viewed") return "요청을 열람한 상태입니다. 질문 또는 견적 제출 중 다음 행동을 선택합니다.";
  if (status === "interested") return "관심 표시가 저장된 요청입니다. 공개 조건과 서류를 확인한 뒤 견적을 제출합니다.";
  if (status === "declined") return "참여 보류 상태입니다. 조건이 바뀌었는지 확인한 뒤 필요하면 다시 검토합니다.";
  return "이 요청을 아직 검토하지 않았거나 관심 상태가 저장되지 않았습니다.";
}

export function buildPartnerOpportunityResponseClues(input: {
  bidAnchor: string;
  documentAnchor: string;
  documentCount: number;
  interestStatus?: string;
  questionAnchor: string;
  requestStatus?: string;
  unansweredQuestionCount: number;
}): PartnerOpportunityResponseClue[] {
  if (input.requestStatus === "completed") {
    return [{
      detail: "완료 리포트와 후기 상태를 확인합니다.",
      href: "#request-completion",
      label: "거래 완료",
      tone: "success",
      value: "완료"
    }];
  }

  if (input.requestStatus === "in_progress" || input.requestStatus === "partner_selected") {
    return [{
      detail: input.requestStatus === "in_progress"
        ? "진행중 요청입니다. 완료 처리와 최종 서류 정리를 확인합니다."
        : "선정된 요청입니다. 진행 시작 조건과 선정 후 공개 서류를 확인합니다.",
      href: "#request-lifecycle",
      label: "선정 후속",
      tone: "success",
      value: input.requestStatus === "in_progress" ? "진행중" : "선정"
    }];
  }

  const clues: PartnerOpportunityResponseClue[] = [{
    detail: partnerInterestStatusDetail(input.interestStatus),
    href: input.bidAnchor,
    label: "검토 상태",
    tone: partnerInterestStatusTone(input.interestStatus),
    value: partnerInterestStatusLabel(input.interestStatus)
  }];

  if (input.unansweredQuestionCount > 0) {
    clues.push({
      detail: "화주가 답해야 할 질문이 남아 있으면 견적 판단이 늦어질 수 있습니다.",
      href: input.questionAnchor,
      label: "질문 확인",
      tone: "warning",
      value: `${input.unansweredQuestionCount}건`
    });
  } else {
    clues.push({
      detail: "미답변 질문이 없으면 현재 공개 조건 기준으로 견적 제출 여부를 판단할 수 있습니다.",
      href: input.bidAnchor,
      label: "질문 상태",
      tone: "success",
      value: "정리"
    });
  }

  clues.push({
    detail: input.documentCount > 0
      ? "공개 서류 수를 확인하고 부족한 자료는 질문으로 요청합니다."
      : "공개 서류가 없으면 견적 조건을 확정하기 어려울 수 있습니다.",
    href: input.documentAnchor,
    label: "공개 서류",
    tone: input.documentCount > 0 ? "info" : "warning",
    value: `${input.documentCount}건`
  });

  return clues;
}
