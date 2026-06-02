import { defaultLocale, type AppLocale } from "./locales";

export type DashboardDictionary = {
  hero: {
    basisDate: string;
    description: string;
    title: string;
  };
  lookup: {
    country: string;
    direction: string;
    export: string;
    hsDirect: string;
    import: string;
    helper: string;
    overseasHs: string;
    query: string;
    queryPlaceholder: string;
    submit: string;
  };
  startGuide: {
    title: string;
    items: Array<{
      label: string;
      title: string;
      description: string;
    }>;
  };
  lists: {
    cargo: {
      description: string;
      empty: string;
      meta: Record<string, string>;
      statusPrefix: string;
      title: string;
      targetSuffix: string;
      unchecked: string;
    };
    favorites: {
      defaultName: string;
      description: string;
      empty: string;
      title: string;
    };
    history: {
      description: string;
      empty: string;
      export: string;
      import: string;
      title: string;
    };
  };
  notices: {
    categories: {
      data_update: string;
      maintenance: string;
      notice: string;
      release: string;
    };
    close: string;
    description: string;
    empty: string;
    hideOneDay: string;
    noContent: string;
    open: string;
    pinned: string;
    recent: string;
    title: string;
  };
  marketplace: {
    foreignPartnerNote: string;
    statusLabel: Record<string, string>;
    partyTypeLabel: Record<string, string>;
    actions: Record<"foreignClearance" | "foreignFreight", {
      description: string;
      title: string;
    }>;
  };
  workflows: {
    open: string;
    whenLabel: string;
    description: string;
    title: string;
    groups: {
      primary: string;
      resources: string;
      tools: string;
    };
    items: Record<"batch" | "cargo" | "duty" | "trade-news" | "vehicle-spec", {
      description: string;
      title: string;
      when: string;
    }>;
  };
};

const dictionaries = {
  "ko-KR": {
    hero: {
      basisDate: "조회 기준일",
      description: "검색, 후속 업무, 반복 조회 항목을 한 곳에서 확인합니다.",
      title: "대시보드"
    },
    lookup: {
      country: "수입국가/목적국",
      direction: "조회 구분",
      export: "수출",
      hsDirect: "HS CODE·품명 통합 검색",
      import: "수입",
      helper: "HS CODE는 직접 조회하고, 품명은 AI가 가까운 후보를 찾아줍니다.",
      overseasHs: "해외 HS 검색",
      query: "검색어",
      queryPlaceholder: "예: 3304.99-1000, mushroom powder, 레이니 키보드",
      submit: "조회"
    },
    startGuide: {
      title: "처음이면 이렇게 시작하세요",
      items: [
        { label: "1", title: "품명 또는 HS CODE 검색", description: "상단 검색창에서 후보나 10자리 상세를 확인합니다." },
        { label: "2", title: "필요한 후속 업무 선택", description: "화물 조회, 일괄 조회, 납세액 산출처럼 이어지는 업무만 아래에서 엽니다." },
        { label: "3", title: "자주 보는 항목 재사용", description: "즐겨찾기와 최근 검색에서 반복 품목을 다시 조회합니다." }
      ]
    },
    lists: {
      cargo: {
        description: "감시 중인 화물과 최근 확인 상태를 봅니다.",
        empty: "작동 중인 적하목록 감시가 없습니다.",
        meta: {
          active: "감시중",
          checking: "확인중",
          matched: "메일 발송 완료",
          cancelled: "감시 해제",
          paused: "일시중지",
          error: "오류"
        },
        statusPrefix: "현재",
        title: "적하목록 알림 감시",
        targetSuffix: "도달 알림",
        unchecked: "확인 전"
      },
      favorites: {
        defaultName: "저장한 HS CODE",
        description: "반복 조회하는 10자리 코드를 다시 엽니다.",
        empty: "아직 즐겨찾기한 HS CODE가 없습니다.",
        title: "즐겨찾기 HS CODE"
      },
      history: {
        description: "최근에 검색한 품명과 HS CODE를 이어서 봅니다.",
        empty: "아직 저장된 최근 검색이 없습니다.",
        export: "수출",
        import: "수입",
        title: "최근 검색"
      }
    },
    notices: {
      categories: {
        data_update: "자료 업데이트",
        maintenance: "점검",
        notice: "공지",
        release: "기능 배포"
      },
      close: "닫기",
      description: "서비스 이용에 영향을 주는 공지와 업데이트를 확인합니다.",
      empty: "등록된 공지사항이 없습니다.",
      hideOneDay: "1일 동안 보지 않기",
      noContent: "내용 없음",
      open: "열기",
      pinned: "상단",
      recent: "최근 {count}건",
      title: "공지사항"
    },
    marketplace: {
      foreignPartnerNote: "해외 파트너는 한국 사업자등록번호 없이도 연결 요청을 시작할 수 있습니다.",
      statusLabel: {
        blocked: "차단",
        documents_submitted: "서류 제출",
        email_verified: "이메일 인증",
        operator_approved: "운영자 승인",
        recommended_partner: "추천 파트너",
        suspended: "숨김/정지",
        trade_history: "거래 이력",
        unverified: "미검증"
      },
      partyTypeLabel: {
        customs_broker: "관세사",
        domestic_shipper: "국내 수출입 화주",
        foreign_shipper: "해외 수출입 파트너",
        forwarder: "포워더"
      },
      actions: {
        foreignClearance: {
          description: "한국 통관이 필요한 품목과 서류 범위를 정리하고 관세사무소 연결 요청을 시작합니다.",
          title: "한국 통관 연결 요청"
        },
        foreignFreight: {
          description: "한국으로 보내거나 한국에서 받을 화물 정보를 정리하고 포워더 연결 요청을 시작합니다.",
          title: "한국 운송 연결 요청"
        }
      }
    },
    workflows: {
      open: "열기",
      whenLabel: "사용 시점",
      description: "상단 검색 이후 자주 이어지는 실무 작업입니다.",
      title: "후속 업무·실무 도구",
      groups: {
        primary: "후속 업무",
        resources: "정보·동향",
        tools: "실무 도구"
      },
      items: {
        batch: { description: "여러 품목을 한 번에 확인", title: "HS 일괄 조회", when: "엑셀 품목이 여러 줄일 때" },
        cargo: { description: "HBL 진행 상태와 알림", title: "적하목록 조회", when: "선적 후 통관 진행을 볼 때" },
        duty: { description: "입력값 기준 관세·내국세 예비 산출", title: "예상 납세액 산출", when: "수입 전 비용을 가늠할 때" },
        "trade-news": { description: "무역 뉴스와 실무 참고자료 확인", title: "무역 정보", when: "제도 변화와 시장 동향을 볼 때" },
        "vehicle-spec": { description: "제원·컨테이너·터미널 실무 확인", title: "중고차 수출", when: "중고차 수출 실무를 확인할 때" }
      }
    }
  },
  "en-US": {
    hero: {
      basisDate: "Basis date",
      description: "Search, follow-up work, and repeated lookup items in one workspace.",
      title: "Dashboard"
    },
    lookup: {
      country: "Import country / destination",
      direction: "Lookup mode",
      export: "Export",
      hsDirect: "HS code / product lookup",
      import: "Import",
      helper: "HS codes open direct lookup; product names use AI candidate search.",
      overseasHs: "Overseas HS lookup",
      query: "Search term",
      queryPlaceholder: "e.g. 3304.99-1000, mushroom powder, rainy keyboard",
      submit: "Search"
    },
    startGuide: {
      title: "Start here",
      items: [
        { label: "1", title: "Search product or HS code", description: "Use the main search for candidates or 10-digit details." },
        { label: "2", title: "Open follow-up work", description: "Continue only with the cargo, batch, or duty tools you need." },
        { label: "3", title: "Reuse frequent items", description: "Return to saved favorites and recent lookups for repeated items." }
      ]
    },
    lists: {
      cargo: {
        description: "Review watched cargo and latest status.",
        empty: "No active cargo status watches.",
        meta: {
          active: "Watching",
          checking: "Checking",
          matched: "Email sent",
          cancelled: "Cancelled",
          paused: "Paused",
          error: "Error"
        },
        statusPrefix: "Current",
        title: "Cargo alerts",
        targetSuffix: "target alert",
        unchecked: "Not checked"
      },
      favorites: {
        defaultName: "Saved HS code",
        description: "Reopen 10-digit codes you use repeatedly.",
        empty: "No favorite HS codes yet.",
        title: "Favorite HS codes"
      },
      history: {
        description: "Continue from recently searched products and HS codes.",
        empty: "No recent lookups yet.",
        export: "Export",
        import: "Import",
        title: "Recent lookups"
      }
    },
    notices: {
      categories: {
        data_update: "Data update",
        maintenance: "Maintenance",
        notice: "Notice",
        release: "Release"
      },
      close: "Close",
      description: "Check notices and updates that affect service use.",
      empty: "No notices have been posted.",
      hideOneDay: "Do not show for 1 day",
      noContent: "No content",
      open: "Open",
      pinned: "Pinned",
      recent: "{count} recent",
      title: "Notices"
    },
    marketplace: {
      foreignPartnerNote: "Overseas partners can start Korea connection requests without a Korean business registration number.",
      statusLabel: {
        blocked: "Blocked",
        documents_submitted: "Documents submitted",
        email_verified: "Email verified",
        operator_approved: "Operator approved",
        recommended_partner: "Recommended partner",
        suspended: "Hidden / suspended",
        trade_history: "Trade history",
        unverified: "Unverified"
      },
      partyTypeLabel: {
        customs_broker: "Customs broker",
        domestic_shipper: "Korean shipper",
        foreign_shipper: "Overseas trade partner",
        forwarder: "Forwarder"
      },
      actions: {
        foreignClearance: {
          description: "Prepare item and document details for Korean customs brokerage connection.",
          title: "Request Korea customs connection"
        },
        foreignFreight: {
          description: "Prepare cargo details for shipment to or from Korea and request a forwarder connection.",
          title: "Request Korea freight connection"
        }
      }
    },
    workflows: {
      open: "Open",
      whenLabel: "Use when",
      description: "Frequent follow-up work after the main search.",
      title: "Follow-up work and tools",
      groups: {
        primary: "Follow-up work",
        resources: "Resources",
        tools: "Practical tools"
      },
      items: {
        batch: { description: "Check multiple items at once", title: "Batch HS lookup", when: "You have multiple spreadsheet lines" },
        cargo: { description: "HBL progress and alerts", title: "Cargo manifest", when: "You need shipment progress" },
        duty: { description: "Preliminary duty and tax estimate", title: "Estimated duties", when: "You need an import cost estimate" },
        "trade-news": { description: "Trade news and practical references", title: "Trade resources", when: "You track policy and market changes" },
        "vehicle-spec": { description: "Vehicle specs, containers, and terminal checks", title: "Used-car export", when: "You handle used-car export work" }
      }
    }
  },
  "zh-CN": {
    hero: {
      basisDate: "查询基准日",
      description: "在一个工作区处理搜索、后续业务和重复查询项目。",
      title: "仪表板"
    },
    lookup: {
      country: "进口国家/目的地",
      direction: "查询区分",
      export: "出口",
      hsDirect: "HS编码/品名综合查询",
      import: "进口",
      helper: "HS编码直接查询，品名由AI查找相近候选。",
      overseasHs: "海外HS查询",
      query: "搜索词",
      queryPlaceholder: "例：3304.99-1000, mushroom powder, rainy keyboard",
      submit: "查询"
    },
    startGuide: {
      title: "首次使用建议",
      items: [
        { label: "1", title: "搜索品名或HS编码", description: "在上方搜索框确认候选或10位详细信息。" },
        { label: "2", title: "选择后续业务", description: "只打开需要继续处理的舱单、批量查询或税费工具。" },
        { label: "3", title: "重复使用常用项目", description: "从收藏和最近查询中重新打开常用商品。" }
      ]
    },
    lists: {
      cargo: {
        description: "查看监控中的货物和最新状态。",
        empty: "没有正在运行的舱单状态监控。",
        meta: {
          active: "监控中",
          checking: "检查中",
          matched: "邮件已发送",
          cancelled: "已取消",
          paused: "已暂停",
          error: "错误"
        },
        statusPrefix: "当前",
        title: "舱单提醒监控",
        targetSuffix: "到达提醒",
        unchecked: "未确认"
      },
      favorites: {
        defaultName: "已保存的HS编码",
        description: "重新打开经常查询的10位编码。",
        empty: "尚未收藏HS编码。",
        title: "收藏HS编码"
      },
      history: {
        description: "继续查看最近搜索的品名和HS编码。",
        empty: "尚无最近查询记录。",
        export: "出口",
        import: "进口",
        title: "最近查询"
      }
    },
    notices: {
      categories: {
        data_update: "数据更新",
        maintenance: "维护",
        notice: "公告",
        release: "功能发布"
      },
      close: "关闭",
      description: "查看影响服务使用的公告和更新。",
      empty: "暂无公告。",
      hideOneDay: "1天内不再显示",
      noContent: "无内容",
      open: "打开",
      pinned: "置顶",
      recent: "最近{count}条",
      title: "公告"
    },
    marketplace: {
      foreignPartnerNote: "海外伙伴无需韩国营业执照号码，也可以开始韩国业务连接请求。",
      statusLabel: {
        blocked: "已阻止",
        documents_submitted: "资料已提交",
        email_verified: "邮箱已认证",
        operator_approved: "运营已批准",
        recommended_partner: "推荐伙伴",
        suspended: "隐藏/暂停",
        trade_history: "交易记录",
        unverified: "未验证"
      },
      partyTypeLabel: {
        customs_broker: "关务代理",
        domestic_shipper: "韩国进出口货主",
        foreign_shipper: "海外贸易伙伴",
        forwarder: "货代"
      },
      actions: {
        foreignClearance: {
          description: "整理需要韩国通关的品目和单证范围，并请求连接关务代理。",
          title: "请求韩国通关连接"
        },
        foreignFreight: {
          description: "整理发往韩国或从韩国发出的货物信息，并请求连接货代。",
          title: "请求韩国运输连接"
        }
      }
    },
    workflows: {
      open: "打开",
      whenLabel: "使用场景",
      description: "主搜索之后常用的后续实务操作。",
      title: "后续业务和实务工具",
      groups: {
        primary: "后续业务",
        resources: "资讯动态",
        tools: "实务工具"
      },
      items: {
        batch: { description: "一次确认多个品目", title: "HS批量查询", when: "有多行商品资料时" },
        cargo: { description: "HBL进度和提醒", title: "舱单查询", when: "需要确认货物进度时" },
        duty: { description: "关税和内税的初步估算", title: "预计税费", when: "需要估算进口成本时" },
        "trade-news": { description: "查看贸易资讯和实务参考", title: "贸易资讯", when: "关注政策和市场变化时" },
        "vehicle-spec": { description: "车辆参数、集装箱和码头实务确认", title: "二手车出口", when: "处理中古车出口业务时" }
      }
    }
  }
} satisfies Record<AppLocale, DashboardDictionary>;

export function getDashboardDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function formatDashboardCount(template: string, count: number) {
  return template.replace("{count}", new Intl.NumberFormat("en-US").format(count));
}
