import { NextResponse } from "next/server";
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

  const browser = await chromium.launch({
    headless: true
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1600 },
      deviceScaleFactor: 1
    });
    if (terminalCode) {
      await captureLiveTerminal(page, request, terminalCode, containerNo);
    } else {
      await page.setContent(html, { waitUntil: "networkidle", timeout: 15000 });
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
