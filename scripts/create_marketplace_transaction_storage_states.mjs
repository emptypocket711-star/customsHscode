#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  envValue,
  isLocalUrl,
  loadEnvFile,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);
const outputDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";

const roles = [
  ["requester", fixture.users.requester.email, fixture.storageStates.requester],
  ["forwarder", fixture.users.forwarder.email, fixture.storageStates.forwarder],
  ["broker", fixture.users.broker.email, fixture.storageStates.broker]
];

function assert(condition, message) {
  if (condition) return;
  throw new Error(message);
}

function assertLocalBaseUrl(value) {
  assert(isLocalUrl(value), `local base URL에서만 storage state를 만들 수 있습니다. current=${safeOrigin(value)}`);
}

async function loginAndSaveStorageState(browser, role, email, stateFile, password) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const statePath = path.join(outputDir, stateFile);

  try {
    await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.locator('input[name="email"]').fill(email, { timeout: timeoutMs });
    await page.locator('input[name="password"]').fill(password, { timeout: timeoutMs });
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: timeoutMs }),
      page.locator('button[type="submit"]').click()
    ]);
    await page.context().storageState({ path: statePath });
    return { role, statePath };
  } finally {
    await page.close();
  }
}

async function main() {
  const localEnv = await loadEnvFile();
  const supabaseUrl = envValue(localEnv, "SUPABASE_URL") || envValue(localEnv, "NEXT_PUBLIC_SUPABASE_URL");
  const password = envValue(localEnv, "E2E_TEST_PASSWORD");

  console.log("Marketplace transaction storage state creation");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log("secretValues=not-printed");

  assertLocalBaseUrl(baseUrl);
  assert(isLocalUrl(supabaseUrl), `local Supabase에서만 storage state를 만들 수 있습니다. current=${safeOrigin(supabaseUrl)}`);
  assert(password, "E2E_TEST_PASSWORD가 필요합니다. 먼저 npm run e2e:marketplace-transaction:seed를 같은 비밀번호로 실행하세요.");

  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const created = [];

  try {
    for (const [role, email, stateFile] of roles) {
      created.push(await loginAndSaveStorageState(browser, role, email, stateFile, password));
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
