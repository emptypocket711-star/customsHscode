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
const notificationDisabledPublishDraft = {
  id: "75000000-0000-4000-8000-000000000404"
};
const expiredFreightBidRequest = {
  id: "75000000-0000-4000-8000-000000000405"
};
const auditSnapshotFreightBidRequest = {
  id: "75000000-0000-4000-8000-000000000406"
};
const notificationIdempotencyRequest = {
  id: "75000000-0000-4000-8000-000000000407"
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

function freightBidInput(requestId) {
  const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    p_carrier_note: "P262 guard check",
    p_currency: "KRW",
    p_free_time_note: "P262",
    p_freight_rate_amount: 100000,
    p_lead_time_days: 2,
    p_local_charge_amount: 50000,
    p_message: "P262 direct RPC guard check",
    p_request_id: requestId,
    p_surcharge_amount: 10000,
    p_total_amount: 160000,
    p_transit_time_days: 3,
    p_valid_until: validUntil
  };
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

async function cleanupWrongBidDetailRows(serviceRoleClient) {
  await serviceRoleClient
    .from("clearance_bid_details")
    .delete()
    .eq("bid_id", fixture.bids.freight.id);

  await serviceRoleClient
    .from("freight_bid_details")
    .delete()
    .eq("bid_id", fixture.bids.clearance.id);
}

async function cleanupInvalidPublishDraft(serviceRoleClient) {
  await serviceRoleClient
    .from("service_requests")
    .delete()
    .in("id", [
      invalidPublishDraft.id,
      blockedCompanyPublishDraft.id,
      zeroMatchPublishDraft.id,
      notificationDisabledPublishDraft.id,
      expiredFreightBidRequest.id,
      auditSnapshotFreightBidRequest.id,
      notificationIdempotencyRequest.id
    ]);

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

async function restoreForwarderFreightPreference(serviceRoleClient) {
  const { error } = await serviceRoleClient
    .from("partner_service_preferences")
    .update({
      cargo_tags: ["general"],
      notification_enabled: true
    })
    .eq("company_id", fixture.companies.forwarder.id)
    .eq("service_type", "freight");

  if (error) throw new Error(`forwarder freight preference restore failed: ${error.message}`);
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

async function seedNotificationDisabledPublishDraft(serviceRoleClient) {
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

  if (companyError) throw new Error(`requester company notification-disabled setup failed: ${companyError.message}`);

  const { error: preferenceError } = await serviceRoleClient
    .from("partner_service_preferences")
    .update({
      cargo_tags: [],
      notification_enabled: false
    })
    .eq("company_id", fixture.companies.forwarder.id)
    .eq("service_type", "freight");

  if (preferenceError) throw new Error(`forwarder notification-disabled setup failed: ${preferenceError.message}`);

  const { error: requestError } = await serviceRoleClient
    .from("service_requests")
    .insert({
      created_at: now,
      created_by: profile.id,
      deadline_at: null,
      destination_country_code: "KR",
      direction: "import",
      id: notificationDisabledPublishDraft.id,
      missing_information: [],
      origin_country_code: "CN",
      product_summary: "P261 notification-disabled match draft",
      requester_company_id: profile.company_id,
      request_type: "freight",
      source_lookup_snapshot: {
        generatedAt: now,
        source: "p261 notification preference contract check"
      },
      status: "draft",
      title: "P261 알림 비활성 파트너 운송 요청",
      updated_at: now,
      visibility: "matched_partners"
    });

  if (requestError) throw new Error(`notification-disabled service_request insert failed: ${requestError.message}`);

  const { error: detailError } = await serviceRoleClient
    .from("freight_request_details")
    .insert({
      destination_port: "KRPUS",
      hazardous: false,
      origin_port: "CNSHA",
      request_id: notificationDisabledPublishDraft.id,
      temperature_controlled: false,
      transport_mode: "sea",
      used_car: false
    });

  if (detailError) throw new Error(`notification-disabled freight detail insert failed: ${detailError.message}`);
}

async function seedExpiredFreightBidRequest(serviceRoleClient) {
  const profile = await requesterProfile(serviceRoleClient);
  const now = new Date().toISOString();
  const expiredAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { error: requestError } = await serviceRoleClient
    .from("service_requests")
    .insert({
      created_at: now,
      created_by: profile.id,
      deadline_at: expiredAt,
      destination_country_code: "KR",
      direction: "import",
      id: expiredFreightBidRequest.id,
      missing_information: [],
      origin_country_code: "CN",
      product_summary: "P262 expired freight bid request",
      requester_company_id: profile.company_id,
      request_type: "freight",
      source_lookup_snapshot: {
        generatedAt: now,
        source: "p262 freight bid guard check"
      },
      status: "open",
      title: "P262 마감 지난 운송 요청",
      updated_at: now,
      visibility: "matched_partners"
    });

  if (requestError) throw new Error(`expired freight request insert failed: ${requestError.message}`);

  const { error: detailError } = await serviceRoleClient
    .from("freight_request_details")
    .insert({
      destination_port: "KRPUS",
      hazardous: false,
      origin_port: "CNSHA",
      request_id: expiredFreightBidRequest.id,
      temperature_controlled: false,
      transport_mode: "sea",
      used_car: false
    });

  if (detailError) throw new Error(`expired freight detail insert failed: ${detailError.message}`);
}

async function seedAuditSnapshotFreightBidRequest(serviceRoleClient) {
  const profile = await requesterProfile(serviceRoleClient);
  const now = new Date().toISOString();
  const deadlineAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: requestError } = await serviceRoleClient
    .from("service_requests")
    .insert({
      created_at: now,
      created_by: profile.id,
      deadline_at: deadlineAt,
      destination_country_code: "KR",
      direction: "import",
      id: auditSnapshotFreightBidRequest.id,
      missing_information: [],
      origin_country_code: "CN",
      product_summary: "P265 audit snapshot freight bid request",
      requester_company_id: profile.company_id,
      request_type: "freight",
      source_lookup_snapshot: {
        generatedAt: now,
        source: "p265 bid audit snapshot check"
      },
      status: "open",
      title: "P265 견적 감사 스냅샷 운송 요청",
      updated_at: now,
      visibility: "matched_partners"
    });

  if (requestError) throw new Error(`audit snapshot freight request insert failed: ${requestError.message}`);

  const { error: detailError } = await serviceRoleClient
    .from("freight_request_details")
    .insert({
      destination_port: "KRPUS",
      hazardous: false,
      origin_port: "CNSHA",
      request_id: auditSnapshotFreightBidRequest.id,
      temperature_controlled: false,
      transport_mode: "sea",
      used_car: false
    });

  if (detailError) throw new Error(`audit snapshot freight detail insert failed: ${detailError.message}`);

  const { error: matchError } = await serviceRoleClient
    .from("service_request_partner_matches")
    .insert({
      interest_status: "none",
      match_reason: {
        source: "p265 audit snapshot check"
      },
      matched_by: "preference",
      notification_status: "skipped",
      partner_company_id: fixture.companies.forwarder.id,
      request_id: auditSnapshotFreightBidRequest.id
    });

  if (matchError) throw new Error(`audit snapshot freight match insert failed: ${matchError.message}`);
}

async function seedNotificationIdempotencyRequest(serviceRoleClient) {
  const profile = await requesterProfile(serviceRoleClient);
  const now = new Date().toISOString();
  const deadlineAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  const { error: requestError } = await serviceRoleClient
    .from("service_requests")
    .insert({
      created_at: now,
      created_by: profile.id,
      deadline_at: deadlineAt,
      destination_country_code: "KR",
      direction: "import",
      id: notificationIdempotencyRequest.id,
      missing_information: [],
      origin_country_code: "CN",
      product_summary: "P266 notification idempotency request",
      requester_company_id: profile.company_id,
      request_type: "freight",
      source_lookup_snapshot: {
        generatedAt: now,
        source: "p266 notification idempotency check"
      },
      status: "open",
      title: "P266 알림 중복 방지 요청",
      updated_at: now,
      visibility: "matched_partners"
    });

  if (requestError) throw new Error(`notification idempotency request insert failed: ${requestError.message}`);

  const { error: matchError } = await serviceRoleClient
    .from("service_request_partner_matches")
    .insert({
      interest_status: "none",
      match_reason: {
        source: "p266 notification idempotency check"
      },
      matched_by: "preference",
      notification_status: "pending",
      partner_company_id: fixture.companies.forwarder.id,
      request_id: notificationIdempotencyRequest.id
    });

  if (matchError) throw new Error(`notification idempotency match insert failed: ${matchError.message}`);
}

async function runNegativeChecks({ anonKey, serviceRoleKey, supabaseUrl, testPassword }) {
  const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  await cleanupUnexpectedPreferenceRows(serviceRoleClient);
  await cleanupWrongBidDetailRows(serviceRoleClient);
  await restoreForwarderFreightPreference(serviceRoleClient);
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

  await seedNotificationDisabledPublishDraft(serviceRoleClient);
  const notificationDisabledPublish = await requester.rpc("publish_freight_request", {
    p_deadline_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    p_request_id: notificationDisabledPublishDraft.id
  });
  const notificationDisabledMatch = await serviceRoleClient
    .from("service_request_partner_matches")
    .select("id,notification_status,partner_company_id")
    .eq("request_id", notificationDisabledPublishDraft.id)
    .eq("partner_company_id", fixture.companies.forwarder.id)
    .single();
  const notificationDisabledForwarderRead = await forwarder
    .from("service_request_partner_matches")
    .select("id,notification_status")
    .eq("request_id", notificationDisabledPublishDraft.id);
  const notificationDisabledClaim = notificationDisabledMatch.data?.id
    ? await serviceRoleClient.rpc("claim_marketplace_notification_delivery", {
      p_channel: "in_app",
      p_delivery_window: "p261-disabled",
      p_match_id: notificationDisabledMatch.data.id,
      p_metadata: {},
      p_notification_kind: "initial",
      p_reason: "P261 disabled notification check"
    })
    : { error: { message: "match missing" } };
  checks.push({
    label: "notification-disabled-partner-still-matched-but-initial-delivery-skipped",
    ok: !notificationDisabledPublish.error
      && notificationDisabledPublish.data?.matched_count === 1
      && notificationDisabledMatch.data?.notification_status === "skipped"
      && Array.isArray(notificationDisabledForwarderRead.data)
      && notificationDisabledForwarderRead.data.some((row) => row.notification_status === "skipped")
      && Boolean(notificationDisabledClaim.error?.message?.includes("최초 알림 대상 상태가 아닙니다")),
    reason: notificationDisabledPublish.error?.message ?? JSON.stringify({
      claimError: notificationDisabledClaim.error?.message ?? null,
      forwarderRows: Array.isArray(notificationDisabledForwarderRead.data) ? notificationDisabledForwarderRead.data.length : null,
      matchedCount: notificationDisabledPublish.data?.matched_count ?? null,
      notificationStatus: notificationDisabledMatch.data?.notification_status ?? null
    })
  });
  await restoreForwarderFreightPreference(serviceRoleClient);

  const freightBidAgainstClearance = await forwarder.rpc("submit_freight_bid", freightBidInput(fixture.requests.clearance.id));
  checks.push({
    label: "forwarder-cannot-submit-freight-bid-to-clearance-request",
    ok: Boolean(freightBidAgainstClearance.error?.message?.includes("운송 견적 요청을 찾을 수 없습니다")),
    reason: freightBidAgainstClearance.error?.message ?? "rpc returned without error"
  });

  await seedExpiredFreightBidRequest(serviceRoleClient);
  const expiredFreightBid = await forwarder.rpc("submit_freight_bid", freightBidInput(expiredFreightBidRequest.id));
  const expiredFreightBidRows = await serviceRoleClient
    .from("service_bids")
    .select("id", { count: "exact", head: true })
    .eq("request_id", expiredFreightBidRequest.id);
  checks.push({
    label: "forwarder-cannot-submit-freight-bid-after-deadline",
    ok: Boolean(expiredFreightBid.error?.message?.includes("견적 제출 마감 시간이 지났습니다"))
      && expiredFreightBidRows.count === 0,
    reason: expiredFreightBid.error?.message ?? `bidRows=${expiredFreightBidRows.count ?? "unknown"}`
  });

  const invalidFreightBidRequestId = fixture.mutation.requests.freight.id;
  const invalidCurrencyBid = await forwarder.rpc("submit_freight_bid", {
    ...freightBidInput(invalidFreightBidRequestId),
    p_currency: "KR"
  });
  const zeroTotalBid = await forwarder.rpc("submit_freight_bid", {
    ...freightBidInput(invalidFreightBidRequestId),
    p_total_amount: 0
  });
  const negativeDetailAmountBid = await forwarder.rpc("submit_freight_bid", {
    ...freightBidInput(invalidFreightBidRequestId),
    p_freight_rate_amount: -1
  });
  const invalidLeadTimeBid = await forwarder.rpc("submit_freight_bid", {
    ...freightBidInput(invalidFreightBidRequestId),
    p_lead_time_days: 0
  });
  const pastValidUntilBid = await forwarder.rpc("submit_freight_bid", {
    ...freightBidInput(invalidFreightBidRequestId),
    p_valid_until: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });
  const invalidValueBidRows = await serviceRoleClient
    .from("service_bids")
    .select("id", { count: "exact", head: true })
    .eq("request_id", invalidFreightBidRequestId)
    .eq("bidder_company_id", fixture.companies.forwarder.id);
  checks.push({
    label: "freight-bid-sql-value-constraints-block-invalid-inputs",
    ok: Boolean(invalidCurrencyBid.error?.message?.includes("통화 코드는 3자리 코드로 입력해 주세요"))
      && Boolean(zeroTotalBid.error?.message?.includes("견적 총액을 입력해야 합니다"))
      && Boolean(negativeDetailAmountBid.error?.message?.includes("견적 상세 금액은 0보다 커야 합니다"))
      && Boolean(invalidLeadTimeBid.error?.message?.includes("리드타임과 운송일수는 1일 이상이어야 합니다"))
      && Boolean(pastValidUntilBid.error?.message?.includes("견적 유효기한은 오늘 이후여야 합니다"))
      && invalidValueBidRows.count === 0,
    reason: JSON.stringify({
      bidRows: invalidValueBidRows.count,
      currency: invalidCurrencyBid.error?.message ?? null,
      detailAmount: negativeDetailAmountBid.error?.message ?? null,
      leadTime: invalidLeadTimeBid.error?.message ?? null,
      total: zeroTotalBid.error?.message ?? null,
      validUntil: pastValidUntilBid.error?.message ?? null
    })
  });

  await cleanupWrongBidDetailRows(serviceRoleClient);
  const clearanceDetailOnFreightBid = await serviceRoleClient
    .from("clearance_bid_details")
    .insert({
      bid_id: fixture.bids.freight.id,
      brokerage_fee_amount: 1,
      expected_clearance_days: 1,
      review_available: true
    })
    .select("bid_id");
  const freightDetailOnClearanceBid = await serviceRoleClient
    .from("freight_bid_details")
    .insert({
      bid_id: fixture.bids.clearance.id,
      freight_rate_amount: 1,
      transit_time_days: 1
    })
    .select("bid_id");
  const wrongClearanceRows = await serviceRoleClient
    .from("clearance_bid_details")
    .select("bid_id", { count: "exact", head: true })
    .eq("bid_id", fixture.bids.freight.id);
  const wrongFreightRows = await serviceRoleClient
    .from("freight_bid_details")
    .select("bid_id", { count: "exact", head: true })
    .eq("bid_id", fixture.bids.clearance.id);
  checks.push({
    label: "service-role-cannot-attach-bid-details-to-wrong-bid-type",
    ok: Boolean(clearanceDetailOnFreightBid.error?.message?.includes("통관 견적 상세는 통관 견적에만 연결할 수 있습니다"))
      && Boolean(freightDetailOnClearanceBid.error?.message?.includes("운송 견적 상세는 운송 견적에만 연결할 수 있습니다"))
      && wrongClearanceRows.count === 0
      && wrongFreightRows.count === 0,
    reason: JSON.stringify({
      clearanceOnFreight: clearanceDetailOnFreightBid.error?.message ?? null,
      clearanceRows: wrongClearanceRows.count,
      freightOnClearance: freightDetailOnClearanceBid.error?.message ?? null,
      freightRows: wrongFreightRows.count
    })
  });
  await cleanupWrongBidDetailRows(serviceRoleClient);

  await seedAuditSnapshotFreightBidRequest(serviceRoleClient);
  const auditSnapshotBid = await forwarder.rpc(
    "submit_freight_bid",
    freightBidInput(auditSnapshotFreightBidRequest.id)
  );
  const auditSnapshotBidId = typeof auditSnapshotBid.data?.bid_id === "string"
    ? auditSnapshotBid.data.bid_id
    : null;
  const auditSnapshotRow = auditSnapshotBidId
    ? await serviceRoleClient
      .from("audit_logs")
      .select("after_json")
      .eq("action", "freight_bid_submitted")
      .eq("target_id", auditSnapshotBidId)
      .order("created_at", { ascending: false })
      .limit(1)
    : { data: null, error: { message: "bid missing" } };
  const auditSnapshotAfterJson = Array.isArray(auditSnapshotRow.data)
    ? auditSnapshotRow.data[0]?.after_json
    : null;
  const submissionSnapshot = auditSnapshotAfterJson?.submission_snapshot;
  checks.push({
    label: "freight-bid-submission-audit-includes-structured-summary",
    ok: !auditSnapshotBid.error
      && submissionSnapshot?.schema_version === 1
      && submissionSnapshot?.request_id === auditSnapshotFreightBidRequest.id
      && submissionSnapshot?.bid_type === "freight"
      && submissionSnapshot?.currency === "KRW"
      && submissionSnapshot?.total_amount === 160000
      && submissionSnapshot?.detail_summary?.freight_rate_amount === 100000
      && submissionSnapshot?.detail_summary?.transit_time_days === 3
      && !("message" in submissionSnapshot)
      && !("free_time_note" in submissionSnapshot)
      && !("carrier_note" in submissionSnapshot),
    reason: auditSnapshotBid.error?.message ?? JSON.stringify({
      bidId: auditSnapshotBidId,
      snapshot: submissionSnapshot ?? null
    })
  });

  await seedNotificationIdempotencyRequest(serviceRoleClient);
  const notificationIdempotencyMatch = await serviceRoleClient
    .from("service_request_partner_matches")
    .select("id")
    .eq("request_id", notificationIdempotencyRequest.id)
    .eq("partner_company_id", fixture.companies.forwarder.id)
    .single();
  const notificationIdempotencyMatchId = notificationIdempotencyMatch.data?.id;
  const firstInitialClaim = notificationIdempotencyMatchId
    ? await serviceRoleClient.rpc("claim_marketplace_notification_delivery", {
      p_channel: "in_app",
      p_delivery_window: "p266-initial",
      p_match_id: notificationIdempotencyMatchId,
      p_metadata: { matchCount: 1 },
      p_notification_kind: "initial",
      p_reason: "P266 initial claim"
    })
    : { data: null, error: { message: "match missing" } };
  const duplicateInitialClaim = notificationIdempotencyMatchId
    ? await serviceRoleClient.rpc("claim_marketplace_notification_delivery", {
      p_channel: "in_app",
      p_delivery_window: "p266-initial",
      p_match_id: notificationIdempotencyMatchId,
      p_metadata: { matchCount: 1 },
      p_notification_kind: "initial",
      p_reason: "P266 duplicate initial claim"
    })
    : { data: null, error: { message: "match missing" } };
  if (notificationIdempotencyMatchId) {
    await serviceRoleClient
      .from("service_request_partner_matches")
      .update({ interest_status: "viewed" })
      .eq("id", notificationIdempotencyMatchId);
  }
  const firstReminderClaim = notificationIdempotencyMatchId
    ? await serviceRoleClient.rpc("claim_marketplace_notification_delivery", {
      p_channel: "in_app",
      p_delivery_window: notificationIdempotencyRequest.id,
      p_match_id: notificationIdempotencyMatchId,
      p_metadata: { matchCount: 1 },
      p_notification_kind: "deadline_reminder",
      p_reason: "P266 reminder claim"
    })
    : { data: null, error: { message: "match missing" } };
  const duplicateReminderClaim = notificationIdempotencyMatchId
    ? await serviceRoleClient.rpc("claim_marketplace_notification_delivery", {
      p_channel: "in_app",
      p_delivery_window: notificationIdempotencyRequest.id,
      p_match_id: notificationIdempotencyMatchId,
      p_metadata: { matchCount: 1 },
      p_notification_kind: "deadline_reminder",
      p_reason: "P266 duplicate reminder claim"
    })
    : { data: null, error: { message: "match missing" } };
  const notificationDeliveryRows = await serviceRoleClient
    .from("marketplace_notification_deliveries")
    .select("notification_kind")
    .eq("request_id", notificationIdempotencyRequest.id);
  const notificationKinds = Array.isArray(notificationDeliveryRows.data)
    ? notificationDeliveryRows.data.map((row) => row.notification_kind).sort()
    : [];
  checks.push({
    label: "marketplace-notification-claims-are-idempotent-per-kind",
    ok: typeof firstInitialClaim.data === "string"
      && Boolean(duplicateInitialClaim.error?.message?.includes("최초 알림 대상 상태가 아닙니다"))
      && typeof firstReminderClaim.data === "string"
      && duplicateReminderClaim.data === null
      && notificationKinds.length === 2
      && notificationKinds[0] === "deadline_reminder"
      && notificationKinds[1] === "initial",
    reason: JSON.stringify({
      deliveries: notificationKinds,
      duplicateInitial: duplicateInitialClaim.error?.message ?? duplicateInitialClaim.data,
      duplicateReminder: duplicateReminderClaim.error?.message ?? duplicateReminderClaim.data,
      firstInitial: firstInitialClaim.error?.message ?? firstInitialClaim.data,
      firstReminder: firstReminderClaim.error?.message ?? firstReminderClaim.data
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

  const requesterProfileEscalation = await requester
    .from("profiles")
    .update({
      company_id: fixture.companies.forwarder.id,
      company_role: "admin",
      role: "developer"
    })
    .eq("id", fixture.users.requester.id)
    .select("id,company_id,company_role,role");
  checks.push({
    label: "requester-cannot-self-escalate-profile-privilege-fields",
    ok: blockedByRls(requesterProfileEscalation),
    reason: requesterProfileEscalation.error?.message ?? `rows=${Array.isArray(requesterProfileEscalation.data) ? requesterProfileEscalation.data.length : "unknown"}`
  });

  const requesterAsRoleReviewer = await serviceRoleClient.rpc("review_company_party_type_request", {
    p_actor_id: fixture.users.requester.id,
    p_decision: "approved",
    p_request_id: fixture.requests.freight.id,
    p_review_note: "P271 negative check"
  });
  checks.push({
    label: "service-role-role-review-rejects-non-developer-actor",
    ok: Boolean(requesterAsRoleReviewer.error?.message?.includes("개발자 권한 검토자만 플랫폼 역할 신청을 검토할 수 있습니다")),
    reason: requesterAsRoleReviewer.error?.message ?? "rpc returned without error"
  });

  await cleanupUnexpectedPreferenceRows(serviceRoleClient);
  await cleanupWrongBidDetailRows(serviceRoleClient);
  await restoreForwarderFreightPreference(serviceRoleClient);
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
