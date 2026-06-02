import { exportCountryOptions } from "@/features/export-diagnosis/country-options";
import { normalizeHsCode } from "@/lib/hs-code";

export type MarketplaceRequestKind = "clearance" | "freight";

export type MarketplaceRequestPrefillInput = {
  basisDate?: string;
  destinationCountry?: string;
  direction: "import" | "export";
  hskCode?: string;
  hs6?: string;
  originCountry?: string;
  productName?: string;
};

export type MarketplaceRequestPrefill = {
  basisDate?: string;
  destinationCountryCode?: string;
  direction?: "import" | "export";
  hskCode?: string;
  hs6?: string;
  originCountryCode?: string;
  productName?: string;
  source?: string;
};

export type MarketplacePrefillSnapshotRow = {
  label: string;
  value: string;
};

function compactText(value?: string, maxLength = 180) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

export function countryCodeToIso2(value?: string) {
  const normalized = value?.trim().toUpperCase();
  if (!normalized || normalized === "ALL") return undefined;
  if (/^[A-Z]{2}$/.test(normalized)) return normalized;

  const match = exportCountryOptions.find((country) => country.code === normalized || country.alias === normalized);
  return match?.alias;
}

function requestCountryDefaults(input: MarketplaceRequestPrefillInput) {
  if (input.direction === "export") {
    return {
      destinationCountryCode: countryCodeToIso2(input.destinationCountry),
      originCountryCode: countryCodeToIso2(input.originCountry) ?? "KR"
    };
  }

  return {
    destinationCountryCode: "KR",
    originCountryCode: countryCodeToIso2(input.destinationCountry)
  };
}

export function buildMarketplaceRequestHref(kind: MarketplaceRequestKind, input: MarketplaceRequestPrefillInput) {
  const params = new URLSearchParams();
  const hskCode = normalizeHsCode(input.hskCode ?? "");
  const hs6 = normalizeHsCode(input.hs6 ?? hskCode.slice(0, 6));
  const countries = requestCountryDefaults(input);

  params.set("source", "hs_lookup");
  params.set("direction", input.direction);
  if (input.basisDate) params.set("basisDate", input.basisDate);
  if (countries.destinationCountryCode) params.set("destinationCountryCode", countries.destinationCountryCode);
  if (countries.originCountryCode) params.set("originCountryCode", countries.originCountryCode);
  if (hskCode.length === 10) params.set("hskCode", hskCode);
  if (hs6.length === 6) params.set("hs6", hs6);
  if (input.productName) params.set("productName", input.productName);

  return `/requests/${kind}?${params.toString()}`;
}

export function marketplaceRequestPrefillFromSearchParams(params: Pick<URLSearchParams, "get">): MarketplaceRequestPrefill {
  const direction = params.get("direction");
  const hskCode = normalizeHsCode(params.get("hskCode") ?? "");
  const hs6 = normalizeHsCode(params.get("hs6") ?? hskCode.slice(0, 6));
  const destinationCountry = params.get("destinationCountryCode") ?? params.get("destinationCountry") ?? undefined;
  const originCountry = params.get("originCountryCode") ?? params.get("originCountry") ?? undefined;

  return {
    basisDate: compactText(params.get("basisDate") ?? undefined, 10),
    destinationCountryCode: countryCodeToIso2(destinationCountry),
    direction: direction === "export" ? "export" : direction === "import" ? "import" : undefined,
    hskCode: hskCode.length === 10 ? hskCode : undefined,
    hs6: hs6.length === 6 ? hs6 : undefined,
    originCountryCode: countryCodeToIso2(originCountry),
    productName: compactText(params.get("productName") ?? params.get("product") ?? undefined),
    source: compactText(params.get("source") ?? undefined, 40)
  };
}

export function marketplacePrefilledTitle(prefill: MarketplaceRequestPrefill, kind: MarketplaceRequestKind) {
  if (!prefill.productName) return "";
  return kind === "clearance" ? `${prefill.productName} 통관 의뢰` : `${prefill.productName} 운송 견적 요청`;
}

export function marketplacePrefilledProductSummary(prefill: MarketplaceRequestPrefill) {
  const lines = [
    prefill.productName ? `품명: ${prefill.productName}` : undefined,
    prefill.hskCode ? `HSK 예비 조회 코드: ${prefill.hskCode}` : prefill.hs6 ? `HS6 예비 조회 코드: ${prefill.hs6}` : undefined,
    prefill.basisDate ? `조회 기준일: ${prefill.basisDate}` : undefined
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

export function hasMarketplaceLookupPrefill(prefill: MarketplaceRequestPrefill) {
  return prefill.source === "hs_lookup" && Boolean(prefill.productName || prefill.hskCode || prefill.hs6);
}

export function marketplacePrefillSnapshotRows(prefill: MarketplaceRequestPrefill): MarketplacePrefillSnapshotRow[] {
  const rows = [
    prefill.productName ? { label: "조회 품명", value: prefill.productName } : undefined,
    prefill.hskCode ? { label: "예비 HSK", value: prefill.hskCode } : undefined,
    !prefill.hskCode && prefill.hs6 ? { label: "예비 HS6", value: prefill.hs6 } : undefined,
    prefill.basisDate ? { label: "조회 기준일", value: prefill.basisDate } : undefined
  ];

  return rows.filter((row): row is MarketplacePrefillSnapshotRow => Boolean(row));
}
