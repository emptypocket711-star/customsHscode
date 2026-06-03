#!/usr/bin/env node

import { access } from "node:fs/promises";
import path from "node:path";
import {
  envValue,
  fetchWithTimeout,
  isLocalOrAllowedRemoteUrl,
  isLocalUrl,
  loadEnvFile,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const stateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";
const timeoutMs = Number(process.env.E2E_READINESS_TIMEOUT_MS || 5000);
const partnerStateFile = process.env.E2E_MARKETPLACE_NOTIFICATION_PARTNER_STATE_FILE || "marketplace-notification-partner.json";

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
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    envValue(localEnv, "SUPABASE_URL") ||
    envValue(localEnv, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envValue(localEnv, "SUPABASE_SERVICE_ROLE_KEY");
  const requestId = process.env.E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID || envValue(localEnv, "E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID");
  const deliveryId = process.env.E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID || envValue(localEnv, "E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID");
  const partnerStatePath = path.join(stateDir, partnerStateFile);

  addCheck(checks, ".env.local", localEnv.exists, localEnv.exists ? "found" : "missing");
  addCheck(checks, "E2E_BASE_URL local-or-allowed-remote", isLocalOrAllowedRemoteUrl(baseUrl, "MARKETPLACE_NOTIFICATION"), `origin=${safeOrigin(baseUrl) || "missing"}`);
  addCheck(checks, "SUPABASE_URL local-or-allowed-remote", isLocalOrAllowedRemoteUrl(supabaseUrl, "MARKETPLACE_NOTIFICATION"), `origin=${safeOrigin(supabaseUrl) || "missing"}`);
  addCheck(checks, "SUPABASE_SERVICE_ROLE_KEY present", Boolean(serviceRoleKey), serviceRoleKey ? "present" : "missing");
  addCheck(checks, "E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID present", Boolean(requestId), requestId ? "present" : "missing");
  addCheck(checks, "E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID present", Boolean(deliveryId), deliveryId ? "present" : "missing");
  addCheck(checks, `storage state ${partnerStateFile}`, await exists(partnerStatePath), partnerStatePath);

  if (isLocalOrAllowedRemoteUrl(baseUrl, "MARKETPLACE_NOTIFICATION")) {
    const loginUrl = new URL("/login", baseUrl).toString();
    const login = await fetchWithTimeout(loginUrl, timeoutMs);
    addCheck(checks, "Next.js login reachable", login.ok, `status=${login.status}`);
  } else {
    addCheck(checks, "Next.js login reachable", false, "skipped: base URL is neither local nor allowed remote");
  }

  if (isLocalUrl(supabaseUrl)) {
    const authHealthUrl = new URL("/auth/v1/health", supabaseUrl).toString();
    const authHealth = await fetchWithTimeout(authHealthUrl, timeoutMs);
    addCheck(checks, "Supabase local auth reachable", authHealth.ok, `status=${authHealth.status}`);
  } else if (isLocalOrAllowedRemoteUrl(supabaseUrl, "MARKETPLACE_NOTIFICATION")) {
    addCheck(checks, "Supabase local auth reachable", true, "skipped: allowed remote Supabase");
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
    console.log("1. local 실행이면 Supabase와 Next.js 서버를 켠다. Preview 실행이면 E2E_ALLOW_REMOTE_MARKETPLACE_NOTIFICATION=true와 Vercel bypass secret을 설정한다.");
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
