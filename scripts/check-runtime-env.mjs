#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");

const groups = [
  {
    title: "Supabase",
    items: [
      ["NEXT_PUBLIC_SUPABASE_URL", true],
      ["NEXT_PUBLIC_SUPABASE_ANON_KEY", true],
      ["SUPABASE_SERVICE_ROLE_KEY", true],
      ["DATABASE_URL", false]
    ]
  },
  {
    title: "AI product search",
    items: [
      ["AI_PROVIDER", true],
      ["OPENAI_API_KEY", true],
      ["OPENAI_MODEL", true],
      ["OPENAI_PRODUCT_SEARCH_TIMEOUT_MS", false],
      ["OPENAI_PRODUCT_SEARCH_WEB_ENABLED", false],
      ["AI_NORMALIZATION_CACHE_TTL_MS", false],
      ["LOOKUP_TELEMETRY_ENABLED", false]
    ]
  },
  {
    title: "Customs OpenAPI",
    items: [
      ["CUSTOMS_API_HS_CODE_SERVICE_KEY", false],
      ["CUSTOMS_API_TARIFF_RATE_SERVICE_KEY", false],
      ["CUSTOMS_API_STATS_CODE_SERVICE_KEY", false],
      ["CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY", false],
      ["CUSTOMS_API_EXCHANGE_RATE_RELAY_URL", false],
      ["CUSTOMS_API_EXCHANGE_RATE_RELAY_TOKEN", false],
      ["CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY", false],
      ["CUSTOMS_API_CARGO_PROGRESS_RELAY_URL", false],
      ["CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN", false],
      ["CUSTOMS_API_SHED_INFO_SERVICE_KEY", false],
      ["CUSTOMS_API_SERVICE_KEY", false],
      ["PUBLIC_DATA_SERVICE_KEY", false]
    ]
  },
  {
    title: "External data and news",
    items: [
      ["KOTRA_OVERSEAS_MARKET_NEWS_SERVICE_KEY", false],
      ["KOTRA_OVERSEAS_MARKET_NEWS_URL", false],
      ["KOTRA_OVERSEAS_MARKET_NEWS_ENDPOINT", false],
      ["PUBLIC_DATA_REQUEST_TIMEOUT_MS", false]
    ]
  },
  {
    title: "Notifications and jobs",
    items: [
      ["RESEND_API_KEY", false],
      ["NOTIFICATION_FROM_EMAIL", false],
      ["JOB_WORKER_SECRET", false],
      ["CRON_SECRET", false],
      ["BACKGROUND_JOBS_ENABLED", false]
    ]
  },
  {
    title: "Traffic controls",
    items: [
      ["RATE_LIMIT_ENABLED", false],
      ["UPSTASH_REDIS_REST_URL", false],
      ["UPSTASH_REDIS_REST_TOKEN", false],
      ["CONTAINER_RECEIPT_RATE_LIMIT_PER_MINUTE", false],
      ["TERMINAL_HELPER_RATE_LIMIT_PER_MINUTE", false],
      ["VEHICLE_SPEC_RATE_LIMIT_PER_MINUTE", false]
    ]
  },
  {
    title: "Vehicle spec and business registration",
    items: [
      ["CYBERTS_REQUEST_TIMEOUT_MS", false],
      ["CYBERTS_VEHICLE_SPEC_CACHE_TTL_MS", false],
      ["BUSINESS_REGISTRATION_STATUS_API_URL", false],
      ["BUSINESS_REGISTRATION_STATUS_SERVICE_KEY", false],
      ["BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED", false],
      ["BUSINESS_REGISTRATION_STATUS_TIMEOUT_MS", false]
    ]
  }
];

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function statusFor(key, required) {
  const configured = Boolean(process.env[key]?.trim());
  if (configured) return "ok";
  return required ? "missing" : "warning";
}

function preview(key) {
  const value = process.env[key]?.trim();
  if (!value) return "미설정";
  if (/KEY|TOKEN|SECRET|PASSWORD|DATABASE_URL/i.test(key)) return "설정됨";
  if (value.length <= 44) return value;
  return `${value.slice(0, 22)}...${value.slice(-10)}`;
}

function collectReport() {
  const items = groups.flatMap((group) => group.items.map(([key, required]) => ({
    group: group.title,
    key,
    required,
    status: statusFor(key, required),
    valuePreview: preview(key)
  })));
  const missingRequired = items.filter((item) => item.status === "missing");
  const optionalMissing = items.filter((item) => item.status === "warning");

  return {
    result: missingRequired.length ? "BLOCKER" : optionalMissing.length ? "WARN" : "OK",
    summary: {
      checked: items.length,
      configured: items.filter((item) => item.status === "ok").length,
      missingRequired: missingRequired.length,
      optionalMissing: optionalMissing.length
    },
    items
  };
}

function printReport(report) {
  console.log("HS Finder Runtime Environment Check");
  console.log("");
  console.log(`Result: ${report.result}`);
  console.log(`Configured: ${report.summary.configured}/${report.summary.checked}`);
  console.log(`Missing required: ${report.summary.missingRequired}`);
  console.log(`Optional missing: ${report.summary.optionalMissing}`);
  console.log("");

  for (const group of groups) {
    const groupItems = report.items.filter((item) => item.group === group.title);
    console.log(`[${group.title}]`);
    for (const item of groupItems) {
      const marker = item.status === "ok" ? "OK" : item.required ? "BLOCKER" : "WARN";
      console.log(`${marker} ${item.key}=${item.valuePreview}`);
    }
    console.log("");
  }
}

loadDotEnv(ENV_PATH);
const asJson = process.argv.includes("--json");
const report = collectReport();

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printReport(report);
}

if (report.summary.missingRequired > 0) process.exitCode = 1;
