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
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const stateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";
const timeoutMs = Number(process.env.E2E_READINESS_TIMEOUT_MS || 5000);

const stateFiles = Object.values(fixture.storageStates);
const developerStateFile = process.env.E2E_MARKETPLACE_DEVELOPER_STATE_FILE || "local-developer.json";
const fixtureEnvKeys = [
  ...Object.values(fixture.envKeys),
  ...Object.values(fixture.zeroMatch.envKeys)
];

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
  const testPassword = envValue(localEnv, "E2E_TEST_PASSWORD");

  addCheck(checks, ".env.local", localEnv.exists, localEnv.exists ? "found" : "missing");
  addCheck(checks, "E2E_BASE_URL local-or-allowed-remote", isLocalOrAllowedRemoteUrl(baseUrl, "MARKETPLACE_TRANSACTION"), `origin=${safeOrigin(baseUrl) || "missing"}`);
  addCheck(checks, "SUPABASE_URL local-or-allowed-remote", isLocalOrAllowedRemoteUrl(supabaseUrl, "MARKETPLACE_TRANSACTION"), `origin=${safeOrigin(supabaseUrl) || "missing"}`);
  addCheck(checks, "SUPABASE_SERVICE_ROLE_KEY present", Boolean(serviceRoleKey), serviceRoleKey ? "present" : "missing");
  addCheck(checks, "E2E_TEST_PASSWORD present", Boolean(testPassword), testPassword ? "present" : "missing");

  for (const key of fixtureEnvKeys) {
    const value = envValue(localEnv, key);
    addCheck(checks, `${key} present`, Boolean(value), value ? "present" : "missing");
  }

  for (const stateFile of [...stateFiles, developerStateFile]) {
    const statePath = path.join(stateDir, stateFile);
    addCheck(checks, `storage state ${stateFile}`, await exists(statePath), statePath);
  }

  if (isLocalOrAllowedRemoteUrl(baseUrl, "MARKETPLACE_TRANSACTION")) {
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
  } else if (isLocalOrAllowedRemoteUrl(supabaseUrl, "MARKETPLACE_TRANSACTION")) {
    addCheck(checks, "Supabase local auth reachable", true, "skipped: allowed remote Supabase");
  } else {
    addCheck(checks, "Supabase local auth reachable", false, "skipped: missing or non-local Supabase URL");
  }

  const failed = checks.filter((check) => !check.ok);

  console.log("Marketplace transaction local E2E readiness");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl) || "missing"}`);
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl) || "missing"}`);
  console.log("secretValues=not-printed");

  for (const check of checks) {
    console.log(`${check.ok ? "ok" : "fail"} ${check.name} ${check.message}`);
  }

  if (failed.length > 0) {
    console.log("nextCommands=");
    console.log("1. local 실행이면 Supabase와 Next.js 서버를 켠다. Preview 실행이면 E2E_ALLOW_REMOTE_MARKETPLACE_TRANSACTION=true와 Vercel bypass secret을 설정한다.");
    console.log("2. E2E_TEST_PASSWORD를 설정하고 npm run e2e:marketplace-transaction:seed를 실행한다.");
    console.log("3. seed 출력의 E2E_MARKETPLACE_* export 힌트를 env에 설정한다.");
    console.log(`4. npm run e2e:marketplace-transaction:auth로 role별 storage state를 ${stateDir}에 생성한다.`);
    console.log("5. npm run e2e:marketplace-transaction:ready로 준비 상태를 재확인한다.");
    console.log("6. npm run e2e:marketplace-transaction");
    process.exitCode = 1;
    return;
  }

  console.log("result=ready");
}

await main();
