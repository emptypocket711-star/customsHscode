#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  fetchWithTimeout,
  isLocalOrAllowedRemoteUrl,
  loadEnvFile,
  mergedEnv,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.argv[2] || process.env.E2E_BASE_URL;
const timeoutMs = Number(process.env.E2E_READINESS_TIMEOUT_MS || 10000);
const storageStateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth-staging";

process.env.E2E_ALLOW_REMOTE_MARKETPLACE_TRANSACTION = "true";

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

function fixtureEnv() {
  return {
    [fixture.envKeys.clearanceBidId]: fixture.bids.clearance.id,
    [fixture.envKeys.clearanceRequestId]: fixture.requests.clearance.id,
    [fixture.envKeys.freightBidId]: fixture.bids.freight.id,
    [fixture.envKeys.freightRequestId]: fixture.requests.freight.id,
    [fixture.mutation.envKeys.clearanceBidId]: fixture.mutation.bids.clearance.id,
    [fixture.mutation.envKeys.clearanceRequestId]: fixture.mutation.requests.clearance.id,
    [fixture.mutation.envKeys.freightBidId]: fixture.mutation.bids.freight.id,
    [fixture.mutation.envKeys.freightRequestId]: fixture.mutation.requests.freight.id,
    [fixture.zeroMatch.envKeys.freightRequestId]: fixture.zeroMatch.requests.freight.id
  };
}

async function main() {
  const fileEnv = await loadEnvFile();
  const env = mergedEnv(fileEnv, {
    E2E_ALLOW_REMOTE_MARKETPLACE_TRANSACTION: "true",
    E2E_BASE_URL: baseUrl,
    E2E_STORAGE_STATE_DIR: storageStateDir,
    ...fixtureEnv()
  });
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const failures = [];

  if (!baseUrl) failures.push("E2E_BASE_URL or first URL argument is missing.");
  if (!isLocalOrAllowedRemoteUrl(baseUrl, "MARKETPLACE_TRANSACTION")) failures.push(`E2E_BASE_URL is not allowed. origin=${safeOrigin(baseUrl)}`);
  if (!isLocalOrAllowedRemoteUrl(supabaseUrl, "MARKETPLACE_TRANSACTION")) failures.push(`SUPABASE_URL is not allowed. origin=${safeOrigin(supabaseUrl)}`);
  if (!env.SUPABASE_SERVICE_ROLE_KEY) failures.push("SUPABASE_SERVICE_ROLE_KEY is missing.");
  if (!env.E2E_TEST_PASSWORD) failures.push("E2E_TEST_PASSWORD is missing.");

  if (baseUrl) {
    const loginReachable = await fetchWithTimeout(new URL("/login", baseUrl).toString(), timeoutMs);
    if (!loginReachable.ok) failures.push(`staging /login is not reachable. status=${loginReachable.status}`);
  }

  console.log("Marketplace transaction staging E2E runner");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log(`storageStateDir=${storageStateDir}`);
  console.log("secretValues=not-printed");

  if (failures.length > 0) {
    for (const failure of failures) console.log(`fail ${failure}`);
    process.exitCode = 1;
    return;
  }

  runStep("seed", "node", ["scripts/seed_marketplace_transaction_fixture.mjs"], env);
  runStep("auth", "node", ["scripts/create_marketplace_transaction_storage_states.mjs"], env);
  runStep("ready", "node", ["scripts/check_marketplace_transaction_e2e_readiness.mjs"], env);
  runStep("e2e", "node", ["scripts/e2e_marketplace_transaction_flow.mjs"], env);
  runStep("mutation-e2e", "node", ["scripts/e2e_marketplace_transaction_mutation_flow.mjs"], env);
  console.log("result=ok");
}

try {
  await main();
} catch (error) {
  console.error("Marketplace transaction staging E2E runner failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
