import { NextResponse } from "next/server";
import chromiumServerless from "@sparticuz/chromium";
import { chromium, type Page } from "playwright";

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
  await page.goto(helperUrl.toString(), {
    waitUntil: "networkidle",
    timeout: 30000
  });
  await page.waitForTimeout(3500);
}

async function launchChromium() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return chromium.launch({
      args: chromiumServerless.args,
      executablePath: await chromiumServerless.executablePath(),
      headless: true
    });
  }

  return chromium.launch({ headless: true });
}

export async function POST(request: Request) {
  let payload: { containerNo?: unknown; html?: unknown; terminalCode?: unknown };
  try {
    payload = await request.json();
  } catch {
    return new NextResponse("잘못된 요청입니다.", { status: 400 });
  }

  const containerNo = normalizeContainerNo(payload.containerNo);
  const html = typeof payload.html === "string" ? payload.html : "";
  const terminalCode = normalizeTerminalCode(payload.terminalCode);

  if (!/^[A-Z]{4}[0-9]{7}$/.test(containerNo)) {
    return new NextResponse("컨테이너 번호 형식이 올바르지 않습니다.", { status: 400 });
  }

  if (!terminalCode && (!html || html.length > 2_000_000)) {
    return new NextResponse("캡처할 원문 조회 화면이 없습니다.", { status: 400 });
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
      if (terminalCode) {
        await captureLiveTerminal(page, request, terminalCode, containerNo);
      } else {
        await page.setContent(html, { waitUntil: "networkidle", timeout: 15000 });
      }
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
