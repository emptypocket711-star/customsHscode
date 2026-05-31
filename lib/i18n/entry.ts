import { defaultLocale, type AppLocale } from "./locales";

export type EntryDictionary = {
  description: string;
  entries: Array<{
    description: string;
    href: string;
    key: "direct" | "overseas" | "cargo" | "duty";
    title: string;
  }>;
  title: string;
};

const dictionaries = {
  "ko-KR": {
    title: "조회 시작",
    description: "가장 많이 쓰는 조회 업무를 선택하세요.",
    entries: [
      { key: "direct", href: "/hs/direct", title: "HS CODE·품명 검색", description: "HS CODE를 직접 조회하거나 품명으로 AI 추천을 받습니다." },
      { key: "overseas", href: "/hs/overseas", title: "해외 HS CODE 조회", description: "목적국 기준 HS CODE와 상대국 세율을 확인합니다." },
      { key: "cargo", href: "/cargo", title: "적하목록 조회", description: "화물 진행 상태 조회와 상태 도달 알림" },
      { key: "duty", href: "/duty-estimator", title: "예상 납세액 산출", description: "물품가격, 환율, 관세율, 내국세 기준 예비 산출" }
    ]
  },
  "en-US": {
    title: "Start Lookup",
    description: "Choose a lookup workflow.",
    entries: [
      { key: "direct", href: "/hs/direct", title: "HS code / product lookup", description: "Search an HS code directly or get AI-assisted product recommendations." },
      { key: "overseas", href: "/hs/overseas", title: "Overseas HS lookup", description: "Check destination HS codes and destination tariff data." },
      { key: "cargo", href: "/cargo", title: "Cargo status lookup", description: "Cargo progress lookup and status notification" },
      { key: "duty", href: "/duty-estimator", title: "Estimated tax calculation", description: "Preliminary estimate from goods amount, exchange rate, tariff, and internal tax inputs" }
    ]
  },
  "zh-CN": {
    title: "开始查询",
    description: "请选择查询类型。",
    entries: [
      { key: "direct", href: "/hs/direct", title: "HS编码/品名查询", description: "直接查询HS编码，或通过品名获取AI辅助推荐。" },
      { key: "overseas", href: "/hs/overseas", title: "海外HS编码查询", description: "查询目的国HS编码和目的国税率资料。" },
      { key: "cargo", href: "/cargo", title: "货物状态查询", description: "查询货物进度并设置状态通知" },
      { key: "duty", href: "/duty-estimator", title: "预计纳税额计算", description: "基于货物价格、汇率、关税率和内税输入进行初步计算" }
    ]
  }
} satisfies Record<AppLocale, EntryDictionary>;

export function getEntryDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
