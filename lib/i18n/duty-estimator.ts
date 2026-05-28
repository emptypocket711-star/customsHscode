import { defaultLocale, type AppLocale } from "./locales";

export type DutyEstimatorDictionary = {
  autoInput: {
    cardTitle: string;
    description: string;
    dutyRateBody: string;
    dutyRateTitle: string;
    exchangeBody: string;
    exchangeTitle: string;
    internalTaxBody: string;
    internalTaxTitle: string;
  };
  copy: {
    appliedDutyRate: string;
    copied: string;
    copyResult: string;
    customsDuty: string;
    exchangeRate: string;
    exchangeRateDate: string;
    exchangeRateSnapshot: string;
    ftaCandidate: string;
    goodsAmount: string;
    hskNeedsTenDigits: string;
    importCountryFilter: string;
    otherInternalTax: string;
    taxableValue: string;
    totalTax: string;
    vat: string;
    vatBase: string;
  };
  form: {
    applyCurrentRate: string;
    applyKrwOne: string;
    applyNextWeekRate: string;
    basisDate: string;
    currency: string;
    dutyRate: string;
    exchangeRate: string;
    ftaHelp: string;
    ftaRate: string;
    goodsAmount: string;
    hskCode: string;
    hskHint: string;
    hskLookup: string;
    insurance: string;
    internalTaxItems: string;
    otherInternalTaxRate: string;
    preferentialRateCheckbox: string;
    rateSectionDescription: string;
    rateSectionTitle: string;
    taxableSectionDescription: string;
    taxableSectionTitle: string;
    freight: string;
    vatRate: string;
  };
  page: {
    badge: string;
    description: string;
    panelDescription: string;
    title: string;
  };
  result: {
    appliedDutyRate: string;
    copyDisabled: string;
    customsDuty: string;
    estimatedTotal: string;
    otherInternalTax: string;
    resultTitle: string;
    taxableValue: string;
    vat: string;
    vatBase: string;
    wonBasis: string;
  };
};

const dictionaries = {
  "ko-KR": {
    autoInput: {
      cardTitle: "자동 입력 범위",
      description: "HS 조회 결과와 관세청 관세환율 API로 채울 수 있는 항목은 자동 입력하고, 과세가격 구성 항목은 사용자가 조정합니다.",
      dutyRateBody: "통합 조회에서 넘어온 기본 관세율과 FTA/협정 관세율 후보를 초기값으로 사용합니다.",
      dutyRateTitle: "관세율",
      exchangeBody: "API012 관세환율정보조회로 기준일·수입 구분별 환율을 조회합니다.",
      exchangeTitle: "관세환율",
      internalTaxBody: "현재는 테스트 법령룰과 통계부호 매칭값을 초기값으로 사용하고, 실제 매핑 자료 입수 후 대체합니다.",
      internalTaxTitle: "내국세"
    },
    copy: {
      appliedDutyRate: "적용 관세율",
      copied: "복사됨",
      copyResult: "계산 결과 복사",
      customsDuty: "관세",
      exchangeRate: "관세환율",
      exchangeRateDate: "관세환율 적용일",
      exchangeRateSnapshot: "관세환율 스냅샷",
      ftaCandidate: "FTA/협정 후보",
      goodsAmount: "물품가격",
      hskNeedsTenDigits: "10자리 확인 필요",
      importCountryFilter: "수입 국가/협정 필터",
      otherInternalTax: "기타 내국세",
      taxableValue: "과세가격",
      totalTax: "예상 납세액",
      vat: "부가세",
      vatBase: "부가세 과세표준"
    },
    form: {
      applyCurrentRate: "저장 환율 적용",
      applyKrwOne: "원화 1 적용",
      applyNextWeekRate: "차주 환율 적용",
      basisDate: "조회기준일",
      currency: "통화",
      dutyRate: "기본 관세율",
      exchangeRate: "관세환율",
      freight: "운임",
      ftaHelp: "FTA 적용 여부는 원산지증명, 직접운송, 협정 요건 확인 후 선택해 주세요.",
      ftaRate: "FTA/협정 관세율",
      goodsAmount: "물품가격",
      hskCode: "HS CODE",
      hskHint: "예: 3401.30-0000 또는 3401300000",
      hskLookup: "HS 조회",
      insurance: "보험료",
      internalTaxItems: "세목별 초기값",
      otherInternalTaxRate: "기타 내국세율 합계",
      preferentialRateCheckbox: "FTA/협정 관세율 적용",
      rateSectionDescription: "HS 조회에서 넘어온 값이 있으면 초기값으로 사용하고, 실제 조건에 맞게 조정합니다.",
      rateSectionTitle: "세율 입력",
      taxableSectionDescription: "외화 물품가격은 관세환율을 곱해 원화 과세가격에 반영합니다.",
      taxableSectionTitle: "과세가격 입력",
      vatRate: "부가세율"
    },
    page: {
      badge: "예상 계산",
      description: "물품가격과 관세율을 입력해 관세, 내국세, 부가세, 총 납세액을 예비 산출합니다.",
      panelDescription: "물품가격, 관세환율, 운임·보험료, 관세율, 내국세율을 입력해 예상 납세액을 계산합니다. HS 조회에서 넘어온 값은 자동으로 채워집니다.",
      title: "예상 납세액 산출"
    },
    result: {
      appliedDutyRate: "적용 관세율",
      copyDisabled: "HS CODE 10자리를 입력하면 계산 결과를 복사할 수 있습니다.",
      customsDuty: "관세",
      estimatedTotal: "예상 납세액",
      otherInternalTax: "기타 내국세",
      resultTitle: "계산 결과",
      taxableValue: "과세가격",
      vat: "부가세",
      vatBase: "부가세 과세표준",
      wonBasis: "원화 기준"
    }
  },
  "en-US": {
    autoInput: {
      cardTitle: "Auto-filled inputs",
      description: "Values from HS lookup and customs exchange-rate data can be filled automatically. Taxable-value inputs remain adjustable by the user.",
      dutyRateBody: "The base tariff rate and FTA/preferential rate candidates passed from integrated lookup are used as initial values.",
      dutyRateTitle: "Tariff rate",
      exchangeBody: "Uses API012 exchange-rate data by basis date and import direction when available.",
      exchangeTitle: "Customs exchange rate",
      internalTaxBody: "Temporary internal-tax rule and statistical-code matches are used as initial values until the official mapping data is available.",
      internalTaxTitle: "Internal taxes"
    },
    copy: {
      appliedDutyRate: "Applied duty rate",
      copied: "Copied",
      copyResult: "Copy estimate",
      customsDuty: "Customs duty",
      exchangeRate: "Exchange rate",
      exchangeRateDate: "Exchange-rate effective date",
      exchangeRateSnapshot: "Exchange-rate snapshot",
      ftaCandidate: "FTA/preferential candidate",
      goodsAmount: "Goods amount",
      hskNeedsTenDigits: "10 digits required",
      importCountryFilter: "Import country/agreement filter",
      otherInternalTax: "Other internal taxes",
      taxableValue: "Taxable value",
      totalTax: "Estimated tax total",
      vat: "VAT",
      vatBase: "VAT base"
    },
    form: {
      applyCurrentRate: "Apply stored rate",
      applyKrwOne: "Apply KRW 1",
      applyNextWeekRate: "Apply next-week rate",
      basisDate: "Basis date",
      currency: "Currency",
      dutyRate: "Base duty rate",
      exchangeRate: "Exchange rate",
      freight: "Freight",
      ftaHelp: "Select an FTA/preferential rate only after checking origin proof, direct transport, and agreement conditions.",
      ftaRate: "FTA/preferential rate",
      goodsAmount: "Goods amount",
      hskCode: "HS code",
      hskHint: "e.g. 3401.30-0000 or 3401300000",
      hskLookup: "HS lookup",
      insurance: "Insurance",
      internalTaxItems: "Initial tax items",
      otherInternalTaxRate: "Other internal tax total rate",
      preferentialRateCheckbox: "Apply FTA/preferential rate",
      rateSectionDescription: "Values from HS lookup are used as initial values when available; adjust them to the actual conditions.",
      rateSectionTitle: "Rate inputs",
      taxableSectionDescription: "Foreign-currency goods amounts are converted into KRW taxable value using the customs exchange rate.",
      taxableSectionTitle: "Taxable value inputs",
      vatRate: "VAT rate"
    },
    page: {
      badge: "Estimate",
      description: "Enter goods amount and rates to preliminarily estimate customs duty, internal taxes, VAT, and total tax.",
      panelDescription: "Enter goods amount, customs exchange rate, freight, insurance, tariff rate, and internal tax rates. Values passed from HS lookup are filled automatically.",
      title: "Estimated Tax Calculation"
    },
    result: {
      appliedDutyRate: "Applied duty rate",
      copyDisabled: "Enter a 10-digit HS code to copy the estimate.",
      customsDuty: "Customs duty",
      estimatedTotal: "Estimated tax total",
      otherInternalTax: "Other internal taxes",
      resultTitle: "Estimate result",
      taxableValue: "Taxable value",
      vat: "VAT",
      vatBase: "VAT base",
      wonBasis: "KRW basis"
    }
  },
  "zh-CN": {
    autoInput: {
      cardTitle: "自动输入范围",
      description: "可使用HS查询结果和海关汇率数据自动填入部分项目，计税价格相关项目仍由用户调整。",
      dutyRateBody: "综合查询传入的基本税率和FTA/协定税率候选值将作为初始值使用。",
      dutyRateTitle: "关税率",
      exchangeBody: "可按基准日和进口方向使用API012海关汇率数据。",
      exchangeTitle: "海关汇率",
      internalTaxBody: "目前使用测试法规规则和统计代码匹配值作为初始值，取得正式映射资料后将替换。",
      internalTaxTitle: "内税"
    },
    copy: {
      appliedDutyRate: "适用关税率",
      copied: "已复制",
      copyResult: "复制计算结果",
      customsDuty: "关税",
      exchangeRate: "海关汇率",
      exchangeRateDate: "汇率适用日",
      exchangeRateSnapshot: "汇率快照",
      ftaCandidate: "FTA/协定候选",
      goodsAmount: "货物价格",
      hskNeedsTenDigits: "需确认10位编码",
      importCountryFilter: "进口国/协定筛选",
      otherInternalTax: "其他内税",
      taxableValue: "计税价格",
      totalTax: "预计纳税额",
      vat: "增值税",
      vatBase: "增值税计税基础"
    },
    form: {
      applyCurrentRate: "适用已保存汇率",
      applyKrwOne: "适用韩元1",
      applyNextWeekRate: "适用下周汇率",
      basisDate: "查询基准日",
      currency: "货币",
      dutyRate: "基本关税率",
      exchangeRate: "海关汇率",
      freight: "运费",
      ftaHelp: "FTA适用与否需确认原产地证明、直接运输和协定条件后选择。",
      ftaRate: "FTA/协定税率",
      goodsAmount: "货物价格",
      hskCode: "HS编码",
      hskHint: "例：3401.30-0000 或 3401300000",
      hskLookup: "HS查询",
      insurance: "保险费",
      internalTaxItems: "税目初始值",
      otherInternalTaxRate: "其他内税率合计",
      preferentialRateCheckbox: "适用FTA/协定税率",
      rateSectionDescription: "如有HS查询传入值，将作为初始值使用，并可按实际条件调整。",
      rateSectionTitle: "税率输入",
      taxableSectionDescription: "外币货物价格将按海关汇率换算为韩元计税价格。",
      taxableSectionTitle: "计税价格输入",
      vatRate: "增值税率"
    },
    page: {
      badge: "预计计算",
      description: "输入货物价格和税率，初步计算关税、内税、增值税和总纳税额。",
      panelDescription: "输入货物价格、海关汇率、运费、保险费、关税率和内税率。从HS查询传入的值会自动填入。",
      title: "预计纳税额计算"
    },
    result: {
      appliedDutyRate: "适用关税率",
      copyDisabled: "输入10位HS编码后可复制计算结果。",
      customsDuty: "关税",
      estimatedTotal: "预计纳税额",
      otherInternalTax: "其他内税",
      resultTitle: "计算结果",
      taxableValue: "计税价格",
      vat: "增值税",
      vatBase: "增值税计税基础",
      wonBasis: "韩元基准"
    }
  }
} satisfies Record<AppLocale, DutyEstimatorDictionary>;

export function getDutyEstimatorDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
