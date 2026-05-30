#!/usr/bin/env node

import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL || "https://hsfinder.co.kr";
const loginEmail = process.env.E2E_LOGIN_EMAIL || process.env.SMOKE_LOGIN_EMAIL || "hsfinder-e2e@example.com";
const loginPassword = process.env.E2E_LOGIN_PASSWORD || process.env.SMOKE_LOGIN_PASSWORD || "HsFinderTest!2026";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);

function assert(condition, message, details = {}) {
  if (condition) return;

  const error = new Error(message);
  error.details = details;
  throw error;
}

async function login(page) {
  await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.locator('input[name="email"]').fill(loginEmail, { timeout: timeoutMs });
  await page.locator('input[name="password"]').fill(loginPassword, { timeout: timeoutMs });
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: timeoutMs }),
    page.locator('button[type="submit"]').click()
  ]);
}

function productSearchUrl(query) {
  const url = new URL("/hs/direct", baseUrl);
  url.searchParams.set("query", query);
  url.searchParams.set("direction", "import");
  url.searchParams.set("destinationCountry", "CN");
  url.searchParams.set("basisDate", "2026-05-30");
  return url.toString();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const startedAt = performance.now();

  try {
    await login(page);
    await page.goto(productSearchUrl("사탕"), { waitUntil: "networkidle", timeout: timeoutMs });

    const initialBody = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(initialBody.includes("1순위 추천 HS CODE"), "품명검색 결과 1순위 후보가 표시되지 않았습니다.");
    assert(initialBody.includes("간단 보완사항"), "간단 보완사항 입력이 표시되지 않았습니다.");
    assert(initialBody.includes("질문별로 답변하기"), "질문별 상세 입력 접힘 영역이 표시되지 않았습니다.");

    const visibleTextareas = await page.locator("textarea:visible").count();
    assert(visibleTextareas === 1, "기본 화면에는 보이는 textarea가 1개여야 합니다.", { visibleTextareas });

    const submitButton = page.getByRole("button", { name: /보완사항 적용하여 재조회/ }).first();
    assert(!(await submitButton.isEnabled()), "보완사항 입력 전에는 재조회 버튼이 비활성이어야 합니다.");

    await page.getByPlaceholder("예: 코코아 미함유, 소매포장, 설탕 과자입니다.").fill("코코아 미함유, 소매포장된 설탕 과자입니다.");
    assert(await submitButton.isEnabled(), "간단 보완사항 입력 후 재조회 버튼이 활성화되어야 합니다.");

    await Promise.all([
      page.waitForURL((url) => url.pathname === "/hs/direct" && url.searchParams.get("query")?.includes("보완정보:"), { timeout: timeoutMs }),
      submitButton.click()
    ]);
    await page.waitForLoadState("networkidle", { timeout: timeoutMs });

    const finalBody = await page.locator("body").innerText({ timeout: timeoutMs });
    const queryInputValue = await page.locator('input[name="query"]').inputValue({ timeout: timeoutMs });

    assert(queryInputValue === "사탕", "보완 재조회 후 검색창에는 원 품명만 표시되어야 합니다.", { queryInputValue });
    assert(finalBody.includes("이번 재조회에 반영된 보완사항"), "보완사항 요약 패널이 표시되지 않았습니다.");
    assert(finalBody.includes("1개 반영"), "보완사항 반영 개수 배지가 표시되지 않았습니다.");
    assert(finalBody.includes("코코아 미함유, 소매포장된 설탕 과자입니다."), "입력한 보완사항 답변이 요약 패널에 표시되지 않았습니다.");
    assert(finalBody.includes("1순위 추천 HS CODE"), "보완 재조회 후 결과 후보가 표시되지 않았습니다.");
    assert(finalBody.indexOf("품명 기반 HS CODE 추천 결과") < finalBody.indexOf("AI 분류 흐름 요약"), "결과가 AI 흐름보다 먼저 표시되어야 합니다.");

    console.log("HS Finder product supplement E2E");
    console.log(`baseUrl=${baseUrl}`);
    console.log(`durationMs=${Math.round(performance.now() - startedAt)}`);
    console.log("result=ok");
  } finally {
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  console.error("HS Finder product supplement E2E");
  console.error(`baseUrl=${baseUrl}`);
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  if (error instanceof Error && "details" in error) {
    console.error(`details=${JSON.stringify(error.details)}`);
  }
  process.exitCode = 1;
}
