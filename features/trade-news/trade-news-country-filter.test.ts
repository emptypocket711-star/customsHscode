import { describe, expect, it } from "vitest";
import { tradeNewsCountryFilterTokens, tradeNewsMatchesCountry } from "./trade-news-country-filter";

describe("trade news country filter", () => {
  it("matches English country names and abbreviations for the United States", () => {
    expect(tradeNewsCountryFilterTokens("USA")).toEqual(expect.arrayContaining(["미국", "United States", "USA", "U.S."]));
    expect(tradeNewsMatchesCountry({
      countryName: null,
      source: "KOTRA 미국 글로벌 이슈",
      summary: "A new United States tariff measure was announced.",
      title: "Automotive sector update"
    }, "USA")).toBe(true);
  });

  it("matches China articles written in English", () => {
    expect(tradeNewsMatchesCountry({
      countryName: null,
      source: "KOTRA 해외시장뉴스",
      summary: "Chinese customs has updated import documentation rules.",
      title: "Regulatory update"
    }, "CHN")).toBe(true);
  });

  it("matches EU articles when a member country is selected", () => {
    expect(tradeNewsMatchesCountry({
      countryName: null,
      source: "WTO",
      summary: "European Union member states discussed trade safeguards.",
      title: "EU trade update"
    }, "DEU")).toBe(true);
  });

  it("does not match short country abbreviations inside unrelated words", () => {
    expect(tradeNewsMatchesCountry({
      countryName: null,
      source: "WTO",
      summary: "customs documentation update for another region",
      title: "Customs update"
    }, "USA")).toBe(false);
  });
});
