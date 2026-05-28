import { defaultLocale, type AppLocale } from "./locales";

export type DiagnosisDictionary = {
  common: {
    agreement: string;
    agency: string;
    basisDate: string;
    co: string;
    country: string;
    destinationCountry: string;
    documents: string;
    evidence: string;
    hskCode: string;
    hs6: string;
    issue: string;
    law: string;
    name: string;
    notes: string;
    productName: string;
    rate: string;
    search: string;
    source: string;
    sourceVersion: string;
    type: string;
  };
  import: {
    empty: string;
    ftaEmpty: string;
    ftaSection: string;
    importResult: string;
    noResult: string;
    pageDescription: string;
    pageTitle: string;
    panelTitle: string;
    requirementEmpty: string;
    requirementSection: string;
    tariffEmpty: string;
    tariffSection: string;
    fields: {
      destinationCountry: string;
      exportCountry: string;
      manufacturingCountry: string;
      originCountry: string;
      sellerCountry: string;
      shipmentCountry: string;
    };
    table: {
      directTransport: string;
      preferentialRate: string;
      procedure: string;
      requestedDocuments: string;
    };
  };
  export: {
    buyerDocuments: string;
    buyerDocumentsSection: string;
    destinationTariffEmpty: string;
    destinationTariffSection: string;
    empty: string;
    exportControlEmpty: string;
    exportControlSection: string;
    exportResult: string;
    ftaCoEmpty: string;
    ftaCoSection: string;
    noResult: string;
    pageDescription: string;
    pageTitle: string;
    panelTitle: string;
    requirementEmpty: string;
    requirementSection: string;
    fields: {
      finalUser: string;
      finalUserPlaceholder: string;
      productSpecs: string;
      productSpecsPlaceholder: string;
      productUse: string;
      productUsePlaceholder: string;
    };
    table: {
      baseRate: string;
      category: string;
      destinationHs: string;
      destinationName: string;
      expertClassification: string;
      issueMethod: string;
      keyword: string;
      license: string;
      preferentialRate: string;
      selfClassification: string;
      specCondition: string;
      tariffYear: string;
    };
    possible: string;
  };
};

const dictionaries = {
  "ko-KR": {
    common: {
      agreement: "협정",
      agency: "기관",
      basisDate: "조회기준일",
      co: "C/O",
      country: "국가",
      destinationCountry: "목적국",
      documents: "제출서류",
      evidence: "증빙",
      hskCode: "HSK 코드",
      hs6: "HS6",
      issue: "발급",
      law: "법령",
      name: "요건명",
      notes: "참고사항",
      productName: "품명",
      rate: "세율",
      search: "조회",
      source: "출처",
      sourceVersion: "출처 버전",
      type: "구분"
    },
    import: {
      empty: "HSK와 국가 정보를 입력하면 관세율, FTA, C/O, 수입요건이 표시됩니다.",
      ftaEmpty: "표시 가능한 FTA 데이터 없음",
      ftaSection: "FTA / C/O",
      importResult: "수입 조회 결과",
      noResult: "조회기준일에 표시할 수 있는 수입 정보가 없습니다.",
      pageDescription: "HSK와 국가 정보를 기준으로 관세율, FTA, C/O, 수입요건을 표시합니다.",
      pageTitle: "수입 관세·요건",
      panelTitle: "수입 관세·요건 조회",
      requirementEmpty: "표시 가능한 수입요건 데이터 없음",
      requirementSection: "수입요건",
      tariffEmpty: "관세율 데이터 없음",
      tariffSection: "관세율",
      fields: {
        destinationCountry: "목적국",
        exportCountry: "수출국",
        manufacturingCountry: "제조국",
        originCountry: "원산지",
        sellerCountry: "판매국",
        shipmentCountry: "선적국"
      },
      table: {
        directTransport: "직접운송",
        preferentialRate: "협정세율",
        procedure: "내용",
        requestedDocuments: "요청자료"
      }
    },
    export: {
      buyerDocuments: "바이어 제출서류",
      buyerDocumentsSection: "바이어 제출서류",
      destinationTariffEmpty: "목적국 관세율 데이터 없음",
      destinationTariffSection: "수출상대국 관세율",
      empty: "HSK와 목적국을 입력하면 수출요건, FTA C/O, 바이어 제출서류, 상대국 관세율이 표시됩니다.",
      exportControlEmpty: "표시 가능한 수출통제 데이터 없음",
      exportControlSection: "전략물자 / 수출통제",
      exportResult: "수출 조회 결과",
      ftaCoEmpty: "표시 가능한 FTA C/O 데이터 없음",
      ftaCoSection: "FTA C/O 및 원산지증빙",
      noResult: "조회기준일에 표시할 수 있는 수출 정보가 없습니다.",
      pageDescription: "HSK와 목적국을 기준으로 수출요건, FTA C/O, 상대국 관세율을 표시합니다.",
      pageTitle: "수출·상대국 세율",
      panelTitle: "수출·상대국 관세율 조회",
      requirementEmpty: "표시 가능한 수출요건 데이터 없음",
      requirementSection: "수출요건",
      fields: {
        finalUser: "최종사용자",
        finalUserPlaceholder: "해외 유통사 또는 제조사",
        productSpecs: "제품 스펙",
        productSpecsPlaceholder: "전압, 용량, 통신/암호 기능 등",
        productUse: "최종 용도",
        productUsePlaceholder: "예: 전기자전거 교체용"
      },
      table: {
        baseRate: "기본세율",
        category: "분류",
        destinationHs: "상대국 HS",
        destinationName: "품명",
        expertClassification: "전문판정",
        issueMethod: "발급방식",
        keyword: "키워드",
        license: "허가",
        preferentialRate: "협정세율",
        selfClassification: "자가판정",
        specCondition: "조건",
        tariffYear: "연도"
      },
      possible: "필요 가능성 있음"
    }
  },
  "en-US": {
    common: {
      agreement: "Agreement",
      agency: "Agency",
      basisDate: "Basis date",
      co: "C/O",
      country: "Country",
      destinationCountry: "Destination",
      documents: "Documents",
      evidence: "Evidence",
      hskCode: "HSK code",
      hs6: "HS6",
      issue: "Issue",
      law: "Law",
      name: "Requirement",
      notes: "Notes",
      productName: "Product name",
      rate: "Rate",
      search: "Lookup",
      source: "Source",
      sourceVersion: "Source version",
      type: "Type"
    },
    import: {
      empty: "Enter HSK and country details to view tariff rates, FTA, C/O, and import requirements.",
      ftaEmpty: "No displayable FTA data.",
      ftaSection: "FTA / C/O",
      importResult: "Import lookup result",
      noResult: "No import information is available for the selected basis date.",
      pageDescription: "Displays tariff rates, FTA, C/O, and import requirements based on HSK and country details.",
      pageTitle: "Import Tariffs & Requirements",
      panelTitle: "Import tariff and requirement lookup",
      requirementEmpty: "No displayable import requirement data.",
      requirementSection: "Import requirements",
      tariffEmpty: "No tariff data.",
      tariffSection: "Tariff rates",
      fields: {
        destinationCountry: "Destination",
        exportCountry: "Export country",
        manufacturingCountry: "Manufacturing country",
        originCountry: "Origin country",
        sellerCountry: "Seller country",
        shipmentCountry: "Shipment country"
      },
      table: {
        directTransport: "Direct transport",
        preferentialRate: "Preferential rate",
        procedure: "Details",
        requestedDocuments: "Requested documents"
      }
    },
    export: {
      buyerDocuments: "Buyer documents",
      buyerDocumentsSection: "Buyer documents",
      destinationTariffEmpty: "No destination tariff data.",
      destinationTariffSection: "Destination tariff rates",
      empty: "Enter HSK and destination country to view export requirements, FTA C/O, buyer documents, and destination tariff rates.",
      exportControlEmpty: "No displayable export-control data.",
      exportControlSection: "Strategic goods / export control",
      exportResult: "Export lookup result",
      ftaCoEmpty: "No displayable FTA C/O data.",
      ftaCoSection: "FTA C/O and origin evidence",
      noResult: "No export information is available for the selected basis date.",
      pageDescription: "Displays export requirements, FTA C/O, and destination tariff rates based on HSK and destination country.",
      pageTitle: "Export & Destination Tariffs",
      panelTitle: "Export and destination tariff lookup",
      requirementEmpty: "No displayable export requirement data.",
      requirementSection: "Export requirements",
      fields: {
        finalUser: "Final user",
        finalUserPlaceholder: "Overseas distributor or manufacturer",
        productSpecs: "Product specs",
        productSpecsPlaceholder: "Voltage, capacity, communication/encryption features, etc.",
        productUse: "End use",
        productUsePlaceholder: "e.g. replacement battery for e-bike"
      },
      table: {
        baseRate: "Base rate",
        category: "Category",
        destinationHs: "Destination HS",
        destinationName: "Product name",
        expertClassification: "Expert classification",
        issueMethod: "Issue method",
        keyword: "Keyword",
        license: "License",
        preferentialRate: "Preferential rate",
        selfClassification: "Self-classification",
        specCondition: "Condition",
        tariffYear: "Year"
      },
      possible: "May be required"
    }
  },
  "zh-CN": {
    common: {
      agreement: "协定",
      agency: "机构",
      basisDate: "查询基准日",
      co: "原产地证明",
      country: "国家",
      destinationCountry: "目的国",
      documents: "提交资料",
      evidence: "证明资料",
      hskCode: "HSK编码",
      hs6: "HS6",
      issue: "签发",
      law: "法规",
      name: "要求名称",
      notes: "参考事项",
      productName: "品名",
      rate: "税率",
      search: "查询",
      source: "来源",
      sourceVersion: "来源版本",
      type: "类别"
    },
    import: {
      empty: "输入HSK和国家信息后，可查看关税率、FTA、原产地证明和进口要求。",
      ftaEmpty: "暂无可显示的FTA数据。",
      ftaSection: "FTA / 原产地证明",
      importResult: "进口查询结果",
      noResult: "所选基准日暂无可显示的进口信息。",
      pageDescription: "根据HSK和国家信息显示关税率、FTA、原产地证明和进口要求。",
      pageTitle: "进口关税与要求",
      panelTitle: "进口关税与要求查询",
      requirementEmpty: "暂无可显示的进口要求数据。",
      requirementSection: "进口要求",
      tariffEmpty: "暂无关税率数据。",
      tariffSection: "关税率",
      fields: {
        destinationCountry: "目的国",
        exportCountry: "出口国",
        manufacturingCountry: "制造国",
        originCountry: "原产国",
        sellerCountry: "销售国",
        shipmentCountry: "装运国"
      },
      table: {
        directTransport: "直接运输",
        preferentialRate: "协定税率",
        procedure: "内容",
        requestedDocuments: "请求资料"
      }
    },
    export: {
      buyerDocuments: "买方提交资料",
      buyerDocumentsSection: "买方提交资料",
      destinationTariffEmpty: "暂无目的国关税率数据。",
      destinationTariffSection: "目的国关税率",
      empty: "输入HSK和目的国后，可查看出口要求、FTA原产地证明、买方提交资料和目的国关税率。",
      exportControlEmpty: "暂无可显示的出口管制数据。",
      exportControlSection: "战略物资 / 出口管制",
      exportResult: "出口查询结果",
      ftaCoEmpty: "暂无可显示的FTA原产地证明数据。",
      ftaCoSection: "FTA原产地证明及原产地证明资料",
      noResult: "所选基准日暂无可显示的出口信息。",
      pageDescription: "根据HSK和目的国显示出口要求、FTA原产地证明和目的国关税率。",
      pageTitle: "出口与目的国税率",
      panelTitle: "出口与目的国关税率查询",
      requirementEmpty: "暂无可显示的出口要求数据。",
      requirementSection: "出口要求",
      fields: {
        finalUser: "最终用户",
        finalUserPlaceholder: "海外经销商或制造商",
        productSpecs: "产品规格",
        productSpecsPlaceholder: "电压、容量、通信/加密功能等",
        productUse: "最终用途",
        productUsePlaceholder: "例：电动自行车替换用",
      },
      table: {
        baseRate: "基本税率",
        category: "分类",
        destinationHs: "目的国HS",
        destinationName: "品名",
        expertClassification: "专家判定",
        issueMethod: "签发方式",
        keyword: "关键词",
        license: "许可",
        preferentialRate: "协定税率",
        selfClassification: "自行判定",
        specCondition: "条件",
        tariffYear: "年度"
      },
      possible: "可能需要"
    }
  }
} satisfies Record<AppLocale, DiagnosisDictionary>;

export function getDiagnosisDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
