import { describe, expect, it } from "vitest";
import { countryCodeAliases, destinationCountryOptions, exportCountryLabel, exportCountryOptions } from "./country-options";

describe("export country options", () => {
  it("includes Korea for export-origin filtering", () => {
    expect(exportCountryOptions).toContainEqual({ code: "KOR", alias: "KR", label: "한국 (KOR)" });
    expect(countryCodeAliases("KR")).toEqual(["KOR", "KR"]);
    expect(countryCodeAliases("KOR")).toEqual(["KOR", "KR"]);
    expect(exportCountryLabel("KR")).toBe("한국 (KOR)");
  });

  it("keeps all-country aliases for every selectable country except ALL", () => {
    expect(countryCodeAliases("ALL")).toContain("KOR");
    expect(countryCodeAliases("ALL")).toContain("KR");
    expect(countryCodeAliases("ALL")).not.toContain("ALL");
  });

  it("maps EU member selections to the shared EU tariff code", () => {
    expect(countryCodeAliases("DEU")).toEqual(["DEU", "DE", "EEC", "EU"]);
    expect(countryCodeAliases("FR")).toEqual(["FRA", "FR", "EEC", "EU"]);
    expect(countryCodeAliases("IT")).toEqual(["ITA", "IT", "EEC", "EU"]);
    expect(countryCodeAliases("EU")).toContain("EEC");
    expect(countryCodeAliases("EU")).toContain("FRA");
    expect(countryCodeAliases("EU")).toContain("ITA");
    expect(countryCodeAliases("EU")).toContain("SE");
    expect(exportCountryLabel("IT")).toBe("이탈리아 (ITA)");
  });

  it("maps selectable ISO countries to workbook country codes", () => {
    expect(countryCodeAliases("KHM")).toEqual(["KHM", "KH", "CAM"]);
    expect(countryCodeAliases("MMR")).toEqual(["MMR", "MM", "MYA"]);
    expect(countryCodeAliases("BRU")).toEqual(["BRU", "BN", "BRN"]);
    expect(countryCodeAliases("AE")).toEqual(["ARE", "AE"]);
    expect(countryCodeAliases("BR")).toEqual(["BRA", "BR"]);
    expect(countryCodeAliases("ALL")).toContain("CAM");
    expect(countryCodeAliases("ALL")).toContain("MYA");
    expect(countryCodeAliases("ALL")).toContain("ARE");
    expect(exportCountryLabel("CAM")).toBe("캄보디아 (KHM)");
    expect(exportCountryLabel("MYA")).toBe("미얀마 (MMR)");
    expect(exportCountryLabel("BRN")).toBe("브루나이 (BRU)");
    expect(exportCountryLabel("AE")).toBe("아랍에미리트 (ARE)");
  });

  it("keeps origin-only countries out of destination selections", () => {
    expect(exportCountryOptions.some((country) => country.code === "KOR")).toBe(true);
    expect(exportCountryOptions.some((country) => country.code === "LKA")).toBe(true);
    expect(destinationCountryOptions.some((country) => country.code === "KOR")).toBe(false);
    expect(destinationCountryOptions.some((country) => country.code === "LKA")).toBe(false);
  });
});
