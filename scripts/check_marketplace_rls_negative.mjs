#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import {
  envValue,
  isLocalOrAllowedRemoteUrl,
  loadEnvFile,
  remoteE2ERequirement,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const scope = "MARKETPLACE_RLS_NEGATIVE";

function assert(condition, message, details = {}) {
  if (condition) return;

  const error = new Error(message);
  error.details = details;
  throw error;
}

function blockedByRls(result) {
  if (result.error) return true;
  if (Array.isArray(result.data)) return result.data.length === 0;
  return result.data === null || result.data === undefined;
}

async function signedClient({ anonKey, email, password, supabaseUrl }) {
  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`);
  return client;
}

async function cleanupUnexpectedPreferenceRows(serviceRoleClient) {
  await serviceRoleClient
    .from("partner_service_preferences")
    .delete()
    .eq("company_id", fixture.companies.forwarder.id)
    .eq("service_type", "clearance");

  await serviceRoleClient
    .from("partner_service_preferences")
    .delete()
    .eq("company_id", fixture.companies.broker.id)
    .eq("service_type", "freight");
}

async function runNegativeChecks({ anonKey, serviceRoleKey, supabaseUrl, testPassword }) {
  const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  await cleanupUnexpectedPreferenceRows(serviceRoleClient);

  const requester = await signedClient({
    anonKey,
    email: fixture.users.requester.email,
    password: testPassword,
    supabaseUrl
  });
  const forwarder = await signedClient({
    anonKey,
    email: fixture.users.forwarder.email,
    password: testPassword,
    supabaseUrl
  });
  const broker = await signedClient({
    anonKey,
    email: fixture.users.broker.email,
    password: testPassword,
    supabaseUrl
  });

  const checks = [];

  const statusUpdate = await requester
    .from("service_requests")
    .update({
      published_at: new Date().toISOString(),
      status: "open"
    })
    .eq("id", fixture.mutation.requests.freight.id)
    .select("id,status");
  checks.push({
    label: "requester-direct-service-request-status-update",
    ok: blockedByRls(statusUpdate),
    reason: statusUpdate.error?.message ?? `rows=${Array.isArray(statusUpdate.data) ? statusUpdate.data.length : "unknown"}`
  });

  const forwarderClearancePreference = await forwarder
    .from("partner_service_preferences")
    .insert({
      company_id: fixture.companies.forwarder.id,
      service_type: "clearance",
      directions: ["import"],
      notification_enabled: true,
      digest_enabled: false
    })
    .select("company_id,service_type");
  checks.push({
    label: "forwarder-cannot-create-clearance-preference",
    ok: blockedByRls(forwarderClearancePreference),
    reason: forwarderClearancePreference.error?.message ?? `rows=${Array.isArray(forwarderClearancePreference.data) ? forwarderClearancePreference.data.length : "unknown"}`
  });

  const brokerFreightPreference = await broker
    .from("partner_service_preferences")
    .insert({
      company_id: fixture.companies.broker.id,
      service_type: "freight",
      directions: ["export"],
      notification_enabled: true,
      digest_enabled: false
    })
    .select("company_id,service_type");
  checks.push({
    label: "broker-cannot-create-freight-preference",
    ok: blockedByRls(brokerFreightPreference),
    reason: brokerFreightPreference.error?.message ?? `rows=${Array.isArray(brokerFreightPreference.data) ? brokerFreightPreference.data.length : "unknown"}`
  });

  const requesterNotificationRead = await requester
    .from("marketplace_notification_deliveries")
    .select("id,partner_company_id")
    .eq("id", fixture.notification.delivery.id);
  checks.push({
    label: "requester-cannot-read-partner-notification-delivery",
    ok: blockedByRls(requesterNotificationRead),
    reason: requesterNotificationRead.error?.message ?? `rows=${Array.isArray(requesterNotificationRead.data) ? requesterNotificationRead.data.length : "unknown"}`
  });

  const authenticatedClaim = await requester.rpc("claim_marketplace_notification_delivery", {
    p_channel: "in_app",
    p_delivery_window: "p254-negative",
    p_match_id: fixture.requests.freight.id,
    p_metadata: {},
    p_notification_kind: "initial",
    p_reason: "P254 negative check"
  });
  checks.push({
    label: "authenticated-cannot-claim-marketplace-notification-delivery",
    ok: Boolean(authenticatedClaim.error),
    reason: authenticatedClaim.error?.message ?? "rpc returned without error"
  });

  await cleanupUnexpectedPreferenceRows(serviceRoleClient);
  return checks;
}

async function main() {
  const localEnv = await loadEnvFile();
  const supabaseUrl = envValue(localEnv, "SUPABASE_URL") || envValue(localEnv, "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = envValue(localEnv, "SUPABASE_ANON_KEY") || envValue(localEnv, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = envValue(localEnv, "SUPABASE_SERVICE_ROLE_KEY");
  const testPassword = envValue(localEnv, "E2E_TEST_PASSWORD");

  console.log("Marketplace DB/RLS negative checks");
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log("secretValues=not-printed");

  assert(
    isLocalOrAllowedRemoteUrl(supabaseUrl, scope),
    `local Supabase 또는 명시적으로 허용된 remote Supabase에서만 marketplace RLS negative checks를 실행할 수 있습니다. current=${safeOrigin(supabaseUrl)}. ${remoteE2ERequirement(scope)}`
  );
  assert(anonKey, "SUPABASE_ANON_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 필요합니다.");
  assert(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  assert(testPassword, "E2E_TEST_PASSWORD가 필요합니다.");

  const checks = await runNegativeChecks({
    anonKey,
    serviceRoleKey,
    supabaseUrl,
    testPassword
  });

  for (const check of checks) {
    console.log(`${check.ok ? "ok" : "fail"} ${check.label} reason=${JSON.stringify(check.reason)}`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    console.log(`result=blocked failed=${failed.length}`);
    process.exitCode = 1;
    return;
  }

  console.log(`result=ok checks=${checks.length}`);
}

try {
  await main();
} catch (error) {
  console.error("Marketplace DB/RLS negative checks failed");
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  if (error instanceof Error && "details" in error) {
    console.error(`details=${JSON.stringify(error.details)}`);
  }
  process.exitCode = 1;
}
