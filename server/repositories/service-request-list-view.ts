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
