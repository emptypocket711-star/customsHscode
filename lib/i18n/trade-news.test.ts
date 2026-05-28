import { describe, expect, it } from "vitest";
import { getTradeNewsDictionary } from "./trade-news";
import { supportedLocales } from "./locales";

describe("getTradeNewsDictionary", () => {
  it("returns category labels and card chrome for every supported locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getTradeNewsDictionary(locale);

      expect(dictionary.page.title).toBeTruthy();
      expect(dictionary.hero.countryFilter).toBeTruthy();
      expect(dictionary.card.openOriginal).toBeTruthy();
      expect(Object.keys(dictionary.categories).sort()).toEqual(["auxiliary", "customs", "global", "government", "industry", "market"]);
    }
  });
});
