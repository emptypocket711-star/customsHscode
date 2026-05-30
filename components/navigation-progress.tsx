"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { normalizeLocale, type AppLocale } from "@/lib/i18n";

type ProgressDictionary = {
  actionFallback: string;
  cargoDestinationInput: string;
  cargoDestinationInputWithQuery: (query: string) => string;
  customsData: string;
  detailFallback: string;
  documentExtract: string;
  fileValidate: string;
  hsFormat: string;
  hsFormatWithQuery: (query: string) => string;
  hsHierarchy: string;
  inputCheck: string;
  linkDetailData: string;
  linkFallbackData: string;
  linkLookupStart: (label: string) => string;
  linkRequestStart: (label: string) => string;
  modelCode: string;
  originReview: string;
  overseasHsMap: string;
  productAi: string;
  productCandidates: string;
  productInput: string;
  productInputWithQuery: (query: string) => string;
  productNormalize: string;
  resultStage: string;
  resultSummary: string;
  saveChanges: string;
  saveRequest: (label: string) => string;
  slowMessage: string;
  stillWorking: string;
  tariffSequence: string;
  validatePermission: string;
  working: (label: string) => string;
};

const progressDictionaries = {
  "ko-KR": {
    actionFallback: "처리",
    cargoDestinationInput: "수출 목적국 조회 입력값을 확인하고 있습니다",
    cargoDestinationInputWithQuery: (query: string) => `수출 목적국 조회 입력값 확인: ${query}`,
    customsData: "목적국 관세율, 내국세, 수입요건을 함께 구성하고 있습니다",
    detailFallback: "상세조회",
    documentExtract: "문서 추출 결과와 보완 질문을 정리하고 있습니다",
    fileValidate: "파일과 입력값을 검증하고 있습니다",
    hsFormat: "HS CODE 형식을 확인하고 있습니다",
    hsFormatWithQuery: (query: string) => `HS CODE 형식 확인: ${query}`,
    hsHierarchy: "상위 류·호·소호와 하위 품목을 조회하고 있습니다",
    inputCheck: "입력값을 확인하고 있습니다",
    linkDetailData: "선택한 코드와 품명 기준으로 상세 데이터를 조회하고 있습니다",
    linkFallbackData: "선택한 화면의 데이터를 불러오고 있습니다",
    linkLookupStart: (label: string) => `${label} 조회를 준비하고 있습니다`,
    linkRequestStart: (label: string) => `${label} 요청을 준비하고 있습니다`,
    modelCode: "제품코드·모델명 단서를 해석하고 있습니다",
    originReview: "원산지와 직접운송 검토 항목을 정리하고 있습니다",
    overseasHsMap: "한국 HSK와 목적국 HS 연결 후보를 조회하고 있습니다",
    productAi: "AI가 제품 성격과 후보 HS4·HS6를 도출하고 있습니다",
    productCandidates: "후보별 관세율, 내국세, 수입요건을 함께 불러오고 있습니다",
    productInput: "품명 입력값을 확인하고 있습니다",
    productInputWithQuery: (query: string) => `품명 입력값 확인: ${query}`,
    productNormalize: "오타와 동의어를 정규화하고 있습니다",
    resultStage: "검색 결과 화면을 생성하고 있습니다",
    resultSummary: "조회 결과를 정리하고 있습니다",
    saveChanges: "변경 사항을 저장하고 있습니다",
    saveRequest: (label: string) => `${label} 요청을 처리하고 있습니다`,
    slowMessage: "검색 결과 화면 생성이 지연되고 있습니다. 완료될 때까지 기다려 주세요",
    stillWorking: "검색 결과 화면을 계속 생성하고 있습니다. 네트워크 상태를 확인하고 있습니다",
    tariffSequence: "관세율과 세율 적용 순서를 계산하고 있습니다",
    validatePermission: "권한과 입력값을 확인하고 있습니다",
    working: (label: string) => `${label} 중입니다`
  },
  "en-US": {
    actionFallback: "Process",
    cargoDestinationInput: "Checking destination lookup input",
    cargoDestinationInputWithQuery: (query: string) => `Checking destination lookup input: ${query}`,
    customsData: "Preparing destination tariff, tax, and requirement data",
    detailFallback: "Details",
    documentExtract: "Organizing extracted document data and follow-up questions",
    fileValidate: "Validating files and input values",
    hsFormat: "Checking the HS code format",
    hsFormatWithQuery: (query: string) => `Checking HS code format: ${query}`,
    hsHierarchy: "Loading chapter, heading, subheading, and lower-level items",
    inputCheck: "Checking input values",
    linkDetailData: "Loading detail data for the selected code and product name",
    linkFallbackData: "Loading the selected workspace",
    linkLookupStart: (label: string) => `Preparing ${label} lookup`,
    linkRequestStart: (label: string) => `Preparing ${label}`,
    modelCode: "Interpreting product-code and model-name clues",
    originReview: "Organizing origin and direct-transport review points",
    overseasHsMap: "Loading Korean HSK and destination HS mapping candidates",
    productAi: "AI is deriving product characteristics and HS4/HS6 candidates",
    productCandidates: "Loading tariff, tax, and requirement data for each candidate",
    productInput: "Checking product-name input",
    productInputWithQuery: (query: string) => `Checking product-name input: ${query}`,
    productNormalize: "Normalizing possible typos and synonyms",
    resultStage: "Preparing the result screen",
    resultSummary: "Organizing lookup results",
    saveChanges: "Saving changes",
    saveRequest: (label: string) => `Processing ${label}`,
    slowMessage: "The result screen is taking longer than usual. Please wait until it finishes.",
    stillWorking: "The result screen is still being prepared. Checking network status.",
    tariffSequence: "Calculating tariff rate order and display sequence",
    validatePermission: "Checking permissions and input values",
    working: (label: string) => `${label} in progress`
  },
  "zh-CN": {
    actionFallback: "处理",
    cargoDestinationInput: "正在确认目的国查询输入值",
    cargoDestinationInputWithQuery: (query: string) => `正在确认目的国查询输入值：${query}`,
    customsData: "正在整理目的国关税、内税和进口要求数据",
    detailFallback: "详细查询",
    documentExtract: "正在整理单证抽取结果和补充问题",
    fileValidate: "正在验证文件和输入值",
    hsFormat: "正在确认HS编码格式",
    hsFormatWithQuery: (query: string) => `正在确认HS编码格式：${query}`,
    hsHierarchy: "正在加载章、目、子目和下级项目",
    inputCheck: "正在确认输入值",
    linkDetailData: "正在按所选编码和品名加载详细数据",
    linkFallbackData: "正在加载所选页面数据",
    linkLookupStart: (label: string) => `正在准备${label}查询`,
    linkRequestStart: (label: string) => `正在准备${label}`,
    modelCode: "正在解析产品代码和型号线索",
    originReview: "正在整理原产地和直接运输确认项目",
    overseasHsMap: "正在查询韩国HSK与目的国HS编码的连接候选项",
    productAi: "AI正在判断产品属性并生成HS4/HS6候选项",
    productCandidates: "正在加载各候选项的关税、内税和要求数据",
    productInput: "正在确认品名输入值",
    productInputWithQuery: (query: string) => `正在确认品名输入值：${query}`,
    productNormalize: "正在规范可能的错字和同义词",
    resultStage: "正在生成结果页面",
    resultSummary: "正在整理查询结果",
    saveChanges: "正在保存变更",
    saveRequest: (label: string) => `正在处理${label}`,
    slowMessage: "结果页面生成时间较长。请等待完成。",
    stillWorking: "结果页面仍在生成中。正在确认网络状态。",
    tariffSequence: "正在计算关税税率顺序和显示顺序",
    validatePermission: "正在确认权限和输入值",
    working: (label: string) => `${label}处理中`
  }
} satisfies Record<AppLocale, ProgressDictionary>;

function currentProgressDictionary() {
  if (typeof document === "undefined") return progressDictionaries["ko-KR"];
  return progressDictionaries[normalizeLocale(document.documentElement.lang)];
}

function submitterLabel(submitter: HTMLElement | null, dictionary: ProgressDictionary) {
  const label = submitter?.textContent?.replace(/\s+/g, " ").trim();
  return label && label.length <= 24 ? label : dictionary.actionFallback;
}

function withResultStage(stages: string[], dictionary: ProgressDictionary) {
  return [...stages, dictionary.resultStage];
}

function progressStages(form: HTMLFormElement, label: string, dictionary: ProgressDictionary) {
  const action = form.getAttribute("action") ?? "";
  const query = form.querySelector<HTMLInputElement>("[name='query']")?.value?.trim();
  const direction = form.querySelector<HTMLSelectElement | HTMLInputElement>("[name='direction']")?.value;
  const destinationCountry = form.querySelector<HTMLSelectElement | HTMLInputElement>("[name='destinationCountry']")?.value;
  const normalizedQuery = query?.replace(/[^0-9]/g, "") ?? "";
  const isHsCodeQuery = Boolean(query && /^[0-9.\-\s]+$/.test(query) && normalizedQuery.length >= 2);
  const hasModelLikeToken = Boolean(query && /\b(?=[a-z0-9-]{4,}\b)(?=[a-z0-9-]*[a-z])(?=[a-z0-9-]*[0-9])[a-z0-9-]+\b/i.test(query));
  const isDestinationExport = direction === "export" && Boolean(destinationCountry && destinationCountry !== "ALL");

  if (action.includes("/hs/direct") || query) {
    if (isDestinationExport) {
      return withResultStage([
        query ? dictionary.cargoDestinationInputWithQuery(query) : dictionary.cargoDestinationInput,
        dictionary.overseasHsMap,
        dictionary.customsData,
        dictionary.originReview
      ], dictionary);
    }

    if (isHsCodeQuery) {
      return withResultStage([
        query ? dictionary.hsFormatWithQuery(query) : dictionary.hsFormat,
        dictionary.hsHierarchy,
        dictionary.tariffSequence,
        dictionary.productCandidates
      ], dictionary);
    }

    return withResultStage([
      query ? dictionary.productInputWithQuery(query) : dictionary.productInput,
      hasModelLikeToken ? dictionary.modelCode : dictionary.productNormalize,
      dictionary.productAi,
      dictionary.overseasHsMap,
      dictionary.productCandidates
    ], dictionary);
  }

  if (/업로드|추출/.test(label)) {
    return withResultStage([
      dictionary.linkRequestStart(label),
      dictionary.fileValidate,
      dictionary.documentExtract
    ], dictionary);
  }

  if (/저장|승인|요청/.test(label)) {
    return withResultStage([
      dictionary.saveRequest(label),
      dictionary.validatePermission,
      dictionary.saveChanges
    ], dictionary);
  }

  return withResultStage([dictionary.working(label), dictionary.inputCheck, dictionary.resultSummary], dictionary);
}

function linkProgressStages(label: string, dictionary: ProgressDictionary) {
  if (/HS|상세|후보|검색|조회|CODE|코드/i.test(label)) {
    return [
      dictionary.linkLookupStart(label),
      dictionary.linkDetailData,
      dictionary.productCandidates,
      dictionary.resultStage
    ];
  }

  return [
    dictionary.linkRequestStart(label),
    dictionary.linkFallbackData,
    dictionary.resultStage
  ];
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("조회 중입니다");
  const [stages, setStages] = useState(["조회 중입니다"]);
  const [stageIndex, setStageIndex] = useState(0);
  const stageIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forceStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actionSettleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeObserverRef = useRef<MutationObserver | null>(null);
  const previousLocationRef = useRef(`${pathname}?${searchParams.toString()}`);

  useEffect(() => {
    function clearTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (forceStopTimerRef.current) {
        clearTimeout(forceStopTimerRef.current);
        forceStopTimerRef.current = null;
      }
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
        stageTimerRef.current = null;
      }
      if (actionSettleTimerRef.current) {
        clearInterval(actionSettleTimerRef.current);
        actionSettleTimerRef.current = null;
      }
      if (completeObserverRef.current) {
        completeObserverRef.current.disconnect();
        completeObserverRef.current = null;
      }
    }

    function stopProgress() {
      clearTimer();
      setActive(false);
    }

    function watchProgressCompleteMarker() {
      if (document.querySelector("[data-progress-complete='true']")) {
        stopProgress();
        return;
      }

      completeObserverRef.current = new MutationObserver(() => {
        if (document.querySelector("[data-progress-complete='true']")) {
          stopProgress();
        }
      });
      completeObserverRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-progress-complete"]
      });
    }

    function handleSubmit(event: SubmitEvent) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;

      const dictionary = currentProgressDictionary();
      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
      const label = submitterLabel(submitter, dictionary);
      const loweredLabel = label.toLowerCase();
      const action = form.getAttribute("action") ?? "";
      const isLookupLike =
        action.includes("/hs/") ||
        /조회|검색|자동조회|추출|업로드|저장|승인|요청|查询|搜索|保存|上传|提取/.test(label) ||
        loweredLabel.includes("search") ||
        loweredLabel.includes("save") ||
        loweredLabel.includes("upload");

      if (!isLookupLike) return;

      clearTimer();
      const nextStages = progressStages(form, label, dictionary);
      stageIndexRef.current = 0;
      setStageIndex(0);
      setStages(nextStages);
      setMessage(nextStages[0] ?? dictionary.working(label));
      setActive(true);
      watchProgressCompleteMarker();
      stageTimerRef.current = setInterval(() => {
        stageIndexRef.current =
          stageIndexRef.current < nextStages.length - 1 ? stageIndexRef.current + 1 : nextStages.length - 1;
        setStageIndex(stageIndexRef.current);
        setMessage(nextStages[stageIndexRef.current] ?? dictionary.working(label));
      }, 1800);
      slowTimerRef.current = setTimeout(() => {
        setMessage(dictionary.slowMessage);
      }, 45000);
      timerRef.current = setTimeout(() => {
        setMessage(dictionary.stillWorking);
      }, 120000);
      forceStopTimerRef.current = setTimeout(() => {
        stopProgress();
      }, 180000);

      const startedAt = Date.now();
      const locationAtSubmit = window.location.href;
      const isGetSubmit = (form.method || "get").toLowerCase() === "get";
      const settleAfterMs = isGetSubmit ? 12_000 : 1_200;
      actionSettleTimerRef.current = setInterval(() => {
        if (window.location.href !== locationAtSubmit) return;
        const disabled = submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement ? submitter.disabled : false;
        const reachedFinalStage = stageIndexRef.current >= nextStages.length - 1;
        if (!disabled && Date.now() - startedAt > settleAfterMs && (!isGetSubmit || reachedFinalStage)) {
          stopProgress();
        }
      }, 300);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      if (link.dataset.navigationProgress === "off") return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || link.target) return;

      const dictionary = currentProgressDictionary();
      clearTimer();
      const label = link.dataset.navigationProgress || link.textContent?.replace(/\s+/g, " ").trim() || dictionary.detailFallback;
      const nextStages = linkProgressStages(label, dictionary);
      stageIndexRef.current = 0;
      setStageIndex(0);
      setStages(nextStages);
      setMessage(nextStages[0] ?? dictionary.working(label));
      setActive(true);
      stageTimerRef.current = setInterval(() => {
        stageIndexRef.current =
          stageIndexRef.current < nextStages.length - 1 ? stageIndexRef.current + 1 : nextStages.length - 1;
        setStageIndex(stageIndexRef.current);
        setMessage(nextStages[stageIndexRef.current] ?? dictionary.resultStage);
      }, 1200);
      slowTimerRef.current = setTimeout(() => {
        setMessage(dictionary.slowMessage);
      }, 45000);
      timerRef.current = setTimeout(() => {
        setMessage(dictionary.stillWorking);
      }, 120000);
      forceStopTimerRef.current = setTimeout(() => {
        stopProgress();
      }, 180000);
    }

    document.addEventListener("submit", handleSubmit, { capture: true });
    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("hsfinder:navigation-progress-done", stopProgress);

    return () => {
      document.removeEventListener("submit", handleSubmit, { capture: true });
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("hsfinder:navigation-progress-done", stopProgress);
      clearTimer();
    };
  }, []);

  useEffect(() => {
    const nextLocation = `${pathname}?${searchParams.toString()}`;
    if (previousLocationRef.current !== nextLocation) {
      previousLocationRef.current = nextLocation;
      window.setTimeout(() => setActive(false), 700);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (active || !stageTimerRef.current) return;
    clearInterval(stageTimerRef.current);
    stageTimerRef.current = null;
  }, [active]);

  if (!active) return null;

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="h-1 w-full overflow-hidden bg-blue-100">
        <div className="lookup-progress-bar h-full bg-blue-700" />
      </div>
      <div className="mx-auto mt-2 flex max-w-7xl justify-end px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-800 shadow-sm">
          <span className="lookup-progress-spinner size-4 rounded-full border-2 border-blue-200 border-t-blue-700" aria-hidden="true" />
          <span>{message}</span>
          {stages.length > 1 ? <span className="font-mono text-xs text-blue-500">{stageIndex + 1}/{stages.length}</span> : null}
        </div>
      </div>
    </div>
  );
}
