import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomsCargoProgressEvent, CustomsCargoProgressResult } from "@/server/integrations/customs/customs-api";

export type CargoShedInfo = {
  shedCode: string;
  facilityType: string;
  unloadingPlaceBondedAreaYn: string | null;
  shedName: string | null;
};

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
    candidates: Array.from(new Set([displayStatus, `${label} 반입`, rawStatus].filter(Boolean)))
  };
}

export function buildCargoStatusCandidates(
  result: CustomsCargoProgressResult,
  shedInfoByCode: Map<string, CargoShedInfo>
) {
  const currentStatus = result.summary.progressStatus || result.events[0]?.status || "";
  const eventStatuses = result.events.flatMap((event) => {
    const classified = classifyCargoEventStatus(event, shedInfoByCode.get(event.shedCode));
    return classified.candidates;
  });

  return {
    currentStatus,
    eventStatuses,
    displayCurrentStatus: classifyCargoEventStatus(result.events[0] ?? {
      status: currentStatus,
      statusCode: "",
      shedCode: "",
      shedName: "",
      location: ""
    }, result.events[0] ? shedInfoByCode.get(result.events[0].shedCode) : undefined).displayStatus || currentStatus
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
      status: classifyCargoEventStatus(event, shedInfoByCode.get(event.shedCode)).displayStatus || event.status
    }))
  };
}

export function statusMatched(input: { targetStatus: string; currentStatus: string; eventStatuses: string[] }) {
  const target = input.targetStatus.trim();
  if (!target) return false;

  const candidates = [input.currentStatus, ...input.eventStatuses]
    .map((value) => value.trim())
    .filter(Boolean);

  return candidates.some((value) => value === target || value.includes(target));
}
