#!/usr/bin/env node

import fs from "node:fs";
import { chromium } from "playwright";
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000";
const accountsFile = process.env.OPERATIONS_GUARD_ACCOUNTS_FILE || "tmp/test-accounts.json";
const accountSource = process.env.OPERATIONS_GUARD_ACCOUNT_SOURCE || "file";
const guardRoles = (process.env.OPERATIONS_GUARD_ROLES || "forwarder,customs_broker,shipper")
  .split(",")
  .map((role) => role.trim())
  .filter(Boolean);
const fixturePassword = process.env.OPERATIONS_GUARD_FIXTURE_PASSWORD || process.env.E2E_TEST_PASSWORD || "";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 30000);
const protectionBypassSecret =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
  process.env.VERCEL_PROTECTION_BYPASS_SECRET ||
  "";

const operationsRoutes = [
  {
    deniedMarkers: ["운영 화면은 지정된 개발자"],
    forbiddenMarkers: ["운영 관리 홈", "플랫폼 요청 운영 상태", "사용자 상세 관리"],
    path: "/operations/users"
  },
  {
    deniedMarkers: ["운영 화면은 지정된 개발자"],
    forbiddenMarkers: ["운영 점검", "운영 DB 스키마 점검", "수동 운영 명령"],
    path: "/operations/health"
  },
  {
    deniedMarkers: ["운영 화면은 지정된 개발자"],
    forbiddenMarkers: ["공지 관리", "대시보드 공지", "접속 팝업"],
    path: "/operations/notices"
  }
];

function readAccounts(filePath) {
  if (accountSource === "marketplace_fixture") {
    if (!fixturePassword) throw new Error("OPERATIONS_GUARD_ACCOUNT_SOURCE=marketplace_fixture requires E2E_TEST_PASSWORD or OPERATIONS_GUARD_FIXTURE_PASSWORD.");

    return [
      { email: fixture.users.forwarder.email, password: fixturePassword, role: "forwarder" },
      { email: fixture.users.broker.email, password: fixturePassword, role: "customs_broker" },
      { email: fixture.users.requester.email, password: fixturePassword, role: "shipper" }
    ];
  }

  if (!fs.existsSync(filePath)) throw new Error(`accounts file not found: ${filePath}`);

  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const accounts = Array.isArray(payload.accounts) ? payload.accounts : Object.values(payload.accounts || {});
  return accounts.filter((account) => account.email && account.password);
}

async function login(page, account) {
  await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.locator('input[name="email"]').fill(account.email, { timeout: timeoutMs });
  await page.locator('input[name="password"]').fill(account.password, { timeout: timeoutMs });
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: timeoutMs }),
    page.locator('button[type="submit"]').click()
  ]);
}

function includesAny(body, markers) {
  return markers.some((marker) => body.includes(marker));
}

async function main() {
  const usableAccounts = readAccounts(accountsFile);
  if (!usableAccounts.length) throw new Error(`no usable accounts in ${accountsFile}`);

  const accounts = usableAccounts.filter((account) => guardRoles.includes(account.role || ""));
  const checkedRoles = Array.from(new Set(accounts.map((account) => account.role || "unknown")));
  const missingRoles = guardRoles.filter((role) => !checkedRoles.includes(role));
  if (missingRoles.length) {
    throw new Error(`operations guard accounts missing required roles: ${missingRoles.join(", ")}`);
  }

  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const results = [];

  try {
    for (const account of accounts) {
      const page = await browser.newPage({
        extraHTTPHeaders: protectionBypassSecret
          ? { "x-vercel-protection-bypass": protectionBypassSecret }
          : undefined
      });

      try {
        await login(page, account);
        for (const route of operationsRoutes) {
          await page.goto(new URL(route.path, baseUrl).toString(), { waitUntil: "networkidle", timeout: timeoutMs });
          const body = await page.locator("body").innerText({ timeout: timeoutMs });
          const denied = includesAny(body, route.deniedMarkers);
          const leaked = includesAny(body, route.forbiddenMarkers);
          results.push({
            denied,
            email: account.email,
            leaked,
            path: route.path,
            role: account.role || "unknown"
          });
          if (!denied || leaked) {
            failures.push(`${account.email} ${route.path} denied=${denied} leaked=${leaked}`);
          }
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log("HS Finder operations route guard");
  console.log(`baseUrl=${baseUrl}`);
  console.log(`accountsFile=${accountsFile}`);
  console.log(`accountSource=${accountSource}`);
  console.log(`accounts=${accounts.length}`);
  console.log(`usableAccounts=${usableAccounts.length}`);
  console.log(`ignoredAccounts=${usableAccounts.length - accounts.length}`);
  console.log(`requiredRoles=${guardRoles.join(",")}`);
  console.log(`checkedRoles=${checkedRoles.join(",")}`);
  console.log(`routes=${operationsRoutes.length}`);
  console.log(`vercelProtectionBypass=${Boolean(protectionBypassSecret)}`);
  for (const result of results) {
    console.log(`${result.denied && !result.leaked ? "OK" : "FAIL"} ${result.role} ${result.path} denied=${result.denied} leaked=${result.leaked}`);
  }
  console.log(`summary total=${results.length} failed=${failures.length}`);

  if (failures.length) {
    for (const failure of failures) console.log(`  ${failure}`);
    process.exitCode = 1;
  }
}

await main();
