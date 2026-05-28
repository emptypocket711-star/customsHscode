import { defaultLocale, type AppLocale } from "./locales";

export type TradeNewsDictionary = {
  categories: Record<"auxiliary" | "customs" | "global" | "government" | "industry" | "market", {
    description: string;
    label: string;
  }>;
  card: {
    allCountries: string;
    collected: string;
    empty: string;
    itemsSuffix: string;
    openOriginal: string;
    pending: string;
    source: string;
    sourceMethod: string;
    sourceTypes: Record<"future" | "official-page" | "openapi" | "paid-api" | "rss", string>;
    wtoSummary: string;
    fallbackSummary: string;
  };
  hero: {
    countryFilter: string;
    eyebrow: string;
    lead: string;
    title: string;
  };
  page: {
    description: string;
    title: string;
  };
};

const dictionaries = {
  "ko-KR": {
    categories: {
      auxiliary: { label: "보조 뉴스", description: "뉴스 검색 API 등 보조 검색 소스" },
      customs: { label: "관세/통관", description: "관세청 보도자료와 통관·원산지·품목분류 관련 소식" },
      global: { label: "국제통상", description: "WTO 등 국제기구의 무역 규범·분쟁·통상 뉴스" },
      government: { label: "정부 정책", description: "정부 보도자료 중 무역 실무자가 확인할 만한 발표" },
      industry: { label: "산업/통상 정책", description: "산업통상부 보도자료와 통상·FTA·공급망 정책" },
      market: { label: "해외시장/통상", description: "KOTRA 해외시장뉴스, 통상·규제, 공급망 동향" }
    },
    card: {
      allCountries: "모든 국가",
      collected: "수집",
      empty: "선택한 국가와 연결된 글이 없습니다.",
      fallbackSummary: "해당 출처에서 수집한 무역 관련 소식입니다. 제목과 출처를 기준으로 먼저 검토한 뒤 원문에서 세부 내용을 확인해 주세요.",
      itemsSuffix: "건",
      openOriginal: "원문 열기",
      pending: "대기",
      source: "출처",
      sourceMethod: "수집 방식",
      sourceTypes: {
        future: "연동 예정",
        "official-page": "공식 페이지",
        openapi: "공공데이터 API",
        "paid-api": "유료 API",
        rss: "RSS"
      },
      wtoSummary: "WTO에서 발표한 국제통상 관련 소식입니다. 통상 규범, 협정, 분쟁, 회원국 조치와 관련된 내용일 수 있어 원문 확인이 필요합니다."
    },
    hero: {
      countryFilter: "국가 필터",
      eyebrow: "무역 뉴스",
      lead: "국가를 선택하면 해당 국가명이 포함된 KOTRA·정부·국제통상 글만 모아 보여줍니다. 원문을 열기 전 제목과 짧은 요약을 먼저 확인할 수 있습니다.",
      title: "국가별 주요 무역 이슈를 카드로 확인합니다."
    },
    page: {
      description: "관세, 통관, 통상, 공급망, 국제통상 뉴스를 공식 출처 중심으로 모아봅니다.",
      title: "무역 뉴스"
    }
  },
  "en-US": {
    categories: {
      auxiliary: { label: "Auxiliary news", description: "Supplementary search sources such as news-search APIs" },
      customs: { label: "Customs / clearance", description: "Customs authority releases and classification, origin, and clearance-related news" },
      global: { label: "Global trade", description: "Trade rules, disputes, and international trade news from WTO and other organizations" },
      government: { label: "Government policy", description: "Government releases worth checking for trade operations" },
      industry: { label: "Industry / trade policy", description: "Industry ministry releases, FTA, supply-chain, and trade-policy updates" },
      market: { label: "Overseas market / trade", description: "KOTRA market news, regulatory updates, and supply-chain trends" }
    },
    card: {
      allCountries: "All countries",
      collected: "Collected",
      empty: "No articles are linked to the selected country.",
      fallbackSummary: "This trade-related item was collected from the listed source. Review the title and source first, then open the original for details.",
      itemsSuffix: "items",
      openOriginal: "Open original",
      pending: "Pending",
      source: "Source",
      sourceMethod: "Collection method",
      sourceTypes: {
        future: "Planned",
        "official-page": "Official page",
        openapi: "Public data API",
        "paid-api": "Paid API",
        rss: "RSS"
      },
      wtoSummary: "This is an international trade item published by WTO. It may involve trade rules, agreements, disputes, or member measures; review the original source for details."
    },
    hero: {
      countryFilter: "Country filter",
      eyebrow: "Trade news",
      lead: "Select a country to focus KOTRA, government, and international trade articles that mention it. Review the title and short summary before opening the original.",
      title: "Review key trade issues by country in card format."
    },
    page: {
      description: "Collect customs, clearance, trade, supply-chain, and international trade news from official sources.",
      title: "Trade News"
    }
  },
  "zh-CN": {
    categories: {
      auxiliary: { label: "辅助新闻", description: "新闻搜索API等辅助检索来源" },
      customs: { label: "海关/通关", description: "海关公告及通关、原产地、品目归类相关消息" },
      global: { label: "国际通商", description: "WTO等国际组织的贸易规则、争端和通商新闻" },
      government: { label: "政府政策", description: "贸易实务人员可关注的政府发布内容" },
      industry: { label: "产业/通商政策", description: "产业通商部门公告、FTA、供应链及通商政策" },
      market: { label: "海外市场/通商", description: "KOTRA海外市场新闻、通商监管和供应链趋势" }
    },
    card: {
      allCountries: "所有国家",
      collected: "已收集",
      empty: "没有与所选国家相关的文章。",
      fallbackSummary: "这是从该来源收集的贸易相关消息。请先查看标题和来源，再打开原文确认详细内容。",
      itemsSuffix: "条",
      openOriginal: "打开原文",
      pending: "待处理",
      source: "来源",
      sourceMethod: "收集方式",
      sourceTypes: {
        future: "计划联动",
        "official-page": "官方页面",
        openapi: "公共数据API",
        "paid-api": "付费API",
        rss: "RSS"
      },
      wtoSummary: "这是WTO发布的国际通商相关消息，可能涉及贸易规则、协定、争端或成员措施，需打开原文确认详细内容。"
    },
    hero: {
      countryFilter: "国家筛选",
      eyebrow: "贸易新闻",
      lead: "选择国家后，将汇集包含该国家名称的KOTRA、政府和国际通商文章。打开原文前可先查看标题和简短摘要。",
      title: "以卡片形式查看各国主要贸易议题。"
    },
    page: {
      description: "以官方来源为中心汇集海关、通关、通商、供应链和国际通商新闻。",
      title: "贸易新闻"
    }
  }
} satisfies Record<AppLocale, TradeNewsDictionary>;

export function getTradeNewsDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
