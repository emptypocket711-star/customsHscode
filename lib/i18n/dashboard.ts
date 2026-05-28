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
    overseasHs: string;
    popular: string;
    productAi: string;
    query: string;
    queryPlaceholder: string;
    submit: string;
  };
  lists: {
    cargo: {
      empty: string;
      meta: Record<string, string>;
      statusPrefix: string;
      title: string;
      targetSuffix: string;
      unchecked: string;
    };
    favorites: {
      defaultName: string;
      empty: string;
      title: string;
    };
    history: {
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
    empty: string;
    hideOneDay: string;
    noContent: string;
    open: string;
    pinned: string;
    recent: string;
    title: string;
  };
  workflows: {
    edit: string;
    editClose: string;
    open: string;
    title: string;
    items: Record<"cargo" | "direct" | "duty" | "overseas" | "vehicle-spec", {
      description: string;
      title: string;
    }>;
  };
};

const dictionaries = {
  "ko-KR": {
    hero: {
      basisDate: "조회 기준일",
      description: "자주 쓰는 메뉴, 공지사항, 즐겨찾기와 최근 검색 기록을 한 곳에서 확인합니다.",
      title: "대시보드"
    },
    lookup: {
      country: "수입국가/목적국",
      direction: "조회 구분",
      export: "수출",
      hsDirect: "HS CODE 직접 검색",
      import: "수입",
      overseasHs: "해외 HS 검색",
      popular: "인기 검색어",
      productAi: "품명 검색 AI",
      query: "검색어",
      queryPlaceholder: "예: 3304.99-1000, mushroom powder, 레이니 키보드",
      submit: "조회"
    },
    lists: {
      cargo: {
        empty: "작동 중인 적하목록 감시가 없습니다.",
        meta: {
          active: "감시중",
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
        empty: "아직 즐겨찾기한 HS CODE가 없습니다.",
        title: "즐겨찾기 HS CODE"
      },
      history: {
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
      empty: "등록된 공지사항이 없습니다.",
      hideOneDay: "1일 동안 보지 않기",
      noContent: "내용 없음",
      open: "열기",
      pinned: "상단",
      recent: "최근 {count}건",
      title: "공지사항"
    },
    workflows: {
      edit: "대시보드 편집",
      editClose: "편집 닫기",
      open: "열기",
      title: "바로가기",
      items: {
        cargo: { description: "HBL 진행 상태와 알림", title: "적하목록 조회" },
        direct: { description: "코드 또는 품명으로 조회", title: "통합 조회" },
        duty: { description: "입력값 기준 예비 산출", title: "예상 납세액 산출" },
        overseas: { description: "목적국 기준으로 조회", title: "해외 HS CODE조회" },
        "vehicle-spec": { description: "제원·컨테이너 조회", title: "중고차 수출" }
      }
    }
  },
  "en-US": {
    hero: {
      basisDate: "Basis date",
      description: "Access frequent workflows, notices, favorites, and recent lookups in one workspace.",
      title: "Dashboard"
    },
    lookup: {
      country: "Import country / destination",
      direction: "Lookup mode",
      export: "Export",
      hsDirect: "HS code lookup",
      import: "Import",
      overseasHs: "Overseas HS lookup",
      popular: "Popular searches",
      productAi: "Product-name AI",
      query: "Search term",
      queryPlaceholder: "e.g. 3304.99-1000, mushroom powder, rainy keyboard",
      submit: "Search"
    },
    lists: {
      cargo: {
        empty: "No active cargo status watches.",
        meta: {
          active: "Watching",
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
        empty: "No favorite HS codes yet.",
        title: "Favorite HS codes"
      },
      history: {
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
      empty: "No notices have been posted.",
      hideOneDay: "Do not show for 1 day",
      noContent: "No content",
      open: "Open",
      pinned: "Pinned",
      recent: "{count} recent",
      title: "Notices"
    },
    workflows: {
      edit: "Customize dashboard",
      editClose: "Close editor",
      open: "Open",
      title: "Shortcuts",
      items: {
        cargo: { description: "HBL progress and alerts", title: "Cargo manifest" },
        direct: { description: "Search by code or product name", title: "Integrated lookup" },
        duty: { description: "Preliminary estimate from entered values", title: "Estimated duties" },
        overseas: { description: "Check by destination country", title: "Overseas HS lookup" },
        "vehicle-spec": { description: "Vehicle specs and container checks", title: "Used-car export" }
      }
    }
  },
  "zh-CN": {
    hero: {
      basisDate: "查询基准日",
      description: "在一个工作区查看常用功能、公告、收藏和最近查询记录。",
      title: "仪表板"
    },
    lookup: {
      country: "进口国家/目的地",
      direction: "查询区分",
      export: "出口",
      hsDirect: "HS编码直接查询",
      import: "进口",
      overseasHs: "海外HS查询",
      popular: "热门搜索",
      productAi: "品名AI查询",
      query: "搜索词",
      queryPlaceholder: "例：3304.99-1000, mushroom powder, rainy keyboard",
      submit: "查询"
    },
    lists: {
      cargo: {
        empty: "没有正在运行的舱单状态监控。",
        meta: {
          active: "监控中",
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
        empty: "尚未收藏HS编码。",
        title: "收藏HS编码"
      },
      history: {
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
      empty: "暂无公告。",
      hideOneDay: "1天内不再显示",
      noContent: "无内容",
      open: "打开",
      pinned: "置顶",
      recent: "最近{count}条",
      title: "公告"
    },
    workflows: {
      edit: "编辑仪表板",
      editClose: "关闭编辑",
      open: "打开",
      title: "快捷入口",
      items: {
        cargo: { description: "HBL进度和提醒", title: "舱单查询" },
        direct: { description: "按编码或品名查询", title: "综合查询" },
        duty: { description: "基于输入值的初步估算", title: "预计税费" },
        overseas: { description: "按目的国标准查询", title: "海外HS查询" },
        "vehicle-spec": { description: "车辆参数和集装箱查询", title: "二手车出口" }
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
