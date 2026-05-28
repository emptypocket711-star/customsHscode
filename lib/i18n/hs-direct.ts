import { defaultLocale, type AppLocale } from "./locales";

export type HsDirectDictionary = {
  destination: {
    additionalTariff: string;
    adCvd: string;
    agreementRate: string;
    baseRate: string;
    customsCodeCandidates: string;
    dataYear: string;
    destinationCountry: string;
    destinationHsCode: string;
    destinationHsDetail: string;
    destinationHsPath: string;
    destinationProductName: string;
    generalRate: string;
    hs6Connection: string;
    importRequirements: string;
    internalTaxes: string;
    koreaHs6: string;
    match: string;
    matchExact: string;
    matchHs4: string;
    matchHs6: string;
    matchPrefix: string;
    noDestinationData: string;
    noInternalTaxData: string;
    noRequirementData: string;
    points: string;
    tariffBasisCode: string;
  };
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
    destination: {
      additionalTariff: "추가관세",
      adCvd: "AD/CVD",
      agreementRate: "협정세율",
      baseRate: "기본세율",
      customsCodeCandidates: "10자리 후보",
      dataYear: "자료연도",
      destinationCountry: "수입국",
      destinationHsCode: "수입국 HS CODE",
      destinationHsDetail: "수입국 HS 상세",
      destinationHsPath: "수입국 HS 경로",
      destinationProductName: "수입국 품명",
      generalRate: "일반세율",
      hs6Connection: "한국 HS6 연결",
      importRequirements: "수입요건",
      internalTaxes: "내국세",
      koreaHs6: "한국 HS6",
      match: "매칭",
      matchExact: "동일 코드",
      matchHs4: "HS4 기준",
      matchHs6: "HS6 공용 기준",
      matchPrefix: "하위 코드",
      noDestinationData: "표시할 상대국 수입 HS/관세율 데이터가 없습니다.",
      noInternalTaxData: "표시할 수입국 내국세 데이터가 없습니다.",
      noRequirementData: "표시할 수입국 수입요건 데이터가 없습니다.",
      points: "점",
      tariffBasisCode: "관세율 기준 세번"
    },
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
    destination: {
      additionalTariff: "Additional tariffs",
      adCvd: "AD/CVD",
      agreementRate: "Preferential rate",
      baseRate: "Base rate",
      customsCodeCandidates: "10-digit candidates",
      dataYear: "Data year",
      destinationCountry: "Import country",
      destinationHsCode: "Import-country HS code",
      destinationHsDetail: "Import-country HS detail",
      destinationHsPath: "Import-country HS path",
      destinationProductName: "Import-country description",
      generalRate: "General rate",
      hs6Connection: "Korean HS6 connection",
      importRequirements: "Import requirements",
      internalTaxes: "Internal taxes",
      koreaHs6: "Korean HS6",
      match: "Match",
      matchExact: "Exact code",
      matchHs4: "HS4 basis",
      matchHs6: "Common HS6 basis",
      matchPrefix: "Sub-code",
      noDestinationData: "No displayable destination import HS or tariff data was found.",
      noInternalTaxData: "No displayable import-country internal tax data was found.",
      noRequirementData: "No displayable import-country requirement data was found.",
      points: "pts",
      tariffBasisCode: "Tariff basis code"
    },
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
    destination: {
      additionalTariff: "附加关税",
      adCvd: "AD/CVD",
      agreementRate: "协定税率",
      baseRate: "基本税率",
      customsCodeCandidates: "10位候选编码",
      dataYear: "资料年度",
      destinationCountry: "进口国",
      destinationHsCode: "进口国HS编码",
      destinationHsDetail: "进口国HS详情",
      destinationHsPath: "进口国HS路径",
      destinationProductName: "进口国品名",
      generalRate: "普通税率",
      hs6Connection: "韩国HS6连接",
      importRequirements: "进口要求",
      internalTaxes: "内税",
      koreaHs6: "韩国HS6",
      match: "匹配",
      matchExact: "相同编码",
      matchHs4: "HS4基准",
      matchHs6: "HS6通用基准",
      matchPrefix: "下级编码",
      noDestinationData: "未找到可显示的目的国进口HS或关税率数据。",
      noInternalTaxData: "未找到可显示的进口国内税数据。",
      noRequirementData: "未找到可显示的进口国要求数据。",
      points: "分",
      tariffBasisCode: "税率基准编码"
    },
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
