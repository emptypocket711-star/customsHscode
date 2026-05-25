import { describe, expect, it } from "vitest";
import {
  displayImportTariffLabel,
  filterImportTariffsForCountry,
  importTariffApplicationPriority,
  importTariffDetailDescription,
  isCommonImportTariff,
  type ImportTariffDisplayRow
} from "@/features/hs/import-tariff-display";

const rows: ImportTariffDisplayRow[] = [
  { rateType: "A", label: "기본세율", rateText: "8%", countryGroup: null, usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "C", label: "WTO 협정세율", rateText: "6.5%", countryGroup: null, usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "E1", label: "아시아ㆍ태평양 협정세율", rateText: "5.6%", countryGroup: "2", usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "E1A1", label: "관세율구분 E1A1", rateText: "5.6%", countryGroup: "2", usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "E2", label: "아시아ㆍ태평양 협정세율", rateText: "0%", countryGroup: "2", usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "E3", label: "아시아ㆍ태평양 협정세율", rateText: "0%", countryGroup: "2", usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "W1", label: "WTO 양허관세", rateText: "18%", countryGroup: "1", usageRateType: "A", sourceName: "test", sourceVersion: "v1" },
  { rateType: "W2", label: "WTO 양허관세", rateText: "30%", countryGroup: "1", usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "P1", label: "할당관세", rateText: "5%", countryGroup: "1", usageRateType: "A", sourceName: "test", sourceVersion: "v1" },
  { rateType: "P3", label: "할당관세", rateText: "15%", countryGroup: "1", usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "R", label: "최빈개발도상국 특혜관세", rateText: "0%", countryGroup: null, usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "U", label: "북한산 관세율", rateText: "10%", countryGroup: null, usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "FCN1", label: "관세율구분 FCN1", rateText: "0%", countryGroup: null, usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "FUS1", label: "관세율구분 FUS1", rateText: "0%", countryGroup: null, usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "FEU1", label: "관세율구분 FEU1", rateText: "0%", countryGroup: null, usageRateType: null, sourceName: "test", sourceVersion: "v1" },
  { rateType: "FRCJP1", label: "관세율구분 FRCJP1", rateText: "0%", countryGroup: null, usageRateType: null, sourceName: "test", sourceVersion: "v1" }
];

describe("import tariff display", () => {
  it("keeps common tariffs and selected-country FTA only", () => {
    const labels = filterImportTariffsForCountry(rows, "CHN").map((row) => displayImportTariffLabel(row, "CHN"));

    expect(labels).toEqual(["기본관세", "WTO 협정관세", "한-중 FTA 관세율", "아·태협정 양허관세(일반)", "아·태협정 양허관세(일반 세부 A1)", "WTO 양허관세(추천)", "WTO 양허관세(미추천)", "할당관세(세부1)", "할당관세(세부3)"]);
    expect(labels).not.toContain("한-미 FTA 관세율");
    expect(labels).not.toContain("최빈개발도상국 특혜관세");
  });

  it("keeps every available tariff row when all countries is selected", () => {
    const filtered = filterImportTariffsForCountry(rows, "ALL");
    const labels = filtered.map((row) => displayImportTariffLabel(row, "ALL"));

    expect(filtered.map((row) => row.rateType)).toEqual(["A", "C", "R", "U", "FEU1", "FCN1", "E1", "E1A1", "E2", "E3", "FRCJP1", "FUS1", "W1", "W2", "P1", "P3"]);
    expect(labels).toContain("한-중 FTA 관세율");
    expect(labels).toContain("한-미 FTA 관세율");
    expect(labels).toContain("한-EU FTA 관세율");
    expect(labels).toContain("북한산 관세율");
  });

  it("keeps only the selected country's Asia-Pacific agreement target row", () => {
    expect(filterImportTariffsForCountry(rows, "CHN").filter((row) => row.rateType.startsWith("E")).map((row) => displayImportTariffLabel(row, "CHN"))).toEqual([
      "아·태협정 양허관세(일반)",
      "아·태협정 양허관세(일반 세부 A1)"
    ]);
    expect(filterImportTariffsForCountry(rows, "BGD").filter((row) => row.rateType.startsWith("E")).map((row) => displayImportTariffLabel(row, "BGD"))).toEqual([
      "아·태협정 양허관세(방글라데시)"
    ]);
    expect(filterImportTariffsForCountry(rows, "LAO").filter((row) => row.rateType.startsWith("E")).map((row) => displayImportTariffLabel(row, "LAO"))).toEqual([
      "아·태협정 양허관세(라오스)"
    ]);
    expect(filterImportTariffsForCountry(rows, "USA").filter((row) => row.rateType.startsWith("E"))).toEqual([]);
  });

  it("maps EU member countries to Korea-EU FTA display text", () => {
    const labels = filterImportTariffsForCountry(rows, "DEU").map((row) => displayImportTariffLabel(row, "DEU"));
    const italyLabels = filterImportTariffsForCountry(rows, "ITA").map((row) => displayImportTariffLabel(row, "ITA"));
    const swedenAliasLabels = filterImportTariffsForCountry(rows, "SE").map((row) => displayImportTariffLabel(row, "SE"));

    expect(labels).toContain("한-EU FTA 관세율");
    expect(italyLabels).toContain("한-EU FTA 관세율");
    expect(swedenAliasLabels).toContain("한-EU FTA 관세율");
    expect(labels).not.toContain("한-중 FTA 관세율");
  });

  it("maps Japan to RCEP Japan display text", () => {
    const labels = filterImportTariffsForCountry(rows, "JPN").map((row) => displayImportTariffLabel(row, "JPN"));

    expect(labels).toContain("RCEP 관세율(일본)");
  });

  it("treats non-FTA rate types as common import tariffs", () => {
    expect(isCommonImportTariff(rows[0]!)).toBe(true);
    expect(isCommonImportTariff(rows[10]!)).toBe(false);
    expect(isCommonImportTariff(rows[11]!)).toBe(false);
    expect(isCommonImportTariff(rows[12]!)).toBe(false);
  });

  it("calculates display priority after country filtering", () => {
    const filtered = filterImportTariffsForCountry(rows, "USA");

    expect(importTariffApplicationPriority(filtered.find((row) => row.rateType === "FUS1")!)).toBe("2순위");
    expect(importTariffApplicationPriority(rows[1]!)).toBe("3순위");
    expect(importTariffApplicationPriority(rows[0]!)).toBe("7순위");
    expect(importTariffApplicationPriority(rows[11]!)).toBe("기타");
  });

  it("shows North Korea tariff only for North Korea country codes", () => {
    expect(filterImportTariffsForCountry(rows, "CHN").map((row) => row.rateType)).not.toContain("U");
    expect(filterImportTariffsForCountry(rows, "PRK").map((row) => displayImportTariffLabel(row, "PRK"))).toContain("북한산 관세율");
  });

  it("shows least-developed-country preferential tariff only for target countries", () => {
    expect(filterImportTariffsForCountry(rows, "CHN").map((row) => row.rateType)).not.toContain("R");
    expect(filterImportTariffsForCountry(rows, "BGD").map((row) => displayImportTariffLabel(row, "BGD"))).toContain("최빈개발도상국 특혜관세");
    expect(filterImportTariffsForCountry(rows, "LAO").map((row) => displayImportTariffLabel(row, "LAO"))).toContain("최빈개발도상국 특혜관세");
  });

  it("explains basic, WTO, FTA, and RCEP rows in plain Korean", () => {
    expect(importTariffDetailDescription(rows[0]!, "기본관세").summary).toContain("기본 세율");
    expect(importTariffDetailDescription(rows[1]!, "WTO 협정관세").detail).toContain("C 계열 코드");
    expect(importTariffDetailDescription(rows[2]!, "아·태협정 양허관세(일반)").summary).toContain("일반");
    expect(importTariffDetailDescription(rows[6]!, "WTO 양허관세(추천)").summary).toContain("추천");
    expect(importTariffDetailDescription(rows[12]!, "한-중 FTA 관세율").detail).toContain("원산지");
    expect(importTariffDetailDescription(rows[15]!, "RCEP 관세율(일본)").summary).toContain("RCEP");
  });
});
