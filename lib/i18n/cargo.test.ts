import { describe, expect, it } from "vitest";
import { getCargoDictionary } from "./cargo";
import { supportedLocales } from "./locales";

describe("getCargoDictionary", () => {
  it("returns lookup, result, and watch chrome for every supported locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getCargoDictionary(locale);

      expect(dictionary.page.title).toBeTruthy();
      expect(dictionary.form.lookupTitle).toBeTruthy();
      expect(dictionary.form.missingLookupValue).toBeTruthy();
      expect(dictionary.result.events).toBeTruthy();
      expect(dictionary.watch.register).toBeTruthy();
      expect(dictionary.targetStatus.cyInbound).toBeTruthy();
    }
  });

  it("keeps cargo notification copy away from final legal certainty language", () => {
    const text = JSON.stringify(getCargoDictionary("en-US"));

    expect(text).not.toMatch(/guaranteed|definitely|final classification/i);
  });
});
