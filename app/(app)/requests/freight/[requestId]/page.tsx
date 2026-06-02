import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { FreightRequestRow } from "@/features/service-requests/freight-request-draft-panel";
import { RequesterDetailFlowPanel } from "@/features/service-requests/requester-detail-flow-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getOwnFreightRequest,
  listFreightRequestDocuments,
  listFreightRequestQuestions,
  listReceivedFreightBids
} from "@/server/repositories/freight-requests.repository";
import {
  listCompletionReportDocumentsForReports,
  listOwnCompletionReportsForRequests,
  serviceRequestCompletionReportDocumentsToRecord,
  serviceRequestCompletionReportListToRecord
} from "@/server/repositories/service-request-completion-report.repository";
import { listOwnServiceRequestFeedbackRecordForRequest } from "@/server/repositories/service-request-feedback.repository";
import { buildRequesterServiceRequestNextFocus } from "@/server/repositories/service-request-list-view";

export default async function FreightRequestDetailPage({
  params
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const supabase = await createSupabaseServerClient();
  const request = await getOwnFreightRequest(supabase, requestId);

  if (!request.schemaReady) {
    return (
      <div className="grid gap-5">
        <PageHeading
          title="운송 견적 요청 상세"
          description="로그인은 정상입니다. 현재 이 환경에서는 플랫폼 요청 상세 데이터가 준비되지 않아 운송 요청 상세 작업을 불러올 수 없습니다."
        />
      </div>
    );
  }

  if (!request.item) notFound();

  const [receivedBids, requestDocuments, requestQuestions, feedbackByRequestId, completionReports] = await Promise.all([
    listReceivedFreightBids(supabase, [request.item.id]),
    listFreightRequestDocuments(supabase, [request.item.id]),
    listFreightRequestQuestions(supabase, [request.item.id]),
    listOwnServiceRequestFeedbackRecordForRequest(supabase, request.item),
    listOwnCompletionReportsForRequests(supabase, [request.item.id])
  ]);
  const completionReportsByRequestId = serviceRequestCompletionReportListToRecord(completionReports.items);
  const completionReport = completionReportsByRequestId[request.item.id];
  const completionReportDocuments = completionReport
    ? await listCompletionReportDocumentsForReports(supabase, [completionReport.reportId])
    : { items: [], schemaReady: true };
  const completionReportDocumentsByReportId = serviceRequestCompletionReportDocumentsToRecord(completionReportDocuments.items);
  const unansweredQuestionCount = requestQuestions.items.filter((question) => !question.answer).length;
  const nextFocus = buildRequesterServiceRequestNextFocus({
    bidCount: receivedBids.items.length,
    documentCount: requestDocuments.items.length,
    publishAnchor: "#request-publish",
    questionAnchor: "#request-questions",
    requestStatus: request.item.status,
    unansweredQuestionCount
  });

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading
          title="운송 견적 요청 상세"
          description="이 요청의 서류, 질문, 견적 비교, 포워더 선정 작업을 한 화면에서 처리합니다."
        />
        <Link
          className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href="/requests/freight"
        >
          목록으로
        </Link>
      </div>
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-950">다음 작업 바로가기</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">상세 화면에서 처리할 위치로 바로 이동합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white" href={nextFocus.href}>
            {nextFocus.label}
            <Badge tone={nextFocus.tone}>{nextFocus.value}</Badge>
          </a>
          <a className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="#request-documents">서류</a>
          <a className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="#request-questions">질문</a>
          <a className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="#request-bids">견적</a>
          {request.item.status === "draft" ? (
            <a className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="#request-publish">공개</a>
          ) : null}
        </div>
      </div>
      <RequesterDetailFlowPanel kind="freight" />
      <FreightRequestRow
        anchorPrefix="request"
        bids={receivedBids.items}
        completionReport={completionReport}
        completionReportDocuments={completionReport ? completionReportDocumentsByReportId[completionReport.reportId] ?? [] : []}
        documents={requestDocuments.items}
        feedbackByRequestId={feedbackByRequestId}
        questions={requestQuestions.items}
        request={request.item}
      />
    </div>
  );
}
