export function isSelectedOrLaterStatus(status: string) {
  return status === "partner_selected" || status === "in_progress" || status === "completed";
}

export function countServiceRequestStatuses<TRequest extends { status: string }>(
  requests: TRequest[],
  opportunities: unknown[]
) {
  const inProgress = requests.filter((request) => request.status === "in_progress").length;
  const selected = requests.filter((request) => request.status === "partner_selected").length;

  return {
    all: requests.length,
    bidsReceived: requests.filter((request) => request.status === "bids_received").length,
    completed: requests.filter((request) => request.status === "completed").length,
    drafts: requests.filter((request) => request.status === "draft").length,
    inProgress,
    inProgressOrSelected: inProgress + selected,
    open: requests.filter((request) => request.status === "open").length,
    opportunities: opportunities.length,
    selected
  };
}

export type ServiceRequestStatusFilter = "all" | "draft" | "open" | "bids_received" | "in_progress" | "completed" | "opportunities";

export function serviceRequestStatusFilterLabel(filter: ServiceRequestStatusFilter) {
  if (filter === "draft") return "초안";
  if (filter === "open") return "모집중";
  if (filter === "bids_received") return "견적 도착";
  if (filter === "in_progress") return "진행중";
  if (filter === "completed") return "완료";
  if (filter === "opportunities") return "입찰 가능";
  return "전체";
}

export function serviceRequestStatusFilterOptions(
  counts: ReturnType<typeof countServiceRequestStatuses>,
  workspace: "partner" | "requester"
) {
  if (workspace === "partner") {
    return [
      { count: counts.opportunities, key: "all" as const, label: "전체" },
      { count: counts.opportunities, key: "opportunities" as const, label: serviceRequestStatusFilterLabel("opportunities") }
    ];
  }

  return [
    { count: counts.all, key: "all" as const, label: "전체" },
    { count: counts.drafts, key: "draft" as const, label: serviceRequestStatusFilterLabel("draft") },
    { count: counts.open, key: "open" as const, label: serviceRequestStatusFilterLabel("open") },
    { count: counts.bidsReceived, key: "bids_received" as const, label: serviceRequestStatusFilterLabel("bids_received") },
    { count: counts.inProgressOrSelected, key: "in_progress" as const, label: serviceRequestStatusFilterLabel("in_progress") },
    { count: counts.completed, key: "completed" as const, label: serviceRequestStatusFilterLabel("completed") }
  ];
}

export function filterServiceRequestsByStatus<TRequest extends { status: string }>(
  requests: TRequest[],
  filter: ServiceRequestStatusFilter
) {
  if (filter === "all" || filter === "opportunities") return requests;
  if (filter === "in_progress") {
    return requests.filter((request) => request.status === "partner_selected" || request.status === "in_progress");
  }
  return requests.filter((request) => request.status === filter);
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

export function serviceRequestPartnerInterestStatusLabel(status: string) {
  if (status === "viewed") return "검토중";
  if (status === "interested") return "관심 표시";
  if (status === "declined") return "참여 보류";
  return "미확인";
}

export function serviceRequestPartnerInterestStatusTone(status: string): "neutral" | "warning" | "info" | "success" {
  if (status === "interested") return "success";
  if (status === "declined") return "warning";
  if (status === "viewed") return "info";
  return "neutral";
}
