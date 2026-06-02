"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { partnerMatchInterestInitialState } from "@/features/service-requests/partner-opportunity-interest-action-state";
import {
  declineServiceRequestPartnerMatchAction,
  reviewAgainServiceRequestPartnerMatchAction
} from "@/server/actions/service-request-partner-match.actions";

function canDeclineOpportunity(status: string) {
  return status === "open" || status === "bids_received";
}

export function PartnerOpportunityInterestActions({
  interestStatus,
  matchId,
  requestId,
  requestStatus,
  requestType
}: {
  interestStatus: string;
  matchId: string;
  requestId: string;
  requestStatus: string;
  requestType: "clearance" | "freight";
}) {
  const router = useRouter();
  const [declineState, declineAction, declinePending] = useActionState(
    declineServiceRequestPartnerMatchAction,
    partnerMatchInterestInitialState
  );
  const [reviewState, reviewAction, reviewPending] = useActionState(
    reviewAgainServiceRequestPartnerMatchAction,
    partnerMatchInterestInitialState
  );
  const declineAvailable = canDeclineOpportunity(requestStatus) && interestStatus !== "declined";
  const reviewAgainAvailable = canDeclineOpportunity(requestStatus) && interestStatus === "declined";
  const state = reviewState.status !== "idle" ? reviewState : declineState;
  const pending = declinePending || reviewPending;

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="text-sm font-semibold text-slate-950">참여 상태</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          참여가 어렵다면 보류 상태로 저장해 후속 리마인드와 운영 지표에서 구분합니다.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={interestStatus === "declined" ? "warning" : interestStatus === "interested" ? "success" : "info"}>
          {interestStatus === "declined" ? "참여 보류" : interestStatus === "interested" ? "관심 표시" : interestStatus === "viewed" ? "검토중" : "미확인"}
        </Badge>
        {declineAvailable ? (
          <form action={declineAction}>
            <input name="matchId" type="hidden" value={matchId} />
            <input name="requestId" type="hidden" value={requestId} />
            <input name="requestType" type="hidden" value={requestType} />
            <button
              className="focus-ring inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "저장 중" : "참여 보류"}
            </button>
          </form>
        ) : null}
        {reviewAgainAvailable ? (
          <form action={reviewAction}>
            <input name="matchId" type="hidden" value={matchId} />
            <input name="requestId" type="hidden" value={requestId} />
            <input name="requestType" type="hidden" value={requestType} />
            <button
              className="focus-ring inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "저장 중" : "다시 검토"}
            </button>
          </form>
        ) : null}
      </div>
      {state.message ? (
        <p className={state.status === "error" ? "text-xs font-semibold text-red-700" : "text-xs font-semibold text-emerald-700"}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
