import {
  checksumText,
  fetchPublicDataSnapshot,
  type PublicDataSnapshot
} from "@/server/integrations/public-data/client";

export type CustomsOpenApiSource =
  | "customs_confirmation"
  | "hs_code"
  | "hs_code_navigation"
  | "tariff_rate"
  | "statistical_code"
  | "exchange_rate"
  | "cargo_progress"
  | "shed_info";

type CustomsApiConfig = {
  endpointEnvName: string;
  defaultEndpointUrl?: string;
  serviceKeyEnvName?: string;
  serviceKeyParamName: "crkyCn" | "serviceKey";
  sourceName: string;
  sourceVersion: string;
};

const configs: Record<CustomsOpenApiSource, CustomsApiConfig> = {
  customs_confirmation: {
    endpointEnvName: "CUSTOMS_API_CUSTOMS_CONFIRMATION_URL",
    serviceKeyParamName: "crkyCn",
    sourceName: "관세청 세관장확인대상 법령코드 조회",
    sourceVersion: "myc-openapi-api029-v1.0"
  },
  hs_code: {
    endpointEnvName: "CUSTOMS_API_HS_CODE_URL",
    serviceKeyEnvName: "CUSTOMS_API_HS_CODE_SERVICE_KEY",
    serviceKeyParamName: "crkyCn",
    sourceName: "관세청 HS부호 조회",
    sourceVersion: "myc-openapi-api018-v1.0"
  },
  hs_code_navigation: {
    endpointEnvName: "CUSTOMS_API_HS_CODE_NAVIGATION_URL",
    serviceKeyEnvName: "CUSTOMS_API_HS_CODE_NAVIGATION_SERVICE_KEY",
    serviceKeyParamName: "crkyCn",
    sourceName: "관세청 HS CODE 내비게이션 조회",
    sourceVersion: "myc-openapi-api043-v1.0"
  },
  tariff_rate: {
    endpointEnvName: "CUSTOMS_API_TARIFF_RATE_URL",
    serviceKeyEnvName: "CUSTOMS_API_TARIFF_RATE_SERVICE_KEY",
    serviceKeyParamName: "crkyCn",
    sourceName: "관세청 관세율 조회",
    sourceVersion: "myc-openapi-api030-v1.0"
  },
  statistical_code: {
    endpointEnvName: "CUSTOMS_API_STATISTICAL_CODE_URL",
    serviceKeyEnvName: "CUSTOMS_API_STATS_CODE_SERVICE_KEY",
    serviceKeyParamName: "crkyCn",
    sourceName: "관세청 통계부호내역조회",
    sourceVersion: "myc-openapi-api019-v1.0"
  },
  exchange_rate: {
    endpointEnvName: "CUSTOMS_API_EXCHANGE_RATE_URL",
    defaultEndpointUrl: "https://unipass.customs.go.kr:38010/ext/rest/trifFxrtInfoQry/retrieveTrifFxrtInfo",
    serviceKeyEnvName: "CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY",
    serviceKeyParamName: "crkyCn",
    sourceName: "관세청 관세환율 정보",
    sourceVersion: "myc-openapi-api012-v1.0"
  },
  cargo_progress: {
    endpointEnvName: "CUSTOMS_API_CARGO_PROGRESS_URL",
    defaultEndpointUrl: "https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo",
    serviceKeyEnvName: "CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY",
    serviceKeyParamName: "crkyCn",
    sourceName: "관세청_화물통관진행정보",
    sourceVersion: "myc-openapi-api001-v1.0"
  },
  shed_info: {
    endpointEnvName: "CUSTOMS_API_SHED_INFO_URL",
    defaultEndpointUrl: "https://unipass.customs.go.kr:38010/ext/rest/shedInfoQry/retrieveShedInfo",
    serviceKeyEnvName: "CUSTOMS_API_SHED_INFO_SERVICE_KEY",
    serviceKeyParamName: "crkyCn",
    sourceName: "관세청 장치장 정보",
    sourceVersion: "myc-openapi-api005-v1.0"
  }
};

function resolveEndpointUrl(config: CustomsApiConfig) {
  const configuredUrl = process.env[config.endpointEnvName]?.trim();

  if (
    configuredUrl
    && (
      config.endpointEnvName === "CUSTOMS_API_EXCHANGE_RATE_URL"
      || config.endpointEnvName === "CUSTOMS_API_CARGO_PROGRESS_URL"
      || config.endpointEnvName === "CUSTOMS_API_SHED_INFO_URL"
    )
  ) {
    try {
      const url = new URL(configuredUrl);
      if (url.hostname === "unipass.customs.go.kr" && !url.port) {
        url.port = "38010";
      }

      return url.toString();
    } catch {
      return configuredUrl;
    }
  }

  return configuredUrl || config.defaultEndpointUrl;
}

export function hasCustomsOpenApiEnv(source: CustomsOpenApiSource) {
  if (source === "cargo_progress" && process.env.CUSTOMS_API_CARGO_PROGRESS_RELAY_URL?.trim()) {
    return true;
  }

  const config = configs[source];
  const endpointUrl = resolveEndpointUrl(config);
  const serviceKey = (config.serviceKeyEnvName ? process.env[config.serviceKeyEnvName] : undefined) || process.env.CUSTOMS_API_SERVICE_KEY || process.env.PUBLIC_DATA_SERVICE_KEY;

  return Boolean(endpointUrl && serviceKey);
}

export async function fetchCustomsOpenApiSnapshot(
  source: CustomsOpenApiSource,
  params: Record<string, string | number | null | undefined>,
  options?: { timeoutMs?: number }
): Promise<PublicDataSnapshot> {
  const config = configs[source];
  const endpointUrl = resolveEndpointUrl(config);
  const serviceKey = (config.serviceKeyEnvName ? process.env[config.serviceKeyEnvName] : undefined) || process.env.CUSTOMS_API_SERVICE_KEY || process.env.PUBLIC_DATA_SERVICE_KEY;

  if (!endpointUrl || !serviceKey) {
    throw new Error(`${config.endpointEnvName} 또는 ${config.serviceKeyEnvName ?? "CUSTOMS_API_SERVICE_KEY"}가 설정되지 않았습니다.`);
  }

  return fetchPublicDataSnapshot({
    endpointUrl,
    serviceKey,
    serviceKeyParamName: config.serviceKeyParamName,
    params,
    sourceName: config.sourceName,
    sourceVersion: config.sourceVersion,
    timeoutMs: options?.timeoutMs
  });
}

export async function fetchCustomsCargoProgressSnapshot(
  params: Record<string, string | number | null | undefined>,
  options?: { timeoutMs?: number }
): Promise<PublicDataSnapshot> {
  const relayUrl = process.env.CUSTOMS_API_CARGO_PROGRESS_RELAY_URL?.trim();

  if (!relayUrl) {
    return fetchCustomsOpenApiSnapshot("cargo_progress", params, options);
  }

  const timeoutMs = options?.timeoutMs ?? Number(process.env.PUBLIC_DATA_REQUEST_TIMEOUT_MS || 10000);
  const response = await fetch(relayUrl, {
    method: "POST",
    headers: {
      Accept: "application/json, application/xml, text/xml;q=0.9, */*;q=0.8",
      "Content-Type": "application/json",
      ...(process.env.CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN
        ? { Authorization: `Bearer ${process.env.CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN}` }
        : {})
    },
    body: JSON.stringify({ params }),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs)
  });
  const contentType = response.headers.get("content-type");
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`API001 relay 호출 실패: ${response.status} ${response.statusText} ${bodyText.slice(0, 200)}`.trim());
  }

  let rawText = bodyText;
  let sourceUrl = relayUrl;
  let retrievedAt = new Date().toISOString();

  if (contentType?.includes("application/json")) {
    const payload = JSON.parse(bodyText) as {
      rawText?: string;
      sourceUrl?: string;
      retrievedAt?: string;
    };
    rawText = payload.rawText ?? "";
    sourceUrl = payload.sourceUrl ?? relayUrl;
    retrievedAt = payload.retrievedAt ?? retrievedAt;
  }

  return {
    sourceName: configs.cargo_progress.sourceName,
    sourceUrl,
    sourceVersion: `${configs.cargo_progress.sourceVersion}+relay`,
    retrievedAt,
    checksum: checksumText(rawText),
    contentType,
    rawText
  };
}

export function buildCustomsConfirmationQuery(input: {
  hskCode: string;
  direction: "import" | "export";
}) {
  return {
    hsSgn: input.hskCode.replace(/[^0-9]/g, ""),
    imexTp: input.direction === "import" ? "2" : "1"
  };
}

export function buildCustomsTariffRateQuery(input: {
  hskCode: string;
  tariffTypeCode?: string;
}) {
  return {
    hsSgn: input.hskCode.replace(/[^0-9]/g, ""),
    trrtTpcd: input.tariffTypeCode
  };
}

export function buildCustomsHsCodeQuery(input: {
  hskCode?: string;
  productName?: string;
  language?: "ko" | "en";
}) {
  return {
    hsSgn: input.hskCode?.replace(/[^0-9]/g, ""),
    prnm: input.productName,
    koenTp: input.language === "en" ? "2" : "1"
  };
}

export function buildCustomsHsCodeNavigationQuery(input: {
  hskPattern: string;
}) {
  return {
    hsSgn: input.hskPattern.replace(/[^0-9*]/g, "")
  };
}

export function buildCustomsExchangeRateQuery(input: {
  applyStartDate: string;
  direction?: "import" | "export";
}) {
  return {
    qryYymmDd: input.applyStartDate.replace(/-/g, ""),
    imexTp: input.direction === "export" ? "1" : "2"
  };
}

export function buildCustomsCargoProgressQuery(input: {
  cargoManagementNo?: string;
  masterBlNo?: string;
  houseBlNo?: string;
  blYear?: string;
}) {
  return {
    cargMtNo: input.cargoManagementNo?.trim(),
    mblNo: input.masterBlNo?.trim(),
    hblNo: input.houseBlNo?.trim(),
    blYy: input.blYear?.trim()
  };
}

export function buildCustomsShedInfoQuery(input: {
  customsOfficeCode?: string;
  shedCode?: string;
}) {
  return {
    jrsdCstmCd: input.customsOfficeCode?.trim(),
    snarSgn: input.shedCode?.trim()
  };
}

function xmlValue(source: string, tagName: string) {
  const match = source.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function firstXmlValue(source: string, tagNames: string[]) {
  for (const tagName of tagNames) {
    const value = xmlValue(source, tagName);
    if (value) return value;
  }

  return "";
}

function xmlBlocks(source: string, tagName: string) {
  return Array.from(source.matchAll(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "gi"))).map((match) => match[1] ?? "");
}

export type CustomsConfirmationRequirementItem = {
  hskCode: string;
  direction: "import" | "export";
  lawCode: string;
  relatedLaw: string;
  agencyCode: string;
  agency: string;
  requirementDocumentName: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

export type CustomsTariffRateItem = {
  hskCode: string;
  rateTypeCode: string;
  rateTypeName: string;
  dutyRate: string;
  unitDuty: string;
  basePrice: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

export type CustomsStatisticalCodeItem = {
  codeType: string;
  code: string;
  koreanName: string;
  koreanAbbreviation: string;
  englishAbbreviation: string;
  englishNote: string;
  internalTaxRate: string;
};

export type CustomsHsCodeSearchItem = {
  hskCode: string;
  koreanName: string;
  englishName: string;
  quantityUnit: string;
  weightUnit: string;
  rateText: string;
  rateTypeCode: string;
};

export type CustomsHsCodeNavigationItem = {
  hskCodePattern: string;
  rank: string;
  productName: string;
  lineCount: string;
};

export type CustomsExchangeRateItem = {
  countryCode: string;
  currencyUnitName: string;
  currencyCode: string;
  rate: string;
  effectiveFrom: string | null;
  direction: "import" | "export";
};

export type CustomsCargoProgressSummary = {
  cargoManagementNo: string;
  masterBlNo: string;
  houseBlNo: string;
  progressStatus: string;
  progressStatusCode: string;
  declarationNo: string;
  vesselName: string;
  packageCount: string;
  grossWeight: string;
  weightUnit: string;
  portName: string;
  arrivalDate: string | null;
};

export type CustomsCargoProgressEvent = {
  eventTime: string | null;
  status: string;
  displayStatus?: string;
  statusCode: string;
  location: string;
  shedCode: string;
  shedName: string;
  agency: string;
  processingDetails: string;
};

export type CustomsCargoProgressResult = {
  summary: CustomsCargoProgressSummary;
  events: CustomsCargoProgressEvent[];
};

function yyyymmddToDate(value: string) {
  return /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : null;
}

export function parseCustomsConfirmationRequirementsXml(rawText: string): CustomsConfirmationRequirementItem[] {
  return xmlBlocks(rawText, "CcctLworCdQryRsltVo").map((block) => {
    const directionCode = xmlValue(block, "imexTp");
    return {
      hskCode: xmlValue(block, "hsSgn"),
      direction: directionCode === "1" ? "export" : "import",
      lawCode: xmlValue(block, "dcerCfrmLworCd"),
      relatedLaw: xmlValue(block, "dcerCfrmLworNm"),
      agencyCode: xmlValue(block, "reqApreIttCd"),
      agency: xmlValue(block, "reqApreIttNm"),
      requirementDocumentName: xmlValue(block, "reqCfrmIstmNm"),
      effectiveFrom: yyyymmddToDate(xmlValue(block, "aplyStrtDt")),
      effectiveTo: yyyymmddToDate(xmlValue(block, "aplyEndDt"))
    };
  });
}

export function parseCustomsTariffRatesXml(rawText: string): CustomsTariffRateItem[] {
  return xmlBlocks(rawText, "TrrtQryRsltVo").map((block) => ({
    hskCode: xmlValue(block, "hsSgn"),
    rateTypeCode: xmlValue(block, "trrtTpcd"),
    rateTypeName: xmlValue(block, "trrtTpNm"),
    dutyRate: xmlValue(block, "trrt"),
    unitDuty: xmlValue(block, "prutXamt"),
    basePrice: xmlValue(block, "basePrc"),
    effectiveFrom: yyyymmddToDate(xmlValue(block, "aplyStrtDt")),
    effectiveTo: yyyymmddToDate(xmlValue(block, "aplyEndDt"))
  }));
}

export function parseCustomsHsCodeSearchXml(rawText: string): CustomsHsCodeSearchItem[] {
  return xmlBlocks(rawText, "hsSgnSrchRsltVo").map((block) => ({
    hskCode: xmlValue(block, "hsSgn"),
    koreanName: xmlValue(block, "korePrnm"),
    englishName: xmlValue(block, "englPrnm"),
    quantityUnit: xmlValue(block, "qtyUt"),
    weightUnit: xmlValue(block, "wghtUt"),
    rateText: xmlValue(block, "txrt"),
    rateTypeCode: xmlValue(block, "txtpSgn")
  })).filter((item) => item.hskCode || item.koreanName);
}

export function parseCustomsHsCodeNavigationXml(rawText: string): CustomsHsCodeNavigationItem[] {
  return xmlBlocks(rawText, "cmtrStatsQryRsltVo").map((block) => ({
    hskCodePattern: xmlValue(block, "hs10Sgn"),
    rank: xmlValue(block, "acrsTcntRnk"),
    productName: xmlValue(block, "prlstNm"),
    lineCount: xmlValue(block, "prlstLnCnt")
  })).filter((item) => item.hskCodePattern || item.productName);
}

export function parseCustomsExchangeRatesXml(rawText: string): CustomsExchangeRateItem[] {
  return xmlBlocks(rawText, "trifFxrtInfoQryRsltVo").map((block) => {
    const directionCode = xmlValue(block, "imexTp");
    const direction: "import" | "export" = directionCode === "1" ? "export" : "import";

    return {
      countryCode: xmlValue(block, "cntySgn"),
      currencyUnitName: xmlValue(block, "mtryUtNm"),
      currencyCode: xmlValue(block, "currSgn"),
      rate: xmlValue(block, "fxrt"),
      effectiveFrom: yyyymmddToDate(xmlValue(block, "aplyBgnDt")),
      direction
    };
  }).filter((item) => item.currencyCode || item.rate);
}

function normalizeDateTime(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length >= 12) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)} ${digits.slice(8, 10)}:${digits.slice(10, 12)}`;
  }

  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  return value || null;
}

export function parseCustomsCargoProgressXml(rawText: string): CustomsCargoProgressResult | null {
  const summaryBlock =
    xmlBlocks(rawText, "cargCsclPrgsInfoQryRsltVo")[0]
    ?? xmlBlocks(rawText, "CargCsclPrgsInfoQryRsltVo")[0]
    ?? xmlBlocks(rawText, "cargCsclPrgsInfoQryVo")[0]
    ?? xmlBlocks(rawText, "CargCsclPrgsInfoQryVo")[0]
    ?? rawText;

  const detailBlocks = [
    ...xmlBlocks(rawText, "cargCsclPrgsInfoDtlQryRsltVo"),
    ...xmlBlocks(rawText, "CargCsclPrgsInfoDtlQryRsltVo"),
    ...xmlBlocks(rawText, "cargCsclPrgsInfoQryDtlVo"),
    ...xmlBlocks(rawText, "cargCsclPrgsInfoDtlQryVo"),
    ...xmlBlocks(rawText, "CargCsclPrgsInfoDtlQryVo")
  ];

  const summary: CustomsCargoProgressSummary = {
    cargoManagementNo: firstXmlValue(summaryBlock, ["cargMtNo", "cargMngNo", "cargNo"]),
    masterBlNo: firstXmlValue(summaryBlock, ["mblNo", "blNo"]),
    houseBlNo: firstXmlValue(summaryBlock, ["hblNo"]),
    progressStatus: firstXmlValue(summaryBlock, ["prgsStts", "csclPrgsStts", "cargPrgsStts", "prgsSttsNm"]),
    progressStatusCode: firstXmlValue(summaryBlock, ["prgsStCd", "csclPrgsSttsCd", "cargPrgsSttsCd"]),
    declarationNo: firstXmlValue(summaryBlock, ["dclrNo", "csmhDclrNo", "imptDclrNo"]),
    vesselName: firstXmlValue(summaryBlock, ["shipNm", "vydf"]),
    packageCount: firstXmlValue(summaryBlock, ["pckGcnt", "pckQty", "pkgCnt"]),
    grossWeight: firstXmlValue(summaryBlock, ["ttwg", "totWght", "grsWght"]),
    weightUnit: firstXmlValue(summaryBlock, ["wghtUt", "ttwgUt"]),
    portName: firstXmlValue(summaryBlock, ["prnm", "ldprNm", "dsprNm", "cstmNm"]),
    arrivalDate: yyyymmddToDate(firstXmlValue(summaryBlock, ["etprDt", "etprCstmDt", "arrvDt"]))
  };

  const parsedEvents = detailBlocks.map((block) => {
    const statusName = firstXmlValue(block, ["cargTrcnRelaBsopTpcdNm", "prgsStts", "csclPrgsStts", "sttsNm"]);
    const statusCode = firstXmlValue(block, ["cargTrcnRelaBsopTpcd", "prgsStCd", "csclPrgsSttsCd"]);
    const statusCodeLooksLikeName = /[가-힣]/.test(statusCode);

    return {
      eventTime: normalizeDateTime(firstXmlValue(block, ["prcsDttm", "rlbrDttm", "prcsDt", "sttsDttm"])),
      status: statusName || (statusCodeLooksLikeName ? statusCode : ""),
      statusCode: statusCodeLooksLikeName ? "" : statusCode,
      location: firstXmlValue(block, ["shedNm", "prnm", "cstmNm", "whNm"]),
      shedCode: firstXmlValue(block, ["shedSgn"]).split("/")[0]?.trim() ?? "",
      shedName: firstXmlValue(block, ["shedNm"]),
      agency: firstXmlValue(block, ["agncNm", "trnpAgntNm", "pckCmpyNm"]),
      processingDetails: firstXmlValue(block, ["rlbrCn", "rlbrBssNo", "bfhnGdncCn", "prcsDls", "rmrk", "dclrNo"])
    };
  }).filter((item) => item.status || item.statusCode || item.eventTime);
  const seenEventKeys = new Set<string>();
  const events = parsedEvents.filter((event) => {
    const key = [
      event.eventTime,
      event.status,
      event.statusCode,
      event.shedCode,
      event.shedName,
      event.processingDetails
    ].map((value) => value || "").join("|");

    if (seenEventKeys.has(key)) return false;
    seenEventKeys.add(key);
    return true;
  });

  if (!summary.cargoManagementNo && !summary.masterBlNo && !summary.houseBlNo && !summary.progressStatus && events.length === 0) {
    return null;
  }

  return { summary, events };
}

export function buildCustomsStatisticalCodeQuery(input: {
  codeType: string;
  codeName?: string;
  code?: string;
}) {
  return {
    statsSgnTp: input.codeType,
    cdValtValNm: input.codeName,
    cdValtVal: input.code
  };
}

export function parseCustomsStatisticalCodesXml(rawText: string, codeType: string): CustomsStatisticalCodeItem[] {
  const primaryRows = xmlBlocks(rawText, "othStatsSgnQryVo").map((block) => ({
    codeType,
    code: xmlValue(block, "statsSgn"),
    koreanName: xmlValue(block, "koreBrkd"),
    koreanAbbreviation: xmlValue(block, "koreAbrt"),
    englishAbbreviation: xmlValue(block, "englAbrt"),
    englishNote: "",
    internalTaxRate: xmlValue(block, "itxRt")
  }));

  const codeRows = xmlBlocks(rawText, "statsSgnQryVo2").map((block) => ({
    codeType,
    code: xmlValue(block, "cdValtVal"),
    koreanName: xmlValue(block, "cdValtValNm"),
    koreanAbbreviation: "",
    englishAbbreviation: xmlValue(block, "englAbrtNm"),
    englishNote: xmlValue(block, "valtValEnglRmrkCn"),
    internalTaxRate: ""
  }));

  return [...primaryRows, ...codeRows].filter((item) => item.code || item.koreanName);
}
