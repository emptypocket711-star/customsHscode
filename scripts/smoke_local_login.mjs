#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.LOCAL_LOGIN_SMOKE_BASE_URL || "http://127.0.0.1:3100";
const accountsFile = process.env.LOCAL_LOGIN_SMOKE_ACCOUNTS_FILE || "tmp/test-accounts.json";
const requestedRole = process.env.LOCAL_LOGIN_SMOKE_ROLE || "shipper";
const timeoutMs = Number(process.env.LOCAL_LOGIN_SMOKE_TIMEOUT_MS || 30000);

const envErrorCopy = "Supabase 환경 변수가 없어 로그인할 수 없습니다.";

function safeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "invalid-url";
  }
}

function isLocalUrl(value) {
  try {
    const host = new URL(value).hostname;
    return ["localhost", "127.0.0.1", "::1"].includes(host);
  } catch {
    return false;
  }
}

function normalizeAccounts(payload) {
  const rawAccounts = Array.isArray(payload.accounts) ? payload.accounts : Object.values(payload.accounts ?? payload);

  return rawAccounts
    .filter((account) => account && typeof account === "object")
    .map((account) => ({
      email: String(account.email ?? ""),
      password: String(account.password ?? payload.password ?? ""),
      role: String(account.role ?? account.type ?? account.key ?? "")
    }))
    .filter((account) => account.email && account.password);
}

async function loadAccounts() {
  const envAccount = {
    email: process.env.LOCAL_LOGIN_SMOKE_EMAIL || "",
    password: process.env.LOCAL_LOGIN_SMOKE_PASSWORD || "",
    role: process.env.LOCAL_LOGIN_SMOKE_ROLE || "env"
  };

  if (envAccount.email && envAccount.password) return [envAccount];

  const content = await readFile(accountsFile, "utf8").catch((error) => {
    throw new Error(
      `로그인 smoke 계정 파일을 읽을 수 없습니다. file=${accountsFile} message=${error instanceof Error ? error.message : "unknown"}`
    );
  });

  const accounts = normalizeAccounts(JSON.parse(content));
  if (accounts.length === 0) {
    throw new Error(`로그인 smoke 계정이 없습니다. file=${accountsFile}`);
  }

  return accounts;
}

function selectAccounts(accounts) {
  if (process.env.LOCAL_LOGIN_SMOKE_ALL === "1") return accounts;

  const matched =
    accounts.find((account) => account.role === requestedRole) ??
    accounts.find((account) => account.email.includes(requestedRole)) ??
    accounts[0];

  return [matched];
}

async function smokeLogin(browser, account) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  try {
    await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.locator('input[name="email"], input[type="email"]').first().fill(account.email, { timeout: timeoutMs });
    await page.locator('input[name="password"], input[type="password"]').first().fill(account.password, {
      timeout: timeoutMs
    });
    await page.locator('button[type="submit"]').first().click({ timeout: timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => {});
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    const bodyText = await page.locator("body").innerText({ timeout: timeoutMs });
    const pathname = new URL(currentUrl).pathname;
    const ok = pathname !== "/login" && !bodyText.includes(envErrorCopy);

    return {
      email: account.email,
      hasEnvError: bodyText.includes(envErrorCopy),
      ok,
      pathname,
      role: account.role || "unknown"
    };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("Local login smoke");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log("secretValues=not-printed");

  if (!isLocalUrl(baseUrl)) {
    throw new Error(`로컬 URL에서만 실행할 수 있습니다. current=${safeOrigin(baseUrl)}`);
  }

  const accounts = selectAccounts(await loadAccounts());
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const account of accounts) {
      results.push(await smokeLogin(browser, account));
    }
  } finally {
    await browser.close();
  }

  for (const result of results) {
    console.log(
      `${result.ok ? "ok" : "fail"} role=${result.role} email=${result.email} path=${result.pathname} envError=${result.hasEnvError}`
    );
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.log("nextAction=Next dev server를 재시작해 .env.local 로딩을 확인하고, 계정 비밀번호가 맞는지 점검합니다.");
    process.exitCode = 1;
    return;
  }

  console.log("result=ready");
}

await main().catch((error) => {
  console.error(`result=fail message=${error instanceof Error ? error.message : "unknown"}`);
  process.exitCode = 1;
});
