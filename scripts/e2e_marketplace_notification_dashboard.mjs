#!/usr/bin/env node

import { access } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const stateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);
const partnerStatePath = path.join(stateDir, "marketplace-notification-partner.json");
const requestId = process.env.E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID;
const deliveryId = process.env.E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID;

function assert(condition, message, details = {}) {
  if (condition) return;

  const error = new Error(message);
  error.details = details;
  throw error;
}

function assertLocalBaseUrl(value) {
  const url = new URL(value);
  const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
  assert(isLocal, `local base URL에서만 marketplace notification e2e를 실행할 수 있습니다. current=${url.origin}`);
}

async function assertStorageStateExists() {
  try {
    await access(partnerStatePath);
  } catch {
    throw new Error(`partner storage state가 없습니다: ${partnerStatePath}. 먼저 로컬 파트너 로그인 state를 생성하세요.`);
  }
}

async function main() {
  assertLocalBaseUrl(baseUrl);
  assert(requestId, "E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID가 필요합니다.");
  assert(deliveryId, "E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID가 필요합니다.");
  await assertStorageStateExists();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: partnerStatePath });
  const page = await context.newPage();

  try {
    await page.goto(new URL("/dashboard", baseUrl).toString(), { waitUntil: "networkidle", timeout: timeoutMs });
    const body = await page.locator("body").innerText({ timeout: timeoutMs });

    assert(body.includes("파트너 알림"), "대시보드에 파트너 알림 패널이 보이지 않습니다.", { currentUrl: page.url() });
    assert(body.includes("읽음 처리"), "읽음 처리 버튼이 보이지 않습니다.", { currentUrl: page.url() });
    assert(body.includes(requestId) === false, "대시보드에 raw request id가 직접 노출됩니다.");

    const deliveryForm = page.locator(`form:has(input[name="deliveryId"][value="${deliveryId}"])`);
    await deliveryForm.locator("button", { hasText: "읽음 처리" }).click({ timeout: timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: timeoutMs });

    const afterText = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(afterText.includes("읽음") || afterText.includes("확인 완료"), "읽음 처리 후 확인 상태가 보이지 않습니다.");

    console.log("Marketplace notification dashboard E2E");
    console.log(`baseUrl=${baseUrl}`);
    console.log("result=ok");
  } finally {
    await context.close();
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  console.error("Marketplace notification dashboard E2E");
  console.error(`baseUrl=${baseUrl}`);
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  if (error instanceof Error && "details" in error) {
    console.error(`details=${JSON.stringify(error.details)}`);
  }
  process.exitCode = 1;
}
