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

export type TariffRateRecord = EffectiveRecord & {
  hsk_code: string;
  rate_type: "basic" | "wto" | "A" | "C" | "FCN1" | "FUS1" | "FEU1" | "FRCAS1" | "FAE1";
  duty_rate: number;
  country_group: string | null;
};

export type FtaRateRecord = EffectiveRecord & {
  agreement_name: string;
  country_code: string;
  country_name: string;
  hsk_code: string;
  preferential_rate: number | null;
  co_type: string;
  issue_method: string;
  issuer: string;
  origin_rule: string;
  direct_transport_issue: string;
  required_evidence: string[];
};

export type ImportRequirementRecord = EffectiveRecord & {
  hsk_code: string;
  requirement_type: "customs_confirmation" | "integrated_public_notice" | "individual_law";
  requirement_name: string;
  related_law: string;
  agency: string;
  procedure_summary: string;
};

export type RequirementPlaybookRecord = EffectiveRecord & {
  requirement_name: string;
  application_method: string;
  required_documents: string[];
  expected_lead_time: string;
  customer_request_template: string;
  staff_checklist: string[];
};

const source = {
  source_name: "HS FINDER mock import rules",
  source_url: "internal://mock/import-diagnosis",
  source_version: "mock-import-rules-2026",
  effective_from: "2026-01-01",
  effective_to: null,
  published_at: "2026-01-01T00:00:00+09:00",
  retrieved_at: "2026-05-21T00:00:00+09:00",
  status: "published" as const,
  checksum: "mock-import-rules-2026"
};

export const mockTariffRates: TariffRateRecord[] = [
  { ...source, hsk_code: "3304101000", rate_type: "A", duty_rate: 8, country_group: "기본세율" },
  { ...source, hsk_code: "3304101000", rate_type: "C", duty_rate: 6.5, country_group: "WTO협정세율" },
  { ...source, hsk_code: "3304101000", rate_type: "FCN1", duty_rate: 0, country_group: "한ㆍ중국 FTA협정세율(선택1)" },
  { ...source, hsk_code: "3304101000", rate_type: "FUS1", duty_rate: 0, country_group: "한ㆍ미 FTA 협정세율(선택1)" },
  { ...source, hsk_code: "3304101000", rate_type: "FEU1", duty_rate: 0, country_group: "한ㆍEU FTA협정세율(선택1)" },
  { ...source, hsk_code: "3304101000", rate_type: "FRCAS1", duty_rate: 4.3, country_group: "RCEP협정세율_아세안(선택1)" },
  { ...source, hsk_code: "3304991000", rate_type: "A", duty_rate: 8, country_group: "기본세율" },
  { ...source, hsk_code: "3304991000", rate_type: "C", duty_rate: 6.5, country_group: "WTO협정세율" },
  { ...source, hsk_code: "3304991000", rate_type: "FCN1", duty_rate: 0, country_group: "한ㆍ중국 FTA협정세율(선택1)" },
  { ...source, hsk_code: "3304991000", rate_type: "FUS1", duty_rate: 0, country_group: "한ㆍ미 FTA 협정세율(선택1)" },
  { ...source, hsk_code: "3304991000", rate_type: "FEU1", duty_rate: 0, country_group: "한ㆍEU FTA협정세율(선택1)" },
  { ...source, hsk_code: "3304991000", rate_type: "FRCAS1", duty_rate: 3.3, country_group: "RCEP협정세율_아세안(선택1)" },
  { ...source, hsk_code: "3304991000", rate_type: "FAE1", duty_rate: 5.2, country_group: "한ㆍUAE CEPA(선택1)" },
  { ...source, hsk_code: "3304992000", rate_type: "A", duty_rate: 8, country_group: "기본세율" },
  { ...source, hsk_code: "3304992000", rate_type: "C", duty_rate: 6.5, country_group: "WTO협정세율" },
  { ...source, hsk_code: "3304993000", rate_type: "A", duty_rate: 8, country_group: "기본세율" },
  { ...source, hsk_code: "3304993000", rate_type: "C", duty_rate: 6.5, country_group: "WTO협정세율" },
  { ...source, hsk_code: "3304999000", rate_type: "A", duty_rate: 8, country_group: "기본세율" },
  { ...source, hsk_code: "3304999000", rate_type: "C", duty_rate: 6.5, country_group: "WTO협정세율" },
  { ...source, hsk_code: "8507601000", rate_type: "basic", duty_rate: 8, country_group: null },
  { ...source, hsk_code: "8507601000", rate_type: "wto", duty_rate: 0, country_group: "WTO" },
  { ...source, hsk_code: "3926909000", rate_type: "basic", duty_rate: 6.5, country_group: null },
  { ...source, hsk_code: "8543709090", rate_type: "basic", duty_rate: 8, country_group: null },
  { ...source, hsk_code: "2106909099", rate_type: "basic", duty_rate: 8, country_group: null }
];

export const mockFtaRates: FtaRateRecord[] = [
  {
    ...source,
    agreement_name: "한-중 FTA",
    country_code: "CN",
    country_name: "중국",
    hsk_code: "3304101000",
    preferential_rate: 0,
    co_type: "기관발급",
    issue_method: "중국 발급기관 C/O",
    issuer: "중국 해관 또는 권한 있는 기관",
    origin_rule: "CTH 또는 RVC 기준 가능성 확인 필요",
    direct_transport_issue: "홍콩 등 제3국 경유 시 직접운송 증빙 필요",
    required_evidence: ["C/O 원본 또는 전자증명", "전성분표", "선하증권", "제3국 경유 시 비조작 증명"]
  },
  {
    ...source,
    agreement_name: "한-중 FTA",
    country_code: "CN",
    country_name: "중국",
    hsk_code: "3304991000",
    preferential_rate: 0,
    co_type: "기관발급",
    issue_method: "중국 발급기관 C/O",
    issuer: "중국 해관 또는 권한 있는 기관",
    origin_rule: "CTH 또는 RVC 기준 가능성 확인 필요",
    direct_transport_issue: "홍콩 등 제3국 경유 시 직접운송 증빙 필요",
    required_evidence: ["C/O 원본 또는 전자증명", "원재료명세서", "선하증권", "제3국 경유 시 비조작 증명"]
  },
  {
    ...source,
    agreement_name: "한-EU FTA",
    country_code: "DE",
    country_name: "독일",
    hsk_code: "8507601000",
    preferential_rate: 0,
    co_type: "원산지신고서",
    issue_method: "인증수출자 문안 확인",
    issuer: "EU 수출자",
    origin_rule: "PSR 충족 가능성 확인 필요",
    direct_transport_issue: "비당사국 경유 시 운송서류 확인 필요",
    required_evidence: ["원산지신고문안", "인증수출자 번호", "제조공정 자료", "운송서류"]
  }
];

export const mockImportRequirements: ImportRequirementRecord[] = [
  {
    ...source,
    hsk_code: "3304101000",
    requirement_type: "integrated_public_notice",
    requirement_name: "화장품 수입요건 가능성",
    related_law: "화장품법",
    agency: "식품의약품안전처",
    procedure_summary: "입술화장품 성분, 색소, 표시사항, 기능성 표현 여부 확인 가능성"
  },
  {
    ...source,
    hsk_code: "3304991000",
    requirement_type: "integrated_public_notice",
    requirement_name: "화장품 수입요건 가능성",
    related_law: "화장품법",
    agency: "식품의약품안전처",
    procedure_summary: "화장품 책임판매업, 표준통관예정보고, 표시사항 확인 가능성"
  },
  {
    ...source,
    hsk_code: "8507601000",
    requirement_type: "integrated_public_notice",
    requirement_name: "전기용품 및 생활용품 안전요건 가능성",
    related_law: "전기용품 및 생활용품 안전관리법",
    agency: "국가기술표준원",
    procedure_summary: "정격, 용도, 대상 품목 여부에 따라 KC 안전확인 가능성 확인"
  },
  {
    ...source,
    hsk_code: "2106909099",
    requirement_type: "customs_confirmation",
    requirement_name: "식품 수입신고 가능성",
    related_law: "수입식품안전관리 특별법",
    agency: "식품의약품안전처",
    procedure_summary: "성분, 제조공정, 섭취 목적 확인 후 수입식품 신고 대상 가능성 확인"
  }
];

export const mockRequirementPlaybooks: RequirementPlaybookRecord[] = [
  {
    ...source,
    requirement_name: "화장품 수입요건 가능성",
    application_method: "표준통관예정보고 및 책임판매업 요건 사전 확인",
    required_documents: ["전성분표", "제조증명서", "판매증명서", "라벨 시안", "용도 설명서"],
    expected_lead_time: "자료 완비 후 기관 처리기간 확인 필요",
    customer_request_template: "전성분표, 제품 라벨, 제조/판매증명서, 사용 목적 자료를 전달해 주세요.",
    staff_checklist: ["의약품/의약외품 표현 여부", "기능성화장품 해당 가능성", "표시사항 국문라벨 확인"]
  },
  {
    ...source,
    requirement_name: "전기용품 및 생활용품 안전요건 가능성",
    application_method: "제품 정격과 용도 기준 KC 대상 여부 확인",
    required_documents: ["제품 사양서", "전기회로도", "정격 라벨", "시험성적서", "사용설명서"],
    expected_lead_time: "품목과 시험 필요 여부에 따라 변동",
    customer_request_template: "전압, 용량, 사용처, 회로도, 시험성적서 보유 여부를 전달해 주세요.",
    staff_checklist: ["KC 대상 품목 여부", "배터리 운송 위험물 자료", "전파인증 동시 확인 필요 여부"]
  },
  {
    ...source,
    requirement_name: "식품 수입신고 가능성",
    application_method: "수입식품 신고 및 표시사항 확인",
    required_documents: ["성분표", "제조공정도", "포장 라벨", "제조사 정보", "섭취 방법"],
    expected_lead_time: "제품군과 정밀검사 여부에 따라 변동",
    customer_request_template: "성분표, 제조공정도, 라벨, 섭취 목적 자료를 전달해 주세요.",
    staff_checklist: ["건강기능식품 표시 여부", "식품첨가물 기준", "한글 표시사항"]
  }
];
