import { describe, expect, it } from "vitest";
import {
  dedupeExportDestinationCustomsCodes,
  destinationHsPrefixes,
  normalizeDestinationHsCode,
  mapExportDestinationTariffRow,
  sortExportDestinationTariffs,
} from "@/server/repositories/export-destination-tariff.repository";

describe("export destination tariff repository helpers", () => {
  it("normalizes and derives destination hs prefixes", () => {
    expect(normalizeDestinationHsCode("8507.60-1000")).toBe("8507601000");
    expect(destinationHsPrefixes("8507.60-1000")).toEqual(["850760"]);
    expect(destinationHsPrefixes("850760")).toEqual(["850760"]);
    expect(destinationHsPrefixes("8507")).toEqual(["8507"]);
  });

  it("maps destination tariff rows with agreement rates", () => {
    const item = mapExportDestinationTariffRow(
      {
        country_code: "DE",
        tariff_year: 2025,
        destination_hs_code: "850760",
        english_name: "Lithium-ion accumulators",
        korean_name: "리튬이온 축전지",
        unit: "kg",
        base_rate_text: "2.7%",
        agreement_rates: { "Korea-EU FTA": "0%" },
        source_name: "관세청 국가별 관세율표",
        source_version: "customs-country-tariff-20251231:DE"
      },
      "2026-05-23",
      "8507601000"
    );

    expect(item.agreementRates["Korea-EU FTA"]).toBe("0%");
    expect(item.matchBasis).toBe("hs6");
    expect(item.matchScore).toBeGreaterThan(0);
    expect(item.staffReviewStatus).toBe("확인 필요");
  });

  it("sorts destination tariff candidates by match quality, rate presence, and specificity", () => {
    const rows = [
      mapExportDestinationTariffRow(
        {
          country_code: "USA",
          tariff_year: 2026,
          destination_hs_code: "8507",
          english_name: "Electric accumulators",
          korean_name: null,
          unit: null,
          base_rate_text: null,
          agreement_rates: {},
          source_name: "USITC HTS REST API",
          source_version: "usitc-hts-2026-rev7-20260523"
        },
        "2026-05-23",
        "8507601000"
      ),
      mapExportDestinationTariffRow(
        {
          country_code: "USA",
          tariff_year: 2026,
          destination_hs_code: "8507600010",
          english_name: "Lithium-ion batteries for EVs",
          korean_name: null,
          unit: null,
          base_rate_text: "3.4%",
          agreement_rates: { "Special / preferential duty": "Free (KR)" },
          source_name: "USITC HTS REST API",
          source_version: "usitc-hts-2026-rev7-20260523"
        },
        "2026-05-23",
        "8507601000"
      ),
      mapExportDestinationTariffRow(
        {
          country_code: "USA",
          tariff_year: 2026,
          destination_hs_code: "85076000",
          english_name: "Lithium-ion batteries",
          korean_name: null,
          unit: null,
          base_rate_text: "3.4%",
          agreement_rates: {},
          source_name: "USITC HTS REST API",
          source_version: "usitc-hts-2026-rev7-20260523"
        },
        "2026-05-23",
        "8507601000"
      )
    ];

    expect(sortExportDestinationTariffs(rows).map((row) => row.destinationHsCode)).toEqual(["8507600010", "85076000", "8507"]);
  });

  it("deduplicates destination customs code candidates by code", () => {
    const rows = [
      {
        countryCode: "CHN",
        customsCode: "1902110010",
        tariffCode: "19021100",
        koreanName: "계란을 포함한 생 파스타",
        englishName: null,
        codeRole: "declaration_code",
        notes: null,
        sourceName: "관세청 국가별 관세율표 중국",
        sourceVersion: "china-customs-declaration-codes-2026:customs-country-tariff-2025-10digit"
      },
      {
        countryCode: "CHN",
        customsCode: "1902110010",
        tariffCode: "19021100",
        koreanName: "未包馅或未制作的含蛋生面食，非速冻的",
        englishName: null,
        codeRole: "vat_9_non_full_item",
        notes: null,
        sourceName: "海关总署公告2026年第15号",
        sourceVersion: "china-customs-declaration-codes-2026:gacc-2026-15"
      }
    ];

    expect(dedupeExportDestinationCustomsCodes(rows)).toHaveLength(1);
    expect(dedupeExportDestinationCustomsCodes(rows)[0]?.codeRole).toBe("vat_9_non_full_item");
  });
});
