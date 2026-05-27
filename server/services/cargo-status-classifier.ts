import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomsCargoProgressEvent, CustomsCargoProgressResult } from "@/server/integrations/customs/customs-api";

export type CargoShedInfo = {
  shedCode: string;
  facilityType: string;
  unloadingPlaceBondedAreaYn: string | null;
  shedName: string | null;
};

const targetStatusAliases: Record<string, string[]> = {
  manifest_submitted: ["적하목록제출", "적하목록 제출"],
  "적하목록 제출": ["적하목록제출", "적하목록 제출"],
  arrival_report: ["입항보고", "입항보고 수리", "입항보고수리"],
  "입항보고": ["입항보고", "입항보고 수리", "입항보고수리"],
  unloading_accepted: ["하선신고 수리", "하선신고수리"],
  "하선신고 수리": ["하선신고 수리", "하선신고수리"],
  cy_inbound: ["CY 반입신고", "CY 반입완료"],
  "CY 반입": ["CY 반입신고", "CY 반입완료"],
  "CY 반입신고": ["CY 반입신고"],
  "CY 반입완료": ["CY 반입완료"],
  cfs_inbound: ["CFS 반입신고", "CFS 반입완료"],
  "CFS 반입": ["CFS 반입신고", "CFS 반입완료"],
  "CFS 반입신고": ["CFS 반입신고"],
  "CFS 반입완료": ["CFS 반입완료"],
  inbound: ["반입신고", "반입완료"],
  "반입": ["반입신고", "반입완료"],
  "반입신고": ["반입신고"],
  "반입완료": ["반입완료"],
  import_declaration: ["수입신고"],
  "수입신고": ["수입신고"],
  import_accepted: ["수입신고수리", "수입신고 수리"],
  "수입신고수리": ["수입신고수리", "수입신고 수리"],
  released: ["반출완료", "반출신고"],
  "반출": ["반출완료", "반출신고"],
  "반출완료": ["반출완료", "반출신고"]
};

function normalizeStatusText(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function seoulDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export async function loadCargoShedInfoByCode(
  supabase: SupabaseClient,
  events: CustomsCargoProgressEvent[],
  basisDate = seoulDateString()
): Promise<Map<string, CargoShedInfo>> {
  const shedCodes = Array.from(new Set(events.map((event) => event.shedCode.trim()).filter(Boolean)));
  if (!shedCodes.length) return new Map();

  const { data, error } = await supabase
    .from("customs_shed_info")
    .select("shed_code,shed_name,facility_type,unloading_place_bonded_area_yn")
    .in("shed_code", shedCodes)
    .eq("status", "published")
    .lte("effective_from", basisDate)
    .or(`effective_to.is.null,effective_to.gte.${basisDate}`);

  if (error) {
    console.error("[cargo_shed_info_lookup_failure]", { message: error.message });
    return new Map();
  }

  return new Map((data ?? []).map((row) => [
    String(row.shed_code),
    {
      shedCode: String(row.shed_code),
      facilityType: String(row.facility_type || "unknown"),
      unloadingPlaceBondedAreaYn: typeof row.unloading_place_bonded_area_yn === "string" ? row.unloading_place_bonded_area_yn : null,
      shedName: typeof row.shed_name === "string" ? row.shed_name : null
    }
  ]));
}

export function classifyCargoEventStatus(
  event: Pick<CustomsCargoProgressEvent, "status" | "statusCode" | "shedCode" | "shedName" | "location">,
  shedInfo?: CargoShedInfo
) {
  const rawStatus = event.status || event.statusCode || "";
  if (!rawStatus.includes("반입")) {
    return {
      displayStatus: rawStatus,
      candidates: [rawStatus].filter(Boolean)
    };
  }

  const flag = shedInfo?.unloadingPlaceBondedAreaYn?.toUpperCase();
  const facilityType = flag === "Y" ? "cy" : flag === "N" ? "cfs" : shedInfo?.facilityType;
  const label = facilityType === "cy" ? "CY" : facilityType === "cfs" ? "CFS" : "";
  if (!label) {
    return {
      displayStatus: rawStatus,
      candidates: [rawStatus].filter(Boolean)
    };
  }

  const displayStatus = rawStatus.startsWith(`${label} `) ? rawStatus : `${label} ${rawStatus}`;
  return {
    displayStatus,
    candidates: Array.from(new Set([displayStatus, rawStatus].filter(Boolean)))
  };
}

function eventTimeMs(event: Pick<CustomsCargoProgressEvent, "eventTime">) {
  const normalized = (event.eventTime ?? "")
    .replace(/\./g, "-")
    .replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
    .trim();
  const time = Date.parse(normalized);
  return Number.isNaN(time) ? 0 : time;
}

function latestCargoEvent(events: CustomsCargoProgressEvent[]) {
  return events.reduce<CustomsCargoProgressEvent | null>((latest, event) => {
    if (!latest) return event;
    return eventTimeMs(event) >= eventTimeMs(latest) ? event : latest;
  }, null);
}

export function buildCargoStatusCandidates(
  result: CustomsCargoProgressResult,
  shedInfoByCode: Map<string, CargoShedInfo>
) {
  const latestEvent = latestCargoEvent(result.events);
  const latestClassified = latestEvent
    ? classifyCargoEventStatus(latestEvent, shedInfoByCode.get(latestEvent.shedCode))
    : null;
  const currentStatus = latestClassified?.displayStatus || result.summary.progressStatus || latestEvent?.status || "";
  const eventStatuses = result.events.flatMap((event) => {
    const classified = classifyCargoEventStatus(event, shedInfoByCode.get(event.shedCode));
    return classified.candidates;
  });

  return {
    currentStatus,
    eventStatuses,
    displayCurrentStatus: latestClassified?.displayStatus || classifyCargoEventStatus(latestEvent ?? {
      status: currentStatus,
      statusCode: "",
      shedCode: "",
      shedName: "",
      location: ""
    }, latestEvent ? shedInfoByCode.get(latestEvent.shedCode) : undefined).displayStatus || currentStatus
  };
}

export function enrichCargoProgressResultWithShedInfo(
  result: CustomsCargoProgressResult,
  shedInfoByCode: Map<string, CargoShedInfo>
): CustomsCargoProgressResult {
  return {
    ...result,
    events: result.events.map((event) => ({
      ...event,
      displayStatus: classifyCargoEventStatus(event, shedInfoByCode.get(event.shedCode)).displayStatus || event.status
    }))
  };
}

export function statusMatched(input: { targetStatus: string; currentStatus: string; eventStatuses: string[] }) {
  const target = input.targetStatus.trim();
  if (!target) return false;

  const targetAliases = targetStatusAliases[target] ?? [target];
  const normalizedTargets = targetAliases
    .map(normalizeStatusText)
    .filter(Boolean);
  const candidates = [input.currentStatus, ...input.eventStatuses]
    .map(normalizeStatusText)
    .filter(Boolean);

  return candidates.some((value) => normalizedTargets.includes(value));
}
