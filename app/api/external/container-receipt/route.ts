import { NextResponse } from "next/server";
import type { Browser, Page } from "playwright-core";
import { requireAuthenticatedApiRoute } from "@/server/auth/api-route-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeContainerNo(value: unknown) {
  return typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

type TerminalCode = "hjit" | "snct" | "ifpc" | "ict" | "bnct" | "pctc" | "pnct";

const receiptViewport = { width: 1680, height: 1050 };

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
    const hasUsefulText = bodyText.length > 220;
    const hasTable = document.querySelectorAll("table, [role='table'], .grid, .x-grid").length > 0;

    return {
      readyState,
      isHelperPage,
      hasContainerNo,
      populatedFieldCount,
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

    if (documentLoaded && terminalScreenVisible && containerMatched && fieldsPopulated) {
      return lastReady;
    }

    if (documentLoaded && terminalScreenVisible && lastReady.hasTable && fieldsPopulated && Date.now() - startedAt > 4_000) {
      return lastReady;
    }

    await page.waitForTimeout(1000);
  }

  return lastReady;
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
  await waitForReceiptScreenReady(page, containerNo);
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
    return new NextResponse(auth.message, { status: auth.status });
  }

  let payload: { containerNo?: unknown; html?: unknown; terminalCode?: unknown };
  try {
    payload = await request.json();
  } catch {
    return new NextResponse("잘못된 요청입니다.", { status: 400 });
  }

  const containerNo = normalizeContainerNo(payload.containerNo);
  const terminalCode = normalizeTerminalCode(payload.terminalCode);

  if (!/^[A-Z]{4}[0-9]{7}$/.test(containerNo)) {
    return new NextResponse("컨테이너 번호 형식이 올바르지 않습니다.", { status: 400 });
  }

  if (!terminalCode) {
    return new NextResponse("허용된 터미널 조회 화면만 반입계로 출력할 수 있습니다.", { status: 400 });
  }

  let browser: Awaited<ReturnType<typeof launchChromium>>;
  try {
    browser = await launchChromium();
  } catch (error) {
    console.warn("[container-receipt] browser launch failed", { message: error instanceof Error ? error.message : "unknown" });
    return new NextResponse("반입계 출력 브라우저를 실행하지 못했습니다. 잠시 후 다시 시도해 주세요.", { status: 500 });
  }

  try {
    const page = await browser.newPage({
      viewport: receiptViewport,
      deviceScaleFactor: 1
    });
    try {
      await captureLiveTerminal(page, request, terminalCode, containerNo);
    } catch (error) {
      console.warn("[container-receipt] terminal capture failed", {
        terminalCode,
        containerNo,
        message: error instanceof Error ? error.message : "unknown"
      });
      return new NextResponse("터미널 원문 화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", { status: 502 });
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
