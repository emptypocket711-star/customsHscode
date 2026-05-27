export type TradeNewsCategory = "customs" | "market" | "government" | "industry" | "global" | "auxiliary";

export type TradeNewsItem = {
  id: string;
  category: TradeNewsCategory;
  source: string;
  sourceType: "rss" | "official-page" | "openapi" | "api-required" | "paid-api";
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
  reliability: "매우 높음" | "높음" | "보조용";
  status: "live" | "planned";
};

export type TradeNewsSource = {
  category: TradeNewsCategory;
  name: string;
  description: string;
  url: string;
  reliability: TradeNewsItem["reliability"];
  status: "live" | "planned";
  note: string;
};

const sourceHeaders = {
  "user-agent": "Mozilla/5.0 (compatible; HSFinder/1.0; +https://hsfinder.co.kr)"
};

const sourceTimeoutMs = 7000;

export const tradeNewsCategories: Array<{ key: TradeNewsCategory; label: string; description: string }> = [
  { key: "customs", label: "관세/통관", description: "관세청 보도자료와 통관·원산지·품목분류 관련 소식" },
  { key: "market", label: "해외시장/통상", description: "KOTRA 해외시장뉴스, 통상·규제, 공급망 동향" },
  { key: "government", label: "정부 정책", description: "대한민국 정책브리핑 보도자료 중 무역 실무자가 볼 만한 정부 발표" },
  { key: "industry", label: "산업/통상 정책", description: "산업통상부 보도자료와 통상·FTA·공급망 정책" },
  { key: "global", label: "국제통상", description: "WTO 등 국제기구의 무역 규범·분쟁·통상 뉴스" },
  { key: "auxiliary", label: "보조 뉴스", description: "네이버 뉴스 검색, Reuters/NewsAPI 등 보조 검색 소스" }
];

export const tradeNewsSources: TradeNewsSource[] = [
  {
    category: "customs",
    name: "관세청 RSS",
    description: "보도자료 RSS",
    url: "http://www.customs.go.kr/kcs/selectBoardRss.do?mi=2891&bbsId=1362",
    reliability: "매우 높음",
    status: "live",
    note: "공식 RSS를 직접 수집합니다."
  },
  {
    category: "market",
    name: "KOTRA 해외시장뉴스",
    description: "단신속보뉴스 API / 해외시장뉴스",
    url: "https://apis.data.go.kr/B410001/kotra_overseasMarketNews/ovseaMrktNews/ovseaMrktNews",
    reliability: "매우 높음",
    status: "live",
    note: "공공데이터포털 OpenAPI 키가 설정되면 자동 수집합니다."
  },
  {
    category: "market",
    name: "KOTRA 미국 글로벌 이슈 모니터링",
    description: "미국 글로벌 이슈 모니터링 API",
    url: "https://apis.data.go.kr/B410001/usaGlobalIssueMonitoring/getUsaGlobalIssueMonitoring",
    reliability: "매우 높음",
    status: "live",
    note: "미국 통상·정책 이슈를 KOTRA API로 수집합니다."
  },
  {
    category: "market",
    name: "KOTRA 무역사기사례",
    description: "무역사기사례 정보조회 API",
    url: "https://apis.data.go.kr/B410001/cmmrcFraudCase/cmmrcFraudCase",
    reliability: "매우 높음",
    status: "live",
    note: "국가, 게시일, 제목, 사례 본문을 KOTRA API로 수집합니다."
  },
  {
    category: "government",
    name: "대한민국 정책브리핑 RSS",
    description: "보도자료 RSS",
    url: "https://www.korea.kr/rss/pressrelease.xml",
    reliability: "높음",
    status: "live",
    note: "정부 보도자료 RSS에서 무역 관련 키워드 중심으로 분류합니다."
  },
  {
    category: "industry",
    name: "산업통상부 보도자료",
    description: "보도·참고자료 목록",
    url: "https://www.motir.go.kr/kor/article/ATCL3f49a5a8c?pageIndex=1",
    reliability: "높음",
    status: "live",
    note: "공식 보도자료 목록을 수집합니다."
  },
  {
    category: "global",
    name: "WTO RSS",
    description: "WTO latest news RSS",
    url: "http://www.wto.org/library/rss/latest_news_e.xml",
    reliability: "매우 높음",
    status: "live",
    note: "WTO 공식 RSS를 수집합니다."
  },
  {
    category: "auxiliary",
    name: "네이버 뉴스 검색 API",
    description: "국내 뉴스 검색 메타데이터",
    url: "https://developers.naver.com/docs/serviceapi/search/news/news.md",
    reliability: "보조용",
    status: "planned",
    note: "검색 보조용입니다. 원문 신뢰도는 매체별로 별도 판단해야 합니다."
  },
  {
    category: "auxiliary",
    name: "Reuters API / NewsAPI",
    description: "글로벌 뉴스 API",
    url: "https://newsapi.org/",
    reliability: "보조용",
    status: "planned",
    note: "유료 또는 별도 API 약관 확인 후 연결합니다."
  }
];

function stripCdata(value: string) {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function decodeXml(value: string) {
  return stripCdata(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength = 220) {
  const clean = stripHtml(value);
  return clean.length > maxLength ? `${clean.slice(0, maxLength).trim()}...` : clean;
}

function envValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return "";
}

function extractTag(source: string, tagName: string) {
  const match = source.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function parseRssItems(xml: string, options: {
  category: TradeNewsCategory;
  source: string;
  reliability: TradeNewsItem["reliability"];
  limit?: number;
}) {
  const itemBlocks = Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)).map((match) => match[1]);

  return itemBlocks.slice(0, options.limit ?? 12).map((block, index): TradeNewsItem => {
    const title = extractTag(block, "title");
    const url = extractTag(block, "link");
    const description = extractTag(block, "description");
    const publishedAt = extractTag(block, "pubDate") || null;

    return {
      id: `${options.source}-${index}-${url || title}`,
      category: options.category,
      source: options.source,
      sourceType: "rss",
      title,
      summary: truncate(description || title),
      url,
      publishedAt,
      reliability: options.reliability,
      status: "live"
    };
  }).filter((item) => item.title && item.url);
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), sourceTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: sourceHeaders,
      next: { revalidate: 1800 },
      signal: controller.signal
    });

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url: string) {
  const text = await fetchText(url);
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isTradeRelated(item: TradeNewsItem) {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  return [
    "관세", "통관", "수입", "수출", "무역", "통상", "fta", "wto", "원산지", "품목분류",
    "공급망", "물류", "해외", "수입선", "수출입", "trade", "tariff", "customs", "origin"
  ].some((keyword) => text.includes(keyword.toLowerCase()));
}

async function loadCustomsNews() {
  const xml = await fetchText("http://www.customs.go.kr/kcs/selectBoardRss.do?mi=2891&bbsId=1362");
  if (!xml) return [];
  return parseRssItems(xml, { category: "customs", source: "관세청", reliability: "매우 높음", limit: 12 });
}

function collectArrayValues(value: unknown): unknown[][] {
  if (Array.isArray(value)) return [value];
  if (!value || typeof value !== "object") return [];

  return Object.values(value).flatMap((entry) => collectArrayValues(entry));
}

function firstString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
}

function normalizeJsonRows(payload: unknown) {
  return collectArrayValues(payload)
    .sort((a, b) => b.length - a.length)[0]
    ?.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
    ?? [];
}

function buildPublicDataApiUrl(baseUrl: string, serviceKey: string, params: Record<string, string>) {
  const url = new URL(baseUrl);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", params.pageNo ?? "1");
  url.searchParams.set("numOfRows", params.numOfRows ?? "10");
  url.searchParams.set("resultType", "json");
  url.searchParams.set("_type", "json");
  Object.entries(params).forEach(([key, value]) => {
    if (!["pageNo", "numOfRows"].includes(key)) url.searchParams.set(key, value);
  });

  return url.toString();
}

function kotraServiceKey() {
  return envValue(
    "KOTRA_OPENAPI_SERVICE_KEY",
    "KOTRA_OVERSEAS_MARKET_NEWS_SERVICE_KEY",
    "KOTRA_USA_GLOBAL_ISSUE_SERVICE_KEY",
    "KOTRA_TRADE_FRAUD_CASE_SERVICE_KEY"
  );
}

function kotraApiItem(row: Record<string, unknown>, options: {
  category: TradeNewsCategory;
  source: string;
  fallbackUrl: string;
}): TradeNewsItem | null {
  const title = firstString(row, [
    "newsTitl", "newsTitle", "title", "titl", "newsSj", "sj", "cntntSj", "bbsSj", "subject"
  ]);
  if (!title) return null;

  const body = firstString(row, [
    "newsBdt", "bdtCntnt", "newsBody", "newsCn", "newsCnHtml", "content", "contents", "cntnt", "cn", "body", "summary"
  ]);
  const country = firstString(row, ["natn", "cntntNatnNm", "natnNm", "countryNm", "nationNm", "country", "cntyNm"]);
  const office = firstString(row, ["newsWrterNm", "ovseaBizplcNm", "tradeOffice", "officeNm", "wrtOfficeNm", "kotraNewsWrt", "writer", "author"]);
  const industry = firstString(row, ["industClNm", "industryNm", "industry", "indstCl", "goodsCl"]);
  const publishedAt = firstString(row, [
    "othbcDt", "newsWrtDt", "newsDt", "pstgDtm", "regDt", "registDt", "createdAt", "date", "wrtDt"
  ]) || null;
  const url = firstString(row, ["kotraNewsUrl", "newsUrl", "url", "link", "fileDownLink", "atchFileUrl"]) || options.fallbackUrl;
  const meta = [country, office, industry].filter(Boolean).join(" / ");

  const item: TradeNewsItem = {
    id: `${options.source}-${title}-${publishedAt ?? ""}`,
    category: options.category,
    source: options.source,
    sourceType: "openapi",
    title: decodeXml(stripHtml(title)),
    summary: truncate([meta, body].filter(Boolean).join(" - ") || title),
    url,
    publishedAt,
    reliability: "매우 높음",
    status: "live"
  };

  return item;
}

async function loadKotraOverseasMarketNews() {
  const serviceKey = kotraServiceKey();
  if (!serviceKey) return [];

  const endpoint = envValue(
    "KOTRA_OVERSEAS_MARKET_NEWS_URL",
    "KOTRA_OVERSEAS_MARKET_NEWS_ENDPOINT"
  ) || "https://apis.data.go.kr/B410001/kotra_overseasMarketNews/ovseaMrktNews/ovseaMrktNews";
  const payload = await fetchJson(buildPublicDataApiUrl(endpoint, serviceKey, { pageNo: "1", numOfRows: "12", search8: "Y" }));
  if (!payload) return [];

  return normalizeJsonRows(payload)
    .map((row) => kotraApiItem(row, {
      category: "market",
      source: "KOTRA 해외시장뉴스",
      fallbackUrl: "https://dream.kotra.or.kr/kotranews/cms/com/index.do?MENU_ID=70"
    }))
    .filter((item): item is TradeNewsItem => Boolean(item))
    .slice(0, 12);
}

async function loadKotraTradeFraudCases() {
  const serviceKey = kotraServiceKey();
  if (!serviceKey) return [];

  const endpoint = envValue(
    "KOTRA_TRADE_FRAUD_CASE_URL",
    "KOTRA_TRADE_FRAUD_CASE_ENDPOINT"
  ) || "https://apis.data.go.kr/B410001/cmmrcFraudCase/cmmrcFraudCase";
  const payload = await fetchJson(buildPublicDataApiUrl(endpoint, serviceKey, { pageNo: "1", numOfRows: "8" }));
  if (!payload) return [];

  return normalizeJsonRows(payload)
    .map((row) => kotraApiItem(row, {
      category: "market",
      source: "KOTRA 무역사기사례",
      fallbackUrl: "https://dream.kotra.or.kr/kotranews/cms/com/index.do?MENU_ID=70"
    }))
    .filter((item): item is TradeNewsItem => Boolean(item))
    .slice(0, 8);
}

async function loadKotraUsaGlobalIssueNews() {
  const serviceKey = kotraServiceKey();
  if (!serviceKey) return [];

  const endpoint = envValue(
    "KOTRA_USA_GLOBAL_ISSUE_URL",
    "KOTRA_USA_GLOBAL_ISSUE_ENDPOINT"
  ) || "https://apis.data.go.kr/B410001/usaGlobalIssueMonitoring/getUsaGlobalIssueMonitoring";
  const payload = await fetchJson(buildPublicDataApiUrl(endpoint, serviceKey, { pageNo: "1", numOfRows: "10" }));
  if (!payload) return [];

  return normalizeJsonRows(payload)
    .map((row) => kotraApiItem(row, {
      category: "market",
      source: "KOTRA 미국 글로벌 이슈",
      fallbackUrl: "https://dream.kotra.or.kr/kotranews/cms/com/index.do?MENU_ID=1580"
    }))
    .filter((item): item is TradeNewsItem => Boolean(item))
    .slice(0, 10);
}

async function loadPolicyBriefingNews() {
  const xml = await fetchText("https://www.korea.kr/rss/pressrelease.xml");
  if (!xml) return [];
  return parseRssItems(xml, { category: "government", source: "대한민국 정책브리핑", reliability: "높음", limit: 20 })
    .filter(isTradeRelated)
    .slice(0, 10);
}

function parseMotirRows(html: string) {
  const rows = Array.from(html.matchAll(/<tr>\s*<td>[\s\S]*?<\/tr>/gi)).map((match) => match[0]);

  return rows.map((row, index): TradeNewsItem | null => {
    const id = row.match(/article\.view\('([^']+)'\)/)?.[1];
    const title = row.match(/<a href="javascript:article\.view\('[^']+'\);"[^>]*>\s*<i>([\s\S]*?)<\/i>/i)?.[1];
    const department = row.match(/<\/div>\s*<\/td>\s*<td><i>([\s\S]*?)<\/i><\/td>/i)?.[1];
    const date = row.match(/<td>(\d{4}-\d{2}-\d{2})<\/td>/)?.[1] ?? null;
    if (!id || !title) return null;

    const cleanTitle = decodeXml(stripHtml(title));
    return {
      id: `motir-${id}-${index}`,
      category: "industry",
      source: "산업통상부",
      sourceType: "official-page",
      title: cleanTitle,
      summary: department ? `담당부서: ${decodeXml(stripHtml(department))}` : "산업통상부 보도·참고자료입니다.",
      url: `https://www.motir.go.kr/kor/article/ATCL3f49a5a8c/${id}/view`,
      publishedAt: date,
      reliability: "높음",
      status: "live"
    };
  }).filter((item): item is TradeNewsItem => Boolean(item));
}

async function loadMotirNews() {
  const html = await fetchText("https://www.motir.go.kr/kor/article/ATCL3f49a5a8c?pageIndex=1");
  if (!html) return [];
  return parseMotirRows(html).filter(isTradeRelated).slice(0, 12);
}

async function loadWtoNews() {
  const xml = await fetchText("http://www.wto.org/library/rss/latest_news_e.xml");
  if (!xml) return [];
  return parseRssItems(xml, { category: "global", source: "WTO", reliability: "매우 높음", limit: 12 });
}

function plannedItem(source: TradeNewsSource): TradeNewsItem {
  return {
    id: `planned-${source.name}`,
    category: source.category,
    source: source.name,
    sourceType: source.status === "planned" ? "api-required" : "official-page",
    title: `${source.name} 연동 준비 중`,
    summary: source.note,
    url: source.url,
    publishedAt: null,
    reliability: source.reliability,
    status: "planned"
  };
}

export async function loadTradeNewsItems() {
  const [customs, kotraMarket, kotraUsaIssues, kotraFraudCases, policy, motir, wto] = await Promise.all([
    loadCustomsNews(),
    loadKotraOverseasMarketNews(),
    loadKotraUsaGlobalIssueNews(),
    loadKotraTradeFraudCases(),
    loadPolicyBriefingNews(),
    loadMotirNews(),
    loadWtoNews()
  ]);

  const planned = tradeNewsSources.filter((source) => source.status === "planned").map(plannedItem);
  const items = [...customs, ...kotraMarket, ...kotraUsaIssues, ...kotraFraudCases, ...policy, ...motir, ...wto, ...planned];

  return items.sort((a, b) => {
    if (a.status !== b.status) return a.status === "live" ? -1 : 1;
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });
}
