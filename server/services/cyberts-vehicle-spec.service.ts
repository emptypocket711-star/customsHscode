import { cachedLookup, lookupCacheKey } from "@/server/cache/lookup-cache";

export type CybertsVehicleSpecSnapshot = {
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type CybertsVehicleSpecResult = {
  specManageNo: string;
  rawSpecInfo: Record<string, unknown>;
  summary: Array<{
    label: string;
    value: string;
  }>;
  snapshot: CybertsVehicleSpecSnapshot;
};

export class CybertsVehicleSpecError extends Error {
  constructor(
    message: string,
    readonly code: "blocked" | "csrf_missing" | "network" | "bad_response" | "not_found"
  ) {
    super(message);
    this.name = "CybertsVehicleSpecError";
  }
}

const CYBERTS_MAIN_URL = "https://www.cyberts.kr/ts/tis/ism/readTsTisSpecSvcMainView.do";
const CYBERTS_SPEC_TAB_URL = "https://www.cyberts.kr/ts/tis/smn/readTsTisSpecManageNoView.do";
const CYBERTS_SPEC_POST_URL = "https://www.cyberts.kr/ts/tis/smn/readTsTisSpecManageNoSpecInfoList.do";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

function normalizeSpecManageNo(value: string) {
  return value.trim().toUpperCase();
}

function getHeaderCookies(headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = typeof getSetCookie === "function" ? getSetCookie.call(headers) : [];
  const fallback = headers.get("set-cookie");
  const allCookies = cookies.length ? cookies : fallback ? [fallback] : [];

  return allCookies
    .flatMap((cookie) => cookie.split(/,(?=\s*[^;,=]+=[^;,]+)/))
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

function extractCsrfToken(html: string) {
  return (
    html.match(/X-CSRF-TOKEN"\s*,\s*"([^"]+)"/)?.[1]
    ?? html.match(/name=["']_csrf["'][^>]*value=["']([^"']+)["']/)?.[1]
    ?? html.match(/var\s+_csrf\s*=\s*"([^"]+)"/)?.[1]
    ?? ""
  );
}

function isSecurityRedirect(response: Response, bodyText: string) {
  const location = response.headers.get("location") ?? response.url;
  return location.includes("/security/secure/") || bodyText.includes("/security/secure/security.html");
}

async function fetchText(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.7,en;q=0.6",
      "User-Agent": USER_AGENT,
      ...(options?.headers ?? {})
    },
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(Number(process.env.CYBERTS_REQUEST_TIMEOUT_MS || 12000))
  });
  const bodyText = await response.text();

  if (isSecurityRedirect(response, bodyText)) {
    throw new CybertsVehicleSpecError("CyberTS 보안 페이지로 전환되었습니다. 서버 자동 조회가 차단되었을 수 있습니다.", "blocked");
  }
  if (!response.ok && response.status < 300 || response.status >= 400) {
    throw new CybertsVehicleSpecError(`CyberTS 호출 실패: ${response.status} ${response.statusText}`, "network");
  }

  return { response, bodyText };
}

function stringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function firstStringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = stringField(record, key);
    if (value) return value;
  }

  return "";
}

function joinFields(record: Record<string, unknown>, keys: string[], separator = " / ") {
  return keys.map((key) => stringField(record, key)).filter(Boolean).join(separator);
}

function buildSummary(specInfo: Record<string, unknown>) {
  const rows = [
    ["제원관리번호", firstStringField(specInfo, ["formOkno", "fomConfmNo", "fomConfmNoNm"])],
    ["제작사", stringField(specInfo, "makrReprCodeNm")],
    ["원제작자", stringField(specInfo, "reprNm")],
    ["국가", stringField(specInfo, "nationCodeNm")],
    ["차명", stringField(specInfo, "carNm")],
    ["용도", stringField(specInfo, "makrUseCodeNm")],
    ["형식", stringField(specInfo, "fom")],
    ["승차정원", joinFields(specInfo, ["tkcarGardenSeat", "tkcarGarden"])],
    ["차종", joinFields(specInfo, ["carKndAsortCodeNm", "carKndTyCodeNm", "carKndSeCodeNm"])],
    ["차량중량", joinFields(specInfo, ["carWtEmptvhcl", "carWtOpt"])],
    ["차량총중량", joinFields(specInfo, ["carTotWt", "carTotWtOpt"])],
    ["최대적재량", stringField(specInfo, "mxmmLod")],
    ["연료", joinFields(specInfo, ["fuelKndCodeNm", "fuel"])],
    ["최고출력", stringField(specInfo, "mxmmOutpt")],
    ["원동기형식", stringField(specInfo, "prmmvrTy")],
    ["변속기", stringField(specInfo, "chssFomNm")],
    ["배기량", stringField(specInfo, "totDsplvl")],
    ["실린더수", stringField(specInfo, "cylnNumber")],
    ["축간거리", stringField(specInfo, "axsDstnc")]
  ];

  return rows
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value }));
}

function findSpecInfo(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const candidates = [
    record.specInfo,
    record.result,
    record.data
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      if ("specInfo" in candidate && typeof (candidate as Record<string, unknown>).specInfo === "object") {
        return (candidate as Record<string, Record<string, unknown>>).specInfo;
      }
      return candidate as Record<string, unknown>;
    }
  }

  return null;
}

async function fetchCybertsVehicleSpec(specManageNoInput: string): Promise<CybertsVehicleSpecResult> {
  const specManageNo = normalizeSpecManageNo(specManageNoInput);
  if (!specManageNo) {
    throw new CybertsVehicleSpecError("제원관리번호를 입력해 주세요.", "bad_response");
  }

  try {
    const main = await fetchText(CYBERTS_MAIN_URL);
    const csrfToken = extractCsrfToken(main.bodyText);
    const cookie = getHeaderCookies(main.response.headers);

    if (!csrfToken) {
      throw new CybertsVehicleSpecError("CyberTS 조회 토큰을 확인하지 못했습니다.", "csrf_missing");
    }

    await fetchText(CYBERTS_SPEC_TAB_URL, {
      headers: {
        Cookie: cookie,
        Referer: CYBERTS_MAIN_URL
      }
    });

    const formBody = new URLSearchParams({
      searchFormOkno: "",
      specType: "CAR",
      searchWrd: specManageNo,
      _csrf: csrfToken
    });

    const response = await fetch(CYBERTS_SPEC_POST_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.7,en;q=0.6",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: cookie,
        Origin: "https://www.cyberts.kr",
        Referer: CYBERTS_SPEC_TAB_URL,
        "User-Agent": USER_AGENT,
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: formBody.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.CYBERTS_REQUEST_TIMEOUT_MS || 12000))
    });
    const rawText = await response.text();

    if (isSecurityRedirect(response, rawText)) {
      throw new CybertsVehicleSpecError("CyberTS 보안 페이지로 전환되었습니다. 서버 자동 조회가 차단되었을 수 있습니다.", "blocked");
    }
    if (rawText.includes("잘못된 접근") || rawText.includes("메인 페이지로 이동합니다")) {
      throw new CybertsVehicleSpecError("CyberTS가 서버 자동 조회 요청을 잘못된 접근으로 처리했습니다.", "blocked");
    }
    if (!response.ok) {
      throw new CybertsVehicleSpecError(`CyberTS 조회 응답 오류: ${response.status} ${response.statusText}`, "bad_response");
    }

    const payload = JSON.parse(rawText) as unknown;
    const specInfo = findSpecInfo(payload);
    if (!specInfo || Object.keys(specInfo).length === 0) {
      throw new CybertsVehicleSpecError("조회 결과가 없습니다. 제원관리번호를 확인해 주세요.", "not_found");
    }

    return {
      specManageNo,
      rawSpecInfo: specInfo,
      summary: buildSummary(specInfo),
      snapshot: {
        sourceName: "한국교통안전공단 사이버검사소 자동차 제원조회",
        sourceUrl: CYBERTS_MAIN_URL,
        retrievedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    if (error instanceof CybertsVehicleSpecError) throw error;
    if (error instanceof SyntaxError) {
      throw new CybertsVehicleSpecError("CyberTS 응답을 해석하지 못했습니다.", "bad_response");
    }

    throw new CybertsVehicleSpecError(
      error instanceof Error ? error.message : "CyberTS 조회 중 네트워크 오류가 발생했습니다.",
      "network"
    );
  }
}

export async function lookupCybertsVehicleSpec(specManageNoInput: string): Promise<CybertsVehicleSpecResult> {
  const specManageNo = normalizeSpecManageNo(specManageNoInput);
  return cachedLookup({
    key: lookupCacheKey("cyberts-vehicle-spec", {
      version: "cyberts-vehicle-spec-v1",
      specManageNo
    }),
    ttlMs: Number(process.env.CYBERTS_VEHICLE_SPEC_CACHE_TTL_MS || 7 * 24 * 60 * 60 * 1000),
    load: () => fetchCybertsVehicleSpec(specManageNo)
  });
}
