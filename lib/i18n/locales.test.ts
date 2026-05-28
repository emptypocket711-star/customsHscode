import { describe, expect, it } from "vitest";
import { localeFallbackChain, localeFromAcceptLanguage, normalizeLocaleOrNull } from "@/lib/i18n/locales";

describe("i18n locale helpers", () => {
  it("normalizes supported locale aliases", () => {
    expect(normalizeLocaleOrNull("ko")).toBe("ko-KR");
    expect(normalizeLocaleOrNull("en_US")).toBe("en-US");
    expect(normalizeLocaleOrNull("zh-Hans")).toBe("zh-CN");
    expect(normalizeLocaleOrNull("fr-FR")).toBeNull();
  });

  it("uses q weight when parsing accept-language", () => {
    expect(localeFromAcceptLanguage("fr-FR,zh-CN;q=0.8,en-US;q=0.9")).toBe("en-US");
    expect(localeFromAcceptLanguage("zh;q=0.7,ko-KR;q=0.9")).toBe("ko-KR");
  });

  it("returns locale fallback chain for translated content", () => {
    expect(localeFallbackChain("zh-CN")).toEqual(["zh-CN", "en-US", "ko-KR"]);
    expect(localeFallbackChain("en-US")).toEqual(["en-US", "ko-KR"]);
    expect(localeFallbackChain("ko-KR")).toEqual(["ko-KR"]);
  });
});
