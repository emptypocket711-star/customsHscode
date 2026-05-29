#!/usr/bin/env node

const defaultBaseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
let sessionCookie = process.env.SMOKE_COOKIE || "";
const requireAuthenticated = process.env.SMOKE_REQUIRE_AUTHENTICATED === "true";
const loginEmail = process.env.SMOKE_LOGIN_EMAIL || "";
const loginPassword = process.env.SMOKE_LOGIN_PASSWORD || "";

const protectedScenarios = [
  {
    name: "dashboard",
    path: "/dashboard",
    markers: ["HS Finder", "대시보드"]
  },
  {
    name: "hs-import-exact",
    path: "/hs/direct",
    params: {
      direction: "import",
      query: "3304.99-1000",
      destinationCountry: "ALL",
      originCountry: "KOR",
      basisDate: "2026-05-24"
    },
    markers: ["3304", "품목"]
  },
  {
    name: "hs-product-ai",
    path: "/hs/direct",
    params: {
      direction: "import",
      query: "printer black and white",
      destinationCountry: "ALL",
      originCountry: "KOR",
      basisDate: "2026-05-24"
    },
    markers: ["AI", "후보"]
  },
  {
    name: "overseas-hs-china",
    path: "/hs/overseas",
    params: {
      country: "CHN",
      query: "330410",
      basisDate: "2026-05-24"
    },
    markers: ["해외", "HS"]
  },
  {
    name: "duty-estimator",
    path: "/duty-estimator",
    markers: ["예상", "납세"]
  },
  {
    name: "cargo",
    path: "/cargo",
    markers: ["화물", "B/L"]
  },
  {
    name: "used-car-export",
    path: "/used-car-export",
    markers: ["중고차", "수출"]
  },
  {
    name: "container-check",
    path: "/used-car-export/container-check",
    markers: ["컨테이너", "조회"]
  },
  {
    name: "trade-news",
    path: "/trade-news",
    markers: ["뉴스", "무역"]
  }
];

const publicScenarios = [
  {
    name: "login",
    path: "/login",
    markers: ["HS Finder", "로그인"]
  }
];

function buildUrl(baseUrl, scenario) {
  const url = new URL(scenario.path, baseUrl);
  for (const [key, value] of Object.entries(scenario.params ?? {})) {
    url.searchParams.set(key, value);
  }
  return url;
}

function isLoginRedirect(response, body) {
  const location = response.headers.get("location") ?? "";
  return response.status >= 300 && response.status < 400 && location.includes("/login")
    || response.ok && /로그인|Login|HS Finder/.test(body) && !/대시보드|품목 상세|화물통관/.test(body);
}

function hasMarker(body, marker) {
  return body.toLocaleLowerCase("ko-KR").includes(marker.toLocaleLowerCase("ko-KR"));
}

async function sessionCookieFromLogin(baseUrl) {
  if (!loginEmail || !loginPassword) return "";

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error("SMOKE_LOGIN_EMAIL/SMOKE_LOGIN_PASSWORD를 쓰려면 dev dependency playwright가 설치되어 있어야 합니다.");
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const loginUrl = new URL("/login", baseUrl).toString();
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.locator('input[name="email"]').fill(loginEmail, { timeout: timeoutMs });
    await page.locator('input[name="password"]').fill(loginPassword, { timeout: timeoutMs });
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: timeoutMs }),
      page.locator('button[type="submit"]').click()
    ]);

    const cookies = await page.context().cookies(baseUrl);
    return cookies
      .filter((cookie) => cookie.name.startsWith("sb-") || cookie.name === "hs_finder_remember_session")
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
  } finally {
    await browser.close();
  }
}

async function fetchScenario(baseUrl, scenario, protectedRoute) {
  const url = buildUrl(baseUrl, scenario);
  const controller = new AbortController();
  const startedAt = performance.now();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "hsfinder-production-smoke/1.0",
        ...(sessionCookie ? { Cookie: sessionCookie } : {})
      }
    });
    const body = await response.text();
    const durationMs = performance.now() - startedAt;
    const hasMarkers = scenario.markers.every((marker) => hasMarker(body, marker));
    const loginRedirect = protectedRoute && isLoginRedirect(response, body);
    const ok = protectedRoute && !sessionCookie && !requireAuthenticated
      ? loginRedirect
      : response.ok && body.length > 500 && hasMarkers;

    return {
      bodyBytes: body.length,
      durationMs,
      hasMarkers,
      location: response.headers.get("location") ?? "",
      loginRedirect,
      name: scenario.name,
      ok,
      status: response.status,
      url: url.toString()
    };
  } catch (error) {
    return {
      bodyBytes: 0,
      durationMs: performance.now() - startedAt,
      error: error instanceof Error ? error.name : "UnknownError",
      hasMarkers: false,
      location: "",
      loginRedirect: false,
      name: scenario.name,
      ok: false,
      status: 0,
      url: url.toString()
    };
  } finally {
    clearTimeout(timer);
  }
}

function printResult(result) {
  const statusText = result.ok ? "OK" : "FAIL";
  const mode = result.loginRedirect ? "login-guard" : result.hasMarkers ? "content" : "no-marker";
  console.log(`${statusText} ${result.name} status=${result.status} mode=${mode} durationMs=${Math.round(result.durationMs)} bytes=${result.bodyBytes}`);
  if (!result.ok) {
    console.log(`  url=${result.url}`);
    if (result.location) console.log(`  location=${result.location}`);
    if (result.error) console.log(`  error=${result.error}`);
  }
}

async function main() {
  const baseUrl = process.argv[2] || defaultBaseUrl;
  if (!sessionCookie && loginEmail && loginPassword) {
    sessionCookie = await sessionCookieFromLogin(baseUrl);
  }
  const results = [];

  if (!sessionCookie) {
    for (const scenario of publicScenarios) {
      results.push(await fetchScenario(baseUrl, scenario, false));
    }
  }
  for (const scenario of protectedScenarios) {
    results.push(await fetchScenario(baseUrl, scenario, true));
  }

  console.log("HS Finder production smoke");
  console.log(`baseUrl=${baseUrl}`);
  console.log(`timeoutMs=${timeoutMs} authenticated=${Boolean(sessionCookie)} requireAuthenticated=${requireAuthenticated}`);
  for (const result of results) printResult(result);

  const failed = results.filter((result) => !result.ok);
  console.log(`summary total=${results.length} success=${results.length - failed.length} failed=${failed.length}`);
  if (failed.length) process.exitCode = 1;
}

await main();
