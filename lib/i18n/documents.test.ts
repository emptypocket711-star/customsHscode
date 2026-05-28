import { describe, expect, it } from "vitest";
import { getDocumentsDictionary } from "./documents";
import { supportedLocales } from "./locales";

describe("getDocumentsDictionary", () => {
  it("returns document upload page chrome for every supported locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getDocumentsDictionary(locale);

      expect(dictionary.upload.title).toBeTruthy();
      expect(dictionary.upload.description).toBeTruthy();
      expect(dictionary.upload.notReadyTitle).toBeTruthy();
      expect(dictionary.upload.notReadyBody).toBeTruthy();
    }
  });
});
