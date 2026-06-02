import { ClearanceRequestDraftPanel } from "@/features/service-requests/clearance-request-draft-panel";
import { RequestStartFlowPanel } from "@/features/service-requests/request-start-flow-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listClearanceRequestDocuments,
  listClearanceRequestQuestions,
  listMatchedClearanceOpportunities,
  listOwnClearanceRequests,
  listReceivedClearanceBids
} from "@/server/repositories/clearance-requests.repository";
import { listOwnServiceRequestFeedbacks } from "@/server/repositories/service-request-feedback.repository";
import {
  completedServiceRequestIds,
  groupServiceRequestItemsByRequestId,
  serviceRequestFeedbackMapToRecord,
  uniqueServiceRequestIds
} from "@/server/repositories/service-request-list-view";

export default async function ClearanceRequestsPage({
  searchParams
}: {
  searchParams?: Promise<{ workspace?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const isPartnerWorkspace = params.workspace === "broker";
  const supabase = await createSupabaseServerClient();
  const [clearanceRequests, clearanceOpportunities] = await Promise.all([
    listOwnClearanceRequests(supabase),
    listMatchedClearanceOpportunities(supabase)
  ]);
  const documentRequestIds = uniqueServiceRequestIds(clearanceRequests.items, clearanceOpportunities.items);
  const completedRequestIds = completedServiceRequestIds(clearanceRequests.items, clearanceOpportunities.items);
  const [requestDocuments, requestQuestions, receivedBids, feedbackByRequestIdMap] = await Promise.all([
    listClearanceRequestDocuments(supabase, documentRequestIds),
    listClearanceRequestQuestions(supabase, documentRequestIds),
    listReceivedClearanceBids(supabase, clearanceRequests.items.map((request) => request.id)),
    listOwnServiceRequestFeedbacks(supabase, completedRequestIds)
  ]);
  const bidsByRequestId = groupServiceRequestItemsByRequestId(receivedBids.items);
  const documentsByRequestId = groupServiceRequestItemsByRequestId(requestDocuments.items);
  const questionsByRequestId = groupServiceRequestItemsByRequestId(requestQuestions.items);
  const feedbackByRequestId = serviceRequestFeedbackMapToRecord(feedbackByRequestIdMap);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-blue-700">요청 관리</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">통관 의뢰 요청</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          수입·수출 통관에 필요한 HS CODE 여부, FTA 희망, 요건 확인 필요 여부를 정리하고 관세사무소 견적 요청으로 이어갑니다.
        </p>
      </div>
      {isPartnerWorkspace ? null : <RequestStartFlowPanel kind="clearance" />}
      <ClearanceRequestDraftPanel
        bidsByRequestId={bidsByRequestId}
        documentsByRequestId={documentsByRequestId}
        feedbackByRequestId={feedbackByRequestId}
        opportunities={clearanceOpportunities.items}
        questionsByRequestId={questionsByRequestId}
        requests={clearanceRequests.items}
        schemaReady={clearanceRequests.schemaReady && clearanceOpportunities.schemaReady && requestDocuments.schemaReady && requestQuestions.schemaReady && receivedBids.schemaReady}
      />
    </div>
  );
}
