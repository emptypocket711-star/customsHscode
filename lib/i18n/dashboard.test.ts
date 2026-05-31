import { describe, expect, it } from "vitest";
import { getDashboardDictionary } from "@/lib/i18n/dashboard";
import { supportedLocales } from "@/lib/i18n/locales";

function flattenText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap((item) => flattenText(item));
}

describe("dashboard i18n dictionary", () => {
  it("provides translated dashboard chrome for every app locale", () => {
    for (const locale of supportedLocales) {
      const dictionary = getDashboardDictionary(locale);

      expect(dictionary.hero.title).toBeTruthy();
      expect(dictionary.lookup.submit).toBeTruthy();
      expect(dictionary.notices.close).toBeTruthy();
      expect(dictionary.workflows.items.batch.title).toBeTruthy();
      expect(dictionary.workflows.description).toBeTruthy();
    }
  });

  it("does not use hard finality language in English dashboard copy", () => {
    const text = flattenText(getDashboardDictionary("en-US")).join(" ").toLowerCase();

    expect(text).not.toContain("guaranteed");
    expect(text).not.toContain("definitely");
    expect(text).not.toContain("final classification");
  });
});
