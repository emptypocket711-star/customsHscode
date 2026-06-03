#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.LOCAL_REVIEW_BASE_URL || "http://127.0.0.1:3100";
const accountsFile = process.env.LOCAL_LOGIN_SMOKE_ACCOUNTS_FILE || "tmp/test-accounts.json";
const stateDir = process.env.LOCAL_REVIEW_STORAGE_STATE_DIR || "tmp/e2e-auth";
const timeoutMs = Number(process.env.LOCAL_REVIEW_ROUTE_TIMEOUT_MS || 30000);

const passwordLoginRoutes = [
  {
    accountRole: "shipper",
    expectedText: "플랫폼 업무 시작",
    forbiddenText: ["포워더 입찰 확인", "관세사 입찰 확인"],
    path: "/dashboard"
  },
  {
    accountRole: "shipper",
    expectedText: "요청 시작",
    path: "/requests"
  },
  {
    accountRole: "shipper",
    expectedText: "로그인은 정상입니다",
    path: "/requests/freight"
  },
  {
    accountRole: "shipper",
    expectedText: "로그인은 정상입니다",
    path: "/requests/clearance"
  },
  {
    accountRole: "shipper",
    expectedText: "로그인 문제는 아니며",
    path: "/settings/members"
  },
  {
    accountRole: "shipper",
    expectedText: "HS CODE",
    path: "/hs/direct"
  },
  {
    accountRole: "forwarder",
    expectedText: "가입 선택: 포워더",
    forbiddenText: ["관세사 입찰 확인"],
    path: "/dashboard"
  },
  {
    accountRole: "forwarder",
    expectedText: "가입 선택: 포워더",
    path: "/settings/members"
  },
  {
    accountRole: "customs_broker",
    expectedText: "가입 선택: 관세사",
    forbiddenText: ["포워더 입찰 확인"],
    path: "/dashboard"
  },
  {
    accountRole: "customs_broker",
    expectedText: "가입 선택: 관세사",
    path: "/settings/members"
  }
];

const storageStateRoutes = [
  {
    accountRole: "shipper",
    expectedText: "대시보드",
    forbiddenText: ["관세사 입찰 확인"],
    path: "/dashboard"
  },
  {
    accountRole: "shipper",
    expectedText: "요청 시작",
    path: "/requests"
  },
  {
    accountRole: "shipper",
    expectedText: "내 요청 관리",
    path: "/requests/freight?workspace=requester"
  },
  {
    accountRole: "shipper",
    expectedText: "내 요청 관리",
    path: "/requests/clearance?workspace=requester"
  },
  {
    accountRole: "shipper",
    expectedText: "국내 수출입 화주",
    path: "/settings/members"
  },
  {
    accountRole: "shipper",
    expectedText: "HS CODE 조회",
    path: "/hs/direct"
  },
  {
    accountRole: "forwarder",
    expectedText: "입찰 가능 요청",
    forbiddenText: ["운송 견적 시작 흐름", "관세사 입찰"],
    path: "/requests/freight?workspace=forwarder"
  },
  {
    accountRole: "forwarder",
    expectedText: "포워더",
    path: "/settings/members"
  },
  {
    accountRole: "customs_broker",
    expectedText: "관세사 입찰",
    forbiddenText: ["통관 의뢰 시작 흐름", "포워더 입찰"],
    path: "/requests/clearance?workspace=broker"
  },
  {
    accountRole: "customs_broker",
    expectedText: "관세사",
    path: "/settings/members"
  }
];

const storageStateFiles = {
  customs_broker: "marketplace-transaction-broker.json",
  forwarder: "marketplace-transaction-forwarder.json",
  shipper: "marketplace-transaction-requester.json"
};

function safeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "invalid-url";
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadAccounts() {
  const payload = JSON.parse(await readFile(accountsFile, "utf8"));
  const accounts = Array.isArray(payload.accounts) ? payload.accounts : Object.values(payload.accounts ?? payload);
  const normalized = accounts.map((account) => ({
    email: String(account.email ?? ""),
    password: String(account.password ?? ""),
    role: String(account.role ?? "")
  }));

  for (const role of new Set(passwordLoginRoutes.map((route) => route.accountRole))) {
    const account = normalized.find((item) => item.role === role || item.email.includes(role));
    if (!account?.email || !account?.password) {
      throw new Error(`${role} 테스트 계정을 찾을 수 없습니다. file=${accountsFile}`);
    }
  }

  return normalized;
}

async function loadStorageStates() {
  const states = Object.fromEntries(
    Object.entries(storageStateFiles).map(([role, fileName]) => [role, path.join(stateDir, fileName)])
  );

  const missing = [];
  for (const [role, statePath] of Object.entries(states)) {
    if (!(await exists(statePath))) missing.push(`${role}:${statePath}`);
  }

  return missing.length ? null : states;
}

async function login(page, account) {
  await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.locator('input[name="email"], input[type="email"]').first().fill(account.email, { timeout: timeoutMs });
  await page.locator('input[name="password"], input[type="password"]').first().fill(account.password, { timeout: timeoutMs });
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: timeoutMs }),
    page.locator('button[type="submit"]').first().click({ timeout: timeoutMs })
  ]);
}

async function main() {
  const storageStates = await loadStorageStates();
  const routes = storageStates ? storageStateRoutes : passwordLoginRoutes;

  console.log("Local review route bundle");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`accountMode=${storageStates ? "storage-state" : "password-login"}`);
  console.log("secretValues=not-printed");

  const accounts = storageStates ? [] : await loadAccounts();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const role of new Set(routes.map((route) => route.accountRole))) {
      const account = accounts.find((item) => item.role === role || item.email.includes(role));
      const context = storageStates
        ? await browser.newContext({ storageState: storageStates[role], viewport: { width: 1366, height: 900 } })
        : await browser.newContext({ viewport: { width: 1366, height: 900 } });
      const page = await context.newPage();

      try {
        if (!storageStates) await login(page, account);

        for (const route of routes.filter((item) => item.accountRole === role)) {
          await page.goto(new URL(route.path, baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
          await page.waitForTimeout(500);
          const text = await page.locator("body").innerText({ timeout: timeoutMs });
          const ok =
            new URL(page.url()).pathname === new URL(route.path, baseUrl).pathname &&
            text.includes(route.expectedText) &&
            !(route.forbiddenText ?? []).some((forbiddenText) => text.includes(forbiddenText)) &&
            !text.includes("Supabase 환경 변수가 없어 로그인할 수 없습니다.") &&
            !text.includes("데이터베이스가 아직 적용");

          results.push({
            expectedText: route.expectedText,
            ok,
            path: route.path,
            role
          });
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  for (const result of results) {
    console.log(`${result.ok ? "ok" : "fail"} role=${result.role} path=${result.path} expected=${result.expectedText}`);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.log("result=fail");
    process.exitCode = 1;
    return;
  }

  console.log("result=ready");
}

await main().catch((error) => {
  console.error(`result=fail message=${error instanceof Error ? error.message : "unknown"}`);
  process.exitCode = 1;
});
