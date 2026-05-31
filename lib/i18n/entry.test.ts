import { describe, expect, it } from "vitest";
import { getEntryDictionary } from "./entry";
import { supportedLocales } from "./locales";

describe("getEntryDictionary", () => {
  it("returns the same workflow count for every supported locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getEntryDictionary(locale);

      expect(dictionary.title).toBeTruthy();
      expect(dictionary.entries).toHaveLength(4);
      expect(dictionary.entries.map((entry) => entry.key)).toEqual(["direct", "overseas", "cargo", "duty"]);
    }
  });
});
