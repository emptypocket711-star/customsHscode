#!/usr/bin/env node

import { access } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  isLocalOrAllowedRemoteUrl,
  playwrightContextOptions,
  remoteE2ERequirement,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const stateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);
const partnerStateFile = process.env.E2E_MARKETPLACE_NOTIFICATION_PARTNER_STATE_FILE || "marketplace-notification-partner.json";
const partnerStatePath = path.join(stateDir, partnerStateFile);
const requestId = process.env.E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID;
const deliveryId = process.env.E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID;
const expectedAnchor = process.env.E2E_MARKETPLACE_NOTIFICATION_EXPECTED_ANCHOR || "#opportunity-bid";

function assert(condition, message, details = {}) {
  if (condition) return;

  const error = new Error(message);
  error.details = details;
  throw error;
}

function assertLocalBaseUrl(value) {
  assert(
    isLocalOrAllowedRemoteUrl(value, "MARKETPLACE_NOTIFICATION"),
    `local 또는 명시적으로 허용된 remote base URL에서만 marketplace notification e2e를 실행할 수 있습니다. current=${safeOrigin(value)}. ${remoteE2ERequirement("MARKETPLACE_NOTIFICATION")}`
  );
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
  const context = await browser.newContext(playwrightContextOptions({ storageState: partnerStatePath }));
  const page = await context.newPage();

  try {
    await page.goto(new URL("/dashboard", baseUrl).toString(), { waitUntil: "networkidle", timeout: timeoutMs });
    const body = await page.locator("body").innerText({ timeout: timeoutMs });

    assert(body.includes("파트너 알림"), "대시보드에 파트너 알림 패널이 보이지 않습니다.", { currentUrl: page.url() });
    assert(body.includes("읽음 처리"), "읽음 처리 버튼이 보이지 않습니다.", { currentUrl: page.url() });
    assert(body.includes(requestId) === false, "대시보드에 raw request id가 직접 노출됩니다.");

    const notificationLink = page.locator(`a[href*="/opportunities/${requestId}"]`).first();
    await Promise.all([
      page.waitForURL((url) => url.pathname.includes(`/opportunities/${requestId}`), { timeout: timeoutMs }),
      notificationLink.click({ timeout: timeoutMs })
    ]);
    await page.waitForLoadState("networkidle", { timeout: timeoutMs });

    const opportunityText = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(page.url().includes(`/opportunities/${requestId}`), "알림 클릭 후 입찰 상세 화면으로 이동하지 않았습니다.", { currentUrl: page.url() });
    assert(page.url().endsWith(expectedAnchor), "알림 클릭 후 예상 처리 섹션으로 이동하지 않았습니다.", {
      currentUrl: page.url(),
      expectedAnchor
    });
    assert(
      opportunityText.includes("입찰 작업") && opportunityText.includes("다음 작업 바로가기") && opportunityText.includes("견적"),
      "입찰 상세 화면에서 다음 작업과 견적 CTA를 확인할 수 없습니다.",
      { currentUrl: page.url() }
    );

    await page.goto(new URL("/dashboard", baseUrl).toString(), { waitUntil: "networkidle", timeout: timeoutMs });

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
