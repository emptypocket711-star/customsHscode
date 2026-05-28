import { describe, expect, it } from "vitest";
import { getDiagnosisDictionary } from "./diagnosis";
import { supportedLocales } from "./locales";

describe("getDiagnosisDictionary", () => {
  it("returns import and export diagnosis chrome for every supported locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getDiagnosisDictionary(locale);

      expect(dictionary.import.pageTitle).toBeTruthy();
      expect(dictionary.import.requirementSection).toBeTruthy();
      expect(dictionary.export.pageTitle).toBeTruthy();
      expect(dictionary.export.exportControlSection).toBeTruthy();
      expect(dictionary.common.basisDate).toBeTruthy();
    }
  });

  it("keeps diagnosis copy away from final legal certainty language", () => {
    const text = JSON.stringify(getDiagnosisDictionary("en-US"));

    expect(text).not.toMatch(/guaranteed|definitely|final classification/i);
  });
});
