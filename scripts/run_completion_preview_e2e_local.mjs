#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  fetchWithTimeout,
  isLocalUrl,
  loadEnvFile,
  mergedEnv,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const timeoutMs = Number(process.env.E2E_READINESS_TIMEOUT_MS || 5000);

function runStep(label, command, args, env) {
  console.log(`step=${label}`);
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed`);
  }
}

async function main() {
  const fileEnv = await loadEnvFile();
  const env = mergedEnv(fileEnv, { E2E_BASE_URL: baseUrl });
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const failures = [];

  if (!isLocalUrl(baseUrl)) failures.push(`E2E_BASE_URL must be local. origin=${safeOrigin(baseUrl)}`);
  if (!isLocalUrl(supabaseUrl)) failures.push(`SUPABASE_URL must be local. origin=${safeOrigin(supabaseUrl)}`);
  if (!env.SUPABASE_SERVICE_ROLE_KEY) failures.push("SUPABASE_SERVICE_ROLE_KEY is missing.");
  if (!env.E2E_TEST_PASSWORD) failures.push("E2E_TEST_PASSWORD is missing.");

  if (isLocalUrl(baseUrl)) {
    const loginReachable = await fetchWithTimeout(new URL("/login", baseUrl).toString(), timeoutMs);
    if (!loginReachable.ok) failures.push("local Next.js /login is not reachable.");
  }

  if (isLocalUrl(supabaseUrl)) {
    const supabaseReachable = await fetchWithTimeout(new URL("/auth/v1/health", supabaseUrl).toString(), timeoutMs);
    if (!supabaseReachable.ok) failures.push("local Supabase auth health is not reachable.");
  }

  console.log("Completion report preview local E2E runner");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log("secretValues=not-printed");

  if (failures.length > 0) {
    for (const failure of failures) console.log(`fail ${failure}`);
    process.exitCode = 1;
    return;
  }

  runStep("seed", "node", ["scripts/seed_completion_report_preview_fixture.mjs"], env);
  runStep("auth", "node", ["scripts/create_completion_report_preview_storage_states.mjs"], env);
  runStep("e2e", "node", ["scripts/e2e_completion_report_preview_flow.mjs"], env);
  console.log("result=ok");
}

try {
  await main();
} catch (error) {
  console.error("Completion report preview local E2E runner failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
