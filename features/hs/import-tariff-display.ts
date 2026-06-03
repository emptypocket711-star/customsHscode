export type ImportTariffDisplayRow = {
  rateType: string;
  label: string;
  rateText: string;
  countryGroup: string | null;
  usageRateType: string | null;
  sourceName: string;
  sourceVersion: string;
};

type AgreementOption = {
  prefix: string;
  label: string;
  coType?: string;
  evidence?: string;
};

const koreaEuAgreement: AgreementOption = {
  prefix: "FEU",
  label: "한-EU FTA 관세율",
  coType: "인증수출자 원산지신고",
  evidence: "원산지신고문안, 인증수출자 번호, 직접운송 증빙"
};

const koreaAseanAgreement: AgreementOption = {
  prefix: "FAS",
  label: "한-아세안 FTA 관세율",
  coType: "기관발급 원산지증명서",
  evidence: "AK Form 등 원산지증명, 직접운송 증빙"
};

const rcepAseanAgreement: AgreementOption = {
  prefix: "FRCAS",
  label: "RCEP 관세율(아세안)",
  coType: "RCEP 원산지증명서 또는 인증수출자 원산지신고",
  evidence: "RCEP 원산지증명, 직접운송, 누적 적용 여부"
};

const koreaEftaAgreement: AgreementOption = {
  prefix: "FEF",
  label: "한-EFTA FTA 관세율",
  coType: "원산지신고 또는 협정상 원산지증명",
  evidence: "EFTA 협정 원산지증명, 직접운송, 생산·원재료 증빙"
};

const euMemberImportCountryCodes = [
  "AUT", "AT",
  "BEL", "BE",
  "BGR", "BG",
  "HRV", "HR",
  "CYP", "CY",
  "CZE", "CZ",
  "DNK", "DK",
  "EST", "EE",
  "FIN", "FI",
  "FRA", "FR",
  "DEU", "DE",
  "GRC", "GR",
  "HUN", "HU",
  "IRL", "IE",
  "ITA", "IT",
  "LVA", "LV",
  "LTU", "LT",
  "LUX", "LU",
  "MLT", "MT",
  "NLD", "NL",
  "POL", "PL",
  "PRT", "PT",
  "ROU", "RO",
  "SVK", "SK",
  "SVN", "SI",
  "ESP", "ES",
  "SWE", "SE",
  "EEC", "EU"
];

const countryAgreementOptions: Record<string, AgreementOption[]> = {
  AUS: [{ prefix: "FAU", label: "한-호주 FTA 관세율", coType: "원산지증명서 또는 협정상 원산지신고", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  CAN: [{ prefix: "FCA", label: "한-캐나다 FTA 관세율", coType: "원산지증명서 또는 원산지신고", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  CHE: [koreaEftaAgreement],
  CHN: [
    { prefix: "FCN", label: "한-중 FTA 관세율", coType: "기관발급 원산지증명서", evidence: "한-중 FTA 원산지증명서, 직접운송 증빙, 원산지소명자료" },
    { prefix: "FRCCN", label: "RCEP 관세율(중국)", coType: "RCEP 원산지증명서 또는 인증수출자 원산지신고", evidence: "RCEP 원산지증명, 직접운송, 누적 적용 여부" }
  ],
  ...Object.fromEntries(euMemberImportCountryCodes.map((countryCode) => [countryCode, [koreaEuAgreement]])),
  GBR: [{ prefix: "FGB", label: "한-영 FTA 관세율", coType: "원산지신고", evidence: "원산지신고문안, 직접운송 증빙, 생산·원재료 증빙" }],
  IDN: [
    { prefix: "FID", label: "한-인도네시아 CEPA 관세율", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 원산지소명자료" },
    rcepAseanAgreement
  ],
  IND: [{ prefix: "FIN", label: "한-인도 CEPA 관세율", coType: "기관발급 원산지증명서", evidence: "원산지증명서, 직접운송 증빙, 원산지소명자료" }],
  ISL: [koreaEftaAgreement],
  ISR: [{ prefix: "FIL", label: "한-이스라엘 FTA 관세율", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  JPN: [{ prefix: "FRCJP", label: "RCEP 관세율(일본)", coType: "RCEP 원산지증명서 또는 인증수출자 원산지신고", evidence: "RCEP 원산지증명, 직접운송, 원산지소명자료" }],
  KHM: [
    { prefix: "FKH", label: "한-캄보디아 FTA 관세율", coType: "기관발급 원산지증명서", evidence: "원산지증명, 직접운송, 원산지소명자료" },
    koreaAseanAgreement,
    rcepAseanAgreement
  ],
  MYS: [koreaAseanAgreement, rcepAseanAgreement],
  NZL: [
    { prefix: "FNZ", label: "한-뉴질랜드 FTA 관세율", coType: "원산지증명서 또는 원산지신고", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" },
    { prefix: "FRCNZ", label: "RCEP 관세율(뉴질랜드)", coType: "RCEP 원산지증명서 또는 인증수출자 원산지신고", evidence: "RCEP 원산지증명, 직접운송, 누적 적용 여부" }
  ],
  PHL: [
    { prefix: "FPH", label: "한-필리핀 FTA 관세율", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" },
    koreaAseanAgreement,
    rcepAseanAgreement
  ],
  SGP: [koreaAseanAgreement, rcepAseanAgreement],
  THA: [
    koreaAseanAgreement,
    rcepAseanAgreement
  ],
  TUR: [{ prefix: "FTR", label: "한-튀르키예 FTA 관세율", coType: "원산지증명서 또는 원산지신고", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  ARE: [{ prefix: "FAE", label: "한-UAE CEPA 관세율", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  USA: [{ prefix: "FUS", label: "한-미 FTA 관세율", coType: "수입자·수출자·생산자 원산지증명", evidence: "원산지증명서 또는 자율증명, 직접운송, 원산지소명자료" }],
  VNM: [
    { prefix: "FVN", label: "한-베트남 FTA 관세율", coType: "기관발급 원산지증명서", evidence: "KV Form 등 원산지증명, 직접운송 증빙" },
    koreaAseanAgreement,
    rcepAseanAgreement
  ],
  MMR: [koreaAseanAgreement, rcepAseanAgreement],
  BRU: [koreaAseanAgreement, rcepAseanAgreement],
  NOR: [koreaEftaAgreement],
  CHL: [{ prefix: "FCL", label: "한-칠레 FTA 관세율", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  COL: [{ prefix: "FCO", label: "한-콜롬비아 FTA 관세율", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  PER: [{ prefix: "FPE", label: "한-페루 FTA 관세율", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  CRI: [{ prefix: "FCECR", label: "한-중미 FTA 관세율(코스타리카)", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  SLV: [{ prefix: "FCESV", label: "한-중미 FTA 관세율(엘살바도르)", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  HND: [{ prefix: "FCEHN", label: "한-중미 FTA 관세율(온두라스)", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }],
  NIC: [
    { prefix: "FCEINI", label: "한-중미 FTA 관세율(니카라과)", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" },
    { prefix: "FCENI", label: "한-중미 FTA 관세율(니카라과)", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }
  ],
  PAN: [{ prefix: "FCEPA", label: "한-중미 FTA 관세율(파나마)", coType: "협정상 원산지증명", evidence: "원산지증명, 직접운송, 생산·원재료 증빙" }]
};

const importCountryAgreementAliases: Record<string, string> = {
  AE: "ARE",
  AU: "AUS",
  BN: "BRU",
  CA: "CAN",
  CL: "CHL",
  CN: "CHN",
  CO: "COL",
  CR: "CRI",
  GB: "GBR",
  ID: "IDN",
  IL: "ISR",
  IN: "IND",
  IS: "ISL",
  JP: "JPN",
  KH: "KHM",
  LI: "CHE",
  MM: "MMR",
  MY: "MYS",
  NI: "NIC",
  NZ: "NZL",
  NO: "NOR",
  PA: "PAN",
  PE: "PER",
  PH: "PHL",
  SG: "SGP",
  CH: "CHE",
  SV: "SLV",
  TH: "THA",
  TR: "TUR",
  US: "USA",
  VN: "VNM"
};

function canonicalRateType(rateType: string) {
  return rateType.trim().toUpperCase().replace(/\d+$/, "");
}

function normalizedRateType(rateType: string) {
  return rateType.trim().toUpperCase();
}

function rateTypeSuffix(rateType: string) {
  return normalizedRateType(rateType).match(/\d+$/)?.[0] ?? "";
}

function isFtaRateType(rateType: string) {
  const canonical = canonicalRateType(rateType);
  return canonical.startsWith("F") && canonical.length > 1;
}

function isNorthKoreaTariff(rateType: string) {
  return canonicalRateType(rateType) === "U";
}

function isNorthKoreaCountry(countryCode: string) {
  return ["KP", "PRK"].includes(countryCode.trim().toUpperCase());
}

const leastDevelopedCountryCodes = new Set([
  "AF",
  "AFG",
  "AO",
  "AGO",
  "BD",
  "BGD",
  "BJ",
  "BEN",
  "BF",
  "BFA",
  "BT",
  "BTN",
  "BI",
  "BDI",
  "KH",
  "KHM",
  "CF",
  "CAF",
  "TD",
  "TCD",
  "KM",
  "COM",
  "CD",
  "COD",
  "DJ",
  "DJI",
  "TL",
  "TLS",
  "GQ",
  "GNQ",
  "ER",
  "ERI",
  "ET",
  "ETH",
  "GM",
  "GMB",
  "GN",
  "GIN",
  "GW",
  "GNB",
  "HT",
  "HTI",
  "KI",
  "KIR",
  "LA",
  "LAO",
  "LS",
  "LSO",
  "LR",
  "LBR",
  "MG",
  "MDG",
  "MW",
  "MWI",
  "ML",
  "MLI",
  "MR",
  "MRT",
  "MZ",
  "MOZ",
  "MM",
  "MMR",
  "NP",
  "NPL",
  "NE",
  "NER",
  "RW",
  "RWA",
  "ST",
  "STP",
  "SN",
  "SEN",
  "SL",
  "SLE",
  "SB",
  "SLB",
  "SO",
  "SOM",
  "SS",
  "SSD",
  "SD",
  "SDN",
  "TZ",
  "TZA",
  "TG",
  "TGO",
  "TV",
  "TUV",
  "UG",
  "UGA",
  "YE",
  "YEM",
  "ZM",
  "ZMB"
]);

function isLeastDevelopedCountryTariff(rateType: string) {
  return canonicalRateType(rateType) === "R";
}

function isLeastDevelopedCountry(countryCode: string) {
  return leastDevelopedCountryCodes.has(countryCode.trim().toUpperCase());
}

function isAllCountries(countryCode: string) {
  return countryCode.trim().toUpperCase() === "ALL";
}

function commonTariffTargetLabel(rateType: string) {
  const normalized = normalizedRateType(rateType);
  const canonical = canonicalRateType(rateType);
  const suffix = rateTypeSuffix(rateType);

  if (/^E[123]/.test(normalized)) {
    const target = normalized.startsWith("E1") ? "일반" : normalized.startsWith("E2") ? "방글라데시" : "라오스";
    const detail = normalized.slice(2);
    return detail ? `${target} 세부 ${detail}` : target;
  }

  if (canonical === "W") {
    if (suffix === "1") return "추천";
    if (suffix === "2") return "미추천";
  }

  if (canonical === "G") {
    if (suffix) return `세부${suffix}`;
  }

  if (canonical === "P") {
    if (suffix) return `세부${suffix}`;
  }

  if (canonical === "C" && suffix) {
    return `세부${suffix}`;
  }

  return "";
}

function isAsiaPacificAgreementTariff(rateType: string) {
  return /^E[123]?/.test(normalizedRateType(rateType));
}

function asiaPacificAgreementRateTypeForCountry(countryCode: string) {
  const country = countryCode.trim().toUpperCase();
  if (["BD", "BGD"].includes(country)) return "E2";
  if (["LA", "LAO"].includes(country)) return "E3";
  if (["CN", "CHN", "IN", "IND", "LK", "LKA", "MN", "MNG"].includes(country)) return "E1";
  return null;
}

function isCommonTariffVisibleForCountry(tariff: Pick<ImportTariffDisplayRow, "rateType">, countryCode: string) {
  if (!isAsiaPacificAgreementTariff(tariff.rateType)) return true;
  const countryRateType = asiaPacificAgreementRateTypeForCountry(countryCode);
  return countryRateType ? normalizedRateType(tariff.rateType).startsWith(countryRateType) : false;
}

function withTargetLabel(label: string, rateType: string) {
  const target = commonTariffTargetLabel(rateType);
  return target ? `${label}(${target})` : label;
}

function commonTariffLabel(rateType: string, fallback: string) {
  const canonical = canonicalRateType(rateType);
  if (canonical === "A" || canonical === "BASIC") return "기본관세";
  if (canonical === "C" || canonical === "WTO") return withTargetLabel("WTO 협정관세", rateType);
  if (canonical === "D") return "WTO 협정개발도상국간 양허관세";
  if (isAsiaPacificAgreementTariff(rateType)) return withTargetLabel("아·태협정 양허관세", rateType);
  if (canonical === "F") return "국제협력관세";
  if (canonical === "G") return withTargetLabel("개발도상국간 양허관세", rateType);
  if (canonical === "L") return "조정관세";
  if (canonical === "P") return withTargetLabel("할당관세", rateType);
  if (canonical === "R") return "최빈개발도상국 특혜관세";
  if (canonical === "B") return "잠정세율";
  if (canonical === "U") return "북한산 관세율";
  if (canonical === "W") return withTargetLabel("WTO 양허관세", rateType);
  return fallback;
}

function agreementForRateType(rateType: string, countryCode: string) {
  const canonical = canonicalRateType(rateType);
  if (isAllCountries(countryCode)) {
    return Object.values(countryAgreementOptions).flat().find((agreement) => canonical === agreement.prefix);
  }

  const normalizedCountry = countryCode.toUpperCase();
  const agreementCountry = importCountryAgreementAliases[normalizedCountry] ?? normalizedCountry;
  return (countryAgreementOptions[agreementCountry] ?? []).find((agreement) => canonical === agreement.prefix);
}

export function isCommonImportTariff(tariff: Pick<ImportTariffDisplayRow, "rateType">) {
  return !isFtaRateType(tariff.rateType) && !isNorthKoreaTariff(tariff.rateType) && !isLeastDevelopedCountryTariff(tariff.rateType);
}

export function displayImportTariffLabel(tariff: Pick<ImportTariffDisplayRow, "rateType" | "label">, countryCode: string) {
  const agreement = agreementForRateType(tariff.rateType, countryCode);
  if (agreement) return agreement.label;
  if (isCommonImportTariff(tariff)) return commonTariffLabel(tariff.rateType, tariff.label);
  if (isLeastDevelopedCountryTariff(tariff.rateType) || isNorthKoreaTariff(tariff.rateType)) {
    return commonTariffLabel(tariff.rateType, tariff.label);
  }
  return tariff.label;
}

function tariffDisplayScore(tariff: ImportTariffDisplayRow) {
  let score = 0;

  if (tariff.countryGroup && !/^[0-9]+$/.test(tariff.countryGroup)) score += 10;
  if (tariff.sourceVersion.includes("api030")) score += 5;

  return score;
}

const cielAgreementOrder = [
  "FEF",
  "FGB",
  "FEU",
  "FCN",
  "E1",
  "E2",
  "E3",
  "FIN",
  "FAS",
  "FVN",
  "FKH",
  "FPH",
  "FID",
  "FAU",
  "FNZ",
  "FTR",
  "FIL",
  "FAE",
  "FRCCN",
  "FRCAS",
  "FRCAU",
  "FRCNZ",
  "FRCJP",
  "FCA",
  "FUS",
  "FCECR",
  "FCESV",
  "FCEHN",
  "FCEINI",
  "FCENI",
  "FCEPA",
  "FCO",
  "FPE",
  "FCL"
];

function agreementDisplayOrder(rateType: string) {
  const normalized = normalizedRateType(rateType);
  const canonical = canonicalRateType(rateType);
  const exactIndex = cielAgreementOrder.findIndex((item) => normalized.startsWith(item));
  if (exactIndex >= 0) return exactIndex;
  const canonicalIndex = cielAgreementOrder.findIndex((item) => canonical.startsWith(item));
  return canonicalIndex >= 0 ? canonicalIndex : 999;
}

function commonDisplayOrder(rateType: string) {
  const canonical = canonicalRateType(rateType);
  if (canonical === "A" || canonical === "BASIC") return 10;
  if (canonical === "C" || canonical === "WTO") return 20;
  if (canonical === "D") return 30;
  if (canonical === "R") return 40;
  if (canonical === "U") return 50;
  if (canonical === "W") return 310;
  if (canonical === "G") return 320;
  if (canonical === "F") return 330;
  if (canonical === "L") return 340;
  if (canonical === "P") return 350;
  if (canonical === "B") return 360;
  return 900;
}

function importTariffDisplayOrder(tariff: ImportTariffDisplayRow) {
  if (isFtaRateType(tariff.rateType) || isAsiaPacificAgreementTariff(tariff.rateType)) {
    return 100 + agreementDisplayOrder(tariff.rateType);
  }

  return commonDisplayOrder(tariff.rateType);
}

function sortImportTariffsForDisplay<T extends ImportTariffDisplayRow>(tariffs: T[]) {
  return tariffs.toSorted((a, b) =>
    importTariffDisplayOrder(a) - importTariffDisplayOrder(b)
    || agreementDisplayOrder(a.rateType) - agreementDisplayOrder(b.rateType)
    || normalizedRateType(a.rateType).localeCompare(normalizedRateType(b.rateType))
    || a.rateText.localeCompare(b.rateText)
  );
}

function uniqueDisplayTariffs<T extends ImportTariffDisplayRow>(tariffs: T[], countryCode: string) {
  return Array.from(
    new Map(
      tariffs
        .toSorted((a, b) => tariffDisplayScore(a) - tariffDisplayScore(b))
        .map((tariff) => [[tariff.rateType, tariff.rateText, displayImportTariffLabel(tariff, countryCode)].join("|"), tariff])
    ).values()
  );
}

export function filterImportTariffsForCountry<T extends ImportTariffDisplayRow>(tariffs: T[], countryCode: string) {
  if (isAllCountries(countryCode)) {
    return sortImportTariffsForDisplay(uniqueDisplayTariffs(tariffs, countryCode));
  }

  const filtered = tariffs.filter(
    (tariff) =>
      (isCommonImportTariff(tariff) && isCommonTariffVisibleForCountry(tariff, countryCode)) ||
      Boolean(agreementForRateType(tariff.rateType, countryCode)) ||
      (isNorthKoreaCountry(countryCode) && isNorthKoreaTariff(tariff.rateType)) ||
      (isLeastDevelopedCountry(countryCode) && isLeastDevelopedCountryTariff(tariff.rateType))
  );

  return sortImportTariffsForDisplay(uniqueDisplayTariffs(filtered, countryCode));
}

export function importTariffApplicationPriorityNumber(rateType: string) {
  const canonical = canonicalRateType(rateType);
  if (isFtaRateType(rateType)) return 2;
  if (isAsiaPacificAgreementTariff(rateType)) return 3;
  if (["C", "D", "E", "F", "G", "W", "WTO"].includes(canonical)) return 3;
  if (["L", "P"].includes(canonical)) return 4;
  if (canonical === "R") return 5;
  if (canonical === "B") return 6;
  if (canonical === "A" || canonical === "BASIC") return 7;
  return 99;
}

export function importTariffApplicationPriority(tariff: Pick<ImportTariffDisplayRow, "rateType">) {
  const priority = importTariffApplicationPriorityNumber(tariff.rateType);

  return priority === 99 ? "기타" : `${priority}순위`;
}

export function importTariffDetailDescription(tariff: Pick<ImportTariffDisplayRow, "rateType" | "label">, displayLabel: string, countryCode?: string) {
  const canonical = canonicalRateType(tariff.rateType);
  const target = commonTariffTargetLabel(tariff.rateType);
  const agreement = countryCode ? agreementForRateType(tariff.rateType, countryCode) : undefined;

  if (canonical === "A" || canonical === "BASIC") {
    return {
      title: "기본관세",
      summary: "관세율표에 정해진 기본 세율입니다.",
      detail: "FTA, WTO 협정관세, 잠정세율, 할당관세 등 더 높은 적용순위의 세율이 적용되지 않는 경우 비교 기준으로 사용됩니다. 실제 신고에서는 다른 우선 세율이 있는지 함께 확인합니다."
    };
  }

  if (canonical === "C" || canonical === "WTO") {
    return {
      title: displayLabel,
      summary: target ? `WTO 협정관세 중 ${target} 행입니다.` : "WTO 회원국 등에 대해 적용을 검토하는 협정세율 계열입니다.",
      detail: "품목별 관세율표에 C 계열 코드로 등록된 세율입니다. 같은 품목에 세부 코드가 여러 개 있으면 세율이나 조건이 다를 수 있어 각각 별도 행으로 표시합니다."
    };
  }

  if (isAsiaPacificAgreementTariff(tariff.rateType)) {
    return {
      title: displayLabel,
      summary: target ? `아시아·태평양무역협정(APTA) 양허세율 중 ${target} 적용대상 행입니다.` : "아시아·태평양무역협정(APTA) 양허세율입니다.",
      detail: target
        ? `같은 아·태협정 양허관세라도 적용대상별 세율이 다를 수 있어 ${target} 행을 별도로 표시합니다. 선택한 수입국, 원산지, 협정 적용요건 충족 여부를 함께 확인해야 합니다.`
        : "아·태협정 양허관세는 적용대상 국가 또는 그룹별로 세율이 나뉠 수 있습니다. 동일 협정 안에 여러 행이 있으면 각각 별도 세율로 확인합니다."
    };
  }

  if (canonical === "W") {
    return {
      title: displayLabel,
      summary: target ? `WTO 양허관세 중 ${target} 구분 행입니다.` : "WTO 양허표에 따라 특정 조건을 붙여 운영될 수 있는 세율입니다.",
      detail: "시장접근물량, 추천·미추천, 용도세율, 적용국가구분 등 추가 조건이 붙을 수 있습니다. 같은 WTO 양허관세라도 W1/W2처럼 세부 코드가 다르면 별도 행으로 표시합니다."
    };
  }

  if (canonical.startsWith("FRC")) {
    return {
      title: displayLabel,
      summary: "RCEP 협정세율입니다.",
      detail: `${agreement?.coType ?? "RCEP 원산지증명 또는 원산지신고"}와 직접운송 등 협정 적용 요건을 충족하는 경우에 검토합니다. ${agreement?.evidence ?? "국가별 RCEP 세율과 원산지 기준, 누적 적용 여부를 함께 확인합니다."}`
    };
  }

  if (canonical.startsWith("F") && canonical.length > 1) {
    return {
      title: displayLabel,
      summary: "선택 국가와 연결된 FTA·CEPA 협정세율입니다.",
      detail: `협정관세는 자동 적용되는 세율이 아닙니다. ${agreement?.coType ?? "협정상 원산지증명"}과 직접운송, 협정별 제출·보관 요건을 충족하는 경우에 적용을 검토합니다. ${agreement?.evidence ?? "원산지 기준 충족 자료와 거래·운송 증빙을 함께 확인합니다."}`
    };
  }

  if (canonical === "U") {
    return {
      title: "북한산 관세율",
      summary: "북한산 물품에 관한 별도 세율입니다.",
      detail: "일반 국가 선택 조회에서는 표시하지 않습니다. 해당 원산지 조건으로 조회되는 경우에만 별도 확인 대상으로 봅니다."
    };
  }

  if (canonical === "L") {
    return {
      title: "조정관세",
      summary: "특정 품목의 수입 조절 등을 위해 별도로 정한 탄력관세입니다.",
      detail: "적용 기간과 대상 품목이 정해질 수 있으므로 기준일과 세율구분을 함께 확인합니다."
    };
  }

  if (canonical === "P") {
    return {
      title: displayLabel,
      summary: target ? `할당관세 중 ${target} 행입니다.` : "일정 물량이나 조건에 따라 낮거나 높은 세율을 적용하는 탄력관세입니다.",
      detail: "추천, 물량, 기간, 용도 등 추가 조건이 붙을 수 있습니다. 같은 할당관세라도 세부 코드가 다르면 별도 행으로 표시하고, 용도세율구분이 있으면 함께 확인합니다."
    };
  }

  if (canonical === "G") {
    return {
      title: displayLabel,
      summary: target ? `개발도상국간 양허관세 중 ${target} 행입니다.` : "개발도상국간 양허관세입니다.",
      detail: "대상 국가, 원산지, 세부 코드에 따라 적용 여부와 세율이 달라질 수 있습니다. 같은 G 계열이라도 세부 코드가 다르면 별도 행으로 표시합니다."
    };
  }

  return {
    title: displayLabel,
    summary: "품목별 관세율표에 별도 세율구분으로 등록된 관세율입니다.",
    detail: "적용 조건은 세율코드, 적용국가구분, 용도세율구분, 기준일을 함께 확인해야 합니다."
  };
}
