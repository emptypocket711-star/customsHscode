import { defaultLocale, type AppLocale } from "./locales";

export type UsedCarExportDictionary = {
  common: {
    close: string;
    lookup: string;
    lookupPending: string;
    openOriginal: string;
  };
  tabs: {
    overview: string;
    vehicleSpec: string;
    containerCheck: string;
  };
  overview: {
    description: string;
    featureDescription: string;
    featureTitle: string;
    title: string;
    rows: Array<{ description: string; title: string }>;
  };
  vehicleSpec: {
    emptyDetails: string;
    externalHelp: string;
    inputLabel: string;
    missingInput: string;
    pageDescription: string;
    pageTitle: string;
    pendingMessage: string;
    rangeDescription: string;
    rangeItems: string[];
    rangeTitle: string;
    resultDescription: string;
    resultTitle: string;
    source: string;
    sourceOpen: string;
    retrievedAt: string;
    title: string;
    description: string;
  };
  container: {
    cardDescription: string;
    cardTitle: string;
    currentSupport: string;
    downloadSuccess: string;
    externalReadOnly: string;
    inputLabel: string;
    missingInput: string;
    modalTitle: string;
    pageDescription: string;
    pageTitle: string;
    pendingMessage: string;
    receipt: string;
    receiptFileSuffix: string;
    receiptPending: string;
    receiptPendingSecondsSuffix: string;
    receiptUnknownError: string;
    resultDescription: string;
    resultTitle: string;
    summaryFirstLine: string;
    summarySecondLine: string;
    terminalFallback: string;
    trackingBadge: string;
    trackingTable: {
      car: string;
      container: string;
      datetime: string;
      status: string;
      terminal: string;
    };
  };
};

const dictionaries = {
  "ko-KR": {
    common: {
      close: "닫기",
      lookup: "조회",
      lookupPending: "조회 중",
      openOriginal: "원사이트 열기"
    },
    tabs: {
      overview: "개요",
      vehicleSpec: "제원정보 조회",
      containerCheck: "컨테이너 반입 확인"
    },
    overview: {
      description: "중고차 수출 실무에서 자주 확인하는 제원, 컨테이너 반입, 터미널 조회 기능을 모아두는 작업 공간입니다.",
      featureDescription: "필요한 업무를 선택해서 조회를 시작합니다.",
      featureTitle: "지원 기능",
      rows: [
        {
          title: "제원정보 조회",
          description: "제원관리번호로 자동차 제원 정보를 확인합니다."
        },
        {
          title: "컨테이너 반입 확인",
          description: "컨테이너 번호로 터미널 반입 정보를 확인합니다."
        }
      ],
      title: "중고차 수출"
    },
    vehicleSpec: {
      description: "제원관리번호를 입력하면 한국교통안전공단 사이버검사소의 자동차 제원조회 결과를 표시합니다.",
      emptyDetails: "표시할 상세 항목이 없습니다.",
      externalHelp: "자동차명 검색이 아니라 제원관리번호 기준 조회입니다.",
      inputLabel: "제원관리번호",
      missingInput: "제원관리번호를 입력해 주세요.",
      pageDescription: "제원관리번호로 자동차 제원 정보를 조회합니다. 조회 결과는 CyberTS 원문 화면과 함께 확인할 수 있습니다.",
      pageTitle: "제원정보 조회",
      pendingMessage: "CyberTS 자동차 제원 정보를 조회하고 있습니다.",
      rangeDescription: "이 기능은 CyberTS 자동차 제원관리번호 조회 화면을 보조적으로 연결합니다.",
      rangeItems: [
        "자동차가 기본 선택된 상태로 조회합니다.",
        "입력값은 제원관리번호 기준입니다. 자동차명, 모델명만으로는 조회되지 않을 수 있습니다.",
        "외부 사이트의 보안 정책이나 화면 구조 변경에 따라 조회가 제한될 수 있습니다."
      ],
      rangeTitle: "조회 범위",
      resultDescription: "{sourceName}에서 조회한 자동차 제원 정보입니다.",
      resultTitle: "조회 결과",
      retrievedAt: "조회시각",
      source: "출처",
      sourceOpen: "원문 조회 화면 열기",
      title: "자동차 제원관리번호 조회"
    },
    container: {
      cardDescription: "컨테이너 번호를 입력하면 운송현황을 먼저 확인하고 터미널 조회 결과를 화면에 표시합니다.",
      cardTitle: "컨테이너 반입 확인",
      currentSupport: "현재는 한진인천, 선광신, 인천컨테이너터미널, 인천항국제페리부두, BNCT, 평택컨테이너터미널, 평택동방아이포트 확인을 지원합니다.",
      downloadSuccess: "반입계 이미지 다운로드를 시작했습니다.",
      externalReadOnly: "외부 터미널 조회 결과를 읽기 전용으로 표시합니다.",
      inputLabel: "컨테이너 번호",
      missingInput: "컨테이너 번호를 입력해 주세요.",
      modalTitle: "{terminalName} 원문 조회 화면",
      pageDescription: "컨테이너 번호로 터미널 반입 정보를 조회하고 원문 화면을 팝업으로 확인합니다.",
      pageTitle: "컨테이너 반입 확인",
      pendingMessage: "터미널 조회 화면을 불러오고 있습니다.",
      receipt: "반입계 출력",
      receiptFileSuffix: "반입계",
      receiptPending: "출력 생성 중",
      receiptPendingSecondsSuffix: "초",
      receiptUnknownError: "반입계 이미지를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      resultDescription: "{terminalName}에서 내려온 주요 항목입니다.",
      resultTitle: "조회 요약",
      summaryFirstLine: "상단 이력은 운송현황 조회 결과의 최신 순서입니다.",
      summarySecondLine: "현재 결과는 연결된 터미널 원문 조회 화면을 기준으로 표시합니다.",
      terminalFallback: "터미널",
      trackingBadge: "운송현황 + 터미널",
      trackingTable: {
        car: "차량",
        container: "컨테이너",
        datetime: "일시",
        status: "상태",
        terminal: "터미널"
      }
    }
  },
  "en-US": {
    common: {
      close: "Close",
      lookup: "Lookup",
      lookupPending: "Looking up",
      openOriginal: "Open source site"
    },
    tabs: {
      overview: "Overview",
      vehicleSpec: "Vehicle Specs",
      containerCheck: "Container Gate-in"
    },
    overview: {
      description: "A workspace for frequently checked used-car export tasks, including vehicle specs, container gate-in, and terminal lookup.",
      featureDescription: "Select a task to start lookup.",
      featureTitle: "Available tools",
      rows: [
        {
          title: "Vehicle specs lookup",
          description: "Check vehicle specification data by specification management number."
        },
        {
          title: "Container gate-in check",
          description: "Check terminal gate-in information by container number."
        }
      ],
      title: "Used-Car Export"
    },
    vehicleSpec: {
      description: "Enter a specification management number to display vehicle specification results from CyberTS.",
      emptyDetails: "No detail items are available.",
      externalHelp: "Lookup is based on the specification management number, not vehicle name.",
      inputLabel: "Spec management no.",
      missingInput: "Enter a specification management number.",
      pageDescription: "Lookup vehicle specification data by specification management number and review it with the CyberTS source screen.",
      pageTitle: "Vehicle Specs",
      pendingMessage: "Looking up CyberTS vehicle specification data.",
      rangeDescription: "This tool connects to the CyberTS vehicle specification lookup screen as a support workflow.",
      rangeItems: [
        "The lookup runs with automobile selected by default.",
        "Input must be a specification management number. Vehicle name or model name alone may not return results.",
        "Lookup may be limited if the external site changes its security policy or screen structure."
      ],
      rangeTitle: "Lookup scope",
      resultDescription: "Vehicle specification data looked up from {sourceName}.",
      resultTitle: "Lookup result",
      retrievedAt: "Retrieved at",
      source: "Source",
      sourceOpen: "Open source lookup screen",
      title: "Vehicle specification management no. lookup"
    },
    container: {
      cardDescription: "Enter a container number to check transport status first, then display terminal lookup results on this page.",
      cardTitle: "Container gate-in check",
      currentSupport: "Currently supports HJIT Incheon, SNCT, ICT, IFPC, BNCT, PCTC, and PNCT lookups.",
      downloadSuccess: "Started downloading the gate-in receipt image.",
      externalReadOnly: "Displays the external terminal lookup result in read-only mode.",
      inputLabel: "Container no.",
      missingInput: "Enter a container number.",
      modalTitle: "{terminalName} source lookup screen",
      pageDescription: "Lookup terminal gate-in information by container number and review the source screen in a popup.",
      pageTitle: "Container Gate-in",
      pendingMessage: "Loading the terminal lookup screen.",
      receipt: "Download receipt",
      receiptFileSuffix: "gate-in-receipt",
      receiptPending: "Generating receipt",
      receiptPendingSecondsSuffix: "s",
      receiptUnknownError: "Could not generate the receipt image. Try again shortly.",
      resultDescription: "Key fields returned from {terminalName}.",
      resultTitle: "Lookup summary",
      summaryFirstLine: "The top history rows are shown in latest-first order from transport status lookup.",
      summarySecondLine: "The current result is displayed from the linked terminal source lookup screen.",
      terminalFallback: "Terminal",
      trackingBadge: "Transport + terminal",
      trackingTable: {
        car: "Vehicle",
        container: "Container",
        datetime: "Date/time",
        status: "Status",
        terminal: "Terminal"
      }
    }
  },
  "zh-CN": {
    common: {
      close: "关闭",
      lookup: "查询",
      lookupPending: "查询中",
      openOriginal: "打开原网站"
    },
    tabs: {
      overview: "概览",
      vehicleSpec: "车辆规格查询",
      containerCheck: "集装箱入场确认"
    },
    overview: {
      description: "用于二手车出口实务中常用的车辆规格、集装箱入场和码头查询工作区。",
      featureDescription: "请选择需要的业务并开始查询。",
      featureTitle: "支持功能",
      rows: [
        {
          title: "车辆规格查询",
          description: "通过规格管理编号确认车辆规格信息。"
        },
        {
          title: "集装箱入场确认",
          description: "通过集装箱编号确认码头入场信息。"
        }
      ],
      title: "二手车出口"
    },
    vehicleSpec: {
      description: "输入规格管理编号后，显示韩国交通安全公团CyberTS的车辆规格查询结果。",
      emptyDetails: "暂无可显示的详细项目。",
      externalHelp: "该查询基于规格管理编号，不是车辆名称查询。",
      inputLabel: "规格管理编号",
      missingInput: "请输入规格管理编号。",
      pageDescription: "通过规格管理编号查询车辆规格信息，并可同时查看CyberTS原文页面。",
      pageTitle: "车辆规格查询",
      pendingMessage: "正在查询CyberTS车辆规格信息。",
      rangeDescription: "该功能辅助连接CyberTS车辆规格管理编号查询页面。",
      rangeItems: [
        "以汽车为默认选项进行查询。",
        "输入值以规格管理编号为准，仅输入车辆名或型号可能无法查询。",
        "外部网站安全政策或页面结构变更时，查询可能受到限制。"
      ],
      rangeTitle: "查询范围",
      resultDescription: "从{sourceName}查询到的车辆规格信息。",
      resultTitle: "查询结果",
      retrievedAt: "查询时间",
      source: "来源",
      sourceOpen: "打开原文查询页面",
      title: "车辆规格管理编号查询"
    },
    container: {
      cardDescription: "输入集装箱编号后，先确认运输状态，再在页面显示码头查询结果。",
      cardTitle: "集装箱入场确认",
      currentSupport: "当前支持韩进仁川、鲜光新港、仁川集装箱码头、仁川港国际渡轮码头、BNCT、平泽集装箱码头、平泽东邦I-Port查询。",
      downloadSuccess: "已开始下载入场凭证图片。",
      externalReadOnly: "以只读方式显示外部码头查询结果。",
      inputLabel: "集装箱编号",
      missingInput: "请输入集装箱编号。",
      modalTitle: "{terminalName}原文查询页面",
      pageDescription: "通过集装箱编号查询码头入场信息，并在弹窗中查看原文页面。",
      pageTitle: "集装箱入场确认",
      pendingMessage: "正在加载码头查询页面。",
      receipt: "下载入场凭证",
      receiptFileSuffix: "入场凭证",
      receiptPending: "正在生成凭证",
      receiptPendingSecondsSuffix: "秒",
      receiptUnknownError: "无法生成入场凭证图片。请稍后再试。",
      resultDescription: "{terminalName}返回的主要项目。",
      resultTitle: "查询摘要",
      summaryFirstLine: "上方履历按运输状态查询结果的最新顺序显示。",
      summarySecondLine: "当前结果基于已连接码头的原文查询页面显示。",
      terminalFallback: "码头",
      trackingBadge: "运输状态 + 码头",
      trackingTable: {
        car: "车辆",
        container: "集装箱",
        datetime: "时间",
        status: "状态",
        terminal: "码头"
      }
    }
  }
} satisfies Record<AppLocale, UsedCarExportDictionary>;

export function getUsedCarExportDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
