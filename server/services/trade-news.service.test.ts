import { afterEach, describe, expect, it } from "vitest";
import { tradeNewsServiceInternals } from "@/server/services/trade-news.service";

const originalKotraUrl = process.env.KOTRA_OVERSEAS_MARKET_NEWS_URL;
const originalTypoKotraUrl = process.env.OTRA_OVERSEAS_MARKET_NEWS_URL;

afterEach(() => {
  if (originalKotraUrl === undefined) {
    delete process.env.KOTRA_OVERSEAS_MARKET_NEWS_URL;
  } else {
    process.env.KOTRA_OVERSEAS_MARKET_NEWS_URL = originalKotraUrl;
  }

  if (originalTypoKotraUrl === undefined) {
    delete process.env.OTRA_OVERSEAS_MARKET_NEWS_URL;
  } else {
    process.env.OTRA_OVERSEAS_MARKET_NEWS_URL = originalTypoKotraUrl;
  }
});

describe("trade news service env compatibility", () => {
  it("reads the legacy misspelled KOTRA overseas market news URL as a fallback", () => {
    delete process.env.KOTRA_OVERSEAS_MARKET_NEWS_URL;
    process.env.OTRA_OVERSEAS_MARKET_NEWS_URL = "https://example.test/legacy-kotra";

    expect(tradeNewsServiceInternals.envValue(
      "KOTRA_OVERSEAS_MARKET_NEWS_URL",
      "OTRA_OVERSEAS_MARKET_NEWS_URL"
    )).toBe("https://example.test/legacy-kotra");
  });

  it("prefers the correctly named KOTRA URL when both are configured", () => {
    process.env.KOTRA_OVERSEAS_MARKET_NEWS_URL = "https://example.test/kotra";
    process.env.OTRA_OVERSEAS_MARKET_NEWS_URL = "https://example.test/legacy-kotra";

    expect(tradeNewsServiceInternals.envValue(
      "KOTRA_OVERSEAS_MARKET_NEWS_URL",
      "OTRA_OVERSEAS_MARKET_NEWS_URL"
    )).toBe("https://example.test/kotra");
  });
});
