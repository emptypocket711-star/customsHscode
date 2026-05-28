import { NextResponse } from "next/server";
import type { Browser, Page } from "playwright-core";
import { requireAuthenticatedApiRoute } from "@/server/auth/api-route-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeContainerNo(value: unknown) {
  return typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

type TerminalCode = "hjit" | "snct" | "ifpc" | "ict" | "bnct" | "pctc" | "pnct";

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
  await input.fill(containerNo);
  await page.mouse.click(1160, 72);
  await page.waitForTimeout(3500);
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
  await page.waitForTimeout(3500);
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
    const detail = error instanceof Error ? error.message : "unknown";
    return new NextResponse(`반입계 출력 브라우저를 실행하지 못했습니다. ${detail}`, { status: 500 });
  }

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1600 },
      deviceScaleFactor: 1
    });
    try {
      await captureLiveTerminal(page, request, terminalCode, containerNo);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "unknown";
      return new NextResponse(`터미널 원문 화면을 불러오지 못했습니다. ${detail}`, { status: 502 });
    }
    await page.emulateMedia({ media: "screen" });
    const buffer = await page.screenshot({
      fullPage: true,
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
