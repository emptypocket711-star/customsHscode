export type EffectiveRecord = {
  source_name: string;
  source_url: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
  published_at: string;
  retrieved_at: string;
  status: "published";
  checksum: string;
};

export type ExportRequirementRecord = EffectiveRecord & {
  hsk_code: string;
  requirement_type: "customs_confirmation" | "integrated_public_notice" | "individual_law";
  requirement_name: string;
  related_law: string;
  agency: string;
  procedure_summary: string;
  buyer_documents: string[];
};

export type ExportControlRecord = EffectiveRecord & {
  hsk_code: string;
  control_category: string;
  control_number: string | null;
  keyword: string;
  spec_condition: string;
  self_classification_needed: boolean;
  expert_classification_needed: boolean;
  license_type: string | null;
};

export type ExportFtaCoRecord = EffectiveRecord & {
  hsk_code: string;
  destination_country: string;
  agreement_name: string;
  co_issue_possibility: string;
  issue_method: string;
  origin_evidence: string[];
  buyer_documents: string[];
};

export type MockExportDestinationTariffRate = {
  countryCode: string;
  tariffYear: number;
  destinationHsCode: string;
  matchBasis: "exact" | "prefix" | "hs6" | "hs4";
  matchScore: number;
  englishName: string | null;
  koreanName: string | null;
  unit: string | null;
  baseRateText: string | null;
  agreementRates: Record<string, string>;
  sourceName: string;
  sourceVersion: string;
  basisDate: string;
  staffReviewStatus: "확인 필요";
};

const source = {
  source_name: "HS FINDER mock export rules",
  source_url: "internal://mock/export-diagnosis",
  source_version: "mock-export-rules-2026",
  effective_from: "2026-01-01",
  effective_to: null,
  published_at: "2026-01-01T00:00:00+09:00",
  retrieved_at: "2026-05-21T00:00:00+09:00",
  status: "published" as const,
  checksum: "mock-export-rules-2026"
};

export const mockExportRequirements: ExportRequirementRecord[] = [
  {
    ...source,
    hsk_code: "8507601000",
    requirement_type: "integrated_public_notice",
    requirement_name: "리튬전지 운송 및 안전자료 확인 가능성",
    related_law: "항공위험물 운송기준 및 전기용품 안전 관련 규정",
    agency: "국토교통부/국가기술표준원",
    procedure_summary: "UN38.3, MSDS, 정격 정보와 포장 기준을 확인해야 할 가능성 있음",
    buyer_documents: ["UN38.3 시험요약서", "MSDS", "정격 라벨", "Packing Instruction 확인자료"]
  },
  {
    ...source,
    hsk_code: "8543709090",
    requirement_type: "individual_law",
    requirement_name: "전파/암호 기능 및 전략물자 확인 가능성",
    related_law: "대외무역법 및 전파법",
    agency: "산업통상자원부/국립전파연구원",
    procedure_summary: "통신, 암호, 고성능 제어 기능이 있는 경우 사양서 기반 확인 필요",
    buyer_documents: ["제품 사양서", "회로도", "통신 모듈 정보", "최종사용자 확인서"]
  },
  {
    ...source,
    hsk_code: "3304991000",
    requirement_type: "integrated_public_notice",
    requirement_name: "화장품 수출 표시 및 상대국 수입요건 확인 가능성",
    related_law: "화장품법 및 상대국 규정",
    agency: "식품의약품안전처/상대국 기관",
    procedure_summary: "국문/영문 라벨, 성분, 효능 표현, 상대국 등록 요건 확인 필요",
    buyer_documents: ["전성분표", "COA", "제품 라벨", "제조증명서", "판매증명서"]
  }
];

export const mockExportControlChecks: ExportControlRecord[] = [
  {
    ...source,
    hsk_code: "8507601000",
    control_category: "전략물자",
    control_number: null,
    keyword: "리튬이온 배터리",
    spec_condition: "고출력, 군사용, 무인기/특수장비 최종용도 여부 확인 필요",
    self_classification_needed: true,
    expert_classification_needed: false,
    license_type: "자가판정 또는 전문판정 후 수출허가 가능성 확인"
  },
  {
    ...source,
    hsk_code: "8543709090",
    control_category: "전략물자",
    control_number: null,
    keyword: "전자장치/통신/암호 기능",
    spec_condition: "암호, 주파수, 고성능 제어, 군사 최종사용자 여부 확인 필요",
    self_classification_needed: true,
    expert_classification_needed: true,
    license_type: "전문판정 및 상황허가 가능성 확인"
  }
];

export const mockExportFtaCoRecords: ExportFtaCoRecord[] = [
  {
    ...source,
    hsk_code: "3304991000",
    destination_country: "CN",
    agreement_name: "한-중 FTA",
    co_issue_possibility: "한국산 입증자료 확보 시 C/O 발급 가능성 확인",
    issue_method: "상공회의소 또는 세관 기관발급 가능성 확인",
    origin_evidence: ["제조공정도", "원재료명세서", "원가자료", "국내 제조 증빙", "거래명세서"],
    buyer_documents: ["FTA C/O", "Commercial Invoice", "Packing List", "성분표", "라벨"]
  },
  {
    ...source,
    hsk_code: "8507601000",
    destination_country: "DE",
    agreement_name: "한-EU FTA",
    co_issue_possibility: "한국산 충족 및 인증수출자 요건 확인 필요",
    issue_method: "원산지신고문안 발행 가능성 확인",
    origin_evidence: ["국내 제조공정", "BOM", "원재료 원산지 확인서", "제조원가 자료"],
    buyer_documents: ["원산지신고문안", "Commercial Invoice", "Packing List", "UN38.3", "MSDS"]
  }
];

export const mockExportDestinationTariffRates: MockExportDestinationTariffRate[] = [
  {
    countryCode: "DE",
    tariffYear: 2025,
    destinationHsCode: "850760",
    matchBasis: "hs6",
    matchScore: 81,
    englishName: "Lithium-ion accumulators",
    koreanName: "리튬이온 축전지",
    unit: null,
    baseRateText: "2.7%",
    agreementRates: {
      "한-EU FTA": "0%"
    },
    sourceName: "관세청 국가별 관세율표",
    sourceVersion: "mock-country-tariff-2025-DE",
    basisDate: "2026-05-23",
    staffReviewStatus: "확인 필요"
  },
  {
    countryCode: "US",
    tariffYear: 2025,
    destinationHsCode: "850760",
    matchBasis: "hs6",
    matchScore: 81,
    englishName: "Lithium-ion accumulators",
    koreanName: "리튬이온 축전지",
    unit: null,
    baseRateText: "3.4%",
    agreementRates: {
      "한-미 FTA": "0%"
    },
    sourceName: "관세청 국가별 관세율표",
    sourceVersion: "mock-country-tariff-2025-US",
    basisDate: "2026-05-23",
    staffReviewStatus: "확인 필요"
  },
  {
    countryCode: "JP",
    tariffYear: 2025,
    destinationHsCode: "850760",
    matchBasis: "hs6",
    matchScore: 81,
    englishName: "Lithium-ion accumulators",
    koreanName: "리튬이온 축전지",
    unit: null,
    baseRateText: "3.0%",
    agreementRates: {
      RCEP: "0%"
    },
    sourceName: "관세청 국가별 관세율표",
    sourceVersion: "mock-country-tariff-2025-JP",
    basisDate: "2026-05-23",
    staffReviewStatus: "확인 필요"
  },
  {
    countryCode: "CN",
    tariffYear: 2025,
    destinationHsCode: "330499",
    matchBasis: "hs6",
    matchScore: 81,
    englishName: "Beauty or make-up preparations",
    koreanName: "기초화장용 제품류",
    unit: null,
    baseRateText: "6.5%",
    agreementRates: {
      "한-중 FTA": "0%"
    },
    sourceName: "관세청 국가별 관세율표",
    sourceVersion: "mock-country-tariff-2025-CN",
    basisDate: "2026-05-23",
    staffReviewStatus: "확인 필요"
  },
  {
    countryCode: "US",
    tariffYear: 2025,
    destinationHsCode: "330499",
    matchBasis: "hs6",
    matchScore: 81,
    englishName: "Beauty or make-up preparations",
    koreanName: "기초화장용 제품류",
    unit: null,
    baseRateText: "0%",
    agreementRates: {
      "한-미 FTA": "0%"
    },
    sourceName: "관세청 국가별 관세율표",
    sourceVersion: "mock-country-tariff-2025-US",
    basisDate: "2026-05-23",
    staffReviewStatus: "확인 필요"
  },
  {
    countryCode: "VN",
    tariffYear: 2025,
    destinationHsCode: "330499",
    matchBasis: "hs6",
    matchScore: 81,
    englishName: "Beauty or make-up preparations",
    koreanName: "기초화장용 제품류",
    unit: null,
    baseRateText: "20%",
    agreementRates: {
      "한-베트남 FTA": "0%",
      RCEP: "0%"
    },
    sourceName: "관세청 국가별 관세율표",
    sourceVersion: "mock-country-tariff-2025-VN",
    basisDate: "2026-05-23",
    staffReviewStatus: "확인 필요"
  }
];
