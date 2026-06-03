#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  fetchWithTimeout,
  isLocalOrAllowedRemoteUrl,
  loadEnvFile,
  mergedEnv,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";

const baseUrl = process.argv[2] || process.env.E2E_BASE_URL;
const timeoutMs = Number(process.env.E2E_READINESS_TIMEOUT_MS || 10000);
const storageStateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth-completion-staging";

process.env.E2E_ALLOW_REMOTE_COMPLETION_PREVIEW = "true";

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
  const env = mergedEnv(fileEnv, {
    E2E_ALLOW_REMOTE_COMPLETION_PREVIEW: "true",
    E2E_BASE_URL: baseUrl,
    E2E_STORAGE_STATE_DIR: storageStateDir
  });
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const failures = [];

  if (!baseUrl) failures.push("E2E_BASE_URL or first URL argument is missing.");
  if (!isLocalOrAllowedRemoteUrl(baseUrl, "COMPLETION_PREVIEW")) failures.push(`E2E_BASE_URL is not allowed. origin=${safeOrigin(baseUrl)}`);
  if (!isLocalOrAllowedRemoteUrl(supabaseUrl, "COMPLETION_PREVIEW")) failures.push(`SUPABASE_URL is not allowed. origin=${safeOrigin(supabaseUrl)}`);
  if (!env.SUPABASE_SERVICE_ROLE_KEY) failures.push("SUPABASE_SERVICE_ROLE_KEY is missing.");
  if (!env.SUPABASE_ANON_KEY && !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) failures.push("SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  if (!env.E2E_TEST_PASSWORD) failures.push("E2E_TEST_PASSWORD is missing.");

  if (baseUrl) {
    const loginReachable = await fetchWithTimeout(new URL("/login", baseUrl).toString(), timeoutMs);
    if (!loginReachable.ok) failures.push(`staging /login is not reachable. status=${loginReachable.status}`);
  }

  console.log("Completion report preview staging E2E runner");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log(`storageStateDir=${storageStateDir}`);
  console.log("secretValues=not-printed");

  if (failures.length > 0) {
    for (const failure of failures) console.log(`fail ${failure}`);
    process.exitCode = 1;
    return;
  }

  runStep("seed", "node", ["scripts/seed_completion_report_preview_fixture.mjs"], env);
  runStep("auth", "node", ["scripts/create_completion_report_preview_storage_states.mjs"], env);
  runStep("preview-e2e", "node", ["scripts/e2e_completion_report_preview_flow.mjs"], env);
  runStep("dual-ack-rpc", "node", ["scripts/e2e_completion_report_dual_ack_rpc.mjs"], env);
  console.log("result=ok");
}

try {
  await main();
} catch (error) {
  console.error("Completion report preview staging E2E runner failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
