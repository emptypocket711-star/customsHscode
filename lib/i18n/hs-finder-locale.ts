export const hsFinderSupportedLocales = ["ko", "en", "zh-CN"] as const;

export type HsFinderLocale = (typeof hsFinderSupportedLocales)[number];

export const defaultHsFinderLocale: HsFinderLocale = "ko";

export const hsFinderGlossaryKeys = [
  "hsCode",
  "hsk",
  "hs6",
  "hsCandidate",
  "preliminaryDiagnosis",
  "staffReview",
  "officialSourceData",
  "basisDate",
  "sourceVersion",
  "customsConfirmationRequirement",
  "integratedPublicNotice",
  "individualLawRequirement",
  "importRequirement",
  "exportRequirement",
  "exportControl",
  "certificateOfOrigin",
  "originRule",
  "directTransport",
  "preferentialTariff",
  "tariffRate",
  "confidenceScore",
  "missingFacts",
  "productSpecification",
  "materialComposition",
  "useFunction",
  "brand",
  "modelName"
] as const;

export type HsFinderGlossaryKey = (typeof hsFinderGlossaryKeys)[number];

export const legalSafetyCopyKeys = [
  "preliminaryHsCandidate",
  "notFinalHsClassification",
  "staffReviewRequired",
  "officialDataRequired",
  "hskRequiredForDownstream",
  "noCustomsConfirmationCaution",
  "tariffNotFinal",
  "ftaNotFinal",
  "requirementNotFinal",
  "exportControlPreliminary",
  "documentExtractionPreliminary",
  "sourceLockedBasisDate",
  "aiProviderUnavailable"
] as const;

export type LegalSafetyCopyKey = (typeof legalSafetyCopyKeys)[number];

type LocalizedDictionary<T extends string> = Record<T, Record<HsFinderLocale, string>>;

export const hsFinderGlossary = {
  hsCode: {
    ko: "HS 코드",
    en: "HS code",
    "zh-CN": "HS编码"
  },
  hsk: {
    ko: "HSK 10단위",
    en: "Korean HSK 10-digit code",
    "zh-CN": "韩国HSK 10位编码"
  },
  hs6: {
    ko: "HS 6단위",
    en: "HS 6-digit subheading",
    "zh-CN": "HS 6位子目"
  },
  hsCandidate: {
    ko: "HS 예비 후보",
    en: "preliminary HS candidate",
    "zh-CN": "HS预判候选项"
  },
  preliminaryDiagnosis: {
    ko: "예비진단",
    en: "preliminary screening",
    "zh-CN": "初步预判"
  },
  staffReview: {
    ko: "담당자 검토",
    en: "staff review",
    "zh-CN": "负责人复核"
  },
  officialSourceData: {
    ko: "공식 원천 데이터",
    en: "official source data",
    "zh-CN": "官方来源数据"
  },
  basisDate: {
    ko: "조회기준일",
    en: "basis date",
    "zh-CN": "查询基准日"
  },
  sourceVersion: {
    ko: "원천 버전",
    en: "source version",
    "zh-CN": "来源版本"
  },
  customsConfirmationRequirement: {
    ko: "세관장확인대상 요건",
    en: "customs confirmation requirement",
    "zh-CN": "海关确认对象要求"
  },
  integratedPublicNotice: {
    ko: "통합공고",
    en: "Integrated Public Notice",
    "zh-CN": "综合公告"
  },
  individualLawRequirement: {
    ko: "개별법령 요건",
    en: "individual-law requirement",
    "zh-CN": "单项法规要求"
  },
  importRequirement: {
    ko: "수입요건",
    en: "import requirement",
    "zh-CN": "进口要求"
  },
  exportRequirement: {
    ko: "수출요건",
    en: "export requirement",
    "zh-CN": "出口要求"
  },
  exportControl: {
    ko: "전략물자/수출통제",
    en: "strategic-goods/export-control check",
    "zh-CN": "战略物资/出口管制核查"
  },
  certificateOfOrigin: {
    ko: "원산지증명서",
    en: "certificate of origin",
    "zh-CN": "原产地证明书"
  },
  originRule: {
    ko: "원산지 결정기준",
    en: "origin rule",
    "zh-CN": "原产地规则"
  },
  directTransport: {
    ko: "직접운송",
    en: "direct transport",
    "zh-CN": "直接运输"
  },
  preferentialTariff: {
    ko: "협정관세",
    en: "preferential tariff",
    "zh-CN": "协定优惠关税"
  },
  tariffRate: {
    ko: "관세율",
    en: "tariff rate",
    "zh-CN": "关税税率"
  },
  confidenceScore: {
    ko: "신뢰도 점수",
    en: "confidence score",
    "zh-CN": "置信度分数"
  },
  missingFacts: {
    ko: "추가 확인 필요 정보",
    en: "missing facts to confirm",
    "zh-CN": "需补充确认的信息"
  },
  productSpecification: {
    ko: "제품 사양",
    en: "product specification",
    "zh-CN": "产品规格"
  },
  materialComposition: {
    ko: "재질/성분",
    en: "material/composition",
    "zh-CN": "材质/成分"
  },
  useFunction: {
    ko: "용도/기능",
    en: "use/function",
    "zh-CN": "用途/功能"
  },
  brand: {
    ko: "브랜드",
    en: "brand",
    "zh-CN": "品牌"
  },
  modelName: {
    ko: "모델명",
    en: "model name",
    "zh-CN": "型号"
  }
} satisfies LocalizedDictionary<HsFinderGlossaryKey>;

export const legalSafetyCopy = {
  preliminaryHsCandidate: {
    ko: "이 결과는 HS 예비 후보이며 품목분류 확정이 아닙니다.",
    en: "This result is a preliminary HS candidate and is not a final classification.",
    "zh-CN": "该结果仅为HS预判候选项，并非最终归类结论。"
  },
  notFinalHsClassification: {
    ko: "품목분류는 신고시점의 물품 상태, 세관 심사, 관계기관 확인 및 담당자 검토에 따라 달라질 수 있습니다.",
    en: "HS classification may vary depending on the goods as declared, customs review, agency confirmation, and staff review.",
    "zh-CN": "HS归类可能因申报时货物状态、海关审查、主管机关确认及负责人复核而变化。"
  },
  staffReviewRequired: {
    ko: "담당자 검토 필요",
    en: "Staff review required",
    "zh-CN": "需要负责人复核"
  },
  officialDataRequired: {
    ko: "공식 데이터 확인 필요",
    en: "Official source data check required",
    "zh-CN": "需要核对官方来源数据"
  },
  hskRequiredForDownstream: {
    ko: "정확한 관세율, FTA, 수출입요건 조회는 HSK 확정 후 재조회가 필요합니다.",
    en: "Accurate tariff, FTA, and import/export requirement checks require re-query after HSK selection and review.",
    "zh-CN": "准确的关税、FTA及进出口要求查询，需要在选择并复核HSK后重新查询。"
  },
  noCustomsConfirmationCaution: {
    ko: "세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있습니다.",
    en: "Even when no customs confirmation requirement appears, Integrated Public Notice, individual laws, labeling, certification, or distribution obligations may still apply.",
    "zh-CN": "即使未显示为海关确认对象，仍可能存在综合公告、单项法规、标签、认证或流通监管义务。"
  },
  tariffNotFinal: {
    ko: "관세율은 공식 원천 데이터와 조회기준일 기준 예비 조회 결과이며 신고시점 확인이 필요합니다.",
    en: "Tariff rates are preliminary lookup results based on official source data and the basis date; confirmation at declaration time is required.",
    "zh-CN": "关税税率为基于官方来源数据和查询基准日的初步查询结果，需在申报时确认。"
  },
  ftaNotFinal: {
    ko: "FTA 협정관세 적용 가능성은 원산지, 직접운송, 증빙서류 및 담당자 검토에 따라 달라질 수 있습니다.",
    en: "FTA preferential tariff eligibility may vary based on origin, direct transport, supporting evidence, and staff review.",
    "zh-CN": "FTA优惠关税适用可能因原产地、直接运输、证明文件及负责人复核而变化。"
  },
  requirementNotFinal: {
    ko: "수출입요건 결과는 예비진단이며 관계기관 확인과 담당자 검토가 필요합니다.",
    en: "Import/export requirement results are preliminary screening outputs and require agency confirmation and staff review.",
    "zh-CN": "进出口要求结果仅为初步预判，需主管机关确认及负责人复核。"
  },
  exportControlPreliminary: {
    ko: "전략물자/수출통제 결과는 예비 리스크 스크리닝이며 자가판정, 전문판정, 허가 검토를 대체하지 않습니다.",
    en: "Strategic-goods/export-control output is preliminary risk screening and does not replace self-classification, expert classification, or license review.",
    "zh-CN": "战略物资/出口管制结果仅为初步风险筛查，不替代自行判定、专业判定或许可证审查。"
  },
  documentExtractionPreliminary: {
    ko: "문서 추출 결과는 예비 데이터이며 원문 서류와 담당자 검토로 보정해야 합니다.",
    en: "Document extraction results are preliminary data and must be corrected against the original documents and staff review.",
    "zh-CN": "单证抽取结果为初步数据，必须结合原始单证及负责人复核进行校正。"
  },
  sourceLockedBasisDate: {
    ko: "결과는 표시된 조회기준일과 source version에 한정됩니다.",
    en: "Results are limited to the displayed basis date and source version.",
    "zh-CN": "结果仅限于所显示的查询基准日和来源版本。"
  },
  aiProviderUnavailable: {
    ko: "AI 보조 기능을 사용할 수 없어 공식 데이터 기반 후보와 담당자 검토 질문만 표시합니다.",
    en: "AI assistance is unavailable, so only official-data candidates and staff-review questions are shown.",
    "zh-CN": "AI辅助功能不可用，因此仅显示基于官方数据的候选项和负责人复核问题。"
  }
} satisfies LocalizedDictionary<LegalSafetyCopyKey>;

export function normalizeHsFinderLocale(locale?: string | null): HsFinderLocale {
  if (!locale) return defaultHsFinderLocale;

  const normalized = locale.trim().replace("_", "-").toLowerCase();
  if (normalized === "ko" || normalized.startsWith("ko-")) return "ko";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (
    normalized === "zh"
    || normalized === "zh-cn"
    || normalized === "zh-hans"
    || normalized.startsWith("zh-cn-")
    || normalized.startsWith("zh-hans-")
    || normalized === "zh-sg"
    || normalized === "zh-my"
  ) {
    return "zh-CN";
  }

  return defaultHsFinderLocale;
}

export function getHsFinderGlossaryTerm(key: HsFinderGlossaryKey, locale?: string | null) {
  return hsFinderGlossary[key][normalizeHsFinderLocale(locale)];
}

export function getLegalSafetyCopy(key: LegalSafetyCopyKey, locale?: string | null) {
  return legalSafetyCopy[key][normalizeHsFinderLocale(locale)];
}

export function getHsFinderGlossary(locale?: string | null) {
  const targetLocale = normalizeHsFinderLocale(locale);
  return Object.fromEntries(
    hsFinderGlossaryKeys.map((key) => [key, hsFinderGlossary[key][targetLocale]])
  ) as Record<HsFinderGlossaryKey, string>;
}

export function getLegalSafetyCopies(locale?: string | null) {
  const targetLocale = normalizeHsFinderLocale(locale);
  return Object.fromEntries(
    legalSafetyCopyKeys.map((key) => [key, legalSafetyCopy[key][targetLocale]])
  ) as Record<LegalSafetyCopyKey, string>;
}

export function buildAiLocaleSafetyContext(locale?: string | null) {
  const targetLocale = normalizeHsFinderLocale(locale);
  const glossary = getHsFinderGlossary(targetLocale);
  const safetyCopies = getLegalSafetyCopies(targetLocale);

  return {
    locale: targetLocale,
    glossary,
    safetyCopies,
    glossaryText: hsFinderGlossaryKeys
      .map((key) => `${key}: ${glossary[key]}`)
      .join("\n"),
    legalSafetyText: legalSafetyCopyKeys
      .map((key) => `${key}: ${safetyCopies[key]}`)
      .join("\n")
  };
}
