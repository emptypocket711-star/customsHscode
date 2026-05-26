"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function submitterLabel(submitter: HTMLElement | null) {
  const label = submitter?.textContent?.replace(/\s+/g, " ").trim();
  return label && label.length <= 24 ? label : "처리";
}

function withResultStage(stages: string[]) {
  return [...stages, "검색 결과 화면을 생성하고 있습니다"];
}

function progressStages(form: HTMLFormElement, label: string) {
  const action = form.getAttribute("action") ?? "";
  const query = form.querySelector<HTMLInputElement>("[name='query']")?.value?.trim();
  const normalizedQuery = query?.replace(/[^0-9]/g, "") ?? "";
  const isHsCodeQuery = Boolean(query && /^[0-9.\-\s]+$/.test(query) && normalizedQuery.length >= 2);
  const hasModelLikeToken = Boolean(query && /\b(?=[a-z0-9-]{4,}\b)(?=[a-z0-9-]*[a-z])(?=[a-z0-9-]*[0-9])[a-z0-9-]+\b/i.test(query));

  if (action.includes("/hs/direct") || query) {
    if (isHsCodeQuery) {
      return withResultStage([
        query ? `HS CODE 형식 확인: ${query}` : "HS CODE 형식을 확인하고 있습니다",
        "상위 류·호·소호와 하위 품목을 조회하고 있습니다",
        "관세율과 세율 적용 순서를 계산하고 있습니다",
        "내국세와 수입요건을 함께 불러오고 있습니다"
      ]);
    }

    return withResultStage([
      query ? `품명 입력값 확인: ${query}` : "품명 입력값을 확인하고 있습니다",
      hasModelLikeToken ? "제품코드·모델명 단서를 해석하고 있습니다" : "오타와 동의어를 정규화하고 있습니다",
      "AI가 제품 성격과 후보 HS4·HS6를 도출하고 있습니다",
      "후보별 국내 HSK와 상대국 HS 연결 가능성을 구성하고 있습니다",
      "후보별 관세율, 내국세, 수입요건을 함께 불러오고 있습니다"
    ]);
  }

  if (/업로드|추출/.test(label)) {
    return withResultStage([
      `${label} 요청을 준비하고 있습니다`,
      "파일과 입력값을 검증하고 있습니다",
      "문서 추출 결과와 보완 질문을 정리하고 있습니다"
    ]);
  }

  if (/저장|승인|요청/.test(label)) {
    return withResultStage([
      `${label} 요청을 처리하고 있습니다`,
      "권한과 입력값을 확인하고 있습니다",
      "변경 사항을 저장하고 있습니다"
    ]);
  }

  return withResultStage([`${label} 중입니다`, "입력값을 확인하고 있습니다", "조회 결과를 정리하고 있습니다"]);
}

function linkProgressStages(label: string) {
  if (/HS|상세|후보|검색|조회|CODE|코드/i.test(label)) {
    return [
      `${label} 조회를 준비하고 있습니다`,
      "선택한 코드와 품명 기준으로 상세 데이터를 조회하고 있습니다",
      "관세율, 내국세, 요건 정보를 함께 구성하고 있습니다",
      "검색 결과 화면을 생성하고 있습니다"
    ];
  }

  return [
    `${label} 요청을 준비하고 있습니다`,
    "선택한 화면의 데이터를 불러오고 있습니다",
    "검색 결과 화면을 생성하고 있습니다"
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

      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
      const label = submitterLabel(submitter);
      const loweredLabel = label.toLowerCase();
      const isLookupLike = /조회|검색|자동조회|추출|업로드|저장|승인|요청/.test(label) || loweredLabel.includes("search");

      if (!isLookupLike) return;

      clearTimer();
      const nextStages = progressStages(form, label);
      stageIndexRef.current = 0;
      setStageIndex(0);
      setStages(nextStages);
      setMessage(nextStages[0] ?? `${label} 중입니다`);
      setActive(true);
      watchProgressCompleteMarker();
      stageTimerRef.current = setInterval(() => {
        stageIndexRef.current =
          stageIndexRef.current < nextStages.length - 1 ? stageIndexRef.current + 1 : nextStages.length - 1;
        setStageIndex(stageIndexRef.current);
        setMessage(nextStages[stageIndexRef.current] ?? `${label} 중입니다`);
      }, 1800);
      slowTimerRef.current = setTimeout(() => {
        setMessage("검색 결과 화면 생성이 지연되고 있습니다. 완료될 때까지 기다려 주세요");
      }, 45000);
      timerRef.current = setTimeout(() => {
        setMessage("검색 결과 화면을 계속 생성하고 있습니다. 네트워크 상태를 확인하고 있습니다");
      }, 120000);
      forceStopTimerRef.current = setTimeout(() => {
        stopProgress();
      }, 20000);

      const startedAt = Date.now();
      const locationAtSubmit = window.location.href;
      actionSettleTimerRef.current = setInterval(() => {
        if (window.location.href !== locationAtSubmit) return;
        const disabled = submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement ? submitter.disabled : false;
        if (!disabled && Date.now() - startedAt > 1200) {
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

      clearTimer();
      const label = link.dataset.navigationProgress || link.textContent?.replace(/\s+/g, " ").trim() || "상세조회";
      const nextStages = linkProgressStages(label);
      stageIndexRef.current = 0;
      setStageIndex(0);
      setStages(nextStages);
      setMessage(nextStages[0] ?? "상세조회 중입니다");
      setActive(true);
      stageTimerRef.current = setInterval(() => {
        stageIndexRef.current =
          stageIndexRef.current < nextStages.length - 1 ? stageIndexRef.current + 1 : nextStages.length - 1;
        setStageIndex(stageIndexRef.current);
        setMessage(nextStages[stageIndexRef.current] ?? "검색 결과 화면을 생성하고 있습니다");
      }, 1200);
      slowTimerRef.current = setTimeout(() => {
        setMessage("검색 결과 화면 생성이 지연되고 있습니다. 완료될 때까지 기다려 주세요");
      }, 45000);
      timerRef.current = setTimeout(() => {
        setMessage("검색 결과 화면을 계속 생성하고 있습니다. 네트워크 상태를 확인하고 있습니다");
      }, 120000);
      forceStopTimerRef.current = setTimeout(() => {
        stopProgress();
      }, 30000);
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
