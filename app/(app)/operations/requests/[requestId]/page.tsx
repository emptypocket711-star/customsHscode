import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyOperationsRequestButton } from "@/features/operations/copy-operations-request-button";
import { completionReportDocumentRoleLabel } from "@/features/service-requests/service-request-completion-report-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireDeveloperRole } from "@/server/auth/role-guard";
import {
  buildPlatformRequestImprovementPrompt,
  getPlatformRequestOperationsDetail
} from "@/server/repositories/platform-operations.repository";

function requestTypeLabel(value: string) {
  return value === "freight" ? "운송" : "통관";
}

function directionLabel(value: string) {
  return value === "export" ? "수출" : "수입";
}

function statusTone(status: string): "neutral" | "warning" | "info" | "success" {
  if (status === "draft") return "neutral";
  if (status === "open" || status === "bids_received") return "warning";
  if (status === "partner_selected" || status === "in_progress" || status === "completed") return "success";
  return "neutral";
}

function completionReportStatusLabel(status: string) {
  if (status === "draft") return "초안";
  if (status === "submitted") return "확인 대기";
  if (status === "requester_acknowledged") return "화주 확인";
  if (status === "partner_acknowledged") return "파트너 확인";
  if (status === "operator_reviewed") return "운영 검토";
  if (status === "locked") return "잠금 완료";
  return status;
}

function completionReportTone(status: string): "neutral" | "warning" | "info" | "success" {
  if (status === "locked") return "success";
  if (status === "submitted" || status === "requester_acknowledged" || status === "partner_acknowledged") return "warning";
  if (status === "operator_reviewed") return "info";
  return "neutral";
}

function improvementPromptTarget(category: string) {
  if (category === "question_response") {
    return {
      href: "#request-questions",
      label: "질문·답변 상태 확인"
    };
  }

  if (category === "bid_conversion" || category === "deadline_followup") {
    return {
      href: "#request-bids",
      label: "견적 상태 확인"
    };
  }

  if (category === "document_guidance") {
    return {
      href: "#request-documents",
      label: "서류 메타데이터 확인"
    };
  }

  if (category === "lifecycle_followup") {
    return {
      href: "#completion-report-summary",
      label: "완료 리포트 확인"
    };
  }

  return {
    href: "#operations-safe-summary",
    label: "운영 요약 확인"
  };
}

export default async function OperationsRequestDetailPage({
  params
}: {
  params: Promise<{ requestId: string }>;
}) {
  const guard = await requireDeveloperRole();

  if (!guard.allowed) {
    return <AccessDenied message={guard.message} />;
  }

  const { requestId } = await params;
  const supabase = await createSupabaseServerClient();
  const detail = await getPlatformRequestOperationsDetail(supabase, requestId);

  if (!detail.schemaReady) {
    return (
      <div className="grid gap-5">
        <PageHeading
          title="플랫폼 요청 운영 상세"
          description="현재 이 환경에서는 플랫폼 요청 운영 상세 데이터가 준비되지 않아 상세 검토 화면을 불러올 수 없습니다."
        />
      </div>
    );
  }

  if (!detail.request) notFound();

  const request = detail.request;
  const improvementPrompt = buildPlatformRequestImprovementPrompt(detail);
  const improvementTarget = improvementPrompt ? improvementPromptTarget(improvementPrompt.category) : null;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading
          title="플랫폼 요청 운영 상세"
          description="developer 전용 읽기 화면입니다. 고객 원문 서류 다운로드나 상태 변경은 이 화면에서 처리하지 않습니다."
        />
        <Link
          className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href="/operations/users#platform-request-operations"
        >
          운영 통계로
        </Link>
      </div>

      <Card id="operations-safe-summary">
        <CardHeader
          action={<Badge tone={statusTone(request.status)}>{request.status}</Badge>}
          description={`${requestTypeLabel(request.requestType)} / ${directionLabel(request.direction)} / 생성 ${request.createdAt.slice(0, 10)}`}
          title={`운영 샘플 요청 ${request.id.slice(0, 8)}`}
        />
        <CardBody className="grid gap-4">
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            이 상세 화면은 개선 판단용 요약만 표시합니다. 요청 제목, 품목 설명, 서류 파일명, 질문·답변 원문, 견적 금액과 메시지는 노출하지 않습니다.
          </p>
          <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600 md:grid-cols-3">
            <span>요청 ID <span className="font-mono text-slate-900">{request.id}</span></span>
            <span>출발 {request.originCountryCode ?? "-"}</span>
            <span>도착 {request.destinationCountryCode ?? "-"}</span>
            <span>HSK {request.hskCode ?? "-"}</span>
            <span>마감 {request.deadlineAt ? request.deadlineAt.slice(0, 16).replace("T", " ") : "-"}</span>
            <span>상태 {request.status}</span>
          </div>
          {detail.freightDetail ? (
            <div className="grid gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-600 md:grid-cols-4">
              <span>운송 방식 {detail.freightDetail.transportMode ?? "-"}</span>
              <span>출발항 {detail.freightDetail.originPort ?? "-"}</span>
              <span>도착항 {detail.freightDetail.destinationPort ?? "-"}</span>
              <span>중량 {detail.freightDetail.grossWeight ?? "-"} KG / CBM {detail.freightDetail.cbm ?? "-"}</span>
            </div>
          ) : null}
          {detail.clearanceDetail ? (
            <div className="grid gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-600 md:grid-cols-3">
              <span>HS 입력 {detail.clearanceDetail.hsCodeKnown ? "있음" : "없음"}</span>
              <span>FTA 희망 {detail.clearanceDetail.ftaPreferenceRequested ? "있음" : "없음"}</span>
              <span>요건 확인 {detail.clearanceDetail.requirementsCheckNeeded ? "필요" : "미요청"}</span>
              <span>긴급 {detail.clearanceDetail.urgent ? "예" : "아니오"}</span>
              <span>예상 신고 {detail.clearanceDetail.estimatedDeclarationCount ?? "-"}건</span>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {improvementPrompt ? (
        <Card>
          <CardHeader
            action={<Badge tone="info">{improvementPrompt.category}</Badge>}
            description="민감 서류명이나 원문 내용 없이 상태와 건수만 담은 개선 요청 문구입니다."
            title={improvementPrompt.label}
          />
          <CardBody className="grid gap-3">
            <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700 md:grid-cols-3">
              <span>1. {improvementTarget?.label ?? "운영 요약 확인"}</span>
              <span>2. 요청 문장 복사</span>
              <span>3. 개발 작업으로 전달</span>
            </div>
            <div className="grid gap-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950 md:grid-cols-[1fr_auto_auto] md:items-center">
              <p>
                이 요청은 복사해서 개발 작업으로 넘기고, 먼저 <span className="font-semibold">{improvementTarget?.label}</span>에서 상태와 건수를 확인합니다.
              </p>
              {improvementTarget ? (
                <a
                  className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                  href={improvementTarget.href}
                >
                  {improvementTarget.label}
                </a>
              ) : null}
              <CopyOperationsRequestButton text={improvementPrompt.prompt} />
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
              {improvementPrompt.prompt}
            </pre>
            <p className="text-xs leading-5 text-slate-500">
              이 문구는 운영 개선 요청용입니다. 원문 서류, 파일명, 단가 원문, 개인정보는 포함하지 않습니다.
            </p>
          </CardBody>
        </Card>
      ) : null}

      <Card id="completion-report-summary">
        <CardHeader
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              {detail.completionReport ? (
                <Link
                  className="focus-ring inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  href={`/requests/${request.requestType}/${request.id}/completion-report/preview`}
                >
                  미리보기
                </Link>
              ) : null}
              <Badge tone={detail.completionReport ? completionReportTone(detail.completionReport.status) : "neutral"}>
                {detail.completionReport ? completionReportStatusLabel(detail.completionReport.status) : "없음"}
              </Badge>
            </div>
          }
          description="신고번호, 파일명, 정산 원문은 표시하지 않고 상태와 보관 서류 연결 여부만 확인합니다."
          title="완료 리포트 운영 요약"
        />
        <CardBody className="grid gap-3">
          {detail.completionReport ? (
            <>
              <p className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950">
                미리보기는 완료 리포트 전용 preview 모델을 사용합니다. 운영 상세와 동일하게 파일명, 질문·답변 원문, 견적 메시지 원문은 표시하지 않습니다.
              </p>
              <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600 md:grid-cols-4">
                <span>리포트 ID <span className="font-mono text-slate-900">{detail.completionReport.reportId.slice(0, 8)}</span></span>
                <span>상태 {completionReportStatusLabel(detail.completionReport.status)}</span>
                <span>제출 {detail.completionReport.submittedAt ? detail.completionReport.submittedAt.slice(0, 10) : "-"}</span>
                <span>잠금 {detail.completionReport.lockedAt ? detail.completionReport.lockedAt.slice(0, 10) : "-"}</span>
                <span>요약 {detail.completionReport.summaryPresent ? "있음" : "없음"}</span>
                <span>금액 {detail.completionReport.finalAmountPresent ? `있음(${detail.completionReport.currency ?? "-"})` : "없음"}</span>
                <span>운송 결과 {detail.completionReport.hasFreightResult ? "있음" : "없음"}</span>
                <span>통관 결과 {detail.completionReport.hasClearanceResult ? "있음" : "없음"}</span>
              </div>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">최종 보관 서류 매핑</p>
                  <Badge tone={detail.completionReport.documentMappings.length > 0 ? "info" : "neutral"}>{detail.completionReport.documentMappings.length}건</Badge>
                </div>
                {detail.completionReport.documentMappings.length ? detail.completionReport.documentMappings.map((mapping) => (
                  <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600" key={mapping.mappingId}>
                    <span className="font-semibold text-slate-950">
                      {completionReportDocumentRoleLabel(request.requestType, mapping.documentRole)}
                    </span>
                    {" / "}
                    {mapping.requiredForArchive ? "필수 보관 서류" : "보관 서류"}
                  </p>
                )) : (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                    완료 리포트는 있으나 최종 보관 서류 매핑이 없습니다. 사용자 상세의 완료 리포트 보관 서류 연결 흐름을 확인해야 합니다.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              완료 리포트가 없습니다. 완료 거래라면 정산 요약과 최종 보관 서류 연결 CTA가 사용자 상세에 표시되는지 확인해야 합니다.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          action={<Badge tone={detail.feedbackSummary.lowScoreCount > 0 ? "warning" : detail.feedbackSummary.count > 0 ? "success" : "neutral"}>{detail.feedbackSummary.count}건</Badge>}
          description="피드백 코멘트 원문은 표시하지 않고 점수 집계만 확인합니다."
          title="완료 후 피드백 운영 요약"
        />
        <CardBody className="grid gap-3">
          {detail.feedbackSummary.count > 0 ? (
            <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600 md:grid-cols-3">
              <span>피드백 수 {detail.feedbackSummary.count}건</span>
              <span>평균 평점 {detail.feedbackSummary.averageRating ?? "-"}점</span>
              <span>낮은 점수 {detail.feedbackSummary.lowScoreCount}건</span>
            </div>
          ) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              완료된 거래라면 피드백 제출 CTA가 사용자 상세에 표시되는지 확인해야 합니다. 피드백이 없으면 파트너 신뢰 지표와 추천 품질 데이터가 쌓이지 않습니다.
            </p>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div id="request-documents" className="scroll-mt-6">
        <Card>
          <CardHeader action={<Badge tone="neutral">{detail.documents.length}건</Badge>} description="파일명은 표시하지 않습니다." title="서류 메타데이터" />
          <CardBody className="grid gap-2">
            {detail.documents.length ? detail.documents.map((document) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600" key={document.documentId}>
                <p className="font-semibold text-slate-950">{document.documentType}</p>
                <p>{document.visibility} / {document.fileSize ? `${document.fileSize.toLocaleString("ko-KR")} bytes` : "-"} / 등록 {document.createdAt.slice(0, 10)}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-600">첨부 서류 메타데이터가 없습니다.</p>
            )}
          </CardBody>
        </Card>
        </div>

        <div id="request-questions" className="scroll-mt-6">
        <Card>
          <CardHeader action={<Badge tone={detail.questions.some((question) => !question.answer) ? "warning" : "neutral"}>{detail.questions.length}건</Badge>} description="질문과 답변 원문은 표시하지 않습니다." title="질문·답변 상태" />
          <CardBody className="grid gap-2">
            {detail.questions.length ? detail.questions.map((question) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600" key={question.questionId}>
                <p className="font-semibold text-slate-950">{question.answer ? "답변 완료" : "답변 대기 중"}</p>
                <p>등록 {question.createdAt.slice(0, 10)} / 답변 {question.answeredAt ? question.answeredAt.slice(0, 10) : "-"}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-600">질문이 없습니다.</p>
            )}
          </CardBody>
        </Card>
        </div>

        <div id="request-bids" className="scroll-mt-6">
        <Card>
          <CardHeader action={<Badge tone={detail.bids.length > 0 ? "info" : "neutral"}>{detail.bids.length}건</Badge>} description="견적 금액과 메시지 원문은 표시하지 않습니다." title="견적 상태" />
          <CardBody className="grid gap-2">
            {detail.bids.length ? detail.bids.map((bid) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600" key={bid.bidId}>
                <p className="font-semibold text-slate-950">상태 {bid.status}</p>
                <p>통화 {bid.currency ?? "-"} / 리드타임 {bid.leadTimeDays ?? "-"}일 / 제출 {bid.submittedAt ? bid.submittedAt.slice(0, 10) : "-"}</p>
                <p>선정 {bid.selectedAt ? bid.selectedAt.slice(0, 10) : "-"}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-600">제출된 견적이 없습니다.</p>
            )}
          </CardBody>
        </Card>
        </div>
      </div>
    </div>
  );
}
