import { describe, expect, it } from "vitest";
import { getUsedCarExportDictionary } from "./used-car-export";
import { supportedLocales } from "./locales";

describe("getUsedCarExportDictionary", () => {
  it("returns page, tab, vehicle, and container chrome for every supported locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getUsedCarExportDictionary(locale);

      expect(dictionary.overview.title).toBeTruthy();
      expect(dictionary.overview.rows).toHaveLength(2);
      expect(dictionary.tabs.containerCheck).toBeTruthy();
      expect(dictionary.vehicleSpec.inputLabel).toBeTruthy();
      expect(dictionary.container.receipt).toBeTruthy();
      expect(dictionary.container.trackingTable.terminal).toBeTruthy();
    }
  });
});
