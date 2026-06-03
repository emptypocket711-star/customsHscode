import { defaultLocale, type AppLocale } from "./locales";

type GreetingSlot = "morning" | "lunch" | "afternoon" | "afterHours";

export type NavItemKey =
  | "dashboard"
  | "requests"
  | "hsDirect"
  | "hsBatch"
  | "hsOverseas"
  | "cargo"
  | "tradeNews"
  | "usedCarExport"
  | "dutyEstimator"
  | "users"
  | "notices"
  | "health"
  | "legalUpdates"
  | "staffReview";

type ChromeDictionary = {
  header: {
    defaultUser: string;
    greetingTemplate: string;
    greetings: Record<GreetingSlot, string>;
    language: string;
    login: string;
    logout: string;
  };
  nav: {
    collapse: string;
    expand: string;
    items: Record<NavItemKey, string>;
    menu: string;
    menuHint: string;
    sections: {
      operations: string;
      resources: string;
      secondary: string;
      workspace: string;
    };
  };
};

const dictionaries = {
  "ko-KR": {
    header: {
      defaultUser: "사용자",
      greetingTemplate: "{name}님, 안녕하세요.",
      greetings: {
        morning: "오늘 필요한 내용을 차분히 살펴보세요.",
        lunch: "잠시 쉬어가며 다음 흐름을 정리해 보세요.",
        afternoon: "남은 시간도 무리하지 않고 하나씩 확인해 보세요.",
        afterHours: "늦은 시간입니다. 중요한 항목만 확인하고 편안히 마무리해 보세요."
      },
      language: "언어",
      login: "로그인",
      logout: "로그아웃"
    },
    nav: {
      collapse: "메뉴 접기",
      expand: "메뉴 펼치기",
      items: {
        cargo: "적하목록 조회",
        dashboard: "대시보드",
        requests: "요청 관리",
        dutyEstimator: "납세액 계산",
        health: "운영 홈",
        hsBatch: "HS 일괄 조회",
        hsDirect: "통합 조회",
        hsOverseas: "해외 HS CODE 조회",
        legalUpdates: "자료 관리",
        notices: "공지 관리",
        staffReview: "검토 큐",
        tradeNews: "무역 정보",
        usedCarExport: "중고차 수출",
        users: "고객 계정"
      },
      menu: "메뉴",
      menuHint: "조회 화면 이동",
      sections: {
        operations: "운영 관리",
        resources: "정보·자료",
        secondary: "실무 도구",
        workspace: "업무 조회"
      }
    }
  },
  "en-US": {
    header: {
      defaultUser: "User",
      greetingTemplate: "Hello, {name}.",
      greetings: {
        morning: "Take a steady look at what matters today.",
        lunch: "Pause for a moment and organize what comes next.",
        afternoon: "Move through the remaining items one step at a time.",
        afterHours: "It is late. Focus on the essentials and close the day calmly."
      },
      language: "Language",
      login: "Log in",
      logout: "Log out"
    },
    nav: {
      collapse: "Collapse menu",
      expand: "Expand menu",
      items: {
        cargo: "Cargo Manifest",
        dashboard: "Dashboard",
        requests: "Requests",
        dutyEstimator: "Duty Calculator",
        health: "Operations Home",
        hsBatch: "Batch HS Lookup",
        hsDirect: "HS Lookup",
        hsOverseas: "Overseas HS Lookup",
        legalUpdates: "Data Management",
        notices: "Notice Management",
        staffReview: "Review Queue",
        tradeNews: "Trade Resources",
        usedCarExport: "Used-Car Export",
        users: "Customer Accounts"
      },
      menu: "Menu",
      menuHint: "Open workflow",
      sections: {
        operations: "Operations Admin",
        resources: "Resources",
        secondary: "Practical Tools",
        workspace: "Workflows"
      }
    }
  },
  "zh-CN": {
    header: {
      defaultUser: "用户",
      greetingTemplate: "{name}，您好。",
      greetings: {
        morning: "请平稳地查看今天需要确认的内容。",
        lunch: "请稍作休息，再整理下一步事项。",
        afternoon: "剩余内容可以一步一步确认。",
        afterHours: "时间已晚，请优先确认重要事项并平稳收尾。"
      },
      language: "语言",
      login: "登录",
      logout: "退出"
    },
    nav: {
      collapse: "收起菜单",
      expand: "展开菜单",
      items: {
        cargo: "舱单查询",
        dashboard: "仪表板",
        requests: "请求管理",
        dutyEstimator: "税费估算",
        health: "运营首页",
        hsBatch: "HS 批量查询",
        hsDirect: "HS 综合查询",
        hsOverseas: "海外 HS 编码查询",
        legalUpdates: "资料管理",
        notices: "公告管理",
        staffReview: "复核队列",
        tradeNews: "贸易资讯",
        usedCarExport: "二手车出口",
        users: "客户账号"
      },
      menu: "菜单",
      menuHint: "切换页面",
      sections: {
        operations: "运营管理",
        resources: "资讯资料",
        secondary: "实务工具",
        workspace: "业务查询"
      }
    }
  }
} satisfies Record<AppLocale, ChromeDictionary>;

function getGreetingSlot(date = new Date()): GreetingSlot {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Seoul"
    }).format(date)
  );

  if (hour >= 5 && hour <= 10) return "morning";
  if (hour >= 11 && hour <= 13) return "lunch";
  if (hour >= 14 && hour <= 18) return "afternoon";
  return "afterHours";
}

export function getChromeDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function formatGreeting(template: string, name: string) {
  return template.replace("{name}", name);
}

export function getHeaderGreeting(locale: AppLocale, date = new Date()) {
  const dictionary = getChromeDictionary(locale);
  return dictionary.header.greetings[getGreetingSlot(date)];
}
