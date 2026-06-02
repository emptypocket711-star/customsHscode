#!/usr/bin/env node

import { access } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { marketplaceTransactionFixture as fixtureContract } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const stateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);

const fixture = {
  clearanceBidId: process.env[fixtureContract.envKeys.clearanceBidId],
  clearanceRequestId: process.env[fixtureContract.envKeys.clearanceRequestId],
  freightBidId: process.env[fixtureContract.envKeys.freightBidId],
  freightRequestId: process.env[fixtureContract.envKeys.freightRequestId],
  zeroMatchFreightRequestId: process.env[fixtureContract.zeroMatch.envKeys.freightRequestId]
};

const stateFiles = {
  broker: path.join(stateDir, fixtureContract.storageStates.broker),
  developer: path.join(stateDir, process.env.E2E_MARKETPLACE_DEVELOPER_STATE_FILE || "local-developer.json"),
  forwarder: path.join(stateDir, fixtureContract.storageStates.forwarder),
  requester: path.join(stateDir, fixtureContract.storageStates.requester)
};

function assert(condition, message, details = {}) {
  if (condition) return;

  const error = new Error(message);
  error.details = details;
  throw error;
}

function assertLocalBaseUrl(value) {
  const url = new URL(value);
  const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
  assert(isLocal, `local base URL에서만 marketplace transaction e2e를 실행할 수 있습니다. current=${url.origin}`);
}

async function assertStorageStatesExist() {
  for (const [role, statePath] of Object.entries(stateFiles)) {
    if (role === "developer") continue;
    try {
      await access(statePath);
    } catch {
      throw new Error(`${role} storage state가 없습니다: ${statePath}. 먼저 marketplace transaction auth state를 생성하세요.`);
    }
  }
}

async function storageStateExists(statePath) {
  try {
    await access(statePath);
    return true;
  } catch {
    return false;
  }
}

function assertFixtureEnv() {
  for (const [key, value] of Object.entries(fixture)) {
    assert(value, `${key} env가 필요합니다.`);
  }
}

function transactionUrl(kind, role, requestId) {
  if (role === "partner") return new URL(`/requests/${kind}/opportunities/${requestId}`, baseUrl).toString();
  return new URL(`/requests/${kind}/${requestId}`, baseUrl).toString();
}

async function pageTextFor(browser, role, url) {
  const context = await browser.newContext({ storageState: stateFiles[role] });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
    return {
      text: await page.locator("body").innerText({ timeout: timeoutMs }),
      url: page.url()
    };
  } finally {
    await context.close();
  }
}

function assertContainsAll(text, tokens, label) {
  for (const token of tokens) {
    assert(text.includes(token), `${label} 화면에 "${token}" 문구가 보이지 않습니다.`);
  }
}

async function assertUnauthenticatedRedirect(browser, kind, role, requestId) {
  const page = await browser.newPage();
  try {
    await page.goto(transactionUrl(kind, role, requestId), { waitUntil: "networkidle", timeout: timeoutMs });
    const body = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(page.url().includes("/login"), "비로그인 거래 화면 접근이 login으로 이동하지 않았습니다.", { currentUrl: page.url() });
    assert(body.includes("로그인"), "비로그인 거래 화면 접근 후 로그인 화면이 표시되지 않았습니다.");
  } finally {
    await page.close();
  }
}

async function assertRequesterDetail(browser, kind, requestId) {
  const result = await pageTextFor(browser, "requester", transactionUrl(kind, "requester", requestId));
  assert(!result.url.includes("/login"), `${kind} 화주 상세가 로그인으로 이동했습니다.`, { currentUrl: result.url });
  assertContainsAll(
    result.text,
    kind === "freight"
      ? [
        "운송 견적 요청 상세",
        fixtureContract.requests.freight.title,
        "받은 견적",
        "견적 비교 기준",
        "포워더 선정"
      ]
      : [
        "통관 의뢰 요청 상세",
        fixtureContract.requests.clearance.title,
        "받은 견적",
        "견적 비교 기준",
        "관세사무소 선정"
      ],
    `${kind} 화주 상세`
  );
}

async function assertRequesterDashboardNextAction(browser) {
  const context = await browser.newContext({ storageState: stateFiles.requester });
  const page = await context.newPage();

  try {
    await page.goto(new URL("/dashboard", baseUrl).toString(), { waitUntil: "networkidle", timeout: timeoutMs });
    const actionLink = page.locator(`a[href="/requests/freight/${fixture.freightRequestId}"]`).first();
    await Promise.all([
      page.waitForURL((url) => url.pathname === `/requests/freight/${fixture.freightRequestId}`, { timeout: timeoutMs }),
      actionLink.click({ timeout: timeoutMs })
    ]);
    await page.waitForLoadState("networkidle", { timeout: timeoutMs });

    const body = await page.locator("body").innerText({ timeout: timeoutMs });
    assertContainsAll(body, [
      "운송 견적 요청 상세",
      fixtureContract.requests.freight.title,
      "받은 견적",
      "견적 비교 기준",
      "포워더 선정"
    ], "화주 대시보드 다음 행동 상세 이동");
  } finally {
    await context.close();
  }
}

async function assertRequesterDetailBidFocus(browser, kind, requestId, requestTitle) {
  const context = await browser.newContext({ storageState: stateFiles.requester });
  const page = await context.newPage();

  try {
    await page.goto(transactionUrl(kind, "requester", requestId), { waitUntil: "networkidle", timeout: timeoutMs });
    const bidFocusLink = page.locator('a[href="#request-bids"]').filter({ hasText: "견적" }).first();
    await bidFocusLink.click({ timeout: timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => undefined);

    const body = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(page.url().endsWith("#request-bids"), `${kind} 상세에서 견적 바로가기가 request-bids 앵커로 이동하지 않았습니다.`, { currentUrl: page.url() });
    assertContainsAll(body, [
      requestTitle,
      "받은 견적",
      "견적 비교 기준"
    ], `${kind} 화주 상세 견적 focus`);
  } finally {
    await context.close();
  }
}

async function assertRequesterZeroMatchDetail(browser) {
  const result = await pageTextFor(browser, "requester", transactionUrl("freight", "requester", fixture.zeroMatchFreightRequestId));
  assert(!result.url.includes("/login"), "zero-match 화주 상세가 로그인으로 이동했습니다.", { currentUrl: result.url });
  assertContainsAll(result.text, [
    "운송 견적 요청 상세",
    fixtureContract.zeroMatch.requests.freight.title,
    "파트너 노출·알림 상태",
    "조건에 맞는 포워더 0곳",
    "운영 점검 필요"
  ], "zero-match 화주 상세");
}

async function assertOperationsZeroMatchDetail(browser) {
  if (!(await storageStateExists(stateFiles.developer))) {
    console.log(`skip operations zero-match detail: developer storage state missing at ${stateFiles.developer}`);
    return;
  }

  const result = await pageTextFor(browser, "developer", new URL(`/operations/requests/${fixture.zeroMatchFreightRequestId}`, baseUrl).toString());
  assert(!result.url.includes("/login"), "zero-match 운영 상세가 로그인으로 이동했습니다.", { currentUrl: result.url });
  assertContainsAll(result.text, [
    "플랫폼 요청 운영 상세",
    "파트너 노출·알림 운영 요약",
    "노출 0곳",
    "요청 조건, 파트너 관심 조건, 운영자 검증 상태"
  ], "zero-match 운영 상세");
}

async function assertPartnerOpportunity(browser, kind, role, requestId) {
  const result = await pageTextFor(browser, role, transactionUrl(kind, "partner", requestId));
  assert(!result.url.includes("/login"), `${kind} 파트너 상세가 로그인으로 이동했습니다.`, { currentUrl: result.url });
  assertContainsAll(
    result.text,
    kind === "freight"
      ? [
        "운송 입찰 작업",
        fixtureContract.requests.freight.title,
        "총 견적 금액",
        "견적 메모",
        "견적 제출"
      ]
      : [
        "통관 입찰 작업",
        fixtureContract.requests.clearance.title,
        "관세사무소 예비 견적 제출",
        "총 견적 금액",
        "예비 통관 견적 제출"
      ],
    `${kind} 파트너 상세`
  );
}

async function main() {
  assertLocalBaseUrl(baseUrl);
  assertFixtureEnv();
  await assertStorageStatesExist();

  const browser = await chromium.launch({ headless: true });

  try {
    await assertUnauthenticatedRedirect(browser, "freight", "requester", fixture.freightRequestId);
    await assertUnauthenticatedRedirect(browser, "clearance", "requester", fixture.clearanceRequestId);
    await assertRequesterDashboardNextAction(browser);
    await assertRequesterDetail(browser, "freight", fixture.freightRequestId);
    await assertRequesterDetail(browser, "clearance", fixture.clearanceRequestId);
    await assertRequesterDetailBidFocus(browser, "freight", fixture.freightRequestId, fixtureContract.requests.freight.title);
    await assertRequesterDetailBidFocus(browser, "clearance", fixture.clearanceRequestId, fixtureContract.requests.clearance.title);
    await assertRequesterZeroMatchDetail(browser);
    await assertOperationsZeroMatchDetail(browser);
    await assertPartnerOpportunity(browser, "freight", "forwarder", fixture.freightRequestId);
    await assertPartnerOpportunity(browser, "clearance", "broker", fixture.clearanceRequestId);

    console.log("Marketplace transaction E2E");
    console.log(`baseUrl=${baseUrl}`);
    console.log("result=ok");
  } finally {
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  console.error("Marketplace transaction E2E");
  console.error(`baseUrl=${baseUrl}`);
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  if (error instanceof Error && "details" in error) {
    console.error(`details=${JSON.stringify(error.details)}`);
  }
  process.exitCode = 1;
}
