import { defaultLocale, type AppLocale } from "./locales";

export type EntryDictionary = {
  description: string;
  entries: Array<{
    description: string;
    href: string;
    key: "direct" | "export" | "cargo" | "duty";
    title: string;
  }>;
  title: string;
};

const dictionaries = {
  "ko-KR": {
    title: "조회 시작",
    description: "조회 유형을 선택하세요.",
    entries: [
      { key: "direct", href: "/hs/direct", title: "통합 조회", description: "HS CODE 또는 품명으로 품목번호, 관세율, 수입요건" },
      { key: "export", href: "/diagnosis/export", title: "수출·상대국 세율", description: "목적국 관세율, FTA C/O, 수출요건" },
      { key: "cargo", href: "/cargo", title: "적하목록 조회", description: "화물 진행 상태 조회와 상태 도달 알림" },
      { key: "duty", href: "/duty-estimator", title: "예상 납세액 산출", description: "물품가격, 환율, 관세율, 내국세 기준 예비 산출" }
    ]
  },
  "en-US": {
    title: "Start Lookup",
    description: "Choose a lookup workflow.",
    entries: [
      { key: "direct", href: "/hs/direct", title: "Integrated lookup", description: "HS code or product-name based item, tariff, and requirement lookup" },
      { key: "export", href: "/diagnosis/export", title: "Export and destination tariffs", description: "Destination tariff, FTA C/O, and export requirement screening" },
      { key: "cargo", href: "/cargo", title: "Cargo status lookup", description: "Cargo progress lookup and status notification" },
      { key: "duty", href: "/duty-estimator", title: "Estimated tax calculation", description: "Preliminary estimate from goods amount, exchange rate, tariff, and internal tax inputs" }
    ]
  },
  "zh-CN": {
    title: "开始查询",
    description: "请选择查询类型。",
    entries: [
      { key: "direct", href: "/hs/direct", title: "综合查询", description: "通过HS编码或品名查询品目、税率和进口要求" },
      { key: "export", href: "/diagnosis/export", title: "出口及目的国税率", description: "目的国关税、FTA C/O和出口要求初步筛查" },
      { key: "cargo", href: "/cargo", title: "货物状态查询", description: "查询货物进度并设置状态通知" },
      { key: "duty", href: "/duty-estimator", title: "预计纳税额计算", description: "基于货物价格、汇率、关税率和内税输入进行初步计算" }
    ]
  }
} satisfies Record<AppLocale, EntryDictionary>;

export function getEntryDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
