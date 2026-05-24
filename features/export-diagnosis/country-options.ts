const euMemberCountryOptions = [
  { code: "AUT", alias: "AT", label: "오스트리아 (AUT)" },
  { code: "BEL", alias: "BE", label: "벨기에 (BEL)" },
  { code: "BGR", alias: "BG", label: "불가리아 (BGR)" },
  { code: "HRV", alias: "HR", label: "크로아티아 (HRV)" },
  { code: "CYP", alias: "CY", label: "키프로스 (CYP)" },
  { code: "CZE", alias: "CZ", label: "체코 (CZE)" },
  { code: "DNK", alias: "DK", label: "덴마크 (DNK)" },
  { code: "EST", alias: "EE", label: "에스토니아 (EST)" },
  { code: "FIN", alias: "FI", label: "핀란드 (FIN)" },
  { code: "FRA", alias: "FR", label: "프랑스 (FRA)" },
  { code: "DEU", alias: "DE", label: "독일 (DEU)" },
  { code: "GRC", alias: "GR", label: "그리스 (GRC)" },
  { code: "HUN", alias: "HU", label: "헝가리 (HUN)" },
  { code: "IRL", alias: "IE", label: "아일랜드 (IRL)" },
  { code: "ITA", alias: "IT", label: "이탈리아 (ITA)" },
  { code: "LVA", alias: "LV", label: "라트비아 (LVA)" },
  { code: "LTU", alias: "LT", label: "리투아니아 (LTU)" },
  { code: "LUX", alias: "LU", label: "룩셈부르크 (LUX)" },
  { code: "MLT", alias: "MT", label: "몰타 (MLT)" },
  { code: "NLD", alias: "NL", label: "네덜란드 (NLD)" },
  { code: "POL", alias: "PL", label: "폴란드 (POL)" },
  { code: "PRT", alias: "PT", label: "포르투갈 (PRT)" },
  { code: "ROU", alias: "RO", label: "루마니아 (ROU)" },
  { code: "SVK", alias: "SK", label: "슬로바키아 (SVK)" },
  { code: "SVN", alias: "SI", label: "슬로베니아 (SVN)" },
  { code: "ESP", alias: "ES", label: "스페인 (ESP)" },
  { code: "SWE", alias: "SE", label: "스웨덴 (SWE)" }
] as const;

const euMemberCountryCodes: Set<string> = new Set(euMemberCountryOptions.flatMap((country) => [country.code, country.alias]));

export const exportCountryOptions = [
  { code: "ALL", alias: "ALL", label: "모든국가" },
  { code: "KOR", alias: "KR", label: "한국 (KOR)" },
  { code: "EEC", alias: "EU", label: "유럽연합 (EU)" },
  { code: "CHN", alias: "CN", label: "중국 (CHN)" },
  { code: "USA", alias: "US", label: "미국 (USA)" },
  { code: "JPN", alias: "JP", label: "일본 (JPN)" },
  { code: "VNM", alias: "VN", label: "베트남 (VNM)" },
  ...euMemberCountryOptions,
  { code: "BGD", alias: "BD", label: "방글라데시 (BGD)" },
  { code: "LAO", alias: "LA", label: "라오스 (LAO)" },
  { code: "LKA", alias: "LK", label: "스리랑카 (LKA)" },
  { code: "MNG", alias: "MN", label: "몽골 (MNG)" },
  { code: "GBR", alias: "GB", label: "영국 (GBR)" },
  { code: "IND", alias: "IN", label: "인도 (IND)" },
  { code: "IDN", alias: "ID", label: "인도네시아 (IDN)" },
  { code: "THA", alias: "TH", label: "태국 (THA)" },
  { code: "MYS", alias: "MY", label: "말레이시아 (MYS)" },
  { code: "PHL", alias: "PH", label: "필리핀 (PHL)" },
  { code: "SGP", alias: "SG", label: "싱가포르 (SGP)" },
  { code: "KHM", alias: "KH", label: "캄보디아 (KHM)" },
  { code: "MMR", alias: "MM", label: "미얀마 (MMR)" },
  { code: "BRU", alias: "BN", label: "브루나이 (BRU)" },
  { code: "NZL", alias: "NZ", label: "뉴질랜드 (NZL)" },
  { code: "TWN", alias: "TW", label: "대만 (TWN)" },
  { code: "TUR", alias: "TR", label: "튀르키예 (TUR)" },
  { code: "SAU", alias: "SA", label: "사우디아라비아 (SAU)" },
  { code: "MEX", alias: "MX", label: "멕시코 (MEX)" },
  { code: "CAN", alias: "CA", label: "캐나다 (CAN)" },
  { code: "AUS", alias: "AU", label: "호주 (AUS)" },
  { code: "RUS", alias: "RU", label: "러시아 (RUS)" },
  { code: "ZAF", alias: "ZA", label: "남아프리카공화국 (ZAF)" },
  { code: "ARE", alias: "AE", label: "아랍에미리트 (ARE)" },
  { code: "BRA", alias: "BR", label: "브라질 (BRA)" },
  { code: "CHE", alias: "CH", label: "스위스 (CHE)" },
  { code: "CHL", alias: "CL", label: "칠레 (CHL)" },
  { code: "COL", alias: "CO", label: "콜롬비아 (COL)" },
  { code: "CRI", alias: "CR", label: "코스타리카 (CRI)" },
  { code: "HND", alias: "HN", label: "온두라스 (HND)" },
  { code: "ISL", alias: "IS", label: "아이슬란드 (ISL)" },
  { code: "ISR", alias: "IL", label: "이스라엘 (ISR)" },
  { code: "NIC", alias: "NI", label: "니카라과 (NIC)" },
  { code: "NOR", alias: "NO", label: "노르웨이 (NOR)" },
  { code: "PAN", alias: "PA", label: "파나마 (PAN)" },
  { code: "PER", alias: "PE", label: "페루 (PER)" },
  { code: "SLV", alias: "SV", label: "엘살바도르 (SLV)" },
  { code: "UZB", alias: "UZ", label: "우즈베키스탄 (UZB)" }
];

const originOnlyCountryCodes = new Set(["KOR", "LKA"]);

export const destinationCountryOptions = exportCountryOptions.filter((country) => !originOnlyCountryCodes.has(country.code));

const extraCountryAliases: Record<string, string[]> = {
  BN: ["BRN"],
  BRU: ["BRN"],
  KHM: ["CAM"],
  KH: ["CAM"],
  MMR: ["MYA"],
  MM: ["MYA"]
};

export function countryCodeAliases(value?: string) {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return [];
  if (normalized === "ALL") {
    return Array.from(new Set(
      exportCountryOptions
        .flatMap((option) => [option.code, option.alias, ...(extraCountryAliases[option.code] ?? []), ...(extraCountryAliases[option.alias] ?? [])])
        .filter((code) => code !== "ALL")
    ));
  }

  if (["EEC", "EU"].includes(normalized)) {
    return Array.from(new Set(["EEC", "EU", ...euMemberCountryOptions.flatMap((country) => [country.code, country.alias])]));
  }

  if (euMemberCountryCodes.has(normalized)) {
    const own = exportCountryOptions.find((option) => option.code === normalized || option.alias === normalized);
    return Array.from(new Set([own?.code, own?.alias, "EEC", "EU"].filter((code): code is string => Boolean(code))));
  }

  const match = exportCountryOptions.find((option) => option.code === normalized || option.alias === normalized);
  const aliases = match
    ? [match.code, match.alias, ...(extraCountryAliases[match.code] ?? []), ...(extraCountryAliases[match.alias] ?? [])]
    : [normalized, ...(extraCountryAliases[normalized] ?? [])];

  return Array.from(new Set(aliases));
}

export function exportCountryLabel(value?: string) {
  const normalized = value?.trim().toUpperCase();
  const match = exportCountryOptions.find((option) => (
    option.code === normalized
    || option.alias === normalized
    || (normalized ? (extraCountryAliases[option.code]?.includes(normalized) || extraCountryAliases[option.alias]?.includes(normalized)) : false)
  ));

  return match?.label ?? normalized ?? "";
}
