#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import {
  fetchWithTimeout,
  isLocalOrAllowedRemoteUrl,
  isLocalUrl,
  loadEnvFile,
  mergedEnv,
  safeOrigin,
  vercelProtectionHeaders
} from "./completion_preview_e2e_env.mjs";
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.env.E2E_BASE_URL || process.env.OPERATIONS_BASE_URL || "http://127.0.0.1:3100";
const timeoutMs = Number(process.env.E2E_READINESS_TIMEOUT_MS || 5000);
const rehearsedRequestIds = [
  fixture.mutation.requests.freight.id,
  fixture.mutation.requests.clearance.id
];
const rehearsedBidIds = [
  fixture.mutation.bids.freight.id,
  fixture.mutation.bids.clearance.id
];

function assert(condition, message) {
  if (condition) return;
  throw new Error(message);
}

async function deleteRows(client, table, column, values) {
  const { error } = await client.from(table).delete().in(column, values);
  if (error) throw new Error(`${table} cleanup failed: ${error.message}`);
}

async function prepareNotificationTargets(client) {
  await deleteRows(client, "marketplace_notification_deliveries", "request_id", rehearsedRequestIds);
  await deleteRows(client, "service_bids", "id", rehearsedBidIds);

  const { error: requestError } = await client
    .from("service_requests")
    .update({
      deadline_at: "2026-06-30T00:00:00.000Z",
      status: "open",
      updated_at: "2026-06-01T00:00:00.000Z"
    })
    .in("id", rehearsedRequestIds);

  if (requestError) throw new Error(`service_requests rehearsal reset failed: ${requestError.message}`);

  const { error: matchError } = await client
    .from("service_request_partner_matches")
    .update({
      interest_status: "interested",
      notification_status: "pending",
      notified_at: null
    })
    .in("request_id", rehearsedRequestIds);

  if (matchError) throw new Error(`service_request_partner_matches rehearsal reset failed: ${matchError.message}`);
}

async function cleanupNotificationTargets(client) {
  await deleteRows(client, "marketplace_notification_deliveries", "request_id", rehearsedRequestIds);

  const { error } = await client
    .from("service_request_partner_matches")
    .update({
      notification_status: "pending",
      notified_at: null
    })
    .in("request_id", rehearsedRequestIds);

  if (error) throw new Error(`service_request_partner_matches rehearsal cleanup failed: ${error.message}`);
}

async function fetchJob(pathAndQuery) {
  const workerSecret = process.env.JOB_WORKER_SECRET || process.env.CRON_SECRET;
  const response = await fetch(new URL(pathAndQuery, baseUrl), {
    headers: {
      ...vercelProtectionHeaders(),
      ...(workerSecret ? { "x-job-worker-secret": workerSecret } : {}),
      "User-Agent": "hsfinder-marketplace-notification-rehearsal/1.0"
    }
  });
  const body = await response.json().catch(() => null);

  return {
    body,
    ok: response.ok,
    status: response.status
  };
}

function printResult(label, result) {
  console.log(`${label}Status=${result.status}`);
  console.log(`${label}Body=${JSON.stringify(result.body)}`);
}

async function main() {
  const fileEnv = await loadEnvFile();
  const env = mergedEnv(fileEnv);
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const workerSecret = env.JOB_WORKER_SECRET || env.CRON_SECRET;
  const failures = [];

  if (!isLocalOrAllowedRemoteUrl(baseUrl, "MARKETPLACE_NOTIFICATION_WORKER")) failures.push(`E2E_BASE_URL/OPERATIONS_BASE_URL must be local or allowed remote. origin=${safeOrigin(baseUrl)}`);
  if (!isLocalOrAllowedRemoteUrl(supabaseUrl, "MARKETPLACE_NOTIFICATION_WORKER")) failures.push(`SUPABASE_URL must be local or allowed remote. origin=${safeOrigin(supabaseUrl)}`);
  if (!serviceRoleKey) failures.push("SUPABASE_SERVICE_ROLE_KEY is missing.");
  if (!isLocalUrl(baseUrl) && !workerSecret) failures.push("JOB_WORKER_SECRET or CRON_SECRET is missing for remote rehearsal.");

  if (isLocalOrAllowedRemoteUrl(baseUrl, "MARKETPLACE_NOTIFICATION_WORKER")) {
    const loginReachable = await fetchWithTimeout(new URL("/login", baseUrl).toString(), timeoutMs);
    if (!loginReachable.ok) failures.push("Next.js /login is not reachable.");
  }

  console.log("Marketplace notification local rehearsal");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log("secretValues=not-printed");

  if (failures.length > 0) {
    for (const failure of failures) console.log(`fail ${failure}`);
    process.exitCode = 1;
    return;
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  await prepareNotificationTargets(client);

  try {
    const dryRun = await fetchJob("/api/jobs/marketplace-notifications?dryRun=1&limit=20");
    printResult("dryRun", dryRun);
    assert(dryRun.ok, "dryRun route failed.");
    assert(dryRun.body?.targetCount >= 2, `dryRun targetCount is too low. targetCount=${dryRun.body?.targetCount}`);
    assert(dryRun.body?.claimedCount === 0, "dryRun should not claim deliveries.");

    const blockedSend = await fetchJob("/api/jobs/marketplace-notifications?dryRun=1&send=1&limit=20");
    printResult("blockedSend", blockedSend);
    assert(blockedSend.status === 400, "send=1 should be blocked when send readiness is disabled.");
    assert(blockedSend.body?.sendReadiness?.ready === false, "blocked send should include readiness=false.");

    const claimOnly = await fetchJob("/api/jobs/marketplace-notifications?limit=20");
    printResult("claimOnly", claimOnly);
    assert(claimOnly.ok, "claim-only route failed.");
    assert(claimOnly.body?.claimedCount >= 2, `claim-only claimedCount is too low. claimedCount=${claimOnly.body?.claimedCount}`);
    assert(claimOnly.body?.claimedWithoutSenderCount >= 2, "claim-only should report claimedWithoutSenderCount.");
    assert(claimOnly.body?.sentCount === 0, "claim-only rehearsal must not mark external sends.");

    console.log("result=ok");
  } finally {
    await cleanupNotificationTargets(client);
  }
}

try {
  await main();
} catch (error) {
  console.error("Marketplace notification local rehearsal failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
