#!/usr/bin/env node

import { access } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const stateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);

const stateFiles = {
  broker: path.join(stateDir, fixture.storageStates.broker),
  forwarder: path.join(stateDir, fixture.storageStates.forwarder),
  requester: path.join(stateDir, fixture.storageStates.requester)
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
  assert(isLocal, `local base URL에서만 marketplace transaction mutation e2e를 실행할 수 있습니다. current=${url.origin}`);
}

async function assertStorageStatesExist() {
  for (const [role, statePath] of Object.entries(stateFiles)) {
    try {
      await access(statePath);
    } catch {
      throw new Error(`${role} storage state가 없습니다: ${statePath}. 먼저 marketplace transaction auth state를 생성하세요.`);
    }
  }
}

function transactionUrl(kind, role, requestId) {
  if (role === "partner") return new URL(`/requests/${kind}/opportunities/${requestId}`, baseUrl).toString();
  return new URL(`/requests/${kind}/${requestId}`, baseUrl).toString();
}

async function pageFor(browser, role) {
  const context = await browser.newContext({ storageState: stateFiles[role] });
  const page = await context.newPage();
  return { context, page };
}

async function clickAndSettle(page, locator) {
  await locator.click({ timeout: timeoutMs });
  await page.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => undefined);
}

async function submitFreightBid(browser) {
  const { context, page } = await pageFor(browser, "forwarder");
  try {
    await page.goto(transactionUrl("freight", "partner", fixture.mutation.requests.freight.id), { waitUntil: "networkidle", timeout: timeoutMs });
    await page.locator('input[name="currency"]').fill("KRW", { timeout: timeoutMs });
    await page.locator('input[name="totalAmount"]').fill(String(fixture.mutation.bids.freight.totalAmount), { timeout: timeoutMs });
    await page.locator('input[name="freightRateAmount"]').fill("1000000", { timeout: timeoutMs });
    await page.locator('input[name="localChargeAmount"]').fill("300000", { timeout: timeoutMs });
    await page.locator('input[name="leadTimeDays"]').fill("6", { timeout: timeoutMs });
    await page.locator('input[name="transitTimeDays"]').fill("7", { timeout: timeoutMs });
    await page.locator('textarea[name="message"]').fill("E2E mutation freight terms", { timeout: timeoutMs });
    await clickAndSettle(page, page.getByRole("button", { name: "견적 제출" }));
  } finally {
    await context.close();
  }
}

async function submitClearanceBid(browser) {
  const { context, page } = await pageFor(browser, "broker");
  try {
    await page.goto(transactionUrl("clearance", "partner", fixture.mutation.requests.clearance.id), { waitUntil: "networkidle", timeout: timeoutMs });
    await page.locator('input[name="currency"]').fill("KRW", { timeout: timeoutMs });
    await page.locator('input[name="totalAmount"]').fill(String(fixture.mutation.bids.clearance.totalAmount), { timeout: timeoutMs });
    await page.locator('input[name="brokerageFeeAmount"]').fill("390000", { timeout: timeoutMs });
    await page.locator('input[name="leadTimeDays"]').fill("3", { timeout: timeoutMs });
    await page.locator('input[name="expectedClearanceDays"]').fill("4", { timeout: timeoutMs });
    await page.locator('textarea[name="riskNote"]').fill("E2E mutation preliminary review", { timeout: timeoutMs });
    await clickAndSettle(page, page.getByRole("button", { name: "예비 통관 견적 제출" }));
  } finally {
    await context.close();
  }
}

async function selectRequesterBid(browser, kind, requestId, amountText, selectButtonText, selectedText) {
  const { context, page } = await pageFor(browser, "requester");
  try {
    await page.goto(transactionUrl(kind, "requester", requestId), { waitUntil: "networkidle", timeout: timeoutMs });
    const bodyBefore = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(bodyBefore.includes(amountText), `${kind} requester detail에 제출 견적 금액이 보이지 않습니다.`);
    await clickAndSettle(page, page.getByRole("button", { name: selectButtonText }));
    const bodyAfter = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(bodyAfter.includes(selectedText), `${kind} requester detail에 선정 후속 안내가 보이지 않습니다.`);
  } finally {
    await context.close();
  }
}

async function assertSelectedPartnerView(browser, kind, role, requestId, selectedText) {
  const { context, page } = await pageFor(browser, role);
  try {
    await page.goto(transactionUrl(kind, "partner", requestId), { waitUntil: "networkidle", timeout: timeoutMs });
    const body = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(body.includes(selectedText), `${kind} selected partner detail에 선정 안내가 보이지 않습니다.`);
  } finally {
    await context.close();
  }
}

async function main() {
  assertLocalBaseUrl(baseUrl);
  await assertStorageStatesExist();

  const browser = await chromium.launch({ headless: true });

  try {
    await submitFreightBid(browser);
    await selectRequesterBid(
      browser,
      "freight",
      fixture.mutation.requests.freight.id,
      "KRW 1,450,000",
      "이 포워더 선정",
      "포워더 선정 후 다음 업무"
    );
    await assertSelectedPartnerView(browser, "freight", "forwarder", fixture.mutation.requests.freight.id, "선정된 운송 요청");

    await submitClearanceBid(browser);
    await selectRequesterBid(
      browser,
      "clearance",
      fixture.mutation.requests.clearance.id,
      "KRW 440,000",
      "이 관세사무소 선정",
      "관세사무소 선정 후 다음 업무"
    );
    await assertSelectedPartnerView(browser, "clearance", "broker", fixture.mutation.requests.clearance.id, "선정된 통관 의뢰");

    console.log("Marketplace transaction mutation E2E");
    console.log(`baseUrl=${baseUrl}`);
    console.log("result=ok");
  } finally {
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  console.error("Marketplace transaction mutation E2E");
  console.error(`baseUrl=${baseUrl}`);
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  if (error instanceof Error && "details" in error) {
    console.error(`details=${JSON.stringify(error.details)}`);
  }
  process.exitCode = 1;
}
