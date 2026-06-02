export function isSelectedOrLaterStatus(status: string) {
  return status === "partner_selected" || status === "in_progress" || status === "completed";
}

export function countServiceRequestStatuses<TRequest extends { status: string }>(
  requests: TRequest[],
  opportunities: unknown[]
) {
  return {
    bidsReceived: requests.filter((request) => request.status === "bids_received").length,
    drafts: requests.filter((request) => request.status === "draft").length,
    inProgress: requests.filter((request) => request.status === "in_progress").length,
    open: requests.filter((request) => request.status === "open").length,
    opportunities: opportunities.length,
    selected: requests.filter((request) => request.status === "partner_selected").length
  };
}
