#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import {
  fetchWithTimeout,
  isLocalUrl,
  loadEnvFile,
  mergedEnv,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";
import { marketplaceTransactionFixture as fixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.env.E2E_BASE_URL || process.env.OPERATIONS_BASE_URL || "http://127.0.0.1:3100";
const timeoutMs = Number(process.env.E2E_READINESS_TIMEOUT_MS || 5000);
const partnerProfileFixtures = [
  {
    companyId: fixture.companies.forwarder.id,
    email: fixture.users.forwarder.email,
    notificationKind: "initial"
  },
  {
    companyId: fixture.companies.broker.id,
    email: fixture.users.broker.email,
    notificationKind: "deadline_reminder"
  }
];

function assert(condition, message) {
  if (condition) return;
  throw new Error(message);
}

async function getPartnerProfiles(client) {
  const { data, error } = await client
    .from("profiles")
    .select("id,email,company_id")
    .in("email", partnerProfileFixtures.map((profile) => profile.email));

  if (error) throw new Error(`profile lookup failed: ${error.message}`);

  return partnerProfileFixtures.map((fixtureProfile) => {
    const profile = (data ?? []).find((row) => row.email === fixtureProfile.email);
    assert(profile?.id, `fixture profile was not found. email=${fixtureProfile.email}`);
    assert(
      profile.company_id === fixtureProfile.companyId,
      `fixture profile company mismatch. email=${fixtureProfile.email}`
    );

    return {
      ...fixtureProfile,
      profileId: profile.id
    };
  });
}

async function deletePreferenceRows(client, partnerProfiles) {
  const { error } = await client
    .from("marketplace_notification_preferences")
    .delete()
    .in("profile_id", partnerProfiles.map((profile) => profile.profileId))
    .eq("channel", "email");

  if (error) throw new Error(`preference cleanup failed: ${error.message}`);
}

async function upsertPreferenceRows(client, partnerProfiles) {
  const now = new Date().toISOString();
  const rows = partnerProfiles.flatMap((profile) => [
    {
      channel: "email",
      enabled: profile.notificationKind === "initial",
      notification_kind: "initial",
      profile_id: profile.profileId,
      updated_at: now
    },
    {
      channel: "email",
      enabled: profile.notificationKind === "deadline_reminder",
      notification_kind: "deadline_reminder",
      profile_id: profile.profileId,
      updated_at: now
    }
  ]);
  const { error } = await client
    .from("marketplace_notification_preferences")
    .upsert(rows, {
      onConflict: "profile_id,channel,notification_kind"
    });

  if (error) throw new Error(`preference upsert failed: ${error.message}`);
}

async function listOptedInEmails(client, partnerCompanyId, notificationKind) {
  const { data: profiles, error: profileError } = await client
    .from("profiles")
    .select("id,email,company_id,company_role,role,onboarding_completed_at")
    .eq("company_id", partnerCompanyId)
    .eq("role", "client")
    .not("email", "is", null)
    .not("onboarding_completed_at", "is", null)
    .order("company_role", { ascending: true })
    .order("email", { ascending: true })
    .limit(25);

  if (profileError) throw new Error(`profile query failed: ${profileError.message}`);

  const profileRows = profiles ?? [];
  const profileIds = profileRows.map((profile) => profile.id);
  if (!profileIds.length) return [];

  const { data: preferences, error: preferenceError } = await client
    .from("marketplace_notification_preferences")
    .select("profile_id,channel,notification_kind,enabled")
    .in("profile_id", profileIds)
    .eq("channel", "email")
    .eq("notification_kind", notificationKind)
    .eq("enabled", true);

  if (preferenceError) throw new Error(`preference query failed: ${preferenceError.message}`);

  const enabledProfileIds = new Set((preferences ?? []).map((preference) => preference.profile_id));
  return profileRows
    .filter((profile) => enabledProfileIds.has(profile.id))
    .map((profile) => profile.email);
}

async function fetchJob(pathAndQuery) {
  const response = await fetch(new URL(pathAndQuery, baseUrl), {
    headers: {
      "User-Agent": "hsfinder-marketplace-email-opt-in-rehearsal/1.0"
    }
  });
  const body = await response.json().catch(() => null);

  return {
    body,
    ok: response.ok,
    status: response.status
  };
}

async function main() {
  const fileEnv = await loadEnvFile();
  const env = mergedEnv(fileEnv);
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const failures = [];

  if (!isLocalUrl(baseUrl)) failures.push(`E2E_BASE_URL/OPERATIONS_BASE_URL must be local. origin=${safeOrigin(baseUrl)}`);
  if (!isLocalUrl(supabaseUrl)) failures.push(`SUPABASE_URL must be local. origin=${safeOrigin(supabaseUrl)}`);
  if (!serviceRoleKey) failures.push("SUPABASE_SERVICE_ROLE_KEY is missing.");

  if (isLocalUrl(baseUrl)) {
    const loginReachable = await fetchWithTimeout(new URL("/login", baseUrl).toString(), timeoutMs);
    if (!loginReachable.ok) failures.push("local Next.js /login is not reachable.");
  }

  console.log("Marketplace email opt-in local rehearsal");
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

  const partnerProfiles = await getPartnerProfiles(client);

  await deletePreferenceRows(client, partnerProfiles);

  const forwarderBefore = await listOptedInEmails(client, fixture.companies.forwarder.id, "initial");
  assert(forwarderBefore.length === 0, "forwarder should have no opted-in initial email before seed.");

  await upsertPreferenceRows(client, partnerProfiles);

  const forwarderInitial = await listOptedInEmails(client, fixture.companies.forwarder.id, "initial");
  const forwarderReminder = await listOptedInEmails(client, fixture.companies.forwarder.id, "deadline_reminder");
  const brokerInitial = await listOptedInEmails(client, fixture.companies.broker.id, "initial");
  const brokerReminder = await listOptedInEmails(client, fixture.companies.broker.id, "deadline_reminder");

  assert(forwarderInitial.includes(fixture.users.forwarder.email), "forwarder initial opt-in recipient was not found.");
  assert(forwarderReminder.length === 0, "forwarder deadline reminder should remain opted out.");
  assert(brokerInitial.length === 0, "broker initial should remain opted out.");
  assert(brokerReminder.includes(fixture.users.broker.email), "broker reminder opt-in recipient was not found.");

  const blockedSend = await fetchJob("/api/jobs/marketplace-notifications?dryRun=1&send=1&limit=20");
  assert(blockedSend.status === 400, "send=1 should stay blocked without production send readiness.");
  assert(blockedSend.body?.sendReadiness?.ready === false, "blocked send should include readiness=false.");

  console.log(`forwarderInitialRecipients=${forwarderInitial.length}`);
  console.log(`brokerReminderRecipients=${brokerReminder.length}`);
  console.log("routeSendStillBlocked=true");
  console.log("result=ok");
}

try {
  await main();
} catch (error) {
  console.error("Marketplace email opt-in local rehearsal failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
