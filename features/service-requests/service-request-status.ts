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

export function serviceRequestDocumentTypeLabel(type: string) {
  if (type === "commercial_invoice") return "Commercial Invoice";
  if (type === "packing_list") return "Packing List";
  if (type === "bill_of_lading") return "B/L";
  if (type === "air_waybill") return "AWB";
  if (type === "certificate_of_origin") return "C/O";
  if (type === "catalog") return "카탈로그";
  if (type === "spec_sheet") return "사양서";
  return type;
}

export function serviceRequestBidStatusLabel(status: string) {
  if (status === "submitted") return "제출";
  if (status === "shortlisted") return "검토중";
  if (status === "selected") return "선정";
  if (status === "rejected") return "미선정";
  if (status === "withdrawn") return "철회";
  if (status === "expired") return "만료";
  return status;
}

export function serviceRequestBidStatusTone(status: string): "neutral" | "warning" | "info" | "success" {
  if (status === "selected") return "success";
  if (status === "submitted") return "info";
  if (status === "shortlisted") return "warning";
  return "neutral";
}
