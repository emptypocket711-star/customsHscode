import { defaultLocale, type AppLocale } from "./locales";

export type CargoDictionary = {
  active: {
    cancel: string;
    currentStatus: string;
    description: string;
    pendingStatus: string;
    running: string;
    targetStatus: string;
    title: string;
  };
  form: {
    blYear: string;
    cargoManagementNo: string;
    houseBl: string;
    lookup: string;
    lookupHelp: string;
    lookupPending: string;
    lookupTitle: string;
    lookupDescription: string;
    masterBl: string;
    missingLookupValue: string;
    progressLookupPending: string;
  };
  page: {
    description: string;
    title: string;
  };
  result: {
    agency: string;
    arrivalDate: string;
    cargoManagementNo: string;
    currentStatus: string;
    declarationNo: string;
    detail: string;
    events: string;
    eventsDescription: string;
    grossWeight: string;
    historyEmpty: string;
    houseBl: string;
    location: string;
    managementInspectionYn: string;
    masterBl: string;
    packageCount: string;
    portWarehouse: string;
    processedAt: string;
    status: string;
    vesselName: string;
  };
  diagnostic: {
    detail: string;
    endpoint: string;
    title: string;
  };
  status: {
    active: string;
    cancelled: string;
    checking: string;
    error: string;
    matched: string;
    paused: string;
  };
  targetStatus: {
    arrivalReport: string;
    cfsInbound: string;
    cyInbound: string;
    importAccepted: string;
    importDeclaration: string;
    inbound: string;
    manifestSubmitted: string;
    released: string;
    unloadingAccepted: string;
  };
  watch: {
    email: string;
    empty: string;
    listDescription: string;
    listTitle: string;
    missingWatchValue: string;
    register: string;
    registerPending: string;
    targetStatus: string;
    title: string;
    description: string;
    cadence: string;
    value: string;
    target: string;
    current: string;
    status: string;
    lastChecked: string;
  };
};

const dictionaries = {
  "ko-KR": {
    active: {
      cancel: "감시 해제하기",
      currentStatus: "최근 상태",
      description: "아래 적하목록 알림 감시가 작동 중입니다.",
      pendingStatus: "확인 전",
      running: "감시가 작동중입니다.",
      targetStatus: "목표 상태",
      title: "작동 중인 감시"
    },
    form: {
      blYear: "B/L 연도",
      cargoManagementNo: "화물관리번호",
      houseBl: "House B/L",
      lookup: "조회",
      lookupDescription: "House B/L, Master B/L, 화물관리번호 순서로 현재 진행 상태와 처리 이력을 조회합니다.",
      lookupHelp: "실무 조회는 House B/L을 우선 입력하세요. B/L 조회에는 연도가 함께 필요합니다.",
      lookupPending: "조회 중",
      lookupTitle: "화물통관진행정보 조회",
      masterBl: "Master B/L",
      missingLookupValue: "House B/L, Master B/L, 화물관리번호 중 하나 이상 입력해 주세요.",
      progressLookupPending: "관세청 화물통관진행정보를 조회하고 있습니다."
    },
    page: {
      description: "화물통관진행정보를 조회하고 원하는 상태가 확인되면 이메일 알림을 받을 수 있습니다.",
      title: "적하목록 조회"
    },
    result: {
      agency: "기관",
      arrivalDate: "입항일",
      cargoManagementNo: "화물관리번호",
      currentStatus: "현재 상태",
      declarationNo: "신고번호",
      detail: "상세",
      events: "진행 이력",
      eventsDescription: "관세청 응답에 포함된 처리 이력을 시간순으로 표시합니다.",
      grossWeight: "중량",
      historyEmpty: "진행 이력이 없습니다.",
      houseBl: "House B/L",
      location: "장소",
      managementInspectionYn: "관리대상검사여부",
      masterBl: "Master B/L",
      packageCount: "포장수량",
      portWarehouse: "세관/장치장",
      processedAt: "처리일시",
      status: "상태",
      vesselName: "선명"
    },
    diagnostic: {
      detail: "상세",
      endpoint: "endpoint",
      title: "진단"
    },
    status: {
      active: "감시중",
      cancelled: "감시 해제",
      checking: "확인중",
      error: "오류",
      matched: "메일 발송 완료",
      paused: "일시중지"
    },
    targetStatus: {
      arrivalReport: "입항보고",
      cfsInbound: "CFS 반입",
      cyInbound: "CY 반입",
      importAccepted: "수입신고수리",
      importDeclaration: "수입신고",
      inbound: "반입",
      manifestSubmitted: "적하목록 제출",
      released: "반출완료",
      unloadingAccepted: "하선신고 수리"
    },
    watch: {
      cadence: "5분 감시",
      current: "현재",
      description: "원하는 진행 상태가 확인되면 지정한 이메일로 알림을 보냅니다.",
      email: "알림 받을 이메일",
      empty: "등록된 알림 감시가 없습니다.",
      lastChecked: "최근 확인",
      listDescription: "최근 등록한 화물 상태 알림입니다.",
      listTitle: "내 알림 감시",
      missingWatchValue: "감시할 House B/L, Master B/L, 화물관리번호 중 하나 이상 입력해 주세요.",
      register: "알림 등록",
      registerPending: "등록 중",
      status: "상태",
      target: "목표",
      targetStatus: "알림 받을 상태",
      title: "상태 알림 등록",
      value: "조회값"
    }
  },
  "en-US": {
    active: {
      cancel: "Stop watch",
      currentStatus: "Latest status",
      description: "The cargo notification watches below are active.",
      pendingStatus: "Not checked yet",
      running: "Watch is running.",
      targetStatus: "Target status",
      title: "Active watches"
    },
    form: {
      blYear: "B/L year",
      cargoManagementNo: "Cargo management no.",
      houseBl: "House B/L",
      lookup: "Lookup",
      lookupDescription: "Lookup current progress and history by House B/L, Master B/L, or cargo management number.",
      lookupHelp: "For practical lookup, enter House B/L first. B/L lookup also requires the year.",
      lookupPending: "Looking up",
      lookupTitle: "Cargo clearance progress lookup",
      masterBl: "Master B/L",
      missingLookupValue: "Enter at least one of House B/L, Master B/L, or cargo management number.",
      progressLookupPending: "Looking up customs cargo progress data."
    },
    page: {
      description: "Lookup cargo clearance progress and receive an email when a selected status is detected.",
      title: "Cargo Status Lookup"
    },
    result: {
      agency: "Agency",
      arrivalDate: "Arrival date",
      cargoManagementNo: "Cargo management no.",
      currentStatus: "Current status",
      declarationNo: "Declaration no.",
      detail: "Detail",
      events: "Progress history",
      eventsDescription: "Displays processing history from the customs response in chronological order.",
      grossWeight: "Weight",
      historyEmpty: "No progress history is available.",
      houseBl: "House B/L",
      location: "Location",
      managementInspectionYn: "Inspection target",
      masterBl: "Master B/L",
      packageCount: "Packages",
      portWarehouse: "Customs / warehouse",
      processedAt: "Processed at",
      status: "Status",
      vesselName: "Vessel"
    },
    diagnostic: {
      detail: "Detail",
      endpoint: "Endpoint",
      title: "Diagnostic"
    },
    status: {
      active: "Watching",
      cancelled: "Cancelled",
      checking: "Checking",
      error: "Error",
      matched: "Email sent",
      paused: "Paused"
    },
    targetStatus: {
      arrivalReport: "Arrival report",
      cfsInbound: "CFS inbound",
      cyInbound: "CY inbound",
      importAccepted: "Import accepted",
      importDeclaration: "Import declaration",
      inbound: "Inbound",
      manifestSubmitted: "Manifest submitted",
      released: "Released",
      unloadingAccepted: "Unloading accepted"
    },
    watch: {
      cadence: "5 min watch",
      current: "Current",
      description: "Sends an email when the selected progress status is detected.",
      email: "Notification email",
      empty: "No notification watches are registered.",
      lastChecked: "Last checked",
      listDescription: "Recently registered cargo status notifications.",
      listTitle: "My watches",
      missingWatchValue: "Enter at least one House B/L, Master B/L, or cargo management number to watch.",
      register: "Register notification",
      registerPending: "Registering",
      status: "Status",
      target: "Target",
      targetStatus: "Target status",
      title: "Status notification",
      value: "Lookup value"
    }
  },
  "zh-CN": {
    active: {
      cancel: "解除监控",
      currentStatus: "最近状态",
      description: "以下货物状态通知监控正在运行。",
      pendingStatus: "尚未确认",
      running: "监控正在运行。",
      targetStatus: "目标状态",
      title: "运行中的监控"
    },
    form: {
      blYear: "B/L年度",
      cargoManagementNo: "货物管理编号",
      houseBl: "House B/L",
      lookup: "查询",
      lookupDescription: "按House B/L、Master B/L或货物管理编号查询当前进度和处理历史。",
      lookupHelp: "实务查询建议优先输入House B/L。B/L查询还需要年度。",
      lookupPending: "查询中",
      lookupTitle: "货物通关进度查询",
      masterBl: "Master B/L",
      missingLookupValue: "请至少输入House B/L、Master B/L或货物管理编号之一。",
      progressLookupPending: "正在查询海关货物通关进度信息。"
    },
    page: {
      description: "查询货物通关进度，并在检测到指定状态时接收邮件通知。",
      title: "货物状态查询"
    },
    result: {
      agency: "机构",
      arrivalDate: "进港日",
      cargoManagementNo: "货物管理编号",
      currentStatus: "当前状态",
      declarationNo: "申报编号",
      detail: "详细",
      events: "进度历史",
      eventsDescription: "按时间顺序显示海关响应中的处理历史。",
      grossWeight: "重量",
      historyEmpty: "暂无进度历史。",
      houseBl: "House B/L",
      location: "地点",
      managementInspectionYn: "管理检查对象",
      masterBl: "Master B/L",
      packageCount: "包装数量",
      portWarehouse: "海关/仓库",
      processedAt: "处理时间",
      status: "状态",
      vesselName: "船名"
    },
    diagnostic: {
      detail: "详细",
      endpoint: "Endpoint",
      title: "诊断"
    },
    status: {
      active: "监控中",
      cancelled: "已解除",
      checking: "检查中",
      error: "错误",
      matched: "邮件已发送",
      paused: "暂停"
    },
    targetStatus: {
      arrivalReport: "入港报告",
      cfsInbound: "CFS入库",
      cyInbound: "CY入库",
      importAccepted: "进口申报受理",
      importDeclaration: "进口申报",
      inbound: "入库",
      manifestSubmitted: "舱单提交",
      released: "放行完成",
      unloadingAccepted: "卸货申报受理"
    },
    watch: {
      cadence: "5分钟监控",
      current: "当前",
      description: "检测到指定进度状态后，向指定邮箱发送通知。",
      email: "接收通知邮箱",
      empty: "暂无已注册的通知监控。",
      lastChecked: "最近确认",
      listDescription: "最近注册的货物状态通知。",
      listTitle: "我的通知监控",
      missingWatchValue: "请至少输入要监控的House B/L、Master B/L或货物管理编号之一。",
      register: "注册通知",
      registerPending: "注册中",
      status: "状态",
      target: "目标",
      targetStatus: "通知目标状态",
      title: "状态通知注册",
      value: "查询值"
    }
  }
} satisfies Record<AppLocale, CargoDictionary>;

export function getCargoDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
