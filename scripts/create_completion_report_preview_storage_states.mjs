#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  isLocalOrAllowedRemoteUrl,
  playwrightContextOptions,
  remoteE2ERequirement,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";
import { completionReportPreviewFixture as fixture } from "../tests/fixtures/completion-report-preview.fixture.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const password = process.env.E2E_TEST_PASSWORD;
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);
const outputDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";

const roles = [
  ["requester", fixture.requesterUserEmail],
  ["selected-partner", fixture.selectedPartnerUserEmail],
  ["unmatched-partner", fixture.unmatchedPartnerUserEmail],
  ["developer", fixture.developerUserEmail]
];

function assert(condition, message) {
  if (condition) return;
  throw new Error(message);
}

function assertLocalBaseUrl(value) {
  assert(
    isLocalOrAllowedRemoteUrl(value, "COMPLETION_PREVIEW"),
    `local 또는 명시적으로 허용된 remote base URL에서만 storage state를 만들 수 있습니다. current=${safeOrigin(value)}. ${remoteE2ERequirement("COMPLETION_PREVIEW")}`
  );
}

async function loginAndSaveStorageState(browser, role, email) {
  const context = await browser.newContext(playwrightContextOptions({ viewport: { width: 1366, height: 900 } }));
  const page = await context.newPage();
  const statePath = path.join(outputDir, `completion-preview-${role}.json`);

  try {
    await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.locator('input[name="email"]').fill(email, { timeout: timeoutMs });
    await page.locator('input[name="password"]').fill(password, { timeout: timeoutMs });
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: timeoutMs }),
      page.locator('button[type="submit"]').click()
    ]);
    await context.storageState({ path: statePath });
    return statePath;
  } finally {
    await context.close();
  }
}

async function main() {
  assertLocalBaseUrl(baseUrl);
  assert(password, "E2E_TEST_PASSWORD가 필요합니다. 먼저 npm run e2e:completion-preview:seed를 실행해 같은 비밀번호로 계정을 준비하세요.");

  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const created = [];

  try {
    for (const [role, email] of roles) {
      const statePath = await loginAndSaveStorageState(browser, role, email);
      created.push({ role, statePath });
    }
  } finally {
    await browser.close();
  }

  console.log("Completion report preview storage states created");
  for (const item of created) {
    console.log(`${item.role}=${item.statePath}`);
  }
}

try {
  await main();
} catch (error) {
  console.error("Completion report preview storage state creation failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
