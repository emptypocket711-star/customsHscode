#!/usr/bin/env node

import { access } from "node:fs/promises";
import path from "node:path";
import {
  envValue,
  fetchWithTimeout,
  isLocalUrl,
  loadEnvFile,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const stateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";
const timeoutMs = Number(process.env.E2E_READINESS_TIMEOUT_MS || 5000);
const partnerStateFile = "marketplace-notification-partner.json";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function addCheck(checks, name, ok, message) {
  checks.push({ message, name, ok });
}

async function main() {
  const localEnv = await loadEnvFile();
  const checks = [];
  const supabaseUrl = envValue(localEnv, "SUPABASE_URL") || envValue(localEnv, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = envValue(localEnv, "SUPABASE_SERVICE_ROLE_KEY");
  const requestId = envValue(localEnv, "E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID");
  const deliveryId = envValue(localEnv, "E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID");
  const partnerStatePath = path.join(stateDir, partnerStateFile);

  addCheck(checks, ".env.local", localEnv.exists, localEnv.exists ? "found" : "missing");
  addCheck(checks, "E2E_BASE_URL local", isLocalUrl(baseUrl), `origin=${safeOrigin(baseUrl) || "missing"}`);
  addCheck(checks, "SUPABASE_URL local", isLocalUrl(supabaseUrl), `origin=${safeOrigin(supabaseUrl) || "missing"}`);
  addCheck(checks, "SUPABASE_SERVICE_ROLE_KEY present", Boolean(serviceRoleKey), serviceRoleKey ? "present" : "missing");
  addCheck(checks, "E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID present", Boolean(requestId), requestId ? "present" : "missing");
  addCheck(checks, "E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID present", Boolean(deliveryId), deliveryId ? "present" : "missing");
  addCheck(checks, `storage state ${partnerStateFile}`, await exists(partnerStatePath), partnerStatePath);

  if (isLocalUrl(baseUrl)) {
    const loginUrl = new URL("/login", baseUrl).toString();
    const login = await fetchWithTimeout(loginUrl, timeoutMs);
    addCheck(checks, "Next.js local login reachable", login.ok, `status=${login.status}`);
  } else {
    addCheck(checks, "Next.js local login reachable", false, "skipped: non-local base URL");
  }

  if (isLocalUrl(supabaseUrl)) {
    const authHealthUrl = new URL("/auth/v1/health", supabaseUrl).toString();
    const authHealth = await fetchWithTimeout(authHealthUrl, timeoutMs);
    addCheck(checks, "Supabase local auth reachable", authHealth.ok, `status=${authHealth.status}`);
  } else {
    addCheck(checks, "Supabase local auth reachable", false, "skipped: missing or non-local Supabase URL");
  }

  const failed = checks.filter((check) => !check.ok);

  console.log("Marketplace notification dashboard local E2E readiness");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl) || "missing"}`);
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl) || "missing"}`);
  console.log("secretValues=not-printed");

  for (const check of checks) {
    console.log(`${check.ok ? "ok" : "fail"} ${check.name} ${check.message}`);
  }

  if (failed.length > 0) {
    console.log("nextCommands=");
    console.log("1. local Supabase와 Next.js 서버를 켠다.");
    console.log("2. 로컬 fixture로 파트너 계정, 요청, in_app delivery를 만든다.");
    console.log(`3. ${partnerStateFile} storage state를 ${stateDir}에 생성한다.`);
    console.log("4. E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID, E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID를 설정한다.");
    console.log("5. npm run e2e:marketplace-notification");
    process.exitCode = 1;
    return;
  }

  console.log("result=ready");
}

await main();
