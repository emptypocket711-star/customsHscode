import { countryCodeAliases, destinationCountryOptions, exportCountryLabel } from "@/features/export-diagnosis/country-options";

type CountryFilterItem = {
  countryName?: string | null;
  source?: string | null;
  summary?: string | null;
  title?: string | null;
};

const countryKeywordMap: Record<string, string[]> = {
  ARE: ["아랍에미리트", "UAE", "United Arab Emirates", "Emirates"],
  AUS: ["호주", "Australia", "Australian"],
  AUT: ["오스트리아", "Austria", "Austrian"],
  BGD: ["방글라데시", "Bangladesh", "Bangladeshi"],
  BRA: ["브라질", "Brazil", "Brazilian"],
  CAN: ["캐나다", "Canada", "Canadian"],
  CHE: ["스위스", "Switzerland", "Swiss"],
  CHL: ["칠레", "Chile", "Chilean"],
  CHN: ["중국", "China", "Chinese", "PRC", "Mainland China"],
  DEU: ["독일", "Germany", "German"],
  EEC: ["유럽연합", "유럽", "EU", "European Union", "Europe", "European"],
  ESP: ["스페인", "Spain", "Spanish"],
  FRA: ["프랑스", "France", "French"],
  GBR: ["영국", "United Kingdom", "UK", "U.K.", "Britain", "British", "England"],
  HKG: ["홍콩", "Hong Kong"],
  IDN: ["인도네시아", "Indonesia", "Indonesian"],
  IND: ["인도", "India", "Indian"],
  ITA: ["이탈리아", "Italy", "Italian"],
  JPN: ["일본", "Japan", "Japanese"],
  KHM: ["캄보디아", "Cambodia", "Cambodian"],
  KOR: ["한국", "대한민국", "Korea", "Republic of Korea", "South Korea", "Korean"],
  LAO: ["라오스", "Laos", "Lao PDR"],
  MEX: ["멕시코", "Mexico", "Mexican"],
  MMR: ["미얀마", "Myanmar", "Burma"],
  MYS: ["말레이시아", "Malaysia", "Malaysian"],
  NZL: ["뉴질랜드", "New Zealand"],
  PHL: ["필리핀", "Philippines", "Philippine"],
  RUS: ["러시아", "Russia", "Russian"],
  SGP: ["싱가포르", "Singapore"],
  THA: ["태국", "Thailand", "Thai"],
  TUR: ["튀르키예", "터키", "Turkey", "Turkiye", "Türkiye"],
  TWN: ["대만", "Taiwan", "Taiwanese"],
  USA: ["미국", "미합중국", "United States", "US", "U.S.", "USA", "America", "American"],
  VNM: ["베트남", "Vietnam", "Viet Nam", "Vietnamese"]
};

function stripCountryCode(label: string) {
  return label.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function normalizeToken(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^0-9a-z가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isShortAlphabeticToken(value: string) {
  return /^[a-z]{2,3}$/.test(value);
}

function tokenMatches(haystack: string, token: string) {
  const normalizedToken = normalizeToken(token);
  if (!normalizedToken) return false;

  if (isShortAlphabeticToken(normalizedToken)) {
    return new RegExp(`(^|\\s)${escapeRegExp(normalizedToken)}(\\s|$)`).test(haystack);
  }

  return haystack.includes(normalizedToken);
}

export function tradeNewsCountryLabel(countryCode: string) {
  return stripCountryCode(exportCountryLabel(countryCode));
}

export function tradeNewsCountryFilterTokens(countryCode: string) {
  if (countryCode === "ALL") return [];

  const aliases = countryCodeAliases(countryCode);
  const option = destinationCountryOptions.find((country) => (
    country.code === countryCode
    || country.alias === countryCode
    || aliases.includes(country.code)
    || aliases.includes(country.alias)
  ));
  const countryName = tradeNewsCountryLabel(countryCode);
  const keywordTokens = aliases.flatMap((alias) => countryKeywordMap[alias] ?? []);

  return Array.from(new Set([
    countryName,
    option?.label,
    option ? stripCountryCode(option.label) : null,
    option?.code,
    option?.alias,
    countryCode,
    ...aliases,
    ...keywordTokens
  ].filter((value): value is string => Boolean(value && value !== "ALL"))));
}

export function tradeNewsMatchesCountry(item: CountryFilterItem, countryCode: string) {
  if (countryCode === "ALL") return true;

  const tokens = tradeNewsCountryFilterTokens(countryCode);
  if (!tokens.length) return true;

  const haystack = normalizeToken([
    item.countryName,
    item.source,
    item.title,
    item.summary
  ].filter(Boolean).join(" "));

  return tokens.some((token) => tokenMatches(haystack, token));
}
