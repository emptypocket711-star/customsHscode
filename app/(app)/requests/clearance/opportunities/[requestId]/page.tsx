import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { ClearanceOpportunityRow } from "@/features/service-requests/clearance-request-draft-panel";
import { PartnerOpportunityFlowPanel } from "@/features/service-requests/partner-opportunity-flow-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getMatchedClearanceOpportunity,
  listClearanceRequestDocuments,
  listClearanceRequestQuestions
} from "@/server/repositories/clearance-requests.repository";
import {
  listCompletionReportDocumentsForReports,
  listOwnCompletionReportsForRequests,
  serviceRequestCompletionReportDocumentsToRecord,
  serviceRequestCompletionReportListToRecord
} from "@/server/repositories/service-request-completion-report.repository";
import { listOwnServiceRequestFeedbackRecordForRequest } from "@/server/repositories/service-request-feedback.repository";
import { buildPartnerOpportunityNextFocus } from "@/server/repositories/service-request-list-view";

export default async function ClearanceOpportunityDetailPage({
  params
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const supabase = await createSupabaseServerClient();
  const opportunity = await getMatchedClearanceOpportunity(supabase, requestId);

  if (!opportunity.schemaReady) {
    return (
      <div className="grid gap-5">
        <PageHeading
          title="통관 입찰 작업"
          description="로그인은 정상입니다. 현재 이 환경에서는 관세사무소 입찰 데이터가 준비되지 않아 입찰 작업을 불러올 수 없습니다."
        />
      </div>
    );
  }

  if (!opportunity.item) notFound();

  const [requestDocuments, requestQuestions, feedbackByRequestId, completionReports] = await Promise.all([
    listClearanceRequestDocuments(supabase, [opportunity.item.id]),
    listClearanceRequestQuestions(supabase, [opportunity.item.id]),
    listOwnServiceRequestFeedbackRecordForRequest(supabase, opportunity.item),
    listOwnCompletionReportsForRequests(supabase, [opportunity.item.id])
  ]);
  const completionReportsByRequestId = serviceRequestCompletionReportListToRecord(completionReports.items);
  const completionReport = completionReportsByRequestId[opportunity.item.id];
  const completionReportDocuments = completionReport
    ? await listCompletionReportDocumentsForReports(supabase, [completionReport.reportId])
    : { items: [], schemaReady: true };
  const completionReportDocumentsByReportId = serviceRequestCompletionReportDocumentsToRecord(completionReportDocuments.items);
  const unansweredQuestionCount = requestQuestions.items.filter((question) => !question.answer).length;
  const nextFocus = buildPartnerOpportunityNextFocus({
    bidAnchor: "#opportunity-bid",
    questionAnchor: "#opportunity-questions",
    unansweredQuestionCount
  });

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading
          title="통관 입찰 작업"
          description="공개된 통관 조건, 서류, 질문 답변을 확인하고 관세사무소 견적을 제출합니다."
        />
        <Link
          className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href="/requests/clearance"
        >
          목록으로
        </Link>
      </div>
      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-950">다음 작업 바로가기</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">상세 화면에서 조건 확인 후 견적을 제출합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white" href={nextFocus.href}>
            {nextFocus.label}
            <Badge tone={nextFocus.tone}>{nextFocus.value}</Badge>
          </a>
          <a className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="#opportunity-documents">서류</a>
          <a className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="#opportunity-questions">질문</a>
          <a className="focus-ring inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href="#opportunity-bid">견적</a>
        </div>
      </div>
      <PartnerOpportunityFlowPanel kind="clearance" />
      <ClearanceOpportunityRow
        anchorPrefix="opportunity"
        completionReport={completionReport}
        completionReportDocuments={completionReport ? completionReportDocumentsByReportId[completionReport.reportId] ?? [] : []}
        documents={requestDocuments.items}
        feedbackByRequestId={feedbackByRequestId}
        opportunity={opportunity.item}
        questions={requestQuestions.items}
      />
    </div>
  );
}
