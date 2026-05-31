import { NextResponse } from "next/server";
import type { Browser, Page } from "playwright-core";
import { requireAuthenticatedApiRoute } from "@/server/auth/api-route-auth";
import { logContainerReceiptFailure } from "@/server/observability/container-receipt-failure-events";
import { externalIntegrationErrorResponse } from "@/server/services/external-integration-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeContainerNo(value: unknown) {
  return typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

type TerminalCode = "hjit" | "snct" | "ifpc" | "ict" | "bnct" | "pctc" | "pnct";

const receiptViewport = { width: 1680, height: 1050 };

type ReceiptReadinessState = Awaited<ReturnType<typeof receiptReadiness>>;

class ReceiptScreenNotReadyError extends Error {
  readonly readiness: ReceiptReadinessState;
  readonly minPopulatedFields: number;

  constructor(message: string, readiness: ReceiptReadinessState, minPopulatedFields: number) {
    super(message);
    this.name = "ReceiptScreenNotReadyError";
    this.readiness = readiness;
    this.minPopulatedFields = minPopulatedFields;
  }
}

function normalizeTerminalCode(value: unknown): TerminalCode | "" {
  return value === "hjit" || value === "snct" || value === "ifpc" || value === "ict" || value === "bnct" || value === "pctc" || value === "pnct"
    ? value
    : "";
}

function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  return forwardedHost ? `${forwardedProto ?? url.protocol.replace(":", "")}://${forwardedHost}` : url.origin;
}

async function captureIfpc(page: Page, containerNo: string) {
  await page.goto("https://www.ifpc.co.kr/INFO/infoservice/index.html?gv_empno=cntr_info", {
    waitUntil: "domcontentloaded",
    timeout: 45000
  });
  const input = page.locator("input[id$='edt_cycCntrno_input']").first();
  await input.waitFor({ timeout: 15000 });
  await input.click();
  await input.fill(containerNo);
  const findButton = page.locator("div[id$='btn_find']").first();
  await findButton.waitFor({ timeout: 10000 });
  await findButton.click();
  await waitForReceiptScreenReady(page, containerNo, {
    minPopulatedFields: 4,
    requireContainerText: true,
    timeoutMs: 20_000
  });
  await page.waitForTimeout(1500);
}

async function receiptReadiness(page: Page, containerNo: string) {
  return page.evaluate((targetContainerNo) => {
    const bodyText = document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "";
    const inputValues = Array.from(document.querySelectorAll("input"))
      .map((input) => input.value?.trim() ?? "")
      .filter(Boolean);
    const readyState = document.readyState;
    const isHelperPage = /조회 화면으로 이동합니다|조회 화면 열기/.test(bodyText);
    const hasContainerNo = bodyText.toUpperCase().includes(targetContainerNo)
      || inputValues.some((value) => value.toUpperCase().includes(targetContainerNo));
    const populatedFieldCount = inputValues
      .filter((value) => value.toUpperCase() !== targetContainerNo)
      .filter((value) => value.toLowerCase() !== "guest")
      .length;
    const centerElement = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    const centerText = centerElement?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const hasCenterLoadingOverlay = /Loading|잠시만 기다려 주세요/.test(centerText);
    const hasVisibleWaitWindow = Array.from(document.querySelectorAll("[id*='waitwindow'], [id*='WaitWindow']"))
      .some((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity || "1") !== 0
          && rect.width > 40
          && rect.height > 40;
      });
    const hasUsefulText = bodyText.length > 220;
    const hasTable = document.querySelectorAll("table, [role='table'], .grid, .x-grid").length > 0;

    return {
      readyState,
      isHelperPage,
      hasContainerNo,
      populatedFieldCount,
      hasLoadingOverlay: hasCenterLoadingOverlay || hasVisibleWaitWindow,
      hasUsefulText,
      hasTable,
      url: window.location.href
    };
  }, containerNo);
}

async function waitForReceiptScreenReady(
  page: Page,
  containerNo: string,
  options: { timeoutMs?: number; requireContainerText?: boolean; minPopulatedFields?: number } = {}
) {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const minPopulatedFields = options.minPopulatedFields ?? 0;
  const startedAt = Date.now();
  let lastReady = await receiptReadiness(page, containerNo);

  while (Date.now() - startedAt < timeoutMs) {
    lastReady = await receiptReadiness(page, containerNo);
    const documentLoaded = lastReady.readyState === "interactive" || lastReady.readyState === "complete";
    const terminalScreenVisible = !lastReady.isHelperPage && lastReady.hasUsefulText;
    const containerMatched = options.requireContainerText === false || lastReady.hasContainerNo;
    const fieldsPopulated = lastReady.populatedFieldCount >= minPopulatedFields;
    const loadingSettled = !lastReady.hasLoadingOverlay;

    if (documentLoaded && terminalScreenVisible && containerMatched && fieldsPopulated && loadingSettled) {
      return lastReady;
    }

    if (documentLoaded && terminalScreenVisible && lastReady.hasTable && fieldsPopulated && loadingSettled && Date.now() - startedAt > 4_000) {
      return lastReady;
    }

    await page.waitForTimeout(1000);
  }

  throw new ReceiptScreenNotReadyError([
    "터미널 조회 화면이 아직 캡처 가능한 상태가 아닙니다.",
    lastReady.isHelperPage ? "조회 이동 안내 화면에 머물러 있습니다." : "",
    lastReady.hasLoadingOverlay ? "외부 사이트 로딩 화면이 남아 있습니다." : "",
    !lastReady.hasContainerNo ? "조회 화면에서 컨테이너 번호를 확인하지 못했습니다." : "",
    lastReady.populatedFieldCount < minPopulatedFields ? "조회 상세 필드가 아직 채워지지 않았습니다." : ""
  ].filter(Boolean).join(" "), lastReady, minPopulatedFields);
}

function terminalCaptureFailure(error: unknown) {
  if (error instanceof ReceiptScreenNotReadyError) {
    if (error.readiness.isHelperPage) {
      return {
        code: "terminal_helper_page_stalled",
        message: "터미널 조회 화면으로 이동하지 못했습니다. 원사이트 열기로 직접 조회해 주세요."
      };
    }
    if (error.readiness.hasLoadingOverlay) {
      return {
        code: "terminal_loading_not_settled",
        message: "터미널 조회 화면의 로딩이 끝나지 않았습니다. 잠시 후 다시 시도해 주세요."
      };
    }
    if (!error.readiness.hasContainerNo) {
      return {
        code: "terminal_container_not_confirmed",
        message: "터미널 조회 화면에서 컨테이너 번호를 확인하지 못했습니다. 컨테이너 번호와 터미널을 확인해 주세요."
      };
    }
    if (error.readiness.populatedFieldCount < error.minPopulatedFields) {
      return {
        code: "terminal_detail_not_populated",
        message: "터미널 상세 정보가 아직 채워지지 않았습니다. 잠시 후 다시 시도해 주세요."
      };
    }
  }

  return {
    code: "terminal_capture_failed",
    message: "터미널 원문 화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
  };
}

async function captureLiveTerminal(page: Page, request: Request, terminalCode: TerminalCode, containerNo: string) {
  if (terminalCode === "ifpc") {
    await captureIfpc(page, containerNo);
    return;
  }

  const origin = requestOrigin(request);
  const helperUrl = new URL("/api/external/hjit-container", origin);
  helperUrl.searchParams.set("terminal", terminalCode);
  helperUrl.searchParams.set("containerNo", containerNo);
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    await page.setExtraHTTPHeaders({ cookie: cookieHeader });
  }
  await page.goto(helperUrl.toString(), {
    waitUntil: "networkidle",
    timeout: 30000
  });
  await waitForReceiptScreenReady(page, containerNo, { timeoutMs: 25_000 });
  await page.waitForTimeout(800);
}

async function launchChromium(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const [{ chromium }, chromiumServerless] = await Promise.all([
      import("playwright-core"),
      import("@sparticuz/chromium")
    ]);
    return chromium.launch({
      args: chromiumServerless.default.args,
      executablePath: await chromiumServerless.default.executablePath(),
      headless: true
    });
  }

  const { chromium } = await import("playwright");
  return chromium.launch({ headless: true });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedApiRoute(request, {
    scope: "external-container-receipt",
    limit: Number(process.env.CONTAINER_RECEIPT_RATE_LIMIT_PER_MINUTE || 8),
    windowMs: 60_000
  });
  if (!auth.allowed) {
    return externalIntegrationErrorResponse({
      code: auth.status === 429 ? "rate_limited" : "auth_required",
      level: auth.status === 429 ? "temporary" : "input",
      message: auth.message,
      retryable: auth.status === 429,
      status: auth.status
    });
  }

  let payload: { containerNo?: unknown; html?: unknown; terminalCode?: unknown };
  try {
    payload = await request.json();
  } catch {
    return externalIntegrationErrorResponse({
      code: "bad_request",
      level: "input",
      message: "잘못된 요청입니다.",
      retryable: false,
      status: 400
    });
  }

  const containerNo = normalizeContainerNo(payload.containerNo);
  const terminalCode = normalizeTerminalCode(payload.terminalCode);

  if (!/^[A-Z]{4}[0-9]{7}$/.test(containerNo)) {
    return externalIntegrationErrorResponse({
      code: "invalid_container_no",
      level: "input",
      message: "컨테이너 번호 형식이 올바르지 않습니다.",
      retryable: false,
      status: 400
    });
  }

  if (!terminalCode) {
    return externalIntegrationErrorResponse({
      code: "unsupported_terminal",
      level: "configuration",
      message: "허용된 터미널 조회 화면만 반입계로 출력할 수 있습니다.",
      retryable: false,
      status: 400
    });
  }

  let browser: Awaited<ReturnType<typeof launchChromium>>;
  try {
    browser = await launchChromium();
  } catch (error) {
    console.warn("[container-receipt] browser launch failed", { message: error instanceof Error ? error.message : "unknown" });
    await logContainerReceiptFailure({
      containerNo,
      failureCode: "browser_launch_failed",
      message: error instanceof Error ? error.message : "unknown",
      terminalCode,
      userId: auth.userId
    });
    return externalIntegrationErrorResponse({
      code: "browser_launch_failed",
      level: "configuration",
      message: "반입계 출력 브라우저를 실행하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      retryable: false,
      status: 500
    });
  }

  try {
    const page = await browser.newPage({
      viewport: receiptViewport,
      deviceScaleFactor: 1
    });
    try {
      await captureLiveTerminal(page, request, terminalCode, containerNo);
    } catch (error) {
      const failure = terminalCaptureFailure(error);
      console.warn("[container-receipt] terminal capture failed", {
        terminalCode,
        code: failure.code,
        containerNo,
        message: error instanceof Error ? error.message : "unknown"
      });
      await logContainerReceiptFailure({
        containerNo,
        failureCode: failure.code,
        message: error instanceof Error ? error.message : failure.message,
        metadata: error instanceof ReceiptScreenNotReadyError
          ? {
              hasContainerNo: error.readiness.hasContainerNo,
              hasLoadingOverlay: error.readiness.hasLoadingOverlay,
              isHelperPage: error.readiness.isHelperPage,
              populatedFieldCount: error.readiness.populatedFieldCount,
              readyState: error.readiness.readyState
            }
          : {},
        terminalCode,
        userId: auth.userId
      });
      return externalIntegrationErrorResponse({
        code: failure.code,
        level: "external_unavailable",
        message: failure.message,
        status: 502
      });
    }
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize(receiptViewport);
    const buffer = await page.screenshot({
      animations: "disabled",
      caret: "hide",
      fullPage: false,
      type: "png"
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${containerNo}_receipt.png"`,
        "content-type": "image/png"
      }
    });
  } finally {
    await browser.close();
  }
}
