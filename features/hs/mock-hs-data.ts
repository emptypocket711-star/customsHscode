export type HsMasterRecord = {
  hsk_code: string;
  hs6: string;
  korean_name: string;
  english_name: string | null;
  import_nature_code: string | null;
  export_nature_code: string | null;
  quantity_unit: string | null;
  weight_unit: string | null;
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

export type StandardProductNameRecord = {
  id: string;
  hsk_code: string;
  standard_name_kr: string;
  required_spec_kr: string;
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

export type HsClassificationCaseRecord = {
  id: string;
  hsk_code: string;
  title: string;
  item_name: string;
  decision_date: string;
  source_name: string;
  source_url: string;
  source_version: string;
};

export const mockHsMasterRecords: HsMasterRecord[] = [
  {
    hsk_code: "3304101000",
    hs6: "330410",
    korean_name: "입술화장용 제품류",
    english_name: "Lip make-up preparations",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "KG",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-3304101000-2026"
  },
  {
    hsk_code: "3304991000",
    hs6: "330499",
    korean_name: "기초화장용 제품류",
    english_name: "Beauty or make-up preparations and preparations for the care of the skin",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "KG",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-3304991000-2026"
  },
  {
    hsk_code: "3304992000",
    hs6: "330499",
    korean_name: "메이크업용 제품류",
    english_name: "Make-up cosmetics",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "KG",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-3304992000-2026"
  },
  {
    hsk_code: "3304993000",
    hs6: "330499",
    korean_name: "어린이용 제품류",
    english_name: "Baby cosmetics",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "KG",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-3304993000-2026"
  },
  {
    hsk_code: "3304999000",
    hs6: "330499",
    korean_name: "기타",
    english_name: "Other",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "KG",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-3304999000-2026"
  },
  {
    hsk_code: "8507601000",
    hs6: "850760",
    korean_name: "리튬이온 축전지",
    english_name: "Lithium-ion accumulators",
    import_nature_code: "A",
    export_nature_code: "E",
    quantity_unit: "NO",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-8507601000-2026"
  },
  {
    hsk_code: "3926909000",
    hs6: "392690",
    korean_name: "플라스틱으로 만든 기타 제품",
    english_name: "Other articles of plastics",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "KG",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-3926909000-2026"
  },
  {
    hsk_code: "8543709090",
    hs6: "854370",
    korean_name: "고유의 기능을 가진 기타 전기기기",
    english_name: "Other electrical machines and apparatus, having individual functions",
    import_nature_code: "A",
    export_nature_code: "E",
    quantity_unit: "NO",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-8543709090-2026"
  },
  {
    hsk_code: "2106909099",
    hs6: "210690",
    korean_name: "기타 조제 식료품",
    english_name: "Other food preparations",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "KG",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-2106909099-2026"
  },
  {
    hsk_code: "0712391090",
    hs6: "071239",
    korean_name: "기타 건조 버섯",
    english_name: "Other dried mushrooms",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "KG",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-0712391090-2026"
  },
  {
    hsk_code: "8429521000",
    hs6: "842952",
    korean_name: "굴삭기",
    english_name: "Excavators with a 360 degree revolving superstructure",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "NO",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-8429521000-2026"
  },
  {
    hsk_code: "9019102000",
    hs6: "901910",
    korean_name: "마사지용 기기",
    english_name: "Massage apparatus",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "NO",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-9019102000-2026"
  },
  {
    hsk_code: "8443321010",
    hs6: "844332",
    korean_name: "레이저 프린터",
    english_name: "Laser beam printer",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "NO",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2026-hsk",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-8443321010-2026"
  },
  {
    hsk_code: "3304999900",
    hs6: "330499",
    korean_name: "기타 피부미용용 제품류",
    english_name: "Other skin care preparations",
    import_nature_code: "A",
    export_nature_code: null,
    quantity_unit: "KG",
    weight_unit: "KG",
    source_name: "관세법령정보포털 HSK 품목분류표",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-2025-hsk-archived",
    effective_from: "2025-01-01",
    effective_to: "2025-12-31",
    published_at: "2025-01-01T00:00:00+09:00",
    retrieved_at: "2025-12-31T00:00:00+09:00",
    status: "published",
    checksum: "mock-hs-3304999900-2025"
  }
];

export const mockStandardProductNames: StandardProductNameRecord[] = [
  {
    id: "mock-standard-3304101000",
    hsk_code: "3304101000",
    standard_name_kr: "립스틱/립틴트",
    required_spec_kr: "전성분표, 색소 사용 내역, 용도, 기능성 표현 여부, 인체 적용 여부 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-3304101000-2026"
  },
  {
    id: "mock-standard-3304991000",
    hsk_code: "3304991000",
    standard_name_kr: "보습용 크림",
    required_spec_kr: "성분표, 용도, 인체 적용 여부, 의약외품 해당 가능성 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-3304991000-2026"
  },
  {
    id: "mock-standard-8507601000",
    hsk_code: "8507601000",
    standard_name_kr: "리튬이온 배터리 모듈",
    required_spec_kr: "전압, 용량, 셀 구성, 보호회로, 최종 용도, UN38.3 자료 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-8507601000-2026"
  },
  {
    id: "mock-standard-3926909000",
    hsk_code: "3926909000",
    standard_name_kr: "플라스틱 부품",
    required_spec_kr: "재질, 용도, 장착 대상, 단독 기능 여부, 완제품/부분품 구분 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-3926909000-2026"
  },
  {
    id: "mock-standard-8543709090",
    hsk_code: "8543709090",
    standard_name_kr: "기타 전기식 기능장치",
    required_spec_kr: "전원 방식, 회로도, 주요 기능, 통신 기능, 최종 사용처 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-8543709090-2026"
  },
  {
    id: "mock-standard-2106909099",
    hsk_code: "2106909099",
    standard_name_kr: "혼합 조제식품",
    required_spec_kr: "성분표, 제조공정, 섭취 목적, 건강기능식품 해당 가능성 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-2106909099-2026"
  },
  {
    id: "mock-standard-0712391090",
    hsk_code: "0712391090",
    standard_name_kr: "건조 버섯 분말",
    required_spec_kr: "버섯 종류, 단순 건조·분쇄 여부, 조미·혼합·추출 가공 여부 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-0712391090-2026"
  },
  {
    id: "mock-standard-8429521000",
    hsk_code: "8429521000",
    standard_name_kr: "굴삭기",
    required_spec_kr: "자주식 여부, 360도 회전 상부구조 여부, 궤도식·휠식 여부, 부분품 여부 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-8429521000-2026"
  },
  {
    id: "mock-standard-9019102000",
    hsk_code: "9019102000",
    standard_name_kr: "마사지용 기기",
    required_spec_kr: "마사지·물리치료용 기능, 의료기기 해당 여부, 전기식·비전기식 여부 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-9019102000-2026"
  },
  {
    id: "mock-standard-8443321010",
    hsk_code: "8443321010",
    standard_name_kr: "레이저 프린터",
    required_spec_kr: "프린터 단독 기능, 복사·팩스·스캔 기능 포함 여부, 인쇄 방식, 컬러 출력 가능 여부 확인",
    source_name: "관세청 표준품명 예시",
    source_url: "https://unipass.customs.go.kr/clip/index.do",
    source_version: "mock-standard-product-2026",
    effective_from: "2026-01-01",
    effective_to: null,
    published_at: "2026-01-01T00:00:00+09:00",
    retrieved_at: "2026-05-21T00:00:00+09:00",
    status: "published",
    checksum: "mock-spn-8443321010-2026"
  }
];

export const mockHsClassificationCases: HsClassificationCaseRecord[] = [
  {
    id: "case-3304101000-1",
    hsk_code: "3304101000",
    title: "Lip make-up preparations; lip tint",
    item_name: "립틴트",
    decision_date: "2024-04-18",
    source_name: "품목분류 사례 예시",
    source_url: "internal://mock/classification-cases",
    source_version: "mock-classification-cases-2026"
  },
  {
    id: "case-3304101000-2",
    hsk_code: "3304101000",
    title: "Lip make-up preparations; lipstick",
    item_name: "립스틱",
    decision_date: "2023-09-12",
    source_name: "품목분류 사례 예시",
    source_url: "internal://mock/classification-cases",
    source_version: "mock-classification-cases-2026"
  },
  {
    id: "case-3304991000-1",
    hsk_code: "3304991000",
    title: "Skin care cosmetics; SHEVA Massage Cream",
    item_name: "마사지 크림",
    decision_date: "2024-05-21",
    source_name: "품목분류 사례 예시",
    source_url: "internal://mock/classification-cases",
    source_version: "mock-classification-cases-2026"
  },
  {
    id: "case-3304991000-2",
    hsk_code: "3304991000",
    title: "Skin care cosmetics; SLEEPY FACE CLEANSING BALM",
    item_name: "클렌징 밤",
    decision_date: "2023-07-20",
    source_name: "품목분류 사례 예시",
    source_url: "internal://mock/classification-cases",
    source_version: "mock-classification-cases-2026"
  },
  {
    id: "case-3304991000-3",
    hsk_code: "3304991000",
    title: "Skin care cosmetics; CICA BARRIER CREAM",
    item_name: "피부보호 크림",
    decision_date: "2022-02-04",
    source_name: "품목분류 사례 예시",
    source_url: "internal://mock/classification-cases",
    source_version: "mock-classification-cases-2026"
  },
  {
    id: "case-8507601000-1",
    hsk_code: "8507601000",
    title: "Lithium-ion battery module for electric mobility",
    item_name: "리튬이온 배터리 모듈",
    decision_date: "2024-03-14",
    source_name: "품목분류 사례 예시",
    source_url: "internal://mock/classification-cases",
    source_version: "mock-classification-cases-2026"
  },
  {
    id: "case-8507601000-2",
    hsk_code: "8507601000",
    title: "Rechargeable lithium-ion accumulator pack",
    item_name: "충전식 축전지 팩",
    decision_date: "2023-11-09",
    source_name: "품목분류 사례 예시",
    source_url: "internal://mock/classification-cases",
    source_version: "mock-classification-cases-2026"
  }
];
