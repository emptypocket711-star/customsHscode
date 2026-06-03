#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  envValue,
  isLocalOrAllowedRemoteUrl,
  loadEnvFile,
  playwrightContextOptions,
  remoteE2ERequirement,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);
const outputDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";
const developerEmail = (process.env.OPERATIONS_DEVELOPER_EMAIL || process.env.SMOKE_OPERATIONS_EMAIL || "emptypocket711@gmail.com").trim().toLowerCase();
const developerStateFile = process.env.E2E_MARKETPLACE_DEVELOPER_STATE_FILE || "local-developer.json";

function assert(condition, message) {
  if (condition) return;
  throw new Error(message);
}

function assertLocalBaseUrl(value) {
  assert(
    isLocalOrAllowedRemoteUrl(value, "MARKETPLACE_TRANSACTION"),
    `local 또는 명시적으로 허용된 remote base URL에서만 storage state를 만들 수 있습니다. current=${safeOrigin(value)}. ${remoteE2ERequirement("MARKETPLACE_TRANSACTION")}`
  );
}

async function loginAndSaveStorageState(browser, role, email, stateFile, password) {
  const context = await browser.newContext(playwrightContextOptions({ viewport: { width: 1366, height: 900 } }));
  const page = await context.newPage();
  const statePath = path.join(outputDir, stateFile);

  try {
    await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.locator('input[name="email"]').fill(email, { timeout: timeoutMs });
    await page.locator('input[name="password"]').fill(password, { timeout: timeoutMs });
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: timeoutMs }),
      page.locator('button[type="submit"]').click()
    ]);
    await context.storageState({ path: statePath });
    return { role, statePath };
  } finally {
    await context.close();
  }
}

async function main() {
  const localEnv = await loadEnvFile();
  const supabaseUrl = envValue(localEnv, "SUPABASE_URL") || envValue(localEnv, "NEXT_PUBLIC_SUPABASE_URL");
  const password = envValue(localEnv, "E2E_TEST_PASSWORD");
  const developerPassword =
    envValue(localEnv, "SMOKE_OPERATIONS_PASSWORD") ||
    envValue(localEnv, "OPERATIONS_DEVELOPER_PASSWORD") ||
    password;
  const roles = [
    ["requester", fixture.users.requester.email, fixture.storageStates.requester, password],
    ["forwarder", fixture.users.forwarder.email, fixture.storageStates.forwarder, password],
    ["broker", fixture.users.broker.email, fixture.storageStates.broker, password],
    ["developer", developerEmail, developerStateFile, developerPassword]
  ];

  console.log("Marketplace transaction storage state creation");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log("secretValues=not-printed");

  assertLocalBaseUrl(baseUrl);
  assert(
    isLocalOrAllowedRemoteUrl(supabaseUrl, "MARKETPLACE_TRANSACTION"),
    `local Supabase 또는 명시적으로 허용된 remote Supabase에서만 storage state를 만들 수 있습니다. current=${safeOrigin(supabaseUrl)}. ${remoteE2ERequirement("MARKETPLACE_TRANSACTION")}`
  );
  assert(password, "E2E_TEST_PASSWORD가 필요합니다. 먼저 npm run e2e:marketplace-transaction:seed를 같은 비밀번호로 실행하세요.");
  assert(developerPassword, "SMOKE_OPERATIONS_PASSWORD, OPERATIONS_DEVELOPER_PASSWORD, 또는 E2E_TEST_PASSWORD가 필요합니다.");

  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const created = [];

  try {
    for (const [role, email, stateFile, rolePassword] of roles) {
      created.push(await loginAndSaveStorageState(browser, role, email, stateFile, rolePassword));
    }
  } finally {
    await browser.close();
  }

  console.log("result=ok");
  for (const item of created) {
    console.log(`${item.role}=${item.statePath}`);
  }
}

try {
  await main();
} catch (error) {
  console.error("Marketplace transaction storage state creation");
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
}
