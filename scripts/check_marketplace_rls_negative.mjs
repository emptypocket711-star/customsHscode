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
const noCompanyUser = {
  email: "marketplace-rls-no-company@example.test",
  fullName: "marketplace rls no company"
};
const invalidPublishDraft = {
  id: "75000000-0000-4000-8000-000000000401"
};
const blockedCompanyPublishDraft = {
  id: "75000000-0000-4000-8000-000000000402"
};
const zeroMatchPublishDraft = {
  id: "75000000-0000-4000-8000-000000000403"
};

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

async function cleanupInvalidPublishDraft(serviceRoleClient) {
  await serviceRoleClient
    .from("service_requests")
    .delete()
    .in("id", [invalidPublishDraft.id, blockedCompanyPublishDraft.id, zeroMatchPublishDraft.id]);

  await serviceRoleClient
    .from("companies")
    .update({
      blocked_at: null,
      suspended_at: null,
      verification_status: "email_verified",
      verified_at: null
    })
    .eq("id", fixture.companies.requester.id);
}

async function requesterProfile(serviceRoleClient) {
  const { data, error } = await serviceRoleClient
    .from("profiles")
    .select("id,company_id")
    .eq("email", fixture.users.requester.email)
    .single();

  if (error) throw new Error(`requester profile lookup failed: ${error.message}`);
  if (!data?.company_id) throw new Error("requester profile company_id missing");
  return data;
}

async function findUserByEmail(client, email) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth user list failed: ${error.message}`);

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureNoCompanyUser(client, testPassword) {
  const existing = await findUserByEmail(client, noCompanyUser.email);
  const user = existing
    ? await client.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password: testPassword,
      user_metadata: {
        full_name: noCompanyUser.fullName
      }
    })
    : await client.auth.admin.createUser({
      email: noCompanyUser.email,
      email_confirm: true,
      password: testPassword,
      user_metadata: {
        full_name: noCompanyUser.fullName
      }
    });

  if (user.error) throw new Error(`auth no-company user prepare failed: ${user.error.message}`);

  const { error } = await client
    .from("profiles")
    .upsert({
      company_id: null,
      company_role: "member",
      email: noCompanyUser.email,
      full_name: noCompanyUser.fullName,
      id: user.data.user.id,
      preferred_locale: "ko-KR",
      role: "client"
    }, { onConflict: "id" });

  if (error) throw new Error(`no-company profile prepare failed: ${error.message}`);
  return user.data.user;
}

async function seedInvalidPublishDraft(serviceRoleClient) {
  const profile = await requesterProfile(serviceRoleClient);

  await cleanupInvalidPublishDraft(serviceRoleClient);

  const { error: companyError } = await serviceRoleClient
    .from("companies")
    .update({
      verification_status: "operator_approved",
      verified_at: new Date().toISOString()
    })
    .eq("id", profile.company_id);

  if (companyError) throw new Error(`requester company publish validation setup failed: ${companyError.message}`);

  const now = new Date().toISOString();
  const { error: requestError } = await serviceRoleClient
    .from("service_requests")
    .insert({
      created_at: now,
      created_by: profile.id,
      deadline_at: null,
      destination_country_code: "KR",
      direction: "import",
      id: invalidPublishDraft.id,
      missing_information: [],
      origin_country_code: null,
      product_summary: "P258 invalid publish draft",
      requester_company_id: profile.company_id,
      request_type: "freight",
      source_lookup_snapshot: {
        generatedAt: now,
        source: "p258 negative check"
      },
      status: "draft",
      title: "P258 필수값 누락 운송 요청",
      updated_at: now,
      visibility: "matched_partners"
    });

  if (requestError) throw new Error(`invalid publish service_request insert failed: ${requestError.message}`);

  const { error: detailError } = await serviceRoleClient
    .from("freight_request_details")
    .insert({
      destination_port: "KRPUS",
      hazardous: false,
      origin_port: "CNSHA",
      request_id: invalidPublishDraft.id,
      temperature_controlled: false,
      transport_mode: null,
      used_car: false
    });

  if (detailError) throw new Error(`invalid publish freight detail insert failed: ${detailError.message}`);
}

async function seedBlockedCompanyPublishDraft(serviceRoleClient) {
  const profile = await requesterProfile(serviceRoleClient);
  const now = new Date().toISOString();

  const { error: companyError } = await serviceRoleClient
    .from("companies")
    .update({
      blocked_at: now,
      verification_status: "blocked",
      verified_at: null
    })
    .eq("id", profile.company_id);

  if (companyError) throw new Error(`requester company blocked setup failed: ${companyError.message}`);

  const { error: requestError } = await serviceRoleClient
    .from("service_requests")
    .insert({
      created_at: now,
      created_by: profile.id,
      deadline_at: null,
      destination_country_code: "KR",
      direction: "import",
      id: blockedCompanyPublishDraft.id,
      missing_information: [],
      origin_country_code: "CN",
      product_summary: "P259 blocked company publish draft",
      requester_company_id: profile.company_id,
      request_type: "freight",
      source_lookup_snapshot: {
        generatedAt: now,
        source: "p259 negative check"
      },
      status: "draft",
      title: "P259 차단 회사 운송 요청",
      updated_at: now,
      visibility: "matched_partners"
    });

  if (requestError) throw new Error(`blocked company service_request insert failed: ${requestError.message}`);

  const { error: detailError } = await serviceRoleClient
    .from("freight_request_details")
    .insert({
      destination_port: "KRPUS",
      hazardous: false,
      origin_port: "CNSHA",
      request_id: blockedCompanyPublishDraft.id,
      temperature_controlled: false,
      transport_mode: "sea",
      used_car: false
    });

  if (detailError) throw new Error(`blocked company freight detail insert failed: ${detailError.message}`);
}

async function seedZeroMatchPublishDraft(serviceRoleClient) {
  const profile = await requesterProfile(serviceRoleClient);
  const now = new Date().toISOString();

  const { error: companyError } = await serviceRoleClient
    .from("companies")
    .update({
      blocked_at: null,
      suspended_at: null,
      verification_status: "operator_approved",
      verified_at: now
    })
    .eq("id", profile.company_id);

  if (companyError) throw new Error(`requester company zero-match setup failed: ${companyError.message}`);

  const { error: requestError } = await serviceRoleClient
    .from("service_requests")
    .insert({
      created_at: now,
      created_by: profile.id,
      deadline_at: null,
      destination_country_code: "JP",
      direction: "export",
      id: zeroMatchPublishDraft.id,
      missing_information: [],
      origin_country_code: "KR",
      product_summary: "P260 zero-match publish draft",
      requester_company_id: profile.company_id,
      request_type: "freight",
      source_lookup_snapshot: {
        generatedAt: now,
        source: "p260 zero-match contract check"
      },
      status: "draft",
      title: "P260 파트너 0건 운송 요청",
      updated_at: now,
      visibility: "matched_partners"
    });

  if (requestError) throw new Error(`zero-match service_request insert failed: ${requestError.message}`);

  const { error: detailError } = await serviceRoleClient
    .from("freight_request_details")
    .insert({
      destination_port: "JPTYO",
      hazardous: false,
      origin_port: "KRPUS",
      request_id: zeroMatchPublishDraft.id,
      temperature_controlled: false,
      transport_mode: "sea",
      used_car: false
    });

  if (detailError) throw new Error(`zero-match freight detail insert failed: ${detailError.message}`);
}

async function runNegativeChecks({ anonKey, serviceRoleKey, supabaseUrl, testPassword }) {
  const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  await cleanupUnexpectedPreferenceRows(serviceRoleClient);
  await ensureNoCompanyUser(serviceRoleClient, testPassword);
  await seedInvalidPublishDraft(serviceRoleClient);

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
  const noCompany = await signedClient({
    anonKey,
    email: noCompanyUser.email,
    password: testPassword,
    supabaseUrl
  });

  const checks = [];

  const noCompanyPublish = await noCompany.rpc("publish_freight_request", {
    p_deadline_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    p_request_id: fixture.mutation.requests.freight.id
  });
  checks.push({
    label: "no-company-user-cannot-publish-freight-request",
    ok: Boolean(noCompanyPublish.error?.message?.includes("회사 프로필을 확인할 수 없습니다")),
    reason: noCompanyPublish.error?.message ?? "rpc returned without error"
  });

  const statusUpdate = await requester
    .from("service_requests")
    .update({
      deadline_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      published_at: new Date().toISOString(),
      status: "open",
      title: "P256 direct mutation should be blocked"
    })
    .eq("id", fixture.mutation.requests.freight.id)
    .select("id,status,deadline_at,published_at,title");
  checks.push({
    label: "requester-direct-service-request-workflow-update",
    ok: blockedByRls(statusUpdate),
    reason: statusUpdate.error?.message ?? `rows=${Array.isArray(statusUpdate.data) ? statusUpdate.data.length : "unknown"}`
  });

  const missingFieldPublish = await requester.rpc("publish_freight_request", {
    p_deadline_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    p_request_id: invalidPublishDraft.id
  });
  checks.push({
    label: "publish-freight-requires-origin-destination-transport",
    ok: Boolean(missingFieldPublish.error?.message?.includes("출발 국가, 도착 국가, 운송 방식은 공개 전에 필요합니다")),
    reason: missingFieldPublish.error?.message ?? "rpc returned without error"
  });

  await seedBlockedCompanyPublishDraft(serviceRoleClient);
  const blockedCompanyPublish = await requester.rpc("publish_freight_request", {
    p_deadline_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    p_request_id: blockedCompanyPublishDraft.id
  });
  checks.push({
    label: "blocked-requester-company-cannot-publish-freight-request",
    ok: Boolean(blockedCompanyPublish.error?.message?.includes("정지 또는 차단된 회사는 요청을 공개할 수 없습니다")),
    reason: blockedCompanyPublish.error?.message ?? "rpc returned without error"
  });

  await seedZeroMatchPublishDraft(serviceRoleClient);
  const zeroMatchPublish = await requester.rpc("publish_freight_request", {
    p_deadline_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    p_request_id: zeroMatchPublishDraft.id
  });
  const zeroMatchRequest = await serviceRoleClient
    .from("service_requests")
    .select("id,status,published_at")
    .eq("id", zeroMatchPublishDraft.id)
    .single();
  const zeroMatchRows = await serviceRoleClient
    .from("service_request_partner_matches")
    .select("id", { count: "exact", head: true })
    .eq("request_id", zeroMatchPublishDraft.id);
  const zeroMatchAudit = await serviceRoleClient
    .from("audit_logs")
    .select("after_json")
    .eq("action", "freight_request_published")
    .eq("target_id", zeroMatchPublishDraft.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const zeroMatchAuditAfter = Array.isArray(zeroMatchAudit.data)
    ? zeroMatchAudit.data[0]?.after_json
    : null;
  checks.push({
    label: "zero-match-freight-publish-remains-open-with-audit",
    ok: !zeroMatchPublish.error
      && zeroMatchPublish.data?.matched_count === 0
      && zeroMatchRequest.data?.status === "open"
      && Boolean(zeroMatchRequest.data?.published_at)
      && zeroMatchRows.count === 0
      && zeroMatchAuditAfter?.matched_count === 0,
    reason: zeroMatchPublish.error?.message ?? JSON.stringify({
      auditMatchedCount: zeroMatchAuditAfter?.matched_count ?? null,
      matchedCount: zeroMatchPublish.data?.matched_count ?? null,
      matchRows: zeroMatchRows.count,
      requestStatus: zeroMatchRequest.data?.status ?? null
    })
  });

  const publishedFreightDetailUpdate = await requester
    .from("freight_request_details")
    .update({
      hazardous: true,
      origin_port: "P257",
      transport_mode: "air"
    })
    .eq("request_id", fixture.requests.freight.id)
    .select("request_id,transport_mode,origin_port,hazardous");
  checks.push({
    label: "requester-cannot-update-published-freight-details",
    ok: blockedByRls(publishedFreightDetailUpdate),
    reason: publishedFreightDetailUpdate.error?.message ?? `rows=${Array.isArray(publishedFreightDetailUpdate.data) ? publishedFreightDetailUpdate.data.length : "unknown"}`
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
  await cleanupInvalidPublishDraft(serviceRoleClient);
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
