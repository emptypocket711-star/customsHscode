import { DashboardHome } from "@/features/dashboard/dashboard-home";
import type {
  DashboardMarketplaceActivitySummary,
  DashboardMarketplaceSummary
} from "@/features/dashboard/dashboard-home";
import type { CargoWatchListItem } from "@/features/cargo/cargo-tracking-panel";
import { getRequestLocale, resolveUserLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getSeoulDateString } from "@/lib/utils";
import { listPublishedAppNotices } from "@/server/repositories/app-notice.repository";
import { listUserHsFavorites } from "@/server/repositories/hs-favorite.repository";
import { listUserHsLookupHistory } from "@/server/repositories/hs-lookup-history.repository";
import { listMarketplaceNotificationInbox } from "@/server/repositories/marketplace-notification-deliveries.repository";
import { listOwnServiceRequestFeedbacks } from "@/server/repositories/service-request-feedback.repository";
import { readMarketplaceRoleIntentsFromUserMetadata } from "@/server/repositories/company-marketplace.repository";

async function listDashboardCargoWatches(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<CargoWatchListItem[]> {
  const { data, error } = await supabase
    .from("cargo_watch_requests")
    .select("id,cargo_management_no,master_bl_no,house_bl_no,bl_year,target_status,notify_email,status,last_status,last_checked_at,created_at")
    .in("status", ["active", "checking", "error"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    cargoManagementNo: row.cargo_management_no,
    masterBlNo: row.master_bl_no,
    houseBlNo: row.house_bl_no,
    blYear: row.bl_year,
    targetStatus: row.target_status,
    notifyEmail: row.notify_email,
    status: row.status,
    lastStatus: row.last_status,
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at
  }));
}

async function getDashboardMarketplaceSummary(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<DashboardMarketplaceSummary> {
  const emptySummary = {
    companyName: null,
    companyRole: null,
    roleIntents: [],
    partyTypes: [],
    schemaReady: false,
    trustScore: 0,
    verificationStatus: "unverified"
  } satisfies DashboardMarketplaceSummary;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) return emptySummary;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id,company_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) return emptySummary;

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("name,verification_status,trust_score")
    .eq("id", profile.company_id)
    .maybeSingle();

  if (companyError) {
    const { data: fallbackCompany } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .maybeSingle();

    return {
      ...emptySummary,
      companyName: fallbackCompany?.name ? String(fallbackCompany.name) : null,
      companyRole: profile.company_role ? String(profile.company_role) : null,
      roleIntents: readMarketplaceRoleIntentsFromUserMetadata(user.user_metadata as Record<string, unknown>)
    };
  }

  const { data: partyTypes, error: partyTypeError } = await supabase
    .from("company_party_types")
    .select("party_type")
    .eq("company_id", profile.company_id);

  return {
    companyName: company?.name ? String(company.name) : null,
    companyRole: profile.company_role ? String(profile.company_role) : null,
    roleIntents: readMarketplaceRoleIntentsFromUserMetadata(user.user_metadata as Record<string, unknown>),
    partyTypes: partyTypeError ? [] : (partyTypes ?? []).map((row) => String(row.party_type)),
    schemaReady: !partyTypeError,
    trustScore: Number(company?.trust_score ?? 0),
    verificationStatus: String(company?.verification_status ?? "unverified")
  };
}

async function getDashboardMarketplaceActivitySummary(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<DashboardMarketplaceActivitySummary> {
  const emptySummary = {
    bidsReceived: 0,
    clearancePartnerActionRequestId: null,
    clearancePartnerActionStatus: null,
    clearancePartnerActions: 0,
    clearanceRequesterActionRequestId: null,
    clearanceRequesterActionStatus: null,
    clearanceRequesterActions: 0,
    completionReportPending: 0,
    completedRequests: 0,
    draftRequests: 0,
    feedbackPending: 0,
    freightPartnerActionRequestId: null,
    freightPartnerActionStatus: null,
    freightPartnerActions: 0,
    freightRequesterActionRequestId: null,
    freightRequesterActionStatus: null,
    freightRequesterActions: 0,
    inProgressRequests: 0,
    openRequests: 0,
    partnerOpportunities: 0,
    schemaReady: false,
    selectedRequests: 0
  } satisfies DashboardMarketplaceActivitySummary;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) return emptySummary;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) return emptySummary;

  const [{ data: ownRequests, error: ownRequestsError }, { data: partnerMatches, error: partnerMatchesError }] = await Promise.all([
    supabase
      .from("service_requests")
      .select("id,request_type,status")
      .eq("requester_company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("service_request_partner_matches")
      .select("id,interest_status,service_requests(id,request_type,status)")
      .eq("partner_company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  if (ownRequestsError || partnerMatchesError) return emptySummary;

  const requests = ownRequests ?? [];
  const completedRequestIds = requests
    .filter((request) => request.status === "completed")
    .map((request) => String(request.id));
  const [ownFeedbacks, completionReportsResult] = await Promise.all([
    listOwnServiceRequestFeedbacks(supabase, completedRequestIds).catch(() => new Map()),
    completedRequestIds.length > 0
      ? supabase
        .from("service_request_completion_reports")
        .select("request_id,status")
        .in("request_id", completedRequestIds)
        .neq("status", "voided")
      : Promise.resolve({ data: [], error: null })
  ]);
  const completionReportRequestIds = new Set((completionReportsResult.error ? [] : completionReportsResult.data ?? [])
    .map((row) => String(row.request_id)));
  const lacksCompletionReport = (requestId: string) => completedRequestIds.includes(requestId) && !completionReportRequestIds.has(requestId);
  const needsRequesterAction = (request: { id: unknown; status: string | null }) => {
    if (["draft", "open", "bids_received", "partner_selected", "in_progress"].includes(String(request.status))) return true;
    return request.status === "completed" && (lacksCompletionReport(String(request.id)) || !ownFeedbacks.has(String(request.id)));
  };
  const matches = (partnerMatches ?? []) as Array<{
    service_requests?: { id?: string | null; request_type?: string | null; status?: string | null } | Array<{ id?: string | null; request_type?: string | null; status?: string | null }> | null;
  }>;
  const partnerOpportunities = matches.filter((match) => {
    const request = Array.isArray(match.service_requests) ? match.service_requests[0] : match.service_requests;
    return request?.status === "open" || request?.status === "bids_received";
  }).length;
  const partnerActionRequests = matches
    .map((match) => Array.isArray(match.service_requests) ? match.service_requests[0] : match.service_requests)
    .filter((request) =>
      request?.status === "open" ||
      request?.status === "bids_received" ||
      request?.status === "partner_selected" ||
      request?.status === "in_progress"
    );
  const requesterActionRequests = requests.filter((request) => needsRequesterAction(request));
  const requesterActionPriority = (request: { id: unknown; status: string | null }) => {
    const requestId = String(request.id);
    if (request.status === "completed" && lacksCompletionReport(requestId)) return 100;
    if (request.status === "completed" && !ownFeedbacks.has(requestId)) return 90;
    if (request.status === "bids_received") return 80;
    if (request.status === "partner_selected") return 70;
    if (request.status === "in_progress") return 60;
    if (request.status === "open") return 50;
    if (request.status === "draft") return 40;
    return 0;
  };
  const firstRequesterAction = (requestType: "clearance" | "freight") => {
    const request = requesterActionRequests
      .filter((item) => item.request_type === requestType)
      .sort((a, b) => requesterActionPriority(b) - requesterActionPriority(a))[0];
    return {
      id: request?.id ? String(request.id) : null,
      status: request?.status ? String(request.status) : null
    };
  };
  const firstPartnerAction = (requestType: "clearance" | "freight") => {
    const request = partnerActionRequests.find((item) => item?.request_type === requestType);
    return {
      id: request?.id ? String(request.id) : null,
      status: request?.status ? String(request.status) : null
    };
  };
  const freightRequesterAction = firstRequesterAction("freight");
  const clearanceRequesterAction = firstRequesterAction("clearance");
  const freightPartnerAction = firstPartnerAction("freight");
  const clearancePartnerAction = firstPartnerAction("clearance");

  return {
    bidsReceived: requests.filter((request) => request.status === "bids_received").length,
    clearancePartnerActionRequestId: clearancePartnerAction.id,
    clearancePartnerActionStatus: clearancePartnerAction.status,
    clearancePartnerActions: partnerActionRequests.filter((request) => request?.request_type === "clearance").length,
    clearanceRequesterActionRequestId: clearanceRequesterAction.id,
    clearanceRequesterActionStatus: clearanceRequesterAction.status,
    clearanceRequesterActions: requests.filter((request) => request.request_type === "clearance" && needsRequesterAction(request)).length,
    completionReportPending: completedRequestIds.filter((requestId) => !completionReportRequestIds.has(requestId)).length,
    completedRequests: completedRequestIds.length,
    draftRequests: requests.filter((request) => request.status === "draft").length,
    feedbackPending: completedRequestIds.filter((requestId) => !ownFeedbacks.has(requestId)).length,
    freightPartnerActionRequestId: freightPartnerAction.id,
    freightPartnerActionStatus: freightPartnerAction.status,
    freightPartnerActions: partnerActionRequests.filter((request) => request?.request_type === "freight").length,
    freightRequesterActionRequestId: freightRequesterAction.id,
    freightRequesterActionStatus: freightRequesterAction.status,
    freightRequesterActions: requests.filter((request) => request.request_type === "freight" && needsRequesterAction(request)).length,
    inProgressRequests: requests.filter((request) => request.status === "in_progress").length,
    openRequests: requests.filter((request) => request.status === "open").length,
    partnerOpportunities,
    schemaReady: true,
    selectedRequests: requests.filter((request) => request.status === "partner_selected").length
  };
}

export default async function DashboardPage() {
  const basisDate = getSeoulDateString();
  const requestLocale = await getRequestLocale();
  const supabase = hasSupabaseEnv() ? await createSupabaseServerClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const locale = user?.id ? await resolveUserLocale(user.id) : requestLocale;
  const [cargoWatches, favorites, lookupHistory, notices, marketplaceSummary, marketplaceActivity, marketplaceNotifications] = await Promise.all([
    supabase ? listDashboardCargoWatches(supabase).catch(() => []) : Promise.resolve([]),
    supabase ? listUserHsFavorites(supabase, 5).catch(() => []) : Promise.resolve([]),
    supabase ? listUserHsLookupHistory(supabase, 5).catch(() => []) : Promise.resolve([]),
    supabase ? listPublishedAppNotices(supabase, 5).catch(() => []) : Promise.resolve([]),
    supabase ? getDashboardMarketplaceSummary(supabase).catch(() => null) : Promise.resolve(null),
    supabase ? getDashboardMarketplaceActivitySummary(supabase).catch(() => null) : Promise.resolve(null),
    supabase ? listMarketplaceNotificationInbox(supabase, { limit: 5 }).catch(() => []) : Promise.resolve([])
  ]);

  return (
    <DashboardHome
      basisDate={basisDate}
      cargoWatches={cargoWatches}
      favorites={favorites}
      locale={locale}
      lookupHistory={lookupHistory}
      marketplaceActivity={marketplaceActivity}
      marketplaceNotifications={marketplaceNotifications}
      marketplaceSummary={marketplaceSummary}
      notices={notices}
    />
  );
}
