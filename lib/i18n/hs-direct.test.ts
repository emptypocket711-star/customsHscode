import { describe, expect, it } from "vitest";
import { getHsDirectDictionary } from "@/lib/i18n/hs-direct";
import { supportedLocales } from "@/lib/i18n/locales";

function flattenText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return [];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap((item) => flattenText(item));
}

describe("HS direct i18n dictionary", () => {
  it("provides lookup chrome for every app locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getHsDirectDictionary(locale);

      expect(dictionary.page.directTitle).toBeTruthy();
      expect(dictionary.form.query).toBeTruthy();
      expect(dictionary.product.productResult).toBeTruthy();
      expect(dictionary.result.itemDetail).toBeTruthy();
    }
  });

  it("keeps English lookup copy away from finality claims", () => {
    const text = flattenText(getHsDirectDictionary("en-US")).join(" ").toLowerCase();

    expect(text).not.toContain("guaranteed");
    expect(text).not.toContain("definitely");
    expect(text).not.toContain("final classification");
  });
});
