#!/usr/bin/env node

import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import {
  fetchWithTimeout,
  isLocalUrl,
  loadEnvFile,
  mergedEnv,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
const storageState = process.env.E2E_STORAGE_STATE || "tmp/e2e-auth/local-developer.json";
const timeoutMs = Number(process.env.E2E_READINESS_TIMEOUT_MS || 5000);

const localSupabaseUrl = process.env.LOCAL_SUPABASE_URL || "http://127.0.0.1:54321";
const localDatabaseUrl = process.env.LOCAL_DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for local Supabase E2E.`);
  }
  return value;
}

const localPublishableKey = requiredEnv("LOCAL_SUPABASE_ANON_KEY");
const localSecretKey = requiredEnv("LOCAL_SUPABASE_SERVICE_ROLE_KEY");

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

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const fileEnv = await loadEnvFile();
  const env = mergedEnv(fileEnv, {
    DATABASE_URL: localDatabaseUrl,
    E2E_BASE_URL: baseUrl,
    E2E_STORAGE_STATE: storageState,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: localPublishableKey,
    NEXT_PUBLIC_SUPABASE_URL: localSupabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: localSecretKey,
    SUPABASE_URL: localSupabaseUrl
  });
  const failures = [];

  if (!isLocalUrl(baseUrl)) failures.push(`E2E_BASE_URL must be local. origin=${safeOrigin(baseUrl)}`);
  if (!isLocalUrl(env.SUPABASE_URL)) failures.push(`SUPABASE_URL must be local. origin=${safeOrigin(env.SUPABASE_URL)}`);
  if (!(await fileExists(storageState))) failures.push(`storage state is missing. file=${storageState}`);

  if (isLocalUrl(baseUrl)) {
    const loginReachable = await fetchWithTimeout(new URL("/login", baseUrl).toString(), timeoutMs);
    if (!loginReachable.ok) failures.push("local Next.js /login is not reachable.");
  }

  if (isLocalUrl(env.SUPABASE_URL)) {
    const supabaseReachable = await fetchWithTimeout(new URL("/auth/v1/health", env.SUPABASE_URL).toString(), timeoutMs);
    if (!supabaseReachable.ok) failures.push("local Supabase auth health is not reachable.");
  }

  console.log("Product supplement local E2E runner");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`supabaseOrigin=${safeOrigin(env.SUPABASE_URL)}`);
  console.log(`storageState=${storageState}`);
  console.log("secretValues=not-printed");

  if (failures.length > 0) {
    for (const failure of failures) console.log(`fail ${failure}`);
    process.exitCode = 1;
    return;
  }

  runStep("e2e", "node", ["scripts/e2e_product_supplement_flow.mjs"], env);
  console.log("result=ok");
}

try {
  await main();
} catch (error) {
  console.error("Product supplement local E2E runner failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
