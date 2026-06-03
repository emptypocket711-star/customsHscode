#!/usr/bin/env node

import { chromium } from "playwright";
import {
  isLocalOrAllowedRemoteUrl,
  playwrightContextOptions,
  remoteE2ERequirement,
  safeOrigin,
  vercelProtectionHeaders
} from "./completion_preview_e2e_env.mjs";
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const scope = "MARKETPLACE_TRANSACTION";
const baseUrl = process.argv[2] || process.env.MARKETPLACE_ROUTE_PERF_BASE_URL || process.env.E2E_BASE_URL || "http://localhost:3100";
const timeoutMs = Number(process.env.MARKETPLACE_ROUTE_PERF_TIMEOUT_MS || 30000);
const budgetMs = Number(process.env.MARKETPLACE_ROUTE_PERF_BUDGET_MS || 8000);
const requesterEmail = process.env.SMOKE_LOGIN_EMAIL || fixture.users.requester.email;
const requesterPassword = process.env.SMOKE_LOGIN_PASSWORD || process.env.E2E_TEST_PASSWORD || "";
const developerEmail = process.env.SMOKE_OPERATIONS_EMAIL || process.env.OPERATIONS_DEVELOPER_EMAIL || "emptypocket711@gmail.com";
const developerPassword =
  process.env.SMOKE_OPERATIONS_PASSWORD ||
  process.env.OPERATIONS_DEVELOPER_PASSWORD ||
  process.env.E2E_TEST_PASSWORD ||
  "";

const scenarios = [
  {
    markers: ["대시보드", "요청"],
    name: "requester-dashboard",
    path: "/dashboard",
    role: "requester"
  },
  {
    markers: ["요청 시작", "운송 견적 요청", "통관 의뢰 요청"],
    name: "requests-hub",
    path: "/requests",
    role: "requester"
  },
  {
    markers: ["운송 견적 요청", fixture.requests.freight.title],
    name: "requester-freight-list",
    path: "/requests/freight",
    role: "requester"
  },
  {
    markers: ["통관 의뢰 요청", fixture.requests.clearance.title],
    name: "requester-clearance-list",
    path: "/requests/clearance",
    role: "requester"
  },
  {
    markers: ["플랫폼 요청 운영 상세", "파트너 노출·알림 운영 요약"],
    name: "operations-zero-match-detail",
    path: `/operations/requests/${fixture.zeroMatch.requests.freight.id}`,
    role: "developer"
  }
];

function assert(condition, message, details = {}) {
  if (condition) return;

  const error = new Error(message);
  error.details = details;
  throw error;
}

function hasMarker(body, marker) {
  return body.toLocaleLowerCase("ko-KR").includes(marker.toLocaleLowerCase("ko-KR"));
}

async function sessionCookieFromLogin(browser, email, password) {
  assert(email && password, `로그인 계정 정보가 없습니다. emailPresent=${Boolean(email)} passwordPresent=${Boolean(password)}`);

  const context = await browser.newContext(playwrightContextOptions({ viewport: { width: 1366, height: 900 } }));
  const page = await context.newPage();

  try {
    await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.locator('input[name="email"]').fill(email, { timeout: timeoutMs });
    await page.locator('input[name="password"]').fill(password, { timeout: timeoutMs });
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: timeoutMs }),
      page.locator('button[type="submit"]').click()
    ]);

    const cookies = await context.cookies(baseUrl);
    return cookies
      .filter((cookie) => cookie.name.startsWith("sb-") || cookie.name === "hs_finder_remember_session")
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
  } finally {
    await context.close();
  }
}

async function measureScenario(scenario, cookiesByRole) {
  const url = new URL(scenario.path, baseUrl);
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Cookie: cookiesByRole[scenario.role],
        "User-Agent": "hsfinder-marketplace-route-performance/1.0",
        ...vercelProtectionHeaders()
      },
      signal: controller.signal
    });
    const body = await response.text();
    const durationMs = performance.now() - startedAt;
    const missingMarkers = scenario.markers.filter((marker) => !hasMarker(body, marker));

    return {
      ...scenario,
      bodyBytes: body.length,
      durationMs,
      ok: response.ok && missingMarkers.length === 0 && durationMs <= budgetMs,
      reason: !response.ok
        ? `status=${response.status}`
        : missingMarkers.length > 0
          ? `missingMarkers=${missingMarkers.join(",")}`
          : durationMs > budgetMs
            ? `durationBudgetExceeded=${Math.round(durationMs)}ms>${budgetMs}ms`
            : `status=${response.status}`
    };
  } catch (error) {
    return {
      ...scenario,
      bodyBytes: 0,
      durationMs: performance.now() - startedAt,
      ok: false,
      reason: error instanceof Error ? error.name : "fetch-error"
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log("Marketplace route performance smoke");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`timeoutMs=${timeoutMs} budgetMs=${budgetMs}`);
  console.log("secretValues=not-printed");

  assert(
    isLocalOrAllowedRemoteUrl(baseUrl, scope),
    `local 또는 명시적으로 허용된 remote base URL에서만 실행할 수 있습니다. current=${safeOrigin(baseUrl)}. ${remoteE2ERequirement(scope)}`
  );

  const browser = await chromium.launch({ headless: true });
  const cookiesByRole = {};

  try {
    cookiesByRole.requester = await sessionCookieFromLogin(browser, requesterEmail, requesterPassword);
    cookiesByRole.developer = await sessionCookieFromLogin(browser, developerEmail, developerPassword);
  } finally {
    await browser.close();
  }

  const results = [];
  for (const scenario of scenarios) {
    results.push(await measureScenario(scenario, cookiesByRole));
  }

  for (const result of results) {
    console.log(`${result.ok ? "ok" : "fail"} ${result.name} role=${result.role} durationMs=${Math.round(result.durationMs)} bytes=${result.bodyBytes ?? 0} reason=${JSON.stringify(result.reason)}`);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.log(`result=fail failed=${failed.length}`);
    process.exitCode = 1;
    return;
  }

  const maxDuration = Math.round(Math.max(...results.map((result) => result.durationMs)));
  console.log(`result=ok routes=${results.length} maxDurationMs=${maxDuration}`);
}

try {
  await main();
} catch (error) {
  console.error("Marketplace route performance smoke failed");
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  if (error instanceof Error && "details" in error) {
    console.error(`details=${JSON.stringify(error.details)}`);
  }
  process.exitCode = 1;
}
