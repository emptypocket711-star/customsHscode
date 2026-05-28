#!/usr/bin/env node

const defaultBaseUrl = process.env.LOAD_TEST_BASE_URL || "http://localhost:3000";
const totalRequests = Number(process.env.LOAD_TEST_REQUESTS || 80);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 8);
const timeoutMs = Number(process.env.LOAD_TEST_TIMEOUT_MS || 15000);
const p95BudgetMs = Number(process.env.LOAD_TEST_P95_BUDGET_MS || 10000);
const sessionCookie = process.env.LOAD_TEST_COOKIE || "";
const semanticMarkers = ["HS FINDER", "통합 조회", "해외 HS CODE", "조회"];

const scenarios = [
  {
    name: "import-hsk-exact",
    path: "/hs/direct",
    params: {
      direction: "import",
      query: "3304.99-1000",
      destinationCountry: "ALL",
      originCountry: "KOR",
      basisDate: "2026-05-24"
    }
  },
  {
    name: "import-product-ai-cache",
    path: "/hs/direct",
    params: {
      direction: "import",
      query: "printer black and white",
      destinationCountry: "ALL",
      originCountry: "KOR",
      basisDate: "2026-05-24"
    }
  },
  {
    name: "export-destination-china",
    path: "/hs/direct",
    params: {
      direction: "export",
      destinationCountry: "CHN",
      originCountry: "KOR",
      query: "3304101000",
      basisDate: "2026-05-24"
    }
  },
  {
    name: "overseas-china",
    path: "/hs/overseas",
    params: {
      country: "CHN",
      query: "330410",
      basisDate: "2026-05-24"
    }
  }
];

function buildUrl(baseUrl, scenario) {
  const url = new URL(scenario.path, baseUrl);
  for (const [key, value] of Object.entries(scenario.params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index];
}

async function requestOnce(baseUrl, index) {
  const scenario = scenarios[index % scenarios.length];
  const url = buildUrl(baseUrl, scenario);
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "customs-ai-lookup-load-test/1.0",
        ...(sessionCookie ? { Cookie: sessionCookie } : {})
      }
    });
    const body = await response.text();
    const redirected = response.status >= 300 && response.status < 400;
    const hasSemanticMarker = semanticMarkers.some((marker) => body.includes(marker));
    return {
      scenario: scenario.name,
      status: response.status,
      ok: response.ok && body.length > 1000 && hasSemanticMarker,
      durationMs: performance.now() - startedAt,
      bytes: body.length,
      redirected,
      location: response.headers.get("location") ?? "",
      missingMarker: response.ok && !hasSemanticMarker
    };
  } catch (error) {
    return {
      scenario: scenario.name,
      status: 0,
      ok: false,
      durationMs: performance.now() - startedAt,
      bytes: 0,
      error: error instanceof Error ? error.name : "UnknownError"
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool(baseUrl) {
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < totalRequests) {
      const index = nextIndex;
      nextIndex += 1;
      results.push(await requestOnce(baseUrl, index));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker()));
  return results;
}

function printSummary(results) {
  const durations = results.map((result) => result.durationMs);
  const failed = results.filter((result) => !result.ok);
  const byScenario = new Map();

  for (const result of results) {
    const bucket = byScenario.get(result.scenario) ?? [];
    bucket.push(result);
    byScenario.set(result.scenario, bucket);
  }

  console.log(`lookup load test`);
  console.log(`requests=${results.length} concurrency=${concurrency} timeoutMs=${timeoutMs} p95BudgetMs=${p95BudgetMs}`);
  console.log(`success=${results.length - failed.length} failed=${failed.length}`);
  console.log(`latency_ms min=${Math.round(Math.min(...durations))} p50=${Math.round(percentile(durations, 0.5))} p95=${Math.round(percentile(durations, 0.95))} p99=${Math.round(percentile(durations, 0.99))} max=${Math.round(Math.max(...durations))}`);

  let exceededBudget = false;
  for (const [scenario, items] of byScenario.entries()) {
    const scenarioDurations = items.map((item) => item.durationMs);
    const scenarioFailures = items.filter((item) => !item.ok);
    const scenarioP95 = Math.round(percentile(scenarioDurations, 0.95));
    if (scenarioP95 > p95BudgetMs) exceededBudget = true;
    console.log(`${scenario}: requests=${items.length} failed=${scenarioFailures.length} p95=${scenarioP95}ms`);
  }

  if (failed.length || exceededBudget) {
    if (exceededBudget) {
      console.log(`latency budget exceeded: scenario p95 must be <= ${p95BudgetMs}ms`);
    }
    console.log("failed samples:");
    for (const result of failed.slice(0, 8)) {
      console.log(`${result.scenario} status=${result.status} durationMs=${Math.round(result.durationMs)} redirected=${result.redirected ?? false} location=${result.location ?? ""} missingMarker=${result.missingMarker ?? false} error=${result.error ?? ""}`);
    }
    process.exitCode = 1;
  }
}

const baseUrl = process.argv[2] || defaultBaseUrl;
const results = await runPool(baseUrl);
printSummary(results);
