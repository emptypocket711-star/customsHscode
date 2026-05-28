import { describe, expect, it } from "vitest";
import { getDutyEstimatorDictionary } from "./duty-estimator";
import { supportedLocales } from "./locales";

describe("getDutyEstimatorDictionary", () => {
  it("returns required page and result labels for every supported locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getDutyEstimatorDictionary(locale);

      expect(dictionary.page.title).toBeTruthy();
      expect(dictionary.form.hskLookup).toBeTruthy();
      expect(dictionary.result.estimatedTotal).toBeTruthy();
      expect(dictionary.autoInput.cardTitle).toBeTruthy();
    }
  });

  it("does not use final-certainty English phrasing", () => {
    const text = JSON.stringify(getDutyEstimatorDictionary("en-US"));

    expect(text).not.toMatch(/guaranteed|definitely|final classification/i);
  });
});
