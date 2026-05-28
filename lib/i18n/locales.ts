export const supportedLocales = ["ko-KR", "en-US", "zh-CN"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "ko-KR";

export const localeCookieName = "hsfinder_locale";

export const localeOptions: Array<{ value: AppLocale; label: string; shortLabel: string; htmlLang: string }> = [
  { value: "ko-KR", label: "한국어", shortLabel: "KR", htmlLang: "ko" },
  { value: "en-US", label: "English", shortLabel: "EN", htmlLang: "en" },
  { value: "zh-CN", label: "简体中文", shortLabel: "中文", htmlLang: "zh-CN" }
];

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && supportedLocales.includes(value as AppLocale);
}

export function normalizeLocaleOrNull(value: unknown): AppLocale | null {
  if (isAppLocale(value)) return value;
  if (typeof value !== "string") return null;

  const normalized = value.trim().replace("_", "-").toLowerCase();
  if (normalized === "ko" || normalized === "ko-kr") return "ko-KR";
  if (normalized === "en" || normalized === "en-us") return "en-US";
  if (normalized === "zh" || normalized === "zh-cn" || normalized === "zh-hans" || normalized === "cn") return "zh-CN";
  return null;
}

export function normalizeLocale(value: unknown): AppLocale {
  return normalizeLocaleOrNull(value) ?? defaultLocale;
}

export function localeFallbackChain(locale: AppLocale): AppLocale[] {
  if (locale === "zh-CN") return ["zh-CN", "en-US", "ko-KR"];
  if (locale === "en-US") return ["en-US", "ko-KR"];
  return ["ko-KR"];
}

export function localeFromAcceptLanguage(value: string | null | undefined): AppLocale | null {
  if (!value) return null;

  const weightedLocales = value
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;

      return {
        locale: normalizeLocaleOrNull(tag),
        q: Number.isFinite(q) ? q : 0
      };
    })
    .filter((item): item is { locale: AppLocale; q: number } => Boolean(item.locale))
    .sort((a, b) => b.q - a.q);

  return weightedLocales[0]?.locale ?? null;
}

export function htmlLangForLocale(locale: AppLocale) {
  return localeOptions.find((option) => option.value === locale)?.htmlLang ?? "ko";
}
