import { describe, expect, it } from "vitest";
import {
  buildMarketplaceRequestHref,
  countryCodeToIso2,
  hasMarketplaceLookupPrefill,
  marketplacePrefillSnapshotRows,
  marketplacePrefilledProductSummary,
  marketplaceRequestPrefillFromSearchParams
} from "@/features/service-requests/marketplace-request-prefill";

describe("marketplace request prefill", () => {
  it("builds an export clearance request href from an HS lookup result", () => {
    const href = buildMarketplaceRequestHref("clearance", {
      basisDate: "2026-06-01",
      destinationCountry: "USA",
      direction: "export",
      hskCode: "3926.90-9000",
      productName: "플라스틱 기타 제품"
    });

    expect(href).toBe("/requests/clearance?source=hs_lookup&direction=export&basisDate=2026-06-01&destinationCountryCode=US&originCountryCode=KR&hskCode=3926909000&hs6=392690&productName=%ED%94%8C%EB%9D%BC%EC%8A%A4%ED%8B%B1+%EA%B8%B0%ED%83%80+%EC%A0%9C%ED%92%88");
  });

  it("maps import lookup countries into requester country defaults", () => {
    const href = buildMarketplaceRequestHref("freight", {
      destinationCountry: "CHN",
      direction: "import",
      hs6: "170490",
      productName: "사탕"
    });

    expect(href).toBe("/requests/freight?source=hs_lookup&direction=import&destinationCountryCode=KR&originCountryCode=CN&hs6=170490&productName=%EC%82%AC%ED%83%95");
  });

  it("normalizes query params for draft forms", () => {
    const params = new URLSearchParams("source=hs_lookup&direction=import&destinationCountryCode=KOR&originCountryCode=CN&hskCode=3926.90-9000&productName=%EC%83%98%ED%94%8C");

    expect(marketplaceRequestPrefillFromSearchParams(params)).toMatchObject({
      destinationCountryCode: "KR",
      direction: "import",
      hskCode: "3926909000",
      hs6: "392690",
      originCountryCode: "CN",
      productName: "샘플",
      source: "hs_lookup"
    });
  });

  it("accepts dashboard CTA country query aliases for overseas partner requests", () => {
    const params = new URLSearchParams("direction=import&destinationCountry=KOR&originCountry=CHN");

    expect(marketplaceRequestPrefillFromSearchParams(params)).toMatchObject({
      destinationCountryCode: "KR",
      direction: "import",
      originCountryCode: "CN"
    });
  });

  it("formats a compact product summary without requiring legal certainty", () => {
    const summary = marketplacePrefilledProductSummary({
      basisDate: "2026-06-01",
      hskCode: "3926909000",
      productName: "플라스틱 기타 제품"
    });

    expect(summary).toContain("품명: 플라스틱 기타 제품");
    expect(summary).toContain("HSK 예비 조회 코드: 3926909000");
    expect(summary).toContain("조회 기준일: 2026-06-01");
  });

  it("returns ISO 2 country codes used by marketplace request schemas", () => {
    expect(countryCodeToIso2("USA")).toBe("US");
    expect(countryCodeToIso2("CN")).toBe("CN");
    expect(countryCodeToIso2("ALL")).toBeUndefined();
  });

  it("builds source snapshot rows for request draft screens", () => {
    const prefill = marketplaceRequestPrefillFromSearchParams(new URLSearchParams(
      "source=hs_lookup&direction=export&destinationCountryCode=US&originCountryCode=KR&hskCode=8703239000&productName=%EC%A4%91%EA%B3%A0%EC%B0%A8&basisDate=2026-06-01"
    ));

    expect(hasMarketplaceLookupPrefill(prefill)).toBe(true);
    expect(marketplacePrefillSnapshotRows(prefill)).toEqual([
      { label: "조회 품명", value: "중고차" },
      { label: "예비 HSK", value: "8703239000" },
      { label: "조회 기준일", value: "2026-06-01" }
    ]);
  });
});
