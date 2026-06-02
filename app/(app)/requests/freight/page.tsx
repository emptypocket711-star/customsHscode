import { FreightRequestDraftPanel } from "@/features/service-requests/freight-request-draft-panel";
import { RequestStartFlowPanel } from "@/features/service-requests/request-start-flow-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listFreightRequestQuestions,
  listFreightRequestDocuments,
  listReceivedFreightBids,
  listMatchedFreightOpportunities,
  listOwnFreightRequests
} from "@/server/repositories/freight-requests.repository";
import { listOwnServiceRequestFeedbacks } from "@/server/repositories/service-request-feedback.repository";
import {
  completedServiceRequestIds,
  groupServiceRequestItemsByRequestId,
  serviceRequestFeedbackMapToRecord,
  uniqueServiceRequestIds
} from "@/server/repositories/service-request-list-view";

export default async function FreightRequestsPage() {
  const supabase = await createSupabaseServerClient();
  const [freightRequests, freightOpportunities] = await Promise.all([
    listOwnFreightRequests(supabase),
    listMatchedFreightOpportunities(supabase)
  ]);
  const ownRequestIds = freightRequests.items.map((request) => request.id);
  const visibleRequestIds = uniqueServiceRequestIds(freightRequests.items, freightOpportunities.items);
  const completedRequestIds = completedServiceRequestIds(freightRequests.items, freightOpportunities.items);
  const [receivedBids, requestDocuments, requestQuestions, feedbackByRequestIdMap] = await Promise.all([
    listReceivedFreightBids(supabase, ownRequestIds),
    listFreightRequestDocuments(supabase, visibleRequestIds),
    listFreightRequestQuestions(supabase, visibleRequestIds),
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
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">운송 견적 요청</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          화물이 준비되기 전에도 기본 조건을 초안으로 저장하고, 다음 단계에서 서류 첨부와 포워더 모집으로 이어갑니다.
        </p>
      </div>
      <RequestStartFlowPanel kind="freight" />
      <FreightRequestDraftPanel
        bidsByRequestId={bidsByRequestId}
        documentsByRequestId={documentsByRequestId}
        feedbackByRequestId={feedbackByRequestId}
        opportunities={freightOpportunities.items}
        questionsByRequestId={questionsByRequestId}
        requests={freightRequests.items}
        schemaReady={freightRequests.schemaReady && freightOpportunities.schemaReady && receivedBids.schemaReady && requestDocuments.schemaReady && requestQuestions.schemaReady}
      />
    </div>
  );
}
