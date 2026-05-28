import { defaultLocale, type AppLocale } from "./locales";

export type HsDirectDictionary = {
  empty: {
    invalidInput: string;
    noHsData: string;
  };
  form: {
    basisDate: string;
    basisDateDescription: string;
    destinationAllOrigins: string;
    direction: string;
    export: string;
    import: string;
    originCountry: string;
    query: string;
    queryPlaceholder: string;
    submit: string;
    options: string;
  };
  page: {
    directDescription: string;
    directTitle: string;
    overseasDescription: string;
    overseasTitle: string;
  };
  product: {
    detailLookup: string;
    evidence: string;
    hs6: string;
    missingFacts: string;
    productResult: string;
    rank: (rank: number) => string;
    referenceScore: (score: number) => string;
  };
  result: {
    basisDate: string;
    detail: string;
    dutyEstimate: string;
    favoriteTitle: string;
    hsk: string;
    importRequirement: string;
    itemDetail: string;
    koreanName: string;
    originMarking: string;
    standardProduct: string;
    standardProductEmpty: string;
    unit: string;
  };
};

const dictionaries = {
  "ko-KR": {
    empty: {
      invalidInput: "입력값을 확인해 주세요.",
      noHsData: "조회기준일에 표시할 수 있는 HS CODE 데이터가 없습니다."
    },
    form: {
      basisDate: "조회기준일",
      basisDateDescription: "세율과 수입요건은 시행일이 달라질 수 있어 기본적으로 오늘 날짜 기준으로 조회합니다. 예상 신고일이 다르면 이 날짜만 바꾸면 됩니다.",
      destinationAllOrigins: "모든 원산지",
      direction: "거래구분",
      export: "수출",
      import: "수입",
      options: "조회 옵션",
      originCountry: "원산지",
      query: "HS CODE 또는 품명",
      queryPlaceholder: "예: 3401.30-0000 또는 입술화장품",
      submit: "예비 조회"
    },
    page: {
      directDescription: "HS CODE 또는 품명을 입력하면 수입 기준 관세율·수입요건 또는 한국 수출 기준 수출요건을 표시합니다.",
      directTitle: "HS 예비 조회",
      overseasDescription: "한국 HS CODE 또는 품명으로 수출 목적국의 HS CODE, 현지 품명, 관세율, 내국세, 수입요건을 조회합니다.",
      overseasTitle: "해외 HS CODE조회"
    },
    product: {
      detailLookup: "이 후보로 상세 예비조회",
      evidence: "예비 후보 근거",
      hs6: "HS6",
      missingFacts: "보완 필요 정보",
      productResult: "품명 기반 HS 예비 후보",
      rank: (rank: number) => `후보 ${rank}`,
      referenceScore: (score: number) => `참고도 ${(score * 100).toFixed(0)}%`
    },
    result: {
      basisDate: "기준일",
      detail: "상세",
      dutyEstimate: "예상 납세액 산출",
      favoriteTitle: "더블클릭하거나 드래그해서 복사할 수 있습니다.",
      hsk: "HSK 코드",
      importRequirement: "수입요건 예비 스크리닝",
      itemDetail: "품목 상세 정보",
      koreanName: "공식 국문 품명",
      originMarking: "원산지",
      standardProduct: "표준품명/필수규격",
      standardProductEmpty: "표시할 표준품명 데이터가 없습니다.",
      unit: "신고 단위"
    }
  },
  "en-US": {
    empty: {
      invalidInput: "Please check the input value.",
      noHsData: "No displayable HS code data was found for the basis date."
    },
    form: {
      basisDate: "Basis date",
      basisDateDescription: "Tariff rates and import requirements can vary by effective date. The default lookup uses today's date in Korea; change this date if the expected declaration date is different.",
      destinationAllOrigins: "All origins",
      direction: "Trade mode",
      export: "Export",
      import: "Import",
      options: "Lookup options",
      originCountry: "Origin country",
      query: "HS code or product name",
      queryPlaceholder: "e.g. 3401.30-0000 or lip cosmetics",
      submit: "Run preliminary lookup"
    },
    page: {
      directDescription: "Enter an HS code or product name to view import-side tariff and requirement data, or Korea export-side requirement data.",
      directTitle: "Preliminary HS Lookup",
      overseasDescription: "Search destination-country HS codes, local descriptions, tariff rates, internal taxes, and import requirements from a Korean HS code or product name.",
      overseasTitle: "Overseas HS Lookup"
    },
    product: {
      detailLookup: "Open preliminary detail for this candidate",
      evidence: "Candidate rationale",
      hs6: "HS6",
      missingFacts: "Information to supplement",
      productResult: "Preliminary HS candidates by product name",
      rank: (rank: number) => `Candidate ${rank}`,
      referenceScore: (score: number) => `Reference ${(score * 100).toFixed(0)}%`
    },
    result: {
      basisDate: "Basis date",
      detail: "Detail",
      dutyEstimate: "Duty estimate",
      favoriteTitle: "Double-click or drag to copy.",
      hsk: "HSK",
      importRequirement: "Import requirements",
      itemDetail: "Item details",
      koreanName: "Official Korean description",
      originMarking: "Origin marking",
      standardProduct: "Standard names / required specs",
      standardProductEmpty: "No displayable standard-name data was found.",
      unit: "Declaration unit"
    }
  },
  "zh-CN": {
    empty: {
      invalidInput: "请确认输入值。",
      noHsData: "未找到该查询基准日可显示的HS编码数据。"
    },
    form: {
      basisDate: "查询基准日",
      basisDateDescription: "税率和进口要求可能因生效日期而不同。默认按韩国今天日期查询；如预计申报日不同，请调整此日期。",
      destinationAllOrigins: "所有原产地",
      direction: "贸易区分",
      export: "出口",
      import: "进口",
      options: "查询选项",
      originCountry: "原产地",
      query: "HS编码或品名",
      queryPlaceholder: "例：3401.30-0000 或 唇部化妆品",
      submit: "初步查询"
    },
    page: {
      directDescription: "输入HS编码或品名后，显示进口侧关税率、进口要求，或韩国出口侧要求数据。",
      directTitle: "HS初步查询",
      overseasDescription: "可通过韩国HS编码或品名查询目的国HS编码、当地品名、关税率、内税和进口要求。",
      overseasTitle: "海外HS编码查询"
    },
    product: {
      detailLookup: "查看该候选项的初步详情",
      evidence: "候选依据",
      hs6: "HS6",
      missingFacts: "需补充的信息",
      productResult: "基于品名的HS预判候选项",
      rank: (rank: number) => `候选 ${rank}`,
      referenceScore: (score: number) => `参考度 ${(score * 100).toFixed(0)}%`
    },
    result: {
      basisDate: "基准日",
      detail: "详细",
      dutyEstimate: "税费估算",
      favoriteTitle: "可双击或拖拽复制。",
      hsk: "HSK编码",
      importRequirement: "进口要求初步筛查",
      itemDetail: "商品详情",
      koreanName: "官方韩文品名",
      originMarking: "原产地标示",
      standardProduct: "标准品名/必要规格",
      standardProductEmpty: "未找到可显示的标准品名数据。",
      unit: "申报单位"
    }
  }
} satisfies Record<AppLocale, HsDirectDictionary>;

export function getHsDirectDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
