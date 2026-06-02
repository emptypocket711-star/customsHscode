import type { SupabaseClient } from "@supabase/supabase-js";

export type PlatformRequestType = "clearance" | "freight";
export type PlatformRequestStatus =
  | "bids_received"
  | "cancelled"
  | "completed"
  | "draft"
  | "expired"
  | "in_progress"
  | "open"
  | "partner_selected";

export type PlatformRequestOperationsRow = {
  created_at: string;
  deadline_at: string | null;
  id: string;
  request_type: PlatformRequestType;
  status: PlatformRequestStatus;
  updated_at?: string;
};

export type PlatformBidOperationsRow = {
  id: string;
  request_id: string;
  status: string;
};

export type PlatformQuestionOperationsRow = {
  answer: string | null;
  id: string;
  request_id: string;
};

export type PlatformMatchOperationsRow = {
  notification_status: string | null;
  request_id: string;
};

export type PlatformMatchOperationsSummary = {
  failedNotificationCount: number;
  matchedPartnerCount: number;
  pendingNotificationCount: number;
  sentNotificationCount: number;
  skippedNotificationCount: number;
};

export type PlatformFeedbackOperationsRow = {
  communication_score: number | null;
  document_quality_score: number | null;
  id: string;
  rating: number;
  request_id: string;
  response_speed_score: number | null;
};

export type PlatformCompletionReportOperationsRow = {
  id: string;
  request_id: string;
  status: string;
};

export type PlatformRequestOperationsDetail = {
  bids: Array<{
    bidId: string;
    bidderCompanyId: string;
    currency: string | null;
    leadTimeDays: number | null;
    message: string | null;
    selectedAt: string | null;
    status: string;
    submittedAt: string | null;
    totalAmount: number | null;
  }>;
  clearanceDetail: {
    estimatedDeclarationCount: number | null;
    ftaPreferenceRequested: boolean;
    hsCodeKnown: boolean;
    requirementsCheckNeeded: boolean;
    urgent: boolean;
  } | null;
  completionReport: {
    currency: string | null;
    documentMappings: Array<{
      documentRole: string;
      mappingId: string;
      requiredForArchive: boolean;
    }>;
    finalAmountPresent: boolean;
    hasClearanceResult: boolean;
    hasFreightResult: boolean;
    lockedAt: string | null;
    reportId: string;
    status: string;
    submittedAt: string | null;
    summaryPresent: boolean;
    updatedAt: string;
  } | null;
  feedbackSummary: {
    averageRating: number | null;
    count: number;
    lowScoreCount: number;
  };
  documents: Array<{
    createdAt: string;
    documentId: string;
    documentType: string;
    fileName: string;
    fileSize: number | null;
    visibility: string;
  }>;
  freightDetail: {
    cbm: number | null;
    destinationPort: string | null;
    grossWeight: number | null;
    originPort: string | null;
    transportMode: string | null;
  } | null;
  matchSummary: PlatformMatchOperationsSummary | null;
  questions: Array<{
    answer: string | null;
    answeredAt: string | null;
    bidderCompanyId: string;
    createdAt: string;
    question: string;
    questionId: string;
  }>;
  request: {
    createdAt: string;
    deadlineAt: string | null;
    destinationCountryCode: string | null;
    direction: "import" | "export";
    hskCode: string | null;
    id: string;
    originCountryCode: string | null;
    productSummary: string | null;
    requestType: PlatformRequestType;
    status: PlatformRequestStatus;
    title: string;
  } | null;
  schemaReady: boolean;
};

export type PlatformRequestOperationsImprovementPrompt = {
  category:
    | "bid_conversion"
    | "deadline_followup"
    | "document_guidance"
    | "draft_activation"
    | "lifecycle_followup"
    | "match_condition"
    | "question_response"
    | "workflow_review";
  label: string;
  prompt: string;
};

export type PlatformRequestOperationsSummary = {
  actionRequest: string;
  actionItems: PlatformRequestOperationsActionItem[];
  averageFeedbackRating: number | null;
  bidsReceived: number;
  clearance: number;
  completed: number;
  completedWithoutReport: number;
  completedWithoutFeedback: number;
  completionReportsAcknowledged: number;
  completionReportsLocked: number;
  completionReportsReadyToLock: number;
  completionReportsSubmitted: number;
  feedbackCount: number;
  draft: number;
  freight: number;
  inProgress: number;
  lowFeedbacks: number;
  open: number;
  openWithoutBids: number;
  openWithoutMatches: number;
  partnerSelected: number;
  schemaReady: boolean;
  staleDrafts: number;
  staleInProgress: number;
  staleOpen: number;
  total: number;
  unansweredQuestions: number;
};

export type PlatformRequestOperationsActionItem = {
  detail: string;
  href: string;
  label: string;
  requestId: string;
  requestType: PlatformRequestType;
  status: PlatformRequestStatus;
};

export const platformRequestOperationsDetailSelects = {
  bids: "id,bidder_company_id,status,currency,lead_time_days,submitted_at,selected_at",
  documents: "id,document_type,file_size,visibility,created_at",
  completionReport: "id,status,summary,currency,final_amount,clearance_result,freight_result,submitted_at,locked_at,updated_at",
  completionReportDocuments: "id,document_role,required_for_archive",
  feedbacks: "id,rating,response_speed_score,communication_score,document_quality_score",
  questions: "id,bidder_company_id,answered_at,created_at",
  request: "id,request_type,direction,status,hsk_code,origin_country_code,destination_country_code,deadline_at,created_at"
} as const;

function isMissingMarketplaceSchemaError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    (error.code === "PGRST205" && message.toLowerCase().includes("schema cache"))
  );
}

function emptySummary(schemaReady: boolean): PlatformRequestOperationsSummary {
  return {
    actionRequest: schemaReady ? "플랫폼 요청이 아직 없습니다. 가입/요청 생성 흐름부터 점검해줘." : "플랫폼 요청 DB 스키마 적용 상태를 먼저 확인해줘.",
    actionItems: [],
    averageFeedbackRating: null,
    bidsReceived: 0,
    clearance: 0,
    completed: 0,
    completedWithoutReport: 0,
    completedWithoutFeedback: 0,
    completionReportsAcknowledged: 0,
    completionReportsLocked: 0,
    completionReportsReadyToLock: 0,
    completionReportsSubmitted: 0,
    feedbackCount: 0,
    draft: 0,
    freight: 0,
    inProgress: 0,
    lowFeedbacks: 0,
    open: 0,
    openWithoutBids: 0,
    openWithoutMatches: 0,
    partnerSelected: 0,
    schemaReady,
    staleDrafts: 0,
    staleInProgress: 0,
    staleOpen: 0,
    total: 0,
    unansweredQuestions: 0
  };
}

function requestDetailHref(request: PlatformRequestOperationsRow, anchor?: string) {
  return anchor ? `/operations/requests/${request.id}#${anchor}` : `/operations/requests/${request.id}`;
}

function requestTypeLabel(requestType: PlatformRequestType) {
  return requestType === "freight" ? "운송" : "통관";
}

function buildActionItem(
  request: PlatformRequestOperationsRow,
  input: {
    anchor?: string;
    detail: string;
    label: string;
  }
): PlatformRequestOperationsActionItem {
  return {
    detail: input.detail,
    href: requestDetailHref(request, input.anchor),
    label: input.label,
    requestId: request.id,
    requestType: request.request_type,
    status: request.status
  };
}

function formatPromptLine(label: string, value: string | number) {
  return `- ${label}: ${value}`;
}

function emptyMatchOperationsSummary(): PlatformMatchOperationsSummary {
  return {
    failedNotificationCount: 0,
    matchedPartnerCount: 0,
    pendingNotificationCount: 0,
    sentNotificationCount: 0,
    skippedNotificationCount: 0
  };
}

function incrementMatchNotificationStatus(summary: PlatformMatchOperationsSummary, status: string | null) {
  if (status === "pending") summary.pendingNotificationCount += 1;
  if (status === "sent") summary.sentNotificationCount += 1;
  if (status === "skipped") summary.skippedNotificationCount += 1;
  if (status === "failed") summary.failedNotificationCount += 1;
}

function summarizeMatchOperations(
  requestIds: string[],
  matches: PlatformMatchOperationsRow[]
) {
  const summaryByRequestId = new Map<string, PlatformMatchOperationsSummary>();

  for (const requestId of requestIds) {
    summaryByRequestId.set(requestId, emptyMatchOperationsSummary());
  }

  for (const match of matches) {
    const summary = summaryByRequestId.get(match.request_id) ?? emptyMatchOperationsSummary();
    summary.matchedPartnerCount += 1;
    incrementMatchNotificationStatus(summary, match.notification_status);
    summaryByRequestId.set(match.request_id, summary);
  }

  return summaryByRequestId;
}

export function buildPlatformRequestImprovementPrompt(
  detail: PlatformRequestOperationsDetail
): PlatformRequestOperationsImprovementPrompt | null {
  if (!detail.request) return null;

  const request = detail.request;
  const unansweredQuestions = detail.questions.filter((question) => !question.answer).length;
  const activeBids = detail.bids.filter((bid) => bid.status !== "hidden" && bid.status !== "withdrawn").length;
  const isDeadlinePassed = request.deadlineAt ? new Date(request.deadlineAt).getTime() < Date.now() : false;
  const requestLabel = requestTypeLabel(request.requestType);
  const commonLines = [
    "아래 운영 샘플을 기준으로 사용자가 다음 행동을 더 쉽게 하도록 개선해줘.",
    formatPromptLine("요청 ID", request.id),
    formatPromptLine("요청 유형", requestLabel),
    formatPromptLine("상태", request.status),
    formatPromptLine("서류 수", detail.documents.length),
    formatPromptLine("질문 수", detail.questions.length),
    formatPromptLine("미답변 질문 수", unansweredQuestions),
    formatPromptLine("견적 수", activeBids),
    formatPromptLine("파트너 노출 수", detail.matchSummary?.matchedPartnerCount ?? "확인 불가"),
    "주의: 서류 원문, 파일명, 단가 원문, 개인정보는 프롬프트나 로그에 포함하지 말고 건수와 상태만 사용해."
  ];

  if (unansweredQuestions > 0) {
    return {
      category: "question_response",
      label: "미답변 질문 답변 흐름 개선",
      prompt: [
        ...commonLines,
        "목표: 화주가 미답변 질문을 놓치지 않고 상세 화면에서 바로 답변하게 만들어줘.",
        "확인할 것: 대시보드 알림, 요청 목록 요약, 상세 화면 바로가기, 답변 완료 후 상태 표시."
      ].join("\n")
    };
  }

  if (request.status === "bids_received" && activeBids > 0) {
    return {
      category: "bid_conversion",
      label: "견적 비교·선택 전환 개선",
      prompt: [
        ...commonLines,
        "목표: 견적이 도착한 요청에서 화주가 가격, 리드타임, 조건을 비교하고 업체를 선택하기 쉽게 만들어줘.",
        "확인할 것: 견적 정렬, 선택 CTA, 선택 전 주의 문구, 선택 후 다음 단계 안내."
      ].join("\n")
    };
  }

  if ((request.status === "open" || request.status === "bids_received") && isDeadlinePassed) {
    return {
      category: "deadline_followup",
      label: "마감 이후 후속 안내 개선",
      prompt: [
        ...commonLines,
        "목표: 마감 시간이 지난 공개 요청에서 연장, 재공개, 종료 중 다음 행동을 명확히 안내해줘.",
        "확인할 것: 마감 표시, 재공개 버튼 위치, 파트너 알림 재발송 조건, 빈 견적 상태 안내."
      ].join("\n")
    };
  }

  if (request.status === "open" && detail.matchSummary?.matchedPartnerCount === 0) {
    return {
      category: "match_condition",
      label: "파트너 노출 0건 매칭 조건 개선",
      prompt: [
        ...commonLines,
        "목표: 공개됐지만 파트너 노출이 0건인 요청에서 요청 조건, 파트너 관심 조건, 검증 상태, 알림 대상 계산을 점검해줘.",
        "확인할 것: 요청 국가·업무 유형·특수 조건, 파트너 관심 조건 저장값, 숨김/정지/차단 업체 제외, 알림 worker dry-run 결과."
      ].join("\n")
    };
  }

  if (request.status === "open" && activeBids === 0) {
    return {
      category: "bid_conversion",
      label: "견적 없는 공개 요청 개선",
      prompt: [
        ...commonLines,
        "목표: 공개됐지만 견적이 없는 요청에서 매칭 조건과 파트너 알림 흐름을 점검해줘.",
        "확인할 것: 파트너 관심 조건, 알림 claim 상태, 요청 필수 정보 부족 여부, 파트너가 질문하기 쉬운 UI."
      ].join("\n")
    };
  }

  if (request.status === "draft") {
    return {
      category: "draft_activation",
      label: "초안 다음 행동 개선",
      prompt: [
        ...commonLines,
        "목표: 저장된 초안에서 사용자가 부족한 정보를 채우고 공개까지 이어가게 만들어줘.",
        "확인할 것: 필수값 안내, 서류 첨부 안내, 공개 가능 조건, 상세 작업 바로가기."
      ].join("\n")
    };
  }

  if (request.status === "partner_selected" || request.status === "in_progress") {
    return {
      category: "lifecycle_followup",
      label: request.status === "partner_selected" ? "선정 이후 진행 시작 개선" : "진행중 요청 완료 전환 개선",
      prompt: [
        ...commonLines,
        request.status === "partner_selected"
          ? "목표: 업체가 선정된 요청에서 화주와 파트너가 진행 시작을 놓치지 않게 만들어줘."
          : "목표: 진행중 요청에서 완료 처리, 후속 정산, 리포트 준비로 자연스럽게 이어지게 만들어줘.",
        "확인할 것: 상태 배지, 다음 작업 CTA, 요청자/선정 파트너 양쪽 화면, 오래 멈춘 요청 운영 샘플."
      ].join("\n")
    };
  }

  if (detail.documents.length === 0) {
    return {
      category: "document_guidance",
      label: "서류 첨부 안내 개선",
      prompt: [
        ...commonLines,
        "목표: 서류가 없는 요청에서 사용자가 어떤 서류를 왜 첨부해야 하는지 쉽게 이해하게 만들어줘.",
        "확인할 것: 업무 유형별 추천 서류, 공개 범위 설명, 서류 없이도 질문/견적이 가능한지 안내."
      ].join("\n")
    };
  }

  return {
    category: "workflow_review",
    label: "요청 상세 흐름 표본 점검",
    prompt: [
      ...commonLines,
      "목표: 이 요청을 표본으로 요청 생성, 서류, 질문, 견적, 선택까지 흐름이 끊기지 않는지 점검해줘.",
      "확인할 것: 목록 요약, 상세 화면 우선순위, 빈 상태, 다음 작업 CTA."
    ].join("\n")
  };
}

export function summarizePlatformRequestOperations(input: {
  bids: PlatformBidOperationsRow[];
  completionReports?: PlatformCompletionReportOperationsRow[];
  feedbacks?: PlatformFeedbackOperationsRow[];
  matchSummaries?: Map<string, PlatformMatchOperationsSummary>;
  now: Date;
  questions: PlatformQuestionOperationsRow[];
  requests: PlatformRequestOperationsRow[];
}): PlatformRequestOperationsSummary {
  if (input.requests.length === 0) return emptySummary(true);

  const bidRequestIds = new Set(input.bids
    .filter((bid) => bid.status !== "hidden" && bid.status !== "withdrawn")
    .map((bid) => bid.request_id));
  const requestById = new Map(input.requests.map((request) => [request.id, request]));
  const feedbacks = input.feedbacks ?? [];
  const completionReports = input.completionReports ?? [];
  const activeCompletionReports = completionReports.filter((report) => report.status !== "voided");
  const feedbackRequestIds = new Set(feedbacks.map((feedback) => feedback.request_id));
  const completionReportRequestIds = new Set(activeCompletionReports.map((report) => report.request_id));
  const completedRows = input.requests.filter((request) => request.status === "completed");
  const completedWithoutReportRows = completedRows.filter((request) => !completionReportRequestIds.has(request.id));
  const completedWithoutFeedbackRows = completedRows.filter((request) => !feedbackRequestIds.has(request.id));
  const submittedReportRows = activeCompletionReports
    .filter((report) => report.status === "submitted")
    .map((report) => requestById.get(report.request_id))
    .filter((request): request is PlatformRequestOperationsRow => Boolean(request));
  const acknowledgedReportRows = activeCompletionReports
    .filter((report) => report.status === "requester_acknowledged" || report.status === "partner_acknowledged")
    .map((report) => requestById.get(report.request_id))
    .filter((request): request is PlatformRequestOperationsRow => Boolean(request));
  const readyToLockReportRows = activeCompletionReports
    .filter((report) => report.status === "operator_reviewed")
    .map((report) => requestById.get(report.request_id))
    .filter((request): request is PlatformRequestOperationsRow => Boolean(request));
  const lowFeedbackRows = feedbacks
    .filter((feedback) =>
      feedback.rating <= 3 ||
      (feedback.response_speed_score !== null && feedback.response_speed_score <= 3) ||
      (feedback.communication_score !== null && feedback.communication_score <= 3) ||
      (feedback.document_quality_score !== null && feedback.document_quality_score <= 3)
    )
    .map((feedback) => requestById.get(feedback.request_id))
    .filter((request): request is PlatformRequestOperationsRow => Boolean(request));
  const threeDaysAgo = input.now.getTime() - 3 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = input.now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const unansweredQuestions = input.questions.filter((question) => !question.answer).length;
  const staleDraftRows = input.requests.filter((request) =>
    request.status === "draft" && new Date(request.created_at).getTime() < threeDaysAgo
  );
  const staleInProgressRows = input.requests.filter((request) =>
    request.status === "in_progress" && new Date(request.updated_at ?? request.created_at).getTime() < sevenDaysAgo
  );
  const staleOpenRows = input.requests.filter((request) =>
    (request.status === "open" || request.status === "bids_received")
    && request.deadline_at
    && new Date(request.deadline_at).getTime() < input.now.getTime()
  );
  const openWithoutMatchRows = input.matchSummaries
    ? input.requests.filter((request) =>
      request.status === "open" && (input.matchSummaries?.get(request.id)?.matchedPartnerCount ?? 0) === 0
    )
    : [];
  const openWithoutBidRows = input.requests.filter((request) =>
    request.status === "open" && !bidRequestIds.has(request.id)
  );
  const bidsReceivedRows = input.requests.filter((request) => request.status === "bids_received");
  const inProgressRows = input.requests.filter((request) => request.status === "in_progress");
  const unansweredQuestionRows = Array.from(new Set(input.questions
    .filter((question) => !question.answer)
    .map((question) => question.request_id)))
    .map((requestId) => requestById.get(requestId))
    .filter((request): request is PlatformRequestOperationsRow => Boolean(request));

  const summary = input.requests.reduce((current, request) => {
    current.total += 1;
    if (request.request_type === "freight") current.freight += 1;
    if (request.request_type === "clearance") current.clearance += 1;
    if (request.status === "draft") current.draft += 1;
    if (request.status === "open") current.open += 1;
    if (request.status === "bids_received") current.bidsReceived += 1;
    if (request.status === "partner_selected") current.partnerSelected += 1;
    if (request.status === "in_progress") current.inProgress += 1;
    if (request.status === "completed") current.completed += 1;
    return current;
  }, emptySummary(true));

  summary.openWithoutBids = openWithoutBidRows.length;
  summary.openWithoutMatches = openWithoutMatchRows.length;
  summary.staleDrafts = staleDraftRows.length;
  summary.staleInProgress = staleInProgressRows.length;
  summary.staleOpen = staleOpenRows.length;
  summary.unansweredQuestions = unansweredQuestions;
  summary.feedbackCount = feedbacks.length;
  summary.lowFeedbacks = lowFeedbackRows.length;
  summary.completedWithoutReport = completedWithoutReportRows.length;
  summary.completedWithoutFeedback = completedWithoutFeedbackRows.length;
  summary.completionReportsAcknowledged = acknowledgedReportRows.length;
  summary.completionReportsLocked = activeCompletionReports.filter((report) => report.status === "locked").length;
  summary.completionReportsReadyToLock = readyToLockReportRows.length;
  summary.completionReportsSubmitted = submittedReportRows.length;
  summary.averageFeedbackRating = feedbacks.length > 0
    ? Math.round((feedbacks.reduce((total, feedback) => total + feedback.rating, 0) / feedbacks.length) * 10) / 10
    : null;

  if (unansweredQuestions > 0) {
    summary.actionRequest = `플랫폼 요청 중 미답변 질문 ${unansweredQuestions}건을 찾아서 답변 UX와 알림 흐름을 점검해줘.`;
    summary.actionItems = unansweredQuestionRows.slice(0, 3).map((request) => buildActionItem(request, {
      anchor: "request-questions",
      detail: `${requestTypeLabel(request.request_type)} 요청의 질문 답변 상태를 확인합니다.`,
      label: "미답변 질문 확인"
    }));
  } else if (summary.bidsReceived > 0) {
    summary.actionRequest = `견적이 도착한 요청 ${summary.bidsReceived}건의 비교·선택 전환 UX를 점검해줘.`;
    summary.actionItems = bidsReceivedRows.slice(0, 3).map((request) => buildActionItem(request, {
      anchor: "request-bids",
      detail: `${requestTypeLabel(request.request_type)} 요청의 견적 비교·선택 위치를 확인합니다.`,
      label: "견적 비교 확인"
    }));
  } else if (staleInProgressRows.length > 0) {
    summary.actionRequest = `7일 이상 진행중인 요청 ${staleInProgressRows.length}건의 완료 처리와 후속 안내 흐름을 점검해줘.`;
    summary.actionItems = staleInProgressRows.slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 요청이 진행중 상태에서 오래 멈췄는지 확인합니다.`,
      label: "오래 진행중 요청 확인"
    }));
  } else if (completedWithoutReportRows.length > 0) {
    summary.actionRequest = `완료됐지만 완료 리포트가 없는 요청 ${completedWithoutReportRows.length}건의 정산·보관 서류 흐름을 점검해줘.`;
    summary.actionItems = completedWithoutReportRows.slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 완료 거래에서 완료 리포트 초안과 최종 보관 서류 CTA가 보이는지 확인합니다.`,
      label: "완료 리포트 없음"
    }));
  } else if (submittedReportRows.length > 0) {
    summary.actionRequest = `제출됐지만 상대방 확인이 필요한 완료 리포트 ${submittedReportRows.length}건의 확인 CTA와 알림 흐름을 점검해줘.`;
    summary.actionItems = submittedReportRows.slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 완료 리포트의 화주/파트너 확인 상태를 확인합니다.`,
      label: "리포트 확인 대기"
    }));
  } else if (acknowledgedReportRows.length > 0) {
    summary.actionRequest = `확인됐지만 운영 검토가 필요한 완료 리포트 ${acknowledgedReportRows.length}건의 운영 검토 큐를 점검해줘.`;
    summary.actionItems = acknowledgedReportRows.slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 완료 리포트의 운영 검토 필요 상태를 확인합니다.`,
      label: "운영 검토 필요"
    }));
  } else if (readyToLockReportRows.length > 0) {
    summary.actionRequest = `운영 검토 후 잠금 대기 중인 완료 리포트 ${readyToLockReportRows.length}건의 보관 잠금 흐름을 점검해줘.`;
    summary.actionItems = readyToLockReportRows.slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 완료 리포트의 잠금 전 금지 표현과 보관 서류 상태를 확인합니다.`,
      label: "보관 잠금 대기"
    }));
  } else if (lowFeedbackRows.length > 0) {
    summary.actionRequest = `완료 거래 중 낮은 후기 ${lowFeedbackRows.length}건을 기준으로 파트너 품질 비교와 후속 관리 흐름을 점검해줘.`;
    summary.actionItems = lowFeedbackRows.slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 완료 거래의 후기 점수와 파트너 신뢰 표시를 확인합니다.`,
      label: "낮은 후기 확인"
    }));
  } else if (completedWithoutFeedbackRows.length > 0) {
    summary.actionRequest = `완료됐지만 피드백이 없는 요청 ${completedWithoutFeedbackRows.length}건의 후기 요청 흐름을 점검해줘.`;
    summary.actionItems = completedWithoutFeedbackRows.slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 완료 거래에서 후기 제출 CTA가 보이는지 확인합니다.`,
      label: "후기 미제출 확인"
    }));
  } else if (openWithoutMatchRows.length > 0) {
    summary.actionRequest = `공개됐지만 파트너 노출이 0건인 요청 ${openWithoutMatchRows.length}건의 매칭 조건과 파트너 관심 조건을 점검해줘.`;
    summary.actionItems = openWithoutMatchRows.slice(0, 3).map((request) => buildActionItem(request, {
      anchor: "request-matches",
      detail: `${requestTypeLabel(request.request_type)} 요청의 파트너 노출 수와 알림 상태를 확인합니다.`,
      label: "노출 0건 확인"
    }));
  } else if (openWithoutBidRows.length > 0) {
    summary.actionRequest = `공개됐지만 견적이 없는 요청 ${openWithoutBidRows.length}건의 매칭 조건과 파트너 알림 흐름을 점검해줘.`;
    summary.actionItems = openWithoutBidRows.slice(0, 3).map((request) => buildActionItem(request, {
      anchor: "request-bids",
      detail: `${requestTypeLabel(request.request_type)} 요청의 공개 상태와 견적 대기 상태를 확인합니다.`,
      label: "견적 대기 확인"
    }));
  } else if (staleDraftRows.length > 0) {
    summary.actionRequest = `3일 이상 방치된 초안 ${staleDraftRows.length}건의 저장 후 다음 행동 안내를 개선해줘.`;
    summary.actionItems = staleDraftRows.slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 초안의 다음 행동 안내를 확인합니다.`,
      label: "오래된 초안 확인"
    }));
  } else if (staleOpenRows.length > 0) {
    summary.actionRequest = `마감 시간이 지난 공개 요청 ${staleOpenRows.length}건의 만료 처리와 후속 안내를 점검해줘.`;
    summary.actionItems = staleOpenRows.slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 요청의 마감 이후 상태 처리를 확인합니다.`,
      label: "마감 지난 요청 확인"
    }));
  } else {
    summary.actionRequest = summary.inProgress > 0
      ? `진행중 요청 ${summary.inProgress}건의 완료 처리, 리포트, 피드백 흐름을 이어서 설계해줘.`
      : "플랫폼 요청 흐름은 즉시 막힌 항목이 적습니다. 다음 MVP 기능 구현을 이어가줘.";
    summary.actionItems = (inProgressRows.length > 0 ? inProgressRows : input.requests).slice(0, 3).map((request) => buildActionItem(request, {
      detail: `${requestTypeLabel(request.request_type)} 요청의 현재 상세 흐름을 표본으로 확인합니다.`,
      label: "표본 요청 확인"
    }));
  }

  return summary;
}

export async function getPlatformRequestOperationsSummary(
  supabase: SupabaseClient
): Promise<PlatformRequestOperationsSummary> {
  const { data: requests, error: requestsError } = await supabase
    .from("service_requests")
    .select("id,request_type,status,created_at,updated_at,deadline_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (requestsError) {
    if (isMissingMarketplaceSchemaError(requestsError)) return emptySummary(false);
    throw new Error(requestsError.message);
  }

  const requestRows = (requests ?? []) as PlatformRequestOperationsRow[];
  const requestIds = requestRows.map((request) => request.id);

  if (requestIds.length === 0) return emptySummary(true);

  const [bidsResult, questionsResult, feedbacksResult, completionReportsResult, matchesResult] = await Promise.all([
    supabase
      .from("service_bids")
      .select("id,request_id,status")
      .in("request_id", requestIds),
    supabase
      .from("service_request_questions")
      .select("id,request_id,answer")
      .in("request_id", requestIds),
    supabase
      .from("service_request_feedbacks")
      .select("id,request_id,rating,response_speed_score,communication_score,document_quality_score")
      .in("request_id", requestIds),
    supabase
      .from("service_request_completion_reports")
      .select("id,request_id,status")
      .in("request_id", requestIds),
    supabase
      .from("service_request_partner_matches")
      .select("request_id,notification_status")
      .in("request_id", requestIds)
  ]);

  if (bidsResult.error) throw new Error(bidsResult.error.message);
  if (questionsResult.error) throw new Error(questionsResult.error.message);
  if (feedbacksResult.error) throw new Error(feedbacksResult.error.message);
  if (completionReportsResult.error && !isMissingMarketplaceSchemaError(completionReportsResult.error)) {
    throw new Error(completionReportsResult.error.message);
  }
  if (matchesResult.error && !isMissingMarketplaceSchemaError(matchesResult.error)) {
    throw new Error(matchesResult.error.message);
  }

  return summarizePlatformRequestOperations({
    bids: (bidsResult.data ?? []) as PlatformBidOperationsRow[],
    completionReports: completionReportsResult.error ? [] : (completionReportsResult.data ?? []) as PlatformCompletionReportOperationsRow[],
    feedbacks: (feedbacksResult.data ?? []) as PlatformFeedbackOperationsRow[],
    matchSummaries: matchesResult.error
      ? undefined
      : summarizeMatchOperations(requestIds, (matchesResult.data ?? []) as PlatformMatchOperationsRow[]),
    now: new Date(),
    questions: (questionsResult.data ?? []) as PlatformQuestionOperationsRow[],
    requests: requestRows
  });
}

export async function getPlatformRequestOperationsDetail(
  supabase: SupabaseClient,
  requestId: string
): Promise<PlatformRequestOperationsDetail> {
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select(platformRequestOperationsDetailSelects.request)
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    if (isMissingMarketplaceSchemaError(requestError)) {
      return {
        bids: [],
        clearanceDetail: null,
        completionReport: null,
        documents: [],
        feedbackSummary: { averageRating: null, count: 0, lowScoreCount: 0 },
        freightDetail: null,
        matchSummary: null,
        questions: [],
        request: null,
        schemaReady: false
      };
    }

    throw new Error(requestError.message);
  }

  if (!request) {
    return {
      bids: [],
      clearanceDetail: null,
      completionReport: null,
      documents: [],
      feedbackSummary: { averageRating: null, count: 0, lowScoreCount: 0 },
      freightDetail: null,
      matchSummary: null,
      questions: [],
      request: null,
      schemaReady: true
    };
  }

  const requestRow = request as {
    created_at: string;
    deadline_at: string | null;
    destination_country_code: string | null;
    direction: "import" | "export";
    hsk_code: string | null;
    id: string;
    origin_country_code: string | null;
    request_type: PlatformRequestType;
    status: PlatformRequestStatus;
  };

  const [documentsResult, questionsResult, bidsResult, feedbacksResult, matchesResult, freightDetailResult, clearanceDetailResult, completionReportResult] = await Promise.all([
    supabase
      .from("service_request_documents")
      .select(platformRequestOperationsDetailSelects.documents)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false }),
    supabase
      .from("service_request_questions")
      .select(platformRequestOperationsDetailSelects.questions)
      .eq("request_id", requestId)
      .order("created_at", { ascending: true }),
    supabase
      .from("service_bids")
      .select(platformRequestOperationsDetailSelects.bids)
      .eq("request_id", requestId)
      .neq("status", "hidden")
      .order("created_at", { ascending: true }),
    supabase
      .from("service_request_feedbacks")
      .select(platformRequestOperationsDetailSelects.feedbacks)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false }),
    supabase
      .from("service_request_partner_matches")
      .select("request_id,notification_status")
      .eq("request_id", requestId),
    requestRow.request_type === "freight"
      ? supabase
        .from("freight_request_details")
        .select("transport_mode,origin_port,destination_port,gross_weight,cbm")
        .eq("request_id", requestId)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    requestRow.request_type === "clearance"
      ? supabase
        .from("clearance_request_details")
        .select("hs_code_known,fta_preference_requested,requirements_check_needed,urgent,estimated_declaration_count")
        .eq("request_id", requestId)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("service_request_completion_reports")
      .select(platformRequestOperationsDetailSelects.completionReport)
      .eq("request_id", requestId)
      .neq("status", "voided")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  for (const error of [
    documentsResult.error,
    questionsResult.error,
    bidsResult.error,
    feedbacksResult.error,
    matchesResult.error && !isMissingMarketplaceSchemaError(matchesResult.error) ? matchesResult.error : null,
    freightDetailResult.error,
    clearanceDetailResult.error,
    completionReportResult.error && !isMissingMarketplaceSchemaError(completionReportResult.error) ? completionReportResult.error : null
  ]) {
    if (error) throw new Error(error.message);
  }

  const freightDetail = freightDetailResult.data as {
    cbm: number | null;
    destination_port: string | null;
    gross_weight: number | null;
    origin_port: string | null;
    transport_mode: string | null;
  } | null;
  const clearanceDetail = clearanceDetailResult.data as {
    estimated_declaration_count: number | null;
    fta_preference_requested: boolean;
    hs_code_known: boolean;
    requirements_check_needed: boolean;
    urgent: boolean;
  } | null;
  const completionReport = completionReportResult.error ? null : completionReportResult.data as {
    clearance_result: Record<string, unknown>;
    currency: string | null;
    final_amount: number | null;
    freight_result: Record<string, unknown>;
    id: string;
    locked_at: string | null;
    status: string;
    submitted_at: string | null;
    summary: string | null;
    updated_at: string;
  } | null;
  const matchSummary = matchesResult.error
    ? null
    : summarizeMatchOperations([requestId], (matchesResult.data ?? []) as PlatformMatchOperationsRow[]).get(requestId) ?? emptyMatchOperationsSummary();
  const feedbackRows = (feedbacksResult.data ?? []) as Array<{
    communication_score: number | null;
    document_quality_score: number | null;
    id: string;
    rating: number;
    response_speed_score: number | null;
  }>;
  const lowScoreCount = feedbackRows.filter((feedback) =>
    feedback.rating <= 3 ||
    (feedback.response_speed_score !== null && feedback.response_speed_score <= 3) ||
    (feedback.communication_score !== null && feedback.communication_score <= 3) ||
    (feedback.document_quality_score !== null && feedback.document_quality_score <= 3)
  ).length;
  const completionReportDocumentsResult = completionReport
    ? await supabase
      .from("service_request_completion_report_documents")
      .select(platformRequestOperationsDetailSelects.completionReportDocuments)
      .eq("completion_report_id", completionReport.id)
      .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (completionReportDocumentsResult.error && !isMissingMarketplaceSchemaError(completionReportDocumentsResult.error)) {
    throw new Error(completionReportDocumentsResult.error.message);
  }

  return {
    bids: ((bidsResult.data ?? []) as Array<{
      bidder_company_id: string;
      currency: string | null;
      id: string;
      lead_time_days: number | null;
      selected_at: string | null;
      status: string;
      submitted_at: string | null;
    }>).map((bid) => ({
      bidId: bid.id,
      bidderCompanyId: bid.bidder_company_id,
      currency: bid.currency,
      leadTimeDays: bid.lead_time_days,
      message: null,
      selectedAt: bid.selected_at,
      status: bid.status,
      submittedAt: bid.submitted_at,
      totalAmount: null
    })),
    clearanceDetail: clearanceDetail ? {
      estimatedDeclarationCount: clearanceDetail.estimated_declaration_count,
      ftaPreferenceRequested: clearanceDetail.fta_preference_requested,
      hsCodeKnown: clearanceDetail.hs_code_known,
      requirementsCheckNeeded: clearanceDetail.requirements_check_needed,
      urgent: clearanceDetail.urgent
    } : null,
    completionReport: completionReport ? {
      currency: completionReport.currency,
      documentMappings: ((completionReportDocumentsResult.data ?? []) as Array<{
        document_role: string;
        id: string;
        required_for_archive: boolean;
      }>).map((mapping) => ({
        documentRole: mapping.document_role,
        mappingId: mapping.id,
        requiredForArchive: mapping.required_for_archive
      })),
      finalAmountPresent: completionReport.final_amount !== null,
      hasClearanceResult: Object.keys(completionReport.clearance_result ?? {}).length > 0,
      hasFreightResult: Object.keys(completionReport.freight_result ?? {}).length > 0,
      lockedAt: completionReport.locked_at,
      reportId: completionReport.id,
      status: completionReport.status,
      submittedAt: completionReport.submitted_at,
      summaryPresent: Boolean(completionReport.summary),
      updatedAt: completionReport.updated_at
    } : null,
    feedbackSummary: {
      averageRating: feedbackRows.length
        ? Math.round((feedbackRows.reduce((total, feedback) => total + feedback.rating, 0) / feedbackRows.length) * 10) / 10
        : null,
      count: feedbackRows.length,
      lowScoreCount
    },
    documents: ((documentsResult.data ?? []) as Array<{
      created_at: string;
      document_type: string;
      file_size: number | null;
      id: string;
      visibility: string;
    }>).map((document) => ({
      createdAt: document.created_at,
      documentId: document.id,
      documentType: document.document_type,
      fileName: "",
      fileSize: document.file_size,
      visibility: document.visibility
    })),
    freightDetail: freightDetail ? {
      cbm: freightDetail.cbm,
      destinationPort: freightDetail.destination_port,
      grossWeight: freightDetail.gross_weight,
      originPort: freightDetail.origin_port,
      transportMode: freightDetail.transport_mode
    } : null,
    matchSummary,
    questions: ((questionsResult.data ?? []) as Array<{
      answered_at: string | null;
      bidder_company_id: string;
      created_at: string;
      id: string;
    }>).map((question) => ({
      answer: question.answered_at ? "[redacted]" : null,
      answeredAt: question.answered_at,
      bidderCompanyId: question.bidder_company_id,
      createdAt: question.created_at,
      question: "",
      questionId: question.id
    })),
    request: {
      createdAt: requestRow.created_at,
      deadlineAt: requestRow.deadline_at,
      destinationCountryCode: requestRow.destination_country_code,
      direction: requestRow.direction,
      hskCode: requestRow.hsk_code,
      id: requestRow.id,
      originCountryCode: requestRow.origin_country_code,
      productSummary: null,
      requestType: requestRow.request_type,
      status: requestRow.status,
      title: `운영 샘플 요청 ${requestRow.id.slice(0, 8)}`
    },
    schemaReady: true
  };
}
